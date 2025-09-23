import { createClient } from '@/lib/supabase/client'

export interface RealEvent {
  id: string
  event_type: string
  event_name: string
  visitor_id: string
  experiment_id: string
  value?: number
  properties?: Record<string, any>
  created_at: string
  project_id: string
}

export interface RealExperiment {
  id: string
  name: string
  key: string
  status: string
  algorithm: string
  traffic_allocation: number
  created_at: string
  project_id: string
}

export async function loadRealDashboardData() {
  const supabase = createClient()

  try {
    console.log('🔄 Carregando dados reais do dashboard...')

    // Carregar experimentos
    const { data: experiments, error: expError } = await supabase
      .from('experiments')
      .select('*')
      .order('created_at', { ascending: false })

    if (expError) {
      console.error('Erro ao carregar experimentos:', expError)
      return { experiments: [], events: [], hasData: false }
    }

    // Carregar eventos
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (eventsError) {
      console.error('Erro ao carregar eventos:', eventsError)
      return { experiments: experiments || [], events: [], hasData: false }
    }

    const hasData = (experiments?.length || 0) > 0 || (events?.length || 0) > 0

    console.log(`✅ Dados carregados: ${experiments?.length || 0} experimentos, ${events?.length || 0} eventos`)

    return {
      experiments: experiments || [],
      events: events || [],
      hasData
    }

  } catch (error) {
    console.error('Erro geral ao carregar dados:', error)
    return { experiments: [], events: [], hasData: false }
  }
}

export async function createSampleExperimentAndEvents() {
  const supabase = createClient()

  try {
    console.log('🧪 Criando experimento e eventos de exemplo...')

    // Verificar se já existe projeto
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .limit(1)

    if (!projects || projects.length === 0) {
      throw new Error('Nenhum projeto encontrado. Configure o projeto primeiro.')
    }

    const projectId = projects[0].id

    // Criar experimento simples
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .insert({
        project_id: projectId,
        name: 'Teste do Botão CTA',
        key: 'teste-botao-cta-' + Date.now(),
        description: 'Experimento de exemplo para demonstrar o sistema',
        status: 'running',
        algorithm: 'thompson_sampling',
        traffic_allocation: 100
      })
      .select('id')
      .single()

    if (expError) {
      console.error('Erro ao criar experimento:', expError)
      throw expError
    }

    console.log('✅ Experimento criado:', experiment.id)

    // Criar variantes simples
    const variants = [
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
        name: 'Variante A',
        key: 'variant-a',
        is_control: false,
        weight: 50,
        config: {
          css: [{ selector: '.btn-cta', style: 'background-color: #10b981;' }]
        }
      }
    ]

    const { error: varError } = await supabase
      .from('variants')
      .insert(variants)

    if (varError) {
      console.error('Erro ao criar variantes:', varError)
      // Não falhar por causa das variantes, o experimento já foi criado
    } else {
      console.log('✅ Variantes criadas')
    }

    // Criar eventos de exemplo
    const events = []
    const now = new Date()

    for (let i = 0; i < 50; i++) {
      const date = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      const visitorId = 'demo_visitor_' + Math.random().toString(36).slice(2)
      const variant = Math.random() > 0.5 ? 'Controle' : 'Variante A'

      // Page view
      events.push({
        project_id: projectId,
        experiment_id: experiment.id,
        visitor_id: visitorId,
        event_type: 'page_view',
        event_name: 'page_view',
        properties: { variant, demo: true },
        value: null,
        created_at: date.toISOString()
      })

      // Possível conversão
      if (Math.random() > 0.8) {
        events.push({
          project_id: projectId,
          experiment_id: experiment.id,
          visitor_id: visitorId,
          event_type: 'conversion',
          event_name: 'purchase',
          properties: { variant, demo: true, product: 'demo-product' },
          value: Math.floor(Math.random() * 100) + 50,
          created_at: new Date(date.getTime() + 30000).toISOString()
        })
      }
    }

    const { error: eventsError } = await supabase
      .from('events')
      .insert(events)

    if (eventsError) {
      console.error('Erro ao criar eventos:', eventsError)
      throw eventsError
    }

    console.log(`✅ ${events.length} eventos de exemplo criados`)

    return true

  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error)
    throw error
  }
}

export async function getTableStats() {
  const supabase = createClient()

  try {
    const [orgsResult, projectsResult, experimentsResult, eventsResult] = await Promise.all([
      supabase.from('organizations').select('count', { count: 'exact' }),
      supabase.from('projects').select('count', { count: 'exact' }),
      supabase.from('experiments').select('count', { count: 'exact' }),
      supabase.from('events').select('count', { count: 'exact' })
    ])

    return {
      organizations: orgsResult.data?.[0]?.count || 0,
      projects: projectsResult.data?.[0]?.count || 0,
      experiments: experimentsResult.data?.[0]?.count || 0,
      events: eventsResult.data?.[0]?.count || 0
    }

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    return {
      organizations: 0,
      projects: 0,
      experiments: 0,
      events: 0
    }
  }
}