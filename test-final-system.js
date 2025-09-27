#!/usr/bin/env node

/**
 * Teste final do sistema após limpeza de cache
 */

const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase com novas chaves
const supabaseUrl = 'https://ypoxxzkuetblrtphoaxr.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3h4emt1ZXRibHJ0cGhvYXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTEzNDQsImV4cCI6MjA3NDQ4NzM0NH0.I7F5VnDMBX2CbijZu0ePzv5SxZqqpjUxoZq_R7wVd6A'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3h4emt1ZXRibHJ0cGhvYXhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkxMTM0NCwiZXhwIjoyMDc0NDg3MzQ0fQ.8$SKBsvFzvZMT8J'

const supabaseAnon = createClient(supabaseUrl, anonKey)
const supabaseService = createClient(supabaseUrl, serviceKey)

async function testFinalSystem() {
  console.log('🎯 TESTE FINAL DO SISTEMA')
  console.log('📡 URL:', supabaseUrl)
  console.log('🔑 Anon Key:', anonKey.substring(0, 20) + '...')
  console.log('🔑 Service Key:', serviceKey.substring(0, 20) + '...')
  
  let successCount = 0
  let totalTests = 0
  
  try {
    // 1. Teste de conexão básica
    console.log('\n1. 🔌 Testando conexão básica...')
    totalTests++
    
    const { data: healthData, error: healthError } = await supabaseService
      .from('experiments')
      .select('id')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Erro na conexão:', healthError.message)
    } else {
      console.log('✅ Conexão básica funcionando')
      successCount++
    }
    
    // 2. Teste de inserção com service key
    console.log('\n2. 📝 Testando inserção com service key...')
    totalTests++
    
    const testData = {
      name: 'Teste_Final_System',
      project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
      description: 'Teste final do sistema',
      type: 'redirect',
      traffic_allocation: 99.99,
      status: 'draft',
      user_id: 'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
    }
    
    const { data: insertResult, error: insertError } = await supabaseService
      .from('experiments')
      .insert(testData)
      .select('id, name, traffic_allocation')
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError.message)
      if (insertError.message.includes('key')) {
        console.log('🔍 Campo "key" fantasma ainda presente - cache não limpo')
      }
      if (insertError.message.includes('numeric field overflow')) {
        console.log('🔍 Overflow numérico ainda presente - cache não limpo')
      }
    } else {
      console.log('✅ Inserção bem-sucedida:', insertResult[0])
      successCount++
      
      // Limpar
      await supabaseService
        .from('experiments')
        .delete()
        .eq('id', insertResult[0].id)
      console.log('🧹 Dados removidos')
    }
    
    // 3. Teste de função RPC
    console.log('\n3. 🔧 Testando função RPC...')
    totalTests++
    
    const { data: rpcResult, error: rpcError } = await supabaseService
      .rpc('insert_experiment_direct', {
        p_name: 'Teste_RPC_Final',
        p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        p_description: 'Teste RPC final',
        p_type: 'redirect',
        p_traffic_allocation: 99.99,
        p_status: 'draft',
        p_user_id: 'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
      })
    
    if (rpcError) {
      console.error('❌ Erro com RPC:', rpcError.message)
      if (rpcError.message.includes('not found')) {
        console.log('🔍 Função RPC não reconhecida - cache não limpo')
      }
    } else {
      console.log('✅ RPC funcionando:', rpcResult[0])
      successCount++
      
      // Limpar
      await supabaseService
        .from('experiments')
        .delete()
        .eq('id', rpcResult[0].id)
      console.log('🧹 Dados removidos')
    }
    
    // 4. Teste de diferentes valores
    console.log('\n4. 🔢 Testando diferentes valores...')
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    
    for (const value of testValues) {
      totalTests++
      const { data: result, error: error } = await supabaseService
        .from('experiments')
        .insert({
          name: `Teste_${value.toString().replace('.', '_')}_Final`,
          project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
          type: 'redirect',
          traffic_allocation: value,
          status: 'draft'
        })
        .select('id, name, traffic_allocation')
      
      if (error) {
        console.log(`❌ ${value}:`, error.message)
      } else {
        console.log(`✅ ${value}:`, result[0].traffic_allocation)
        successCount++
        
        // Limpar
        await supabaseService
          .from('experiments')
          .delete()
          .eq('id', result[0].id)
      }
    }
    
    // 5. Teste de inserção mínima
    console.log('\n5. 📋 Testando inserção mínima...')
    totalTests++
    
    const { data: minimalResult, error: minimalError } = await supabaseService
      .from('experiments')
      .insert({
        name: 'Teste_Minimal_Final',
        project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        type: 'redirect'
      })
      .select('id, name, traffic_allocation')
    
    if (minimalError) {
      console.error('❌ Erro com inserção mínima:', minimalError.message)
    } else {
      console.log('✅ Inserção mínima funcionando:', minimalResult[0])
      successCount++
      
      // Limpar
      await supabaseService
        .from('experiments')
        .delete()
        .eq('id', minimalResult[0].id)
      console.log('🧹 Dados removidos')
    }
    
    // Resultado final
    console.log('\n🎯 RESULTADO FINAL:')
    console.log(`✅ Sucessos: ${successCount}/${totalTests}`)
    console.log(`📊 Taxa de sucesso: ${((successCount/totalTests)*100).toFixed(1)}%`)
    
    if (successCount === totalTests) {
      console.log('\n🎉 SISTEMA 100% FUNCIONAL!')
      console.log('✅ Cache limpo com sucesso')
      console.log('✅ Todas as funcionalidades operacionais')
    } else if (successCount > totalTests * 0.8) {
      console.log('\n🟡 SISTEMA QUASE FUNCIONAL!')
      console.log('⚠️ Alguns problemas de cache persistem')
      console.log('💡 Aguarde mais alguns minutos para propagação completa')
    } else {
      console.log('\n🔴 SISTEMA AINDA COM PROBLEMAS!')
      console.log('❌ Cache não foi limpo adequadamente')
      console.log('💡 Tente limpar cache novamente no dashboard')
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testFinalSystem()
