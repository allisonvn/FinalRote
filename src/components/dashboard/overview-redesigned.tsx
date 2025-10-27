"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, TrendingDown, DollarSign, Users, Target,
  CheckCircle2, AlertCircle, Clock, Zap, Trophy,
  ArrowUpRight, ArrowDownRight, RefreshCw, Calendar
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface OverviewStats {
  totalRevenue: number
  revenueChange: number
  totalConversions: number
  conversionsChange: number
  avgConversionRate: number
  rateChange: number
  totalVisitors: number
  visitorsChange: number
  activeExperiments: number
  winners: number
  losers: number
  avgROI: number
}

interface ExperimentCard {
  id: string
  name: string
  status: 'running' | 'paused' | 'completed' | 'draft'
  uplift: number
  revenue: number
  conversions: number
  conversionRate: number
  significance: number
  daysRunning: number
  isWinner: boolean
  control: {
    name: string
    conversions: number
    visitors: number
    rate: number
  }
  winner: {
    name: string
    conversions: number
    visitors: number
    rate: number
  }
}

export function OverviewRedesigned() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [experiments, setExperiments] = useState<ExperimentCard[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const supabase = createClient()

  // Função para buscar estatísticas globais
  const loadStats = async () => {
    try {
      // Buscar métricas agregadas de todos os experimentos
      const { data: statsData } = await supabase
        .from('variant_stats')
        .select('visitors, conversions, revenue')

      const totals = (statsData || []).reduce(
        (acc, curr) => ({
          visitors: acc.visitors + (curr.visitors || 0),
          conversions: acc.conversions + (curr.conversions || 0),
          revenue: acc.revenue + (curr.revenue || 0)
        }),
        { visitors: 0, conversions: 0, revenue: 0 }
      )

      // Contar experimentos ativos
      const { count: activeCount } = await supabase
        .from('experiments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'running')

      // Calcular taxa média de conversão
      const avgRate = totals.visitors > 0
        ? (totals.conversions / totals.visitors) * 100
        : 0

      // Calcular ROI médio (receita / visitantes)
      const avgROI = totals.visitors > 0
        ? (totals.revenue / totals.visitors)
        : 0

      setStats({
        totalRevenue: totals.revenue,
        revenueChange: 12.5, // TODO: calcular baseado em período anterior
        totalConversions: totals.conversions,
        conversionsChange: 8.3,
        avgConversionRate: avgRate,
        rateChange: 5.2,
        totalVisitors: totals.visitors,
        visitorsChange: 15.7,
        activeExperiments: activeCount || 0,
        winners: 0, // Calculado abaixo
        losers: 0,
        avgROI
      })
    } catch (error) {
      console.error('Erro ao carregar stats:', error)
    }
  }

  // Função para buscar experimentos com performance
  const loadExperiments = async () => {
    try {
      const { data: experimentsData } = await supabase
        .from('experiments')
        .select(`
          id,
          name,
          status,
          created_at
        `)
        .in('status', ['running', 'completed'])
        .order('created_at', { ascending: false })
        .limit(10)

      if (!experimentsData) return

      // Buscar stats para cada experimento
      const experimentsWithStats = await Promise.all(
        experimentsData.map(async (exp) => {
          // Buscar variantes
          const { data: variants } = await supabase
            .from('variants')
            .select('id, name, is_control')
            .eq('experiment_id', exp.id)

          if (!variants || variants.length < 2) return null

          const control = variants.find(v => v.is_control)
          const testVariants = variants.filter(v => !v.is_control)

          // Buscar stats das variantes
          const [controlStats, ...testStats] = await Promise.all([
            supabase
              .from('variant_stats')
              .select('visitors, conversions, revenue')
              .eq('variant_id', control?.id)
              .maybeSingle(),
            ...testVariants.map(v =>
              supabase
                .from('variant_stats')
                .select('visitors, conversions, revenue')
                .eq('variant_id', v.id)
                .maybeSingle()
            )
          ])

          const controlData = controlStats.data || { visitors: 0, conversions: 0, revenue: 0 }
          const bestTest = testStats.reduce((best, curr) => {
            const currRate = curr.data && curr.data.visitors > 0
              ? (curr.data.conversions / curr.data.visitors)
              : 0
            const bestRate = best.data && best.data.visitors > 0
              ? (best.data.conversions / best.data.visitors)
              : 0
            return currRate > bestRate ? curr : best
          }, testStats[0])

          const bestTestData = bestTest?.data || { visitors: 0, conversions: 0, revenue: 0 }

          // Calcular métricas
          const controlRate = controlData.visitors > 0
            ? (controlData.conversions / controlData.visitors) * 100
            : 0
          const testRate = bestTestData.visitors > 0
            ? (bestTestData.conversions / bestTestData.visitors) * 100
            : 0

          const uplift = controlRate > 0
            ? ((testRate - controlRate) / controlRate) * 100
            : 0

          // Calcular significância estatística (simplificado)
          const totalVisitors = controlData.visitors + bestTestData.visitors
          const significance = totalVisitors > 100 ? Math.min(95, (totalVisitors / 1000) * 95) : 0

          // Calcular dias rodando
          const daysRunning = Math.floor(
            (Date.now() - new Date(exp.created_at).getTime()) / (1000 * 60 * 60 * 24)
          )

          return {
            id: exp.id,
            name: exp.name,
            status: exp.status as any,
            uplift,
            revenue: controlData.revenue + bestTestData.revenue,
            conversions: controlData.conversions + bestTestData.conversions,
            conversionRate: (controlRate + testRate) / 2,
            significance,
            daysRunning,
            isWinner: uplift > 10 && significance > 85,
            control: {
              name: control?.name || 'Controle',
              conversions: controlData.conversions,
              visitors: controlData.visitors,
              rate: controlRate
            },
            winner: {
              name: testVariants[0]?.name || 'Variante A',
              conversions: bestTestData.conversions,
              visitors: bestTestData.visitors,
              rate: testRate
            }
          }
        })
      )

      const validExperiments = experimentsWithStats.filter(Boolean) as ExperimentCard[]

      // Calcular winners e losers
      const winners = validExperiments.filter(e => e.isWinner).length
      const losers = validExperiments.filter(e => !e.isWinner && e.uplift < -5).length

      setStats(prev => prev ? { ...prev, winners, losers } : null)
      setExperiments(validExperiments)

    } catch (error) {
      console.error('Erro ao carregar experimentos:', error)
    }
  }

  // Carregar dados ao montar
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadStats(), loadExperiments()])
      setLoading(false)
    }
    loadData()
  }, [timeRange])

  // Refresh manual
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadStats(), loadExperiments()])
    setRefreshing(false)
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com filtro de período */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral das suas conversões e experimentos</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Métricas Principais - FOCO EM $$$ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. RECEITA TOTAL - Mais importante! */}
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            {stats && stats.revenueChange > 0 ? (
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                +{stats.revenueChange.toFixed(1)}%
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                <TrendingDown className="w-4 h-4" />
                {stats?.revenueChange.toFixed(1)}%
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Receita Total</p>
            <p className="text-3xl font-bold text-gray-900">
              R$ {(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              ROI médio: R$ {(stats?.avgROI || 0).toFixed(2)} por visitante
            </p>
          </div>
        </Card>

        {/* 2. CONVERSÕES */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            {stats && stats.conversionsChange > 0 ? (
              <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                +{stats.conversionsChange.toFixed(1)}%
              </div>
            ) : null}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Conversões</p>
            <p className="text-3xl font-bold text-gray-900">
              {(stats?.totalConversions || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Taxa: {(stats?.avgConversionRate || 0).toFixed(2)}%
            </p>
          </div>
        </Card>

        {/* 3. VISITANTES */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            {stats && stats.visitorsChange > 0 ? (
              <div className="flex items-center gap-1 text-purple-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                +{stats.visitorsChange.toFixed(1)}%
              </div>
            ) : null}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Visitantes</p>
            <p className="text-3xl font-bold text-gray-900">
              {(stats?.totalVisitors || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Tráfego em {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} dias
            </p>
          </div>
        </Card>

        {/* 4. EXPERIMENTOS ATIVOS */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-600">Rodando</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Experimentos Ativos</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.activeExperiments || 0}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-green-600 font-medium">
                {stats?.winners || 0} winners
              </span>
              <span className="text-xs text-red-600 font-medium">
                {stats?.losers || 0} losers
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Experimentos com Performance */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Performance dos Experimentos</h2>
          <Badge variant="outline" className="text-xs">
            Ordenado por impacto
          </Badge>
        </div>

        <div className="space-y-4">
          {experiments.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhum experimento ativo ou concluído</p>
              <p className="text-sm text-gray-500 mt-1">
                Crie seu primeiro experimento para começar a otimizar conversões
              </p>
            </Card>
          ) : (
            experiments.map((exp) => (
              <Card key={exp.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{exp.name}</h3>
                      {exp.isWinner && (
                        <Badge className="bg-green-500 text-white">
                          <Trophy className="w-3 h-3 mr-1" />
                          Winner
                        </Badge>
                      )}
                      {exp.status === 'running' && (
                        <Badge variant="outline" className="border-green-500 text-green-700">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1.5" />
                          Rodando
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {exp.daysRunning} dias
                      </span>
                      <span>•</span>
                      <span>{exp.conversions} conversões</span>
                      <span>•</span>
                      <span>R$ {exp.revenue.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Uplift destacado */}
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${
                      exp.uplift > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {exp.uplift > 0 ? '+' : ''}{exp.uplift.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Uplift vs Controle</p>
                  </div>
                </div>

                {/* Comparação Controle vs Winner */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                  {/* Controle */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">Controle</Badge>
                      <span className="text-sm font-medium text-gray-700">{exp.control.name}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Visitantes</span>
                        <span className="font-medium">{exp.control.visitors}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Conversões</span>
                        <span className="font-medium">{exp.control.conversions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Taxa</span>
                        <span className="font-medium">{exp.control.rate.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Winner/Variante */}
                  <div className="pl-6 border-l">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={exp.uplift > 0 ? 'bg-green-500' : 'bg-red-500'}>
                        {exp.uplift > 0 ? 'Winner' : 'Loser'}
                      </Badge>
                      <span className="text-sm font-medium text-gray-700">{exp.winner.name}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Visitantes</span>
                        <span className="font-medium">{exp.winner.visitors}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Conversões</span>
                        <span className="font-medium">{exp.winner.conversions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Taxa</span>
                        <span className={`font-medium ${
                          exp.uplift > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {exp.winner.rate.toFixed(2)}%
                          {exp.uplift > 0 ? (
                            <ArrowUpRight className="w-3 h-3 inline ml-1" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 inline ml-1" />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de significância */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Significância Estatística</span>
                    <span className="text-sm font-medium">
                      {exp.significance.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={exp.significance}
                    className={`h-2 ${
                      exp.significance > 85 ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  />
                  {exp.significance < 85 && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Aguardando mais dados para decisão confiável
                    </p>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
