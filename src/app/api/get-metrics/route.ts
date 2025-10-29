import { NextRequest, NextResponse } from 'next/server'
import { getExperimentMetrics } from '@/lib/analytics'

// CORS headers para todas as respostas
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RF-Version',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') as '7d'|'30d'|'90d'|'1y' || '30d'

    console.log('📊 Buscando métricas para range:', range)
    
    const metrics = await getExperimentMetrics(range)
    
    console.log('📊 Métricas encontradas:', metrics.length)

    return NextResponse.json(metrics, { headers: corsHeaders })
  } catch (error) {
    console.error('Error getting metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}