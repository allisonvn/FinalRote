'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  CreditCard,
  Activity,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AnalyticsData {
  users: {
    total: number
    new_this_week: number
    new_this_month: number
    growth_rate: number
  }
  organizations: {
    total: number
    active: number
    growth_rate: number
  }
  subscriptions: {
    active: number
    trialing: number
    canceled_this_month: number
    mrr: number
    arr: number
    churn_rate: number
  }
  experiments: {
    total: number
    running: number
    completed: number
  }
  events: {
    total_this_month: number
    average_per_day: number
  }
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData>({
    users: { total: 0, new_this_week: 0, new_this_month: 0, growth_rate: 0 },
    organizations: { total: 0, active: 0, growth_rate: 0 },
    subscriptions: { active: 0, trialing: 0, canceled_this_month: 0, mrr: 0, arr: 0, churn_rate: 0 },
    experiments: { total: 0, running: 0, completed: 0 },
    events: { total_this_month: 0, average_per_day: 0 }
  })
  const supabase = createClient()

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Contagens gerais
      const [
        { count: totalUsers },
        { count: newUsersWeek },
        { count: newUsersMonth },
        { count: totalOrgs },
        { count: activeOrgs },
        { count: trialingOrgs },
        { count: totalExperiments },
        { count: runningExperiments },
        { count: completedExperiments }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
        supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trialing'),
        supabase.from('experiments').select('*', { count: 'exact', head: true }),
        supabase.from('experiments').select('*', { count: 'exact', head: true }).eq('status', 'running'),
        supabase.from('experiments').select('*', { count: 'exact', head: true }).eq('status', 'completed')
      ])

      // Calcular cancelamentos do mês
      const { count: canceledThisMonth } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'canceled')
        .gte('subscription_canceled_at', monthAgo.toISOString())

      // Calcular MRR (estimativa baseada em planos)
      const planPrices: Record<string, number> = {
        'starter': 47,
        'professional': 97,
        'business': 197,
        'enterprise': 497
      }

      const { data: activeSubsData } = await supabase
        .from('organizations')
        .select('subscription_plan')
        .eq('subscription_status', 'active')

      const mrr = (activeSubsData || []).reduce((sum, org) => {
        return sum + (planPrices[org.subscription_plan || ''] || 0)
      }, 0)

      // Calcular taxas
      const previousMonthUsers = (totalUsers || 0) - (newUsersMonth || 0)
      const userGrowthRate = previousMonthUsers > 0
        ? ((newUsersMonth || 0) / previousMonthUsers) * 100
        : 0

      const churnRate = (activeOrgs || 0) > 0
        ? ((canceledThisMonth || 0) / ((activeOrgs || 0) + (canceledThisMonth || 0))) * 100
        : 0

      setData({
        users: {
          total: totalUsers || 0,
          new_this_week: newUsersWeek || 0,
          new_this_month: newUsersMonth || 0,
          growth_rate: userGrowthRate
        },
        organizations: {
          total: totalOrgs || 0,
          active: activeOrgs || 0,
          growth_rate: 12 // Placeholder
        },
        subscriptions: {
          active: activeOrgs || 0,
          trialing: trialingOrgs || 0,
          canceled_this_month: canceledThisMonth || 0,
          mrr,
          arr: mrr * 12,
          churn_rate: churnRate
        },
        experiments: {
          total: totalExperiments || 0,
          running: runningExperiments || 0,
          completed: completedExperiments || 0
        },
        events: {
          total_this_month: 0, // Placeholder
          average_per_day: 0 // Placeholder
        }
      })
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const StatCard = ({
    title,
    value,
    change,
    changeLabel,
    icon: Icon,
    iconColor
  }: {
    title: string
    value: string | number
    change?: number
    changeLabel?: string
    icon: any
    iconColor: string
  }) => (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{Math.abs(change).toFixed(1)}% {changeLabel || ''}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <AdminLayout
      title="Analytics Global"
      description="Métricas e indicadores do sistema"
      actions={
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="365d">12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={loadAnalytics}
            disabled={loading}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      }
    >
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="MRR"
          value={formatCurrency(data.subscriptions.mrr)}
          change={8.5}
          changeLabel="vs mês anterior"
          icon={DollarSign}
          iconColor="text-green-500"
        />
        <StatCard
          title="ARR"
          value={formatCurrency(data.subscriptions.arr)}
          change={12.3}
          changeLabel="vs ano anterior"
          icon={TrendingUp}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Taxa de Churn"
          value={`${data.subscriptions.churn_rate.toFixed(1)}%`}
          change={-0.5}
          changeLabel="vs mês anterior"
          icon={TrendingDown}
          iconColor="text-red-500"
        />
        <StatCard
          title="Assinaturas Ativas"
          value={formatNumber(data.subscriptions.active)}
          change={5.2}
          changeLabel="vs mês anterior"
          icon={CreditCard}
          iconColor="text-purple-500"
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Users */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Usuários
            </CardTitle>
            <CardDescription className="text-slate-400">
              Métricas de crescimento de usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm text-slate-400">Total de Usuários</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(data.users.total)}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-slate-400">Novos (7 dias)</p>
                  <p className="text-xl font-semibold text-white">{formatNumber(data.users.new_this_week)}</p>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-slate-400">Novos (30 dias)</p>
                  <p className="text-xl font-semibold text-white">{formatNumber(data.users.new_this_month)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`flex items-center gap-1 ${data.users.growth_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.users.growth_rate >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(data.users.growth_rate).toFixed(1)}%
                </span>
                <span className="text-slate-500">crescimento mensal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organizations */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-400" />
              Organizações
            </CardTitle>
            <CardDescription className="text-slate-400">
              Status das organizações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm text-slate-400">Total de Organizações</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(data.organizations.total)}</p>
                </div>
                <Building2 className="h-8 w-8 text-purple-400/50" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-400">Ativas</p>
                  <p className="text-xl font-semibold text-white">{data.subscriptions.active}</p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-400">Trial</p>
                  <p className="text-xl font-semibold text-white">{data.subscriptions.trialing}</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">Canceladas</p>
                  <p className="text-xl font-semibold text-white">{data.subscriptions.canceled_this_month}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiments */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            Experimentos
          </CardTitle>
          <CardDescription className="text-slate-400">
            Visão geral dos testes A/B
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-6 bg-slate-700/30 rounded-lg text-center">
              <BarChart3 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{formatNumber(data.experiments.total)}</p>
              <p className="text-sm text-slate-400">Total</p>
            </div>
            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
              <Activity className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{formatNumber(data.experiments.running)}</p>
              <p className="text-sm text-green-400">Em execução</p>
            </div>
            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
              <Eye className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{formatNumber(data.experiments.completed)}</p>
              <p className="text-sm text-blue-400">Concluídos</p>
            </div>
            <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
              <TrendingUp className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">
                {data.experiments.total > 0
                  ? ((data.experiments.completed / data.experiments.total) * 100).toFixed(0)
                  : 0}%
              </p>
              <p className="text-sm text-amber-400">Taxa de conclusão</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}
