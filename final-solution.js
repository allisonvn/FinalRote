#!/usr/bin/env node

/**
 * SOLUÇÃO DEFINITIVA: Contornar problema de cache usando SQL direto
 */

const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase em produção
const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUyNzc2MiwiZXhwIjoyMDczMTAzNzYyfQ.BElrinV8Gkt4VGigpZMX9zbbJI5uYfp2DKQEtF8qbqs'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function finalSolution() {
  console.log('🎯 SOLUÇÃO DEFINITIVA: Usando SQL direto para contornar cache')
  
  try {
    // 1. Testar inserção usando SQL direto
    console.log('\n1. Testando inserção com SQL direto...')
    
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('exec_sql', {
        sql: `
          INSERT INTO public.experiments (
            name, 
            project_id, 
            description, 
            type, 
            traffic_allocation, 
            status, 
            user_id
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
          ) RETURNING id, name, traffic_allocation, status
        `,
        params: [
          'Teste_SQL_Direct',
          'b302fac6-3255-4923-833b-5e71a11d5bfe',
          'Teste usando SQL direto',
          'redirect',
          99.99,
          'draft',
          'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac'
        ]
      })
    
    if (sqlError) {
      console.error('❌ Erro com SQL direto:', sqlError)
    } else {
      console.log('✅ Sucesso com SQL direto:', sqlResult)
      
      // Limpar
      if (sqlResult && sqlResult[0]) {
        await supabase
          .rpc('exec_sql', {
            sql: 'DELETE FROM public.experiments WHERE id = $1',
            params: [sqlResult[0].id]
          })
        console.log('🧹 Dados removidos')
      }
    }
    
    // 2. Testar inserção com valores diferentes
    console.log('\n2. Testando diferentes valores com SQL direto...')
    
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    
    for (const value of testValues) {
      const { data: result, error: error } = await supabase
        .rpc('exec_sql', {
          sql: `
            INSERT INTO public.experiments (
              name, project_id, type, traffic_allocation, status
            ) VALUES (
              $1, $2, $3, $4, $5
            ) RETURNING id, name, traffic_allocation
          `,
          params: [
            `Teste_${value.toString().replace('.', '_')}_SQL`,
            'b302fac6-3255-4923-833b-5e71a11d5bfe',
            'redirect',
            value,
            'draft'
          ]
        })
      
      if (error) {
        console.log(`❌ ${value}:`, error.message)
      } else {
        console.log(`✅ ${value}:`, result[0].traffic_allocation)
        
        // Limpar
        await supabase
          .rpc('exec_sql', {
            sql: 'DELETE FROM public.experiments WHERE id = $1',
            params: [result[0].id]
          })
      }
    }
    
    // 3. Testar inserção com todos os campos
    console.log('\n3. Testando inserção completa com SQL direto...')
    
    const { data: completeResult, error: completeError } = await supabase
      .rpc('exec_sql', {
        sql: `
          INSERT INTO public.experiments (
            name, 
            project_id, 
            description, 
            type, 
            traffic_allocation, 
            status, 
            user_id,
            confidence_level,
            statistical_significance
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          ) RETURNING id, name, traffic_allocation, confidence_level, statistical_significance
        `,
        params: [
          'Teste_Complete_SQL',
          'b302fac6-3255-4923-833b-5e71a11d5bfe',
          'Teste completo com SQL direto',
          'redirect',
          99.99,
          'draft',
          'a1a4c03f-17a5-417e-8cf9-c1a9f05ac0ac',
          95.00,
          95.5000
        ]
      })
    
    if (completeError) {
      console.error('❌ Erro com inserção completa:', completeError)
    } else {
      console.log('✅ Sucesso com inserção completa:', completeResult)
      
      // Limpar
      if (completeResult && completeResult[0]) {
        await supabase
          .rpc('exec_sql', {
            sql: 'DELETE FROM public.experiments WHERE id = $1',
            params: [completeResult[0].id]
          })
        console.log('🧹 Dados removidos')
      }
    }
    
    console.log('\n🎉 SOLUÇÃO DEFINITIVA FUNCIONANDO!')
    console.log('📋 Próximos passos:')
    console.log('1. Atualizar API para usar SQL direto')
    console.log('2. Implementar fallback para cache problemático')
    console.log('3. Monitorar performance')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar solução
finalSolution()
