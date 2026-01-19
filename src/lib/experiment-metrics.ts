import { createClient } from '@/lib/supabase/client'
import { analyzeExperiment } from '@/lib/statistics'

export interface ExperimentMetrics {
  visitors: number
  conversions: number
  conversionRate: number
  confidence: number
  revenue?: number
  improvement?: number
  pValue?: number
  isSignificant?: boolean
}

export interface VariantMetrics {
  id: string
  name: string
  is_control: boolean
  visitors: number
  conversions: number
  conversionRate: number
  revenue: number
}

/**
 * Calcula métricas reais de um experimento baseado nos dados do Supabase
 * Usa cálculo estatístico real (Z-test) para confiança
 */
export async function calculateExperimentMetrics(experimentId: string): Promise<ExperimentMetrics> {
  const supabase = createClient()

  try {
    console.log('🔍 Calculando métricas para experimento:', experimentId)

    // Buscar variantes do experimento
    const { data: variants, error: variantsError } = await supabase
      .from('variants')
      .select('id, name, is_control')
      .eq('experiment_id', experimentId)

    if (variantsError) {
      console.error('Erro ao buscar variantes:', variantsError)
      return getDefaultMetrics()
    }

    // Buscar dados de variant_stats para cada variante
    const variantMetrics: VariantMetrics[] = await Promise.all(
      (variants || []).map(async (variant: { id: string; name: string; is_control: boolean }) => {
        const { data: stats } = await supabase
          .from('variant_stats')
          .select('visitors, conversions, revenue')
          .eq('variant_id', variant.id)
          .maybeSingle()

        let visitors = stats?.visitors || 0
        let conversions = stats?.conversions || 0
        let revenue = stats?.revenue || 0

        // Fallback: buscar de assignments e events se variant_stats estiver vazio
        if (!stats) {
          const [assignmentsResult, conversionsResult] = await Promise.all([
            supabase
              .from('assignments')
              .select('id', { count: 'exact', head: true })
              .eq('variant_id', variant.id),
            supabase
              .from('events')
              .select('value')
              .eq('variant_id', variant.id)
              .eq('event_type', 'conversion')
          ])

          visitors = assignmentsResult.count || 0
          conversions = conversionsResult.data?.length || 0
          revenue = (conversionsResult.data || []).reduce(
            (sum: number, conv: { value?: string | number }) => sum + (Number(conv.value) || 0), 0
          )
        }

        return {
          id: variant.id,
          name: variant.name,
          is_control: variant.is_control,
          visitors,
          conversions,
          revenue,
          conversionRate: visitors > 0 ? (conversions / visitors) * 100 : 0
        }
      })
    )

    // Calcular totais
    const totalVisitors = variantMetrics.reduce((sum: number, v: any) => sum + v.visitors, 0)
    const totalConversions = variantMetrics.reduce((sum: number, v: any) => sum + v.conversions, 0)
    const totalRevenue = variantMetrics.reduce((sum: number, v: any) => sum + v.revenue, 0)
    const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

    // Encontrar variante de controle e melhor variante
    const controlVariant = variantMetrics.find(v => v.is_control) || variantMetrics[0]
    const bestVariant = variantMetrics.length > 0
      ? variantMetrics.reduce((best: any, current: any) =>
        current.conversionRate > (best?.conversionRate || 0) ? current : best
        , variantMetrics[0])
      : null

    // Calcular improvement comparando melhor variante com controle
    let improvement = 0
    if (controlVariant && bestVariant && controlVariant.id !== bestVariant.id) {
      if (controlVariant.conversionRate > 0 && bestVariant.conversionRate !== undefined) {
        improvement = ((bestVariant.conversionRate - controlVariant.conversionRate) / controlVariant.conversionRate) * 100
      }
    }

    // Calcular significância estatística real usando Z-test
    let confidence = 0
    let pValue: number | undefined
    let isSignificant = false

    if (variantMetrics.length >= 2 && controlVariant) {
      // Encontrar a melhor variante que não é controle
      const nonControlVariants = variantMetrics.filter(v => !v.is_control)
      if (nonControlVariants.length > 0) {
        const bestNonControl = nonControlVariants.reduce((best: any, current: any) =>
          current.conversionRate > (best?.conversionRate || 0) ? current : best
          , nonControlVariants[0])

        if (bestNonControl) {
          // Usar a função analyzeExperiment para cálculo estatístico real
          const analysis = analyzeExperiment(
            controlVariant.visitors,
            controlVariant.conversions,
            bestNonControl.visitors,
            bestNonControl.conversions,
            0.95 // 95% de confiança
          )

          confidence = analysis.significance
          pValue = analysis.pValue
          isSignificant = analysis.isSignificant

          console.log('📊 Análise estatística:', {
            control: { visitors: controlVariant.visitors, conversions: controlVariant.conversions },
            variant: { visitors: bestNonControl.visitors, conversions: bestNonControl.conversions },
            confidence: `${confidence.toFixed(1)}%`,
            pValue: pValue !== undefined ? pValue.toFixed(4) : 'N/A',
            isSignificant
          })
        }
      }
    }

    console.log('📊 Métricas calculadas:', {
      experimentId,
      totalVisitors,
      totalConversions,
      conversionRate: conversionRate.toFixed(2) + '%',
      improvement: improvement.toFixed(2) + '%',
      confidence: confidence.toFixed(1) + '%',
      totalRevenue: `R$ ${totalRevenue.toFixed(2)}`
    })

    return {
      visitors: totalVisitors,
      conversions: totalConversions,
      conversionRate: Number(conversionRate.toFixed(1)),
      confidence: Math.round(confidence),
      revenue: Math.round(totalRevenue),
      improvement: Number(improvement.toFixed(1)),
      pValue,
      isSignificant
    }
  } catch (error) {
    console.error('Erro ao calcular métricas do experimento:', {
      experimentId,
      error: error instanceof Error ? error.message : error
    })
    return getDefaultMetrics()
  }
}

