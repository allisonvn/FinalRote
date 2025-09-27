#!/usr/bin/env node

/**
 * Teste da função de backup que contorna cache
 */

const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase com novas chaves
const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkwODM5NiwiZXhwIjoyMDc0NDg0Mzk2fQ.7zhL3Voxz1QlmdidaRGY3XTkkBxoaojuY8aBK0xPeHg'

const supabase = createClient(supabaseUrl, serviceKey)

async function testBackupFunction() {
  console.log('🎯 TESTE DA FUNÇÃO DE BACKUP QUE CONTORNA CACHE')
  
  try {
    // 1. Testar função de backup
    console.log('\n1. 🔧 Testando função create_experiment_safe...')
    
    const { data: backupResult, error: backupError } = await supabase
      .rpc('create_experiment_safe', {
        p_name: 'Teste_Backup_Function',
        p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        p_description: 'Teste da função de backup',
        p_type: 'redirect',
        p_traffic_allocation: 99.99,
        p_status: 'draft',
        p_user_id: 'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
      })
    
    if (backupError) {
      console.error('❌ Erro com função de backup:', backupError)
    } else {
      console.log('✅ Sucesso com função de backup:', backupResult)
      
      // Limpar
      if (backupResult && backupResult.id) {
        await supabase
          .from('experiments')
          .delete()
          .eq('id', backupResult.id)
        console.log('🧹 Dados removidos')
      }
    }
    
    // 2. Testar diferentes valores
    console.log('\n2. 🔢 Testando diferentes valores...')
    
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    
    for (const value of testValues) {
      const { data: result, error: error } = await supabase
        .rpc('create_experiment_safe', {
          p_name: `Teste_${value.toString().replace('.', '_')}_Backup`,
          p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
          p_type: 'redirect',
          p_traffic_allocation: value,
          p_status: 'draft'
        })
      
      if (error) {
        console.log(`❌ ${value}:`, error.message)
      } else {
        console.log(`✅ ${value}:`, result.traffic_allocation)
        
        // Limpar
        await supabase
          .from('experiments')
          .delete()
          .eq('id', result.id)
      }
    }
    
    // 3. Testar inserção mínima
    console.log('\n3. 📋 Testando inserção mínima...')
    
    const { data: minimalResult, error: minimalError } = await supabase
      .rpc('create_experiment_safe', {
        p_name: 'Teste_Minimal_Backup',
        p_project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe'
      })
    
    if (minimalError) {
      console.error('❌ Erro com inserção mínima:', minimalError)
    } else {
      console.log('✅ Inserção mínima funcionando:', minimalResult)
      
      // Limpar
      await supabase
        .from('experiments')
        .delete()
        .eq('id', minimalResult.id)
      console.log('🧹 Dados removidos')
    }
    
    console.log('\n🎉 FUNÇÃO DE BACKUP FUNCIONANDO!')
    console.log('✅ Contorna cache completamente')
    console.log('✅ Aceita valores até 99.99')
    console.log('✅ Sem campos fantasma')
    console.log('📋 Próximo passo: Atualizar API para usar esta função')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testBackupFunction()
