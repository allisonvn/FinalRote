#!/usr/bin/env node

/**
 * Teste com as novas chaves do Supabase
 */

const { createClient } = require('@supabase/supabase-js')

// Novas configurações do Supabase
const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const newAnonKey = 'sb_publishable_VB9zymtEviqYQ4SqmjogBg_3hezA0cH'
const newServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkwODM5NiwiZXhwIjoyMDc0NDg0Mzk2fQ.7zhL3Voxz1QlmdidaRGY3XTkkBxoaojuY8aBK0xPeHg'

const supabaseAnon = createClient(supabaseUrl, newAnonKey)
const supabaseService = createClient(supabaseUrl, newServiceKey)

async function testNewKeys() {
  console.log('🔑 Testando com as novas chaves do Supabase...')
  console.log('📡 URL:', supabaseUrl)
  console.log('🔑 Anon Key:', newAnonKey.substring(0, 20) + '...')
  console.log('🔑 Service Key:', newServiceKey.substring(0, 20) + '...')
  
  try {
    // 1. Testar conexão básica com anon key
    console.log('\n1. Testando conexão com anon key...')
    
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('experiments')
      .select('id')
      .limit(1)
    
    if (anonError) {
      console.error('❌ Erro com anon key:', anonError)
    } else {
      console.log('✅ Conexão com anon key funcionando')
    }
    
    // 2. Testar conexão básica com service key
    console.log('\n2. Testando conexão com service key...')
    
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('experiments')
      .select('id')
      .limit(1)
    
    if (serviceError) {
      console.error('❌ Erro com service key:', serviceError)
    } else {
      console.log('✅ Conexão com service key funcionando')
    }
    
    // 3. Testar inserção com service key
    console.log('\n3. Testando inserção com service key...')
    
    const testData = {
      name: 'Teste_New_Keys',
      project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
      description: 'Teste com novas chaves',
      type: 'redirect',
      traffic_allocation: 99.99,
      status: 'draft',
      user_id: 'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
    }
    
    console.log('📝 Dados para inserção:', testData)
    
    const { data: insertResult, error: insertError } = await supabaseService
      .from('experiments')
      .insert(testData)
      .select('id, name, traffic_allocation')
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError)
    } else {
      console.log('✅ Inserção bem-sucedida:', insertResult)
      
      // Limpar
      if (insertResult && insertResult[0]) {
        await supabaseService
          .from('experiments')
          .delete()
          .eq('id', insertResult[0].id)
        console.log('🧹 Dados removidos')
      }
    }
    
    // 4. Testar função RPC com service key
    console.log('\n4. Testando função RPC com service key...')
    
    const { data: rpcResult, error: rpcError } = await supabaseService
      .rpc('insert_experiment_direct', {
        p_name: 'Teste_RPC_New_Keys',
        p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        p_description: 'Teste RPC com novas chaves',
        p_type: 'redirect',
        p_traffic_allocation: 99.99,
        p_status: 'draft',
        p_user_id: 'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
      })
    
    if (rpcError) {
      console.error('❌ Erro com RPC:', rpcError)
    } else {
      console.log('✅ RPC funcionando:', rpcResult)
      
      // Limpar
      if (rpcResult && rpcResult[0]) {
        await supabaseService
          .from('experiments')
          .delete()
          .eq('id', rpcResult[0].id)
        console.log('🧹 Dados removidos')
      }
    }
    
    // 5. Testar diferentes valores
    console.log('\n5. Testando diferentes valores...')
    
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    
    for (const value of testValues) {
      const { data: result, error: error } = await supabaseService
        .from('experiments')
        .insert({
          name: `Teste_${value.toString().replace('.', '_')}_New_Keys`,
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
        await supabaseService
          .from('experiments')
          .delete()
          .eq('id', result[0].id)
      }
    }
    
    console.log('\n🎉 TESTE COM NOVAS CHAVES CONCLUÍDO!')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testNewKeys()
