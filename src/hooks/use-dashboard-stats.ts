"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DashboardStats {
  totalExperiments: number
  activeExperiments: number
  completedExperiments: number
  avgConversionRate: number
  totalRevenue: number
  avgImprovement: number
  uniqueVisitors: number
  totalEvents: number
  totalConversions: number
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalExperiments: 0,
    activeExperiments: 0,
    completedExperiments: 0,
    avgConversionRate: 0,
    totalRevenue: 0,
    avgImprovement: 0,
    uniqueVisitors: 0,
    totalEvents: 0,
    totalConversions: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const supabase = createClient()

        // Verificar se o cliente foi criado corretamente
        if (!supabase || typeof supabase.from !== 'function') {
          throw new Error('Cliente Supabase não foi inicializado corretamente')
        }

        // Buscar estatísticas dos experimentos
        const { data: experimentStats, error: expError } = await supabase
          .from('experiments')
          .select('id, name, status, created_at')

        if (expError) {
          console.error('Erro ao buscar experimentos:', expError)
          // Não fazer throw, continuar com dados vazios
        }

        // Buscar estatísticas dos eventos
        const { data: eventStats, error: eventError } = await supabase
          .from('events')
          .select('visitor_id, event_type, value, experiment_id')

        if (eventError) {
          console.error('Erro ao buscar eventos:', eventError)
          // Não fazer throw, continuar com dados vazios
        }

        // Calcular métricas dos experimentos (com fallback para dados vazios)
        const totalExperiments = experimentStats?.length || 0
        const activeExperiments = experimentStats?.filter(e => e.status === 'running').length || 0
        const completedExperiments = experimentStats?.filter(e => e.status === 'completed').length || 0

        // Calcular métricas dos eventos (com fallback para dados vazios)
        const uniqueVisitors = eventStats ? new Set(eventStats.map(e => e.visitor_id)).size : 0
        const totalEvents = eventStats?.length || 0
        const totalConversions = eventStats?.filter(e => e.event_type === 'conversion').length || 0
        const totalRevenue = eventStats
          ?.filter(e => e.event_type === 'conversion')
          .reduce((sum, e) => sum + (parseFloat(e.value?.toString()) || 0), 0) || 0

        // Calcular taxa de conversão média
        const avgConversionRate = uniqueVisitors > 0 ? (totalConversions / uniqueVisitors) * 100 : 0

        // Calcular melhoria média (simulado por enquanto)
        const avgImprovement = totalExperiments > 0 ? 20 : 0

        setStats({
          totalExperiments,
          activeExperiments,
          completedExperiments,
          avgConversionRate,
          totalRevenue,
          avgImprovement,
          uniqueVisitors,
          totalEvents,
          totalConversions
        })

      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        
        // Definir valores padrão em caso de erro
        setStats({
          totalExperiments: 0,
          activeExperiments: 0,
          completedExperiments: 0,
          avgConversionRate: 0,
          totalRevenue: 0,
          avgImprovement: 0,
          uniqueVisitors: 0,
          totalEvents: 0,
          totalConversions: 0
        })
      } finally {
        setLoading(false)
      }
    }

    // Só executar se estiver no browser
    if (typeof window !== 'undefined') {
      fetchStats()

      // Atualizar a cada 30 segundos
      const interval = setInterval(fetchStats, 30000)
      return () => clearInterval(interval)
    }
  }, [])

  return { stats, loading, error, refetch: () => setLoading(true) }
}
