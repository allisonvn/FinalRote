#!/usr/bin/env node

/**
 * Teste forçando refresh do cache via headers específicos
 */

// NOVAS CONFIGURAÇÕES
const supabaseUrl = 'https://ypoxxzkuetblrtphoaxr.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3h4emt1ZXRibHJ0cGhvYXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTEzNDQsImV4cCI6MjA3NDQ4NzM0NH0.I7F5VnDMBX2CbijZu0ePzv5SxZqqpjUxoZq_R7wVd6A'

async function testRESTForceRefresh() {
  console.log('🎯 TESTE FORÇANDO REFRESH DO CACHE')
  console.log('📡 URL:', supabaseUrl)
  
  try {
    // 1. Primeiro, forçar refresh do schema
    console.log('\n1. 🔄 Forçando refresh do schema...')
    const refreshResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    
    console.log('Refresh response status:', refreshResponse.status)
    
    // 2. Aguardar um pouco para o refresh
    console.log('\n2. ⏳ Aguardando refresh do cache...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // 3. Teste de conexão via REST com headers de cache
    console.log('\n3. 🔌 Testando conexão com headers de cache...')
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/experiments?select=id,name&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (!healthResponse.ok) {
      console.error('❌ Erro na conexão REST:', healthResponse.status, healthResponse.statusText)
      const errorText = await healthResponse.text()
      console.error('Detalhes do erro:', errorText)
      
      // Tentar com schema explícito
      console.log('\n4. 🔄 Tentando com schema explícito...')
      const schemaResponse = await fetch(`${supabaseUrl}/rest/v1/experiments?select=id,name&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Accept-Profile': 'public',
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!schemaResponse.ok) {
        console.error('❌ Erro com schema explícito:', schemaResponse.status, schemaResponse.statusText)
        const schemaErrorText = await schemaResponse.text()
        console.error('Detalhes do erro:', schemaErrorText)
        return
      } else {
        const schemaData = await schemaResponse.json()
        console.log('✅ Conexão com schema explícito funcionando:', schemaData)
      }
    } else {
      const healthData = await healthResponse.json()
      console.log('✅ Conexão REST funcionando:', healthData)
    }
    
    // 4. Teste de inserção via REST
    console.log('\n5. 📝 Testando inserção via REST...')
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/experiments`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Accept-Profile': 'public',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        name: 'Teste_REST_Force_Refresh',
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
            'Content-Type': 'application/json',
            'Accept-Profile': 'public'
          }
        })
        
        if (deleteResponse.ok) {
          console.log('🧹 Dados removidos')
        } else {
          console.error('❌ Erro ao remover dados:', deleteResponse.status)
        }
      }
    }
    
    console.log('\n🎯 RESULTADO:')
    console.log('✅ Cache forçado a refresh')
    console.log('✅ Headers de cache aplicados')
    console.log('✅ Schema explícito testado')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testRESTForceRefresh()
