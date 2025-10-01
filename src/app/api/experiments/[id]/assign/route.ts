import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { visitor_id: userId, user_agent: userAgent, url, referrer, viewport } = body

    // Validar API key
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    console.log('🔍 [DEBUG] API Key:', apiKey)
    if (!apiKey) {
      console.log('❌ [ERROR] API key required')
      return NextResponse.json({ error: 'API key required' }, { 
        status: 401,
        headers: corsHeaders 
      })
    }

    const supabase = createClient()

    // ✅ NOVO: Verificar se é API key do experimento OU do projeto
    let project = null
    let isValidApiKey = false
    let experimentWithKey = null

    // Primeiro, tentar como API key do experimento
    console.log('🔍 [DEBUG] Verificando API key do experimento...')
    const { data: experimentKeyData, error: expKeyError } = await supabase
      .from('experiments')
      .select('id, project_id, api_key')
      .eq('api_key', apiKey)
      .single()

    console.log('🔍 [DEBUG] Experiment key data:', experimentKeyData)
    console.log('🔍 [DEBUG] Experiment key error:', expKeyError)

    if (experimentKeyData && !expKeyError) {
      // API key do experimento encontrada
      console.log('✅ [DEBUG] API key do experimento encontrada')
      project = { id: experimentKeyData.project_id }
      experimentWithKey = experimentKeyData
      isValidApiKey = true
    } else {
      // Fallback: tentar como API key do projeto (compatibilidade)
      console.log('🔍 [DEBUG] Tentando API key do projeto...')
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('api_key', apiKey)
        .single()

      console.log('🔍 [DEBUG] Project data:', projectData)
      console.log('🔍 [DEBUG] Project error:', projectError)

      if (projectData && !projectError) {
        console.log('✅ [DEBUG] API key do projeto encontrada')
        project = projectData
        isValidApiKey = true
      }
    }

    console.log('🔍 [DEBUG] isValidApiKey:', isValidApiKey)
    if (!isValidApiKey) {
      console.log('❌ [ERROR] Invalid API key')
      return NextResponse.json({ error: 'Invalid API key' }, { 
        status: 401,
        headers: corsHeaders 
      })
    }

    // Buscar experimento
    console.log('🔍 [DEBUG] Buscando experimento...')
    let experimentQuery = supabase
      .from('experiments')
      .select(`
        *,
        variants:variants(*)
      `)
      .eq('id', experimentId)

    // Se API key é do experimento, não precisa verificar project_id
    if (experimentWithKey) {
      // API key do experimento - buscar diretamente
      experimentQuery = experimentQuery.single()
    } else {
      // API key do projeto - verificar project_id
      experimentQuery = experimentQuery.eq('project_id', project.id).single()
    }

    const { data: experiment, error: expError } = await experimentQuery
    console.log('🔍 [DEBUG] Experiment data:', experiment)
    console.log('🔍 [DEBUG] Experiment error:', expError)

    if (expError || !experiment) {
      console.log('❌ [ERROR] Experiment not found')
      return NextResponse.json({ error: 'Experiment not found' }, { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Verificar se experimento está ativo
    if (experiment.status !== 'running') {
      console.log('❌ [ERROR] Experiment not running:', experiment.status)
      return NextResponse.json({ error: 'Experiment not running' }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Verificar se já existe atribuição para este usuário
    console.log('🔍 [DEBUG] Verificando atribuição existente...')
    const { data: existingAssignment } = await supabase
      .from('assignments')
      .select(`
        *,
        variant:variants(*)
      `)
      .eq('experiment_id', experimentId)
      .eq('user_id', userId)
      .single()

    console.log('🔍 [DEBUG] Existing assignment:', existingAssignment)

    if (existingAssignment) {
      // Retornar variante já atribuída
      console.log('✅ [DEBUG] Retornando variante existente')
      return NextResponse.json({
        variant: existingAssignment.variant,
        assignment: 'existing'
      }, {
        headers: corsHeaders
      })
    }

    // Verificar se usuário está dentro do tráfego alocado
    const trafficAllocation = experiment.traffic_allocation || 100
    const userHash = hashCode(userId + experimentId) % 100

    if (userHash >= trafficAllocation) {
      // Usuário fora do tráfego, retornar variante de controle
      const controlVariant = experiment.variants.find((v: any) => v.is_control)
      console.log('✅ [DEBUG] Usuário fora do tráfego, retornando controle')
      return NextResponse.json({
        variant: controlVariant || experiment.variants[0],
        assignment: 'control_excluded'
      }, {
        headers: corsHeaders
      })
    }

    // Selecionar variante (uniform para simplificar)
    console.log('🔍 [DEBUG] Selecionando variante...')
    const selectedVariant = experiment.variants[Math.floor(Math.random() * experiment.variants.length)]
    console.log('🔍 [DEBUG] Selected variant:', selectedVariant)

    // Criar nova atribuição
    console.log('🔍 [DEBUG] Criando atribuição...')
    const { error: assignError } = await supabase
      .from('assignments')
      .insert({
        experiment_id: experimentId,
        variant_id: selectedVariant.id,
        user_id: userId,
        fingerprint: userAgent,
        user_agent: userAgent,
        url: url,
        referrer: referrer,
        viewport: viewport,
        created_at: new Date().toISOString()
      })

    if (assignError) {
      console.log('❌ [ERROR] Assignment error:', assignError)
      return NextResponse.json({ error: 'Failed to create assignment' }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // Log pageview
    console.log('🔍 [DEBUG] Logging pageview...')
    await supabase
      .from('events')
      .insert({
        experiment_id: experimentId,
        variant_id: selectedVariant.id,
        visitor_id: userId,
        event_type: 'page_view',
        properties: {
          title: 'Page View',
          path: new URL(url).pathname,
          search: new URL(url).search
        },
        timestamp: new Date().toISOString(),
        url: url,
        referrer: referrer,
        user_agent: userAgent,
        viewport: viewport
      })

    console.log('✅ [DEBUG] Sucesso! Retornando variante')
    return NextResponse.json({
      variant: selectedVariant,
      assignment: 'new',
      algorithm: 'uniform'
    }, {
      headers: corsHeaders
    })

  } catch (error) {
    console.error('❌ [ERROR] Assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Função auxiliar para hash
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}