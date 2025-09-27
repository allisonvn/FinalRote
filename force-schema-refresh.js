#!/usr/bin/env node

/**
 * Script para forçar atualização do schema do Supabase
 */

const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase em produção
const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUyNzc2MiwiZXhwIjoyMDczMTAzNzYyfQ.BElrinV8Gkt4VGigpZMX9zbbJI5uYfp2DKQEtF8qbqs'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function forceSchemaRefresh() {
  console.log('🔄 Forçando atualização do schema do Supabase...')
  
  try {
    // 1. Verificar schema atual da tabela experiments
    console.log('\n1. Verificando schema atual...')
    
    const { data: currentSchema, error: schemaError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            column_name,
            data_type,
            numeric_precision,
            numeric_scale,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'experiments' 
          AND data_type = 'numeric'
          ORDER BY column_name;
        `
      })
    
    if (schemaError) {
      console.error('❌ Erro ao verificar schema:', schemaError)
    } else {
      console.log('✅ Schema atual:', currentSchema)
    }
    
    // 2. Tentar inserção simples para diagnosticar
    console.log('\n2. Testando inserção simples...')
    
    const testData = {
      name: 'Teste_Schema_Refresh',
      project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
      description: 'Teste para diagnóstico',
      type: 'redirect',
      status: 'draft'
    }
    
    console.log('📝 Dados mínimos:', testData)
    
    const { data: minimalResult, error: minimalError } = await supabase
      .from('experiments')
      .insert(testData)
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
    
    // 3. Tentar inserção com traffic_allocation específico
    console.log('\n3. Testando com traffic_allocation...')
    
    const testDataWithTraffic = {
      name: 'Teste_Traffic',
      project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
      description: 'Teste com traffic allocation',
      type: 'redirect',
      traffic_allocation: 50.00,
      status: 'draft'
    }
    
    console.log('📝 Dados com traffic:', testDataWithTraffic)
    
    const { data: trafficResult, error: trafficError } = await supabase
      .from('experiments')
      .insert(testDataWithTraffic)
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
    
    // 4. Tentar diferentes valores de traffic_allocation
    console.log('\n4. Testando diferentes valores...')
    
    const testValues = [1.00, 10.00, 25.50, 50.00, 75.25, 99.99]
    
    for (const value of testValues) {
      const testData = {
        name: `Teste_${value.toString().replace('.', '_')}`,
        project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        description: `Teste com ${value}`,
        type: 'redirect',
        traffic_allocation: value,
        status: 'draft'
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
    
    console.log('\n🎉 Teste de schema concluído!')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
forceSchemaRefresh()
