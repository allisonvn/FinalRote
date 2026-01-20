'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  Search,
  MoreHorizontal,
  Eye,
  Building2,
  Filter,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  ExternalLink,
  Mail
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Subscription {
  id: string
  organization_id: string
  organization_name: string
  organization_slug: string
  status: string
  plan: string | null
  price: number
  started_at: string | null
  expires_at: string | null
  canceled_at: string | null
  owner_email: string | null
}

interface SubscriptionStats {
  total: number
  active: number
  trialing: number
  past_due: number
  canceled: number
  mrr: number
  churnRate: number
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    active: 0,
    trialing: 0,
    past_due: 0,
    canceled: 0,
    mrr: 0,
    churnRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false)
  const [extendDays, setExtendDays] = useState('30')
  const [actionLoading, setActionLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSubscriptions()
  }, [statusFilter])

  const loadSubscriptions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          subscription_status,
          subscription_plan,
          subscription_started_at,
          subscription_expires_at,
          subscription_canceled_at
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('subscription_status', statusFilter)
      }

      const { data: orgsData, error } = await query

      if (error) throw error

      // Para cada org, buscar o owner
      const subsWithOwner: Subscription[] = await Promise.all(
        (orgsData || []).map(async (org) => {
          try {
            const { data: ownerMember, error: ownerError } = await supabase
              .from('organization_members')
              .select(`
                user:profiles (email)
              `)
              .eq('organization_id', org.id)
              .eq('role', 'owner')
              .maybeSingle()

            // Se houver erro mas não for "not found", logar
            if (ownerError && ownerError.code !== 'PGRST116') {
              console.warn(`Erro ao buscar owner da org ${org.id}:`, ownerError.message)
            }

            const planPrices: Record<string, number> = {
              'starter': 47,
              'professional': 97,
              'business': 197,
              'enterprise': 497
            }

            return {
              id: org.id,
              organization_id: org.id,
              organization_name: org.name,
              organization_slug: org.slug,
              status: org.subscription_status || 'inactive',
              plan: org.subscription_plan,
              price: planPrices[org.subscription_plan || ''] || 0,
              started_at: org.subscription_started_at,
              expires_at: org.subscription_expires_at,
              canceled_at: org.subscription_canceled_at,
              owner_email: (ownerMember?.user as any)?.email || null
            }
          } catch (orgError) {
            // Se houver erro ao processar uma org específica, logar e continuar
            console.warn(`Erro ao processar organização ${org.id}:`, orgError instanceof Error ? orgError.message : String(orgError))
            // Retornar dados básicos mesmo com erro
            const planPrices: Record<string, number> = {
              'starter': 47,
              'professional': 97,
              'business': 197,
              'enterprise': 497
            }
            return {
              id: org.id,
              organization_id: org.id,
              organization_name: org.name,
              organization_slug: org.slug,
              status: org.subscription_status || 'inactive',
              plan: org.subscription_plan,
              price: planPrices[org.subscription_plan || ''] || 0,
              started_at: org.subscription_started_at,
              expires_at: org.subscription_expires_at,
              canceled_at: org.subscription_canceled_at,
              owner_email: null
            }
          }
        })
      )

      setSubscriptions(subsWithOwner)

      // Calcular estatísticas
      const activeCount = subsWithOwner.filter(s => s.status === 'active').length
      const trialingCount = subsWithOwner.filter(s => s.status === 'trialing').length
      const pastDueCount = subsWithOwner.filter(s => s.status === 'past_due').length
      const canceledCount = subsWithOwner.filter(s => s.status === 'canceled').length
      const mrr = subsWithOwner
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + s.price, 0)

      setStats({
        total: subsWithOwner.length,
        active: activeCount,
        trialing: trialingCount,
        past_due: pastDueCount,
        canceled: canceledCount,
        mrr,
        churnRate: canceledCount > 0 ? (canceledCount / subsWithOwner.length) * 100 : 0
      })
    } catch (error) {
      // Melhorar o tratamento de erro para exibir informações úteis
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : JSON.stringify(error, null, 2)
      
      const errorDetails = error instanceof Error
        ? {
            message: error.message,
            name: error.name,
            stack: error.stack
          }
        : error

      console.error('Erro ao carregar assinaturas:', {
        message: errorMessage,
        details: errorDetails,
        error
      })
      
      // Opcional: mostrar notificação ao usuário
      // Você pode adicionar um toast aqui se tiver um sistema de notificações
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (sub: Subscription, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          subscription_status: newStatus,
          ...(newStatus === 'canceled' ? { subscription_canceled_at: new Date().toISOString() } : {})
        })
        .eq('id', sub.organization_id)

      if (error) throw error
      loadSubscriptions()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const handleExtendSubscription = async () => {
    if (!selectedSubscription) return

    setActionLoading(true)
    try {
      const currentExpiry = selectedSubscription.expires_at
        ? new Date(selectedSubscription.expires_at)
        : new Date()

      const newExpiry = new Date(currentExpiry)
      newExpiry.setDate(newExpiry.getDate() + parseInt(extendDays))

      const { error } = await supabase
        .from('organizations')
        .update({
          subscription_expires_at: newExpiry.toISOString(),
          subscription_status: 'active'
        })
        .eq('id', selectedSubscription.organization_id)

      if (error) throw error

      setIsExtendDialogOpen(false)
      loadSubscriptions()
    } catch (error) {
      console.error('Erro ao estender assinatura:', error)
      alert('Erro ao estender assinatura')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredSubs = subscriptions.filter(sub => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      sub.organization_name.toLowerCase().includes(search) ||
      sub.organization_slug.toLowerCase().includes(search) ||
      sub.owner_email?.toLowerCase().includes(search)
    )
  })

  const formatDate = (date: string | null) => {
    if (!date) return '-'
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

  const getStatusBadge = (status: string) => {
    const styles = {
      active: { className: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle, label: 'Ativo' },
      trialing: { className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock, label: 'Trial' },
      past_due: { className: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: AlertTriangle, label: 'Pendente' },
      canceled: { className: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Cancelado' },
      inactive: { className: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: XCircle, label: 'Inativo' }
    }
    const style = styles[status as keyof typeof styles] || styles.inactive
    const Icon = style.icon
    return (
      <Badge className={style.className}>
        <Icon className="mr-1 h-3 w-3" />
        {style.label}
      </Badge>
    )
  }

  return (
    <AdminLayout
      title="Gerenciar Assinaturas"
      description="Controle de planos e pagamentos"
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.mrr)}</div>
            <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>Receita mensal recorrente</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Assinaturas Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.active}</div>
            <p className="text-xs text-slate-500 mt-1">
              +{stats.trialing} em trial
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pagamentos Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.past_due}</div>
            <p className="text-xs text-amber-400 mt-1">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Taxa de Churn</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.churnRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.canceled} cancelamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-slate-800 border-slate-700">
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Buscar por organização ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-slate-700/50 border-slate-600 text-white">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="trialing">Trial</SelectItem>
                <SelectItem value="past_due">Pendentes</SelectItem>
                <SelectItem value="canceled">Cancelados</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadSubscriptions}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Assinaturas</CardTitle>
          <CardDescription className="text-slate-400">
            Todas as assinaturas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Carregando assinaturas...</p>
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma assinatura encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Organização</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Plano</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Valor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Expira em</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((sub) => (
                    <tr key={sub.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{sub.organization_name}</p>
                            <p className="text-xs text-slate-500">{sub.owner_email || 'Sem proprietário'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-white capitalize">
                          {sub.plan || 'Nenhum'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-white">
                          {sub.price > 0 ? formatCurrency(sub.price) : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-400">
                          {formatDate(sub.expires_at)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuLabel className="text-slate-400">Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem
                              className="text-slate-300 hover:bg-slate-700"
                              onClick={() => {
                                setSelectedSubscription(sub)
                                setIsDetailsDialogOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="text-slate-300 hover:bg-slate-700">
                              <Link href={`/root-panel/organizations/${sub.organization_id}`}>
                                <Building2 className="mr-2 h-4 w-4" />
                                Ver Organização
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuLabel className="text-slate-500 text-xs">Alterar Status</DropdownMenuLabel>
                            <DropdownMenuItem
                              className="text-green-400 hover:bg-green-500/10"
                              onClick={() => handleUpdateStatus(sub, 'active')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Ativar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-slate-300 hover:bg-slate-700"
                              onClick={() => {
                                setSelectedSubscription(sub)
                                setIsExtendDialogOpen(true)
                              }}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              Estender
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 hover:bg-red-500/10"
                              onClick={() => handleUpdateStatus(sub, 'canceled')}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            {sub.owner_email && (
                              <DropdownMenuItem className="text-slate-300 hover:bg-slate-700">
                                <Mail className="mr-2 h-4 w-4" />
                                Enviar Email
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Detalhes da Assinatura</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedSubscription?.organization_name}
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSubscription.status)}</div>
                </div>
                <div>
                  <Label className="text-slate-400">Plano</Label>
                  <p className="text-white capitalize mt-1">{selectedSubscription.plan || 'Nenhum'}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Valor Mensal</Label>
                  <p className="text-white mt-1">{formatCurrency(selectedSubscription.price)}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Email Proprietário</Label>
                  <p className="text-white mt-1">{selectedSubscription.owner_email || '-'}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Início</Label>
                  <p className="text-white mt-1">{formatDate(selectedSubscription.started_at)}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Expira em</Label>
                  <p className="text-white mt-1">{formatDate(selectedSubscription.expires_at)}</p>
                </div>
              </div>
              {selectedSubscription.canceled_at && (
                <div className="pt-4 border-t border-slate-700">
                  <Label className="text-red-400">Cancelado em</Label>
                  <p className="text-white mt-1">{formatDate(selectedSubscription.canceled_at)}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Estender Assinatura</DialogTitle>
            <DialogDescription className="text-slate-400">
              Adicionar dias à assinatura de {selectedSubscription?.organization_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dias a adicionar</Label>
              <Select value={extendDays} onValueChange={setExtendDays}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias (1 mês)</SelectItem>
                  <SelectItem value="60">60 dias (2 meses)</SelectItem>
                  <SelectItem value="90">90 dias (3 meses)</SelectItem>
                  <SelectItem value="365">365 dias (1 ano)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-400">
                Data atual de expiração: <span className="text-white">{formatDate(selectedSubscription?.expires_at || null)}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExtendDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExtendSubscription}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Estendendo...' : 'Estender Assinatura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
