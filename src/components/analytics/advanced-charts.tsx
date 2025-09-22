'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, BarChart3, PieChart, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatPercent, cn } from '@/lib/utils'

interface DataPoint {
  date: string
  value: number
  variant?: string
}

interface VariantData {
  id: string
  name: string
  color: string
  data: DataPoint[]
  visitors: number
  conversions: number
  conversionRate: number
  isControl: boolean
}

interface AdvancedChartsProps {
  variants: VariantData[]
  timeRange: '7d' | '30d' | '90d'
  metric: 'conversions' | 'revenue' | 'engagement'
}

export function ConversionChart({ variants, timeRange }: AdvancedChartsProps) {
  const chartData = useMemo(() => {
    // Get all unique dates
    const allDates = new Set<string>()
    variants.forEach(variant => {
      variant.data.forEach(point => allDates.add(point.date))
    })

    const sortedDates = Array.from(allDates).sort()

    // Calculate max value for scaling
    const maxValue = Math.max(
      ...variants.flatMap(variant =>
        variant.data.map(point => point.value)
      )
    )

    return {
      dates: sortedDates,
      maxValue,
      variants: variants.map(variant => ({
        ...variant,
        normalizedData: sortedDates.map(date => {
          const point = variant.data.find(p => p.date === date)
          return {
            date,
            value: point?.value || 0,
            normalized: ((point?.value || 0) / maxValue) * 100
          }
        })
      }))
    }
  }, [variants])

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Taxa de Conversão
          </h3>
          <p className="text-sm text-muted-foreground">
            Comparação ao longo do tempo
          </p>
        </div>
        <div className="flex gap-2">
          {chartData.variants.map(variant => (
            <Badge
              key={variant.id}
              variant={variant.isControl ? 'default' : 'secondary'}
              className="gap-1"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: variant.color }}
              />
              {variant.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Simple line chart */}
      <div className="relative h-64 mb-6">
        <svg className="w-full h-full" viewBox="0 0 800 256">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={256 - (y * 2.56)}
              x2="800"
              y2={256 - (y * 2.56)}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeDasharray="2,2"
            />
          ))}

          {/* Chart lines */}
          {chartData.variants.map(variant => {
            const points = variant.normalizedData
              .map((point, index) => {
                const x = (index / (chartData.dates.length - 1)) * 800
                const y = 256 - (point.normalized * 2.56)
                return `${x},${y}`
              })
              .join(' ')

            return (
              <g key={variant.id}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={variant.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data points */}
                {variant.normalizedData.map((point, index) => {
                  const x = (index / (chartData.dates.length - 1)) * 800
                  const y = 256 - (point.normalized * 2.56)
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="3"
                      fill={variant.color}
                      className="opacity-80"
                    />
                  )
                })}
              </g>
            )
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground -ml-8">
          {[100, 75, 50, 25, 0].map(value => (
            <span key={value}>{value}%</span>
          ))}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground mb-4">
        {chartData.dates.filter((_, index) => index % Math.ceil(chartData.dates.length / 6) === 0).map(date => (
          <span key={date}>
            {new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        ))}
      </div>
    </Card>
  )
}

export function VariantComparison({ variants }: { variants: VariantData[] }) {
  const control = variants.find(v => v.isControl)
  const testVariants = variants.filter(v => !v.isControl)

  return (
    <div className="grid gap-4">
      {testVariants.map(variant => {
        const uplift = control
          ? ((variant.conversionRate - control.conversionRate) / control.conversionRate) * 100
          : 0

        const isPositive = uplift > 0
        const TrendIcon = isPositive ? TrendingUp : uplift < 0 ? TrendingDown : Minus

        return (
          <Card key={variant.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: variant.color }}
                />
                <div>
                  <h4 className="font-medium">{variant.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(variant.visitors)} visitantes
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">
                    {formatPercent(variant.conversionRate)}
                  </span>
                  {control && (
                    <div className={cn(
                      'flex items-center gap-1 text-sm',
                      isPositive ? 'text-success' : uplift < 0 ? 'text-danger' : 'text-muted-foreground'
                    )}>
                      <TrendIcon className="h-4 w-4" />
                      {Math.abs(uplift).toFixed(1)}%
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatNumber(variant.conversions)} conversões
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Taxa de conversão</span>
                <span>{formatPercent(variant.conversionRate)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: variant.color,
                    width: `${Math.min(variant.conversionRate * 10, 100)}%`
                  }}
                />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export function StatisticalSignificance({
  controlConversions,
  controlVisitors,
  variantConversions,
  variantVisitors,
  variantName = 'Variante'
}: {
  controlConversions: number
  controlVisitors: number
  variantConversions: number
  variantVisitors: number
  variantName?: string
}) {
  const results = useMemo(() => {
    if (controlVisitors === 0 || variantVisitors === 0) return null

    const p1 = controlConversions / controlVisitors
    const p2 = variantConversions / variantVisitors

    const pooledProbability = (controlConversions + variantConversions) / (controlVisitors + variantVisitors)
    const standardError = Math.sqrt(pooledProbability * (1 - pooledProbability) * (1/controlVisitors + 1/variantVisitors))

    if (standardError === 0) return null

    const zScore = (p2 - p1) / standardError
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))

    return {
      zScore,
      pValue,
      isSignificant: pValue < 0.05,
      confidenceLevel: (1 - pValue) * 100,
      uplift: ((p2 - p1) / p1) * 100,
      lowerBound: ((p2 - p1) / p1 - 1.96 * standardError / p1) * 100,
      upperBound: ((p2 - p1) / p1 + 1.96 * standardError / p1) * 100
    }
  }, [controlConversions, controlVisitors, variantConversions, variantVisitors])

  if (!results) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Significância Estatística</h3>
        <p className="text-muted-foreground">
          Dados insuficientes para calcular significância estatística.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Significância Estatística
      </h3>

      <div className="space-y-4">
        {/* Significance indicator */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <span className="font-medium">Status</span>
          <Badge
            variant={results.isSignificant ? 'default' : 'secondary'}
            className={results.isSignificant ? 'bg-success text-success-foreground' : ''}
          >
            {results.isSignificant ? 'Significante' : 'Não significante'}
          </Badge>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">
              {results.uplift > 0 ? '+' : ''}{results.uplift.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Uplift</p>
          </div>

          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">
              {results.confidenceLevel.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Confiança</p>
          </div>
        </div>

        {/* Confidence interval */}
        <div>
          <p className="text-sm font-medium mb-2">Intervalo de Confiança (95%)</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {results.lowerBound.toFixed(1)}%
            </span>
            <div className="flex-1 h-2 bg-muted rounded-full relative">
              <div
                className="absolute h-full bg-primary rounded-full"
                style={{
                  left: '50%',
                  width: '20%',
                  transform: 'translateX(-50%)'
                }}
              />
            </div>
            <span className="text-muted-foreground">
              +{results.upperBound.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Additional details */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>P-value: {results.pValue.toFixed(4)}</p>
          <p>Z-score: {results.zScore.toFixed(3)}</p>
          <p>
            {results.isSignificant
              ? `${variantName} tem performance significativamente diferente do controle.`
              : 'Não há evidência estatística suficiente de diferença.'}
          </p>
        </div>
      </div>
    </Card>
  )
}

// Helper function for normal CDF
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

function erf(x: number): number {
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911

  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}