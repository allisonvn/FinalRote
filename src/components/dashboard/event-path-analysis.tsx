'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  ArrowRight,
  Target,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointer,
  Activity,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Event } from '@/hooks/useEvents'

interface PathAnalysisProps {
  events: Event[]
}

interface EventPath {
  path: string[]
  count: number
  conversions: number
  conversionRate: number
  avgValue: number
}

export function EventPathAnalysis({ events }: PathAnalysisProps) {
  const pathAnalysis = useMemo(() => {
    // Group events by visitor to create paths
    const visitorPaths: Record<string, Event[]> = {}

    events.forEach(event => {
      if (!visitorPaths[event.visitor_id]) {
        visitorPaths[event.visitor_id] = []
      }
      visitorPaths[event.visitor_id].push(event)
    })

    // Sort events by timestamp for each visitor
    Object.keys(visitorPaths).forEach(visitorId => {
      visitorPaths[visitorId].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })

    // Build paths (sequences of event types)
    const pathCounts: Record<string, EventPath> = {}

    Object.values(visitorPaths).forEach(visitorEvents => {
      if (visitorEvents.length === 0) return

      // Take first 5 events to avoid super long paths
      const eventSequence = visitorEvents.slice(0, 5).map(e => e.event_type)
      const pathKey = eventSequence.join(' → ')

      const hasConversion = visitorEvents.some(e => e.event_type === 'conversion')
      const conversionValue = visitorEvents
        .filter(e => e.event_type === 'conversion')
        .reduce((sum, e) => sum + (e.value || 0), 0)

      if (!pathCounts[pathKey]) {
        pathCounts[pathKey] = {
          path: eventSequence,
          count: 0,
          conversions: 0,
          conversionRate: 0,
          avgValue: 0
        }
      }

      pathCounts[pathKey].count++
      if (hasConversion) {
        pathCounts[pathKey].conversions++
        pathCounts[pathKey].avgValue += conversionValue
      }
    })

    // Calculate conversion rates and avg values
    Object.values(pathCounts).forEach(path => {
      path.conversionRate = (path.conversions / path.count) * 100
      path.avgValue = path.conversions > 0 ? path.avgValue / path.conversions : 0
    })

    // Get top paths by volume
    const topPaths = Object.values(pathCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get top converting paths
    const topConvertingPaths = Object.values(pathCounts)
      .filter(p => p.count >= 3) // Min 3 occurrences
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5)

    // Overall stats
    const totalPaths = Object.keys(visitorPaths).length
    const pathsWithConversion = Object.values(visitorPaths)
      .filter(p => p.some(e => e.event_type === 'conversion')).length
    const overallConversionRate = totalPaths > 0
      ? (pathsWithConversion / totalPaths) * 100
      : 0

    return {
      topPaths,
      topConvertingPaths,
      totalPaths,
      overallConversionRate
    }
  }, [events])

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return <Eye className="h-3.5 w-3.5" />
      case 'click':
        return <MousePointer className="h-3.5 w-3.5" />
      case 'conversion':
        return <Target className="h-3.5 w-3.5" />
      default:
        return <Activity className="h-3.5 w-3.5" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'click':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'conversion':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300'
    }
  }

  if (pathAnalysis.totalPaths === 0) {
    return (
      <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-16 text-center">
        <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Sem dados suficientes</h3>
        <p className="text-slate-600">Aguarde mais eventos para análise de caminhos</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overview Stats */}
      <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-xl p-6 lg:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">Path Analysis</h3>
            <p className="text-sm text-slate-600">Análise de jornadas dos usuários até a conversão</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-purple-200">
            <p className="text-sm font-semibold text-purple-700 mb-1">Total de Jornadas</p>
            <p className="text-3xl font-black text-purple-900">{pathAnalysis.totalPaths}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-green-200">
            <p className="text-sm font-semibold text-green-700 mb-1">Taxa de Conversão Geral</p>
            <p className="text-3xl font-black text-green-900">
              {pathAnalysis.overallConversionRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Top Paths by Volume */}
      <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">Caminhos Mais Comuns</h4>
            <p className="text-xs text-slate-600">Por volume de usuários</p>
          </div>
        </div>

        <div className="space-y-4">
          {pathAnalysis.topPaths.map((pathData, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center p-0 text-xs font-bold",
                    index === 0 && "bg-gradient-to-br from-amber-500 to-orange-600",
                    index === 1 && "bg-gradient-to-br from-slate-400 to-slate-500",
                    index === 2 && "bg-gradient-to-br from-amber-600 to-amber-700",
                    index > 2 && "bg-gradient-to-br from-slate-300 to-slate-400"
                  )}>
                    {index + 1}
                  </Badge>
                  <span className="text-sm font-semibold text-slate-700">{pathData.count} usuários</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {pathData.conversions > 0 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-bold text-green-700">
                        {pathData.conversionRate.toFixed(0)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-bold text-red-700">0%</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap p-3 bg-slate-50 rounded-lg border-2 border-slate-200">
                {pathData.path.map((eventType, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <Badge className={cn("text-xs font-semibold border-2", getEventColor(eventType))}>
                      {getEventIcon(eventType)}
                      <span className="ml-1">{eventType}</span>
                    </Badge>
                    {idx < pathData.path.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Converting Paths */}
      <Card className="backdrop-blur-xl bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">Caminhos com Maior Conversão</h4>
            <p className="text-xs text-slate-600">Melhores taxas de conversão</p>
          </div>
        </div>

        <div className="space-y-4">
          {pathAnalysis.topConvertingPaths.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Sem conversões ainda</p>
          ) : (
            pathAnalysis.topConvertingPaths.map((pathData, index) => (
              <div key={index} className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">
                      {pathData.conversionRate.toFixed(1)}% conversão
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {pathData.count} usuários
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  {pathData.path.map((eventType, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <Badge className={cn("text-xs font-semibold border-2", getEventColor(eventType))}>
                        {getEventIcon(eventType)}
                        <span className="ml-1">{eventType}</span>
                      </Badge>
                      {idx < pathData.path.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      )}
                    </div>
                  ))}
                </div>

                <Progress value={pathData.conversionRate} className="h-2" />

                {pathData.avgValue > 0 && (
                  <p className="text-xs text-green-700 mt-2 font-bold">
                    Valor médio: R$ {pathData.avgValue.toFixed(2)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
