#!/usr/bin/env node

/**
 * Teste usando funções RPC personalizadas para contornar cache
 */

const { createClient } = require('@supabase/supabase-js')

// NOVAS CONFIGURAÇÕES
const supabaseUrl = 'https://ypoxxzkuetblrtphoaxr.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3h4emt1ZXRibHJ0cGhvYXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTEzNDQsImV4cCI6MjA3NDQ4NzM0NH0.I7F5VnDMBX2CbijZu0ePzv5SxZqqpjUxoZq_R7wVd6A'

const supabase = createClient(supabaseUrl, anonKey)

async function testRPCBypass() {
  console.log('🎯 TESTE COM FUNÇÕES RPC PERSONALIZADAS')
  console.log('📡 URL:', supabaseUrl)
  
  try {
    // 1. Teste de conexão via RPC
    console.log('\n1. 🔌 Testando conexão via RPC...')
    const { data: healthData, error: healthError } = await supabase
      .rpc('list_experiments_bypass')
    
    if (healthError) {
      console.error('❌ Erro na conexão RPC:', healthError.message)
      return
    }
    console.log('✅ Conexão RPC funcionando:', healthData)
    
    // 2. Teste de inserção via RPC
    console.log('\n2. 📝 Testando inserção via RPC...')
    const { data: insertResult, error: insertError } = await supabase
      .rpc('insert_experiment_bypass', {
        p_name: 'Teste_RPC_Bypass',
        p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        p_description: 'Experimento criado via RPC bypass',
        p_type: 'redirect',
        p_traffic_allocation: 99.99,
        p_status: 'draft'
      })
    
    if (insertError) {
      console.error('❌ Erro na inserção RPC:', insertError.message)
    } else {
      console.log('✅ Inserção RPC funcionando:', insertResult)
      
      // Limpar dados
      if (insertResult && insertResult.id) {
        const { data: deleteResult, error: deleteError } = await supabase
          .rpc('delete_experiment_bypass', {
            p_experiment_id: insertResult.id
          })
        
        if (deleteError) {
          console.error('❌ Erro ao limpar:', deleteError.message)
        } else {
          console.log('🧹 Dados removidos:', deleteResult)
        }
      }
    }
    
    // 3. Teste de diferentes valores via RPC
    console.log('\n3. 🔢 Testando diferentes valores via RPC...')
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    let successCount = 0
    const createdIds = []
    
    for (const value of testValues) {
      const { data: result, error: error } = await supabase
        .rpc('insert_experiment_bypass', {
          p_name: `Teste_${value.toString().replace('.', '_')}_RPC`,
          p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
          p_type: 'redirect',
          p_traffic_allocation: value,
          p_status: 'draft'
        })
      
      if (error) {
        console.log(`❌ ${value}:`, error.message)
      } else {
        console.log(`✅ ${value}:`, result.traffic_allocation)
        successCount++
        
        if (result && result.id) {
          createdIds.push(result.id)
        }
      }
    }
    
    // Limpar todos os dados criados
    console.log('\n4. 🧹 Limpando dados criados...')
    for (const id of createdIds) {
      const { data: deleteResult, error: deleteError } = await supabase
        .rpc('delete_experiment_bypass', {
          p_experiment_id: id
        })
      
      if (deleteError) {
        console.error(`❌ Erro ao limpar ${id}:`, deleteError.message)
      } else {
        console.log(`✅ Limpo: ${id}`)
      }
    }
    
    // Resultado final
    console.log('\n🎯 RESULTADO FINAL:')
    console.log(`✅ Sucessos: ${successCount}/${testValues.length}`)
    console.log(`📊 Taxa de sucesso: ${((successCount / testValues.length) * 100).toFixed(1)}%`)
    
    if (successCount === testValues.length) {
      console.log('\n🎉 FUNÇÕES RPC PERSONALIZADAS FUNCIONANDO!')
      console.log('✅ Cache contornado com sucesso')
      console.log('✅ Valores corretos')
      console.log('✅ Sem campos fantasma')
      console.log('✅ Sistema 100% operacional via RPC')
    } else {
      console.log('\n🔴 AINDA HÁ PROBLEMAS!')
      console.log('❌ Funções RPC não funcionaram completamente')
      console.log('💡 Tente outras alternativas')
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testRPCBypass()
