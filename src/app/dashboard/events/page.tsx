'use client'

import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { AdvancedEventFilters, type EventFilters } from '@/components/dashboard/advanced-event-filters'
import { SavedFiltersManager } from '@/components/dashboard/saved-filters-manager'
import { useEvents } from '@/hooks/useEvents'

// 🚀 Lazy load componentes pesados para melhor performance e code splitting
// 🚀 Lazy load componentes pesados para melhor performance e code splitting
const EventTrendsChart = lazy(() =>
  import('@/components/dashboard/event-trends-chart')
    .then(mod => {
      if (!mod || !mod.EventTrendsChart) {
        console.error('❌ Falha ao carregar EventTrendsChart (Events Page):', mod)
        return { default: () => <div className="p-4 text-red-500">Erro ao carregar gráfico</div> }
      }
      return { default: mod.EventTrendsChart }
    })
    .catch(err => {
      console.error('❌ Erro no import do EventTrendsChart (Events Page):', err)
      return { default: () => <div className="p-4 text-red-500">Erro de carregamento</div> }
    })
)
const UTMAnalysisTable = lazy(() =>
  import('@/components/dashboard/utm-analysis-table')
    .then(mod => {
      if (!mod || !mod.UTMAnalysisTable) {
        console.error('❌ Falha ao carregar UTMAnalysisTable (Events Page):', mod)
        return { default: () => <div className="p-4 text-red-500">Erro ao carregar tabela</div> }
      }
      return { default: mod.UTMAnalysisTable }
    })
    .catch(err => {
      console.error('❌ Erro no import da UTMAnalysisTable (Events Page):', err)
      return { default: () => <div className="p-4 text-red-500">Erro de carregamento</div> }
    })
)

