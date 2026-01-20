import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { selectVariant as selectVariantMAB, MABAlgorithms } from '@/lib/mab-algorithms'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RF-Version, X-Requested-With',
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 [DEBUG] Iniciando POST /api/experiments/[id]/assign')
    const { id } = await params
    const experimentId = id
    console.log('🔍 [DEBUG] Experiment ID:', experimentId)
    
    const body = await request.json()
    console.log('🔍 [DEBUG] Request body:', body)
    const { visitor_id: visitorId, user_agent: userAgent, url, referrer, viewport, timestamp } = body

    if (!visitorId) {
      console.log('❌ [ERROR] visitor_id is required')
      return NextResponse.json({ error: 'visitor_id is required' }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // ✅ Usar service client que tem permissões para acessar dados sem autenticação
    const supabase = createServiceClient()

    // 1. Verificar se o experimento existe e está rodando
    const { data: experiment, error: experimentError } = await supabase
      .from('experiments')
      .select('id, name, status, traffic_allocation, type, project_id, algorithm, conversion_url, conversion_value, conversion_type')
      .eq('id', experimentId)
      .single() as any

    if (experimentError || !experiment) {
      console.log('❌ [ERROR] Experiment not found:', experimentError)
      return NextResponse.json({ error: 'Experiment not found' }, { 
        status: 404,
        headers: corsHeaders 
      })
    }

    if ((experiment as any).status !== 'running') {
      console.log('❌ [ERROR] Experiment is not running. Status:', (experiment as any).status)
      return NextResponse.json({ error: 'Experiment is not running' }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    const algorithmType = experiment.algorithm || 'uniform'
    console.log('✅ [DEBUG] Experiment found:', experiment.name, 'Status:', experiment.status, 'Algorithm:', algorithmType)

    // 2. Verificar se já existe uma atribuição para este visitante
    const { data: existingAssignment, error: assignmentError } = await supabase
      .from('assignments')
      .select(`
        id,
        variant_id,
        assigned_at,
        variant:variants (
          id,
          name,
          description,
          is_control,
          traffic_percentage,
          redirect_url,
          changes,
          css_changes,
          js_changes
        )
      `)
      .eq('experiment_id', experimentId)
      .eq('visitor_id', visitorId)
      .single()

    if (existingAssignment && existingAssignment.variant) {
      const variantData = Array.isArray(existingAssignment.variant) 
        ? existingAssignment.variant[0] 
        : existingAssignment.variant
      console.log('✅ [DEBUG] Returning existing assignment:', variantData?.name)
      
      // Selecionar URL específica se tem múltiplas páginas
      const finalUrl = selectPageForVariant(variantData, visitorId)
      
      return NextResponse.json({
        variant: {
          ...variantData,
          final_url: finalUrl,
          has_multiple_pages: !!variantData.changes?.multipage
        },
        experiment: {
          conversion_url: experiment.conversion_url,
          conversion_value: experiment.conversion_value,
          conversion_type: experiment.conversion_type
        },
        assignment: 'existing',
        assigned_at: existingAssignment.assigned_at
      }, {
        headers: corsHeaders
      })
    }

    console.log('🔍 [DEBUG] No existing assignment found, creating new one')

    // 3. Buscar todas as variantes ativas do experimento
    const { data: variants, error: variantsError } = await supabase
      .from('variants')
      .select('id, name, description, is_control, traffic_percentage, redirect_url, changes, css_changes, js_changes, is_active')
      .eq('experiment_id', experimentId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (variantsError || !variants || variants.length === 0) {
      console.log('❌ [ERROR] No active variants found:', variantsError)
      return NextResponse.json({ error: 'No active variants found' }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    console.log('✅ [DEBUG] Found', variants.length, 'active variants')

    // 4. Buscar estatísticas das variantes para algoritmos MAB
    const statsMap = new Map<string, { visitors: number; conversions: number; revenue: number }>()
    const { data: variantStats, error: statsError } = await supabase
      .from('variant_stats')
      .select('variant_id, visitors, conversions, revenue')
      .eq('experiment_id', experimentId)

    if (statsError) {
      console.log('⚠️ [WARNING] Error fetching variant stats:', statsError.message)
    }

    if (variantStats && variantStats.length > 0) {
      variantStats.forEach((stat: any) => {
        statsMap.set(stat.variant_id, {
          visitors: stat.visitors || 0,
          conversions: stat.conversions || 0,
          revenue: stat.revenue || 0
        })
      })
      console.log('✅ [DEBUG] Loaded stats for', variantStats.length, 'variants')
    } else {
      console.log('⚠️ [WARNING] No variant stats found - using zero values')
    }

    // 5. Selecionar variante usando algoritmo apropriado
    let selectedVariant: any
    let algorithmUsed: string
    let normalizedProbabilities: number[] = []

    // Se há dados suficientes e algoritmo MAB, usar algoritmo inteligente
    const totalVisitors = Array.from(statsMap.values()).reduce((sum, s) => sum + s.visitors, 0)
    const useMAB = algorithmType !== 'uniform' && totalVisitors >= 100 // Mínimo de 100 visitantes para MAB

    if (useMAB) {
      console.log('🧠 [DEBUG] Using MAB algorithm:', algorithmType, 'Total visitors:', totalVisitors)

      // Preparar dados para algoritmo MAB
      const variantStatsArray = variants.map(v => {
        const stats = statsMap.get(v.id) || { visitors: 0, conversions: 0, revenue: 0 }
        return {
          id: v.id,
          key: v.name,
          name: v.name,
          visitors: stats.visitors,
          conversions: stats.conversions,
          revenue: stats.revenue,
          weight: parseFloat(String(v.traffic_percentage || '50')),
          is_control: v.is_control || false
        }
      })

      // ✅ CORREÇÃO: Passar TODAS as variantes para o algoritmo MAB
      // O algoritmo MAB precisa comparar todas as variantes para funcionar corretamente
      const mabResult = selectVariantMAB(variantStatsArray, algorithmType)

      // O resultado contém a variante selecionada diretamente
      const mabSelectedVariant = variants.find(v => v.id === mabResult.selectedVariant.id)

      if (mabSelectedVariant) {
        // Para manter consistência (sticky assignments), usamos hash determinístico
        // combinado com as probabilidades do MAB

        // Calcular probabilidades normalizadas baseadas nos scores do MAB
        // Executar o algoritmo múltiplas vezes para obter distribuição de scores
        const scores = variantStatsArray.map(vs => {
          const result = selectVariantMAB(variantStatsArray, algorithmType)
          // Calcular score baseado na taxa de conversão + bonus de exploração
          const convRate = vs.visitors > 0 ? vs.conversions / vs.visitors : 0.5
          return convRate + (vs.visitors === 0 ? 1 : 0) // Explorar variantes não testadas
        })

        const totalScore = scores.reduce((sum, s) => sum + s, 0)
        normalizedProbabilities = totalScore > 0
          ? scores.map(s => s / totalScore)
          : variants.map(() => 1 / variants.length)

        console.log('📊 [DEBUG] MAB Probabilidades:', normalizedProbabilities.map((p, i) => ({
          variant: variants[i]?.name || `variant_${i}`,
          probability: (p * 100).toFixed(2) + '%'
        })))

        // Usar seed determinístico do usuário para selecionar variante
        // Isso garante que o mesmo usuário sempre vê a mesma variante
        const hash = hashCode(visitorId + experimentId)
        const userSeed = (hash % 1000000) / 1000000 // 0-1

        // Selecionar variante baseado em probabilidades acumuladas
        let cumulative = 0
        let selectedIndex = 0

        for (let i = 0; i < normalizedProbabilities.length; i++) {
          cumulative += normalizedProbabilities[i]!
          if (userSeed < cumulative) {
            selectedIndex = i
            break
          }
        }

        selectedVariant = variants[selectedIndex]
        algorithmUsed = algorithmType + '_deterministic'

        console.log('✅ [DEBUG] MAB selected variant:', selectedVariant.name,
                    'probability:', (normalizedProbabilities[selectedIndex]! * 100).toFixed(2) + '%',
                    'user_seed:', userSeed.toFixed(4))
      } else {
        // Fallback se MAB não encontrou variante
        selectedVariant = selectVariantByHash(visitorId, experimentId, variants)
        algorithmUsed = 'hash_fallback'
      }
    } else {
      // Usar distribuição uniforme baseada em hash (A/B clássico)
      console.log('🎲 [DEBUG] Using hash-based distribution (classic A/B)')
      selectedVariant = selectVariantByHash(visitorId, experimentId, variants)
      algorithmUsed = 'uniform_hash'
    }
    
    if (!selectedVariant) {
      console.log('❌ [ERROR] Failed to select variant')
      return NextResponse.json({ error: 'Failed to select variant' }, { 
        status: 500,
        headers: corsHeaders 
      })
    }
    
    console.log('✅ [DEBUG] Selected variant:', selectedVariant.name, 'Algorithm:', algorithmUsed)

    // 5. Criar atribuição no banco de dados
    const { data: newAssignment, error: insertError } = await supabase
      .from('assignments')
      .insert({
        experiment_id: experimentId,
        variant_id: selectedVariant.id,
        visitor_id: visitorId,
        assigned_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('⚠️ [WARNING] Error creating assignment:', insertError)
      // Não falhar a requisição se houver erro ao salvar assignment
      // O visitante ainda receberá a variante
    } else {
      console.log('✅ [DEBUG] Assignment created successfully')
    }

    // 6. Registrar evento de atribuição
    try {
      await supabase.from('events').insert({
        experiment_id: experimentId,
        variant_id: selectedVariant.id,
        visitor_id: visitorId,
        event_type: 'assignment',
        event_name: 'variant_assigned',
        event_data: {
          variant_name: selectedVariant.name,
          is_control: selectedVariant.is_control,
          user_agent: userAgent,
          url: url,
          referrer: referrer,
          viewport: viewport,
          timestamp: timestamp || new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })
      console.log('✅ [DEBUG] Event logged successfully')
    } catch (eventError) {
      console.error('⚠️ [WARNING] Error logging event:', eventError)
      // Não falhar a requisição se houver erro ao registrar evento
    }

    // 7. Atualizar estatísticas da variante
    try {
      console.log('📊 [DEBUG] Incrementing visitor count for variant:', selectedVariant.name)
      const { error: rpcError } = await supabase.rpc('increment_variant_visitors', {
        p_variant_id: selectedVariant.id,
        p_experiment_id: experimentId
      })

      if (rpcError) {
        console.error('❌ [ERROR] Failed to increment visitor count:', rpcError.message)
      } else {
        console.log('✅ [DEBUG] Visitor count incremented successfully')
      }
    } catch (statsUpdateError) {
      console.error('⚠️ [WARNING] Error updating variant stats:', statsUpdateError)
    }

    // 8. Selecionar URL específica se variante tem múltiplas páginas
    const finalUrl = selectPageForVariant(selectedVariant, visitorId)
    
    // 9. Retornar variante selecionada com URL final
    return NextResponse.json({
      variant: {
        ...selectedVariant,
        final_url: finalUrl, // URL final selecionada (pode ser diferente de redirect_url se multipage)
        has_multiple_pages: !!selectedVariant.changes?.multipage
      },
      experiment: {
        conversion_url: experiment.conversion_url,
        conversion_value: experiment.conversion_value,
        conversion_type: experiment.conversion_type
      },
      assignment: 'new',
      algorithm: algorithmUsed,
      mab_enabled: useMAB,
      total_experiment_visitors: totalVisitors
    }, {
      headers: corsHeaders
    })

  } catch (error) {
    console.error('❌ [ERROR] Assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * Seleciona uma variante baseado em hash determinístico do visitor_id + experiment_id
 * Isso garante que o mesmo visitante sempre recebe a mesma variante
 */
function selectVariantByHash(
  visitorId: string, 
  experimentId: string, 
  variants: Array<{
    id: string
    name: string
    description: string | null
    is_control: boolean | null
    traffic_percentage: string | number | null
    redirect_url: string | null
    changes: any
    css_changes: string | null
    js_changes: string | null
  }>
) {
  // Gerar hash determinístico
  const hash = hashCode(visitorId + experimentId)
  const percentage = Math.abs(hash % 100)
  
  console.log('🔍 [DEBUG] Hash:', hash, 'Percentage:', percentage)
  
  // Ordenar variantes por criação (controle primeiro) e distribuir tráfego
  let cumulative = 0
  
  for (const variant of variants) {
    const trafficPerc = parseFloat(String(variant.traffic_percentage || '0'))
    cumulative += trafficPerc
    
    console.log('🔍 [DEBUG] Variant:', variant.name, 'Traffic:', trafficPerc, 'Cumulative:', cumulative)
    
    if (percentage < cumulative) {
      return variant
    }
  }
  
  // Fallback: retornar primeira variante (controle)
  return variants[0]
}

/**
 * Função auxiliar para criar hash determinístico de uma string
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Seleciona uma página específica quando a variante tem múltiplas URLs
 * Suporta diferentes modos de seleção: random, weighted, sequential
 */
function selectPageForVariant(
  variant: {
    redirect_url: string | null
    changes: any
  },
  visitorId: string
): string {
  // Se não tem múltiplas páginas, retornar redirect_url padrão
  if (!variant.changes?.multipage || !variant.changes?.pages || variant.changes.pages.length === 0) {
    return variant.redirect_url || ''
  }

  const pages = variant.changes.pages.filter((p: any) => p.active !== false)
  
  if (pages.length === 0) {
    return variant.redirect_url || ''
  }

  if (pages.length === 1) {
    return pages[0].url
  }

  const mode = variant.changes.selection_mode || 'random'

  // Modo Random: Seleção aleatória determinística (baseada em hash do visitor_id)
  if (mode === 'random') {
    const hash = hashCode(visitorId + 'page_selection')
    const index = hash % pages.length
    console.log('🎲 [DEBUG] Random page selection - Index:', index, 'of', pages.length)
    return pages[index].url
  }

  // Modo Weighted: Seleção ponderada por peso
  if (mode === 'weighted') {
    const totalWeight = pages.reduce((sum: number, p: any) => sum + (p.weight || 1), 0)
    const hash = hashCode(visitorId + 'page_selection')
    let random = (hash % 10000) / 10000 * totalWeight // 0 a totalWeight
    
    for (const page of pages) {
      random -= (page.weight || 1)
      if (random <= 0) {
        console.log('⚖️ [DEBUG] Weighted page selection:', page.url, 'Weight:', page.weight)
        return page.url
      }
    }
    
    // Fallback
    return pages[0].url
  }

  // Modo Sequential: Retorna páginas em sequência baseado em hash
  if (mode === 'sequential') {
    const hash = hashCode(visitorId + 'page_selection')
    const index = hash % pages.length
    console.log('📊 [DEBUG] Sequential page selection - Index:', index)
    return pages[index].url
  }

  // Fallback padrão
  console.log('⚠️ [WARNING] Unknown selection mode:', mode, '- using first page')
  return pages[0].url
}
