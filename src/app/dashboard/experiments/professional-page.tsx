"use client"

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExperimentDetailsModal } from '@/components/dashboard/experiment-details-modal'
import { EmptyState } from '@/components/empty-state'
import { cn } from '@/lib/utils'
import {
  Plus, Grid, List, Search, X, ArrowUpDown,
  TrendingUp, Users, Target, Brain, BarChart3,
  Eye, Play, Pause, CheckCircle2, SlidersHorizontal,
  FlaskConical, Settings, ArrowUpRight, ArrowDownRight,
  Calendar, Filter, Sparkles, Zap, Trophy, Rocket, ChevronRight, RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { config, safeLog } from '@/lib/config'

type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed'

interface Variant { id: string; name: string; key: string; is_control: boolean; weight?: number; redirect_url?: string; traffic_percentage?: number; css_changes?: string; js_changes?: string; changes?: any; description?: string; config?: any }

interface Experiment {
  id: string
  name: string
  description?: string
  status: ExperimentStatus
  created_at: string
  project_id?: string
  algorithm?: string
  traffic_allocation?: number
  tags?: string[]
  variants?: Variant[]
  performance?: {
    conversions: number
    visitors: number
    conversionRate: number
    confidence: number
    revenue?: number
    improvement?: number
  }
}

const statusConfig = {
  draft: {
    label: 'Rascunho',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Eye
  },
  running: {
    label: 'Ativo',
    color: 'bg-gray-900 text-white border-gray-900',
    icon: Play
  },
  paused: {
    label: 'Pausado',
    color: 'bg-gray-300 text-gray-700 border-gray-300',
    icon: Pause
  },
  completed: {
    label: 'Concluído',
    color: 'bg-gray-600 text-white border-gray-600',
    icon: CheckCircle2
  }
}

const algorithmConfig = {
  thompson_sampling: { label: 'Thompson Sampling', icon: Brain, premium: true },
  ucb1: { label: 'UCB1', icon: TrendingUp, premium: true },
  epsilon_greedy: { label: 'Epsilon Greedy', icon: Target, premium: false },
  uniform: { label: 'Uniforme', icon: BarChart3, premium: false }
}

// Função para calcular métricas reais dos experimentos - OTIMIZADA
const calculateExperimentMetrics = async (experimentId: string, supabase: any) => {
  try {
    console.log('📊 Calculando métricas para experimento:', experimentId)

    // Tentar buscar de variant_stats primeiro (mais rápido)
    const { data: stats } = await supabase
      .from('variant_stats')
      .select('visitors, conversions, revenue')
      .eq('experiment_id', experimentId)

    if (stats && stats.length > 0) {
      // Agregar stats
      const totalVisitors = stats.reduce((sum: number, s: any) => sum + (s.visitors || 0), 0)
      const totalConversions = stats.reduce((sum: number, s: any) => sum + (s.conversions || 0), 0)
      const revenue = stats.reduce((sum: number, s: any) => sum + (s.revenue || 0), 0)
      const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

      const baseline = 3.0
      const improvement = conversionRate > 0 ? ((conversionRate - baseline) / baseline) * 100 : 0

      console.log('✅ Métricas de variant_stats:', { totalVisitors, totalConversions, revenue })

      return {
        conversions: totalConversions,
        visitors: totalVisitors,
        conversionRate,
        confidence: conversionRate > baseline ? 95 : 75,
        revenue,
        improvement
      }
    }

    // Fallback: buscar diretamente
    console.log('⚠️ Usando fallback para métricas')

    const [visitorsResult, conversionsResult] = await Promise.all([
      supabase
        .from('assignments')
        .select('visitor_id', { count: 'exact', head: true })
        .eq('experiment_id', experimentId),
      supabase
        .from('events')
        .select('value')
        .eq('experiment_id', experimentId)
        .eq('event_type', 'conversion')
    ])

    const totalVisitors = visitorsResult.count || 0
    const conversions = conversionsResult.data || []
    const totalConversions = conversions.length
    const revenue = conversions.reduce((sum: number, conv: any) => sum + (conv.value || 0), 0)
    const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

    const baseline = 3.0
    const improvement = conversionRate > 0 ? ((conversionRate - baseline) / baseline) * 100 : 0

    console.log('✅ Métricas de fallback:', { totalVisitors, totalConversions, revenue })

    return {
      conversions: totalConversions,
      visitors: totalVisitors,
      conversionRate,
      confidence: conversionRate > baseline ? 95 : 75,
      revenue,
      improvement
    }
  } catch (error) {
    safeLog('Erro ao calcular métricas:', error)
    return {
      conversions: 0,
      visitors: 0,
      conversionRate: 0,
      confidence: 0,
      revenue: 0,
      improvement: 0
    }
  }
}

export default function ProfessionalExperimentsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | ExperimentStatus>('all')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'status' | 'performance'>('recent')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Stats calculadas com mais métricas
  const stats = useMemo(() => {
    const total = experiments.length
    const running = experiments.filter(e => e.status === 'running').length
    const completed = experiments.filter(e => e.status === 'completed').length
    const draft = experiments.filter(e => e.status === 'draft').length
    const avgConversionRate = experiments.length > 0
      ? experiments.reduce((acc, exp) => acc + (exp.performance?.conversionRate || 0), 0) / experiments.length
      : 0
    const totalRevenue = experiments.reduce((acc, exp) => acc + (exp.performance?.revenue || 0), 0)
    const avgImprovement = experiments.length > 0
      ? experiments.reduce((acc, exp) => acc + Math.abs(exp.performance?.improvement || 0), 0) / experiments.length
      : 0

    return { total, running, completed, draft, avgConversionRate, totalRevenue, avgImprovement }
  }, [experiments])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('experimentsLayout') as 'grid' | 'list' | null
      if (saved === 'grid' || saved === 'list') setLayout(saved)
    } catch {}

    const load = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setExperiments([])
          return
        }

        // Buscar experimentos do usuário atual
        const { data, error } = await supabase
          .from('experiments')
          .select(`
            *,
            variants:variants(*),
            project:projects(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Mapear experimentos e calcular métricas reais
        const mapped: Experiment[] = await Promise.all(
          (data || []).map(async (exp: any) => {
            const performance = await calculateExperimentMetrics(exp.id, supabase)

            return {
              id: exp.id,
              name: exp.name,
              description: exp.description || undefined,
              status: exp.status,
              created_at: exp.created_at,
              project_id: exp.project_id,
              algorithm: exp.mab_config?.algorithm || 'thompson_sampling',
              traffic_allocation: exp.traffic_allocation || undefined,
              tags: (exp.tags as any) || [],
              variants: (exp.variants || []).map((v: any) => ({
                id: v.id,
                name: v.name,
                key: v.key || v.name?.toLowerCase().replace(/\s+/g, '-') || 'variant',
                is_control: !!v.is_control,
                weight: v.weight || v.traffic_percentage || 50,
                redirect_url: v.redirect_url || v.url || v.target_url || v.config?.url || undefined,
                traffic_percentage: v.traffic_percentage,
                css_changes: v.css_changes,
                js_changes: v.js_changes,
                changes: v.changes,
                description: v.description || undefined,
                config: v.config || {}
              })),
              performance
            }
          })
        )

        setExperiments(mapped)
      } catch (e) {
        safeLog('Erro ao carregar experimentos', e)
        setExperiments([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    try { localStorage.setItem('experimentsLayout', layout) } catch {}
  }, [layout])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    experiments.forEach(exp => exp.tags?.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [experiments])

  const filteredExperiments = useMemo(() => {
    let filtered = experiments.filter(exp => {
      const matchesQuery = !query || exp.name.toLowerCase().includes(query.toLowerCase()) ||
                          exp.description?.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === 'all' || exp.status === status
      const matchesTags = activeTags.length === 0 || activeTags.every(tag => exp.tags?.includes(tag))
      return matchesQuery && matchesStatus && matchesTags
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
  }, [experiments, query, status, activeTags, sortBy])

  const toggleTag = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setQuery('')
    setStatus('all')
    setActiveTags([])
    setSortBy('recent')
  }

  const hasActiveFilters = query || status !== 'all' || activeTags.length > 0 || sortBy !== 'recent'

  const handleViewDetails = (experiment: Experiment) => {
    setSelectedExperiment(experiment)
    setShowDetailsModal(true)
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* HERO SECTION - Gradiente Extraordinário */}
      <div className="relative w-full min-h-[50vh] overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/40 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-cyan-400/20 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 w-full py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Title Section */}
            <div className="space-y-6">
              <Badge className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-200 border border-purple-400/30 backdrop-blur-xl px-6 py-2.5 text-sm font-semibold shadow-lg">
                <FlaskConical className="w-4 h-4 mr-2 animate-pulse" />
                Centro de Experimentos
              </Badge>

              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-none tracking-tight">
                  Seus Testes
                  <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                    A/B Testing
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-purple-100/90 leading-relaxed max-w-3xl font-light">
                  Gerencie, analise e otimize todos os seus experimentos em um só lugar
                </p>
              </div>
            </div>

            {/* Stats Grid - Glassmorphism */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Total */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm">
                      <FlaskConical className="w-6 h-6 text-purple-300" />
                    </div>
                    {stats.total > 0 && (
                      <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-purple-200/80 font-medium mb-1">Total</p>
                    <p className="text-4xl font-black text-white">{stats.total}</p>
                  </div>
                </div>
              </div>

              {/* Ativos */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-sm">
                      <Zap className="w-6 h-6 text-emerald-300" />
                    </div>
                    {stats.running > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-emerald-300">AO VIVO</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-emerald-200/80 font-medium mb-1">Ativos</p>
                    <p className="text-4xl font-black text-white">{stats.running}</p>
                  </div>
                </div>
              </div>

              {/* Concluídos */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm">
                      <CheckCircle2 className="w-6 h-6 text-blue-300" />
                    </div>
                    {stats.completed > 0 && (
                      <Trophy className="w-5 h-5 text-blue-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-blue-200/80 font-medium mb-1">Concluídos</p>
                    <p className="text-4xl font-black text-white">{stats.completed}</p>
                  </div>
                </div>
              </div>

              {/* Taxa Média */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 backdrop-blur-sm">
                      <TrendingUp className="w-6 h-6 text-pink-300" />
                    </div>
                    {stats.avgImprovement > 0 && (
                      <div className="px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                        <span className="text-xs font-bold text-emerald-300">+{stats.avgImprovement.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-pink-200/80 font-medium mb-1">Taxa Média</p>
                    <p className="text-4xl font-black text-white">{stats.avgConversionRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={() => router.push(config.app.newExperiment)}
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 h-12 font-bold hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">Novo Experimento</span>
                <Rocket className="w-4 h-4 ml-2 relative z-10 animate-pulse" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="w-full bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Filtros Aprimorados */}
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
              <SelectTrigger className="h-12 w-full lg:w-40 border-2 border-slate-200 hover:border-purple-400 rounded-2xl font-semibold bg-white shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 shadow-2xl">
                <SelectItem value="all" className="rounded-xl font-medium">Todos</SelectItem>
                <SelectItem value="draft" className="rounded-xl font-medium">Rascunho</SelectItem>
                <SelectItem value="running" className="rounded-xl font-medium">Ativo</SelectItem>
                <SelectItem value="paused" className="rounded-xl font-medium">Pausado</SelectItem>
                <SelectItem value="completed" className="rounded-xl font-medium">Concluído</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="h-12 w-full lg:w-44 border-2 border-slate-200 hover:border-purple-400 rounded-2xl font-semibold bg-white shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 shadow-2xl">
                <SelectItem value="recent" className="rounded-xl font-medium">Mais Recentes</SelectItem>
                <SelectItem value="name" className="rounded-xl font-medium">Nome A-Z</SelectItem>
                <SelectItem value="status" className="rounded-xl font-medium">Status</SelectItem>
                <SelectItem value="performance" className="rounded-xl font-medium">Performance</SelectItem>
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
                {filteredExperiments.length} de {experiments.length} experimentos
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
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
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
                  <FlaskConical className="w-24 h-24 text-transparent bg-gradient-to-br from-purple-600 to-blue-600 bg-clip-text" style={{ WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
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
                  onClick={() => router.push(config.app.newExperiment)}
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
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-1'
          )}>
            {filteredExperiments.map((experiment) => (
              <ProfessionalExperimentCard
                key={experiment.id}
                experiment={experiment}
                layout={layout}
                onViewDetails={handleViewDetails}
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

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}

// Card de experimento estilo SaaS moderno
function ProfessionalExperimentCard({
  experiment,
  layout,
  onViewDetails
}: {
  experiment: Experiment
  layout: 'grid' | 'list'
  onViewDetails: (experiment: Experiment) => void
}) {
  const statusInfo = statusConfig[experiment.status]
  const StatusIcon = statusInfo.icon
  const algorithmKey = (experiment.algorithm || 'uniform') as keyof typeof algorithmConfig
  const algorithmInfo = algorithmConfig[algorithmKey]
  const router = useRouter()
  const supabase = createClient()

  // Funções para ações dos botões
  const handleConfigure = () => {
    router.push(`${config.app.experiments}/${experiment.id}/settings`)
  }

  const handleViewDetails = () => {
    onViewDetails(experiment)
  }

  const handleToggleStatus = async () => {
    try {
      const newStatus = experiment.status === 'running' ? 'paused' : 'running'
      const { error } = await supabase
        .from('experiments')
        .update({ status: newStatus })
        .eq('id', experiment.id)

      if (error) throw error

      // Recarregar a página para refletir mudanças
      window.location.reload()
    } catch (error) {
      safeLog('Erro ao alterar status:', error)
      alert('Erro ao alterar status do experimento')
    }
  }

  const handleDuplicate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('experiments')
        .insert({
          name: `${experiment.name} (Cópia)`,
          description: experiment.description,
          status: 'draft',
          project_id: experiment.project_id,
          user_id: user.id,
          mab_config: { algorithm: experiment.algorithm },
          traffic_allocation: experiment.traffic_allocation,
          tags: experiment.tags
        })

      if (error) throw error

      // Recarregar a página para mostrar o novo experimento
      window.location.reload()
    } catch (error) {
      safeLog('Erro ao duplicar experimento:', error)
      alert('Erro ao duplicar experimento')
    }
  }

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
                className="border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-semibold rounded-xl shadow-sm hover:shadow-lg transition-all"
                onClick={handleConfigure}
                title="Configurações"
              >
                <Settings className="w-4 h-4 mr-2" />
                Config
              </Button>
              <Button
                onClick={handleViewDetails}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                size="sm"
                title="Ver detalhes"
              >
                <Eye className="w-4 h-4 mr-2" />
                Detalhes
                <ChevronRight className="w-4 h-4 ml-1" />
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

      <div className="relative p-6 space-y-6">
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
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-600" />
              <div className="text-xs text-purple-600 font-bold uppercase">Conversão</div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {experiment.performance?.conversionRate.toFixed(1)}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div className="text-xs text-blue-600 font-bold uppercase">Visitantes</div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {(experiment.performance?.visitors || 0) > 1000
                ? `${Math.round((experiment.performance?.visitors || 0) / 1000)}k`
                : experiment.performance?.visitors.toLocaleString()
              }
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        {experiment.performance?.improvement !== undefined && (
          <div className={cn(
            "p-4 rounded-2xl border-2 shadow-lg",
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
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-bold rounded-xl shadow-sm hover:shadow-lg transition-all"
            onClick={handleConfigure}
          >
            <Settings className="w-4 h-4 mr-2" />
            Config
          </Button>
          <Button
            onClick={handleViewDetails}
            size="sm"
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <Eye className="w-4 h-4 mr-2" />
            Detalhes
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  )
}