import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RF-Version',
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 [DEBUG] Iniciando POST /api/experiments/[id]/assign')
    const experimentId = params.id
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

    // Criar cliente Supabase com service role key para acessar dados
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [ERROR] Supabase credentials not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Verificar se o experimento existe e está rodando
    const { data: experiment, error: experimentError } = await supabase
      .from('experiments')
      .select('id, name, status, traffic_allocation, type, project_id')
      .eq('id', experimentId)
      .single()

    if (experimentError || !experiment) {
      console.log('❌ [ERROR] Experiment not found:', experimentError)
      return NextResponse.json({ error: 'Experiment not found' }, { 
        status: 404,
        headers: corsHeaders 
      })
    }

    if (experiment.status !== 'running') {
      console.log('❌ [ERROR] Experiment is not running. Status:', experiment.status)
      return NextResponse.json({ error: 'Experiment is not running' }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    console.log('✅ [DEBUG] Experiment found:', experiment.name, 'Status:', experiment.status)

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
      return NextResponse.json({
        variant: existingAssignment.variant,
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

    // 4. Selecionar variante baseado em traffic_percentage usando hash determinístico
    const selectedVariant = selectVariantByHash(visitorId, experimentId, variants)
    
    if (!selectedVariant) {
      console.log('❌ [ERROR] Failed to select variant')
      return NextResponse.json({ error: 'Failed to select variant' }, { 
        status: 500,
        headers: corsHeaders 
      })
    }
    
    console.log('✅ [DEBUG] Selected variant:', selectedVariant.name)

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

    // 7. Retornar variante selecionada
    return NextResponse.json({
      variant: selectedVariant,
      assignment: 'new',
      algorithm: 'deterministic_hash'
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
    is_control: boolean
    traffic_percentage: string
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
    const trafficPerc = parseFloat(variant.traffic_percentage || '0')
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
