const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Mjc3NjIsImV4cCI6MjA3MzEwMzc2Mn0.PYV2lIzQAbI8O_WFCy_ELpDIZMLNAOjGp9PKo3-Ilxg'

async function testConnection() {
  console.log('🔗 Testando conexão com Supabase...')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Testar tabelas básicas
    console.log('\n📋 Verificando tabelas...')

    const { data: orgs, error: orgError } = await supabase.from('organizations').select('count', { count: 'exact' })
    console.log('Organizations:', orgError ? '❌ Erro: ' + orgError.message : `✅ ${orgs?.[0]?.count || 0} registros`)

    const { data: projects, error: projError } = await supabase.from('projects').select('count', { count: 'exact' })
    console.log('Projects:', projError ? '❌ Erro: ' + projError.message : `✅ ${projects?.[0]?.count || 0} registros`)

    const { data: experiments, error: expError } = await supabase.from('experiments').select('count', { count: 'exact' })
    console.log('Experiments:', expError ? '❌ Erro: ' + expError.message : `✅ ${experiments?.[0]?.count || 0} registros`)

    const { data: variants, error: varError } = await supabase.from('variants').select('count', { count: 'exact' })
    console.log('Variants:', varError ? '❌ Erro: ' + varError.message : `✅ ${variants?.[0]?.count || 0} registros`)

    const { data: events, error: eventsError } = await supabase.from('events').select('count', { count: 'exact' })
    console.log('Events:', eventsError ? '❌ Erro: ' + eventsError.message : `✅ ${events?.[0]?.count || 0} registros`)

    // Mostrar alguns dados reais se existirem
    if (events?.[0]?.count > 0) {
      console.log('\n📊 Últimos eventos:')
      const { data: recentEvents } = await supabase
        .from('events')
        .select('event_type, created_at, value')
        .order('created_at', { ascending: false })
        .limit(5)

      recentEvents?.forEach(event => {
        console.log(`  • ${event.event_type} - ${new Date(event.created_at).toLocaleDateString('pt-BR')} - ${event.value ? `R$ ${event.value}` : 'sem valor'}`)
      })
    }

    if (experiments?.[0]?.count > 0) {
      console.log('\n🧪 Experimentos existentes:')
      const { data: expList } = await supabase
        .from('experiments')
        .select('name, status, created_at')
        .limit(5)

      expList?.forEach(exp => {
        console.log(`  • ${exp.name} (${exp.status}) - criado em ${new Date(exp.created_at).toLocaleDateString('pt-BR')}`)
      })
    }

    console.log('\n✅ Conexão funcionando! O banco está pronto para uso.')
    return true

  } catch (error) {
    console.error('❌ Erro de conexão:', error)
    return false
  }
}

testConnection()