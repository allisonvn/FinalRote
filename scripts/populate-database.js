const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Mjc3NjIsImV4cCI6MjA3MzEwMzc2Mn0.PYV2lIzQAbI8O_WFCy_ELpDIZMLNAOjGp9PKo3-Ilxg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateDatabase() {
  console.log('🚀 Populando banco de dados com dados reais...')

  try {
    // 1. Verificar se há organizações
    let { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single()

    if (!organization) {
      console.log('🏢 Criando organização exemplo...')
      const { data: newOrg, error } = await supabase
        .from('organizations')
        .insert({
          name: 'Empresa Demo',
          slug: 'empresa-demo-' + Math.random().toString(36).slice(2)
        })
        .select('id')
        .single()

      if (error) throw error
      organization = newOrg
      console.log('✅ Organização criada:', organization.id)
    } else {
      console.log('✅ Organização existente encontrada:', organization.id)
    }

    // 2. Verificar se há projetos
    let { data: project } = await supabase
      .from('projects')
      .select('id')
      .limit(1)
      .single()

    if (!project) {
      console.log('📁 Criando projeto exemplo...')
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          organization_id: organization.id,
          name: 'Site Principal',
          description: 'Site principal da empresa para testes A/B',
          allowed_origins: ['localhost:3003', 'https://localhost:3003']
        })
        .select('id')
        .single()

      if (error) throw error
      project = newProject
      console.log('✅ Projeto criado:', project.id)
    } else {
      console.log('✅ Projeto existente encontrado:', project.id)
    }

    // 3. Verificar se há experimentos
    let { data: experiment } = await supabase
      .from('experiments')
      .select('id')
      .eq('project_id', project.id)
      .limit(1)
      .single()

    if (!experiment) {
      console.log('🧪 Criando experimento exemplo...')
      const { data: newExp, error } = await supabase
        .from('experiments')
        .insert({
          project_id: project.id,
          name: 'Teste do Botão CTA Principal',
          key: 'teste-botao-cta',
          description: 'Teste A/B da cor e texto do botão principal da homepage',
          status: 'running',
          algorithm: 'thompson_sampling',
          traffic_allocation: 100
        })
        .select('id')
        .single()

      if (error) throw error
      experiment = newExp

      // Criar variantes
      console.log('🎯 Criando variantes...')
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
          name: 'Botão Verde',
          key: 'green-button',
          is_control: false,
          weight: 50,
          config: {
            css: [{ selector: '.cta-button', style: 'background-color: #10b981; color: white;' }],
            text: [{ selector: '.cta-button', value: 'Comprar Agora!' }]
          }
        }
      ]

      const { error: varError } = await supabase
        .from('variants')
        .insert(variants)

      if (varError) throw varError
      console.log('✅ Variantes criadas')
    } else {
      console.log('✅ Experimento existente encontrado:', experiment.id)
    }

    // 4. Criar eventos de exemplo se não existirem
    const { data: existingEvents } = await supabase
      .from('events')
      .select('id')
      .limit(1)

    if (!existingEvents || existingEvents.length === 0) {
      console.log('📊 Criando eventos de exemplo...')

      const events = []
      const now = new Date()
      const variants = ['Controle', 'Botão Verde']

      // Criar eventos dos últimos 14 dias
      for (let day = 0; day < 14; day++) {
        const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000)

        // 20-50 eventos por dia
        const eventsPerDay = Math.floor(Math.random() * 30) + 20

        for (let i = 0; i < eventsPerDay; i++) {
          const eventTime = new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000)
          const visitorId = 'visitor_' + Math.random().toString(36).slice(2) + '_' + day + '_' + i
          const variant = variants[Math.floor(Math.random() * variants.length)]

          // Page view (sempre acontece)
          events.push({
            project_id: project.id,
            experiment_id: experiment.id,
            visitor_id: visitorId,
            event_type: 'page_view',
            event_name: 'page_view',
            properties: {
              variant: variant,
              url: 'https://localhost:3003/',
              referrer: Math.random() > 0.7 ? 'https://google.com/search?q=produto' : null,
              user_agent: 'Mozilla/5.0 (compatible; Test)'
            },
            value: null,
            created_at: eventTime.toISOString()
          })

          // Click no botão (60% chance)
          if (Math.random() > 0.4) {
            events.push({
              project_id: project.id,
              experiment_id: experiment.id,
              visitor_id: visitorId,
              event_type: 'click',
              event_name: 'button_click',
              properties: {
                variant: variant,
                element: '.cta-button',
                text: variant === 'Botão Verde' ? 'Comprar Agora!' : 'Comprar',
                url: 'https://localhost:3003/'
              },
              value: null,
              created_at: new Date(eventTime.getTime() + Math.random() * 10000).toISOString()
            })
          }

          // Conversão (15% chance)
          if (Math.random() > 0.85) {
            const value = Math.floor(Math.random() * 200) + 50
            events.push({
              project_id: project.id,
              experiment_id: experiment.id,
              visitor_id: visitorId,
              event_type: 'conversion',
              event_name: 'purchase',
              properties: {
                variant: variant,
                product_id: 'prod_' + Math.random().toString(36).slice(2),
                category: 'electronics',
                currency: 'BRL'
              },
              value: value,
              created_at: new Date(eventTime.getTime() + Math.random() * 30000).toISOString()
            })
          }

          // Signup (10% chance)
          if (Math.random() > 0.9) {
            events.push({
              project_id: project.id,
              experiment_id: experiment.id,
              visitor_id: visitorId,
              event_type: 'signup',
              event_name: 'user_signup',
              properties: {
                variant: variant,
                source: 'cta_button',
                plan: 'free'
              },
              value: 0,
              created_at: new Date(eventTime.getTime() + Math.random() * 20000).toISOString()
            })
          }
        }
      }

      // Inserir eventos em lotes
      console.log(`📈 Inserindo ${events.length} eventos...`)
      const batchSize = 100

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize)
        const { error } = await supabase
          .from('events')
          .insert(batch)

        if (error) {
          console.error('Erro no lote:', error)
          throw error
        }

        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(events.length/batchSize)} inserido`)
      }

      console.log('🎉 Eventos criados com sucesso!')
    } else {
      console.log('✅ Eventos já existem no banco')
    }

    // 5. Estatísticas finais
    const { data: finalStats } = await supabase
      .from('events')
      .select('event_type')

    const stats = finalStats?.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1
      return acc
    }, {})

    console.log('\n📊 Estatísticas finais:')
    console.log('Total de eventos:', finalStats?.length || 0)
    console.log('Por tipo:', stats)

    console.log('\n🚀 Banco de dados populado com sucesso!')
    console.log('Acesse http://localhost:3003/dashboard para ver os dados')

  } catch (error) {
    console.error('❌ Erro ao popular banco:', error)
    process.exit(1)
  }
}

populateDatabase()