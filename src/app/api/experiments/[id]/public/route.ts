import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Headers CORS para todas as respostas
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

/**
 * Endpoint PÚBLICO para buscar dados do experimento necessários para conversion tracking
 * Usado pelo conversion-tracker.js quando executado em sites externos
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const experimentId = id

    // Usar service client para acessar sem autenticação
    // Mas vamos proteger com verificação de que o experimento existe e está ativo
    const supabase = await createClient()

    // Buscar apenas campos necessários para conversion tracking
    const { data: experiment, error: fetchError } = await supabase
      .from('experiments')
      .select(`
        id,
        name,
        conversion_value,
        conversion_url,
        conversion_type,
        status
      `)
      .eq('id', experimentId)
      .single()

    if (fetchError || !experiment) {
      return NextResponse.json(
        { error: 'Experimento não encontrado' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Retornar apenas os dados necessários (público e seguro)
    return NextResponse.json({
      success: true,
      experiment: {
        id: experiment.id,
        name: experiment.name,
        conversion_value: experiment.conversion_value || 0,
        conversion_url: experiment.conversion_url,
        conversion_type: experiment.conversion_type || 'page_view',
        status: experiment.status
      }
    }, {
      headers: corsHeaders
    })

  } catch (error) {
    console.error('Erro ao buscar dados públicos do experimento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: corsHeaders }
    )
  }
}

