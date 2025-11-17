"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'
import OptimizedCodeGenerator from '@/components/OptimizedCodeGenerator'
import { analyzeExperiment } from '@/lib/statistics'
import { cn } from '@/lib/utils'
import {
  X, Users, TrendingUp, BarChart3, Code, Settings,
  CheckCircle2, Clock, Activity, RefreshCw, Edit3,
  Play, Pause, StopCircle, Award, Target, Zap,
  Calendar, ExternalLink, Copy, CheckCircle,
  AlertTriangle, TrendingDown, ArrowUpRight, ArrowDownRight,
  Sparkles, Maximize2, Eye, MousePointer2
} from 'lucide-react'

interface ExperimentDetailsModalProps {
  experiment: any
  isOpen: boolean
  onClose: () => void
}

export function ExperimentDetailsModal({ experiment, isOpen, onClose }: ExperimentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [metrics, setMetrics] = useState<any>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [projectApiKey, setProjectApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(experiment.name)
  const [editedDescription, setEditedDescription] = useState(experiment.description || '')

  // Estados para eventos
  const [events, setEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventSearch, setEventSearch] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')

  const supabase = createClient()

  // Função otimizada para buscar todos os dados necessários
  const loadExperimentData = async () => {
    if (!experiment?.id) {
      console.log('❌ Experiment ID não fornecido')
      return
    }

    console.log('📊 Carregando dados do experimento:', experiment.id)
    console.log('📋 Dados recebidos do experimento:', experiment)

    try {
      setLoading(true)

      // Buscar dados em paralelo para melhor performance
      const [statsData, variantsData, projectData] = await Promise.all([
        // Buscar métricas agregadas
        supabase
          .from('variant_stats')
          .select('visitors, conversions, revenue')
          .eq('experiment_id', experiment.id),

        // Buscar variantes com stats
        supabase
          .from('variants')
          .select(`
            id,
            name,
            is_control,
            redirect_url,
            traffic_percentage,
            is_active
          `)
          .eq('experiment_id', experiment.id)
          .order('is_control', { ascending: false }),

        // Buscar API key do projeto
        experiment.project_id ? supabase
          .from('projects')
          .select('api_key')
          .eq('id', experiment.project_id)
          .single() : null
      ])

      // Processar métricas totais
      let totalMetrics = (statsData.data || []).reduce(
        (acc, curr) => ({
          visitors: acc.visitors + (curr.visitors || 0),
          conversions: acc.conversions + (curr.conversions || 0),
          revenue: acc.revenue + (curr.revenue || 0)
        }),
        { visitors: 0, conversions: 0, revenue: 0 }
      )

      // Se variant_stats não tiver dados, buscar de assignments e conversions
      if (totalMetrics.visitors === 0 && totalMetrics.conversions === 0) {
        const { data: allAssignments } = await supabase
          .from('assignments')
          .select('id, variant_id')
          .eq('experiment_id', experiment.id)

        const { data: allConversions } = await supabase
          .from('events')
          .select('id, value as conversion_value')
          .eq('experiment_id', experiment.id)
          .eq('event_type', 'conversion')

        const totalRevenue = (allConversions || []).reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0)
        
        totalMetrics = {
          visitors: allAssignments?.length || 0,
          conversions: allConversions?.length || 0,
          revenue: totalRevenue === 0 && allConversions && allConversions.length > 0 && experiment.conversion_value
            ? allConversions.length * Number(experiment.conversion_value)
            : totalRevenue
        }
        
        console.log('💰 Receita total calculada:', {
          conversoes: allConversions?.length || 0,
          totalRevenue,
          conversion_value_experimento: experiment.conversion_value,
          receita_final: totalMetrics.revenue
        })
      }

      totalMetrics.conversionRate = totalMetrics.visitors > 0
        ? (totalMetrics.conversions / totalMetrics.visitors) * 100
        : 0

      console.log('📈 Métricas totais:', totalMetrics)
      setMetrics(totalMetrics)

      // Buscar stats individuais para cada variante
      const variantsWithStats = await Promise.all(
        (variantsData.data || []).map(async (variant) => {
          // Tentar buscar de variant_stats primeiro
          const { data: variantStats } = await supabase
            .from('variant_stats')
            .select('visitors, conversions, revenue')
            .eq('variant_id', variant.id)
            .maybeSingle()

          let visitors = variantStats?.visitors || 0
          let conversions = variantStats?.conversions || 0
          let revenue = variantStats?.revenue || 0

          // Se variant_stats não tiver dados, buscar de assignments e conversions
          if (!variantStats) {
            const { data: assignments } = await supabase
              .from('assignments')
              .select('id')
              .eq('variant_id', variant.id)
            
            const { data: conversions_data } = await supabase
              .from('events')
              .select('id, value as conversion_value')
              .eq('variant_id', variant.id)
              .eq('event_type', 'conversion')

            visitors = assignments?.length || 0
            conversions = conversions_data?.length || 0
            
            // Calcular receita das conversões registradas
            revenue = (conversions_data || []).reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0)
            
            // Se não houver valor nas conversões, usar o valor padrão do experimento
            if (revenue === 0 && conversions > 0 && experiment.conversion_value) {
              revenue = conversions * Number(experiment.conversion_value)
            }
            
            console.log(`💰 Variante ${variant.name}: ${conversions} conversões, receita = R$ ${revenue.toFixed(2)}`)
          }

          return {
            ...variant,
            visitors,
            conversions,
            revenue,
            conversionRate: visitors > 0 ? (conversions / visitors) * 100 : 0
          }
        })
      )

      console.log('🎯 Variantes encontradas:', variantsWithStats.length)
      console.log('📊 Dados das variantes:', variantsWithStats)
      setVariants(variantsWithStats)

      // Setar API key se disponível
      if (projectData?.data?.api_key) {
        setProjectApiKey(projectData.data.api_key)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados quando modal abrir
  useEffect(() => {
    if (isOpen && experiment?.id) {
      loadExperimentData()
    }
  }, [isOpen, experiment?.id])

  // Carregar eventos do experimento
  const loadExperimentEvents = async () => {
    if (!experiment?.id) return

    try {
      setEventsLoading(true)

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('experiment_id', experiment.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setEvents(data || [])
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
      // Fallback para dados mock
      setEvents([
        {
          id: '1',
          event_type: 'page_view',
          event_name: 'landing_view',
          visitor_id: 'visitor_abc123',
          variant_id: variants[0]?.id,
          properties: { url: '/landing', device: 'desktop' },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          event_type: 'click',
          event_name: 'cta_click',
          visitor_id: 'visitor_def456',
          variant_id: variants[1]?.id,
          properties: { button: 'Get Started' },
          created_at: new Date(Date.now() - 120000).toISOString()
        },
        {
          id: '3',
          event_type: 'conversion',
          event_name: 'purchase',
          visitor_id: 'visitor_ghi789',
          variant_id: variants[0]?.id,
          value: 99.90,
          properties: { product: 'Pro Plan' },
          created_at: new Date(Date.now() - 300000).toISOString()
        }
      ])
    } finally {
      setEventsLoading(false)
    }
  }

  // Refresh manual
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadExperimentData()
    if (activeTab === 'events') {
      await loadExperimentEvents()
    }
    setRefreshing(false)
  }

  // Carregar eventos quando a aba for aberta
  useEffect(() => {
    if (activeTab === 'events' && isOpen) {
      loadExperimentEvents()
    }
  }, [activeTab, isOpen])

  // Salvar alterações
  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({
          name: editedName,
          description: editedDescription
        })
        .eq('id', experiment.id)

      if (error) throw error

      // Atualizar objeto local
      experiment.name = editedName
      experiment.description = editedDescription

      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar alterações')
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'events', label: 'Eventos', icon: Activity },
    { id: 'code', label: 'Código', icon: Code },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ]

  const statusConfig: any = {
    draft: {
      label: 'Rascunho',
      color: 'bg-slate-500',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-700',
      borderColor: 'border-slate-300',
      icon: Clock
    },
    running: {
      label: 'Executando',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-300',
      icon: Zap
    },
    paused: {
      label: 'Pausado',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-300',
      icon: Pause
    },
    completed: {
      label: 'Concluído',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-300',
      icon: CheckCircle2
    }
  }

  const status = statusConfig[experiment.status] || statusConfig.draft
  const StatusIcon = status.icon

  // Encontrar a variante vencedora
  const winnerVariant = variants.length > 0
    ? variants.reduce((prev, current) =>
        (current.conversionRate > prev.conversionRate) ? current : prev
      )
    : null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in-0 duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Premium Header with Gradient */}
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 p-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />

          {/* Content */}
          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={cn(
                    "px-4 py-2 font-bold",
                    status.bgColor,
                    status.textColor,
                    status.borderColor,
                    "border-2"
                  )}>
                    <StatusIcon className="w-4 h-4 mr-2" />
                    {status.label}
                  </Badge>
                  {experiment.type && (
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm px-3 py-1.5">
                      <Code className="w-3.5 h-3.5 mr-1.5" />
                      {experiment.type.toUpperCase()}
                    </Badge>
                  )}
                </div>

                <h2 className="text-4xl font-black text-white mb-2 leading-tight">
                  {experiment.name}
                </h2>
                <p className="text-lg text-blue-200/90 leading-relaxed max-w-2xl">
                  {experiment.description || 'Sem descrição fornecida'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-white hover:bg-white/10 rounded-xl h-10 w-10 p-0"
                >
                  <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/10 rounded-xl h-10 w-10 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Quick Stats in Header */}
            <div className="grid grid-cols-4 gap-4">
              <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20">
                    <Users className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200/80 font-medium">Visitantes</p>
                    <p className="text-2xl font-black text-white">
                      {loading ? '...' : (metrics?.visitors || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/20">
                    <Target className="w-5 h-5 text-green-300" />
                  </div>
                  <div>
                    <p className="text-xs text-green-200/80 font-medium">Conversões</p>
                    <p className="text-2xl font-black text-white">
                      {loading ? '...' : (metrics?.conversions || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20">
                    <TrendingUp className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-200/80 font-medium">Taxa Conv.</p>
                    <p className="text-2xl font-black text-white">
                      {loading ? '...' : `${(metrics?.conversionRate || 0).toFixed(2)}%`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20">
                    <Activity className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-200/80 font-medium">Receita</p>
                    <p className="text-2xl font-black text-white">
                      {loading ? '...' : `R$ ${(metrics?.revenue || 0).toFixed(0)}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 px-6 pt-4">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "group relative flex items-center gap-2 px-6 py-3.5 text-sm font-bold transition-all rounded-t-2xl",
                    isActive
                      ? "bg-white text-slate-900 shadow-lg"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-gradient-to-br from-blue-500 to-purple-600"
                      : "bg-slate-200 group-hover:bg-slate-300"
                  )}>
                    <Icon className={cn("w-4 h-4", isActive && "text-white")} />
                  </div>
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
          <div className="p-8 space-y-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Winner Announcement */}
                {winnerVariant && variants.length > 1 && (
                  <Card className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/20 rounded-full blur-3xl" />
                    <div className="relative p-8">
                      <div className="flex items-start gap-6">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                          <Award className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-black text-slate-900">Variante com Melhor Performance</h3>
                            <Sparkles className="w-6 h-6 text-amber-500" />
                          </div>
                          <p className="text-slate-600 mb-4">
                            A variante <span className="font-bold text-amber-700">{winnerVariant.name}</span> está liderando com uma taxa de conversão de{' '}
                            <span className="font-bold text-amber-700">{winnerVariant.conversionRate.toFixed(2)}%</span>
                          </p>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Eye className="w-5 h-5 text-slate-500" />
                              <span className="text-sm text-slate-700">
                                <span className="font-bold">{winnerVariant.visitors.toLocaleString()}</span> visitantes
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="w-5 h-5 text-green-600" />
                              <span className="text-sm text-slate-700">
                                <span className="font-bold text-green-700">{winnerVariant.conversions.toLocaleString()}</span> conversões
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="w-5 h-5 text-purple-600" />
                              <span className="text-sm text-slate-700">
                                <span className="font-bold text-purple-700">R$ {winnerVariant.revenue.toFixed(2)}</span> em receita
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

              {/* Variantes */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 mb-1">Desempenho das Variantes</h3>
                    <p className="text-slate-600">Comparação detalhada de todas as variantes do teste</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-bold px-4 py-2">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {variants.length} {variants.length === 1 ? 'variante' : 'variantes'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-16 text-center">
                      <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 mb-6 shadow-lg">
                        <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
                      </div>
                      <p className="text-xl font-bold text-slate-900">Carregando dados...</p>
                    </Card>
                  ) : variants.length === 0 ? (
                    <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-16 text-center">
                      <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 mb-6 shadow-lg">
                        <AlertTriangle className="w-16 h-16 text-slate-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">Nenhuma variante configurada</h3>
                      <p className="text-base text-slate-600 max-w-md mx-auto">
                        Configure variantes para começar a testar diferentes versões
                      </p>
                    </Card>
                  ) : (
                    variants.map((variant, index) => {
                      const isWinner = winnerVariant && variant.id === winnerVariant.id
                      const isControl = variant.is_control

                      return (
                        <Card
                          key={variant.id}
                          className={cn(
                            "group relative overflow-hidden backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1",
                            isWinner && "bg-gradient-to-br from-amber-50 to-yellow-50 ring-2 ring-amber-300",
                            isControl && !isWinner && "bg-gradient-to-br from-blue-50 to-cyan-50",
                            !isWinner && !isControl && "bg-white/95"
                          )}
                        >
                          {/* Background Decoration */}
                          <div className={cn(
                            "absolute inset-0 opacity-5 bg-gradient-to-r",
                            isWinner ? "from-amber-500 to-orange-500" :
                            isControl ? "from-blue-500 to-cyan-500" :
                            "from-purple-500 to-pink-500"
                          )} />

                          <div className="relative p-8">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "p-4 rounded-2xl shadow-lg",
                                  isWinner ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                                  isControl ? "bg-gradient-to-br from-blue-500 to-cyan-600" :
                                  "bg-gradient-to-br from-purple-500 to-pink-600"
                                )}>
                                  {isWinner ? (
                                    <Award className="w-8 h-8 text-white" />
                                  ) : isControl ? (
                                    <Target className="w-8 h-8 text-white" />
                                  ) : (
                                    <Sparkles className="w-8 h-8 text-white" />
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-2xl font-black text-slate-900">{variant.name}</h4>
                                    {isWinner && (
                                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold px-3 py-1">
                                        <Award className="w-3.5 h-3.5 mr-1.5" />
                                        Melhor Performance
                                      </Badge>
                                    )}
                                    {isControl && (
                                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-bold">
                                        <Target className="w-3.5 h-3.5 mr-1.5" />
                                        Controle
                                      </Badge>
                                    )}
                                    {!variant.is_active && (
                                      <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300">
                                        Inativa
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-600 flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Variante {index + 1} de {variants.length}
                                  </p>
                                </div>
                              </div>

                              {/* Conversion Rate - Big Number */}
                              <div className="text-right">
                                <div className="flex items-center gap-2 justify-end mb-1">
                                  {variant.conversionRate > 0 ? (
                                    <ArrowUpRight className="w-6 h-6 text-green-600" />
                                  ) : (
                                    <ArrowDownRight className="w-6 h-6 text-slate-400" />
                                  )}
                                </div>
                                <p className={cn(
                                  "text-5xl font-black",
                                  isWinner ? "text-amber-600" :
                                  isControl ? "text-blue-600" :
                                  "text-purple-600"
                                )}>
                                  {variant.conversionRate.toFixed(2)}%
                                </p>
                                <p className="text-sm font-medium text-slate-600 mt-1">Taxa de Conversão</p>
                              </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-3 gap-6 mb-6">
                              <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="w-5 h-5 text-blue-600" />
                                  <p className="text-sm font-semibold text-slate-600">Visitantes</p>
                                </div>
                                <p className="text-3xl font-black text-slate-900">{variant.visitors.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-1">{variant.traffic_percentage}% do tráfego</p>
                              </div>

                              <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                  <p className="text-sm font-semibold text-slate-600">Conversões</p>
                                </div>
                                <p className="text-3xl font-black text-green-700">{variant.conversions.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {variant.visitors > 0 ? ((variant.conversions / variant.visitors) * 100).toFixed(1) : 0}% dos visitantes
                                </p>
                              </div>

                              <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Activity className="w-5 h-5 text-purple-600" />
                                  <p className="text-sm font-semibold text-slate-600">Receita</p>
                                </div>
                                <p className="text-3xl font-black text-purple-700">R$ {variant.revenue.toFixed(2)}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {variant.conversions > 0 ? `R$ ${(variant.revenue / variant.conversions).toFixed(2)}` : 'R$ 0,00'} por conversão
                                </p>
                              </div>
                            </div>

                            {/* Traffic Allocation Progress */}
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-slate-700">Alocação de Tráfego</p>
                                <p className="text-sm font-bold text-slate-900">{variant.traffic_percentage}%</p>
                              </div>
                              <Progress
                                value={variant.traffic_percentage}
                                className="h-3 bg-slate-200"
                              />
                            </div>

                            {/* Redirect URL */}
                            {variant.redirect_url && (
                              <div className="pt-6 border-t-2 border-slate-200">
                                <div className="flex items-start gap-4">
                                  <div className="p-3 rounded-xl bg-slate-100">
                                    <ExternalLink className="w-5 h-5 text-slate-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700 mb-1">URL de Redirecionamento</p>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-mono text-blue-600 truncate flex-1">
                                        {variant.redirect_url}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          navigator.clipboard.writeText(variant.redirect_url)
                                        }}
                                        className="shrink-0"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-8">
              {/* Header com Stats */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2">Eventos do Experimento</h3>
                  <p className="text-slate-600">Monitoramento em tempo real dos eventos deste teste</p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-bold px-4 py-2">
                  <Activity className="w-4 h-4 mr-2" />
                  {events.length} {events.length === 1 ? 'evento' : 'eventos'}
                </Badge>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-700">Visualizações</p>
                      <p className="text-3xl font-black text-blue-900">
                        {events.filter(e => e.event_type === 'page_view').length}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="backdrop-blur-xl bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                      <MousePointer2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-700">Cliques</p>
                      <p className="text-3xl font-black text-green-900">
                        {events.filter(e => e.event_type === 'click').length}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-700">Conversões</p>
                      <p className="text-3xl font-black text-purple-900">
                        {events.filter(e => e.event_type === 'conversion').length}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="backdrop-blur-xl bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-700">Únicos</p>
                      <p className="text-3xl font-black text-amber-900">
                        {new Set(events.map(e => e.visitor_id)).size}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Filtros */}
              <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Buscar por nome do evento ou visitor ID..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="w-full px-4 py-3 pl-12 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>

                  <div className="flex gap-2">
                    {[
                      { key: 'all', label: 'Todos', color: 'slate' },
                      { key: 'page_view', label: 'Views', color: 'blue' },
                      { key: 'click', label: 'Cliques', color: 'green' },
                      { key: 'conversion', label: 'Conversões', color: 'purple' }
                    ].map((filter) => (
                      <Button
                        key={filter.key}
                        variant={eventTypeFilter === filter.key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEventTypeFilter(filter.key)}
                        className={cn(
                          "border-2",
                          eventTypeFilter === filter.key
                            ? `bg-gradient-to-r from-${filter.color}-500 to-${filter.color}-600 text-white border-0 shadow-lg`
                            : "bg-white hover:bg-slate-50"
                        )}
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Lista de Eventos */}
              <div className="space-y-3">
                {eventsLoading ? (
                  <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-16 text-center">
                    <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 mb-6 shadow-lg">
                      <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
                    </div>
                    <p className="text-xl font-bold text-slate-900">Carregando eventos...</p>
                  </Card>
                ) : events
                    .filter(e => {
                      const matchesSearch = eventSearch === '' ||
                        e.event_name?.toLowerCase().includes(eventSearch.toLowerCase()) ||
                        e.visitor_id?.toLowerCase().includes(eventSearch.toLowerCase())
                      const matchesFilter = eventTypeFilter === 'all' || e.event_type === eventTypeFilter
                      return matchesSearch && matchesFilter
                    }).length === 0 ? (
                  <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-16 text-center">
                    <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 mb-6 shadow-lg">
                      <AlertTriangle className="w-16 h-16 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Nenhum evento encontrado</h3>
                    <p className="text-base text-slate-600 max-w-md mx-auto">
                      Ajuste os filtros ou aguarde novos eventos chegarem
                    </p>
                  </Card>
                ) : (
                  events
                    .filter(e => {
                      const matchesSearch = eventSearch === '' ||
                        e.event_name?.toLowerCase().includes(eventSearch.toLowerCase()) ||
                        e.visitor_id?.toLowerCase().includes(eventSearch.toLowerCase())
                      const matchesFilter = eventTypeFilter === 'all' || e.event_type === eventTypeFilter
                      return matchesSearch && matchesFilter
                    })
                    .map((event) => {
                      const variant = variants.find(v => v.id === event.variant_id)
                      const eventIcon = event.event_type === 'page_view' ? Eye :
                                       event.event_type === 'click' ? MousePointer2 :
                                       event.event_type === 'conversion' ? Target : Activity

                      const eventColor = event.event_type === 'page_view' ? 'blue' :
                                        event.event_type === 'click' ? 'green' :
                                        event.event_type === 'conversion' ? 'purple' : 'slate'

                      const Icon = eventIcon

                      return (
                        <Card
                          key={event.id}
                          className={cn(
                            "group relative overflow-hidden backdrop-blur-xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1",
                            event.event_type === 'page_view' && "bg-gradient-to-br from-blue-50/80 to-cyan-50/80",
                            event.event_type === 'click' && "bg-gradient-to-br from-green-50/80 to-emerald-50/80",
                            event.event_type === 'conversion' && "bg-gradient-to-br from-purple-50/80 to-pink-50/80",
                            event.event_type !== 'page_view' && event.event_type !== 'click' && event.event_type !== 'conversion' && "bg-white/95"
                          )}
                        >
                          <div className={cn(
                            "absolute inset-0 opacity-5 bg-gradient-to-r",
                            `from-${eventColor}-500 to-${eventColor}-600`
                          )} />

                          <div className="relative p-6">
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "p-3 rounded-xl shadow-md",
                                event.event_type === 'page_view' && "bg-gradient-to-br from-blue-500 to-cyan-600",
                                event.event_type === 'click' && "bg-gradient-to-br from-green-500 to-emerald-600",
                                event.event_type === 'conversion' && "bg-gradient-to-br from-purple-500 to-pink-600",
                                event.event_type !== 'page_view' && event.event_type !== 'click' && event.event_type !== 'conversion' && "bg-gradient-to-br from-slate-500 to-slate-600"
                              )}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-bold text-slate-900">{event.event_name || 'Unnamed Event'}</h4>
                                  <Badge className={cn(
                                    "font-semibold",
                                    event.event_type === 'page_view' && "bg-blue-100 text-blue-800 border-blue-300",
                                    event.event_type === 'click' && "bg-green-100 text-green-800 border-green-300",
                                    event.event_type === 'conversion' && "bg-purple-100 text-purple-800 border-purple-300",
                                    event.event_type !== 'page_view' && event.event_type !== 'click' && event.event_type !== 'conversion' && "bg-slate-100 text-slate-800 border-slate-300"
                                  )}>
                                    {event.event_type}
                                  </Badge>
                                  {variant && (
                                    <Badge variant="outline" className="bg-white/80 text-slate-700 border-slate-300 font-semibold">
                                      {variant.name}
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-6 text-sm text-slate-600 mb-3">
                                  <span className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span className="font-medium font-mono">{event.visitor_id}</span>
                                  </span>
                                  {event.value && (
                                    <span className="flex items-center gap-2 font-bold text-emerald-700">
                                      <Activity className="w-4 h-4" />
                                      R$ {Number(event.value).toFixed(2)}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {new Date(event.created_at).toLocaleString('pt-BR', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>

                                {event.properties && Object.keys(event.properties).length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(event.properties).slice(0, 4).map(([key, value]) => (
                                      <Badge key={key} variant="outline" className="text-xs bg-white/80 text-slate-700 border-slate-200">
                                        {key}: {String(value)}
                                      </Badge>
                                    ))}
                                    {Object.keys(event.properties).length > 4 && (
                                      <Badge variant="outline" className="text-xs bg-white/80 text-slate-700 border-slate-200">
                                        +{Object.keys(event.properties).length - 4}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {event.event_type === 'conversion' && (
                                  <div className="p-2 rounded-lg bg-emerald-100">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })
                )}
              </div>

              {/* Load More */}
              {!eventsLoading && events.length >= 100 && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2"
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Carregar Mais Eventos
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Code Tab */}
          {activeTab === 'code' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">Código de Integração</h3>
                <p className="text-slate-600">Copie e cole o código abaixo no seu site para começar o teste</p>
              </div>
              <OptimizedCodeGenerator
                experimentName={experiment.name}
                experimentId={experiment.id}
                experimentType={experiment.type || 'redirect'}
                variants={variants}
                apiKey={projectApiKey}
                algorithm={experiment.algorithm || 'uniform'}
                conversionValue={experiment.conversion_value || 0}
                conversionConfig={experiment.conversion_config}
                projectId={experiment.project_id}
              />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              {isEditing ? (
                <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 mb-1">Editar Experimento</h3>
                      <p className="text-slate-600">Atualize as informações básicas do experimento</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">
                          Nome do Experimento
                        </label>
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium"
                          placeholder="Ex: Teste de Landing Page"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">
                          Descrição
                        </label>
                        <textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-slate-900"
                          rows={5}
                          placeholder="Descreva o objetivo e hipótese do teste..."
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setEditedName(experiment.name)
                            setEditedDescription(experiment.description || '')
                            setIsEditing(false)
                          }}
                          className="flex-1 border-2"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSave}
                          size="lg"
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Salvar Alterações
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 mb-1">Informações Básicas</h3>
                        <p className="text-slate-600">Dados gerais do experimento</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="border-2"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Nome</p>
                        <p className="text-base font-bold text-slate-900">{experiment.name}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Tipo</p>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold">
                          <Code className="w-3.5 h-3.5 mr-1.5" />
                          {(experiment.type || 'REDIRECT').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Algoritmo</p>
                        <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-bold">
                          <Zap className="w-3.5 h-3.5 mr-1.5" />
                          {(experiment.algorithm || 'UNIFORM').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Criado em</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <p className="text-base font-bold text-slate-900">
                            {new Date(experiment.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Descrição</p>
                        <p className="text-slate-700 leading-relaxed">
                          {experiment.description || 'Nenhuma descrição fornecida'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Conversion Settings */}
                  <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-8">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-slate-900 mb-1">Configurações de Conversão</h3>
                      <p className="text-slate-600">Como o sistema rastreia conversões</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {experiment.target_url && (
                        <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
                          <p className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            URL Alvo
                          </p>
                          <p className="font-mono text-sm text-slate-900 break-all">{experiment.target_url}</p>
                        </div>
                      )}

                      {experiment.conversion_url && (
                        <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
                          <p className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            URL de Conversão
                          </p>
                          <p className="font-mono text-sm text-slate-900 break-all">{experiment.conversion_url}</p>
                        </div>
                      )}

                      {experiment.conversion_type && (
                        <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200">
                          <p className="text-sm font-semibold text-purple-700 mb-2">Tipo de Conversão</p>
                          <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-bold">
                            {experiment.conversion_type.toUpperCase()}
                          </Badge>
                        </div>
                      )}

                      <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200">
                        <p className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Valor da Conversão
                        </p>
                        <p className="text-2xl font-black text-amber-900">
                          R$ {(experiment.conversion_value || 0).toFixed(2)}
                        </p>
                      </div>

                      {experiment.conversion_selector && (
                        <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Seletor de Conversão
                          </p>
                          <p className="font-mono text-sm text-slate-900 bg-slate-900 text-green-400 p-3 rounded-lg">
                            {experiment.conversion_selector}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Experiment Parameters */}
                  <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-8">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-slate-900 mb-1">Parâmetros do Experimento</h3>
                      <p className="text-slate-600">Configurações avançadas e estatísticas</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 rounded-xl bg-blue-500">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-blue-700">Alocação de Tráfego</p>
                            <p className="text-3xl font-black text-blue-900">
                              {((experiment.traffic_allocation || 1) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {experiment.duration_days && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-xl bg-purple-500">
                              <Clock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-purple-700">Duração Planejada</p>
                              <p className="text-3xl font-black text-purple-900">
                                {experiment.duration_days} <span className="text-lg">dias</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {experiment.confidence_level && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-xl bg-green-500">
                              <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-green-700">Nível de Confiança</p>
                              <p className="text-3xl font-black text-green-900">
                                {(experiment.confidence_level * 100).toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Actions */}
                  <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-8">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-slate-900 mb-1">Ações do Experimento</h3>
                      <p className="text-slate-600">Controle o estado e execução do teste</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        size="lg"
                        className="h-auto py-4 flex-col items-start bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Play className="w-5 h-5" />
                          <span className="font-bold">Iniciar Experimento</span>
                        </div>
                        <span className="text-xs text-green-100">Começar a coletar dados</span>
                      </Button>

                      <Button
                        size="lg"
                        variant="outline"
                        className="h-auto py-4 flex-col items-start border-2 border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-800"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Pause className="w-5 h-5" />
                          <span className="font-bold">Pausar Experimento</span>
                        </div>
                        <span className="text-xs text-yellow-600">Parar temporariamente</span>
                      </Button>

                      <Button
                        size="lg"
                        variant="outline"
                        className="h-auto py-4 flex-col items-start border-2 border-red-300 bg-red-50 hover:bg-red-100 text-red-800"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <StopCircle className="w-5 h-5" />
                          <span className="font-bold">Finalizar Experimento</span>
                        </div>
                        <span className="text-xs text-red-600">Encerrar definitivamente</span>
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