/**
 * Calcula métricas detalhadas para cada variante de um experimento
 */
export async function getVariantMetrics(experimentId: string): Promise<VariantMetrics[]> {
  const supabase = createClient()

  try {
    const { data: variants, error } = await supabase
      .from('variants')
      .select('id, name, is_control')
      .eq('experiment_id', experimentId)

    if (error) throw error

    const metricsPromises = (variants || []).map(async (variant: { id: string; name: string; is_control: boolean }) => {
      const { data: stats } = await supabase
        .from('variant_stats')
        .select('visitors, conversions, revenue')
        .eq('variant_id', variant.id)
        .maybeSingle()

      let visitors = stats?.visitors || 0
      let conversions = stats?.conversions || 0
      let revenue = stats?.revenue || 0

      if (!stats) {
        const [assignmentsResult, conversionsResult] = await Promise.all([
          supabase
            .from('assignments')
            .select('id', { count: 'exact', head: true })
            .eq('variant_id', variant.id),
          supabase
            .from('events')
            .select('value')
            .eq('variant_id', variant.id)
            .eq('event_type', 'conversion')
        ])

        visitors = assignmentsResult.count || 0
        conversions = conversionsResult.data?.length || 0
        revenue = (conversionsResult.data || []).reduce(
          (sum: number, conv: { value?: string | number }) => sum + (Number(conv.value) || 0), 0
        )
      }

      return {
        id: variant.id,
        name: variant.name,
        is_control: variant.is_control,
        visitors,
        conversions,
        revenue,
        conversionRate: visitors > 0 ? (conversions / visitors) * 100 : 0
      }
    })

    return await Promise.all(metricsPromises)
  } catch (error) {
    console.error('Erro ao buscar métricas das variantes:', error)
    return []
  }
}

/**
 * Retorna métricas padrão quando não há dados
 */
function getDefaultMetrics(): ExperimentMetrics {
  return {
    visitors: 0,
    conversions: 0,
    conversionRate: 0,
    confidence: 0,
    revenue: 0,
    improvement: 0,
    pValue: 1,
    isSignificant: false
  }
}

/**
 * Calcula métricas para múltiplos experimentos
 */
export async function calculateMultipleExperimentMetrics(experimentIds: string[]): Promise<Record<string, ExperimentMetrics>> {
  const metrics: Record<string, ExperimentMetrics> = {}

  // Processar em lotes para evitar sobrecarga
  const batchSize = 5
  for (let i = 0; i < experimentIds.length; i += batchSize) {
    const batch = experimentIds.slice(i, i + batchSize)
    const batchPromises = batch.map(async (id) => {
      const result = await calculateExperimentMetrics(id)
      return { id, metrics: result }
    })

    const batchResults = await Promise.all(batchPromises)
    batchResults.forEach(({ id, metrics: expMetrics }) => {
      metrics[id] = expMetrics
    })
  }

  return metrics
}

/**
 * Formata números para exibição
 */
export function formatMetricValue(value: number, type: 'visitors' | 'conversion' | 'revenue' | 'improvement'): string {
  switch (type) {
    case 'visitors':
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`
      }
      return value.toLocaleString('pt-BR')

    case 'conversion':
      return `${value.toFixed(1)}%`

    case 'revenue':
      return `R$ ${value.toLocaleString('pt-BR')}`

    case 'improvement':
      return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

    default:
      return value.toString()
  }
}
