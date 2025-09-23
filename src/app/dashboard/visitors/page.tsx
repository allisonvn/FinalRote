"use client"

import { useEffect, useMemo, useState } from 'react'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkline } from '@/components/sparkline'
import { cn } from '@/lib/utils'
import { getVisitorTrends } from '@/lib/analytics'
import { useApp } from '@/providers/app-provider'
import { Calendar, Download, Filter, Search } from 'lucide-react'

interface TrendItem {
  date: string
  control_rate: number
  variant_a_rate: number
  variant_b_rate: number
  total_visitors: number
}

export default function VisitorsPage() {
  const [trends, setTrends] = useState<TrendItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const { preferences } = useApp()
  const [timeRange, setTimeRange] = useState<'7d'|'30d'|'90d'>(preferences.defaultTimeRange || '30d')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await getVisitorTrends(timeRange)
        setTrends(data as any)
      } catch (e) {
        console.error('Erro ao carregar visitantes', e)
        setTrends([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [timeRange])

  useEffect(() => {
    setTimeRange(preferences.defaultTimeRange || '30d')
  }, [preferences.defaultTimeRange])

  const totals = useMemo(() => {
    const totalVisitors = trends.reduce((s, d) => s + (d.total_visitors || 0), 0)
    const avgControl = trends.length ? trends.reduce((s, d) => s + d.control_rate, 0) / trends.length : 0
    const avgA = trends.length ? trends.reduce((s, d) => s + d.variant_a_rate, 0) / trends.length : 0
    const avgB = trends.length ? trends.reduce((s, d) => s + d.variant_b_rate, 0) / trends.length : 0
    const bestAvg = Math.max(avgControl, avgA, avgB)
    const base = avgControl || Math.max(1, avgA * 0.8) // fallback
    const uplift = base > 0 ? ((bestAvg - base) / base) * 100 : 0
    return {
      totalVisitors,
      avgConversion: (avgControl + avgA + avgB) / 3,
      uplift
    }
  }, [trends])

  const filtered = useMemo(() => {
    if (!query) return trends
    return trends.filter(t => t.date.includes(query))
  }, [trends, query])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visitantes</h1>
          <p className="text-muted-foreground">Tendências e qualidade do tráfego</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
            <Input placeholder="Filtrar por data (YYYY-MM-DD)" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 w-72" />
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" strokeWidth={1.75} />Período</Button>
          <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" strokeWidth={1.75} />Filtros</Button>
          <Button className="bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90 gap-2"><Download className="h-4 w-4" strokeWidth={1.75} />Exportar</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Visitantes (30d)" value={totals.totalVisitors.toLocaleString('pt-BR')} change={Math.round((filtered.at(-1)?.total_visitors || 0) - (filtered[0]?.total_visitors || 0))} changeType="absolute" trend={((filtered.at(-1)?.total_visitors || 0) - (filtered[0]?.total_visitors || 0)) >= 0 ? 'up' : 'down'} subtitle="Soma diária (estimativa)" color="primary" />
        <KpiCard title="Conversão média" value={`${(totals.avgConversion || 0).toFixed(1)}%`} change={Number((totals.uplift || 0).toFixed(1))} changeType="percentage" trend={totals.uplift >= 0 ? 'up' : 'down'} subtitle="Controle x Variantes" color="success" />
        <KpiCard title="Dias com tráfego" value={trends.length} subtitle="Últimos 30 dias" color="info" />
      </div>

      {/* Trends Card */}
      <Card className="card-glass">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="font-medium text-muted-foreground">Tendência de visitantes</div>
            <div className="text-sm text-muted-foreground">{trends.length} pontos</div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[720px] grid grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr] gap-2 text-xs font-medium text-muted-foreground px-2">
              <div>Data</div>
              <div>Conv. Controle</div>
              <div>Conv. Var. A</div>
              <div>Conv. Var. B</div>
              <div className="text-right">Visitantes</div>
            </div>
            <div className="min-w-[720px] divide-y">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr] gap-2 px-2 py-3 animate-pulse">
                    <div className="h-4 bg-muted rounded w-28" />
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-4 bg-muted rounded w-24 ml-auto" />
                  </div>
                ))
              ) : (
                filtered.map((row) => (
                  <div key={row.date} className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr] gap-2 px-2 py-3 items-center">
                    <div className="font-medium">{new Date(row.date).toLocaleDateString('pt-BR')}</div>
                    <div className="text-foreground/90">{row.control_rate.toFixed(1)}%</div>
                    <div className="text-success">{row.variant_a_rate.toFixed(1)}%</div>
                    <div className="text-info">{row.variant_b_rate.toFixed(1)}%</div>
                    <div className="ml-auto font-semibold">{row.total_visitors.toLocaleString('pt-BR')}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Sparkline overall */}
      {trends.length > 0 && (
        <Card className="card-glass">
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-muted-foreground">Visão Geral (Sparkline)</div>
            <div className="ml-auto text-muted-foreground">Total visitantes</div>
            <Sparkline data={trends.map(t => t.total_visitors)} width={320} height={56} />
          </div>
        </Card>
      )}
    </div>
  )
}
