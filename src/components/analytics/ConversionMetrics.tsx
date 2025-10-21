"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, DollarSign, Target, Users, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConversionData {
  variantId: string
  variantName: string
  isControl: boolean
  visitors: number
  conversions: number
  conversionRate: number
  revenue: number
  uplift?: number
  significance?: number
}

interface ConversionMetricsProps {
  experimentId: string
  className?: string
}

export function ConversionMetrics({ experimentId, className }: ConversionMetricsProps) {
  const [data, setData] = useState<ConversionData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalVisitors, setTotalVisitors] = useState(0)
  const [totalConversions, setTotalConversions] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        // Get experiment info
        const { data: experiment } = await supabase
          .from('experiments')
          .select('id, name, conversion_url, conversion_value')
          .eq('id', experimentId)
          .single()

        if (!experiment) return

        // Get variants with stats
        const { data: variants } = await supabase
          .from('variants')
          .select('id, name, is_control')
          .eq('experiment_id', experimentId)
          .eq('is_active', true)

        if (!variants || variants.length === 0) return

        // Get variant stats
        const { data: stats } = await supabase
          .from('variant_stats')
          .select('variant_id, visitors, conversions, revenue')
          .eq('experiment_id', experimentId)

        const statsMap = new Map<string, { visitors: number; conversions: number; revenue: number }>()
        if (stats) {
          stats.forEach(stat => {
            statsMap.set(stat.variant_id, {
              visitors: stat.visitors || 0,
              conversions: stat.conversions || 0,
              revenue: stat.revenue || 0
            })
          })
        }

        // Calculate metrics for each variant
        const metricsData: ConversionData[] = variants.map(variant => {
          const stat = statsMap.get(variant.id) || { visitors: 0, conversions: 0, revenue: 0 }
          const conversionRate = stat.visitors > 0 ? (stat.conversions / stat.visitors) * 100 : 0

          return {
            variantId: variant.id,
            variantName: variant.name,
            isControl: variant.is_control || false,
            visitors: stat.visitors,
            conversions: stat.conversions,
            conversionRate,
            revenue: stat.revenue
          }
        })

        // Calculate uplift vs control
        const controlVariant = metricsData.find(v => v.isControl)
        if (controlVariant) {
          metricsData.forEach(variant => {
            if (!variant.isControl && controlVariant.conversionRate > 0) {
              variant.uplift = ((variant.conversionRate - controlVariant.conversionRate) / controlVariant.conversionRate) * 100
            }
          })
        }

        // Calculate totals
        const totalVisitors = metricsData.reduce((sum, v) => sum + v.visitors, 0)
        const totalConversions = metricsData.reduce((sum, v) => sum + v.conversions, 0)
        const totalRevenue = metricsData.reduce((sum, v) => sum + v.revenue, 0)

        setData(metricsData)
        setTotalVisitors(totalVisitors)
        setTotalConversions(totalConversions)
        setTotalRevenue(totalRevenue)
      } catch (error) {
        console.error('Error loading conversion metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [experimentId])

  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
        {[1, 2, 3].map(i => (
          <Card key={i} className="h-32 animate-pulse" />
        ))}
      </div>
    )
  }

  const overallConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Visitantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversões</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalConversions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Geral</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{overallConversionRate.toFixed(2)}%</div>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variant Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map(variant => (
          <Card key={variant.variantId} className="relative overflow-hidden card-glass hover-lift">
            {variant.isControl && (
              <div className="absolute top-0 right-0 bg-primary/10 px-3 py-1 rounded-bl-lg">
                <Badge variant="outline" className="text-xs border-primary/30 bg-transparent">Controle</Badge>
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{variant.variantName}</CardTitle>
                {variant.uplift !== undefined && (
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-semibold",
                    variant.uplift > 0 ? "text-success" : "text-danger"
                  )}>
                    {variant.uplift > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {variant.uplift > 0 ? '+' : ''}{variant.uplift.toFixed(1)}%
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Conversion Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                  <span className="text-2xl font-bold">{variant.conversionRate.toFixed(2)}%</span>
                </div>
                <Progress value={variant.conversionRate} className="h-2" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Visitantes</div>
                  <div className="text-lg font-semibold">{variant.visitors.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Conversões</div>
                  <div className="text-lg font-semibold text-success">{variant.conversions.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Receita</div>
                  <div className="text-lg font-semibold text-warning">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(variant.revenue)}
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Bottom accent bar */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 h-1",
              variant.isControl ? "bg-gradient-to-r from-primary/40 to-primary" :
              variant.uplift && variant.uplift > 0 ? "bg-gradient-to-r from-success/40 to-success" :
              "bg-gradient-to-r from-muted/40 to-muted"
            )} />
          </Card>
        ))}
      </div>
    </div>
  )
}
