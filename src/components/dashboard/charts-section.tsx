'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Calendar, 
  Download,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Users,
  MousePointer,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Eye,
  Share2,
  Search,
  Zap,
  Percent,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Settings
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  ScatterChart
} from 'recharts'
import { cn } from '@/lib/utils'

interface ChartsSectionProps {
  className?: string
}

export function ChartsSection({ className }: ChartsSectionProps) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedExperiment, setSelectedExperiment] = useState<string>('all')
  const [metricType, setMetricType] = useState<'conversion' | 'revenue' | 'engagement'>('conversion')
  const [viewType, setViewType] = useState<'overview' | 'detailed' | 'comparison'>('overview')
  const [filterSearch, setFilterSearch] = useState('')

  // Mock experiments data
  const experiments = [
    { id: 'all', name: 'Todos os Experimentos' },
    { id: 'exp1', name: 'Botão CTA Principal - Homepage' },
    { id: 'exp2', name: 'Checkout Flow Simplificado' },
    { id: 'exp3', name: 'Banner Promocional Header' },
    { id: 'exp4', name: 'Layout Grid Produtos' }
  ]

  // Enhanced mock data with more A/B testing specific metrics
  const performanceData = [
    { 
      date: '2024-01-01', 
      control_visitors: 1200, 
      control_conversions: 72, 
      control_rate: 6.0,
      variant_a_visitors: 1180, 
      variant_a_conversions: 89, 
      variant_a_rate: 7.5,
      variant_b_visitors: 1150, 
      variant_b_conversions: 94, 
      variant_b_rate: 8.2,
      statistical_significance: 85,
      confidence_interval: 95
    },
    { 
      date: '2024-01-02', 
      control_visitors: 1350, 
      control_conversions: 81, 
      control_rate: 6.0,
      variant_a_visitors: 1320, 
      variant_a_conversions: 106, 
      variant_a_rate: 8.0,
      variant_b_visitors: 1280, 
      variant_b_conversions: 115, 
      variant_b_rate: 9.0,
      statistical_significance: 92,
      confidence_interval: 95
    },
    { 
      date: '2024-01-03', 
      control_visitors: 1100, 
      control_conversions: 66, 
      control_rate: 6.0,
      variant_a_visitors: 1080, 
      variant_a_conversions: 86, 
      variant_a_rate: 8.0,
      variant_b_visitors: 1050, 
      variant_b_conversions: 95, 
      variant_b_rate: 9.0,
      statistical_significance: 96,
      confidence_interval: 95
    }
  ]

  const experimentSummaryData = [
    {
      id: 'exp1',
      name: 'Botão CTA Principal',
      status: 'running',
      control_rate: 6.2,
      best_variant_rate: 9.1,
      improvement: 46.8,
      significance: 98,
      visitors: 15420,
      duration: 14,
      revenue_impact: 28500
    },
    {
      id: 'exp2', 
      name: 'Checkout Simplificado',
      status: 'completed',
      control_rate: 12.4,
      best_variant_rate: 18.7,
      improvement: 50.8,
      significance: 99,
      visitors: 8920,
      duration: 21,
      revenue_impact: 85600
    },
    {
      id: 'exp3',
      name: 'Banner Header',
      status: 'paused',
      control_rate: 3.8,
      best_variant_rate: 4.1,
      improvement: 7.9,
      significance: 67,
      visitors: 22100,
      duration: 7,
      revenue_impact: 4200
    }
  ]

  const revenueData = [
    { period: 'Sem 1', control: 12500, variants: 15800, lift: 26.4 },
    { period: 'Sem 2', control: 13200, variants: 17100, lift: 29.5 },
    { period: 'Sem 3', control: 11800, variants: 16200, lift: 37.3 },
    { period: 'Sem 4', control: 14100, variants: 18900, lift: 34.0 }
  ]

  const significanceData = [
    { experiment: 'CTA Button', significance: 98, sample_size: 15420 },
    { experiment: 'Checkout', significance: 99, sample_size: 8920 },
    { experiment: 'Header', significance: 67, sample_size: 22100 },
    { experiment: 'Product Grid', significance: 89, sample_size: 11200 }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border bg-white dark:bg-gray-900 p-4 shadow-2xl border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span style={{ color: item.color }} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}
                {item.name.includes('Taxa') || item.name.includes('rate') ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Enhanced Header with Advanced Controls */}
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Relatórios Avançados
            </h1>
            <p className="text-muted-foreground text-lg">
              Análise profunda de A/B testing com insights estatísticos
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 gap-2">
              <Settings className="h-4 w-4" />
              Configurar
            </Button>
          </div>
        </div>

        {/* Advanced Filters & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-2xl border border-indigo-200 dark:border-indigo-800">
          <div className="space-y-2">
            <label className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Período</label>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
              <SelectTrigger className="bg-white dark:bg-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="1y">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Experimento</label>
            <Select value={selectedExperiment} onValueChange={setSelectedExperiment}>
              <SelectTrigger className="bg-white dark:bg-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {experiments.map(exp => (
                  <SelectItem key={exp.id} value={exp.id}>{exp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Métrica</label>
            <Select value={metricType} onValueChange={(value) => setMetricType(value as any)}>
              <SelectTrigger className="bg-white dark:bg-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversion">Taxa de Conversão</SelectItem>
                <SelectItem value="revenue">Receita</SelectItem>
                <SelectItem value="engagement">Engajamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Visualização</label>
            <Select value={viewType} onValueChange={(value) => setViewType(value as any)}>
              <SelectTrigger className="bg-white dark:bg-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Visão Geral</SelectItem>
                <SelectItem value="detailed">Detalhada</SelectItem>
                <SelectItem value="comparison">Comparação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Melhoria Média</p>
                <p className="text-3xl font-bold text-green-800 dark:text-green-200">+31.5%</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">vs controle</p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Significância</p>
                <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">94.2%</p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">confiança</p>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Receita Extra</p>
                <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">R$ 118k</p>
                <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">este mês</p>
              </div>
              <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Visitantes</p>
                <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">47.2k</p>
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">testados</p>
              </div>
              <div className="h-12 w-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Performance Comparison Chart */}
        <Card className="xl:col-span-2 bg-white dark:bg-gray-900 shadow-2xl border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Taxa de Conversão por Variante
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Comparação em tempo real: Controle vs Variantes A e B
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +31.5% lift
                </Badge>
                <Button variant="ghost" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="controlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b7280" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6b7280" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="variantAGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="variantBGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="control_rate" 
                    stroke="#6b7280" 
                    fillOpacity={1}
                    fill="url(#controlGradient)"
                    strokeWidth={3}
                    name="Controle"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="variant_a_rate" 
                    stroke="#3b82f6" 
                    fillOpacity={1}
                    fill="url(#variantAGradient)"
                    strokeWidth={3}
                    name="Variante A"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="variant_b_rate" 
                    stroke="#10b981" 
                    fillOpacity={1}
                    fill="url(#variantBGradient)"
                    strokeWidth={3}
                    name="Variante B"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Statistical Significance */}
        <Card className="bg-white dark:bg-gray-900 shadow-2xl border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              Significância Estatística
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Confiabilidade dos resultados
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {significanceData.map((item, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.experiment}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{item.significance}%</span>
                      {item.significance >= 95 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : item.significance >= 85 ? (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        item.significance >= 95 ? 'bg-green-500' :
                        item.significance >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${item.significance}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.sample_size.toLocaleString()} amostras
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiment Summary Table */}
      <Card className="bg-white dark:bg-gray-900 shadow-2xl border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              Resumo dos Experimentos
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar experimentos..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-2 font-semibold text-gray-600 dark:text-gray-300">Experimento</th>
                  <th className="text-left py-4 px-2 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="text-right py-4 px-2 font-semibold text-gray-600 dark:text-gray-300">Controle</th>
                  <th className="text-right py-4 px-2 font-semibold text-gray-600 dark:text-gray-300">Melhor Variante</th>
                  <th className="text-right py-4 px-2 font-semibold text-gray-600 dark:text-gray-300">Melhoria</th>
                  <th className="text-right py-4 px-2 font-semibold text-gray-600 dark:text-gray-300">Significância</th>
                  <th className="text-right py-4 px-2 font-semibold text-gray-600 dark:text-gray-300">Visitantes</th>
                  <th className="text-right py-4 px-2 font-semibold text-gray-600 dark:text-gray-300">Receita</th>
                </tr>
              </thead>
              <tbody>
                {experimentSummaryData.map((exp, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-indigo-500" />
                        <span className="font-medium">{exp.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <Badge 
                        variant={exp.status === 'running' ? 'default' : exp.status === 'completed' ? 'secondary' : 'outline'}
                        className={
                          exp.status === 'running' ? 'bg-green-100 text-green-800 border-green-200' :
                          exp.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }
                      >
                        {exp.status === 'running' ? 'Ativo' : exp.status === 'completed' ? 'Concluído' : 'Pausado'}
                      </Badge>
                    </td>
                    <td className="py-4 px-2 text-right font-medium">{exp.control_rate}%</td>
                    <td className="py-4 px-2 text-right font-medium">{exp.best_variant_rate}%</td>
                    <td className="py-4 px-2 text-right">
                      <span className={`font-bold ${exp.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {exp.improvement > 0 ? '+' : ''}{exp.improvement}%
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-medium">{exp.significance}%</span>
                        {exp.significance >= 95 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : exp.significance >= 85 ? (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right font-medium">{exp.visitors.toLocaleString()}</td>
                    <td className="py-4 px-2 text-right">
                      <span className="font-bold text-green-600">
                        R$ {(exp.revenue_impact / 1000).toFixed(0)}k
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Impact Chart */}
      <Card className="bg-white dark:bg-gray-900 shadow-2xl border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            Impacto na Receita
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Receita adicional gerada pelos experimentos
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis 
                  dataKey="period" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="revenue"
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  yAxisId="lift"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border bg-white dark:bg-gray-900 p-4 shadow-2xl">
                          <p className="font-semibold mb-2">{label}</p>
                          {payload.map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4 text-sm">
                              <span style={{ color: item.color }} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                {item.name}
                              </span>
                              <span className="font-medium">
                                {item.name === 'Lift' ? `${item.value}%` : `R$ ${(item.value / 1000).toFixed(1)}k`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar yAxisId="revenue" dataKey="control" fill="#6b7280" name="Controle" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="revenue" dataKey="variants" fill="#10b981" name="Variantes" radius={[4, 4, 0, 0]} />
                <Line yAxisId="lift" type="monotone" dataKey="lift" stroke="#f59e0b" strokeWidth={3} name="Lift" dot={{ fill: '#f59e0b', r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
