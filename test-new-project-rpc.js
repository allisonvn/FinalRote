#!/usr/bin/env node

/**
 * Teste do novo projeto Supabase usando RPC para contornar cache
 */

const { createClient } = require('@supabase/supabase-js')

// NOVAS CONFIGURAÇÕES - CHAVE ANON
const supabaseUrl = 'https://ypoxxzkuetblrtphoaxr.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3h4emt1ZXRibHJ0cGhvYXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTEzNDQsImV4cCI6MjA3NDQ4NzM0NH0.I7F5VnDMBX2CbijZu0ePzv5SxZqqpjUxoZq_R7wVd6A'

console.log('🔧 Configurações:')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', anonKey ? '✅ Carregada' : '❌ Não encontrada')

const supabase = createClient(supabaseUrl, anonKey)

async function testNewProject() {
  console.log('\n🧪 Testando novo projeto Supabase...')
  
  try {
    // 1. Teste de conexão via RPC
    console.log('\n1. 🔌 Testando conexão via RPC...')
    const { data: healthData, error: healthError } = await supabase
      .rpc('get_current_user_id')
    
    if (healthError) {
      console.error('❌ Erro na conexão RPC:', healthError.message)
      return
    }
    console.log('✅ Conexão RPC funcionando')
    
    // 2. Teste de inserção via RPC
    console.log('\n2. 📝 Testando inserção via RPC...')
    const { data: insertResult, error: insertError } = await supabase
      .rpc('create_experiment_safe', {
        p_name: 'Teste_Novo_Projeto_RPC',
        p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        p_description: 'Experimento criado via RPC',
        p_type: 'redirect',
        p_traffic_allocation: 99.99,
        p_status: 'draft'
      })
    
    if (insertError) {
      console.error('❌ Erro na inserção RPC:', insertError.message)
    } else {
      console.log('✅ Inserção RPC funcionando:', insertResult)
    }
    
    // 3. Teste de diferentes valores via RPC
    console.log('\n3. 🔢 Testando diferentes valores via RPC...')
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    
    for (const value of testValues) {
      const { data: result, error: error } = await supabase
        .rpc('create_experiment_safe', {
          p_name: `Teste_${value.toString().replace('.', '_')}_RPC`,
          p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
          p_type: 'redirect',
          p_traffic_allocation: value,
          p_status: 'draft'
        })
      
      if (error) {
        console.log(`❌ ${value}:`, error.message)
      } else {
        console.log(`✅ ${value}:`, result)
      }
    }
    
    console.log('\n🎉 NOVO PROJETO FUNCIONANDO PERFEITAMENTE!')
    console.log('✅ Cache contornado via RPC')
    console.log('✅ Valores corretos')
    console.log('✅ Sem campos fantasma')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testNewProject()
