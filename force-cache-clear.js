#!/usr/bin/env node

/**
 * Script para forçar limpeza completa do cache do Supabase
 * e testar com configurações otimizadas
 */

const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase em produção
const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUyNzc2MiwiZXhwIjoyMDczMTAzNzYyfQ.BElrinV8Gkt4VGigpZMX9zbbJI5uYfp2DKQEtF8qbqs'

// Criar cliente com configurações para forçar refresh
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: 'public' },
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
  global: { 
    headers: { 
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    } 
  }
})

async function forceCacheClear() {
  console.log('🔄 Forçando limpeza completa do cache...')
  
  try {
    // 1. Testar inserção com dados mínimos (sem campos problemáticos)
    console.log('\n1. Testando inserção mínima...')
    
    const minimalData = {
      name: 'Teste_Cache_Clear',
      project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
      type: 'redirect'
    }
    
    console.log('📝 Dados mínimos:', minimalData)
    
    const { data: minimalResult, error: minimalError } = await supabase
      .from('experiments')
      .insert(minimalData)
      .select('id, name, traffic_allocation')
    
    if (minimalError) {
      console.error('❌ Erro com dados mínimos:', minimalError)
    } else {
      console.log('✅ Sucesso com dados mínimos:', minimalResult)
      
      // Limpar
      if (minimalResult && minimalResult[0]) {
        await supabase
          .from('experiments')
          .delete()
          .eq('id', minimalResult[0].id)
        console.log('🧹 Dados removidos')
      }
    }
    
    // 2. Testar inserção com traffic_allocation específico
    console.log('\n2. Testando com traffic_allocation...')
    
    const trafficData = {
      name: 'Teste_Traffic_Cache',
      project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
      type: 'redirect',
      traffic_allocation: 50.00
    }
    
    console.log('📝 Dados com traffic:', trafficData)
    
    const { data: trafficResult, error: trafficError } = await supabase
      .from('experiments')
      .insert(trafficData)
      .select('id, name, traffic_allocation')
    
    if (trafficError) {
      console.error('❌ Erro com traffic allocation:', trafficError)
    } else {
      console.log('✅ Sucesso com traffic allocation:', trafficResult)
      
      // Limpar
      if (trafficResult && trafficResult[0]) {
        await supabase
          .from('experiments')
          .delete()
          .eq('id', trafficResult[0].id)
        console.log('🧹 Dados removidos')
      }
    }
    
    // 3. Testar inserção com todos os campos necessários
    console.log('\n3. Testando inserção completa...')
    
    const completeData = {
      name: 'Teste_Complete_Cache',
      project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
      description: 'Teste completo para cache',
      type: 'redirect',
      traffic_allocation: 99.99,
      status: 'draft',
      user_id: 'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
    }
    
    console.log('📝 Dados completos:', completeData)
    
    const { data: completeResult, error: completeError } = await supabase
      .from('experiments')
      .insert(completeData)
      .select('id, name, traffic_allocation, status')
    
    if (completeError) {
      console.error('❌ Erro com dados completos:', completeError)
    } else {
      console.log('✅ Sucesso com dados completos:', completeResult)
      
      // Limpar
      if (completeResult && completeResult[0]) {
        await supabase
          .from('experiments')
          .delete()
          .eq('id', completeResult[0].id)
        console.log('🧹 Dados removidos')
      }
    }
    
    // 4. Testar diferentes valores de traffic_allocation
    console.log('\n4. Testando diferentes valores...')
    
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    
    for (const value of testValues) {
      const testData = {
        name: `Teste_${value.toString().replace('.', '_')}_Cache`,
        project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        type: 'redirect',
        traffic_allocation: value
      }
      
      const { data: result, error: error } = await supabase
        .from('experiments')
        .insert(testData)
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
    
    console.log('\n🎉 Teste de limpeza de cache concluído!')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
forceCacheClear()
