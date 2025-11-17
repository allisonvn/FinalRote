'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SessionDetailModal } from '@/components/dashboard/session-detail-modal'
import {
  Eye,
  MousePointer,
  Target,
  Activity,
  Clock,
  Users,
  CheckCircle,
  ArrowRight,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Event } from '@/hooks/useEvents'

interface EventTimelineProps {
  events: Event[]
  onEventClick?: (event: Event) => void
}

interface SessionData {
  sessionId: string
  events: Event[]
  startTime: string
  visitor: string
  device?: string
  hasConversion: boolean
}

export function EventTimeline({ events, onEventClick }: EventTimelineProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const sessionsPerPage = 5
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null)
  const [sessionModalOpen, setSessionModalOpen] = useState(false)

  // Agrupar eventos por sessão/visitante
  const groupedBySession = events.reduce((acc, event) => {
    const key = event.session_id || event.visitor_id
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(event)
    return acc
  }, {} as Record<string, Event[]>)

  const allSessions = Object.entries(groupedBySession).map(([sessionId, sessionEvents]) => ({
    sessionId,
    events: sessionEvents.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
    startTime: sessionEvents[0]?.created_at,
    visitor: sessionEvents[0]?.visitor_id,
    device: sessionEvents[0]?.device_type,
    hasConversion: sessionEvents.some(e => e.event_type === 'conversion')
  })).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  const totalPages = Math.ceil(allSessions.length / sessionsPerPage)
  const startIndex = (currentPage - 1) * sessionsPerPage
  const sessions = allSessions.slice(startIndex, startIndex + sessionsPerPage)

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
      minute: '2-digit'
    })
  }

  if (sessions.length === 0) {
    return (
      <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-16 text-center">
        <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhuma sessão encontrada</h3>
        <p className="text-slate-600">Aguarde eventos chegarem para visualizar a timeline</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pagination Header */}
      {totalPages > 1 && (
        <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Exibindo {startIndex + 1}-{Math.min(startIndex + sessionsPerPage, allSessions.length)} de {allSessions.length} sessões
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-2"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm font-semibold text-slate-700">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-2"
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {sessions.map((session) => {
        const DeviceIcon = getDeviceIcon(session.device)

        return (
          <Card
            key={session.sessionId}
            className={cn(
              "relative overflow-hidden backdrop-blur-xl border-0 shadow-xl transition-all duration-300",
              session.hasConversion
                ? "bg-gradient-to-br from-emerald-50 to-green-50 ring-2 ring-emerald-300"
                : "bg-white/95"
            )}
          >
            {session.hasConversion && (
              <div className="absolute top-0 right-0 p-4">
                <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-bold">Converteu!</span>
                </div>
              </div>
            )}

            <div className="p-6">
              {/* Session Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl",
                    session.hasConversion
                      ? "bg-gradient-to-br from-emerald-500 to-green-600"
                      : "bg-gradient-to-br from-blue-500 to-purple-600"
                  )}>
                    <DeviceIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-lg font-bold text-slate-900">Sessão do Visitante</h4>
                      <Badge variant="outline" className="bg-white/80 border-slate-300 font-mono">
                        {session.visitor}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Início: {formatTime(session.startTime)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4" />
                        {session.events.length} {session.events.length === 1 ? 'evento' : 'eventos'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-slate-300 via-slate-200 to-transparent" />

                {/* Events */}
                <div className="space-y-4">
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
                        <Card
                          onClick={() => onEventClick?.(event)}
                          className={cn(
                            "flex-1 p-4 border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
                            event.event_type === 'conversion' && "bg-purple-50 border-purple-300",
                            event.event_type === 'click' && "bg-green-50 border-green-300",
                            event.event_type === 'page_view' && "bg-blue-50 border-blue-300",
                            event.event_type !== 'conversion' && event.event_type !== 'click' && event.event_type !== 'page_view' && "bg-slate-50 border-slate-300"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-bold text-slate-900">{event.event_name}</h5>
                                <Badge className={cn(
                                  "text-xs",
                                  event.event_type === 'conversion' && "bg-purple-100 text-purple-800 border-purple-300",
                                  event.event_type === 'click' && "bg-green-100 text-green-800 border-green-300",
                                  event.event_type === 'page_view' && "bg-blue-100 text-blue-800 border-blue-300"
                                )}>
                                  {event.event_type}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-slate-600">
                                <span>{formatTime(event.created_at)}</span>
                                {event.value && (
                                  <span className="font-bold text-emerald-700">
                                    R$ {event.value.toFixed(2)}
                                  </span>
                                )}
                                {event.properties?.url && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <MapPin className="w-3 h-3" />
                                    {event.properties.url}
                                  </span>
                                )}
                              </div>
                            </div>

                            {!isLast && (
                              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                          </div>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Session Summary */}
              <div className="mt-6 pt-6 border-t-2 border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-slate-600">
                        {session.events.filter(e => e.event_type === 'page_view').length} views
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-slate-600">
                        {session.events.filter(e => e.event_type === 'click').length} cliques
                      </span>
                    </div>
                    {session.hasConversion && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-slate-600 font-bold">
                          {session.events.filter(e => e.event_type === 'conversion').length} conversão(ões)
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSession(session)
                      setSessionModalOpen(true)
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Ver Detalhes da Sessão
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )
      })}

      {/* Session Detail Modal */}
      <SessionDetailModal
        session={selectedSession}
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
      />
    </div>
  )
}
