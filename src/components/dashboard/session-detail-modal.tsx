'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Eye,
  MousePointer,
  Target,
  Activity,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Chrome,
  Calendar,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Event } from '@/hooks/useEvents'

interface SessionDetailModalProps {
  session: {
    sessionId: string
    events: Event[]
    startTime: string
    visitor: string
    device?: string
    hasConversion: boolean
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SessionDetailModal({ session, open, onOpenChange }: SessionDetailModalProps) {
  if (!session) return null

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return Eye
      case 'click':
        return MousePointer
      case 'conversion':
        return Target
      default:
        return Activity
    }
  }

  const getDeviceIcon = (device?: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return Smartphone
      case 'tablet':
        return Tablet
      default:
        return Monitor
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const sessionDuration = () => {
    if (session.events.length < 2) return '< 1 min'
    const start = new Date(session.events[0].created_at).getTime()
    const end = new Date(session.events[session.events.length - 1].created_at).getTime()
    const diff = Math.floor((end - start) / 1000) // em segundos

    if (diff < 60) return `${diff}s`
    const minutes = Math.floor(diff / 60)
    if (minutes < 60) return `${minutes}m ${diff % 60}s`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  const totalRevenue = session.events
    .filter(e => e.value)
    .reduce((sum, e) => sum + (e.value || 0), 0)

  const DeviceIcon = getDeviceIcon(session.device)

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return 'bg-blue-500 text-white border-blue-400 shadow-md'
      case 'click':
        return 'bg-green-500 text-white border-green-400 shadow-md'
      case 'conversion':
        return 'bg-purple-500 text-white border-purple-400 shadow-md'
      case 'custom':
        return 'bg-orange-500 text-white border-orange-400 shadow-md'
      default:
        return 'bg-gray-500 text-white border-gray-400 shadow-md'
    }
  }

