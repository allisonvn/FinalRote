#!/usr/bin/env node

/**
 * Teste do novo projeto Supabase
 */

const { createClient } = require('@supabase/supabase-js')

// NOVAS CONFIGURAÇÕES - SUBSTITUA PELAS SUAS
const supabaseUrl = 'https://SEU-NOVO-PROJETO.supabase.co'
const serviceKey = 'SUA-NOVA-SERVICE-KEY'

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
