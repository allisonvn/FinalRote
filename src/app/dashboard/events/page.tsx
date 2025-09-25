'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  ExternalLink
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

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground">
            Monitore eventos de tracking em tempo real
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant={realTimeEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Tempo Real
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Eventos</p>
              <p className="text-2xl font-bold">{stats.total_events.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visualizações</p>
              <p className="text-2xl font-bold">{stats.page_views.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <MousePointer className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cliques</p>
              <p className="text-2xl font-bold">{stats.clicks.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversões</p>
              <p className="text-2xl font-bold">{stats.conversions.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visitantes Únicos</p>
              <p className="text-2xl font-bold">{stats.unique_visitors.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do evento ou visitor ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex space-x-1">
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
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Events List */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Eventos Recentes 
              {realTimeEnabled && (
                <Badge variant="secondary" className="ml-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                  Ao Vivo
                </Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filteredEvents.length} de {events.length} eventos
            </p>
          </div>

          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">Nenhum evento encontrado</h4>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros ou aguarde novos eventos
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className={cn(
                    "p-2 rounded-full",
                    getEventBadgeColor(event.event_type).replace('text-', 'text-').replace('border-', 'bg-').replace('bg-', 'bg-')
                  )}>
                    {getEventIcon(event.event_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium truncate">{event.event_name}</h4>
                      <Badge 
                        variant="outline"
                        className={getEventBadgeColor(event.event_type)}
                      >
                        {event.event_type}
                      </Badge>
                      {event.experiment_id && (
                        <Badge variant="secondary" className="text-xs">
                          Exp: {event.experiment_id}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      <span>Visitor: {event.visitor_id}</span>
                      {event.value && (
                        <span>Valor: R$ {event.value.toFixed(2)}</span>
                      )}
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeAgo(event.created_at)}
                      </span>
                    </div>
                    
                    {Object.keys(event.properties).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(event.properties).slice(0, 3).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                        {Object.keys(event.properties).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{Object.keys(event.properties).length - 3} mais
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
