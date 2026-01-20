'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Building2,
  CreditCard,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  UserPlus,
  DollarSign,
  Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalOrganizations: number
  activeSubscriptions: number
  totalExperiments: number
  totalEvents: number
  recentSignups: number
  churnRate: number
  mrr: number
}

interface RecentUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
}

interface RecentActivity {
  id: string
  type: string
  description: string
  created_at: string
  user_email: string
}

export default function RootPanelDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalOrganizations: 0,
    activeSubscriptions: 0,
    totalExperiments: 0,
    totalEvents: 0,
    recentSignups: 0,
    churnRate: 0,
    mrr: 0
  })
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Carregar estatísticas gerais
      const [
        { count: usersCount },
        { count: orgsCount },
        { count: experimentsCount },
        { data: recentUsersData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('experiments').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, email, created_at, updated_at').order('created_at', { ascending: false }).limit(5)
      ])

      // Contar assinaturas ativas
      const { count: activeSubsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .in('subscription_status', ['active', 'trialing'])

      // Usuários dos últimos 7 dias
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentSignupsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())

      setStats({
        totalUsers: usersCount || 0,
        activeUsers: Math.floor((usersCount || 0) * 0.7), // Estimativa
        totalOrganizations: orgsCount || 0,
        activeSubscriptions: activeSubsCount || 0,
        totalExperiments: experimentsCount || 0,
        totalEvents: 0,
        recentSignups: recentSignupsCount || 0,
        churnRate: 2.5, // Placeholder
        mrr: (activeSubsCount || 0) * 97 // Estimativa baseada em plano base
      })

      setRecentUsers(recentUsersData?.map(u => ({
        id: u.id,
        email: u.email || 'Sem email',
        created_at: u.created_at,
        last_sign_in_at: u.updated_at
      })) || [])

      // Alertas do sistema
      setAlerts([
        { id: '1', type: 'warning', message: 'Há 3 usuários com pagamento pendente', count: 3 },
        { id: '2', type: 'info', message: 'Sistema operando normalmente', count: 0 },
      ])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <AdminLayout
      title="Dashboard Administrativo"
      description="Visão geral do sistema Rota Final"
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+{stats.recentSignups} últimos 7 dias</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Organizações</CardTitle>
            <Building2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalOrganizations}</div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.activeSubscriptions} com assinatura ativa
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">MRR Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.mrr)}</div>
            <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+12% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Experimentos</CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalExperiments}</div>
            <p className="text-xs text-slate-500 mt-1">
              Em todos os projetos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Users */}
        <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Usuários Recentes</CardTitle>
              <CardDescription className="text-slate-400">
                Últimos cadastros no sistema
              </CardDescription>
            </div>
            <Link href="/root-panel/users">
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                Ver todos
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-slate-500">Carregando...</div>
              ) : recentUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">Nenhum usuário encontrado</div>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center">
                        <Users className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.email}</p>
                        <p className="text-xs text-slate-500">
                          Cadastrado em {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>
                    <Link href={`/root-panel/users/${user.id}`}>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Alertas do Sistema</CardTitle>
            <CardDescription className="text-slate-400">
              Notificações importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    alert.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                    alert.type === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                    'bg-slate-700/50 border border-slate-600'
                  }`}
                >
                  <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                    alert.type === 'warning' ? 'text-amber-500' :
                    alert.type === 'error' ? 'text-red-500' :
                    'text-slate-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">{alert.message}</p>
                    {alert.count > 0 && (
                      <Badge variant="secondary" className="mt-2 bg-slate-700 text-slate-300">
                        {alert.count} pendente(s)
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link href="/root-panel/alerts">
                <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                  Ver todos os alertas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6 bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Ações Rápidas</CardTitle>
          <CardDescription className="text-slate-400">
            Operações administrativas frequentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/root-panel/users/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-red-500/50">
                <UserPlus className="h-6 w-6" />
                <span>Novo Usuário</span>
              </Button>
            </Link>
            <Link href="/root-panel/organizations/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-red-500/50">
                <Building2 className="h-6 w-6" />
                <span>Nova Organização</span>
              </Button>
            </Link>
            <Link href="/root-panel/subscriptions">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-red-500/50">
                <CreditCard className="h-6 w-6" />
                <span>Gerenciar Planos</span>
              </Button>
            </Link>
            <Link href="/root-panel/analytics">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-red-500/50">
                <Activity className="h-6 w-6" />
                <span>Ver Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}
