#!/usr/bin/env node

/**
 * Script para testar conexão com Supabase em produção
 * e forçar refresh do schema
 */

const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase em produção
const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Mjc3NjIsImV4cCI6MjA3MzEwMzc2Mn0.PYV2lIzQAbI8O_WFCy_ELpDIZMLNAOjGp9PKo3-Ilxg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testProductionConnection() {
  console.log('🔍 Testando conexão com Supabase em produção...')
  console.log('📡 URL:', supabaseUrl)
  
  try {
    // 1. Testar conexão básica
    console.log('\n1. Testando conexão básica...')
    const { data: health, error: healthError } = await supabase
      .from('experiments')
      .select('id')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Erro na conexão:', healthError)
      return
    }
    
    console.log('✅ Conexão básica funcionando')
    
    // 2. Verificar schema da tabela experiments
    console.log('\n2. Verificando schema da tabela experiments...')
    const { data: schema, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'experiments' })
    
    if (schemaError) {
      console.log('⚠️ Não foi possível obter schema via RPC, tentando método alternativo...')
      
      // Método alternativo: inserir e verificar
      const testData = {
        name: 'Teste_Schema_Verification',
        project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        description: 'Teste para verificar schema',
        type: 'redirect',
        traffic_allocation: 99.99,
        status: 'draft',
        user_id: 'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
      }
      
      console.log('📝 Dados de teste:', testData)
      
      const { data: insertResult, error: insertError } = await supabase
        .from('experiments')
        .insert(testData)
        .select('id, name, traffic_allocation')
      
      if (insertError) {
        console.error('❌ Erro ao inserir:', insertError)
        console.log('🔍 Detalhes do erro:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        })
      } else {
        console.log('✅ Inserção bem-sucedida:', insertResult)
        
        // Limpar dados de teste
        if (insertResult && insertResult[0]) {
          await supabase
            .from('experiments')
            .delete()
            .eq('id', insertResult[0].id)
          console.log('🧹 Dados de teste removidos')
        }
      }
    } else {
      console.log('✅ Schema obtido:', schema)
    }
    
    // 3. Verificar constraints
    console.log('\n3. Verificando constraints...')
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_table_constraints', { table_name: 'experiments' })
    
    if (constraintsError) {
      console.log('⚠️ Não foi possível obter constraints via RPC')
    } else {
      console.log('✅ Constraints obtidos:', constraints)
    }
    
    // 4. Testar inserção com diferentes valores
    console.log('\n4. Testando inserção com diferentes valores...')
    
    const testValues = [
      { name: 'Teste_50', traffic_allocation: 50.00 },
      { name: 'Teste_99_99', traffic_allocation: 99.99 },
      { name: 'Teste_1', traffic_allocation: 1.00 }
    ]
    
    for (const test of testValues) {
      const testData = {
        name: test.name,
        project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        description: `Teste com ${test.traffic_allocation}`,
        type: 'redirect',
        traffic_allocation: test.traffic_allocation,
        status: 'draft',
        user_id: 'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
      }
      
      const { data: result, error: error } = await supabase
        .from('experiments')
        .insert(testData)
        .select('id, name, traffic_allocation')
      
      if (error) {
        console.log(`❌ ${test.name}:`, error.message)
      } else {
        console.log(`✅ ${test.name}:`, result[0])
        
        // Limpar
        await supabase
          .from('experiments')
          .delete()
          .eq('id', result[0].id)
      }
    }
    
    console.log('\n🎉 Teste de conexão concluído!')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testProductionConnection()
