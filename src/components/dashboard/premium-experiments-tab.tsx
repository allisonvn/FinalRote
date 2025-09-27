"use client"

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExperimentDetailsModal } from '@/components/dashboard/experiment-details-modal'
import { EmptyState } from '@/components/empty-state'
import { cn } from '@/lib/utils'
import {
  Plus, Grid, List, Filter, Search, Tag, X, ArrowUpDown,
  Zap, TrendingUp, Users, Target, Clock, Brain, BarChart3,
  Sparkles, Rocket, Star, Globe, Eye, Play, Pause, CheckCircle2,
  XCircle, AlertCircle, Calendar, Activity, Crown, Trophy,
  ChevronDown, SlidersHorizontal, Layers, FlaskConical,
  MousePointer, Award, Shield, LineChart, PieChart, Download,
  RefreshCw, Settings, Share2, Edit3, ArrowUpRight, ArrowDownRight,
  Percent, DollarSign, TrendingDown, ExternalLink, Info
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
    color: 'bg-slate-500',
    icon: Eye,
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200'
  },
  running: {
    label: 'Executando',
    color: 'bg-green-500',
    icon: Play,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  paused: {
    label: 'Pausado',
    color: 'bg-yellow-500',
    icon: Pause,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200'
  },
  completed: {
    label: 'Concluído',
    color: 'bg-blue-500',
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

// Mock data generator para demonstração
const generateMockPerformance = () => ({
  conversions: Math.floor(Math.random() * 500) + 100,
  visitors: Math.floor(Math.random() * 10000) + 2000,
  conversionRate: Math.random() * 8 + 2,
  confidence: Math.random() * 40 + 60,
  revenue: Math.floor(Math.random() * 50000) + 10000,
  improvement: (Math.random() - 0.5) * 50
})

export function PremiumExperimentsTab({ experiments, loading, onNewExperiment }: PremiumExperimentsTabProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | string>('all')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'status' | 'performance'>('recent')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Processar experimentos com performance mock
  const processedExperiments = useMemo(() => {
    return experiments.map(exp => ({
      ...exp,
      performance: generateMockPerformance()
    }))
  }, [experiments])

  // Stats calculadas
  const stats = useMemo(() => {
    const total = processedExperiments.length
    const running = processedExperiments.filter(e => e.status === 'running').length
    const completed = processedExperiments.filter(e => e.status === 'completed').length
    const avgConversionRate = processedExperiments.length > 0
      ? processedExperiments.reduce((acc, exp) => acc + (exp.performance?.conversionRate || 0), 0) / processedExperiments.length
      : 0
    const totalRevenue = processedExperiments.reduce((acc, exp) => acc + (exp.performance?.revenue || 0), 0)
    const avgImprovement = processedExperiments.length > 0
      ? processedExperiments.reduce((acc, exp) => acc + Math.abs(exp.performance?.improvement || 0), 0) / processedExperiments.length
      : 0

    return { total, running, completed, avgConversionRate, totalRevenue, avgImprovement }
  }, [processedExperiments])

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
                variant="outline"
                className="h-14 px-8 rounded-2xl border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 font-semibold"
              >
                <Download className="w-5 h-5 mr-2" />
                Exportar Dados
              </Button>
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
            <Card className="col-span-2 lg:col-span-1 p-8 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border-2 border-blue-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
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
                <p className="text-4xl font-black text-blue-700">{stats.total}</p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-3">
                  <TrendingUp className="w-3 h-3" />
                  Últimos 30 dias
                </p>
              </div>
            </Card>

            <Card className="col-span-2 lg:col-span-1 p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
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
                <p className="text-4xl font-black text-green-700">{stats.running}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-3">
                  <Play className="w-3 h-3" />
                  Em execução
                </p>
              </div>
            </Card>

            <Card className="col-span-2 lg:col-span-1 p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-2 border-purple-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
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
                <p className="text-4xl font-black text-purple-700">{stats.completed}</p>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-3">
                  <Award className="w-3 h-3" />
                  Com resultados
                </p>
              </div>
            </Card>

            <Card className="col-span-2 lg:col-span-1 p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-2 border-amber-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
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
                <p className="text-4xl font-black text-amber-700">{stats.avgConversionRate.toFixed(1)}%</p>
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-3">
                  <Target className="w-3 h-3" />
                  Taxa global
                </p>
              </div>
            </Card>

            <Card className="col-span-2 lg:col-span-1 p-8 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-2 border-indigo-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
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
                <p className="text-4xl font-black text-indigo-700">
                  ${(stats.totalRevenue / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-indigo-600 flex items-center gap-1 mt-3">
                  <Sparkles className="w-3 h-3" />
                  Impacto total
                </p>
              </div>
            </Card>

            <Card className="col-span-2 lg:col-span-1 p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
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
                <p className="text-4xl font-black text-emerald-700">+{stats.avgImprovement.toFixed(0)}%</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-3">
                  <Star className="w-3 h-3" />
                  Média geral
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Filtros Premium */}
        <Card className="p-10 bg-gradient-to-r from-white via-blue-50 to-indigo-50 border-2 border-blue-200 shadow-2xl">
          <div className="space-y-8">
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-400" />
                <Input
                  placeholder="Buscar experimentos por nome ou descrição..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-14 h-16 text-lg border-2 border-slate-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-medium"
                />
              </div>

              <div className="flex gap-4">
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger className="w-52 h-16 border-2 border-slate-300 rounded-2xl focus:border-blue-500 transition-all duration-300 text-lg font-medium">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="running">Executando</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-60 h-16 border-2 border-slate-300 rounded-2xl focus:border-blue-500 transition-all duration-300 text-lg font-medium">
                    <ArrowUpDown className="w-5 h-5 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="name">Nome A-Z</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={layout === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLayout('grid')}
                    className="h-16 w-16 p-0 rounded-2xl transition-all duration-300 border-2"
                  >
                    <Grid className="w-6 h-6" />
                  </Button>
                  <Button
                    variant={layout === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLayout('list')}
                    className="h-16 w-16 p-0 rounded-2xl transition-all duration-300 border-2"
                  >
                    <List className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-between items-center pt-6 border-t">
                <p className="text-lg text-slate-600 font-semibold">
                  {filteredExperiments.length} de {processedExperiments.length} experimentos
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-2xl h-12 px-6 font-medium"
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
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8'
              : 'space-y-8'
          )}>
            {filteredExperiments.map((experiment) => (
              <PremiumExperimentCard
                key={experiment.id}
                experiment={experiment}
                layout={layout}
                onViewDetails={handleViewDetails}
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
  onViewDetails
}: {
  experiment: any
  layout: 'grid' | 'list'
  onViewDetails: (experiment: any) => void
}) {
  const statusInfo = statusConfig[experiment.status as keyof typeof statusConfig]
  const StatusIcon = statusInfo.icon
  const algorithmInfo = algorithmConfig[experiment.algorithm || 'uniform']
  const AlgorithmIcon = algorithmInfo?.icon || BarChart3

  if (layout === 'list') {
    return (
      <Card className="p-10 hover:shadow-2xl transition-all duration-500 border-2 hover:border-blue-300 hover:scale-[1.01] bg-gradient-to-r from-white to-blue-50/30">
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
            <Button variant="outline" size="sm" className="rounded-2xl border-2 hover:border-blue-400 h-14 px-6 font-semibold">
              <Settings className="w-5 h-5 mr-2" />
              Configurar
            </Button>
            <Button
              onClick={() => onViewDetails(experiment)}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-14 px-8 font-bold"
            >
              <Eye className="w-5 h-5 mr-2" />
              Ver Detalhes
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group p-10 hover:shadow-2xl transition-all duration-500 border-2 hover:border-blue-300 hover:scale-[1.02] bg-gradient-to-br from-white to-blue-50/50">
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-18 h-18 rounded-4xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-300">
              <FlaskConical className="w-9 h-9 text-white" />
            </div>
            <div>
              <h3 className="font-black text-2xl text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                {experiment.name}
              </h3>
              <p className="text-base text-slate-500 flex items-center gap-3">
                <Layers className="w-5 h-5" />
                {experiment.variants?.length || 0} variantes
              </p>
            </div>
          </div>

          <Badge className={cn("text-white text-base px-4 py-2", statusInfo.color)}>
            <StatusIcon className="w-5 h-5 mr-2" />
            {statusInfo.label}
          </Badge>
        </div>

        <p className="text-slate-600 text-base line-clamp-3 leading-relaxed">
          {experiment.description || 'Experimento A/B para otimização de conversões e análise de performance detalhada.'}
        </p>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-3xl border-2 border-green-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-base font-bold text-green-700">Conversão</span>
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="font-black text-3xl text-green-700">
                {experiment.performance?.conversionRate.toFixed(1)}%
              </span>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-3xl border-2 border-blue-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-base font-bold text-blue-700">Visitantes</span>
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-black text-3xl text-blue-700">
                {(experiment.performance?.visitors || 0) > 1000
                  ? `${Math.round((experiment.performance?.visitors || 0) / 1000)}k`
                  : experiment.performance?.visitors.toLocaleString()
                }
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-base">
            <div className="flex items-center gap-3">
              <AlgorithmIcon className="w-6 h-6 text-slate-600" />
              <span className="font-bold text-slate-700">{algorithmInfo?.label}</span>
              {algorithmInfo?.premium && (
                <Crown className="w-5 h-5 text-amber-500" />
              )}
            </div>

            {experiment.performance?.improvement !== undefined && (
              <div className="flex items-center gap-2">
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

          {experiment.performance?.confidence && experiment.performance.confidence > 90 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-amber-200">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-amber-600" />
                <span className="text-base font-black text-amber-900">
                  {experiment.performance.confidence.toFixed(0)}% de confiabilidade
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-200 flex gap-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-2xl border-2 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 h-14 font-semibold"
          >
            <Settings className="w-5 h-5 mr-2" />
            Configurar
          </Button>
          <Button
            onClick={() => onViewDetails(experiment)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl transition-all duration-300 h-14 font-bold"
          >
            <Eye className="w-5 h-5 mr-2" />
            Detalhes
          </Button>
        </div>
      </div>
    </Card>
  )
}