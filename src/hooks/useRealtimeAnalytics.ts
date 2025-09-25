import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDashboardStats, getExperimentMetrics, DashboardStats, ExperimentMetrics } from '@/lib/analytics'

export interface RealtimeEvent {
  id: string
  experiment_id?: string
  visitor_id: string
  event_type: string
  event_name: string
  value?: number
  created_at: string
}

export interface RealtimeAssignment {
  id: string
  experiment_id: string
  variant_id: string
  visitor_id: string
  created_at: string
}

export function useRealtimeAnalytics(timeRange: '7d'|'30d'|'90d'|'1y' = '30d') {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [metrics, setMetrics] = useState<ExperimentMetrics[]>([])
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([])
  const [recentAssignments, setRecentAssignments] = useState<RealtimeAssignment[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const supabase = createClient()

  // Função para recarregar dados
  const refreshData = async () => {
    try {
      const [newStats, newMetrics] = await Promise.all([
        getDashboardStats(timeRange),
        getExperimentMetrics(timeRange)
      ])

      setStats(newStats)
      setMetrics(newMetrics)
      setLastUpdate(new Date())

      console.log('📊 Analytics data refreshed:', {
        stats: newStats,
        metricsCount: newMetrics.length
      })
    } catch (error) {
      console.error('Erro ao recarregar dados analytics:', error)
    }
  }

  useEffect(() => {
    // Carregar dados iniciais
    refreshData()

    // Configurar subscriptions para atualizações em tempo real
    console.log('🔄 Configurando subscriptions em tempo real...')

    // Subscription para novos eventos
    const eventsChannel = supabase
      .channel('realtime-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('📈 Novo evento recebido:', payload.new)
          const newEvent = payload.new as RealtimeEvent

          // Adicionar à lista de eventos recentes (máximo 50)
          setRecentEvents(prev => {
            const updated = [newEvent, ...prev].slice(0, 50)
            return updated
          })

          // Recarregar stats quando há conversão
          if (newEvent.event_type === 'conversion') {
            console.log('💰 Conversão detectada - atualizando stats')
            setTimeout(refreshData, 1000) // Delay para DB processar
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assignments'
        },
        (payload) => {
          console.log('🎯 Nova atribuição recebida:', payload.new)
          const newAssignment = payload.new as RealtimeAssignment

          // Adicionar à lista de atribuições recentes (máximo 50)
          setRecentAssignments(prev => {
            const updated = [newAssignment, ...prev].slice(0, 50)
            return updated
          })

          // Recarregar métricas
          setTimeout(refreshData, 1000)
        }
      )
      .subscribe((status) => {
        console.log('🔔 Status da subscription:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Auto-refresh a cada 30 segundos
    const intervalId = setInterval(refreshData, 30000)

    // Cleanup
    return () => {
      console.log('🔌 Desconectando subscriptions...')
      supabase.removeChannel(eventsChannel)
      clearInterval(intervalId)
      setIsConnected(false)
    }
  }, [timeRange])

  return {
    stats,
    metrics,
    recentEvents,
    recentAssignments,
    isConnected,
    lastUpdate,
    refreshData
  }
}

export function useExperimentRealtime(experimentId: string) {
  const [visitors, setVisitors] = useState(0)
  const [conversions, setConversions] = useState(0)
  const [conversionRate, setConversionRate] = useState(0)
  const [recentActivity, setRecentActivity] = useState<Array<{
    type: 'visitor' | 'conversion'
    timestamp: string
    variant?: string
    value?: number
  }>>([])

  const supabase = createClient()

  useEffect(() => {
    // Carregar dados iniciais
    const loadInitialData = async () => {
      try {
        // Buscar métricas atuais
        const { data: metrics } = await supabase
          .rpc('get_experiment_metrics', { exp_id: experimentId })

        if (metrics && metrics.length > 0) {
          const totalVisitors = metrics.reduce((sum: number, m: any) => sum + (m.visitors || 0), 0)
          const totalConversions = metrics.reduce((sum: number, m: any) => sum + (m.conversions || 0), 0)
          const rate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

          setVisitors(totalVisitors)
          setConversions(totalConversions)
          setConversionRate(rate)
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais do experimento:', error)
      }
    }

    loadInitialData()

    // Configurar subscription para este experimento específico
    const channel = supabase
      .channel(`experiment-${experimentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assignments',
          filter: `experiment_id=eq.${experimentId}`
        },
        (payload) => {
          console.log(`👥 Nova atribuição no experimento ${experimentId}:`, payload.new)

          setVisitors(prev => prev + 1)
          setRecentActivity(prev => [{
            type: 'visitor',
            timestamp: payload.new.created_at,
            variant: payload.new.variant_id
          }, ...prev].slice(0, 20))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `experiment_id=eq.${experimentId}`
        },
        (payload) => {
          const event = payload.new as any
          console.log(`📊 Novo evento no experimento ${experimentId}:`, event)

          if (event.event_type === 'conversion') {
            setConversions(prev => prev + 1)
            setConversionRate(prev => visitors > 0 ? ((conversions + 1) / visitors) * 100 : 0)

            setRecentActivity(prev => [{
              type: 'conversion',
              timestamp: event.created_at,
              value: event.value
            }, ...prev].slice(0, 20))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [experimentId])

  return {
    visitors,
    conversions,
    conversionRate,
    recentActivity
  }
}