'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Settings,
  Shield,
  Mail,
  Bell,
  Database,
  Key,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle,
  Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AdminUser {
  id: string
  email: string
  added_at: string
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
    { id: '1', email: 'admin@rotafinal.com', added_at: '2024-01-01' },
    { id: '2', email: 'suporte@rotafinal.com', added_at: '2024-01-15' }
  ])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false)

  // Configurações do sistema
  const [settings, setSettings] = useState({
    // Geral
    maintenance_mode: false,
    allow_signups: true,
    require_email_verification: true,

    // Notificações
    send_welcome_email: true,
    send_payment_reminders: true,
    notify_admins_new_signup: true,

    // Limites
    default_trial_days: 14,
    max_experiments_per_org: 50,
    max_events_per_month: 100000,

    // Segurança
    two_factor_required: false,
    session_timeout_hours: 24,
    max_login_attempts: 5
  })

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      // Salvar configurações - em produção seria uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return

    setLoading(true)
    try {
      // Adicionar admin - em produção seria uma chamada de API
      setAdminUsers([
        ...adminUsers,
        { id: Date.now().toString(), email: newAdminEmail, added_at: new Date().toISOString() }
      ])
      setNewAdminEmail('')
      setIsAddAdminDialogOpen(false)
    } catch (error) {
      console.error('Erro ao adicionar admin:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAdmin = async (adminId: string) => {
    if (adminUsers.length <= 1) {
      alert('Deve haver pelo menos um administrador')
      return
    }

    if (!confirm('Tem certeza que deseja remover este administrador?')) return

    setAdminUsers(adminUsers.filter(a => a.id !== adminId))
  }

  return (
    <AdminLayout
      title="Configurações"
      description="Configurações gerais do sistema"
      actions={
        <Button
          onClick={handleSaveSettings}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700"
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      }
    >
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="general" className="data-[state=active]:bg-slate-700">
            <Settings className="mr-2 h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="admins" className="data-[state=active]:bg-slate-700">
            <Shield className="mr-2 h-4 w-4" />
            Administradores
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700">
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="limits" className="data-[state=active]:bg-slate-700">
            <Database className="mr-2 h-4 w-4" />
            Limites
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700">
            <Key className="mr-2 h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Configurações Gerais</CardTitle>
              <CardDescription className="text-slate-400">
                Configurações básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Modo Manutenção</Label>
                  <p className="text-sm text-slate-400">
                    Bloqueia o acesso de usuários ao sistema
                  </p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Permitir Novos Cadastros</Label>
                  <p className="text-sm text-slate-400">
                    Permite que novos usuários se cadastrem
                  </p>
                </div>
                <Switch
                  checked={settings.allow_signups}
                  onCheckedChange={(checked) => setSettings({ ...settings, allow_signups: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Verificação de Email Obrigatória</Label>
                  <p className="text-sm text-slate-400">
                    Usuários precisam verificar email antes de acessar
                  </p>
                </div>
                <Switch
                  checked={settings.require_email_verification}
                  onCheckedChange={(checked) => setSettings({ ...settings, require_email_verification: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Users */}
        <TabsContent value="admins">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Administradores do Sistema</CardTitle>
                <CardDescription className="text-slate-400">
                  Usuários com acesso ao painel administrativo
                </CardDescription>
              </div>
              <Dialog open={isAddAdminDialogOpen} onOpenChange={setIsAddAdminDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Adicionar Administrador</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Digite o email do usuário que terá acesso administrativo.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin_email">Email</Label>
                      <Input
                        id="admin_email"
                        type="email"
                        placeholder="admin@exemplo.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-400">
                          Administradores têm acesso total ao sistema, incluindo dados de todos os usuários e organizações.
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddAdminDialogOpen(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddAdmin}
                      disabled={loading || !newAdminEmail}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {loading ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminUsers.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-600/20 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{admin.email}</p>
                        <p className="text-xs text-slate-500">
                          Adicionado em {new Date(admin.added_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Configurações de Notificações</CardTitle>
              <CardDescription className="text-slate-400">
                Controle emails e alertas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Email de Boas-Vindas</Label>
                  <p className="text-sm text-slate-400">
                    Enviar email de boas-vindas para novos usuários
                  </p>
                </div>
                <Switch
                  checked={settings.send_welcome_email}
                  onCheckedChange={(checked) => setSettings({ ...settings, send_welcome_email: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Lembretes de Pagamento</Label>
                  <p className="text-sm text-slate-400">
                    Enviar lembretes quando pagamentos estão vencendo
                  </p>
                </div>
                <Switch
                  checked={settings.send_payment_reminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, send_payment_reminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Notificar Novos Cadastros</Label>
                  <p className="text-sm text-slate-400">
                    Notificar administradores sobre novos usuários
                  </p>
                </div>
                <Switch
                  checked={settings.notify_admins_new_signup}
                  onCheckedChange={(checked) => setSettings({ ...settings, notify_admins_new_signup: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limits */}
        <TabsContent value="limits">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Limites do Sistema</CardTitle>
              <CardDescription className="text-slate-400">
                Configure limites padrão para organizações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="trial_days" className="text-white">Dias de Trial Padrão</Label>
                <Input
                  id="trial_days"
                  type="number"
                  value={settings.default_trial_days}
                  onChange={(e) => setSettings({ ...settings, default_trial_days: parseInt(e.target.value) })}
                  className="bg-slate-700 border-slate-600 text-white w-32"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_experiments" className="text-white">Máximo de Experimentos por Organização</Label>
                <Input
                  id="max_experiments"
                  type="number"
                  value={settings.max_experiments_per_org}
                  onChange={(e) => setSettings({ ...settings, max_experiments_per_org: parseInt(e.target.value) })}
                  className="bg-slate-700 border-slate-600 text-white w-32"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_events" className="text-white">Máximo de Eventos por Mês</Label>
                <Input
                  id="max_events"
                  type="number"
                  value={settings.max_events_per_month}
                  onChange={(e) => setSettings({ ...settings, max_events_per_month: parseInt(e.target.value) })}
                  className="bg-slate-700 border-slate-600 text-white w-40"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Configurações de Segurança</CardTitle>
              <CardDescription className="text-slate-400">
                Políticas de segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">2FA Obrigatório</Label>
                  <p className="text-sm text-slate-400">
                    Exigir autenticação de dois fatores para todos os usuários
                  </p>
                </div>
                <Switch
                  checked={settings.two_factor_required}
                  onCheckedChange={(checked) => setSettings({ ...settings, two_factor_required: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_timeout" className="text-white">Timeout de Sessão (horas)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={settings.session_timeout_hours}
                  onChange={(e) => setSettings({ ...settings, session_timeout_hours: parseInt(e.target.value) })}
                  className="bg-slate-700 border-slate-600 text-white w-32"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_attempts" className="text-white">Máximo de Tentativas de Login</Label>
                <Input
                  id="max_attempts"
                  type="number"
                  value={settings.max_login_attempts}
                  onChange={(e) => setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) })}
                  className="bg-slate-700 border-slate-600 text-white w-32"
                />
                <p className="text-xs text-slate-500">
                  Após esse número de tentativas falhas, o usuário será bloqueado temporariamente
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}
