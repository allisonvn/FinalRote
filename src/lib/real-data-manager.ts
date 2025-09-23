import { createClient } from '@/lib/supabase/client'

export async function loadRealEventsWithFallback() {
  const supabase = createClient()

  try {
    // Primeiro tentar carregar eventos existentes
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Erro ao carregar eventos:', error)
      return []
    }

    if (!events || events.length === 0) {
      console.log('Nenhum evento encontrado, criando dados de exemplo...')

      // Verificar se há pelo menos um projeto
      let { data: project } = await supabase
        .from('projects')
        .select('id')
        .limit(1)
        .single()

      if (!project) {
        // Criar projeto exemplo
        const { data: newProject, error: projError } = await supabase
          .from('projects')
          .insert({
            name: 'Site Principal',
            domain: 'localhost:3003',
            api_key: 'demo_' + Math.random().toString(36).slice(2)
          })
          .select('id')
          .single()

        if (projError) {
          console.error('Erro ao criar projeto:', projError)
          return []
        }
        project = newProject
      }

      // Verificar se há pelo menos um experimento
      let { data: experiment } = await supabase
        .from('experiments')
        .select('id')
        .eq('project_id', project.id)
        .limit(1)
        .single()

      if (!experiment) {
        // Criar experimento exemplo
        const { data: newExp, error: expError } = await supabase
          .from('experiments')
          .insert({
            project_id: project.id,
            name: 'Teste do Botão CTA',
            description: 'Teste A/B do botão principal',
            status: 'running',
            algorithm: 'thompson_sampling',
            traffic_allocation: 100
          })
          .select('id')
          .single()

        if (expError) {
          console.error('Erro ao criar experimento:', expError)
          return []
        }
        experiment = newExp

        // Criar variantes
        await supabase.from('variants').insert([
          {
            experiment_id: experiment.id,
            name: 'Controle',
            key: 'control',
            is_control: true,
            weight: 50,
            config: {}
          },
          {
            experiment_id: experiment.id,
            name: 'Botão Verde',
            key: 'green_button',
            is_control: false,
            weight: 50,
            config: { css: [{ selector: '.btn', style: 'background: green;' }] }
          }
        ])
      }

      // Criar eventos de exemplo
      const sampleEvents = []
      const now = new Date()

      for (let i = 0; i < 50; i++) {
        const date = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        const visitorId = 'visitor_' + Math.random().toString(36).slice(2)
        const variant = Math.random() > 0.5 ? 'Controle' : 'Botão Verde'

        sampleEvents.push({
          project_id: project.id,
          experiment_id: experiment.id,
          visitor_id: visitorId,
          event_type: Math.random() > 0.8 ? 'conversion' : Math.random() > 0.6 ? 'click' : 'page_view',
          event_name: 'sample_event',
          properties: { variant },
          value: Math.random() > 0.9 ? Math.floor(Math.random() * 100) + 20 : null,
          created_at: date.toISOString()
        })
      }

      const { error: insertError } = await supabase
        .from('events')
        .insert(sampleEvents)

      if (insertError) {
        console.error('Erro ao inserir eventos exemplo:', insertError)
        return []
      }

      // Recarregar eventos
      const { data: newEvents } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      return newEvents || []
    }

    return events

  } catch (error) {
    console.error('Erro geral ao carregar dados:', error)
    return []
  }
}

export async function loadRealExportData() {
  const supabase = createClient()

  try {
    const { data: experiments, error: expError } = await supabase
      .from('experiments')
      .select(`
        id, name, status, created_at, ended_at,
        variants(id, name, is_control, weight),
        project_id
      `)

    if (expError) throw expError

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(5000)

    if (eventsError) throw eventsError

    // Combinar dados
    const fullData = experiments?.map(exp => ({
      ...exp,
      events: events?.filter(e => e.experiment_id === exp.id) || []
    })) || []

    return fullData

  } catch (error) {
    console.error('Erro ao carregar dados para exportação:', error)
    return []
  }
}

export function generateCSV(data: any[]): string {
  if (!data || data.length === 0) return 'experiment_id,experiment_name,event_type,visitor_id,timestamp,value,variant\n'

  let csv = 'experiment_id,experiment_name,event_type,visitor_id,timestamp,value,variant\n'

  data.forEach(exp => {
    exp.events?.forEach((event: any) => {
      const variant = event.properties?.variant || 'unknown'
      csv += `"${exp.id}","${exp.name}","${event.event_type}","${event.visitor_id}","${event.created_at}","${event.value || ''}","${variant}"\n`
    })
  })

  return csv
}

export function generateJSON(data: any[]): string {
  return JSON.stringify(data, null, 2)
}