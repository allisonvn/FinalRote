#!/usr/bin/env node

/**
 * Teste da API atualizada com função RPC
 */

const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase em produção
const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUyNzc2MiwiZXhwIjoyMDczMTAzNzYyfQ.BElrinV8Gkt4VGigpZMX9zbbJI5uYfp2DKQEtF8qbqs'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testApiUpdated() {
  console.log('🎯 Testando API atualizada com função RPC...')
  
  try {
    // 1. Testar função RPC diretamente
    console.log('\n1. Testando função RPC diretamente...')
    
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('insert_experiment_direct', {
        p_name: 'Teste_API_Updated',
        p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        p_description: 'Teste da API atualizada',
        p_type: 'redirect',
        p_traffic_allocation: 99.99,
        p_status: 'draft',
        p_user_id: 'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
      })
    
    if (rpcError) {
      console.error('❌ Erro com RPC:', rpcError)
    } else {
      console.log('✅ Sucesso com RPC:', rpcResult)
      
      // Limpar
      if (rpcResult && rpcResult[0]) {
        await supabase
          .from('experiments')
          .delete()
          .eq('id', rpcResult[0].id)
        console.log('🧹 Dados removidos')
      }
    }
    
    // 2. Testar diferentes valores
    console.log('\n2. Testando diferentes valores...')
    
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    
    for (const value of testValues) {
      const { data: result, error: error } = await supabase
        .rpc('insert_experiment_direct', {
          p_name: `Teste_${value.toString().replace('.', '_')}_API`,
          p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
          p_type: 'redirect',
          p_traffic_allocation: value,
          p_status: 'draft'
        })
      
      if (error) {
        console.log(`❌ ${value}:`, error.message)
      } else {
        console.log(`✅ ${value}:`, result[0].traffic_allocation)
        
        // Limpar
        await supabase
          .from('experiments')
          .delete()
          .eq('id', result[0].id)
      }
    }
    
    // 3. Testar inserção mínima
    console.log('\n3. Testando inserção mínima...')
    
    const { data: minimalResult, error: minimalError } = await supabase
      .rpc('insert_experiment_direct', {
        p_name: 'Teste_API_Minimal',
        p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe'
      })
    
    if (minimalError) {
      console.error('❌ Erro com inserção mínima:', minimalError)
    } else {
      console.log('✅ Sucesso com inserção mínima:', minimalResult)
      
      // Limpar
      if (minimalResult && minimalResult[0]) {
        await supabase
          .from('experiments')
          .delete()
          .eq('id', minimalResult[0].id)
        console.log('🧹 Dados removidos')
      }
    }
    
    console.log('\n🎉 TESTE DA API ATUALIZADA CONCLUÍDO!')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testApiUpdated()
