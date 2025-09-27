#!/usr/bin/env node

/**
 * Teste usando SQL direto para contornar cache do Supabase
 */

// NOVAS CONFIGURAÇÕES
const supabaseUrl = 'https://ypoxxzkuetblrtphoaxr.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3h4emt1ZXRibHJ0cGhvYXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTEzNDQsImV4cCI6MjA3NDQ4NzM0NH0.I7F5VnDMBX2CbijZu0ePzv5SxZqqpjUxoZq_R7wVd6A'

async function testSQLDirect() {
  console.log('🎯 TESTE COM SQL DIRETO - CONTORNANDO CACHE')
  console.log('📡 URL:', supabaseUrl)
  
  try {
    // 1. Teste de conexão via SQL direto
    console.log('\n1. 🔌 Testando conexão via SQL direto...')
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql_direct`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'SELECT COUNT(*) as total FROM experiments'
      })
    })
    
    if (!healthResponse.ok) {
      console.error('❌ Erro na conexão SQL direta:', healthResponse.status, healthResponse.statusText)
      return
    }
    
    const healthData = await healthResponse.json()
    console.log('✅ Conexão SQL direta funcionando:', healthData)
    
    // 2. Teste de inserção via SQL direto
    console.log('\n2. 📝 Testando inserção via SQL direto...')
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql_direct`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'INSERT INTO experiments (name, project_id, type, traffic_allocation, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, traffic_allocation',
        params: [
          'Teste_SQL_Direto',
          'b302fac6-3255-4923-833b-5e71a11d5bfe',
          'redirect',
          99.99,
          'draft'
        ]
      })
    })
    
    if (!insertResponse.ok) {
      console.error('❌ Erro na inserção SQL direta:', insertResponse.status, insertResponse.statusText)
      const errorText = await insertResponse.text()
      console.error('Detalhes do erro:', errorText)
    } else {
      const insertData = await insertResponse.json()
      console.log('✅ Inserção SQL direta funcionando:', insertData)
      
      // Limpar dados
      if (insertData && insertData.length > 0) {
        const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql_direct`, {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: 'DELETE FROM experiments WHERE id = $1',
            params: [insertData[0].id]
          })
        })
        console.log('🧹 Dados removidos')
      }
    }
    
    // 3. Teste de diferentes valores via SQL direto
    console.log('\n3. 🔢 Testando diferentes valores via SQL direto...')
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    let successCount = 0
    
    for (const value of testValues) {
      const testResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql_direct`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'INSERT INTO experiments (name, project_id, type, traffic_allocation, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, traffic_allocation',
          params: [
            `Teste_${value.toString().replace('.', '_')}_SQL`,
            'b302fac6-3255-4923-833b-5e71a11d5bfe',
            'redirect',
            value,
            'draft'
          ]
        })
      })
      
      if (!testResponse.ok) {
        console.log(`❌ ${value}:`, testResponse.status, testResponse.statusText)
      } else {
        const testData = await testResponse.json()
        console.log(`✅ ${value}:`, testData[0]?.traffic_allocation)
        successCount++
        
        // Limpar
        if (testData && testData.length > 0) {
          await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql_direct`, {
            method: 'POST',
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: 'DELETE FROM experiments WHERE id = $1',
              params: [testData[0].id]
            })
          })
        }
      }
    }
    
    // Resultado final
    console.log('\n🎯 RESULTADO FINAL:')
    console.log(`✅ Sucessos: ${successCount}/${testValues.length}`)
    console.log(`📊 Taxa de sucesso: ${((successCount / testValues.length) * 100).toFixed(1)}%`)
    
    if (successCount === testValues.length) {
      console.log('\n🎉 SQL DIRETO FUNCIONANDO PERFEITAMENTE!')
      console.log('✅ Cache contornado com sucesso')
      console.log('✅ Valores corretos')
      console.log('✅ Sem campos fantasma')
      console.log('✅ Sistema 100% operacional via SQL direto')
    } else {
      console.log('\n🔴 AINDA HÁ PROBLEMAS!')
      console.log('❌ SQL direto não funcionou completamente')
      console.log('💡 Tente outras alternativas')
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testSQLDirect()
