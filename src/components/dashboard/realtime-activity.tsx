'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Users, Target, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'assignment' | 'conversion' | 'event'
  timestamp: string
  title: string
  subtitle?: string
  value?: number
  variant?: string
  experiment?: string
}

interface RealtimeActivityProps {
  recentEvents?: Array<{
    id: string
    experiment_id?: string
    visitor_id: string
    event_type: string
    event_name: string
    value?: number
    created_at: string
  }>
  recentAssignments?: Array<{
    id: string
    experiment_id: string
    variant_id: string
    visitor_id: string
    created_at: string
  }>
  isConnected: boolean
  className?: string
}

export function RealtimeActivity({
  recentEvents = [],
  recentAssignments = [],
  isConnected,
  className
}: RealtimeActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    // Combinar eventos recentes e atribuições em uma única lista de atividades
    const eventActivities: ActivityItem[] = recentEvents.map(event => ({
      id: event.id,
      type: event.event_type === 'conversion' ? 'conversion' : 'event',
      timestamp: event.created_at,
      title: event.event_type === 'conversion' ? 'Nova conversão' : 'Novo evento',
      subtitle: `${event.event_name}${event.experiment_id ? ` • Experimento ${event.experiment_id.substring(0, 8)}` : ''}`,
      value: event.value,
      experiment: event.experiment_id
    }))

    const assignmentActivities: ActivityItem[] = recentAssignments.map(assignment => ({
      id: assignment.id,
      type: 'assignment',
      timestamp: assignment.created_at,
      title: 'Novo visitante',
      subtitle: `Atribuído à variante ${assignment.variant_id.substring(0, 8)}`,
      experiment: assignment.experiment_id,
      variant: assignment.variant_id
    }))

    // Combinar e ordenar por timestamp (mais recentes primeiro)
    const combined = [...eventActivities, ...assignmentActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20) // Mostrar apenas os 20 mais recentes

    setActivities(combined)
  }, [recentEvents, recentAssignments])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'conversion':
        return <Target className="h-4 w-4 text-green-600" />
      case 'assignment':
        return <Users className="h-4 w-4 text-blue-600" />
      case 'event':
        return <Activity className="h-4 w-4 text-purple-600" />
      default:
        return <Zap className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'conversion':
        return 'bg-green-50 border-green-200'
      case 'assignment':
        return 'bg-blue-50 border-blue-200'
      case 'event':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMinutes < 1) return 'agora mesmo'
    if (diffMinutes < 60) return `há ${diffMinutes} min`
    if (diffHours < 24) return `há ${diffHours}h`
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <Card className={cn('h-fit', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade em Tempo Real
            </CardTitle>
            <CardDescription>
              Eventos e visitantes ao vivo
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              )}
              title={isConnected ? 'Conectado' : 'Desconectado'}
            />
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Conectado' : 'Offline'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma atividade recente</p>
            <p className="text-sm">Os eventos aparecerão aqui em tempo real</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={cn(
                  'p-3 rounded-lg border transition-all duration-300',
                  getActivityColor(activity.type),
                  'animate-in fade-in-0 slide-in-from-right-2'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                        {activity.value && (
                          <span className="ml-1 text-green-700 font-semibold">
                            R$ {activity.value.toFixed(2)}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>

                    {activity.subtitle && (
                      <p className="text-xs text-gray-600 mt-1">
                        {activity.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}