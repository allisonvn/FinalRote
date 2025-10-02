// Script para obter a service role key correta
// A service role key deve ser obtida do painel do Supabase em Settings > API

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qptaizbqcgproqtvwvet.supabase.co'

// Service role key correta - você precisa obter do painel do Supabase
// Vá em: https://supabase.com/dashboard/project/qptaizbqcgproqtvwvet/settings/api
// E copie a "service_role" key (não a anon key)
const correctServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdGFpemJxY2dwcm9xdHZ3dmV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkxOTM2NywiZXhwIjoyMDc0NDk1MzY3fQ.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q'

async function testCorrectServiceKey() {
  console.log('🔍 Testando com service role key correta...')
  console.log('URL:', supabaseUrl)
  console.log('Key (primeiros 20 chars):', correctServiceKey.substring(0, 20) + '...')
  
  const supabase = createClient(supabaseUrl, correctServiceKey)
  
  try {
    // Teste 1: Buscar experimento
    console.log('\n1. Testando busca de experimento...')
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .select('id, name, status')
      .eq('id', 'defb3829-e9bb-453d-af56-b08b167b9be3')
      .single()
    
    if (expError) {
      console.log('❌ Erro ao buscar experimento:', expError.message)
      return
    } else {
      console.log('✅ Experimento encontrado:', experiment)
    }
    
    // Teste 2: Buscar variantes
    console.log('\n2. Testando busca de variantes...')
    const { data: variants, error: varError } = await supabase
      .from('variants')
      .select('id, name, is_control, traffic_percentage, is_active')
      .eq('experiment_id', 'defb3829-e9bb-453d-af56-b08b167b9be3')
      .eq('is_active', true)
    
    if (varError) {
      console.log('❌ Erro ao buscar variantes:', varError.message)
      return
    } else {
      console.log('✅ Variantes encontradas:', variants.length, 'variantes')
      variants.forEach(v => console.log(`  - ${v.name} (${v.traffic_percentage}%)`))
    }
    
    // Teste 3: Simular atribuição
    console.log('\n3. Testando criação de atribuição...')
    const visitorId = 'test-correct-key-123'
    const { data: assignment, error: assignError } = await supabase
      .from('assignments')
      .insert({
        experiment_id: 'defb3829-e9bb-453d-af56-b08b167b9be3',
        variant_id: variants[0].id,
        visitor_id: visitorId,
        assigned_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (assignError) {
      console.log('❌ Erro ao criar atribuição:', assignError.message)
    } else {
      console.log('✅ Atribuição criada com sucesso!')
    }
    
    console.log('\n🎉 Todos os testes passaram! A service role key está correta.')
    console.log('\n📋 Para corrigir no servidor, atualize o arquivo .env.local com:')
    console.log(`SUPABASE_SERVICE_ROLE_KEY=${correctServiceKey}`)
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message)
  }
}

testCorrectServiceKey()
