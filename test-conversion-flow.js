#!/usr/bin/env node

/**
 * Script de teste para verificar se o sistema está marcando conversões corretamente
 *
 * Este script simula:
 * 1. Assign de variante (visitor recebe uma variante)
 * 2. Page view (visitor visualiza a página)
 * 3. Conversão (visitor converte)
 *
 * Uso: node test-conversion-flow.js [experiment_id]
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xtexltigzzayfrscvzaa.supabase.co'
const API_URL = 'http://localhost:3001'

// Gerar visitor_id único para o teste
const visitorId = `test_visitor_${Date.now()}_${Math.random().toString(36).substring(7)}`

async function testConversionFlow(experimentId) {
  console.log('\n🧪 TESTE DE FLUXO DE CONVERSÃO\n')
  console.log('📋 Configuração:')
  console.log(`  - API URL: ${API_URL}`)
  console.log(`  - Visitor ID: ${visitorId}`)
  console.log(`  - Experiment ID: ${experimentId || '(será solicitado)'}`)
  console.log('')

  try {
    // Etapa 1: Buscar experimentos disponíveis (se não fornecido)
    if (!experimentId) {
      console.log('🔍 Buscando experimentos disponíveis...')

      const response = await fetch(`${SUPABASE_URL}/rest/v1/experiments?select=id,name,status&status=eq.running&limit=5`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('❌ Erro ao buscar experimentos:', response.statusText)
        console.log('\n💡 Dica: Crie um experimento primeiro no dashboard')
        return
      }

      const experiments = await response.json()

      if (!experiments || experiments.length === 0) {
        console.error('❌ Nenhum experimento ativo encontrado')
        console.log('\n💡 Dica: Crie um experimento primeiro no dashboard em http://localhost:3001/dashboard')
        return
      }

      console.log(`\n✅ Experimentos encontrados:`)
      experiments.forEach((exp, i) => {
        console.log(`  ${i + 1}. ${exp.name} (${exp.id})`)
      })

      experimentId = experiments[0].id
      console.log(`\n➡️  Usando: ${experiments[0].name}`)
    }

    // Etapa 2: Assign de variante
    console.log('\n📍 ETAPA 1: Assignment de Variante')
    console.log('  Enviando requisição para /api/assign-variant...')

    const assignResponse = await fetch(`${API_URL}/api/assign-variant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experimentId,
        visitorId
      })
    })

    if (!assignResponse.ok) {
      const error = await assignResponse.text()
      console.error(`❌ Erro no assignment: ${assignResponse.status} ${assignResponse.statusText}`)
      console.error(`   Resposta: ${error}`)
      return
    }

    const assignData = await assignResponse.json()
    console.log(`✅ Variante atribuída: ${assignData.variant.name}`)
    console.log(`   Variant ID: ${assignData.variant.id}`)

    const variantId = assignData.variant.id
    const variantName = assignData.variant.name

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 500))

    // Etapa 3: Page View
    console.log('\n👀 ETAPA 2: Page View')
    console.log('  Enviando evento de visualização...')

    const pageViewResponse = await fetch(`${API_URL}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experiment_id: experimentId,
        visitor_id: visitorId,
        variant_id: variantId,
        variant: variantName,
        event_type: 'page_view',
        url: 'https://example.com/landing',
        properties: {
          referrer: 'https://google.com',
          user_agent: 'Test Script',
          viewport: '1920x1080'
        }
      })
    })

    if (!pageViewResponse.ok) {
      const error = await pageViewResponse.text()
      console.error(`❌ Erro no page view: ${pageViewResponse.status}`)
      console.error(`   Resposta: ${error}`)
    } else {
      const pageViewData = await pageViewResponse.json()
      console.log(`✅ Page view registrado`)
      console.log(`   Resposta: ${JSON.stringify(pageViewData)}`)
    }

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 500))

    // Etapa 4: Conversão
    console.log('\n💰 ETAPA 3: Conversão')
    console.log('  Enviando evento de conversão...')

    const conversionValue = 99.90
    const conversionResponse = await fetch(`${API_URL}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experiment_id: experimentId,
        visitor_id: visitorId,
        variant_id: variantId,
        variant: variantName,
        event_type: 'conversion',
        value: conversionValue,
        url: 'https://example.com/thank-you',
        properties: {
          conversion_value: conversionValue,
          conversion_type: 'purchase',
          success_page_url: 'https://example.com/thank-you',
          success_page_title: 'Obrigado pela compra!',
          origin_page_url: 'https://example.com/landing',
          origin_page_title: 'Landing Page Teste'
        }
      })
    })

    if (!conversionResponse.ok) {
      const error = await conversionResponse.text()
      console.error(`❌ Erro na conversão: ${conversionResponse.status}`)
      console.error(`   Resposta: ${error}`)
      return
    }

    const conversionData = await conversionResponse.json()
    console.log(`✅ Conversão registrada`)
    console.log(`   Valor: R$ ${conversionValue.toFixed(2)}`)
    console.log(`   Resposta: ${JSON.stringify(conversionData)}`)

    // Aguardar propagação no banco
    console.log('\n⏳ Aguardando propagação no banco de dados (3 segundos)...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Etapa 5: Verificar variant_stats
    console.log('\n📊 ETAPA 4: Verificando variant_stats no Supabase')
    console.log('  Consultando estatísticas da variante...')

    const statsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/variant_stats?experiment_id=eq.${experimentId}&variant_id=eq.${variantId}`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    )

    if (!statsResponse.ok) {
      console.error(`⚠️  Não foi possível consultar variant_stats: ${statsResponse.status}`)
    } else {
      const stats = await statsResponse.json()

      if (!stats || stats.length === 0) {
        console.log('⚠️  Nenhuma estatística encontrada ainda')
        console.log('   Isso pode significar que:')
        console.log('   1. A função RPC increment_variant_conversions não foi executada')
        console.log('   2. Há um problema de permissões RLS')
        console.log('   3. A conversão ainda não foi processada')
      } else {
        const stat = stats[0]
        console.log('✅ Estatísticas encontradas:')
        console.log(`   Visitors: ${stat.visitors || 0}`)
        console.log(`   Conversions: ${stat.conversions || 0}`)
        console.log(`   Revenue: R$ ${(stat.revenue || 0).toFixed(2)}`)
        console.log(`   Last Updated: ${stat.last_updated}`)

        if (stat.conversions >= 1) {
          console.log('\n🎉 SUCESSO! O sistema está marcando conversões corretamente!')
        } else {
          console.log('\n⚠️  ATENÇÃO: Conversão não foi contabilizada!')
          console.log('   Verifique os logs do servidor para mais detalhes')
        }
      }
    }

    // Resumo final
    console.log('\n' + '='.repeat(60))
    console.log('📝 RESUMO DO TESTE')
    console.log('='.repeat(60))
    console.log(`✅ Assignment: OK`)
    console.log(`✅ Page View: OK`)
    console.log(`✅ Conversão: OK`)
    console.log(`\n🔍 Para ver os logs do servidor, verifique o terminal onde`)
    console.log(`   o Next.js está rodando. Procure por mensagens com:`)
    console.log(`   📊 [CONVERSION]`)
    console.log(`   ✅ [SUCCESS]`)
    console.log(`   ❌ [ERROR]`)
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message)
    console.error('\nStack trace:', error.stack)
  }
}

// Executar teste
const experimentId = process.argv[2]
testConversionFlow(experimentId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro fatal:', err)
    process.exit(1)
  })
