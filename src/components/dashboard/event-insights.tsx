'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Award,
  AlertCircle,
  Clock,
  Target,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Event } from '@/hooks/useEvents'

interface EventInsightsProps {
  events: Event[]
}

export function EventInsights({ events }: EventInsightsProps) {
  // Calcular insights
  const insights = calculateInsights(events)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Performing Events */}
      <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Eventos Mais Frequentes</h3>
            <p className="text-sm text-slate-600">Top 5 eventos por volume</p>
          </div>
        </div>

        <div className="space-y-3">
          {insights.topEvents.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-slate-200"
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg font-bold text-white",
                index === 0 && "bg-gradient-to-br from-amber-500 to-orange-600",
                index === 1 && "bg-gradient-to-br from-slate-400 to-slate-500",
                index === 2 && "bg-gradient-to-br from-amber-600 to-amber-700",
                index > 2 && "bg-gradient-to-br from-slate-300 to-slate-400"
              )}>
                #{index + 1}
              </div>

              <div className="flex-1">
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-600">{item.type}</p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-slate-900">{item.count}</p>
                <p className="text-xs text-slate-600">eventos</p>
              </div>

              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    index === 0 && "bg-gradient-to-r from-amber-500 to-orange-600",
                    index === 1 && "bg-gradient-to-r from-slate-400 to-slate-500",
                    index === 2 && "bg-gradient-to-r from-amber-600 to-amber-700",
                    index > 2 && "bg-gradient-to-r from-slate-300 to-slate-400"
                  )}
                  style={{ width: `${(item.count / insights.topEvents[0].count) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Conversion Funnel */}
      <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Funil de Conversão</h3>
            <p className="text-sm text-slate-600">Jornada típica do usuário</p>
          </div>
        </div>

        <div className="space-y-4">
          {insights.funnel.map((step, index) => (
            <div key={index} className="relative">
              <div className={cn(
                "p-4 rounded-xl border-2 transition-all",
                step.dropoffRate > 50 && "bg-red-50 border-red-300",
                step.dropoffRate > 20 && step.dropoffRate <= 50 && "bg-yellow-50 border-yellow-300",
                step.dropoffRate <= 20 && "bg-green-50 border-green-300"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg font-bold text-white",
                      "bg-gradient-to-br from-blue-500 to-purple-600"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{step.stage}</p>
                      <p className="text-xs text-slate-600">{step.count} usuários</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {step.dropoffRate > 0 ? (
                        <>
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-bold text-red-600">
                            -{step.dropoffRate.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-green-600">
                          Início
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">dropoff</p>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${(step.count / insights.funnel[0].count) * 100}%` }}
                  />
                </div>
              </div>

              {index < insights.funnel.length - 1 && (
                <div className="flex justify-center my-2">
                  <ArrowDownRight className="w-5 h-5 text-slate-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Peak Activity Times */}
      <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Horários de Pico</h3>
            <p className="text-sm text-slate-600">Quando seus usuários são mais ativos</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {insights.peakHours.map((hour) => (
            <div
              key={hour.hour}
              className={cn(
                "p-3 rounded-xl border-2 text-center transition-all",
                hour.isPeak && "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 ring-2 ring-blue-200",
                !hour.isPeak && "bg-slate-50 border-slate-200"
              )}
            >
              <div className={cn(
                "text-lg font-black mb-1",
                hour.isPeak ? "text-blue-900" : "text-slate-700"
              )}>
                {hour.hour}h
              </div>
              <div className="text-xs text-slate-600 mb-2">{hour.count} eventos</div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    hour.isPeak && "bg-gradient-to-r from-blue-500 to-cyan-600",
                    !hour.isPeak && "bg-slate-400"
                  )}
                  style={{ width: `${(hour.count / insights.peakHours[0]?.count || 1) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Stats */}
      <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Métricas Rápidas</h3>
            <p className="text-sm text-slate-600">Resumo do desempenho</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <p className="text-sm font-semibold text-purple-700">Taxa de Conversão</p>
            </div>
            <p className="text-3xl font-black text-purple-900">
              {insights.conversionRate.toFixed(2)}%
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-700">Eventos/Visitante</p>
            </div>
            <p className="text-3xl font-black text-blue-900">
              {insights.eventsPerVisitor.toFixed(1)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-green-700">Tempo Médio</p>
            </div>
            <p className="text-3xl font-black text-green-900">
              {insights.avgSessionTime}m
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-700">Valor Médio</p>
            </div>
            <p className="text-3xl font-black text-amber-900">
              R$ {insights.avgConversionValue.toFixed(0)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Helper function to calculate insights
function calculateInsights(events: Event[]) {
  // Top events by count
  const eventCounts = events.reduce((acc, event) => {
    const key = event.event_name
    if (!acc[key]) {
      acc[key] = { count: 0, type: event.event_type }
    }
    acc[key].count++
    return acc
  }, {} as Record<string, { count: number; type: string }>)

  const topEvents = Object.entries(eventCounts)
    .map(([name, data]) => ({ name, count: data.count, type: data.type }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Conversion funnel (simplified)
  const pageViews = events.filter(e => e.event_type === 'page_view').length
  const clicks = events.filter(e => e.event_type === 'click').length
  const conversions = events.filter(e => e.event_type === 'conversion').length

  const funnel = [
    { stage: 'Visualizações', count: pageViews, dropoffRate: 0 },
    { stage: 'Cliques', count: clicks, dropoffRate: pageViews > 0 ? ((pageViews - clicks) / pageViews) * 100 : 0 },
    { stage: 'Conversões', count: conversions, dropoffRate: clicks > 0 ? ((clicks - conversions) / clicks) * 100 : 0 }
  ]

  // Peak hours
  const hourCounts = events.reduce((acc, event) => {
    const hour = new Date(event.created_at).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const maxCount = Math.max(...Object.values(hourCounts))
  const peakHours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourCounts[i] || 0,
    isPeak: hourCounts[i] >= maxCount * 0.7
  })).slice(0, 12) // Show 12 hours

  // Quick stats
  const uniqueVisitors = new Set(events.map(e => e.visitor_id)).size
  const conversionRate = pageViews > 0 ? (conversions / pageViews) * 100 : 0
  const eventsPerVisitor = uniqueVisitors > 0 ? events.length / uniqueVisitors : 0

  const sessionTimes = events.reduce((acc, event) => {
    const key = event.visitor_id
    if (!acc[key]) {
      acc[key] = { start: new Date(event.created_at).getTime(), end: new Date(event.created_at).getTime() }
    }
    acc[key].end = Math.max(acc[key].end, new Date(event.created_at).getTime())
    return acc
  }, {} as Record<string, { start: number; end: number }>)

  const avgSessionTime = Object.values(sessionTimes).reduce((sum, session) =>
    sum + (session.end - session.start) / 60000, 0
  ) / (Object.keys(sessionTimes).length || 1)

  const conversionEvents = events.filter(e => e.event_type === 'conversion' && e.value)
  const avgConversionValue = conversionEvents.length > 0
    ? conversionEvents.reduce((sum, e) => sum + (e.value || 0), 0) / conversionEvents.length
    : 0

  return {
    topEvents,
    funnel,
    peakHours,
    conversionRate,
    eventsPerVisitor,
    avgSessionTime: avgSessionTime.toFixed(1),
    avgConversionValue
  }
}
