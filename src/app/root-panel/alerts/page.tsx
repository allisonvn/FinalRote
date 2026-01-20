'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Bell,
  X,
  Clock,
  User,
  CreditCard,
  Server,
  Shield,
  RefreshCw
} from 'lucide-react'

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  category: 'billing' | 'security' | 'system' | 'user'
  title: string
  message: string
  created_at: string
  read: boolean
  action_url?: string
  action_label?: string
}

// Mock de alertas
const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'critical',
    category: 'billing',
    title: '3 pagamentos vencidos',
    message: 'Existem 3 organizações com pagamentos vencidos há mais de 7 dias.',
    created_at: new Date().toISOString(),
    read: false,
    action_url: '/root-panel/subscriptions?status=past_due',
    action_label: 'Ver detalhes'
  },
  {
    id: '2',
    type: 'warning',
    category: 'security',
    title: 'Tentativas de login suspeitas',
    message: '15 tentativas de login falhadas detectadas nas últimas 24 horas.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    action_url: '/root-panel/logs?level=warning',
    action_label: 'Ver logs'
  },
  {
    id: '3',
    type: 'info',
    category: 'system',
    title: 'Backup concluído',
    message: 'Backup automático do banco de dados concluído com sucesso.',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    read: true
  },
  {
    id: '4',
    type: 'warning',
    category: 'user',
    title: 'Usuários inativos',
    message: '12 usuários não fizeram login nos últimos 30 dias.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    action_url: '/root-panel/users?status=inactive',
    action_label: 'Ver usuários'
  },
  {
    id: '5',
    type: 'success',
    category: 'billing',
    title: 'Meta de MRR atingida',
    message: 'O MRR mensal ultrapassou R$ 10.000,00!',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    read: true
  }
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [filter, setFilter] = useState<string>('all')

  const markAsRead = (alertId: string) => {
    setAlerts(alerts.map(a =>
      a.id === alertId ? { ...a, read: true } : a
    ))
  }

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })))
  }

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId))
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    if (filter === 'unread') return !alert.read
    return alert.category === filter
  })

  const unreadCount = alerts.filter(a => !a.read).length

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    return `${diffDays}d atrás`
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      default:
        return <Info className="h-5 w-5 text-blue-400" />
    }
  }

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
      case 'success':
        return 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
      default:
        return 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'billing':
        return <CreditCard className="h-4 w-4" />
      case 'security':
        return <Shield className="h-4 w-4" />
      case 'system':
        return <Server className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <AdminLayout
      title="Alertas"
      description={`${unreadCount} alertas não lidos`}
      actions={
        <Button
          variant="outline"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Marcar todos como lidos
        </Button>
      }
    >
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'all', label: 'Todos', count: alerts.length },
          { value: 'unread', label: 'Não lidos', count: unreadCount },
          { value: 'billing', label: 'Billing', icon: CreditCard },
          { value: 'security', label: 'Segurança', icon: Shield },
          { value: 'system', label: 'Sistema', icon: Server },
          { value: 'user', label: 'Usuários', icon: User },
        ].map(({ value, label, count, icon: Icon }) => (
          <Button
            key={value}
            variant={filter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(value)}
            className={filter === value
              ? 'bg-red-600 hover:bg-red-700'
              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
            }
          >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {label}
            {count !== undefined && (
              <Badge variant="secondary" className="ml-2 bg-slate-700">
                {count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-slate-500 opacity-50" />
              <p className="text-slate-500">Nenhum alerta encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border transition-colors ${getAlertStyles(alert.type)} ${!alert.read ? 'ring-1 ring-inset ring-white/10' : 'opacity-80'}`}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${!alert.read ? 'text-white' : 'text-slate-300'}`}>
                        {alert.title}
                      </h3>
                      {!alert.read && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          Novo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        {getCategoryIcon(alert.category)}
                        <span className="capitalize">{alert.category}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(alert.created_at)}
                      </span>
                    </div>
                    {alert.action_url && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          onClick={() => {
                            markAsRead(alert.id)
                            window.location.href = alert.action_url!
                          }}
                        >
                          {alert.action_label || 'Ver mais'}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!alert.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                        className="text-slate-400 hover:text-white"
                        title="Marcar como lido"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="text-slate-400 hover:text-red-400"
                      title="Dispensar"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats Summary */}
      <Card className="mt-6 bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
              <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {alerts.filter(a => a.type === 'critical').length}
              </p>
              <p className="text-xs text-red-400">Críticos</p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
              <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {alerts.filter(a => a.type === 'warning').length}
              </p>
              <p className="text-xs text-amber-400">Avisos</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
              <Info className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {alerts.filter(a => a.type === 'info').length}
              </p>
              <p className="text-xs text-blue-400">Informações</p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
              <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {alerts.filter(a => a.type === 'success').length}
              </p>
              <p className="text-xs text-green-400">Sucesso</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}