// Import skeleton components para loading states
import {
  ChartSkeleton,
  TableSkeleton
} from '@/components/dashboard/loading-skeletons'
import { createClient } from '@/lib/supabase/client'
import {
  Activity,
  Eye,
  MousePointer,
  Target,
  Zap,
  RefreshCw,
  Sparkles,
  Radio,
  Download
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { subDays, eachDayOfInterval } from 'date-fns'
import { toast } from 'sonner'

interface Experiment {
  id: string
  name: string
}

export default function EventsPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('events')
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)
  const [experiments, setExperiments] = useState<Experiment[]>([])

  // Filtros avançados
  const [filters, setFilters] = useState<EventFilters>({
    search: '',
    eventType: 'all',
    experimentId: 'all',
    dateFrom: undefined,
    dateTo: undefined,
    visitorId: '',
    device: '',
    browser: '',
    country: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    minValue: undefined,
    maxValue: undefined
  })

  // Hook customizado para buscar eventos
  const { events, stats, loading, hasMore, loadMore, refresh } = useEvents(filters, {
    pageSize: 50,
    realTime: realTimeEnabled
  })

  // Buscar experimentos
  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        const { data, error } = await supabase
          .from('experiments')
          .select('id, name')
          .in('status', ['running', 'paused', 'draft'])
          .order('created_at', { ascending: false })

        if (error) {
          // Silenciosamente usar array vazio se tabela não existir
          // Isso evita erros no console quando a tabela ainda não foi criada
          console.warn('Experiments table not available:', error.message || 'Unknown error')
          setExperiments([])
          return
        }

        setExperiments(data || [])
      } catch (err) {
        // Fallback para array vazio em caso de erro
        console.warn('Could not fetch experiments:', err instanceof Error ? err.message : 'Unknown error')
        setExperiments([])
      }
    }

    fetchExperiments()
  }, [supabase])

  // Preparar dados para gráfico de tendências
  const { timeSeriesData, distributionData, periodChange } = useMemo(() => {
    const dateRange = 14
    const endDate = new Date()
    const startDate = subDays(endDate, dateRange - 1)

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const timeSeriesData = days.map((day: Date) => {
      const dayStr = `${day.getDate().toString().padStart(2, '0')}/${(day.getMonth() + 1).toString().padStart(2, '0')}`
      const dayEvents = events.filter(e => {
        const eventDate = new Date(e.created_at)
        return eventDate.toDateString() === day.toDateString()
      })

      return {
        date: dayStr,
        page_views: dayEvents.filter(e => e.event_type === 'page_view').length,
        clicks: dayEvents.filter(e => e.event_type === 'click').length,
        conversions: dayEvents.filter(e => e.event_type === 'conversion').length,
        total: dayEvents.length
      }
    })

    const distributionData = [
      { name: 'Visualizações', value: stats.page_views, color: '#3b82f6' },
      { name: 'Cliques', value: stats.clicks, color: '#10b981' },
      { name: 'Conversões', value: stats.conversions, color: '#8b5cf6' },
      { name: 'Personalizados', value: stats.custom, color: '#f59e0b' }
    ]

    const midPoint = Math.floor(timeSeriesData.length / 2)
    const firstHalf = timeSeriesData.slice(0, midPoint)
    const secondHalf = timeSeriesData.slice(midPoint)

    const firstHalfTotal = firstHalf.reduce((sum: number, day: { total: number }) => sum + day.total, 0)
    const secondHalfTotal = secondHalf.reduce((sum: number, day: { total: number }) => sum + day.total, 0)

    const firstHalfAvg = firstHalf.length > 0 ? firstHalfTotal / firstHalf.length : 0
    const secondHalfAvg = secondHalf.length > 0 ? secondHalfTotal / secondHalf.length : 0

    const periodChange = firstHalfAvg > 0
      ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
      : 0

    return { timeSeriesData, distributionData, periodChange }
  }, [events, stats])

  const handleExport = () => {
    if (events.length === 0) {
      toast.error('Não há eventos para exportar')
      return
    }

    const headers = [
      'Data',
      'Evento',
      'Tipo',
      'Visitor ID',
      'Source',
      'Medium',
      'Campaign',
      'Device',
      'Browser',
      'Country',
      'Value'
    ]

    const csvContent = [
      headers.join(','),
      ...events.map(e => [
        new Date(e.created_at).toLocaleString('pt-BR'),
        e.event_name,
        e.event_type,
        e.visitor_id,
        e.utm_source || '',
        e.utm_medium || '',
        e.utm_campaign || '',
        e.device_type || '',
        e.browser || '',
        e.country || '',
        e.value || 0
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `events_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Relatório exportado com sucesso!')
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      eventType: 'all',
      experimentId: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      visitorId: '',
      device: '',
      browser: '',
      country: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      minValue: undefined,
      maxValue: undefined
    })
  }

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="text-center space-y-6">
          <div className="relative inline-flex">
            <div className="w-24 h-24 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-blue-400 animate-pulse" />
            </div>
          </div>
          <p className="text-white/80 text-xl font-semibold">Carregando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <DashboardNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        stats={{
          activeExperiments: 0,
          totalVisitors: stats.unique_visitors
        }}
        realtime={{ isConnected: realTimeEnabled }}
      />

      {/* 🎯 HERO SECTION - FULL WIDTH */}
      <div className="relative w-full min-h-[45vh] overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600/40 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/40" />

        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 w-full py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="space-y-4">
              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 border border-blue-400/30 backdrop-blur-xl px-4 py-2 text-sm font-semibold shadow-lg shadow-blue-500/20">
                <Zap className="w-4 h-4 mr-2 animate-pulse" />
                Análise de Campanhas
              </Badge>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight">
                  Eventos e
                  <span className="block mt-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                    Campanhas UTM
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-blue-100/90 leading-relaxed max-w-2xl font-light">
                  Análise completa de eventos com foco em performance de campanhas de marketing e rastreamento de conversões
                </p>
              </div>
            </div>

            {/* Mini Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 backdrop-blur-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200/80 font-medium">Total</p>
                    <p className="text-2xl font-black text-white">{stats.total_events.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-400/20 backdrop-blur-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                    <Eye className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-200/80 font-medium">Views</p>
                    <p className="text-2xl font-black text-white">{stats.page_views.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-400/20 backdrop-blur-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-teal-500/20">
                    <MousePointer className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-green-200/80 font-medium">Cliques</p>
                    <p className="text-2xl font-black text-white">{stats.clicks.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 backdrop-blur-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-200/80 font-medium">Conversões</p>
                    <p className="text-2xl font-black text-white">{stats.conversions.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION - CENTERED */}
      <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Header com botão de atualizar e toggle real-time */}
          <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Análise Completa de Campanhas</h2>
                <p className="text-base text-slate-600">Performance detalhada das suas campanhas UTM com métricas de conversão e rastreamento</p>
              </div>

              <div className="flex items-center gap-4">
                {/* Real-time Toggle */}
                <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Radio className={cn(
                      "h-4 w-4 transition-colors",
                      realTimeEnabled ? "text-green-500 animate-pulse" : "text-slate-400"
                    )} />
                    <span className="text-sm font-medium text-slate-700">Real-time</span>
                  </div>
                  <Switch
                    checked={realTimeEnabled}
                    onCheckedChange={setRealTimeEnabled}
                    className="data-[state=checked]:bg-green-500"
                  />
                  {realTimeEnabled && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs animate-pulse">
                      Ao vivo
                    </Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="border-2"
                  disabled={events.length === 0}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Exportar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={refresh}
                  className="border-2"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
                  Atualizar
                </Button>
              </div>
            </div>
          </Card>

          {/* Filters */}
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <AdvancedEventFilters
                filters={filters}
                onFiltersChange={setFilters}
                onReset={handleResetFilters}
                experiments={experiments}
                totalEvents={stats.total_events}
                filteredCount={events.length}
              />
            </div>
            <SavedFiltersManager
              currentFilters={filters}
              onLoadFilter={setFilters}
            />
          </div>

          {/* UTM Analysis Table - Main Content */}
          <Suspense fallback={<TableSkeleton />}>
            <UTMAnalysisTable events={events} />
          </Suspense>

          {/* Trends Chart */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-1 rounded-full bg-blue-600" />
              <h3 className="text-2xl font-bold text-slate-900">Tendências e Distribuição</h3>
            </div>
            <Suspense fallback={<ChartSkeleton />}>
              <EventTrendsChart
                timeSeriesData={timeSeriesData}
                distributionData={distributionData}
                totalEvents={stats.total_events}
                periodChange={periodChange}
              />
            </Suspense>
          </div>

        </div>
      </div>

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
