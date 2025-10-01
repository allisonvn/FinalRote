import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { config } from '@/lib/config'

// Multi-Armed Bandit algorithms
const algorithms = {
  // Thompson Sampling
  thompson_sampling: (variants: any[]) => {
    return variants.map(variant => {
      const alpha = (variant.conversions || 0) + 1
      const beta = (variant.visitors || 0) - (variant.conversions || 0) + 1

      // Beta distribution sampling
      const u1 = Math.random()
      const u2 = Math.random()
      const score = u1 === 0 ? 0 : Math.pow(u1, 1/alpha) * Math.pow(1 - u2, 1/beta)

      return { ...variant, score }
    }).sort((a, b) => b.score - a.score)[0]
  },

  // Upper Confidence Bound (UCB1)
  ucb1: (variants: any[]) => {
    const totalVisitors = variants.reduce((sum, v) => sum + (v.visitors || 0), 0)

    return variants.map(variant => {
      const visitors = variant.visitors || 0
      const conversions = variant.conversions || 0
      const conversionRate = visitors > 0 ? conversions / visitors : 0

      // UCB1 formula
      const confidence = visitors > 0 ? Math.sqrt((2 * Math.log(totalVisitors)) / visitors) : Infinity
      const score = conversionRate + confidence

      return { ...variant, score }
    }).sort((a, b) => b.score - a.score)[0]
  },

  // Epsilon Greedy
  epsilon_greedy: (variants: any[], epsilon: number = 0.1) => {
    if (Math.random() < epsilon) {
      // Exploration: random variant
      return variants[Math.floor(Math.random() * variants.length)]
    } else {
      // Exploitation: best performing variant
      return variants.map(variant => {
        const visitors = variant.visitors || 0
        const conversions = variant.conversions || 0
        const conversionRate = visitors > 0 ? conversions / visitors : 0
        return { ...variant, score: conversionRate }
      }).sort((a, b) => b.score - a.score)[0]
    }
  },

  // Uniform (equal distribution)
  uniform: (variants: any[]) => {
    return variants[Math.floor(Math.random() * variants.length)]
  }
}

// Headers CORS para todas as respostas
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RF-Version',
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const experimentId = params.id
    const body = await request.json()
    const { userId, fingerprint, userAgent, url, referrer, viewport } = body

    // Validar API key
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { 
        status: 401,
        headers: corsHeaders 
      })
    }

    const supabase = createClient()

    // ✅ NOVO: Verificar se é API key do experimento OU do projeto
    let project = null
    let isValidApiKey = false

    // Primeiro, tentar como API key do experimento
    const { data: experimentWithKey, error: expKeyError } = await supabase
      .from('experiments')
      .select('id, project_id, api_key')
      .eq('api_key', apiKey)
      .single()

    if (experimentWithKey && !expKeyError) {
      // API key do experimento encontrada
      project = { id: experimentWithKey.project_id }
      isValidApiKey = true
    } else {
      // Fallback: tentar como API key do projeto (compatibilidade)
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('api_key', apiKey)
        .single()

      if (projectData && !projectError) {
        project = projectData
        isValidApiKey = true
      }
    }

    if (!isValidApiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { 
        status: 401,
        headers: corsHeaders 
      })
    }

    // Buscar experimento
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

    if (expError || !experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Verificar se experimento está ativo
    if (experiment.status !== 'running') {
      return NextResponse.json({ error: 'Experiment not running' }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Verificar se já existe atribuição para este usuário
    const { data: existingAssignment } = await supabase
      .from('assignments')
      .select(`
        *,
        variant:variants(*)
      `)
      .eq('experiment_id', experimentId)
      .eq('user_id', userId)
      .single()

    if (existingAssignment) {
      // Retornar variante já atribuída
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
      return NextResponse.json({
        variant: controlVariant || experiment.variants[0],
        assignment: 'control_excluded'
      }, {
        headers: corsHeaders
      })
    }

    // Buscar estatísticas das variantes para algoritmos MAB
    const variantsWithStats = await Promise.all(
      experiment.variants.map(async (variant: any) => {
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .eq('variant_id', variant.id)

        const { data: conversions } = await supabase
          .from('events')
          .select('id')
          .eq('variant_id', variant.id)
          .eq('event_type', 'conversion')

        return {
          ...variant,
          visitors: assignments?.length || 0,
          conversions: conversions?.length || 0
        }
      })
    )

    // Aplicar algoritmo de atribuição
    const algorithm = experiment.mab_config?.algorithm || 'uniform'
    const selectedVariant = algorithms[algorithm as keyof typeof algorithms]?.(variantsWithStats) || variantsWithStats[0]

    // Criar nova atribuição
    const { error: assignError } = await supabase
      .from('assignments')
      .insert({
        experiment_id: experimentId,
        variant_id: selectedVariant.id,
        user_id: userId,
        fingerprint: fingerprint,
        user_agent: userAgent,
        assigned_at: new Date().toISOString(),
        metadata: {
          url,
          referrer,
          viewport,
          algorithm: algorithm
        }
      })

    if (assignError) {
      console.error('Error creating assignment:', assignError)
      return NextResponse.json({ error: 'Failed to assign variant' }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // Registrar evento de pageview
    await supabase
      .from('events')
      .insert({
        experiment_id: experimentId,
        variant_id: selectedVariant.id,
        user_id: userId,
        event_type: 'pageview',
        event_data: {
          url,
          referrer,
          title: 'Page View',
          user_agent: userAgent
        },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      variant: selectedVariant,
      assignment: 'new',
      algorithm: algorithm
    }, {
      headers: corsHeaders
    })

  } catch (error) {
    console.error('Assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Função auxiliar para gerar hash
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// CORS headers para requests cross-origin
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RF-Version',
    },
  })
}