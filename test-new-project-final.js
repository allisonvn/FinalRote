#!/usr/bin/env node

/**
 * Teste final do novo projeto Supabase
 */

const { createClient } = require('@supabase/supabase-js')

// NOVAS CONFIGURAÇÕES - CHAVE ANON
const supabaseUrl = 'https://ypoxxzkuetblrtphoaxr.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3h4emt1ZXRibHJ0cGhvYXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTEzNDQsImV4cCI6MjA3NDQ4NzM0NH0.I7F5VnDMBX2CbijZu0ePzv5SxZqqpjUxoZq_R7wVd6A'

const supabase = createClient(supabaseUrl, anonKey)

async function testNewProjectFinal() {
  console.log('🎯 TESTE FINAL DO NOVO PROJETO SUPABASE')
  console.log('📡 URL:', supabaseUrl)
  console.log('🔑 Anon Key:', anonKey ? '✅ Carregada' : '❌ Não encontrada')
  
  try {
    // 1. Teste de conexão básica
    console.log('\n1. 🔌 Testando conexão básica...')
    const { data: healthData, error: healthError } = await supabase
      .from('experiments')
      .select('id')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Erro na conexão:', healthError.message)
      console.log('🔍 Cache de schema ainda corrompido')
      return
    }
    console.log('✅ Conexão funcionando')
    
    // 2. Teste de inserção
    console.log('\n2. 📝 Testando inserção...')
    const { data: insertResult, error: insertError } = await supabase
      .from('experiments')
      .insert({
        name: 'Teste_Novo_Projeto_Final',
        project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        type: 'redirect',
        traffic_allocation: 99.99,
        status: 'draft'
      })
      .select('id, name, traffic_allocation')
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError.message)
      console.log('🔍 Campo "key" fantasma ainda presente - cache não limpo')
    } else {
      console.log('✅ Inserção funcionando:', insertResult[0])
      
      // Limpar
      await supabase
        .from('experiments')
        .delete()
        .eq('id', insertResult[0].id)
      console.log('🧹 Dados removidos')
    }
    
    // 3. Teste de diferentes valores
    console.log('\n3. 🔢 Testando diferentes valores...')
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    let successCount = 0
    
    for (const value of testValues) {
      const { data: result, error: error } = await supabase
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
        await supabase
          .from('experiments')
          .delete()
          .eq('id', result[0].id)
      }
    }
    
    // 4. Teste de inserção mínima
    console.log('\n4. 📋 Testando inserção mínima...')
    const { data: minResult, error: minError } = await supabase
      .from('experiments')
      .insert({
        name: 'Teste_Minimal_Final',
        project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        type: 'redirect'
      })
      .select('id, name')
    
    if (minError) {
      console.error('❌ Erro com inserção mínima:', minError.message)
    } else {
      console.log('✅ Inserção mínima funcionando:', minResult[0])
      successCount++
      
      // Limpar
      await supabase
        .from('experiments')
        .delete()
        .eq('id', minResult[0].id)
    }
    
    // Resultado final
    console.log('\n🎯 RESULTADO FINAL:')
    console.log(`✅ Sucessos: ${successCount}/${testValues.length + 2}`)
    console.log(`📊 Taxa de sucesso: ${((successCount / (testValues.length + 2)) * 100).toFixed(1)}%`)
    
    if (successCount === testValues.length + 2) {
      console.log('\n🎉 NOVO PROJETO FUNCIONANDO PERFEITAMENTE!')
      console.log('✅ Cache limpo')
      console.log('✅ Valores corretos')
      console.log('✅ Sem campos fantasma')
      console.log('✅ Sistema 100% operacional')
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
testNewProjectFinal()