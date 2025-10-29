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

export function PremiumExperimentsTab({ experiments: initialExperiments, loading, onNewExperiment }: PremiumExperimentsTabProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | string>('all')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'status' | 'performance'>('recent')

  // Mapeamentos para exibição em português
  const statusLabels = {
    'all': 'Todos os Status',
    'draft': 'Rascunhos',
    'running': 'Em Execução',
    'paused': 'Pausados',
    'completed': 'Concluídos'
  }

  const sortByLabels = {
    'recent': 'Mais Recentes',
    'name': 'Nome (A-Z)',
    'status': 'Status',
    'performance': 'Melhor Desempenho'
  }
  const [showFilters, setShowFilters] = useState(false)
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null)
  
  // Estado local dos experimentos
  const [experiments, setExperiments] = useState(initialExperiments)
  
  // Sincronizar estado local com props
  useEffect(() => {
    setExperiments(initialExperiments)
  }, [initialExperiments])
  
  // Usar estatísticas reais do Supabase
  const { stats: realStats, loading: statsLoading } = useDashboardStats()
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  // Estado para métricas reais
  const [experimentsMetrics, setExperimentsMetrics] = useState<Record<string, ExperimentMetrics>>({})
  const [metricsLoading, setMetricsLoading] = useState(false)
  
  // Estado para deletar experimentos
  const [deletingExperiment, setDeletingExperiment] = useState<string | null>(null)
  
  // Estado para toggle de status
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null)

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
        },
        credentials: 'include'
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

  // Função para toggle de status do experimento
  const handleToggleStatus = async (experimentId: string, currentStatus: string) => {
    setTogglingStatus(experimentId)
    
    try {
      // Determinar novo status
      let newStatus: string
      if (currentStatus === 'running') {
        newStatus = 'paused'
      } else if (currentStatus === 'paused') {
        newStatus = 'running'
      } else if (currentStatus === 'draft') {
        newStatus = 'running'
      } else {
        // completed - não pode ser alterado
        return
      }

      const response = await fetch(`/api/experiments/${experimentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar status do experimento')
      }

      // Atualizar estado local
      setExperiments(prev => prev.map(exp => 
        exp.id === experimentId 
          ? { ...exp, status: newStatus }
          : exp
      ))

      const statusLabels = {
        draft: 'Rascunho',
        running: 'Executando',
        paused: 'Pausado',
        completed: 'Concluído'
      }

      alert(`Experimento ${statusLabels[newStatus as keyof typeof statusLabels].toLowerCase()} com sucesso!`)
      
    } catch (error) {
      console.error('Erro ao atualizar status do experimento:', error)
      alert(`Erro ao atualizar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setTogglingStatus(null)
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
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* HERO SECTION - Gradiente Extraordinário */}
      <div className="relative w-full min-h-[85vh] overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-blue-950">
        {/* Animated Background Layers */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600/40 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/40" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 w-full py-16 sm:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-16">
            {/* Title Section */}
            <div className="space-y-6">
              <Badge className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-200 border border-purple-400/30 backdrop-blur-xl px-6 py-2.5 text-sm font-semibold shadow-lg">
                <FlaskConical className="w-4 h-4 mr-2 animate-pulse" />
                Otimize Sua Receita
              </Badge>

              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-none tracking-tight">
                  Transforme Dados em
                  <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                    Crescimento Real
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-purple-100/90 leading-relaxed max-w-3xl font-light">
                  Decisões baseadas em dados que aumentam suas conversões. Teste, valide e escale o que realmente funciona.
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={onNewExperiment}
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 h-14 px-10 font-bold text-lg hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="w-6 h-6 mr-3 relative z-10" />
                <span className="relative z-10">Novo Experimento</span>
                <Rocket className="w-5 h-5 ml-3 relative z-10 animate-pulse" />
              </Button>
            </div>

            {/* Stats Grid - Glassmorphism */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Total */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 col-span-1 sm:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm">
                      <FlaskConical className="w-6 h-6 text-purple-300" />
                    </div>
                    {stats.total > 0 && (
                      <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-purple-200/80 font-medium mb-2">Total</p>
                    <p className="text-4xl font-black text-white">{statsLoading ? '...' : stats.total}</p>
                  </div>
                </div>
              </div>

              {/* Ativos */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20 col-span-1 sm:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-sm">
                      <Zap className="w-6 h-6 text-emerald-300" />
                    </div>
                    {stats.running > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-emerald-300">AO VIVO</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-emerald-200/80 font-medium mb-2">Ativos</p>
                    <p className="text-4xl font-black text-white">{statsLoading ? '...' : stats.running}</p>
                  </div>
                </div>
              </div>

              {/* Concluídos */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 col-span-1 sm:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm">
                      <CheckCircle2 className="w-6 h-6 text-blue-300" />
                    </div>
                    {stats.completed > 0 && (
                      <Trophy className="w-5 h-5 text-blue-300" />
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-blue-200/80 font-medium mb-2">Concluídos</p>
                    <p className="text-4xl font-black text-white">{statsLoading ? '...' : stats.completed}</p>
                  </div>
                </div>
              </div>

              {/* Taxa Média */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20 col-span-1 sm:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 backdrop-blur-sm">
                      <TrendingUp className="w-6 h-6 text-pink-300" />
                    </div>
                    {stats.avgConversionRate > 0 && (
                      <div className="px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                        <span className="text-xs font-bold text-emerald-300">{stats.avgConversionRate.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-pink-200/80 font-medium mb-2">Conv. Média</p>
                    <p className="text-4xl font-black text-white">{statsLoading ? '...' : `${stats.avgConversionRate.toFixed(1)}%`}</p>
                  </div>
                </div>
              </div>

              {/* Receita */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 col-span-1 sm:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm">
                      <DollarSign className="w-6 h-6 text-cyan-300" />
                    </div>
                    {stats.totalRevenue > 0 && (
                      <TrendingUp className="w-5 h-5 text-cyan-300 animate-pulse" />
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-cyan-200/80 font-medium mb-2">Receita</p>
                    <p className="text-4xl font-black text-white">
                      {statsLoading ? '...' : stats.totalRevenue > 0 ? `R$ ${stats.totalRevenue > 1000 ? (stats.totalRevenue / 1000).toFixed(1) + 'k' : stats.totalRevenue.toFixed(0)}` : 'R$ 0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Melhoria */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20 col-span-1 sm:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm">
                      <Star className="w-6 h-6 text-amber-300" />
                    </div>
                    {stats.avgImprovement > 0 && (
                      <div className="px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                        <span className="text-xs font-bold text-emerald-300">+{stats.avgImprovement.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-amber-200/80 font-medium mb-2">Melhoria</p>
                    <p className="text-4xl font-black text-white">{statsLoading ? '...' : `+${stats.avgImprovement.toFixed(0)}%`}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="w-full bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Barra de Filtros Extraordinária */}
        <Card className="backdrop-blur-xl bg-white/90 border-0 shadow-2xl p-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar experimentos por nome ou descrição..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 focus:border-purple-500 rounded-2xl text-base font-medium bg-white shadow-inner"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger className="h-12 w-full lg:w-48 border-2 border-slate-200 hover:border-purple-400 rounded-2xl font-semibold bg-white shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-semibold text-slate-700">{statusLabels[status as keyof typeof statusLabels]}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 shadow-2xl">
                <SelectItem value="all" className="rounded-xl font-medium">Todos os Status</SelectItem>
                <SelectItem value="draft" className="rounded-xl font-medium">Rascunhos</SelectItem>
                <SelectItem value="running" className="rounded-xl font-medium">Em Execução</SelectItem>
                <SelectItem value="paused" className="rounded-xl font-medium">Pausados</SelectItem>
                <SelectItem value="completed" className="rounded-xl font-medium">Concluídos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="h-12 w-full lg:w-52 border-2 border-slate-200 hover:border-purple-400 rounded-2xl font-semibold bg-white shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="text-sm font-semibold text-slate-700">{sortByLabels[sortBy]}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 shadow-2xl">
                <SelectItem value="recent" className="rounded-xl font-medium">Mais Recentes</SelectItem>
                <SelectItem value="name" className="rounded-xl font-medium">Nome (A-Z)</SelectItem>
                <SelectItem value="status" className="rounded-xl font-medium">Status</SelectItem>
                <SelectItem value="performance" className="rounded-xl font-medium">Melhor Desempenho</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg">
              <Button
                variant={layout === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLayout('grid')}
                className={cn(
                  "rounded-none h-12 px-6",
                  layout === 'grid'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <Grid className="w-5 h-5" />
              </Button>
              <Button
                variant={layout === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLayout('list')}
                className={cn(
                  "rounded-none h-12 px-6 border-l-2 border-slate-200",
                  layout === 'list'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <List className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 pt-6 border-t-2 border-slate-200">
              <Badge variant="outline" className="text-base px-6 py-2 font-bold bg-purple-50 border-purple-300 text-purple-700">
                {filteredExperiments.length} de {processedExperiments.length} experimentos
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-2 border-slate-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700 font-semibold rounded-xl px-6 py-2 transition-all"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </Card>

        {/* Lista de experimentos */}
        {loading ? (
          <div className={cn(
            layout === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-4'
          )}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="relative overflow-hidden backdrop-blur-xl bg-white/80 border-0 rounded-3xl p-6 shadow-xl">
                <div className="space-y-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl w-3/4"></div>
                      <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-1/2"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl"></div>
                    <div className="h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl"></div>
                  </div>
                  <div className="h-10 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredExperiments.length === 0 ? (
          <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl p-16 text-center">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="relative inline-flex">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative p-8 rounded-full bg-gradient-to-br from-purple-50 to-blue-50 shadow-2xl">
                  <FlaskConical className="w-24 h-24 text-purple-600" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-4xl font-black text-slate-900">
                  {hasActiveFilters ? 'Nenhum experimento encontrado' : 'Comece sua Jornada'}
                </h3>
                <p className="text-xl text-slate-600 leading-relaxed max-w-lg mx-auto">
                  {hasActiveFilters
                    ? 'Não encontramos experimentos com os filtros aplicados. Tente ajustar os critérios de busca.'
                    : 'Crie seu primeiro experimento A/B e comece a otimizar suas conversões com dados reais em tempo real.'}
                </p>
              </div>

              {hasActiveFilters ? (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-2 border-slate-300 hover:border-purple-400 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-bold text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <X className="w-5 h-5 mr-2" />
                  Limpar Filtros
                </Button>
              ) : (
                <Button
                  onClick={onNewExperiment}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-lg px-10 py-6 rounded-2xl shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all"
                >
                  <Rocket className="w-6 h-6 mr-3" />
                  Criar Primeiro Experimento
                  <Sparkles className="w-5 h-5 ml-3 animate-pulse" />
                </Button>
              )}
            </div>
          </Card>
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
                onToggleStatus={handleToggleStatus}
                metricsLoading={metricsLoading}
                isDeleting={deletingExperiment === experiment.id}
                isToggling={togglingStatus === experiment.id}
              />
            ))}
          </div>
        )}
      </div>
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
  onToggleStatus,
  metricsLoading,
  isDeleting,
  isToggling
}: {
  experiment: any
  layout: 'grid' | 'list'
  onViewDetails: (experiment: any) => void
  onDelete: (experimentId: string, experimentName: string) => void
  onToggleStatus: (experimentId: string, currentStatus: string) => void
  metricsLoading: boolean
  isDeleting: boolean
  isToggling: boolean
}) {
  const statusInfo = statusConfig[experiment.status as keyof typeof statusConfig]
  const StatusIcon = statusInfo.icon
  const algorithmKey = (experiment.algorithm || 'uniform') as keyof typeof algorithmConfig
  const algorithmInfo = algorithmConfig[algorithmKey]
  const AlgorithmIcon = algorithmInfo?.icon || BarChart3

  if (layout === 'list') {
    return (
      <Card className="group relative overflow-hidden backdrop-blur-xl bg-white/95 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform">
                  <FlaskConical className="w-7 h-7 text-purple-600" />
                </div>
                {experiment.status === 'running' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    {experiment.name}
                  </h3>
                  <Badge className={cn("text-xs px-3 py-1 rounded-full font-semibold shadow-sm", statusInfo.color)}>
                    {statusInfo.label}
                  </Badge>
                  {experiment.performance?.improvement !== undefined && experiment.performance.improvement > 0 && (
                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 px-3 py-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +{experiment.performance.improvement.toFixed(1)}%
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-6 text-sm font-medium">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4" />
                    <span>{experiment.performance?.visitors.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Target className="w-4 h-4" />
                    <span>{experiment.performance?.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Brain className="w-4 h-4" />
                    <span>{algorithmInfo?.label}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(experiment)}
                className="border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-semibold rounded-xl shadow-sm hover:shadow-lg transition-all"
                title="Ver detalhes"
              >
                <Eye className="w-4 h-4 mr-2" />
                Detalhes
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group relative overflow-hidden backdrop-blur-xl bg-white/95 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
      {/* Gradient Overlay */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        experiment.status === 'running'
          ? "bg-gradient-to-br from-emerald-500/10 to-green-500/10"
          : experiment.status === 'completed'
          ? "bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
          : "bg-gradient-to-br from-purple-500/10 to-pink-500/10"
      )} />

      {/* Status Indicator */}
      {experiment.status === 'running' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
      )}

      <div className="relative p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform">
                <FlaskConical className="w-8 h-8 text-purple-600" />
              </div>
              {experiment.status === 'running' && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-slate-900 mb-1 truncate group-hover:text-purple-700 transition-colors">
                {experiment.name}
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                {experiment.variants?.length || 0} variantes • {algorithmInfo?.label}
              </p>
            </div>
          </div>

          <Badge className={cn("text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg whitespace-nowrap", statusInfo.color)}>
            {statusInfo.label}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {experiment.description || 'Experimento A/B para otimização de conversões em tempo real.'}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-purple-600" />
              <div className="text-xs text-purple-600 font-bold uppercase">Conversão</div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {metricsLoading ? '...' : formatMetricValue(experiment.performance?.conversionRate || 0, 'conversion')}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-600" />
              <div className="text-xs text-blue-600 font-bold uppercase">Visitantes</div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {metricsLoading ? '...' : formatMetricValue(experiment.performance?.visitors || 0, 'visitors')}
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        {experiment.performance?.improvement !== undefined && (
          <div className={cn(
            "p-5 rounded-2xl border-2 shadow-lg",
            experiment.performance.improvement > 0
              ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
              : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {experiment.performance.improvement > 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-slate-500" />
                )}
                <span className="text-xs font-bold text-slate-600 uppercase">Melhoria</span>
              </div>
              <span className={cn(
                "text-2xl font-black",
                experiment.performance.improvement > 0 ? "text-emerald-600" : "text-slate-600"
              )}>
                {experiment.performance.improvement > 0 ? '+' : ''}{experiment.performance.improvement.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {experiment.status === 'running' && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onToggleStatus(experiment.id, experiment.status)
              }}
              size="sm"
              variant="outline"
              disabled={isToggling}
              className="border-2 border-amber-400 hover:border-amber-500 hover:bg-amber-50 text-amber-700 font-bold rounded-xl shadow-sm hover:shadow-lg transition-all px-4"
            >
              <Pause className="w-4 h-4 mr-2" />
              {isToggling ? 'Pausando...' : 'Pausar'}
            </Button>
          )}
          {(experiment.status === 'paused' || experiment.status === 'draft') && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onToggleStatus(experiment.id, experiment.status)
              }}
              size="sm"
              variant="outline"
              disabled={isToggling}
              className="border-2 border-emerald-400 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl shadow-sm hover:shadow-lg transition-all px-4"
            >
              <Play className="w-4 h-4 mr-2" />
              {isToggling ? 'Ativando...' : 'Ativar'}
            </Button>
          )}
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(experiment)
            }}
            size="sm"
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <Eye className="w-4 h-4 mr-2" />
            Detalhes
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(experiment.id, experiment.name)
            }}
            size="sm"
            variant="outline"
            disabled={isDeleting}
            className="border-2 border-red-400 hover:border-red-500 hover:bg-red-50 text-red-700 hover:text-red-800 font-bold rounded-xl shadow-sm hover:shadow-lg transition-all px-4"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}