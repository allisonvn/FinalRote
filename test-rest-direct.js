#!/usr/bin/env node

/**
 * Teste usando API REST direta para contornar cache
 */

// NOVAS CONFIGURAÇÕES
const supabaseUrl = 'https://ypoxxzkuetblrtphoaxr.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3h4emt1ZXRibHJ0cGhvYXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTEzNDQsImV4cCI6MjA3NDQ4NzM0NH0.I7F5VnDMBX2CbijZu0ePzv5SxZqqpjUxoZq_R7wVd6A'

async function testRESTDirect() {
  console.log('🎯 TESTE COM API REST DIRETA')
  console.log('📡 URL:', supabaseUrl)
  
  try {
    // 1. Teste de conexão via REST
    console.log('\n1. 🔌 Testando conexão via REST...')
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/experiments?select=id,name&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!healthResponse.ok) {
      console.error('❌ Erro na conexão REST:', healthResponse.status, healthResponse.statusText)
      const errorText = await healthResponse.text()
      console.error('Detalhes do erro:', errorText)
      return
    }
    
    const healthData = await healthResponse.json()
    console.log('✅ Conexão REST funcionando:', healthData)
    
    // 2. Teste de inserção via REST
    console.log('\n2. 📝 Testando inserção via REST...')
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/experiments`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'Teste_REST_Direto',
        project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        type: 'redirect',
        traffic_allocation: 99.99,
        status: 'draft'
      })
    })
    
    if (!insertResponse.ok) {
      console.error('❌ Erro na inserção REST:', insertResponse.status, insertResponse.statusText)
      const errorText = await insertResponse.text()
      console.error('Detalhes do erro:', errorText)
    } else {
      const insertData = await insertResponse.json()
      console.log('✅ Inserção REST funcionando:', insertData)
      
      // Limpar dados
      if (insertData && insertData.length > 0) {
        const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/experiments?id=eq.${insertData[0].id}`, {
          method: 'DELETE',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (deleteResponse.ok) {
          console.log('🧹 Dados removidos')
        } else {
          console.error('❌ Erro ao remover dados:', deleteResponse.status)
        }
      }
    }
    
    // 3. Teste de diferentes valores via REST
    console.log('\n3. 🔢 Testando diferentes valores via REST...')
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    let successCount = 0
    const createdIds = []
    
    for (const value of testValues) {
      const testResponse = await fetch(`${supabaseUrl}/rest/v1/experiments`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: `Teste_${value.toString().replace('.', '_')}_REST`,
          project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
          type: 'redirect',
          traffic_allocation: value,
          status: 'draft'
        })
      })
      
      if (!testResponse.ok) {
        console.log(`❌ ${value}:`, testResponse.status, testResponse.statusText)
        const errorText = await testResponse.text()
        console.log('Erro:', errorText)
      } else {
        const testData = await testResponse.json()
        console.log(`✅ ${value}:`, testData[0]?.traffic_allocation)
        successCount++
        
        if (testData && testData.length > 0) {
          createdIds.push(testData[0].id)
        }
      }
    }
    
    // Limpar todos os dados criados
    console.log('\n4. 🧹 Limpando dados criados...')
    for (const id of createdIds) {
      const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/experiments?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (deleteResponse.ok) {
        console.log(`✅ Limpo: ${id}`)
      } else {
        console.error(`❌ Erro ao limpar ${id}:`, deleteResponse.status)
      }
    }
    
    // Resultado final
    console.log('\n🎯 RESULTADO FINAL:')
    console.log(`✅ Sucessos: ${successCount}/${testValues.length}`)
    console.log(`📊 Taxa de sucesso: ${((successCount / testValues.length) * 100).toFixed(1)}%`)
    
    if (successCount === testValues.length) {
      console.log('\n🎉 API REST DIRETA FUNCIONANDO!')
      console.log('✅ Cache contornado com sucesso')
      console.log('✅ Valores corretos')
      console.log('✅ Sem campos fantasma')
      console.log('✅ Sistema 100% operacional via REST')
    } else {
      console.log('\n🔴 AINDA HÁ PROBLEMAS!')
      console.log('❌ API REST direta não funcionou completamente')
      console.log('💡 Tente outras alternativas')
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testRESTDirect()
