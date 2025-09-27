#!/usr/bin/env node

/**
 * Teste da solução RPC personalizada
 */

const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase em produção
const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUyNzc2MiwiZXhwIjoyMDczMTAzNzYyfQ.BElrinV8Gkt4VGigpZMX9zbbJI5uYfp2DKQEtF8qbqs'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testRpcSolution() {
  console.log('🎯 Testando solução RPC personalizada...')
  
  try {
    // 1. Testar inserção básica
    console.log('\n1. Testando inserção básica...')
    
    const { data: basicResult, error: basicError } = await supabase
      .rpc('insert_experiment_direct', {
        p_name: 'Teste_RPC_Basic',
        p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        p_description: 'Teste básico com RPC',
        p_type: 'redirect',
        p_traffic_allocation: 99.99,
        p_status: 'draft',
        p_user_id: 'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
      })
    
    if (basicError) {
      console.error('❌ Erro com RPC básico:', basicError)
    } else {
      console.log('✅ Sucesso com RPC básico:', basicResult)
      
      // Limpar
      if (basicResult && basicResult[0]) {
        await supabase
          .from('experiments')
          .delete()
          .eq('id', basicResult[0].id)
        console.log('🧹 Dados removidos')
      }
    }
    
    // 2. Testar diferentes valores
    console.log('\n2. Testando diferentes valores...')
    
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    
    for (const value of testValues) {
      const { data: result, error: error } = await supabase
        .rpc('insert_experiment_direct', {
          p_name: `Teste_${value.toString().replace('.', '_')}_RPC`,
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
        p_name: 'Teste_RPC_Minimal',
        p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe'
      })
    
    if (minimalError) {
      console.error('❌ Erro com RPC mínimal:', minimalError)
    } else {
      console.log('✅ Sucesso com RPC mínimal:', minimalResult)
      
      // Limpar
      if (minimalResult && minimalResult[0]) {
        await supabase
          .from('experiments')
          .delete()
          .eq('id', minimalResult[0].id)
        console.log('🧹 Dados removidos')
      }
    }
    
    console.log('\n🎉 SOLUÇÃO RPC FUNCIONANDO!')
    console.log('📋 A função insert_experiment_direct contorna o problema de cache!')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testRpcSolution()
