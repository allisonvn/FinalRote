"use client"

import { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExperimentDetailsModal } from '@/components/dashboard/experiment-details-modal'
import { EmptyState } from '@/components/empty-state'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { cn } from '@/lib/utils'
import { calculateExperimentMetrics, calculateMultipleExperimentMetrics, formatMetricValue, ExperimentMetrics } from '@/lib/experiment-metrics'
import {
  Plus, Grid, List, Filter, Search, Tag, X, ArrowUpDown,
  Zap, TrendingUp, Users, Target, Clock, Brain, BarChart3,
  Sparkles, Rocket, Star, Globe, Eye, Play, Pause, CheckCircle2,
  XCircle, AlertCircle, Calendar, Activity, Crown, Trophy,
  ChevronDown, SlidersHorizontal, Layers, FlaskConical,
  MousePointer, Award, Shield, LineChart, PieChart,
  RefreshCw, Settings, Share2, Edit3, ArrowUpRight, ArrowDownRight,
  Percent, DollarSign, TrendingDown, ExternalLink, Info, Trash2
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PremiumExperimentsTabProps {
  experiments: any[]
  loading: boolean
  onNewExperiment: () => void
}

const statusConfig = {
  draft: {
    label: 'Rascunho',
    color: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-300',
    icon: Eye,
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200'
  },
  running: {
    label: 'Executando',
    color: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border border-emerald-600 shadow-lg',
    icon: Play,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  paused: {
    label: 'Pausado',
    color: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border border-amber-500 shadow-lg',
    icon: Pause,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200'
  },
  completed: {
    label: 'Concluído',
    color: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border border-blue-600 shadow-lg',
    icon: CheckCircle2,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  }
}

const algorithmConfig = {
  thompson_sampling: { label: 'Thompson Sampling', icon: Brain, premium: true, color: 'text-purple-600' },
  ucb1: { label: 'UCB1', icon: TrendingUp, premium: true, color: 'text-blue-600' },
  epsilon_greedy: { label: 'Epsilon Greedy', icon: Target, premium: false, color: 'text-green-600' },
  uniform: { label: 'Uniforme', icon: BarChart3, premium: false, color: 'text-slate-600' }
}

// Interface para experimento com métricas reais
interface ExperimentWithMetrics {
  id: string
  name: string
  description?: string
  status: string
  algorithm?: string
  variants?: any[]
  performance?: ExperimentMetrics
}

export function PremiumExperimentsTab({ experiments, loading, onNewExperiment }: PremiumExperimentsTabProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | string>('all')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'status' | 'performance'>('recent')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null)
  
  // Usar estatísticas reais do Supabase
  const { stats: realStats, loading: statsLoading } = useDashboardStats()
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  // Estado para métricas reais
  const [experimentsMetrics, setExperimentsMetrics] = useState<Record<string, ExperimentMetrics>>({})
  const [metricsLoading, setMetricsLoading] = useState(false)
  
  // Estado para deletar experimentos
  const [deletingExperiment, setDeletingExperiment] = useState<string | null>(null)

  // Função para deletar experimento
  const handleDeleteExperiment = async (experimentId: string, experimentName: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar o experimento "${experimentName}"?\n\nEsta ação não pode ser desfeita e removerá todos os dados relacionados.`)) {
      return
    }

    setDeletingExperiment(experimentId)
    try {
      const response = await fetch(`/api/experiments/${experimentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao deletar experimento')
      }

      // Remover experimento da lista local
      setExperiments(prev => prev.filter(exp => exp.id !== experimentId))
      
      // Mostrar sucesso
      alert('Experimento deletado com sucesso!')
    } catch (error) {
      console.error('Erro ao deletar experimento:', error)
      alert(`Erro ao deletar experimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setDeletingExperiment(null)
    }
  }

  // Carregar métricas reais dos experimentos
  useEffect(() => {
    const loadMetrics = async () => {
      if (experiments.length === 0) return
      
      setMetricsLoading(true)
      try {
        const experimentIds = experiments.map(exp => exp.id)
        const metrics = await calculateMultipleExperimentMetrics(experimentIds)
        setExperimentsMetrics(metrics)
      } catch (error) {
        console.error('Erro ao carregar métricas dos experimentos:', error)
      } finally {
        setMetricsLoading(false)
      }
    }

    loadMetrics()
  }, [experiments])

  // Processar experimentos com métricas reais
  const processedExperiments = useMemo(() => {
    return experiments.map(exp => ({
      ...exp,
      performance: experimentsMetrics[exp.id] || {
        visitors: 0,
        conversions: 0,
        conversionRate: 0,
        confidence: 0,
        revenue: 0,
        improvement: 0
      }
    }))
  }, [experiments, experimentsMetrics])

  // Stats calculadas
  // Usar estatísticas reais do Supabase em vez de dados mock
  const stats = useMemo(() => {
    if (statsLoading) {
      return {
        total: 0,
        running: 0,
        completed: 0,
        avgConversionRate: 0,
        totalRevenue: 0,
        avgImprovement: 0
      }
    }

    return {
      total: realStats.totalExperiments,
      running: realStats.activeExperiments,
      completed: realStats.completedExperiments,
      avgConversionRate: realStats.avgConversionRate,
      totalRevenue: realStats.totalRevenue,
      avgImprovement: realStats.avgImprovement
    }
  }, [realStats, statsLoading])

  // Filtrar experimentos
  const filteredExperiments = useMemo(() => {
    let filtered = processedExperiments.filter(exp => {
      const matchesQuery = !query || exp.name.toLowerCase().includes(query.toLowerCase()) ||
                          exp.description?.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === 'all' || exp.status === status
      return matchesQuery && matchesStatus
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'status':
          return a.status.localeCompare(b.status)
        case 'performance':
          return (b.performance?.conversionRate || 0) - (a.performance?.conversionRate || 0)
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return filtered
  }, [processedExperiments, query, status, sortBy])

  const handleViewDetails = (experiment: any) => {
    setSelectedExperiment(experiment)
    setShowDetailsModal(true)
  }

  const hasActiveFilters = query || status !== 'all' || sortBy !== 'recent'

  const clearFilters = () => {
    setQuery('')
    setStatus('all')
    setSortBy('recent')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-8">
        {/* Header Premium */}
        <div className="space-y-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-4xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl">
                  <FlaskConical className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Experimentos A/B
                  </h1>
                  <p className="text-slate-600 text-xl font-medium">Centro de comando para otimização de conversões</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={onNewExperiment}
                className="h-14 px-10 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl font-bold text-lg"
              >
                <Plus className="w-6 h-6 mr-3" />
                Novo Experimento
              </Button>
            </div>
          </div>

          {/* Stats Cards Premium */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
            <Card className="col-span-2 lg:col-span-1 p-8 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border-2 border-blue-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden">
              {/* Indicador de carregamento */}
              {statsLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-4xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <Layers className="w-8 h-8 text-white" />
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-all duration-300">
                  <ArrowUpRight className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-blue-900 mb-2">Total de Experimentos</p>
                <p className="text-4xl font-black text-blue-700 transition-all duration-300">
                  {statsLoading ? '...' : stats.total}
                </p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-3">
                  <TrendingUp className="w-3 h-3" />
                  Últimos 30 dias
                </p>
              </div>
            </Card>

            <Card className="col-span-2 lg:col-span-1 p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-4xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-all duration-300">
                  <ArrowUpRight className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-green-900 mb-2">Ativos</p>
                <p className="text-4xl font-black text-green-700 transition-all duration-300">
                  {statsLoading ? '...' : stats.running}
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-3">
                  <Play className="w-3 h-3" />
                  Em execução
                </p>
              </div>
            </Card>

            <Card className="col-span-2 lg:col-span-1 p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-2 border-purple-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-4xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-all duration-300">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-purple-900 mb-2">Concluídos</p>
                <p className="text-4xl font-black text-purple-700 transition-all duration-300">
                  {statsLoading ? '...' : stats.completed}
                </p>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-3">
                  <Award className="w-3 h-3" />
                  Com resultados
                </p>
              </div>
            </Card>

            <Card className="col-span-2 lg:col-span-1 p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-2 border-amber-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-4xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-all duration-300">
                  <Percent className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-amber-900 mb-2">Conv. Média</p>
                <p className="text-4xl font-black text-amber-700 transition-all duration-300">
                  {statsLoading ? '...' : `${stats.avgConversionRate.toFixed(1)}%`}
                </p>
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-3">
                  <Target className="w-3 h-3" />
                  Taxa global
                </p>
              </div>
            </Card>

            <Card className="col-span-2 lg:col-span-1 p-8 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-2 border-indigo-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-4xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-all duration-300">
                  <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-indigo-900 mb-2">Receita</p>
                <p className="text-4xl font-black text-indigo-700 transition-all duration-300">
                  {statsLoading ? '...' : `R$ ${(stats.totalRevenue / 1000).toFixed(0)}k`}
                </p>
                <p className="text-xs text-indigo-600 flex items-center gap-1 mt-3">
                  <Sparkles className="w-3 h-3" />
                  Impacto total
                </p>
              </div>
            </Card>

            <Card className="col-span-2 lg:col-span-1 p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-4xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-all duration-300">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-emerald-900 mb-2">Melhoria</p>
                <p className="text-4xl font-black text-emerald-700 transition-all duration-300">
                  {statsLoading ? '...' : `+${stats.avgImprovement.toFixed(0)}%`}
                </p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-3">
                  <Star className="w-3 h-3" />
                  Média geral
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Barra de Filtros Melhorada */}
        <Card className="p-6 bg-gradient-to-r from-white via-slate-50/50 to-blue-50/30 border border-slate-200/50 shadow-lg relative z-10">
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row gap-4">
              {/* Busca */}
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar experimentos..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-12 text-sm border-2 border-slate-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 bg-white/90 backdrop-blur-sm"
                />
              </div>

              {/* Filtros e Controles */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Filtro de Status */}
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger className="w-48 h-12 border-2 border-slate-200 rounded-xl focus:border-primary transition-all duration-300 text-sm font-medium bg-white/90 backdrop-blur-sm hover:border-slate-300">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] rounded-xl border-border/60 shadow-xl bg-white/95 backdrop-blur-xl">
                    <SelectItem value="all" className="rounded-lg">Todos os Status</SelectItem>
                    <SelectItem value="draft" className="rounded-lg">Rascunho</SelectItem>
                    <SelectItem value="running" className="rounded-lg">Executando</SelectItem>
                    <SelectItem value="paused" className="rounded-lg">Pausado</SelectItem>
                    <SelectItem value="completed" className="rounded-lg">Concluído</SelectItem>
                  </SelectContent>
                </Select>

                {/* Ordenação */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-44 h-12 border-2 border-slate-200 rounded-xl focus:border-primary transition-all duration-300 text-sm font-medium bg-white/90 backdrop-blur-sm hover:border-slate-300">
                    <ArrowUpDown className="w-4 h-4 mr-2 text-slate-500" />
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] rounded-xl border-border/60 shadow-xl bg-white/95 backdrop-blur-xl">
                    <SelectItem value="recent" className="rounded-lg">Mais recentes</SelectItem>
                    <SelectItem value="name" className="rounded-lg">Nome A-Z</SelectItem>
                    <SelectItem value="status" className="rounded-lg">Status</SelectItem>
                    <SelectItem value="performance" className="rounded-lg">Desempenho</SelectItem>
                  </SelectContent>
                </Select>

                {/* Botões de Visualização */}
                <div className="flex gap-2 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-1">
                  <Button
                    variant={layout === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setLayout('grid')}
                    className="h-10 w-10 p-0 rounded-lg transition-all duration-300"
                    title="Visualização em grade"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={layout === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setLayout('list')}
                    className="h-10 w-10 p-0 rounded-lg transition-all duration-300"
                    title="Visualização em lista"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200/60">
                <div className="flex items-center gap-4">
                  <p className="text-lg text-slate-600 font-semibold">
                    {filteredExperiments.length} de {processedExperiments.length} experimentos encontrados
                  </p>
                  {query && (
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      Busca: "{query}"
                    </span>
                  )}
                  {status !== 'all' && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                      Status: {statusConfig[status as keyof typeof statusConfig]?.label}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl h-12 px-6 font-medium transition-all duration-200 hover:scale-105"
                >
                  <X className="w-5 h-5 mr-2" />
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Lista de experimentos */}
        {loading ? (
          <div className={cn(
            layout === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8'
              : 'space-y-8'
          )}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="p-10 animate-pulse">
                <div className="space-y-6">
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredExperiments.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title={hasActiveFilters ? 'Nenhum experimento encontrado' : 'Nenhum experimento criado'}
            description={hasActiveFilters
              ? 'Tente ajustar os filtros ou buscar por outros termos'
              : 'Crie seu primeiro experimento A/B para começar a otimizar conversões'
            }
            action={
              hasActiveFilters ? (
                <Button onClick={clearFilters} variant="outline" className="rounded-2xl h-14 px-8 font-semibold">
                  <X className="w-5 h-5 mr-2" />
                  Limpar filtros
                </Button>
              ) : (
                <Button onClick={onNewExperiment} className="rounded-2xl h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 font-semibold">
                  <Plus className="w-5 h-5 mr-2" />
                  Criar primeiro experimento
                </Button>
              )
            }
          />
        ) : (
          <div className={cn(
            layout === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 stagger-animation'
              : 'space-y-8 stagger-animation'
          )}>
            {filteredExperiments.map((experiment) => (
              <PremiumExperimentCard
                key={experiment.id}
                experiment={experiment}
                layout={layout}
                onViewDetails={handleViewDetails}
                onDelete={handleDeleteExperiment}
                metricsLoading={metricsLoading}
                isDeleting={deletingExperiment === experiment.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      {showDetailsModal && selectedExperiment && (
        <ExperimentDetailsModal
          experiment={selectedExperiment}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedExperiment(null)
          }}
        />
      )}
    </div>
  )
}

// Card de experimento premium
function PremiumExperimentCard({
  experiment,
  layout,
  onViewDetails,
  onDelete,
  metricsLoading,
  isDeleting
}: {
  experiment: any
  layout: 'grid' | 'list'
  onViewDetails: (experiment: any) => void
  onDelete: (experimentId: string, experimentName: string) => void
  metricsLoading: boolean
  isDeleting: boolean
}) {
  const statusInfo = statusConfig[experiment.status as keyof typeof statusConfig]
  const StatusIcon = statusInfo.icon
  const algorithmInfo = algorithmConfig[experiment.algorithm || 'uniform']
  const AlgorithmIcon = algorithmInfo?.icon || BarChart3

  if (layout === 'list') {
    return (
      <Card className="p-10 hover:shadow-2xl transition-all duration-500 border-2 hover:border-blue-300 hover:scale-[1.01] bg-gradient-to-r from-white to-blue-50/30 z-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8 flex-1">
            <div className="w-20 h-20 rounded-4xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl">
              <FlaskConical className="w-10 h-10 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-6 mb-4">
                <h3 className="font-black text-3xl text-slate-900 hover:text-blue-600 transition-colors">
                  {experiment.name}
                </h3>
                <Badge className={cn("text-white text-base px-4 py-2", statusInfo.color)}>
                  <StatusIcon className="w-5 h-5 mr-2" />
                  {statusInfo.label}
                </Badge>
                {algorithmInfo?.premium && (
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-base px-4 py-2">
                    <Crown className="w-5 h-5 mr-2" />
                    Premium
                  </Badge>
                )}
              </div>

              <p className="text-slate-600 text-lg mb-6 line-clamp-2">
                {experiment.description || 'Experimento A/B para otimização de conversões'}
              </p>

              <div className="flex items-center gap-10 text-base">
                <div className="flex items-center gap-3 text-slate-600">
                  <Users className="w-6 h-6" />
                  <span className="font-bold">{experiment.performance?.visitors.toLocaleString()} visitantes</span>
                </div>
                <div className="flex items-center gap-3 text-green-600">
                  <TrendingUp className="w-6 h-6" />
                  <span className="font-black">{experiment.performance?.conversionRate.toFixed(1)}% conversão</span>
                </div>
                <div className="flex items-center gap-3 text-blue-600">
                  <AlgorithmIcon className="w-6 h-6" />
                  <span className="font-bold">{algorithmInfo?.label}</span>
                </div>
                {experiment.performance?.improvement !== undefined && (
                  <div className="flex items-center gap-3">
                    {experiment.performance.improvement > 0 ? (
                      <ArrowUpRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-6 h-6 text-red-600" />
                    )}
                    <span className={cn(
                      "font-black text-lg",
                      experiment.performance.improvement > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {experiment.performance.improvement > 0 ? '+' : ''}{experiment.performance.improvement.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => onViewDetails(experiment)}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-14 px-8 font-bold"
            >
              <Eye className="w-5 h-5 mr-2" />
              Ver Detalhes
            </Button>
            <Button
              onClick={() => onDelete(experiment.id, experiment.name)}
              disabled={isDeleting}
              variant="outline"
              className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-14 px-8 font-bold"
            >
              {isDeleting ? (
                <>
                  <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-2" />
                  Deletar
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group relative overflow-hidden p-8 hover:shadow-2xl transition-all duration-500 border border-border/60 hover:border-primary/40 hover:scale-[1.02] bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 backdrop-blur-sm card-hover z-0">
      <div className="space-y-6">
        {/* Enhanced Header com ícone, título e status */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
              <FlaskConical className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl text-slate-900 group-hover:text-primary transition-colors mb-1 truncate">
                {experiment.name}
              </h3>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {experiment.variants?.length || 0} variantes
              </p>
            </div>
          </div>
          
          {/* Enhanced Status badge */}
          <Badge className={cn(
            "text-white text-sm px-4 py-2 shadow-lg flex-shrink-0 rounded-full font-medium transition-all duration-200 hover:scale-105", 
            statusInfo.color
          )}>
            <StatusIcon className="w-4 h-4 mr-1.5" />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Descrição */}
        <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
          {experiment.description || 'Experimento A/B para otimização de conversões e análise de performance detalhada.'}
        </p>

        {/* Enhanced Métricas principais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-200/60 hover:border-green-300 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Conversão</span>
            </div>
            <span className="font-bold text-2xl text-green-700">
              {metricsLoading ? '...' : formatMetricValue(experiment.performance?.conversionRate || 0, 'conversion')}
            </span>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-200/60 hover:border-blue-300 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Visitantes</span>
            </div>
            <span className="font-bold text-2xl text-blue-700">
              {metricsLoading ? '...' : formatMetricValue(experiment.performance?.visitors || 0, 'visitors')}
            </span>
          </div>
        </div>

        {/* Enhanced Algoritmo e melhoria */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
            <AlgorithmIcon className="w-4 h-4 text-slate-600" />
            <span className="font-medium text-slate-700">{algorithmInfo?.label}</span>
            {algorithmInfo?.premium && (
              <Crown className="w-4 h-4 text-amber-500" />
            )}
          </div>

          {experiment.performance?.improvement !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/60">
              {experiment.performance.improvement > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <span className={cn(
                "font-bold text-sm",
                experiment.performance.improvement > 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatMetricValue(experiment.performance.improvement, 'improvement')}
              </span>
            </div>
          )}
        </div>

        {/* Enhanced Indicador de confiabilidade */}
        {experiment.performance?.confidence && experiment.performance.confidence > 90 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200/60 hover:border-amber-300 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-sm font-semibold text-amber-900">
                {experiment.performance.confidence.toFixed(0)}% confiável
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Botões de ação */}
        <div className="pt-4 border-t border-slate-200/50 space-y-3">
          <Button
            onClick={() => onViewDetails(experiment)}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl transition-all duration-300 h-12 font-semibold text-sm shadow-lg hover:shadow-xl ripple-effect"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalhes
          </Button>
          <Button
            onClick={() => onDelete(experiment.id, experiment.name)}
            disabled={isDeleting}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl transition-all duration-300 h-10 font-semibold text-sm"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                Deletando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Experimento
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}