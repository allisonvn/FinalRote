'use client'

import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, Target, Eye, MousePointer, Activity, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Event } from '@/hooks/useEvents'

// Importação dinâmica para evitar problemas de SSR
const FixedSizeList = dynamic(
  () => import('react-window').then((mod) => {
    const Component = mod?.FixedSizeList
    if (!Component) {
      console.warn('FixedSizeList não encontrado, usando fallback')
      // Retornar um componente fallback que renderiza os itens diretamente
      return function FallbackList({ itemCount, itemSize, height, width, children }: any) {
        const Row = children
        return (
          <div style={{ height, width, overflowY: 'auto' }}>
            {Array.from({ length: itemCount }, (_, index) => (
              <div key={index} style={{ height: itemSize }}>
                {Row({ index, style: { height: itemSize } })}
              </div>
            ))}
          </div>
        )
      }
    }
    return Component
  }).catch((error) => {
    console.error('Erro ao carregar react-window:', error)
    // Componente fallback em caso de erro
    return function FallbackList({ itemCount, itemSize, height, width, children }: any) {
      const Row = children
      return (
        <div style={{ height, width, overflowY: 'auto' }}>
          {Array.from({ length: itemCount }, (_, index) => (
            <div key={index} style={{ height: itemSize }}>
              {Row({ index, style: { height: itemSize } })}
            </div>
          ))}
        </div>
      )
    }
  }),
  { 
    ssr: false,
    loading: () => <div className="p-4 text-center text-slate-600">Carregando lista...</div>
  }
)

interface VirtualizedEventListProps {
  events: Event[]
  onEventClick: (event: Event) => void
  height?: number
}

export function VirtualizedEventList({ events, onEventClick, height = 600 }: VirtualizedEventListProps) {
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

  // Componente Row para o FixedSizeList
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const event = events[index]
    if (!event) return null

    return (
      <div style={style} className="px-3">
        <Card
          onClick={() => onEventClick(event)}
          className="group relative overflow-hidden backdrop-blur-xl bg-white/95 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer mb-3"
        >
          <div className={`absolute inset-0 opacity-5 bg-gradient-to-r ${
            event.event_type === 'conversion' ? 'from-purple-500 to-pink-500' :
            event.event_type === 'click' ? 'from-green-500 to-teal-500' :
            event.event_type === 'page_view' ? 'from-blue-500 to-cyan-500' :
            'from-orange-500 to-amber-500'
          }`} />

          <div className="relative p-5">
            <div className="flex items-start space-x-4">
              <div className={cn(
                "p-3 rounded-xl shadow-md",
                getEventBadgeColor(event.event_type)
              )}>
                {getEventIcon(event.event_type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <h4 className="text-base font-bold text-slate-900 truncate">{event.event_name}</h4>
                  <Badge
                    variant="outline"
                    className={cn(getEventBadgeColor(event.event_type), "font-semibold text-xs")}
                  >
                    {event.event_type}
                  </Badge>
                  {event.experiment_id && (
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-300 font-semibold text-xs">
                      Exp: {event.experiment_id}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-4 text-sm text-slate-600 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-xs">{event.visitor_id}</span>
                  </span>
                  {event.value && (
                    <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                      <Target className="h-3.5 w-3.5" />
                      <span className="text-xs">R$ {event.value.toFixed(2)}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-xs">{formatTimeAgo(event.created_at)}</span>
                  </span>
                </div>

                {event.properties && Object.keys(event.properties).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(event.properties).slice(0, 3).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                        {key}: {String(value)}
                      </Badge>
                    ))}
                    {Object.keys(event.properties).length > 3 && (
                      <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                        +{Object.keys(event.properties).length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <ExternalLink className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-16 text-center">
        <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhum evento encontrado</h3>
        <p className="text-slate-600">Tente ajustar os filtros ou aguarde novos eventos</p>
      </Card>
    )
  }

  return (
    <div style={{ height, width: '100%' }}>
      <FixedSizeList
        height={height}
        itemCount={events.length}
        itemSize={180}
        width="100%"
      >
        {Row}
      </FixedSizeList>
    </div>
  )
}
