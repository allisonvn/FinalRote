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
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsPanelProps { className?: string }

export default function SettingsPanel({ className }: SettingsPanelProps) {
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

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">Gerencie sua conta, preferências e integrações</p>
          </div>
          <Button
            onClick={salvar}
            disabled={salvando}
            className="bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90 gap-2"
          >
            <Save className="h-4 w-4" strokeWidth={1.75} />
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="space-y-6 xl:col-span-2">

            {/* Profile Card */}
            <Card className="card-glass hover-lift">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                    <User2 className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <CardTitle>Perfil</CardTitle>
                    <CardDescription>Informações da sua conta</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Nome completo
                    </label>
                    <Input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="mt-1.5"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Email
                    </label>
                    <div className="relative mt-1.5">
                      <Input value={email} disabled className="pr-20" />
                      <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-success/10 text-success border-success/20">
                        <Check className="h-3 w-3 mr-1" strokeWidth={2} />
                        Verificado
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card className="card-glass hover-lift">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Shield className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <CardTitle>Segurança</CardTitle>
                    <CardDescription>Altere sua senha e gerencie a autenticação</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Senha atual
                    </label>
                    <Input type="password" className="mt-1.5" placeholder="••••••••" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Nova senha
                      </label>
                      <Input type="password" className="mt-1.5" placeholder="Mínimo 8 caracteres" />
                    </div>
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Confirmar senha
                      </label>
                      <Input type="password" className="mt-1.5" placeholder="Repita a senha" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => toast.info('Em breve: alteração de senha')}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" strokeWidth={1.75} />
                    Atualizar senha
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API Keys Card */}
            <Card className="card-glass hover-lift">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Key className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <CardTitle>Chave API</CardTitle>
                    <CardDescription>Use esta chave para integrar com sua aplicação</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    Ativa
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                    <KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Chave pública
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={showApiKey ? apiKey : '•'.repeat(apiKey.length)}
                        readOnly
                        className="pr-10 font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={copyApiKey}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" strokeWidth={1.75} />
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
                    Esta chave é segura para uso no lado do cliente. Para operações sensíveis, use a chave secreta.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* UTM Domains Card */}
            <Card className="card-glass hover-lift">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Globe2 className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <CardTitle>Propagação de UTMs</CardTitle>
                    <CardDescription>Configure domínios para rastreamento de campanhas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                    <Globe2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Domínios permitidos
                  </label>
                  <Textarea
                    value={allowedDomainsCustom}
                    onChange={(e) => setAllowedDomainsCustom(e.target.value)}
                    placeholder="pay.hotmart.com&#10;checkout.exemplo.com&#10;meu-pagamento.com.br"
                    rows={5}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Insira um domínio por linha. Os parâmetros UTM serão propagados automaticamente para esses domínios, permitindo rastreamento entre páginas de checkout e sites externos.
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">

            {/* Theme & Preferences Card */}
            <Card className="card-glass hover-lift">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Palette className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <CardTitle>Aparência</CardTitle>
                    <CardDescription>Personalize o tema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tema</label>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={tema === 'auto' ? 'default' : 'outline'}
                      onClick={() => aplicarTema('auto')}
                      className={cn(
                        "w-full justify-start gap-2",
                        tema === 'auto' && 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20'
                      )}
                    >
                      <Sun className="h-4 w-4" strokeWidth={1.75} />
                      Automático
                      {tema === 'auto' && <Check className="h-4 w-4 ml-auto" strokeWidth={2} />}
                    </Button>
                    <Button
                      variant={tema === 'claro' ? 'default' : 'outline'}
                      onClick={() => aplicarTema('claro')}
                      className={cn(
                        "w-full justify-start gap-2",
                        tema === 'claro' && 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20'
                      )}
                    >
                      <Sun className="h-4 w-4" strokeWidth={1.75} />
                      Claro
                      {tema === 'claro' && <Check className="h-4 w-4 ml-auto" strokeWidth={2} />}
                    </Button>
                    <Button
                      variant={tema === 'escuro' ? 'default' : 'outline'}
                      onClick={() => aplicarTema('escuro')}
                      className={cn(
                        "w-full justify-start gap-2",
                        tema === 'escuro' && 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20'
                      )}
                    >
                      <Moon className="h-4 w-4" strokeWidth={1.75} />
                      Escuro
                      {tema === 'escuro' && <Check className="h-4 w-4 ml-auto" strokeWidth={2} />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Language Card */}
            <Card className="card-glass hover-lift">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Languages className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <CardTitle>Idioma</CardTitle>
                    <CardDescription>Preferência de idioma</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Select value={idioma} onValueChange={(v) => setIdioma(v as any)}>
                  <SelectTrigger>
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

            {/* Notifications Card */}
            <Card className="card-glass hover-lift">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Bell className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <CardTitle>Notificações</CardTitle>
                    <CardDescription>Gerencie alertas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifEmail}
                      onChange={(e) => setNotifEmail(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                      <span className="text-sm font-medium">Sistema</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSistema}
                      onChange={(e) => setNotifSistema(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </label>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                    <Bell className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
                    <span>Receba alertas semanais sobre o desempenho dos seus experimentos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integration Status */}
            <Card className="card-glass hover-lift border-success/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success ring-1 ring-success/20">
                    <Check className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Sistema Integrado</p>
                    <p className="text-xs text-muted-foreground">Tudo funcionando perfeitamente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
