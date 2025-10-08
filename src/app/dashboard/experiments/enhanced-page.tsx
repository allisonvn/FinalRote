"use client"

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import { cn } from '@/lib/utils'
import {
  Plus, Grid, List, Search, X, ArrowUpDown,
  TrendingUp, Users, Target, Brain, BarChart3,
  Eye, Play, Pause, CheckCircle2, SlidersHorizontal,
  FlaskConical, Settings, ArrowUpRight, ArrowDownRight,
  Calendar, Filter
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

// Mock data mais elaborado
const generateMockPerformance = () => ({
  conversions: Math.floor(Math.random() * 500) + 100,
  visitors: Math.floor(Math.random() * 10000) + 2000,
  conversionRate: Math.random() * 8 + 2,
  confidence: Math.random() * 40 + 60,
  revenue: Math.floor(Math.random() * 50000) + 10000,
  improvement: (Math.random() - 0.5) * 50
})

export default function EnhancedExperimentsPage() {
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

  // Stats calculadas com mais métricas
  const stats = useMemo(() => {
    const total = experiments.length
    const running = experiments.filter(e => e.status === 'running').length
    const completed = experiments.filter(e => e.status === 'completed').length
    const draft = experiments.filter(e => e.status === 'draft').length
    const avgConversionRate = experiments.length > 0
      ? experiments.reduce((acc, exp) => acc + (exp.performance?.conversionRate || 0), 0) / experiments.length
      : 0

    return { total, running, completed, draft, avgConversionRate }
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
        const { data, error } = await supabase
          .from('experiments')
          .select('*, variants:variants(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (error) throw error

        const mapped: Experiment[] = (data || []).map(exp => ({
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
          performance: generateMockPerformance()
        }))
        setExperiments(mapped)
      } catch (e) {
        console.error('Erro ao carregar experimentos', e)
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

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 space-y-6">
        {/* Header minimalista */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">
              Experimentos
            </h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie seus testes A/B</p>
          </div>

          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Experimento
          </Button>
        </div>

        {/* Stats minimalistas */}
        <div className="grid grid-cols-4 gap-6">
          <div className="border-l-2 border-gray-900 pl-4">
            <div className="text-sm text-gray-500 mb-1">Total</div>
            <div className="text-2xl font-medium text-gray-900">{stats.total}</div>
          </div>
          <div className="border-l-2 border-gray-400 pl-4">
            <div className="text-sm text-gray-500 mb-1">Ativos</div>
            <div className="text-2xl font-medium text-gray-900">{stats.running}</div>
          </div>
          <div className="border-l-2 border-gray-400 pl-4">
            <div className="text-sm text-gray-500 mb-1">Concluídos</div>
            <div className="text-2xl font-medium text-gray-900">{stats.completed}</div>
          </div>
          <div className="border-l-2 border-gray-400 pl-4">
            <div className="text-sm text-gray-500 mb-1">Taxa Média</div>
            <div className="text-2xl font-medium text-gray-900">{stats.avgConversionRate.toFixed(1)}%</div>
          </div>
        </div>

        {/* Filtros minimalistas */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar experimentos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-gray-900"
              />
            </div>

            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger className="w-32 border-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="running">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recentes</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border border-gray-300 rounded-md">
              <Button
                variant={layout === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLayout('grid')}
                className={cn(
                  "rounded-r-none",
                  layout === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-600'
                )}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={layout === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLayout('list')}
                className={cn(
                  "rounded-l-none",
                  layout === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600'
                )}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">
                {filteredExperiments.length} de {experiments.length} experimentos
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            </div>
          )}
        </div>

        {/* Lista de experimentos */}
        {loading ? (
          <div className={cn(
            layout === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-1'
          )}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
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
                <Button onClick={clearFilters} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Limpar filtros
                </Button>
              ) : (
                <Button onClick={() => router.push('/dashboard')} className="bg-gray-900 hover:bg-gray-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeiro experimento
                </Button>
              )
            }
          />
        ) : (
          <div className={cn(
            layout === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-1'
          )}>
            {filteredExperiments.map((experiment) => (
              <ModernExperimentCard
                key={experiment.id}
                experiment={experiment}
                layout={layout}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Card de experimento estilo SaaS moderno
function ModernExperimentCard({
  experiment,
  layout
}: {
  experiment: Experiment
  layout: 'grid' | 'list'
}) {
  const statusInfo = statusConfig[experiment.status]
  const algorithmInfo = algorithmConfig[experiment.algorithm || 'uniform']

  if (layout === 'list') {
    return (
      <div className="border-b border-gray-200 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-medium text-gray-900">
                  {experiment.name}
                </h3>
                <span className={cn("text-xs px-2 py-1 rounded-full", statusInfo.color)}>
                  {statusInfo.label}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span>{experiment.performance?.visitors.toLocaleString()}</span>
                <span>{experiment.performance?.conversionRate.toFixed(1)}%</span>
                <span>{algorithmInfo?.label}</span>
                {experiment.performance?.improvement !== undefined && (
                  <span className={cn(
                    "font-medium",
                    experiment.performance.improvement > 0 ? "text-gray-900" : "text-gray-600"
                  )}>
                    {experiment.performance.improvement > 0 ? '+' : ''}{experiment.performance.improvement.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                {experiment.name}
              </h3>
              <p className="text-sm text-gray-500">
                {experiment.variants?.length || 0} variantes
              </p>
            </div>
          </div>

          <span className={cn("text-xs px-2 py-1 rounded-full", statusInfo.color)}>
            {statusInfo.label}
          </span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">
          {experiment.description || 'Experimento A/B para otimização de conversões.'}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Conversão</div>
            <div className="font-medium text-gray-900">
              {experiment.performance?.conversionRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Visitantes</div>
            <div className="font-medium text-gray-900">
              {(experiment.performance?.visitors || 0) > 1000
                ? `${Math.round((experiment.performance?.visitors || 0) / 1000)}k`
                : experiment.performance?.visitors.toLocaleString()
              }
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
          <span className="text-gray-500">{algorithmInfo?.label}</span>
          {experiment.performance?.improvement !== undefined && (
            <span className="font-medium text-gray-900">
              {experiment.performance.improvement > 0 ? '+' : ''}{experiment.performance.improvement.toFixed(1)}%
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-gray-600 border-gray-300">
            Configurar
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
          >
            Detalhes
          </Button>
        </div>
      </div>
    </div>
  )
}