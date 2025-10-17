'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Target, 
  DollarSign, Clock, AlertCircle, CheckCircle2, 
  Activity, ArrowRight, RefreshCw, Download
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Variant {
  variant_id: string
  variant_name: string
  visitors: number
  conversions: number
  conversion_rate: number
  revenue?: number
  avg_value?: number
  significance?: {
    significant: boolean
    confidence_level: number
    p_value: number
    lift: number
    margin_error: number
  }
}

interface ExperimentMetricsProps {
  experimentId: string
  refreshInterval?: number // em segundos
}

export function ExperimentMetrics({ 
  experimentId, 
  refreshInterval = 30 
}: ExperimentMetricsProps) {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const supabase = createClient()

  const loadMetrics = async () => {
    try {
      setError(null)
      
      // Buscar métricas via função refresh_experiment_metrics
      const { data, error: metricsError } = await supabase
        .rpc('refresh_experiment_metrics', { exp_id: experimentId })

      if (metricsError) {
        console.error('Erro ao buscar métricas:', metricsError)
        throw metricsError
      }

      // Se não houver dados, retornar métricas vazias
      if (!data || data.length === 0) {
        console.log('⚠️ Nenhuma métrica encontrada para o experimento:', experimentId)
        setMetrics({
          variants: [],
          summary: {
            totalVisitors: 0,
            totalConversions: 0,
            avgConversionRate: 0,
            totalRevenue: 0
          }
        })
        setLastUpdate(new Date())
        setLoading(false)
        return
      }

      // Calcular significância estatística
      const controlVariant = data?.find((v: any) => v.variant_name === 'Original' || v.is_control === true)
      
      if (controlVariant && data) {
        for (const variant of data) {
          if (variant.variant_id !== controlVariant.variant_id) {
            try {
              const { data: significance } = await supabase.rpc('calculate_significance', {
                control_conversions: controlVariant.conversions,
                control_visitors: controlVariant.visitors,
                variant_conversions: variant.conversions,
                variant_visitors: variant.visitors
              })
              
              variant.significance = significance || 0
            } catch (sigErr) {
              console.error('Erro ao calcular significância:', sigErr)
              variant.significance = 0
            }
          }
        }
      }

      setMetrics({
        variants: data || [],
        summary: calculateSummary(data || [])
      })
      
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Erro ao carregar métricas:', err)
      setError('Falha ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (variants: Variant[]) => {
    const totalVisitors = variants.reduce((sum, v) => sum + v.visitors, 0)
    const totalConversions = variants.reduce((sum, v) => sum + v.conversions, 0)
    const totalRevenue = variants.reduce((sum, v) => sum + (v.revenue || 0), 0)
    
    return {
      totalVisitors,
      totalConversions,
      totalRevenue,
      overallConversionRate: totalVisitors > 0 
        ? ((totalConversions / totalVisitors) * 100).toFixed(2)
        : '0'
    }
  }

  // Carregar métricas inicial e configurar auto-refresh
  useEffect(() => {
    loadMetrics()

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(loadMetrics, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [experimentId, autoRefresh, refreshInterval])

  const getVariantStatus = (variant: Variant) => {
    if (!variant.significance) return 'testing'
    
    if (variant.significance.significant) {
      return variant.significance.lift > 0 ? 'winning' : 'losing'
    }
    
    return variant.significance.confidence_level > 80 ? 'promising' : 'testing'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'winning': return 'text-green-600 bg-green-50'
      case 'losing': return 'text-red-600 bg-red-50'
      case 'promising': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const exportData = () => {
    if (!metrics) return

    const csv = [
      ['Variante', 'Visitantes', 'Conversões', 'Taxa de Conversão', 'Receita', 'Confiança', 'Lift'],
      ...metrics.variants.map((v: Variant) => [
        v.variant_name,
        v.visitors,
        v.conversions,
        v.conversion_rate + '%',
        v.revenue || 0,
        v.significance?.confidence_level || '-',
        v.significance?.lift || '-'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `experiment-${experimentId}-metrics.csv`
    a.click()
  }

  if (loading && !metrics) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Carregando métricas...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
            <Button size="sm" onClick={loadMetrics}>Tentar novamente</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Métricas em Tempo Real</h3>
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Atualizado {lastUpdate.toLocaleTimeString()}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button size="sm" variant="outline" onClick={loadMetrics}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
          <Button size="sm" variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Visitantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold">
                {metrics?.summary.totalVisitors.toLocaleString()}
              </span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Conversões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold">
                {metrics?.summary.totalConversions.toLocaleString()}
              </span>
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold">
                {metrics?.summary.overallConversionRate}%
              </span>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold">
                R$ {metrics?.summary.totalRevenue.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas por variante */}
      <div className="space-y-4">
        {metrics?.variants.map((variant: Variant, index: number) => {
          const status = getVariantStatus(variant)
          const isControl = variant.variant_name === 'Controle' || variant.variant_name === 'Control'
          
          return (
            <Card key={variant.variant_id} className={isControl ? 'border-2' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-lg">
                      {variant.variant_name}
                    </CardTitle>
                    {isControl && (
                      <Badge variant="outline">Controle</Badge>
                    )}
                    {!isControl && (
                      <Badge className={getStatusColor(status)}>
                        {status === 'winning' && <TrendingUp className="w-3 h-3 mr-1" />}
                        {status === 'losing' && <TrendingDown className="w-3 h-3 mr-1" />}
                        {status === 'winning' ? 'Vencendo' : 
                         status === 'losing' ? 'Perdendo' :
                         status === 'promising' ? 'Promissor' : 'Testando'}
                      </Badge>
                    )}
                  </div>
                  {variant.significance && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Confiança</div>
                      <div className="text-lg font-semibold">
                        {variant.significance.confidence_level.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Visitantes</div>
                    <div className="text-xl font-semibold">
                      {variant.visitors.toLocaleString()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Conversões</div>
                    <div className="text-xl font-semibold">
                      {variant.conversions.toLocaleString()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Taxa de Conversão</div>
                    <div className="text-xl font-semibold">
                      {variant.conversion_rate.toFixed(2)}%
                    </div>
                    {variant.significance && !isControl && (
                      <div className={`text-sm ${variant.significance.lift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {variant.significance.lift > 0 ? '+' : ''}{variant.significance.lift.toFixed(1)}% lift
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Receita</div>
                    <div className="text-xl font-semibold">
                      R$ {(variant.revenue || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                    {variant.avg_value && variant.avg_value > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Ticket médio: R$ {variant.avg_value.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Barra de progresso visual */}
                {!isControl && variant.significance && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Probabilidade de ser melhor que o controle</span>
                      <span className="font-medium">
                        {variant.significance.confidence_level.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={variant.significance.confidence_level} 
                      className="h-2"
                    />
                    {variant.significance.significant && (
                      <div className="flex items-center space-x-1 text-sm text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resultado estatisticamente significativo (p &lt; 0.05)</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
