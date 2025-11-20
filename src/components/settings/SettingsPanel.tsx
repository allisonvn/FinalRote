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
  KeyRound,
  Globe2,
  User2,
  Save,
  Lock,
  Key,
  Palette,
  Languages,
  Mail,
  Check,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Settings,
  Zap,
  TrendingUp,
  CreditCard,
  Users,
  Activity,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  Crown,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsPanelProps { className?: string }

type TabType = 'account' | 'security' | 'api' | 'preferences' | 'billing'

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
  const [apiKey, setApiKey] = useState('rf_pk_xxxxxxxxxxxxxxxxx')
  const [showApiKey, setShowApiKey] = useState(false)

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
    toast.success('Tema atualizado')
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
      toast.success('Configurações salvas com sucesso')
    } catch {
      toast.error('Não foi possível salvar as configurações')
    } finally { setSalvando(false) }
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    toast.success('Chave API copiada!')
  }

  const tabs = [
    { id: 'account' as TabType, label: 'Conta', icon: User2 },
    { id: 'security' as TabType, label: 'Segurança', icon: Shield },
    { id: 'api' as TabType, label: 'API & Integrações', icon: Key },
    { id: 'preferences' as TabType, label: 'Preferências', icon: Settings },
    { id: 'billing' as TabType, label: 'Plano & Faturamento', icon: CreditCard },
  ]

  return (
    <div className={cn("max-w-7xl mx-auto", className)}>
      {/* Hero Header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50">
        <div className="absolute inset-0 bg-grid-slate opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative px-8 py-10">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-lg ring-4 ring-primary/10">
                  <Settings className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Configurações
                  </h1>
                  <p className="text-muted-foreground mt-1">Gerencie sua conta e personalize sua experiência</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 backdrop-blur border border-border/50">
                  <Activity className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  <span className="text-sm font-medium">Última atividade: há 2h</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 backdrop-blur border border-border/50">
                  <Users className="h-4 w-4 text-success" strokeWidth={1.75} />
                  <span className="text-sm font-medium">3 projetos ativos</span>
                </div>
                <Badge className="px-4 py-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-600 border-amber-500/20">
                  <Crown className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
                  Plano Pro
                </Badge>
              </div>
            </div>

            <Button
              onClick={salvar}
              disabled={salvando}
              size="lg"
              className="bg-gradient-primary text-primary-foreground shadow-lg hover:opacity-90 gap-2"
            >
              <Save className="h-4 w-4" strokeWidth={1.75} />
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-8">
        <div className="border-b border-border/50">
          <div className="flex gap-2 overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all whitespace-nowrap rounded-t-lg',
                  activeTab === tab.id
                    ? 'bg-background text-primary border-b-2 border-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <tab.icon className="h-4 w-4" strokeWidth={1.75} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card className="card-glass hover-lift border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-2 ring-primary/10">
                        <User2 className="h-6 w-6" strokeWidth={1.75} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Informações do Perfil</CardTitle>
                        <CardDescription>Atualize seus dados pessoais</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <Check className="h-3 w-3 mr-1" strokeWidth={2} />
                      Verificado
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <User2 className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                        Nome completo
                      </label>
                      <Input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="h-11"
                        placeholder="Seu nome"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <Mail className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                        Email
                      </label>
                      <Input value={email} disabled className="h-11 bg-muted/50" />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Seu email está verificado</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Você receberá notificações importantes neste endereço.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* UTM Domains Card */}
              <Card className="card-glass hover-lift border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-2 ring-primary/10">
                      <Globe2 className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Propagação de UTMs</CardTitle>
                      <CardDescription>Configure domínios para rastreamento de campanhas</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Globe2 className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                      Domínios permitidos
                    </label>
                    <Textarea
                      value={allowedDomainsCustom}
                      onChange={(e) => setAllowedDomainsCustom(e.target.value)}
                      placeholder="pay.hotmart.com&#10;checkout.exemplo.com&#10;meu-pagamento.com.br"
                      rows={6}
                      className="font-mono text-sm resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" strokeWidth={1.75} />
                      Insira um domínio por linha. Os parâmetros UTM serão propagados automaticamente para esses domínios.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <Card className="card-glass border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Status da Conta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Email verificado</span>
                    <Check className="h-4 w-4 text-success" strokeWidth={2} />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">2FA ativado</span>
                    <Check className="h-4 w-4 text-success" strokeWidth={2} />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Plano ativo</span>
                    <Badge className="bg-success/10 text-success border-success/20 text-xs">Pro</Badge>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-xs text-muted-foreground">Membro desde</div>
                    <div className="text-sm font-medium mt-0.5">Janeiro 2024</div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="card-glass border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <Download className="h-4 w-4" strokeWidth={1.75} />
                    Exportar dados
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <Upload className="h-4 w-4" strokeWidth={1.75} />
                    Importar configurações
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive" size="sm">
                    <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
                    Excluir conta
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-glass hover-lift border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-2 ring-primary/10">
                    <Lock className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Alterar Senha</CardTitle>
                    <CardDescription>Mantenha sua conta segura</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Lock className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                    Senha atual
                  </label>
                  <Input type="password" className="h-11" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Lock className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                    Nova senha
                  </label>
                  <Input type="password" className="h-11" placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Lock className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                    Confirmar nova senha
                  </label>
                  <Input type="password" className="h-11" placeholder="Repita a senha" />
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => toast.info('Em breve: alteração de senha')}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" strokeWidth={1.75} />
                    Atualizar senha
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glass hover-lift border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-2 ring-primary/10">
                    <Shield className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Autenticação em Duas Etapas</CardTitle>
                    <CardDescription>Proteção adicional para sua conta</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                  <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" strokeWidth={2} />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-success-foreground">2FA Ativado</p>
                    <p className="text-xs text-success-foreground/80">Sua conta está protegida com autenticação em duas etapas.</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
                  Reconfigurar 2FA
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* API Tab */}
        {activeTab === 'api' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="card-glass hover-lift border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-2 ring-primary/10">
                        <Key className="h-6 w-6" strokeWidth={1.75} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Chaves API</CardTitle>
                        <CardDescription>Gerencie suas credenciais de integração</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <Zap className="h-3 w-3 mr-1" strokeWidth={2} />
                      Ativa
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <KeyRound className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                      Chave pública
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={showApiKey ? apiKey : '•'.repeat(apiKey.length)}
                          readOnly
                          className="pr-10 font-mono text-sm h-11 bg-muted/50"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        onClick={copyApiKey}
                        className="gap-2 px-4"
                      >
                        <Copy className="h-4 w-4" strokeWidth={1.75} />
                        Copiar
                      </Button>
                    </div>
                    <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <ExternalLink className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.75} />
                      <p className="text-xs text-muted-foreground">
                        Esta chave é segura para uso no lado do cliente. Para operações sensíveis, use a chave secreta disponível no painel de desenvolvedor.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold">Estatísticas de Uso</h4>
                      <Badge variant="outline" className="text-xs">Últimos 30 dias</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                        <div className="text-2xl font-bold text-primary">1,234</div>
                        <div className="text-xs text-muted-foreground mt-1">Requisições</div>
                      </div>
                      <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                        <div className="text-2xl font-bold text-success">99.9%</div>
                        <div className="text-xs text-muted-foreground mt-1">Uptime</div>
                      </div>
                      <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                        <div className="text-2xl font-bold text-blue-600">45ms</div>
                        <div className="text-xs text-muted-foreground mt-1">Latência média</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="card-glass border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Documentação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                    Guia de início rápido
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                    Referência da API
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                    Exemplos de código
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-glass border-success/20 bg-success/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success ring-2 ring-success/20 flex-shrink-0">
                      <Check className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-success-foreground">Sistema Integrado</p>
                      <p className="text-xs text-success-foreground/80 mt-1">Todas as integrações estão funcionando perfeitamente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-glass hover-lift border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-2 ring-primary/10">
                    <Palette className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Aparência</CardTitle>
                    <CardDescription>Personalize a interface do sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-3 block">Tema da interface</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'auto' as const, icon: Sun, label: 'Automático', desc: 'Segue o sistema' },
                      { value: 'claro' as const, icon: Sun, label: 'Claro', desc: 'Sempre claro' },
                      { value: 'escuro' as const, icon: Moon, label: 'Escuro', desc: 'Sempre escuro' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => aplicarTema(option.value)}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                          tema === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50 hover:border-border hover:bg-secondary/50'
                        )}
                      >
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          tema === option.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                          <option.icon className="h-5 w-5" strokeWidth={1.75} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.desc}</div>
                        </div>
                        {tema === option.value && (
                          <Check className="h-5 w-5 text-primary" strokeWidth={2} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="card-glass hover-lift border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-2 ring-primary/10">
                      <Languages className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Idioma</CardTitle>
                      <CardDescription>Escolha seu idioma preferido</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Select value={idioma} onValueChange={(v) => setIdioma(v as any)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                      <SelectItem value="en-US" disabled>🇺🇸 English (US)</SelectItem>
                      <SelectItem value="es-ES" disabled>🇪🇸 Español</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="card-glass hover-lift border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-2 ring-primary/10">
                      <Bell className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Notificações</CardTitle>
                      <CardDescription>Gerencie seus alertas</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-secondary/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" strokeWidth={1.75} />
                      <div>
                        <div className="font-medium text-sm">Notificações por Email</div>
                        <div className="text-xs text-muted-foreground">Receba atualizações importantes</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifEmail}
                      onChange={(e) => setNotifEmail(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-secondary/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-primary" strokeWidth={1.75} />
                      <div>
                        <div className="font-medium text-sm">Notificações do Sistema</div>
                        <div className="text-xs text-muted-foreground">Alertas em tempo real</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSistema}
                      onChange={(e) => setNotifSistema(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
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
              <Card className="card-glass hover-lift border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-600 ring-2 ring-amber-500/20">
                        <Crown className="h-6 w-6" strokeWidth={1.75} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Plano Atual</CardTitle>
                        <CardDescription>Gerencie sua assinatura</CardDescription>
                      </div>
                    </div>
                    <Badge className="px-4 py-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-600 border-amber-500/20">
                      Plano Pro
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">R$ 199</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success" strokeWidth={2} />
                        <span>Até 100.000 visitantes/mês</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success" strokeWidth={2} />
                        <span>Experimentos ilimitados</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success" strokeWidth={2} />
                        <span>Suporte prioritário</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 gap-2">
                      <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
                      Fazer upgrade
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
                      Cancelar plano
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="card-glass border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Próximo Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-2xl font-bold">R$ 199,00</div>
                      <div className="text-sm text-muted-foreground">20 de Dezembro, 2024</div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <CreditCard className="h-4 w-4" strokeWidth={1.75} />
                      Alterar forma de pagamento
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glass border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Histórico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <Download className="h-4 w-4" strokeWidth={1.75} />
                    Ver faturas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
