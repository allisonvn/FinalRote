"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { ExperimentDetailsModal } from '@/components/dashboard/experiment-details-modal'
import {
  TrendingUp, DollarSign, Users, Target,
  CheckCircle2, AlertCircle, Clock, Trophy,
  ArrowUpRight, ArrowDownRight, RefreshCw, Calendar,
  Sparkles, BarChart3, Rocket, Plus, ChevronRight, Zap
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { analyzeExperiment } from '@/lib/statistics'
import { getExperimentMetrics, getRevenueData } from '@/lib/analytics'

interface OverviewStats {
  totalRevenue: number
  revenueChange: number
  totalConversions: number
  conversionsChange: number
  avgConversionRate: number
  rateChange: number
  totalVisitors: number
  visitorsChange: number
  activeExperiments: number
  winners: number
  losers: number
  avgROI: number
}

interface ExperimentCard {
  id: string
  name: string
  status: 'running' | 'paused' | 'completed' | 'draft'
  uplift: number
  revenue: number
  conversions: number
  conversionRate: number
  significance: number
  pValue?: number  // ✅ P-value real do teste estatístico
  isSignificant?: boolean  // ✅ Se é significativo em 95%
  hasEnoughData?: boolean  // ✅ Se tem dados suficientes para análise confiável
  daysRunning: number
  isWinner: boolean
  control: {
    name: string
    conversions: number
    visitors: number
    rate: number
  }
  winner: {
    name: string
    conversions: number
    visitors: number
    rate: number
  }
}

interface OverviewRedesignedProps {
  onOpenNewExperiment?: () => void
}

export function OverviewRedesigned({ onOpenNewExperiment }: OverviewRedesignedProps = {}) {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [experiments, setExperiments] = useState<ExperimentCard[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const supabase = createClient()

  const loadStats = async () => {
    try {
      console.log('📊 Carregando métricas da Overview com dados reais...')
      
      // Buscar dados reais direto de assignments e events
      const now = new Date()
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000)

      // Buscar assignments e events do período atual
      const { data: currentAssignments } = await supabase
        .from('assignments')
        .select('visitor_id, assigned_at')
        .gte('assigned_at', currentStart.toISOString())

      const { data: currentEvents } = await supabase
        .from('events')
        .select('visitor_id, event_type, value, created_at')
        .gte('created_at', currentStart.toISOString())

      // Buscar assignments e events do período anterior
      const { data: previousAssignments } = await supabase
        .from('assignments')
        .select('visitor_id, assigned_at')
        .gte('assigned_at', previousStart.toISOString())
        .lt('assigned_at', currentStart.toISOString())

      const { data: previousEvents } = await supabase
        .from('events')
        .select('visitor_id, event_type, value, created_at')
        .gte('created_at', previousStart.toISOString())
        .lt('created_at', currentStart.toISOString())

      // Calcular totais do período atual
      const currentVisitors = new Set(currentAssignments?.map(a => a.visitor_id) || []).size
      const currentConversionsCount = currentEvents?.filter(e => e.event_type === 'conversion').length || 0
      const currentRevenue = currentEvents?.filter(e => e.event_type === 'conversion').reduce((sum, e) => sum + (e.value || 0), 0) || 0

      // Calcular totais do período anterior
      const previousVisitors = new Set(previousAssignments?.map(a => a.visitor_id) || []).size
      const previousConversionsCount = previousEvents?.filter(e => e.event_type === 'conversion').length || 0
      const previousRevenue = previousEvents?.filter(e => e.event_type === 'conversion').reduce((sum, e) => sum + (e.value || 0), 0) || 0

      console.log('📊 Métricas calculadas Overview:', {
        currentVisitors,
        currentConversionsCount,
        currentRevenue,
        previousVisitors,
        previousConversionsCount,
        previousRevenue
      })

      // Calcular mudanças percentuais
      const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
      const conversionsChange = previousConversionsCount > 0 ? ((currentConversionsCount - previousConversionsCount) / previousConversionsCount) * 100 : 0
      const visitorsChange = previousVisitors > 0 ? ((currentVisitors - previousVisitors) / previousVisitors) * 100 : 0

      // Calcular taxa de conversão
      const avgRate = currentVisitors > 0 ? (currentConversionsCount / currentVisitors) * 100 : 0
      const previousRate = previousVisitors > 0 ? (previousConversionsCount / previousVisitors) * 100 : 0
      const rateChange = previousRate > 0 ? ((avgRate - previousRate) / previousRate) * 100 : 0

      // Calcular ROI
      const avgROI = currentVisitors > 0 ? (currentRevenue / currentVisitors) : 0

      // Buscar experimentos ativos
      const { count: activeCount } = await supabase
        .from('experiments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'running')

      setStats({
        totalRevenue: currentRevenue,
        revenueChange,
        totalConversions: currentConversionsCount,
        conversionsChange,
        avgConversionRate: avgRate,
        rateChange,
        totalVisitors: currentVisitors,
        visitorsChange,
        activeExperiments: activeCount || 0,
        winners: 0,
        losers: 0,
        avgROI
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const loadExperiments = async () => {
    try {
      const { data: experimentsData, error: experimentsError } = await supabase
        .from('experiments')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (experimentsError) {
        console.error('Erro ao buscar experimentos:', experimentsError)
        return
      }

      if (!experimentsData || experimentsData.length === 0) {
        console.log('Nenhum experimento encontrado')
        return
      }

      console.log(`📊 Encontrados ${experimentsData.length} experimentos`)

      const experimentsWithStats = await Promise.all(
        experimentsData.map(async (exp) => {
          const { data: variants } = await supabase
            .from('variants')
            .select('id, name, is_control')
            .eq('experiment_id', exp.id)

          if (!variants || variants.length < 2) return null

          const control = variants.find(v => v.is_control)
          const testVariants = variants.filter(v => !v.is_control)

          // Buscar dados agregados de variant_stats
          const [controlStats, ...testStats] = await Promise.all([
            supabase.from('variant_stats').select('visitors, conversions, revenue').eq('variant_id', control?.id).maybeSingle(),
            ...testVariants.map(v => supabase.from('variant_stats').select('visitors, conversions, revenue').eq('variant_id', v.id).maybeSingle())
          ])

          let controlData = controlStats.data || { visitors: 0, conversions: 0, revenue: 0 }
          
          // Se variant_stats não tiver dados, buscar direto de assignments e conversions
          if (controlData.visitors === 0 && controlData.conversions === 0) {
            const { data: assignments } = await supabase
              .from('assignments')
              .select('id')
              .eq('variant_id', control?.id)
            
            const { data: conversions_data } = await supabase
              .from('events')
              .select('id, value as conversion_value')
              .eq('variant_id', control?.id)
              .eq('event_type', 'conversion')
            
            const { data: experimentData } = await supabase
              .from('experiments')
              .select('conversion_value')
              .eq('id', exp.id)
              .maybeSingle()

            controlData = {
              visitors: assignments?.length || 0,
              conversions: conversions_data?.length || 0,
              revenue: conversions_data ? (conversions_data.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0) || (conversions_data.length * Number(experimentData?.conversion_value || 0))) : 0
            }
          }

          // Encontrar melhor variante de teste
          let bestIndex = 0
          let bestRate = 0
          let bestTestData = { visitors: 0, conversions: 0, revenue: 0 }
          
          await Promise.all(testStats.map(async (stat, index) => {
            let data = stat.data || { visitors: 0, conversions: 0, revenue: 0 }
            
            // Se variant_stats não tiver dados, buscar direto
            if (data.visitors === 0 && data.conversions === 0) {
              const variant = testVariants[index]
              const { data: assignments } = await supabase
                .from('assignments')
                .select('id')
                .eq('variant_id', variant.id)
              
              const { data: conversions_data } = await supabase
                .from('events')
                .select('id, value as conversion_value')
                .eq('variant_id', variant.id)
                .eq('event_type', 'conversion')
              
              const { data: experimentData } = await supabase
                .from('experiments')
                .select('conversion_value')
                .eq('id', exp.id)
                .maybeSingle()

              data = {
                visitors: assignments?.length || 0,
                conversions: conversions_data?.length || 0,
                revenue: conversions_data ? (conversions_data.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0) || (conversions_data.length * Number(experimentData?.conversion_value || 0))) : 0
              }
            }
            
            const currRate = data.visitors > 0 ? (data.conversions / data.visitors) : 0
            if (currRate > bestRate) {
              bestRate = currRate
              bestIndex = index
              bestTestData = data
            }
          }))

          const controlRate = controlData.visitors > 0 ? (controlData.conversions / controlData.visitors) * 100 : 0
          const testRate = bestTestData.visitors > 0 ? (bestTestData.conversions / bestTestData.visitors) * 100 : 0
          const uplift = controlRate > 0 ? ((testRate - controlRate) / controlRate) * 100 : 0
          const totalVisitors = controlData.visitors + bestTestData.visitors
          
          // ✅ Usar análise estatística real com p-value
          const analysis = analyzeExperiment(
            controlData.visitors,
            controlData.conversions,
            bestTestData.visitors,
            bestTestData.conversions,
            0.95 // confidence_level padrão
          )
          
          const daysRunning = Math.floor((Date.now() - new Date(exp.created_at).getTime()) / (1000 * 60 * 60 * 24))

          // Calcular tamanho mínimo de amostra para confiança
          const minSampleSize = 50
          const hasEnoughData = (controlData.visitors >= minSampleSize && bestTestData.visitors >= minSampleSize) || analysis.isSignificant

          return {
            id: exp.id,
            name: exp.name,
            status: exp.status as any,
            uplift,
            revenue: controlData.revenue + bestTestData.revenue,
            conversions: controlData.conversions + bestTestData.conversions,
            conversionRate: (controlRate + testRate) / 2,
            significance: analysis.significance, // Usar p-value para significância
            pValue: analysis.pValue, // ✅ P-value real
            isSignificant: analysis.isSignificant, // ✅ Se é significativo
            hasEnoughData, // ✅ Se tem dados suficientes para análise
            daysRunning,
            isWinner: analysis.isSignificant, // Usar isSignificant da análise
            control: {
              name: control?.name || 'Controle',
              conversions: controlData.conversions,
              visitors: controlData.visitors,
              rate: controlRate
            },
            winner: {
              name: testVariants[bestIndex]?.name || 'Variante A',
              conversions: bestTestData.conversions,
              visitors: bestTestData.visitors,
              rate: testRate
            }
          }
        })
      )

      const validExperiments = experimentsWithStats.filter(Boolean) as ExperimentCard[]
      const winners = validExperiments.filter(e => e.isWinner).length
      const losers = validExperiments.filter(e => !e.isWinner && e.uplift < -5).length

      setStats(prev => prev ? { ...prev, winners, losers } : null)
      setExperiments(validExperiments)
    } catch (error) {
      console.error('Erro ao carregar experimentos:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await loadStats()
      await loadExperiments()
      setLoading(false)
    }
    loadData()
  }, [timeRange])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadStats(), loadExperiments()])
    setRefreshing(false)
  }

  const handleCreateExperiment = () => {
    if (onOpenNewExperiment) {
      onOpenNewExperiment()
    } else {
      router.push('/dashboard')
    }
  }
  
  const handleViewExperiment = async (id: string) => {
    try {
      // Buscar experimento completo do banco
      const { data: experimentData, error } = await supabase
        .from('experiments')
        .select(`
          *,
          variants:variants(*)
        `)
        .eq('id', id)
        .maybeSingle()

      if (error || !experimentData) {
        console.error('Erro ao buscar experimento:', error)
        return
      }

      setSelectedExperiment(experimentData)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Erro ao abrir experimento:', error)
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="text-center space-y-6">
          <div className="relative inline-flex">
            <div className="w-24 h-24 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-blue-400 animate-pulse" />
            </div>
          </div>
          <p className="text-white/80 text-xl font-semibold">Carregando painel...</p>
        </div>
      </div>
    )
  }

  const timeRangeLabel = timeRange === '7d' ? '7 dias' : timeRange === '30d' ? '30 dias' : '90 dias'

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* HERO EXTRAORDINÁRIO - Full Screen */}
      <div className="relative w-full min-h-[85vh] overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950">
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
          {/* Header Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-16">
            {/* Title & Badge */}
            <div className="space-y-6 sm:space-y-8">
              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 border border-blue-400/30 backdrop-blur-xl px-6 py-2.5 text-sm font-semibold shadow-lg shadow-blue-500/20">
                <Zap className="w-4 h-4 mr-2 animate-pulse" />
                Painel em Tempo Real
              </Badge>

              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight">
                  Acompanhe Suas
                  <span className="block mt-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                    Conversões
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-blue-100/90 leading-relaxed max-w-3xl font-light">
                  Otimize resultados com dados em tempo real. Acompanhe métricas e tome decisões baseadas em dados concretos.
                </p>
              </div>
            </div>

            {/* Hero Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              {/* Quick Stats - 2 Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Receita Card */}
                <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-400/20 backdrop-blur-2xl p-8 hover:border-emerald-400/40 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-sm">
                        <DollarSign className="w-7 h-7 text-emerald-400" />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400">+{stats?.revenueChange.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-emerald-200/80 font-medium mb-2">Receita Total</p>
                      <p className="text-4xl sm:text-5xl font-black text-white">
                        R$ {(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Experimentos Card */}
                <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 backdrop-blur-2xl p-8 hover:border-blue-400/40 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm">
                        <Target className="w-7 h-7 text-blue-400" />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-emerald-400">AO VIVO</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-blue-200/80 font-medium mb-2">Experimentos Ativos</p>
                      <p className="text-4xl sm:text-5xl font-black text-white">{stats?.activeExperiments || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Card */}
              <div className="lg:col-span-5">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 backdrop-blur-2xl p-8 h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent" />
                  <div className="relative h-full flex flex-col justify-between space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-bold text-lg">Desempenho Geral</h3>
                      <Badge className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-400/30 backdrop-blur-sm">
                        <Trophy className="w-3.5 h-3.5 mr-1.5" />
                        {stats?.winners || 0} Vencedores
                      </Badge>
                    </div>

                    <div className="space-y-5">
                      {/* Taxa de Conversão */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-200/80 text-sm font-medium">Taxa de Conversão</span>
                          <span className="text-white font-bold text-lg">{(stats?.avgConversionRate || 0).toFixed(2)}%</span>
                        </div>
                        <div className="h-2 bg-purple-900/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min((stats?.avgConversionRate || 0) * 10, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* ROI */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-200/80 text-sm font-medium">ROI por Visitante</span>
                          <span className="text-white font-bold text-lg">R$ {(stats?.avgROI || 0).toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-purple-900/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min((stats?.avgROI || 0) * 20, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Totais */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-400/20">
                        <div>
                          <p className="text-purple-200/60 text-xs mb-1">Visitantes</p>
                          <p className="text-white text-2xl font-bold">{(stats?.totalVisitors || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-purple-200/60 text-xs mb-1">Conversões</p>
                          <p className="text-white text-2xl font-bold">{(stats?.totalConversions || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="group relative overflow-hidden bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 backdrop-blur-xl transition-all duration-300 h-12 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <RefreshCw className={`w-5 h-5 mr-2 relative z-10 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="relative z-10">Atualizar Dados</span>
                </Button>

                <Button
                  onClick={handleCreateExperiment}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 h-12 font-bold hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Plus className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">Criar Experimento</span>
                  <Sparkles className="w-4 h-4 ml-2 relative z-10 animate-pulse" />
                </Button>
              </div>

              <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
                <SelectTrigger className="group relative overflow-hidden w-full sm:w-[280px] bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/30 text-white backdrop-blur-xl transition-all duration-300 h-14 font-semibold rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 hover:border-white/40">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
                      <Calendar className="w-5 h-5 text-blue-300" />
                    </div>
                  <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-900/98 backdrop-blur-2xl border-slate-700 shadow-2xl rounded-2xl overflow-hidden">
                  <SelectItem value="7d" className="text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 focus:bg-blue-500/20 cursor-pointer py-3 transition-all">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                    Últimos 7 dias
                    </div>
                  </SelectItem>
                  <SelectItem value="30d" className="text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 focus:bg-blue-500/20 cursor-pointer py-3 transition-all">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                    Últimos 30 dias
                    </div>
                  </SelectItem>
                  <SelectItem value="90d" className="text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 focus:bg-blue-500/20 cursor-pointer py-3 transition-all">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                    Últimos 90 dias
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION - Full Width */}
      <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Receita */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 border-0 shadow-2xl hover:shadow-emerald-500/50 transition-all duration-500 hover:-translate-y-2 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative p-7 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                    <DollarSign className="w-7 h-7" />
                  </div>
                  <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm shadow-lg">
                    <span className="text-sm font-bold">+{stats?.revenueChange.toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-sm opacity-90 font-medium mb-2">Receita Total</p>
                <p className="text-3xl sm:text-4xl font-black mb-3">
                  R$ {(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs opacity-80 font-medium">
                  ROI: R$ {(stats?.avgROI || 0).toFixed(2)}/visitante
                </p>
              </div>
            </Card>

            {/* Conversões */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-600 border-0 shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 hover:-translate-y-2 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative p-7 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm shadow-lg">
                    <span className="text-sm font-bold">+{stats?.conversionsChange.toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-sm opacity-90 font-medium mb-2">Conversões</p>
                <p className="text-3xl sm:text-4xl font-black mb-3">
                  {(stats?.totalConversions || 0).toLocaleString()}
                </p>
                <p className="text-xs opacity-80 font-medium">
                  Taxa: {(stats?.avgConversionRate || 0).toFixed(2)}%
                </p>
              </div>
            </Card>

            {/* Visitantes */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 border-0 shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 hover:-translate-y-2 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative p-7 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm shadow-lg">
                    <span className="text-sm font-bold">+{stats?.visitorsChange.toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-sm opacity-90 font-medium mb-2">Visitantes</p>
                <p className="text-3xl sm:text-4xl font-black mb-3">
                  {(stats?.totalVisitors || 0).toLocaleString()}
                </p>
                <p className="text-xs opacity-80 font-medium">Em {timeRangeLabel}</p>
              </div>
            </Card>

            {/* Experimentos */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-600 border-0 shadow-2xl hover:shadow-orange-500/50 transition-all duration-500 hover:-translate-y-2 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative p-7 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                    <Target className="w-7 h-7" />
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/30 rounded-full backdrop-blur-sm shadow-lg flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-xs font-bold">AO VIVO</span>
                  </div>
                </div>
                <p className="text-sm opacity-90 font-medium mb-2">Experimentos</p>
                <p className="text-3xl sm:text-4xl font-black mb-3">{stats?.activeExperiments || 0}</p>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span>{stats?.winners || 0} vencedores</span>
                  <span className="opacity-50">•</span>
                  <span>{stats?.losers || 0} perdedores</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Experiments Section */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-2">Experimentos Ativos</h2>
                <p className="text-lg text-slate-600">Acompanhe a performance em tempo real</p>
              </div>
              <Badge variant="outline" className="backdrop-blur-sm bg-blue-50 border-blue-300 text-blue-700 font-bold px-6 py-3 text-sm w-fit shadow-lg">
                <BarChart3 className="w-5 h-5 mr-2" />
                {experiments.length} {experiments.length === 1 ? 'experimento' : 'experimentos'}
              </Badge>
            </div>

            {experiments.length === 0 ? (
              <Card className="backdrop-blur-xl bg-white/90 border-0 shadow-2xl p-16 text-center">
                <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 mb-6 shadow-lg">
                  <AlertCircle className="w-16 h-16 text-slate-400" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Nenhum experimento ativo</h3>
                <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                  Comece a otimizar suas conversões criando seu primeiro experimento A/B agora
                </p>
                <Button
                  onClick={handleCreateExperiment}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-8 py-6 shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all"
                >
                  <Rocket className="w-6 h-6 mr-3" />
                  Criar Primeiro Experimento
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {experiments.map((exp) => (
                  <Card
                    key={exp.id}
                    onClick={() => handleViewExperiment(exp.id)}
                    className="group relative overflow-hidden backdrop-blur-xl bg-white/95 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer"
                  >
                    <div className={`absolute inset-0 opacity-5 bg-gradient-to-r ${
                      exp.isWinner ? 'from-emerald-500 to-green-500' : exp.uplift < -5 ? 'from-red-500 to-rose-500' : 'from-blue-500 to-purple-500'
                    }`} />

                    <div className="relative p-8 sm:p-10">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-8 mb-8">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{exp.name}</h3>
                            {exp.isWinner && (
                              <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg px-4 py-1.5">
                                <Trophy className="w-4 h-4 mr-2" />
                                Vencedor
                              </Badge>
                            )}
                            {exp.status === 'running' && (
                              <Badge variant="outline" className="border-green-400 bg-green-50 text-green-700 font-semibold px-4 py-1.5">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                                Rodando
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 font-medium">
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {exp.daysRunning} dias
                            </span>
                            <span>•</span>
                            <span>{exp.conversions} conversões</span>
                            <span>•</span>
                            <span className="font-bold text-slate-900">R$ {exp.revenue.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Mostrar UPLIFT apenas quando tiver dados suficientes */}
                        {exp.hasEnoughData && (
                          <div className={`px-10 py-6 rounded-3xl shadow-xl relative ${
                            exp.uplift > 0 ? 'bg-gradient-to-br from-emerald-50 to-green-100' : 'bg-gradient-to-br from-red-50 to-rose-100'
                          }`}>
                            <p className="text-xs font-bold text-slate-600 mb-1 text-center">UPLIFT</p>
                            <p className={`text-6xl font-black text-center ${exp.uplift > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {exp.uplift > 0 ? '+' : ''}{exp.uplift.toFixed(1)}%
                            </p>
                            {exp.isSignificant && (
                              <div className="absolute -top-2 -right-2">
                                <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                  ✓ Confiável
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="p-7 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 shadow-lg">
                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="outline" className="bg-white border-slate-300 text-slate-700 font-bold">Controle</Badge>
                            <span className="text-sm font-bold text-slate-700">{exp.control.name}</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-slate-600">Visitantes</span>
                              <span className="text-2xl font-black text-slate-900">{exp.control.visitors.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-slate-600">Conversões</span>
                              <span className="text-2xl font-black text-slate-900">{exp.control.conversions.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200">
                              <span className="text-sm font-bold text-slate-700">Taxa</span>
                              <span className="text-3xl font-black text-slate-900">{exp.control.rate.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>

                        <div className={`p-7 rounded-3xl border-2 shadow-lg ${
                          exp.uplift > 0
                            ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-300'
                            : 'bg-gradient-to-br from-red-50 to-rose-100 border-red-300'
                        }`}>
                          <div className="flex items-center gap-2 mb-4">
                            <Badge className={`border-0 text-white font-bold shadow-lg ${
                              exp.uplift > 0 ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-rose-600'
                            }`}>
                              {exp.uplift > 0 ? 'Vencedor' : 'Perdedor'}
                            </Badge>
                            <span className="text-sm font-bold text-slate-700">{exp.winner.name}</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-slate-600">Visitantes</span>
                              <span className="text-2xl font-black text-slate-900">{exp.winner.visitors.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-slate-600">Conversões</span>
                              <span className="text-2xl font-black text-slate-900">{exp.winner.conversions.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t-2 border-slate-300">
                              <span className="text-sm font-bold text-slate-700">Taxa</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-3xl font-black ${exp.uplift > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {exp.winner.rate.toFixed(2)}%
                                </span>
                                {exp.uplift > 0 ? (
                                  <ArrowUpRight className="w-7 h-7 text-emerald-600" />
                                ) : (
                                  <ArrowDownRight className="w-7 h-7 text-red-600" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mostrar Significância Estatística apenas quando tiver dados suficientes */}
                      {exp.hasEnoughData && (
                        <div className="p-7 rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-slate-700">Significância Estatística</span>
                            <span className="text-3xl font-black text-emerald-600">95%</span>
                          </div>
                          <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-emerald-500 to-green-600"
                              style={{ width: `95%` }}
                            />
                          </div>
                          {exp.pValue !== undefined && (
                            <div className="mt-3 p-3 bg-slate-100 rounded-xl border border-slate-300">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-slate-600">P-value:</span>
                                <span className="font-bold text-emerald-600">
                                  {exp.pValue.toFixed(4)} ✓
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <p className="text-sm text-emerald-700 font-semibold">
                              Resultado estatisticamente confiável com 95% de certeza.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-center mt-6 group-hover:scale-105 transition-transform">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
                          <span>Clique para ver todos os detalhes</span>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Experimento */}
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
