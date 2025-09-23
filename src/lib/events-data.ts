import { createClient } from '@/lib/supabase/client'

export interface EventWithExperiment {
  id: string
  event_type: string
  event_name: string
  visitor_id: string
  experiment_id: string
  variant?: string
  value?: number
  properties?: Record<string, any>
  created_at: string
  experiments?: {
    id: string
    name: string
  }
}

export async function loadRealEventsData(): Promise<EventWithExperiment[]> {
  const supabase = createClient()

  try {
    // Primeiro buscar eventos
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (eventsError) {
      console.error('Erro ao carregar eventos:', eventsError)
      return []
    }

    if (!eventsData || eventsData.length === 0) {
      console.log('Nenhum evento encontrado')
      return []
    }

    // Buscar experimentos para pegar os nomes
    const experimentIds = [...new Set(eventsData.map(e => e.experiment_id).filter(Boolean))]
    let experimentsMap = new Map()

    if (experimentIds.length > 0) {
      const { data: experimentsData, error: expError } = await supabase
        .from('experiments')
        .select('id, name')
        .in('id', experimentIds)

      if (!expError && experimentsData) {
        experimentsData.forEach(exp => {
          experimentsMap.set(exp.id, exp)
        })
      }
    }

    // Combinar dados
    const eventsWithExperiments = eventsData.map(event => ({
      ...event,
      experiments: experimentsMap.get(event.experiment_id) || { id: event.experiment_id, name: 'Experimento desconhecido' }
    }))

    console.log(`Carregados ${eventsWithExperiments.length} eventos`)
    return eventsWithExperiments

  } catch (error) {
    console.error('Erro ao carregar eventos:', error)
    return []
  }
}

export async function loadRealExportData() {
  const supabase = createClient()

  try {
    // Buscar dados para exportação
    const { data: experimentsData, error: expError } = await supabase
      .from('experiments')
      .select(`
        id, name, status, created_at, ended_at
      `)

    if (expError) throw expError

    // Buscar variantes
    const { data: variantsData, error: varError } = await supabase
      .from('variants')
      .select('*')

    if (varError) throw varError

    // Buscar eventos
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(10000)

    if (eventsError) throw eventsError

    // Combinar dados
    const experimentsWithData = experimentsData?.map(exp => {
      const variants = variantsData?.filter(v => v.experiment_id === exp.id) || []
      const events = eventsData?.filter(e => e.experiment_id === exp.id) || []

      return {
        ...exp,
        variants,
        events
      }
    })

    return experimentsWithData || []

  } catch (error) {
    console.error('Erro ao carregar dados para exportação:', error)
    return []
  }
}

export function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''

  let csv = 'experiment_id,experiment_name,variant_name,event_type,visitor_id,timestamp,value,properties\n'

  data.forEach(exp => {
    exp.events?.forEach((event: any) => {
      const variant = exp.variants?.find((v: any) => event.properties?.variant === v.name)
      csv += `"${exp.id}","${exp.name}","${variant?.name || 'unknown'}","${event.event_type}","${event.visitor_id}","${event.created_at}","${event.value || ''}","${JSON.stringify(event.properties || {})}"\n`
    })
  })

  return csv
}

export function convertToJSON(data: any[]): string {
  return JSON.stringify(data, null, 2)
}