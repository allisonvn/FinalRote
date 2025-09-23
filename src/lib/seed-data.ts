import { createClient } from '@/lib/supabase/client'

export async function createSampleData() {
  const supabase = createClient()

  try {
    // Criar um projeto de exemplo se não existir
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .limit(1)
      .single()

    let projectId = existingProject?.id

    if (!projectId) {
      console.log('Criando projeto de exemplo...')
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: 'Site Principal',
          domain: 'localhost:3003',
          api_key: 'demo-api-key-' + Math.random().toString(36).slice(2),
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (projectError) {
        console.error('Erro ao criar projeto:', projectError)
        return false
      }
      projectId = newProject.id
    }

    // Criar um experimento de exemplo se não existir
    const { data: existingExperiment } = await supabase
      .from('experiments')
      .select('id')
      .eq('project_id', projectId)
      .limit(1)
      .single()

    let experimentId = existingExperiment?.id

    if (!experimentId) {
      console.log('Criando experimento de exemplo...')
      const { data: newExperiment, error: expError } = await supabase
        .from('experiments')
        .insert({
          project_id: projectId,
          name: 'Teste do Botão Principal',
          description: 'Testando diferentes cores do botão CTA',
          status: 'running',
          algorithm: 'thompson_sampling',
          traffic_allocation: 100,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (expError) {
        console.error('Erro ao criar experimento:', expError)
        return false
      }
      experimentId = newExperiment.id

      // Criar variantes
      const variants = [
        { name: 'Controle', key: 'control', is_control: true, weight: 50 },
        { name: 'Botão Verde', key: 'green-button', is_control: false, weight: 50 }
      ]

      for (const variant of variants) {
        await supabase
          .from('variants')
          .insert({
            experiment_id: experimentId,
            ...variant,
            config: {
              css: variant.key === 'green-button' ? [{ selector: '.cta-button', style: 'background-color: #10b981;' }] : []
            }
          })
      }
    }

    // Criar eventos de exemplo
    const now = new Date()
    const events = []

    // Criar eventos dos últimos 7 dias
    for (let day = 0; day < 7; day++) {
      const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000)

      // Eventos por dia
      for (let i = 0; i < Math.floor(Math.random() * 20) + 10; i++) {
        const eventTime = new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000)
        const visitorId = 'visitor_' + Math.random().toString(36).slice(2)
        const variant = Math.random() > 0.5 ? 'Controle' : 'Botão Verde'

        // Page view
        events.push({
          project_id: projectId,
          experiment_id: experimentId,
          visitor_id: visitorId,
          event_type: 'page_view',
          event_name: 'page_view',
          properties: {
            variant: variant,
            url: 'https://localhost:3003/',
            referrer: Math.random() > 0.7 ? 'https://google.com' : null
          },
          value: null,
          created_at: eventTime.toISOString()
        })

        // Possível clique
        if (Math.random() > 0.6) {
          events.push({
            project_id: projectId,
            experiment_id: experimentId,
            visitor_id: visitorId,
            event_type: 'click',
            event_name: 'button_click',
            properties: {
              variant: variant,
              element: '.cta-button',
              url: 'https://localhost:3003/'
            },
            value: null,
            created_at: new Date(eventTime.getTime() + 5000).toISOString()
          })
        }

        // Possível conversão
        if (Math.random() > 0.85) {
          const value = Math.floor(Math.random() * 200) + 50
          events.push({
            project_id: projectId,
            experiment_id: experimentId,
            visitor_id: visitorId,
            event_type: 'conversion',
            event_name: 'purchase',
            properties: {
              variant: variant,
              product_id: 'prod_' + Math.random().toString(36).slice(2),
              category: 'electronics'
            },
            value: value,
            created_at: new Date(eventTime.getTime() + 30000).toISOString()
          })
        }
      }
    }

    // Inserir eventos em lotes
    console.log(`Inserindo ${events.length} eventos de exemplo...`)

    const batchSize = 50
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize)
      const { error } = await supabase
        .from('events')
        .insert(batch)

      if (error) {
        console.error('Erro ao inserir lote de eventos:', error)
      }
    }

    console.log('Dados de exemplo criados com sucesso!')
    return true

  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error)
    return false
  }
}

export async function checkAndCreateSampleData() {
  const supabase = createClient()

  try {
    // Verificar se já existem eventos
    const { data: events, error } = await supabase
      .from('events')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Erro ao verificar eventos:', error)
      return false
    }

    if (!events || events.length === 0) {
      console.log('Nenhum evento encontrado, criando dados de exemplo...')
      return await createSampleData()
    } else {
      console.log('Eventos já existem no banco')
      return true
    }

  } catch (error) {
    console.error('Erro ao verificar dados:', error)
    return false
  }
}