const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Mjc3NjIsImV4cCI6MjA3MzEwMzc2Mn0.PYV2lIzQAbI8O_WFCy_ELpDIZMLNAOjGp9PKo3-Ilxg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabaseConnection() {
  try {
    console.log('Testando conexão com Supabase...')
    
    // Teste 1: Listar organizações
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
    
    if (orgError) {
      console.error('Erro ao buscar organizações:', orgError)
    } else {
      console.log('✅ Organizações encontradas:', orgs)
    }
    
    // Teste 2: Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log('ℹ️ Usuário não autenticado (normal):', authError.message)
    } else {
      console.log('✅ Usuário autenticado:', user)
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err)
  }
}

testSupabaseConnection()
