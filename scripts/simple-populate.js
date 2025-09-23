const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Mjc3NjIsImV4cCI6MjA3MzEwMzc2Mn0.PYV2lIzQAbI8O_WFCy_ELpDIZMLNAOjGp9PKo3-Ilxg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSimpleData() {
  try {
    console.log('🚀 Criando dados simples...')

    // Primeiro verificar se há eventos existentes
    const { data: existingEvents } = await supabase
      .from('events')
      .select('id')
      .limit(1)

    if (existingEvents && existingEvents.length > 0) {
      console.log('✅ Eventos já existem no banco!')
      const { data: allEvents } = await supabase
        .from('events')
        .select('event_type')

      const stats = allEvents?.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1
        return acc
      }, {})

      console.log('📊 Estatísticas atuais:', stats)
      return true
    }

    // Verificar se há experimentos
    const { data: experiments } = await supabase
      .from('experiments')
      .select('id, name, project_id')
      .limit(1)

    if (!experiments || experiments.length === 0) {
      console.log('❌ Nenhum experimento encontrado. Você precisa criar um experimento primeiro através do dashboard.')
      return false
    }

    const experiment = experiments[0]
    console.log('✅ Usando experimento existente:', experiment.name)

    // Criar eventos simples
    const events = []
    const now = new Date()

    for (let i = 0; i < 100; i++) {
      const date = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      const visitorId = 'visitor_' + Math.random().toString(36).slice(2)
      const variant = Math.random() > 0.5 ? 'Controle' : 'Variante A'

      // Event básico
      events.push({
        project_id: experiment.project_id,
        experiment_id: experiment.id,
        visitor_id: visitorId,
        event_type: 'page_view',
        event_name: 'page_view',
        properties: { variant },
        value: null,
        created_at: date.toISOString()
      })

      // Possível conversão
      if (Math.random() > 0.8) {
        events.push({
          project_id: experiment.project_id,
          experiment_id: experiment.id,
          visitor_id: visitorId,
          event_type: 'conversion',
          event_name: 'purchase',
          properties: { variant },
          value: Math.floor(Math.random() * 100) + 20,
          created_at: new Date(date.getTime() + 10000).toISOString()
        })
      }
    }

    console.log(`📈 Inserindo ${events.length} eventos...`)

    const { error } = await supabase
      .from('events')
      .insert(events)

    if (error) {
      console.error('❌ Erro ao inserir eventos:', error)
      return false
    }

    console.log('🎉 Dados criados com sucesso!')
    return true

  } catch (error) {
    console.error('❌ Erro:', error)
    return false
  }
}

createSimpleData()