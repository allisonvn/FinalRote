'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  MousePointer,
  Target,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface EventTrendsData {
  date: string
  page_views: number
  clicks: number
  conversions: number
  total: number
}

interface EventTypeDistribution {
  name: string
  value: number
  color: string
}

interface EventTrendsChartProps {
  timeSeriesData: EventTrendsData[]
  distributionData: EventTypeDistribution[]
  totalEvents: number
  periodChange: number
}

export function EventTrendsChart({
  timeSeriesData,
  distributionData,
  totalEvents,
  periodChange
}: EventTrendsChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area')
  const [selectedMetric, setSelectedMetric] = useState<'total' | 'page_views' | 'clicks' | 'conversions'>('total')

  const COLORS = {
    page_views: '#3b82f6',
    clicks: '#10b981',
    conversions: '#8b5cf6',
    total: '#6366f1'
  }

  const metrics = [
    { value: 'total', label: 'Total de Eventos', color: COLORS.total, icon: Activity },
    { value: 'page_views', label: 'Visualizações', color: COLORS.page_views, icon: Eye },
    { value: 'clicks', label: 'Cliques', color: COLORS.clicks, icon: MousePointer },
    { value: 'conversions', label: 'Conversões', color: COLORS.conversions, icon: Target }
  ]

  const currentMetric = metrics.find(m => m.value === selectedMetric)!

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-xl p-4 shadow-2xl">
          <p className="font-bold text-slate-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-slate-600">{entry.name}:</span>
              <span className="text-sm font-bold text-slate-900">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data: timeSeriesData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    }

    const xAxisProps = {
      dataKey: "date",
      stroke: "#94a3b8",
      fontSize: 12,
      tickLine: false,
      axisLine: false
    }

    const yAxisProps = {
      stroke: "#94a3b8",
      fontSize: 12,
      tickLine: false,
      axisLine: false,
      tickFormatter: (value: number) => value.toLocaleString()
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                formatter={(value) => <span className="text-sm font-semibold text-slate-700">{value}</span>}
              />
              {selectedMetric === 'total' ? (
                <>
                  <Bar dataKey="page_views" name="Visualizações" fill={COLORS.page_views} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="clicks" name="Cliques" fill={COLORS.clicks} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="conversions" name="Conversões" fill={COLORS.conversions} radius={[8, 8, 0, 0]} />
                </>
              ) : (
                <Bar
                  dataKey={selectedMetric}
                  name={currentMetric.label}
                  fill={currentMetric.color}
                  radius={[8, 8, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                formatter={(value) => <span className="text-sm font-semibold text-slate-700">{value}</span>}
              />
              {selectedMetric === 'total' ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="page_views"
                    name="Visualizações"
                    stroke={COLORS.page_views}
                    strokeWidth={3}
                    dot={{ fill: COLORS.page_views, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    name="Cliques"
                    stroke={COLORS.clicks}
                    strokeWidth={3}
                    dot={{ fill: COLORS.clicks, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    name="Conversões"
                    stroke={COLORS.conversions}
                    strokeWidth={3}
                    dot={{ fill: COLORS.conversions, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  name={currentMetric.label}
                  stroke={currentMetric.color}
                  strokeWidth={3}
                  dot={{ fill: currentMetric.color, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'area':
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.page_views} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.page_views} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.clicks} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.clicks} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.conversions} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.conversions} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.total} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.total} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                formatter={(value) => <span className="text-sm font-semibold text-slate-700">{value}</span>}
              />
              {selectedMetric === 'total' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="page_views"
                    name="Visualizações"
                    stroke={COLORS.page_views}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPageViews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    name="Cliques"
                    stroke={COLORS.clicks}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    name="Conversões"
                    stroke={COLORS.conversions}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorConversions)"
                  />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  name={currentMetric.label}
                  stroke={currentMetric.color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#color${selectedMetric === 'page_views' ? 'PageViews' : selectedMetric === 'clicks' ? 'Clicks' : 'Conversions'})`}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Timeline Chart */}
      <Card className="lg:col-span-2 backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Tendência de Eventos
              </h3>
              <p className="text-sm text-slate-600">
                Acompanhe a evolução dos eventos ao longo do tempo
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Chart Type Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <Button
                  variant={chartType === 'area' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('area')}
                  className={cn(
                    "h-8 w-8 p-0",
                    chartType === 'area' && "bg-white shadow-sm"
                  )}
                >
                  <BarChart3 className={cn(
                    "h-4 w-4",
                    chartType === 'area' ? "text-slate-900" : "text-slate-600"
                  )} />
                </Button>
                <Button
                  variant={chartType === 'line' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  className={cn(
                    "h-8 w-8 p-0",
                    chartType === 'line' && "bg-white shadow-sm"
                  )}
                >
                  <LineChartIcon className={cn(
                    "h-4 w-4",
                    chartType === 'line' ? "text-slate-900" : "text-slate-600"
                  )} />
                </Button>
                <Button
                  variant={chartType === 'bar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                  className={cn(
                    "h-8 w-8 p-0",
                    chartType === 'bar' && "bg-white shadow-sm"
                  )}
                >
                  <BarChart3 className={cn(
                    "h-4 w-4",
                    chartType === 'bar' ? "text-slate-900" : "text-slate-600"
                  )} />
                </Button>
              </div>
            </div>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {metrics.map((metric) => {
              const Icon = metric.icon
              return (
                <Button
                  key={metric.value}
                  variant={selectedMetric === metric.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric(metric.value as any)}
                  className={cn(
                    selectedMetric === metric.value
                      ? "border-0 shadow-lg"
                      : "bg-white hover:bg-slate-50 border-2 border-slate-200"
                  )}
                  style={
                    selectedMetric === metric.value
                      ? { backgroundColor: metric.color }
                      : {}
                  }
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {metric.label}
                </Button>
              )
            })}
          </div>

          {/* Chart */}
          <div className="h-80 w-full min-h-80">
            {renderChart()}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-1">Total de Eventos</p>
              <p className="text-2xl font-bold text-slate-900">{totalEvents.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-1">Variação no Período</p>
              <div className="flex items-center justify-center gap-1">
                {periodChange >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <p className={cn(
                  "text-2xl font-bold",
                  periodChange >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {Math.abs(periodChange).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-1">Média Diária</p>
              <p className="text-2xl font-bold text-slate-900">
                {Math.round(totalEvents / (timeSeriesData.length || 1)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Distribution Pie Chart */}
      <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Distribuição por Tipo
            </h3>
            <p className="text-sm text-slate-600">
              Proporção de cada tipo de evento
            </p>
          </div>

          {(() => {
            const totalValue = distributionData.reduce((sum, item) => sum + item.value, 0)
            const hasData = totalValue > 0

            if (!hasData) {
              return (
                <div className="h-64 flex flex-col items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <PieChartIcon className="w-12 h-12 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Nenhum evento ainda</p>
                  <p className="text-xs text-slate-400 mt-1">Os dados aparecerão aqui quando houver eventos</p>
                </div>
              )
            }

            // Filtrar apenas itens com valor > 0 para o gráfico
            const filteredData = distributionData.filter(item => item.value > 0)

            return (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => {
                          if (percent < 0.05) return '' // Não mostrar label para fatias muito pequenas
                          return `${name} ${(percent * 100).toFixed(0)}%`
                        }}
                        outerRadius={80}
                        innerRadius={0}
                        fill="#8884d8"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {filteredData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0]
                            return (
                              <div className="bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-xl p-3 shadow-2xl">
                                <p className="font-bold text-slate-900 mb-1">{data.name}</p>
                                <p className="text-sm text-slate-600">
                                  {data.value?.toLocaleString()} eventos
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {(((data.value as number) / totalValue) * 100).toFixed(1)}% do total
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="space-y-3">
                  {distributionData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className={cn(
                          "text-sm font-medium",
                          item.value === 0 ? "text-slate-400" : "text-slate-700"
                        )}>
                          {item.name}
                        </span>
                      </div>
                      <span className={cn(
                        "text-sm font-bold",
                        item.value === 0 ? "text-slate-400" : "text-slate-900"
                      )}>
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      </Card>
    </div>
  )
}
