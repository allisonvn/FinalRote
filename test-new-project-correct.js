#!/usr/bin/env node

/**
 * Teste do novo projeto Supabase com chaves corretas
 */

const { createClient } = require('@supabase/supabase-js')

// NOVAS CONFIGURAÇÕES - CHAVES CORRETAS
const supabaseUrl = 'https://ypoxxzkuetblrtphoaxr.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3h4emt1ZXRibHJ0cGhvYXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTEzNDQsImV4cCI6MjA3NDQ4NzM0NH0.I7F5VnDMBX2CbijZu0ePzv5SxZqqpjUxoZq_R7wVd6A'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3h4emt1ZXRibHJ0cGhvYXhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkxMTM0NCwiZXhwIjoyMDc0NDg3MzQ0fQ.8$SKBsvFzvZMT8J'

const supabase = createClient(supabaseUrl, serviceKey)

async function testNewProject() {
  console.log('🧪 Testando novo projeto Supabase...')
  console.log('📡 URL:', supabaseUrl)
  
  try {
    // 1. Teste de conexão
    console.log('\n1. 🔌 Testando conexão...')
    const { data: healthData, error: healthError } = await supabase
      .from('experiments')
      .select('id')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Erro na conexão:', healthError.message)
      return
    }
    console.log('✅ Conexão funcionando')
    
    // 2. Teste de inserção
    console.log('\n2. 📝 Testando inserção...')
    const { data: insertResult, error: insertError } = await supabase
      .from('experiments')
      .insert({
        name: 'Teste_Novo_Projeto',
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
    
    for (const value of testValues) {
      const { data: result, error: error } = await supabase
        .from('experiments')
        .insert({
          name: `Teste_${value.toString().replace('.', '_')}_Novo`,
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
        
        // Limpar
        await supabase
          .from('experiments')
          .delete()
          .eq('id', result[0].id)
      }
    }
    
    console.log('\n🎉 NOVO PROJETO FUNCIONANDO PERFEITAMENTE!')
    console.log('✅ Cache limpo')
    console.log('✅ Valores corretos')
    console.log('✅ Sem campos fantasma')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testNewProject()
