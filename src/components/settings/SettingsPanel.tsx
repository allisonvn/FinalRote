"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Sun,
  Moon,
  Shield,
  Bell,
  Globe2,
  User2,
  Save,
  Lock,
  Palette,
  Languages,
  Mail,
  Check,
  Settings,
  TrendingUp,
  CreditCard,
  Users,
  Activity,
  AlertCircle,
  Crown,
  Sparkles,
  Zap,
  CheckCircle2,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsPanelProps { className?: string }

type TabType = 'account' | 'security' | 'preferences' | 'billing'

export default function SettingsPanel({ className }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('account')
  const [nome, setNome] = useState('Usuário Demo')
  const [email] = useState('demo@rotafinal.com')
  const [tema, setTema] = useState<'auto'|'claro'|'escuro'>('auto')
  const [idioma, setIdioma] = useState<'pt-BR'>('pt-BR')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifSistema, setNotifSistema] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [allowedDomainsCustom, setAllowedDomainsCustom] = useState('')
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)

  const fetchCustomDomains = useCallback(async (projectId: string) => {
    if (!projectId) {
      console.warn('fetchCustomDomains chamado sem projectId')
      return
    }

    try {
      const response = await fetch(`/api/settings/custom-domains?projectId=${projectId}`)
      const responseText = await response.text()

      if (!response.ok) {
        let errorData: any = null
        let errorMessage = `Erro ${response.status}: ${response.statusText || 'Erro desconhecido'}`

        if (responseText) {
          try {
            errorData = JSON.parse(responseText)
          } catch {
            errorMessage = responseText || errorMessage
          }
        }

        if (errorData && typeof errorData === 'object') {
          errorMessage = errorData.error || errorData.message || errorMessage
        }

        console.error(
          `Erro ao buscar domínios personalizados - Status: ${response.status}, ` +
          `StatusText: ${response.statusText}, ProjectId: ${projectId}, ` +
          `Mensagem: ${errorMessage}, Response: ${responseText.substring(0, 200)}`
        )

        toast.error(errorMessage)
        return
      }

      let data: any = null
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        const parseErrorMsg = parseError instanceof Error ? parseError.message : String(parseError)
        console.error(
          `Erro ao fazer parse da resposta de sucesso - Response: ${responseText.substring(0, 200)}, ` +
          `Erro: ${parseErrorMsg}`
        )
        toast.error('Resposta inválida do servidor')
        return
      }

      if (data && Array.isArray(data.domains)) {
        setAllowedDomainsCustom(data.domains.length > 0 ? data.domains.join('\n') : '')
      } else {
        setAllowedDomainsCustom('')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : 'N/A'
      console.error(
        `Erro de rede ao buscar domínios personalizados - ProjectId: ${projectId}, ` +
        `Erro: ${errorMessage}, Stack: ${errorStack}`
      )
      toast.error('Erro de rede ao carregar domínios personalizados')
    }
  }, [])

  useEffect(() => {
    try {
      const storedTema = localStorage.getItem('preferencias.tema') as any
      const storedIdioma = localStorage.getItem('preferencias.idioma') as any
      if (storedTema) setTema(storedTema)
      if (storedIdioma) setIdioma(storedIdioma)

      const projectId = localStorage.getItem('currentProjectId')
      setCurrentProjectId(projectId)
    } catch { }
  }, [])

  useEffect(() => {
    if (currentProjectId) {
      fetchCustomDomains(currentProjectId)
    }
  }, [currentProjectId, fetchCustomDomains])

  const aplicarTema = (valor: 'auto' | 'claro' | 'escuro') => {
    setTema(valor)
    if (valor === 'auto') {
      document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      document.documentElement.classList.toggle('dark', valor === 'escuro')
    }
    localStorage.setItem('preferencias.tema', valor)
    toast.success('Tema atualizado com sucesso!')
  }

  const salvar = async () => {
    try {
      setSalvando(true)
      localStorage.setItem('preferencias.idioma', idioma)

      if (currentProjectId) {
        const domainsArray = allowedDomainsCustom.split(/\s*,\s*|\n/).filter(d => d.trim() !== '')
        const response = await fetch(`/api/settings/custom-domains`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: currentProjectId, domains: domainsArray })
        })

        const data = await response.json()

        if (!response.ok) {
          console.error('Erro ao salvar domínios personalizados:', data.error)
          toast.error('Erro ao salvar domínios personalizados')
          setSalvando(false)
          return
        }
      }
      toast.success('Configurações salvas com sucesso!')
    } catch {
      toast.error('Não foi possível salvar as configurações')
    } finally { setSalvando(false) }
  }

  const tabs = [
    { id: 'account' as TabType, label: 'Conta', icon: User2, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'security' as TabType, label: 'Segurança', icon: Shield, gradient: 'from-red-500 to-pink-500' },
    { id: 'preferences' as TabType, label: 'Preferências', icon: Settings, gradient: 'from-purple-500 to-indigo-500' },
    { id: 'billing' as TabType, label: 'Plano & Faturamento', icon: CreditCard, gradient: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className={cn("max-w-7xl mx-auto", className)}>
      {/* Premium Hero Header */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-2xl shadow-primary/5">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-slate opacity-[0.15]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-primary/20 via-blue-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl" />

        <div className="relative px-10 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-6">
              {/* Title Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 rounded-2xl blur-xl opacity-60 animate-pulse" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-blue-500 to-indigo-600 shadow-2xl shadow-primary/50 ring-4 ring-white/20 dark:ring-slate-800/20">
                    <Settings className="h-8 w-8 text-white" strokeWidth={2} />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    Configurações
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1.5 text-base">
                    Personalize sua experiência e gerencie sua conta
                  </p>
                </div>
              </div>

              {/* Stats Pills */}
              <div className="flex flex-wrap gap-3">
                <div className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg shadow-slate-900/5 hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                    <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Última atividade</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">há 2 horas</div>
                  </div>
                </div>

                <div className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg shadow-slate-900/5 hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                    <Users className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Projetos ativos</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">3 projetos</div>
                  </div>
                </div>

                <div className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 backdrop-blur-xl border border-amber-300/50 dark:border-amber-600/50 shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <Crown className="h-4 w-4 text-white" strokeWidth={2.5} />
                  <div className="text-sm font-bold text-white">Plano Pro</div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="lg:flex-shrink-0">
              <Button
                onClick={salvar}
                disabled={salvando}
                size="lg"
                className="relative group h-14 px-8 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 hover:from-primary/90 hover:via-blue-600/90 hover:to-indigo-600/90 text-white shadow-2xl shadow-primary/30 hover:shadow-primary/50 border-0 transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 rounded-lg transition-opacity" />
                <Save className="h-5 w-5 mr-2" strokeWidth={2} />
                <span className="font-semibold text-base">
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Tabs Navigation */}
      <div className="mb-10">
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'group relative flex items-center gap-3 px-6 py-4 text-sm font-semibold transition-all duration-300 whitespace-nowrap rounded-2xl',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl shadow-slate-900/10 scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:scale-102'
                )}
              >
                {activeTab === tab.id && (
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-10 bg-gradient-to-br",
                    tab.gradient
                  )} />
                )}
                <div className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
                  activeTab === tab.id
                    ? `bg-gradient-to-br ${tab.gradient} shadow-lg text-white`
                    : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                )}>
                  <tab.icon className="h-4.5 w-4.5" strokeWidth={2} />
                </div>
                <span className="relative">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className={cn(
                    "absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-gradient-to-r",
                    tab.gradient
                  )} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 via-transparent to-transparent rounded-full blur-3xl" />

              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl blur-lg opacity-50" />
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-xl shadow-blue-500/30">
                        <User2 className="h-7 w-7 text-white" strokeWidth={2} />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Informações do Perfil</CardTitle>
                      <CardDescription className="text-base mt-1">Gerencie seus dados pessoais</CardDescription>
                    </div>
                  </div>
                  <Badge className="px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-600/10 text-green-700 dark:text-green-400 border-green-500/30 shadow-lg shadow-green-500/10">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" strokeWidth={2.5} />
                    <span className="font-semibold">Verificado</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <User2 className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                      Nome completo
                    </label>
                    <Input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="h-12 text-base border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Digite seu nome completo"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                      Email
                    </label>
                    <Input
                      value={email}
                      disabled
                      className="h-12 text-base bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="relative flex items-start gap-3.5 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50/30 dark:from-blue-950/30 dark:to-cyan-950/10 border border-blue-200/60 dark:border-blue-800/40 shadow-lg shadow-blue-900/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                    <Info className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Email verificado com sucesso!</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      Você receberá notificações importantes e atualizações neste endereço de email.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* UTM Domains Card */}
            <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl" />

              <CardHeader className="relative">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl blur-lg opacity-50" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-xl shadow-purple-500/30">
                      <Globe2 className="h-7 w-7 text-white" strokeWidth={2} />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Propagação de UTMs</CardTitle>
                    <CardDescription className="text-base mt-1">Configure domínios para rastreamento avançado</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
                    Domínios permitidos
                  </label>
                  <Textarea
                    value={allowedDomainsCustom}
                    onChange={(e) => setAllowedDomainsCustom(e.target.value)}
                    placeholder="pay.hotmart.com&#10;checkout.exemplo.com&#10;pagamento.meusite.com.br"
                    rows={7}
                    className="font-mono text-sm resize-none border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  <div className="flex items-start gap-2.5 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30">
                    <Sparkles className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
                    <p className="text-xs text-purple-900 dark:text-purple-100 leading-relaxed">
                      <span className="font-semibold">Dica:</span> Insira um domínio por linha. Os parâmetros UTM serão propagados automaticamente, permitindo rastreamento completo entre páginas e checkouts externos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="max-w-3xl">
            <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red-500/10 via-transparent to-transparent rounded-full blur-3xl" />

              <CardHeader className="relative">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl blur-lg opacity-50" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-xl shadow-red-500/30">
                      <Lock className="h-7 w-7 text-white" strokeWidth={2} />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Alterar Senha</CardTitle>
                    <CardDescription className="text-base mt-1">Mantenha sua conta sempre segura</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                    Senha atual
                  </label>
                  <Input
                    type="password"
                    className="h-12 text-base border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                      Nova senha
                    </label>
                    <Input
                      type="password"
                      className="h-12 text-base border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                      Confirmar senha
                    </label>
                    <Input
                      type="password"
                      className="h-12 text-base border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                    className="h-12 px-8 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-xl shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Shield className="h-5 w-5 mr-2" strokeWidth={2} />
                    <span className="font-semibold">Atualizar senha</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Theme Card */}
            <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-purple-500/10 via-transparent to-transparent rounded-full blur-2xl" />

              <CardHeader className="relative">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl blur-lg opacity-50" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-xl shadow-purple-500/30">
                      <Palette className="h-7 w-7 text-white" strokeWidth={2} />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Aparência</CardTitle>
                    <CardDescription className="text-base mt-1">Personalize o tema do sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tema da interface</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'auto' as const, icon: Zap, label: 'Automático', desc: 'Segue as preferências do sistema', gradient: 'from-slate-500 to-slate-600' },
                      { value: 'claro' as const, icon: Sun, label: 'Claro', desc: 'Tema claro o tempo todo', gradient: 'from-amber-400 to-orange-500' },
                      { value: 'escuro' as const, icon: Moon, label: 'Escuro', desc: 'Tema escuro o tempo todo', gradient: 'from-indigo-500 to-purple-600' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => aplicarTema(option.value)}
                        className={cn(
                          "group relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-102",
                          tema === option.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-xl shadow-purple-500/10'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg'
                        )}
                      >
                        <div className={cn(
                          "relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 shadow-lg",
                          tema === option.value
                            ? `bg-gradient-to-br ${option.gradient} text-white shadow-${option.value === 'auto' ? 'slate' : option.value === 'claro' ? 'amber' : 'purple'}-500/40`
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                        )}>
                          <option.icon className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-base text-slate-900 dark:text-white">{option.label}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{option.desc}</div>
                        </div>
                        {tema === option.value && (
                          <CheckCircle2 className="h-6 w-6 text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Language Card */}
              <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent rounded-full blur-2xl" />

                <CardHeader className="relative">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl blur-lg opacity-50" />
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-xl shadow-blue-500/30">
                        <Languages className="h-7 w-7 text-white" strokeWidth={2} />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Idioma</CardTitle>
                      <CardDescription className="text-base mt-1">Escolha seu idioma</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <Select value={idioma} onValueChange={(v) => setIdioma(v as any)}>
                    <SelectTrigger className="h-12 text-base border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR" className="text-base">🇧🇷 Português (Brasil)</SelectItem>
                      <SelectItem value="en-US" disabled className="text-base">🇺🇸 English (US)</SelectItem>
                      <SelectItem value="es-ES" disabled className="text-base">🇪🇸 Español</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Notifications Card */}
              <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all duration-300">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-green-500/10 via-transparent to-transparent rounded-full blur-2xl" />

                <CardHeader className="relative">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl blur-lg opacity-50" />
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl shadow-green-500/30">
                        <Bell className="h-7 w-7 text-white" strokeWidth={2} />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Notificações</CardTitle>
                      <CardDescription className="text-base mt-1">Gerencie seus alertas</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <label className="group flex items-center justify-between p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50/50 dark:hover:bg-green-950/10 cursor-pointer transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                        <Mail className="h-5 w-5 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">Email</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Atualizações importantes</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifEmail}
                      onChange={(e) => setNotifEmail(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500/30 cursor-pointer transition-all"
                    />
                  </label>
                  <label className="group flex items-center justify-between p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50/50 dark:hover:bg-green-950/10 cursor-pointer transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                        <Bell className="h-5 w-5 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">Sistema</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Alertas em tempo real</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSistema}
                      onChange={(e) => setNotifSistema(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500/30 cursor-pointer transition-all"
                    />
                  </label>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-400/10 via-transparent to-transparent rounded-full blur-3xl" />

                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl blur-lg opacity-60 animate-pulse" />
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 shadow-2xl shadow-amber-500/40">
                          <Crown className="h-7 w-7 text-white" strokeWidth={2} />
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">Plano Atual</CardTitle>
                        <CardDescription className="text-base mt-1">Gerencie sua assinatura</CardDescription>
                      </div>
                    </div>
                    <Badge className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white border-0 shadow-xl shadow-amber-500/40 text-base font-bold">
                      <Crown className="h-4 w-4 mr-1.5" strokeWidth={2.5} />
                      Plano Pro
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-8">
                  <div className="relative p-8 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50/30 to-amber-50 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-amber-950/20 border-2 border-amber-200/60 dark:border-amber-800/40 shadow-2xl shadow-amber-500/10">
                    <div className="absolute -top-3 -right-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold shadow-lg">
                      Ativo
                    </div>
                    <div className="flex items-baseline gap-3 mb-6">
                      <span className="text-5xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">R$ 199</span>
                      <span className="text-xl font-semibold text-slate-600 dark:text-slate-400">/mês</span>
                    </div>
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-3 text-base">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                          <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">Até 100.000 visitantes por mês</span>
                      </div>
                      <div className="flex items-center gap-3 text-base">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                          <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">Experimentos ilimitados</span>
                      </div>
                      <div className="flex items-center gap-3 text-base">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                          <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">Suporte prioritário 24/7</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 text-base font-semibold">
                      <TrendingUp className="h-5 w-5 mr-2" strokeWidth={2} />
                      Fazer upgrade
                    </Button>
                    <Button variant="outline" className="h-14 px-6 border-2 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all text-base font-semibold">
                      <AlertCircle className="h-5 w-5 mr-2" strokeWidth={2} />
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Next Payment Card */}
              <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all duration-300">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent rounded-full blur-2xl" />

                <CardHeader className="relative pb-4">
                  <CardTitle className="text-lg font-bold">Próximo Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div>
                    <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">R$ 199,00</div>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">20 de Dezembro, 2024</div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full h-11 border-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold">
                    <CreditCard className="h-4 w-4 mr-2" strokeWidth={2} />
                    Alterar pagamento
                  </Button>
                </CardContent>
              </Card>

              {/* Success Status Card */}
              <Card className="relative overflow-hidden border-green-200/60 dark:border-green-800/40 bg-gradient-to-br from-green-50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 shadow-xl shadow-green-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl shadow-green-500/40 flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-green-900 dark:text-green-100">Tudo certo!</p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1 leading-relaxed">Seu plano está ativo e funcionando perfeitamente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
