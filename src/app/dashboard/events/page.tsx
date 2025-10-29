'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Eye,
  MousePointer,
  Target,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Zap,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trophy,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Event {
  id: string
  event_type: string
  event_name: string
  visitor_id: string
  experiment_id?: string
  properties: Record<string, any>
  value?: number
  created_at: string
}

interface EventStats {
  total_events: number
  page_views: number
  clicks: number
  conversions: number
  unique_visitors: number
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<EventStats>({
    total_events: 0,
    page_views: 0,
    clicks: 0,
    conversions: 0,
    unique_visitors: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [activeTab, setActiveTab] = useState('events')

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Navegar para o dashboard principal quando mudar de aba
    if (tab !== 'events') {
      router.push('/dashboard')
    }
  }

  // Mock data - substitua por dados reais do Supabase
  useEffect(() => {
    const mockEvents: Event[] = [
      {
        id: '1',
        event_type: 'page_view',
        event_name: 'landing_page_view',
        visitor_id: 'visitor_123',
        experiment_id: 'exp_1',
        properties: { 
          url: '/landing',
          variant: 'B',
          utm_source: 'google',
          device: 'desktop'
        },
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        event_type: 'click',
        event_name: 'cta_button_click',
        visitor_id: 'visitor_456',
        experiment_id: 'exp_1',
        properties: { 
          button_text: 'Começar Agora',
          variant: 'A',
          position: 'header'
        },
        created_at: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: '3',
        event_type: 'conversion',
        event_name: 'signup_completed',
        visitor_id: 'visitor_789',
        experiment_id: 'exp_2',
        properties: { 
          variant: 'B',
          form_type: 'simplified'
        },
        value: 25.99,
        created_at: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: '4',
        event_type: 'custom',
        event_name: 'video_watched',
        visitor_id: 'visitor_101',
        properties: { 
          duration: 120,
          completion_rate: 0.8,
          video_title: 'Product Demo'
        },
        created_at: new Date(Date.now() - 180000).toISOString()
      }
    ]

    setEvents(mockEvents)
    setStats({
      total_events: 1247,
      page_views: 834,
      clicks: 298,
      conversions: 89,
      unique_visitors: 456
    })
    setLoading(false)
  }, [])

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return <Eye className="h-4 w-4" />
      case 'click':
        return <MousePointer className="h-4 w-4" />
      case 'conversion':
        return <Target className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'click':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'conversion':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'custom':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}m atrás`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h atrás`
    
    const days = Math.floor(hours / 24)
    return `${days}d atrás`
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.visitor_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = selectedFilter === 'all' || event.event_type === selectedFilter
    