  const exportSessionData = () => {
    const dataStr = JSON.stringify({
      session_id: session.sessionId,
      visitor_id: session.visitor,
      device: session.device,
      start_time: session.startTime,
      duration: sessionDuration(),
      total_events: session.events.length,
      has_conversion: session.hasConversion,
      total_revenue: totalRevenue,
      events: session.events
    }, null, 2)

    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `session-${session.sessionId}-${Date.now()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <div className={cn(
          "relative bg-gradient-to-br p-10 pb-14",
          session.hasConversion
            ? "from-emerald-600 via-green-700 to-teal-800"
            : "from-blue-600 via-indigo-700 to-purple-800"
        )}>
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />

          <DialogHeader className="relative">
            <div className="flex items-start justify-between mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl" />
                <div className="relative p-5 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <DeviceIcon className="w-8 h-8 text-white" />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={exportSessionData}
                className="text-white hover:bg-white/20 rounded-xl transition-all border border-white/30 backdrop-blur-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>

            <DialogTitle className="text-4xl font-black text-white mb-3 leading-tight">
              Detalhes da Sessão
            </DialogTitle>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-xl font-semibold px-4 py-1.5 text-sm shadow-lg">
                <Activity className="w-3.5 h-3.5 mr-1.5" />
                {session.events.length} eventos
              </Badge>
              {session.hasConversion && (
                <Badge className="bg-emerald-500 text-white border-emerald-400 font-bold px-4 py-1.5 text-sm shadow-lg">
                  <Target className="w-3.5 h-3.5 mr-1.5" />
                  Converteu!
                </Badge>
              )}
              <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-xl font-mono px-4 py-1.5 text-sm shadow-lg">
                {session.visitor}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="max-h-[calc(95vh-380px)] overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Session Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                  <DeviceIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Visitor ID</p>
                  <p className="text-lg font-bold text-slate-900 font-mono">{session.visitor}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Duração da Sessão</p>
                  <p className="text-lg font-bold text-slate-900">{sessionDuration()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Total de Eventos</p>
                  <p className="text-lg font-bold text-slate-900">{session.events.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Receita Total</p>
                  <p className="text-lg font-bold text-slate-900">
                    {totalRevenue > 0 ? `R$ ${totalRevenue.toFixed(2)}` : 'R$ 0,00'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Session Metadata */}
          <Card className="p-4 border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Informações da Sessão</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Data:</span>
                <span>{formatDate(session.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Início:</span>
                <span>{formatTime(session.startTime)}</span>
              </div>
              {session.events[0]?.device_type && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Dispositivo:</span>
                  <span className="capitalize">{session.events[0].device_type}</span>
                </div>
              )}
              {session.events[0]?.browser && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Chrome className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Navegador:</span>
                  <span>{session.events[0].browser}</span>
                </div>
              )}
              {session.events[0]?.country && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">País:</span>
                  <span>{session.events[0].country}</span>
                </div>
              )}
              {session.events[0]?.experiment_id && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Target className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Experimento:</span>
                  <Badge variant="outline" className="text-xs">
                    {session.events[0].experiment_id}
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline of Events */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Linha do Tempo de Eventos</h3>
            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-300 via-purple-200 to-transparent" />

              {/* Events */}
              <div className="space-y-3">
                {session.events.map((event, index) => {
                  const Icon = getEventIcon(event.event_type)
                  const isLast = index === session.events.length - 1

                  return (
                    <div key={event.id} className="relative flex items-start gap-4">
                      {/* Timeline Dot */}
                      <div className="relative z-10">
                        <div className={cn(
                          "p-2 rounded-lg shadow-lg",
                          event.event_type === 'conversion' && "bg-gradient-to-br from-purple-500 to-pink-600 ring-4 ring-purple-200",
                          event.event_type === 'click' && "bg-gradient-to-br from-green-500 to-emerald-600",
                          event.event_type === 'page_view' && "bg-gradient-to-br from-blue-500 to-cyan-600",
                          event.event_type !== 'conversion' && event.event_type !== 'click' && event.event_type !== 'page_view' && "bg-gradient-to-br from-slate-500 to-slate-600"
                        )}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      {/* Event Card */}
                      <Card className="flex-1 p-4 border-2 transition-all hover:shadow-md">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-slate-900">{event.event_name}</h5>
                              <Badge className={cn("text-xs font-semibold", getEventBadgeColor(event.event_type))}>
                                {event.event_type}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(event.created_at)}
                              </span>
                              {event.value && (
                                <span className="flex items-center gap-1 font-bold text-emerald-700">
                                  <TrendingUp className="w-3 h-3" />
                                  R$ {event.value.toFixed(2)}
                                </span>
                              )}
                            </div>

                            {event.properties?.url && (
                              <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                <span className="font-mono break-all">{event.properties.url}</span>
                              </div>
                            )}

                            {/* UTM Parameters */}
                            {(event.utm_source || event.utm_medium || event.utm_campaign) && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {event.utm_source && (
                                  <Badge variant="outline" className="text-xs">
                                    Source: {event.utm_source}
                                  </Badge>
                                )}
                                {event.utm_medium && (
                                  <Badge variant="outline" className="text-xs">
                                    Medium: {event.utm_medium}
                                  </Badge>
                                )}
                                {event.utm_campaign && (
                                  <Badge variant="outline" className="text-xs">
                                    Campaign: {event.utm_campaign}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {!isLast && (
                            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                          )}
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Session Summary Stats */}
          <Card className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Resumo da Sessão</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <p className="text-2xl font-black text-slate-900">
                    {session.events.filter(e => e.event_type === 'page_view').length}
                  </p>
                </div>
                <p className="text-xs text-slate-600 font-medium">Page Views</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <p className="text-2xl font-black text-slate-900">
                    {session.events.filter(e => e.event_type === 'click').length}
                  </p>
                </div>
                <p className="text-xs text-slate-600 font-medium">Cliques</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <p className="text-2xl font-black text-slate-900">
                    {session.events.filter(e => e.event_type === 'conversion').length}
                  </p>
                </div>
                <p className="text-xs text-slate-600 font-medium">Conversões</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <p className="text-2xl font-black text-slate-900">
                    {session.events.filter(e => e.event_type === 'custom').length}
                  </p>
                </div>
                <p className="text-xs text-slate-600 font-medium">Personalizados</p>
              </div>
            </div>
          </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all px-8 font-bold"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
