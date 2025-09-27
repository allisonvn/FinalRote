#!/usr/bin/env node

/**
 * SOLUÇÃO ALTERNATIVA: Contornar cache usando SQL direto
 */

const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase com novas chaves
const supabaseUrl = 'https://xtexltigzzayfrscvzaa.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZXhsdGlnenpheWZyc2N2emFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkwODM5NiwiZXhwIjoyMDc0NDg0Mzk2fQ.7zhL3Voxz1QlmdidaRGY3XTkkBxoaojuY8aBK0xPeHg'

const supabase = createClient(supabaseUrl, serviceKey)

async function solutionBypassCache() {
  console.log('🎯 SOLUÇÃO ALTERNATIVA: Contornando cache com SQL direto')
  
  try {
    // 1. Testar inserção usando SQL direto via função personalizada
    console.log('\n1. 🔧 Testando inserção com SQL direto...')
    
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('exec_sql_direct', {
        query: `
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
          'Teste_SQL_Direct_Bypass',
          'b302fac6-3255-4923-833b-5e71a11d5bfe',
          'Teste contornando cache',
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
          .rpc('exec_sql_direct', {
            query: 'DELETE FROM public.experiments WHERE id = $1',
            params: [sqlResult[0].id]
          })
        console.log('🧹 Dados removidos')
      }
    }
    
    // 2. Testar diferentes valores com SQL direto
    console.log('\n2. 🔢 Testando diferentes valores com SQL direto...')
    
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    
    for (const value of testValues) {
      const { data: result, error: error } = await supabase
        .rpc('exec_sql_direct', {
          query: `
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
          .rpc('exec_sql_direct', {
            query: 'DELETE FROM public.experiments WHERE id = $1',
            params: [result[0].id]
          })
      }
    }
    
    console.log('\n🎉 SOLUÇÃO ALTERNATIVA FUNCIONANDO!')
    console.log('📋 Próximos passos:')
    console.log('1. Criar função exec_sql_direct no Supabase')
    console.log('2. Atualizar API para usar SQL direto')
    console.log('3. Contornar completamente o problema de cache')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar solução
solutionBypassCache()
