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

        // Inicializar variáveis para evitar erros de referência
        let experimentStats = null
        let eventStats = null

        // Verificar se o cliente foi criado corretamente
        if (supabase && typeof supabase.from === 'function') {
          // Buscar estatísticas dos experimentos
          const { data, error: expError } = await supabase
            .from('experiments')
            .select('id, name, status, created_at')

          experimentStats = data

          if (expError) {
            console.error('Erro ao buscar experimentos:', expError?.message || expError)
            // Não fazer throw, continuar com dados vazios
          }

          // Buscar estatísticas dos eventos
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('visitor_id, event_type, value, experiment_id')

          eventStats = eventData

          if (eventError) {
            console.error('Erro ao buscar eventos:', eventError?.message || eventError)
            // Não fazer throw, continuar com dados vazios
          }
        } else {
          console.warn('Cliente Supabase não foi inicializado corretamente')
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

        // Buscar métricas de variant_stats para calcular melhoria média real
        let avgImprovement = 0
        if (totalExperiments > 0 && supabase && typeof supabase.from === 'function') {
          try {
            const { data: variantStats } = await supabase
              .from('variant_stats')
              .select('experiment_id, visitors, conversions, revenue')
            
            if (variantStats && variantStats.length > 0) {
              // Agrupar por experimento
              const experimentGroups = variantStats.reduce((acc, stat) => {
                if (!acc[stat.experiment_id]) {
                  acc[stat.experiment_id] = []
                }
                acc[stat.experiment_id].push(stat)
                return acc
              }, {} as Record<string, any[]>)

              // Calcular melhoria para cada experimento
              const improvements = Object.values(experimentGroups).map(group => {
                if (group.length < 2) return 0
                
                // Ordenar por taxa de conversão
                const sorted = group.sort((a, b) => {
                  const rateA = a.visitors > 0 ? (a.conversions / a.visitors) : 0
                  const rateB = b.visitors > 0 ? (b.conversions / b.visitors) : 0
                  return rateB - rateA
                })

                const best = sorted[0]
                const baseline = sorted[sorted.length - 1]
                
                const rateBaseline = baseline.visitors > 0 ? (baseline.conversions / baseline.visitors) : 0
                const rateBest = best.visitors > 0 ? (best.conversions / best.visitors) : 0
                
                return rateBaseline > 0 ? ((rateBest - rateBaseline) / rateBaseline) * 100 : 0
              })

              // Calcular média
              const validImprovements = improvements.filter(i => !isNaN(i) && isFinite(i))
              avgImprovement = validImprovements.length > 0 
                ? validImprovements.reduce((sum, i) => sum + Math.abs(i), 0) / validImprovements.length 
                : 0
            } else {
              // Fallback: calcular baseado nos eventos
              avgImprovement = totalEvents > 0 ? (totalConversions / totalEvents) * 100 : 0
            }
          } catch (err) {
            console.error('Erro ao calcular melhoria média:', err)
            avgImprovement = 0
          }
        }

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