    return matchesSearch && matchesFilter
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  if (loading) {
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

      {/* HERO SECTION - Estilo da Visão Geral */}
      <div className="relative w-full min-h-[60vh] overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950">
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
            {/* Title & Badge */}
            <div className="space-y-6 sm:space-y-8">
              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 border border-blue-400/30 backdrop-blur-xl px-6 py-2.5 text-sm font-semibold shadow-lg shadow-blue-500/20">
                <Zap className="w-4 h-4 mr-2 animate-pulse" />
                Monitoramento em Tempo Real
              </Badge>

              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight">
                  Eventos de
                  <span className="block mt-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                    Tracking
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-blue-100/90 leading-relaxed max-w-3xl font-light">
                  Visualize todos os eventos de tracking em tempo real. Monitore cliques, conversões e interações dos visitantes.
                </p>
              </div>
            </div>

            {/* Hero Stats Grid - Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total de Eventos */}
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 backdrop-blur-2xl p-8 hover:border-blue-400/40 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm">
                      <Activity className="w-7 h-7 text-blue-400" />
                    </div>
                    <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                      <span className="text-xs font-bold text-white">Total</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-blue-200/80 font-medium mb-2">Total de Eventos</p>
                    <p className="text-4xl sm:text-5xl font-black text-white">
                      {stats.total_events.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Visualizações */}
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-400/20 backdrop-blur-2xl p-8 hover:border-emerald-400/40 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-sm">
                      <Eye className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                      <span className="text-xs font-bold text-white">Ver</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-200/80 font-medium mb-2">Visualizações</p>
                    <p className="text-4xl sm:text-5xl font-black text-white">
                      {stats.page_views.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Conversões */}
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 backdrop-blur-2xl p-8 hover:border-purple-400/40 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm">
                      <Target className="w-7 h-7 text-purple-400" />
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/30 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-white">CONVERSÕES</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-purple-200/80 font-medium mb-2">Conversões</p>
                    <p className="text-4xl sm:text-5xl font-black text-white">
                      {stats.conversions.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          {/* Filters Section - Estilo moderno */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-2">Lista de Eventos</h2>
                <p className="text-lg text-slate-600">Monitore e analise eventos em tempo real</p>
              </div>
              <Badge variant="outline" className="backdrop-blur-sm bg-blue-50 border-blue-300 text-blue-700 font-bold px-6 py-3 text-sm w-fit shadow-lg">
                <BarChart3 className="w-5 h-5 mr-2" />
                {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
              </Badge>
            </div>

            <Card className="backdrop-blur-xl bg-white/90 border-0 shadow-2xl p-6">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Buscar por nome do evento ou visitor ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-11 h-12 text-base border-2 border-slate-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-slate-400" />
                  <div className="flex space-x-2">
                    {[
                      { key: 'all', label: 'Todos' },
                      { key: 'page_view', label: 'Visualizações' },
                      { key: 'click', label: 'Cliques' },
                      { key: 'conversion', label: 'Conversões' },
                      { key: 'custom', label: 'Custom' }
                    ].map((filter) => (
                      <Button
                        key={filter.key}
                        variant={selectedFilter === filter.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedFilter(filter.key)}
                        className={selectedFilter === filter.key 
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl" 
                          : "bg-white hover:bg-slate-50 border-2 border-slate-200"
                        }
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Events List - Estilo moderno */}
          <Card className="backdrop-blur-xl bg-white/90 border-0 shadow-2xl p-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">
                  Eventos Recentes 
                  {realTimeEnabled && (
                    <Badge variant="secondary" className="ml-3 bg-green-50 text-green-700 border-green-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1.5"></div>
                      Ao Vivo
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-slate-600 font-medium">
                  Mostrando {filteredEvents.length} de {events.length} eventos
                </p>
              </div>

              <div className="space-y-3">
                {filteredEvents.length === 0 ? (
                  <Card className="backdrop-blur-xl bg-white/90 border-0 shadow-2xl p-16 text-center">
                    <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 mb-6 shadow-lg">
                      <AlertCircle className="w-16 h-16 text-slate-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">Nenhum evento encontrado</h3>
                    <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                      Tente ajustar os filtros ou aguarde novos eventos chegarem
                    </p>
                  </Card>
                ) : (
                  filteredEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="group relative overflow-hidden backdrop-blur-xl bg-white/95 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer"
                    >
                      <div className={`absolute inset-0 opacity-5 bg-gradient-to-r ${
                        event.event_type === 'conversion' ? 'from-emerald-500 to-green-500' :
                        event.event_type === 'click' ? 'from-blue-500 to-cyan-500' :
                        'from-purple-500 to-pink-500'
                      }`} />
                      
                      <div className="relative p-6">
                        <div className="flex items-start space-x-4">
                          <div className={cn(
                            "p-3 rounded-2xl shadow-lg",
                            getEventBadgeColor(event.event_type)
                          )}>
                            {getEventIcon(event.event_type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-3 mb-3">
                              <h4 className="text-lg font-bold text-slate-900 truncate">{event.event_name}</h4>
                              <Badge 
                                variant="outline"
                                className={cn(getEventBadgeColor(event.event_type), "font-semibold")}
                              >
                                {event.event_type}
                              </Badge>
                              {event.experiment_id && (
                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-300 font-semibold">
                                  Exp: {event.experiment_id}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center flex-wrap gap-4 text-sm text-slate-600 mb-3">
                              <span className="flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-slate-400" />
                                <span className="font-medium">{event.visitor_id}</span>
                              </span>
                              {event.value && (
                                <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                                  <Target className="h-4 w-4" />
                                  R$ {event.value.toFixed(2)}
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span className="font-medium">{formatTimeAgo(event.created_at)}</span>
                              </span>
                            </div>
                            
                            {Object.keys(event.properties).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(event.properties).slice(0, 3).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                                    {key}: {String(value)}
                                  </Badge>
                                ))}
                                {Object.keys(event.properties).length > 3 && (
                                  <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                                    +{Object.keys(event.properties).length - 3} mais
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <Button variant="ghost" size="sm" className="hover:bg-slate-100 rounded-xl p-2">
                            <ExternalLink className="h-5 w-5 text-slate-400" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </Card>
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
