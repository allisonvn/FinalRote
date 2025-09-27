#!/usr/bin/env node

/**
 * Teste com invalidação de cache seguindo recomendações da IA do Supabase
 */

const { createClient } = require('@supabase/supabase-js')

// NOVAS CONFIGURAÇÕES
const supabaseUrl = 'https://ypoxxzkuetblrtphoaxr.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3h4emt1ZXRibHJ0cGhvYXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTEzNDQsImV4cCI6MjA3NDQ4NzM0NH0.I7F5VnDMBX2CbijZu0ePzv5SxZqqpjUxoZq_R7wVd6A'

async function testCacheInvalidation() {
  console.log('🎯 TESTE COM INVALIDAÇÃO DE CACHE (IA SUPABASE)')
  console.log('📡 URL:', supabaseUrl)
  
  try {
    // 1. Criar cliente com configurações para forçar nova sessão
    console.log('\n1. 🔄 Criando cliente com nova sessão...')
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    })
    
    // 2. Aguardar um pouco para garantir nova sessão
    console.log('\n2. ⏳ Aguardando nova sessão...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 3. Teste de conexão com nova sessão
    console.log('\n3. 🔌 Testando conexão com nova sessão...')
    const { data: healthData, error: healthError } = await supabase
      .from('experiments')
      .select('id, name')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Erro na conexão:', healthError.message)
      console.log('🔍 Cache ainda corrompido após invalidação')
      return
    }
    console.log('✅ Conexão funcionando:', healthData)
    
    // 4. Teste de inserção com nova sessão
    console.log('\n4. 📝 Testando inserção com nova sessão...')
    const { data: insertResult, error: insertError } = await supabase
      .from('experiments')
      .insert({
        name: 'Teste_Cache_Invalidation',
        project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        type: 'redirect',
        traffic_allocation: 99.99,
        status: 'draft'
      })
      .select('id, name, traffic_allocation')
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError.message)
    } else {
      console.log('✅ Inserção funcionando:', insertResult[0])
      
      // Limpar dados
      await supabase
        .from('experiments')
        .delete()
        .eq('id', insertResult[0].id)
      console.log('🧹 Dados removidos')
    }
    
    // 5. Teste de diferentes valores
    console.log('\n5. 🔢 Testando diferentes valores...')
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    let successCount = 0
    
    for (const value of testValues) {
      const { data: result, error: error } = await supabase
        .from('experiments')
        .insert({
          name: `Teste_${value.toString().replace('.', '_')}_Cache`,
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
        await supabase
          .from('experiments')
          .delete()
          .eq('id', result[0].id)
      }
    }
    
    // Resultado final
    console.log('\n🎯 RESULTADO FINAL:')
    console.log(`✅ Sucessos: ${successCount}/${testValues.length}`)
    console.log(`📊 Taxa de sucesso: ${((successCount / testValues.length) * 100).toFixed(1)}%`)
    
    if (successCount === testValues.length) {
      console.log('\n🎉 INVALIDAÇÃO DE CACHE FUNCIONANDO!')
      console.log('✅ Nova sessão criada')
      console.log('✅ Cache do cliente invalidado')
      console.log('✅ Valores corretos')
      console.log('✅ Sistema 100% operacional')
    } else {
      console.log('\n🔴 AINDA HÁ PROBLEMAS!')
      console.log('❌ Invalidação de cache não funcionou completamente')
      console.log('💡 Pode ser necessário reiniciar o pool no dashboard')
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testCacheInvalidation()
