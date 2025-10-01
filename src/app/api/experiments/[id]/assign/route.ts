import { NextRequest, NextResponse } from 'next/server'

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

    // Para o experimento específico "Esmalt", retornar uma resposta fixa por enquanto
    if (experimentId === 'd309112f-41ea-44b6-8f38-accf76f11def') {
      // Simular seleção de variante (50% controle, 50% variante A)
      const userHash = hashCode(userId + experimentId) % 100
      const isControl = userHash < 50
      
      const variant = isControl 
        ? {
            id: '48079f64-23fa-49c5-912a-9f859df08a9a',
            name: 'Controle',
            description: 'Versão original',
            is_control: true,
            traffic_percentage: '50.00',
            redirect_url: null,
            changes: {},
            css_changes: null,
            js_changes: null
          }
        : {
            id: '0c6594a7-c15b-417e-b87c-6fea3a8d180d',
            name: 'Variante A',
            description: 'Versão alternativa',
            is_control: false,
            traffic_percentage: '50.00',
            redirect_url: null,
            changes: {},
            css_changes: null,
            js_changes: null
          }

      console.log('✅ [DEBUG] Retornando variante simulada:', variant.name)
      return NextResponse.json({
        variant: variant,
        assignment: 'new',
        algorithm: 'uniform'
      }, {
        headers: corsHeaders
      })
    }

    // Para outros experimentos, retornar erro
    return NextResponse.json({ error: 'Experiment not found' }, { 
      status: 404,
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