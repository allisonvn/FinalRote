#!/usr/bin/env node

/**
 * Script para testar a API do Next.js diretamente
 * Simula a criação de experimentos via API
 */

const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase em produção
const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Mjc3NjIsImV4cCI6MjA3MzEwMzc2Mn0.PYV2lIzQAbI8O_WFCy_ELpDIZMLNAOjGp9PKo3-Ilxg'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUyNzc2MiwiZXhwIjoyMDczMTAzNzYyfQ.BElrinV8Gkt4VGigpZMX9zbbJI5uYfp2DKQEtF8qbqs'

const supabase = createClient(supabaseUrl, supabaseKey)
const supabaseService = createClient(supabaseUrl, serviceRoleKey)

async function testApiDirect() {
  console.log('🔍 Testando API do Next.js diretamente...')
  
  try {
    // 1. Testar inserção com client anônimo
    console.log('\n1. Testando inserção com client anônimo...')
    
    const testData = {
      name: 'Teste_API_Direct',
      project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
      description: 'Teste direto da API',
      type: 'redirect',
      traffic_allocation: 99.99,
      status: 'draft',
      user_id: 'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
    }
    
    console.log('📝 Dados para inserção:', testData)
    
    const { data: anonResult, error: anonError } = await supabase
      .from('experiments')
      .insert(testData)
      .select('id, name, traffic_allocation')
    
    if (anonError) {
      console.error('❌ Erro com client anônimo:', anonError)
    } else {
      console.log('✅ Sucesso com client anônimo:', anonResult)
      
      // Limpar
      if (anonResult && anonResult[0]) {
        await supabaseService
          .from('experiments')
          .delete()
          .eq('id', anonResult[0].id)
        console.log('🧹 Dados removidos')
      }
    }
    
    // 2. Testar inserção com service role
    console.log('\n2. Testando inserção com service role...')
    
    const testData2 = {
      name: 'Teste_Service_Role',
      project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
      description: 'Teste com service role',
      type: 'redirect',
      traffic_allocation: 99.99,
      status: 'draft',
      user_id: 'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
    }
    
    console.log('📝 Dados para inserção:', testData2)
    
    const { data: serviceResult, error: serviceError } = await supabaseService
      .from('experiments')
      .insert(testData2)
      .select('id, name, traffic_allocation')
    
    if (serviceError) {
      console.error('❌ Erro com service role:', serviceError)
    } else {
      console.log('✅ Sucesso com service role:', serviceResult)
      
      // Limpar
      if (serviceResult && serviceResult[0]) {
        await supabaseService
          .from('experiments')
          .delete()
          .eq('id', serviceResult[0].id)
        console.log('🧹 Dados removidos')
      }
    }
    
    // 3. Testar inserção via função RPC
    console.log('\n3. Testando inserção via função RPC...')
    
    const rpcData = {
      name: 'Teste_RPC',
      project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
      description: 'Teste via RPC',
      type: 'redirect',
      traffic_allocation: '99.99',
      status: 'draft'
    }
    
    console.log('📝 Dados para RPC:', rpcData)
    
    const { data: rpcResult, error: rpcError } = await supabaseService
      .rpc('rpc_create_experiment_canonical', { payload: rpcData })
    
    if (rpcError) {
      console.error('❌ Erro com RPC:', rpcError)
    } else {
      console.log('✅ Sucesso com RPC:', rpcResult)
      
      // Limpar
      if (rpcResult) {
        await supabaseService
          .from('experiments')
          .delete()
          .eq('id', rpcResult)
        console.log('🧹 Dados removidos')
      }
    }
    
    // 4. Verificar schema em tempo real
    console.log('\n4. Verificando schema em tempo real...')
    
    const { data: schemaData, error: schemaError } = await supabaseService
      .from('information_schema.columns')
      .select('column_name, data_type, numeric_precision, numeric_scale, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'experiments')
      .eq('column_name', 'traffic_allocation')
    
    if (schemaError) {
      console.error('❌ Erro ao obter schema:', schemaError)
    } else {
      console.log('✅ Schema atual:', schemaData)
    }
    
    console.log('\n🎉 Teste da API concluído!')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testApiDirect()
