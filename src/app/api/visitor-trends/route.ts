import { NextRequest, NextResponse } from 'next/server'
import { getVisitorTrends } from '@/lib/analytics'

// CORS headers para todas as respostas
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RF-Version',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') as '24h'|'7d'|'30d'|'90d'|'1y' || '30d'
    const experimentId = searchParams.get('experimentId')

    console.log('👥 Buscando visitor trends para range:', range)
    
    const data = await getVisitorTrends(range, experimentId || undefined)
    
    console.log('👥 Visitor trends encontrado:', data.length)

    return NextResponse.json(data, { headers: corsHeaders })
  } catch (error) {
    console.error('Error getting visitor trends:', error)
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
