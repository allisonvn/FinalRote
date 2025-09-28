import { createClient } from '@/lib/supabase/client'

export interface ExperimentMetrics {
  visitors: number
  conversions: number
  conversionRate: number
  confidence: number
  revenue?: number
  improvement?: number
}

/**
 * Calcula métricas reais de um experimento baseado nos dados do Supabase
 */
export async function calculateExperimentMetrics(experimentId: string): Promise<ExperimentMetrics> {
  const supabase = createClient()
  
  try {
    console.log('🔍 Calculando métricas para experimento:', experimentId)
    
    // Primeiro, tentar usar a função RPC para buscar estatísticas
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_experiment_stats', { experiment_uuid: experimentId })

    if (!statsError && statsData && statsData.length > 0) {
      console.log('📊 Usando dados da função RPC:', statsData[0])
      const stats = statsData[0]
      const totalVisitors = stats.total_visitors || 0
      const totalConversions = stats.total_conversions || 0
      const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0
      
      const avgOrderValue = 150
      const revenue = totalConversions * avgOrderValue
      const confidence = calculateConfidence(totalVisitors, conversionRate)
      const baseline = 3.0
      const improvement = conversionRate > 0 ? ((conversionRate - baseline) / baseline) * 100 : 0

      return {
        visitors: totalVisitors,
        conversions: totalConversions,
        conversionRate: Number(conversionRate.toFixed(1)),
        confidence: Math.round(confidence),
        revenue: Math.round(revenue),
        improvement: Number(improvement.toFixed(1))
      }
    }

    // Fallback: buscar dados diretamente das tabelas
    console.log('📊 Usando dados diretos das tabelas')
    
    // Buscar eventos de conversão para este experimento
    const { data: conversions, error: convError } = await supabase
      .from('events')
      .select('*')
      .eq('experiment_id', experimentId)
      .eq('event_type', 'conversion')

    // Buscar total de visitantes únicos (assignments)
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select('visitor_id')
      .eq('experiment_id', experimentId)

    if (convError || assignError) {
      console.error('Erro ao buscar dados do experimento:', {
        experimentId,
        convError: convError?.message || convError,
        assignError: assignError?.message || assignError
      })
      return getDefaultMetrics()
    }

    const totalConversions = conversions?.length || 0
    const totalVisitors = assignments?.length || 0
    const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

    console.log('📊 Métricas calculadas:', {
      experimentId,
      totalConversions,
      totalVisitors,
      conversionRate: conversionRate.toFixed(2) + '%'
    })

    // Calcular receita total (assumindo valor médio por conversão)
    const avgOrderValue = 150 // R$ por conversão
    const revenue = totalConversions * avgOrderValue

    // Calcular confiabilidade estatística baseada no tamanho da amostra
    const confidence = calculateConfidence(totalVisitors, conversionRate)

    // Calcular improvement comparando com baseline (assumindo 3% como baseline)
    const baseline = 3.0
    const improvement = conversionRate > 0 ? ((conversionRate - baseline) / baseline) * 100 : 0

    return {
      visitors: totalVisitors,
      conversions: totalConversions,
      conversionRate: Number(conversionRate.toFixed(1)),
      confidence: Math.round(confidence),
      revenue: Math.round(revenue),
      improvement: Number(improvement.toFixed(1))
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
 * Calcula confiabilidade estatística baseada no tamanho da amostra
 */
function calculateConfidence(visitors: number, conversionRate: number): number {
  if (visitors === 0) return 0
  
  // Para experimentos com poucos dados, usar confiabilidade baixa
  if (visitors < 10) return 0
  if (visitors < 30) return 25
  if (visitors < 100) return 50
  if (visitors < 500) return 75
  if (visitors < 1000) return 85
  if (visitors < 2000) return 90
  if (visitors < 5000) return 95
  
  // Para experimentos com muitos dados, calcular baseado na taxa de conversão
  if (conversionRate > 10) return 99 // Taxa alta
  if (conversionRate > 5) return 95 // Taxa média-alta
  if (conversionRate > 2) return 90 // Taxa média
  if (conversionRate > 1) return 85 // Taxa baixa-média
  return 80 // Taxa muito baixa
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
    improvement: 0
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
