import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RF-Version',
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const experimentId = id
    const supabase = createServiceClient()

    // 1. Buscar informações do experimento
    const { data: experiment, error: experimentError } = await supabase
      .from('experiments')
      .select('id, name, status, algorithm, created_at')
      .eq('id', experimentId)
      .single()

    if (experimentError || !experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // 2. Buscar estatísticas das variantes
    const { data: variantStats, error: statsError } = await supabase
      .from('variant_stats')
      .select(`
        variant_id,
        visitors,
        conversions,
        revenue,
        last_updated
      `)
      .eq('experiment_id', experimentId)

    // 3. Buscar informações das variantes
    const { data: variants, error: variantsError } = await supabase
      .from('variants')
      .select('id, name, is_control, traffic_percentage, redirect_url')
      .eq('experiment_id', experimentId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (variantsError || !variants) {
      return NextResponse.json(
        { error: 'Variants not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // 4. Combinar dados de variantes com estatísticas
    const statsMap = new Map<string, any>()
    if (variantStats && !statsError) {
      variantStats.forEach((stat: any) => {
        statsMap.set(stat.variant_id, {
          visitors: stat.visitors || 0,
          conversions: stat.conversions || 0,
          revenue: parseFloat(stat.revenue || 0),
          last_updated: stat.last_updated
        })
      })
    }

    const variantsWithStats = variants.map(variant => {
      const stats = statsMap.get(variant.id) || {
        visitors: 0,
        conversions: 0,
        revenue: 0,
        last_updated: null
      }

      const conversionRate = stats.visitors > 0
        ? (stats.conversions / stats.visitors) * 100
        : 0

      const avgRevenue = stats.conversions > 0
        ? stats.revenue / stats.conversions
        : 0

      return {
        id: variant.id,
        name: variant.name,
        is_control: variant.is_control,
        traffic_percentage: parseFloat(variant.traffic_percentage || '0'),
        redirect_url: variant.redirect_url,
        visitors: stats.visitors,
        conversions: stats.conversions,
        revenue: stats.revenue,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        avg_revenue: Math.round(avgRevenue * 100) / 100,
        last_updated: stats.last_updated
      }
    })

    // 5. Calcular estatísticas gerais
    const totalVisitors = variantsWithStats.reduce((sum, v) => sum + v.visitors, 0)
    const totalConversions = variantsWithStats.reduce((sum, v) => sum + v.conversions, 0)
    const totalRevenue = variantsWithStats.reduce((sum, v) => sum + v.revenue, 0)
    const overallConversionRate = totalVisitors > 0
      ? (totalConversions / totalVisitors) * 100
      : 0

    // 6. Identificar vencedor (maior taxa de conversão com mínimo de dados)
    const minVisitors = 50 // Mínimo de visitantes para considerar significativo
    const eligibleVariants = variantsWithStats.filter(v => v.visitors >= minVisitors)
    const winner = eligibleVariants.length > 0
      ? eligibleVariants.reduce((best, current) =>
          current.conversion_rate > best.conversion_rate ? current : best
        )
      : null

    // 7. Calcular uplift (melhoria em relação ao controle)
    const control = variantsWithStats.find(v => v.is_control)
    const variantsWithUplift = variantsWithStats.map(variant => {
      if (!control || control.id === variant.id || control.conversion_rate === 0) {
        return { ...variant, uplift: 0 }
      }

      const uplift = ((variant.conversion_rate - control.conversion_rate) / control.conversion_rate) * 100
      return {
        ...variant,
        uplift: Math.round(uplift * 100) / 100
      }
    })

    // 8. Buscar eventos recentes (últimos 10)
    const { data: recentEvents } = await supabase
      .from('events')
      .select('id, event_type, visitor_id, value, created_at, properties')
      .eq('experiment_id', experimentId)
      .order('created_at', { ascending: false })
      .limit(10)

    // 9. Buscar conversões por dia (últimos 7 dias)
    const { data: dailyConversions } = await supabase
      .rpc('get_daily_conversions', {
        p_experiment_id: experimentId,
        p_days: 7
      })
      .then(res => res.data)
      .catch(() => null)

    // Resposta completa
    return NextResponse.json({
      experiment: {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        algorithm: experiment.algorithm,
        created_at: experiment.created_at
      },
      summary: {
        total_visitors: totalVisitors,
        total_conversions: totalConversions,
        total_revenue: Math.round(totalRevenue * 100) / 100,
        overall_conversion_rate: Math.round(overallConversionRate * 100) / 100,
        avg_revenue_per_conversion: totalConversions > 0
          ? Math.round((totalRevenue / totalConversions) * 100) / 100
          : 0
      },
      variants: variantsWithUplift,
      winner: winner ? {
        id: winner.id,
        name: winner.name,
        conversion_rate: winner.conversion_rate,
        uplift: winner.uplift || 0
      } : null,
      recent_events: recentEvents || [],
      daily_conversions: dailyConversions || [],
      last_updated: new Date().toISOString()
    }, {
      headers: corsHeaders
    })

  } catch (error) {
    console.error('Error fetching experiment stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

