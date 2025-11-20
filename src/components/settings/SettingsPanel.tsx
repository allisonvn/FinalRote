"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  User,
  Lock,
  Bell,
  CreditCard,
  Globe,
  Moon,
  Sun,
  Laptop,
  Check,
  Save,
  Shield,
  Palette,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SettingsPanelProps { className?: string }

export default function SettingsPanel({ className }: SettingsPanelProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('account')
  
  // User & Profile State
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  
  // Organization & Project State
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [orgData, setOrgData] = useState<any>(null)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  
  // Settings State
  const [tema, setTema] = useState<'auto'|'claro'|'escuro'>('auto')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifSistema, setNotifSistema] = useState(true)
  
  // Form States
  const [salvando, setSalvando] = useState(false)
  const [allowedDomainsCustom, setAllowedDomainsCustom] = useState('')

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 1. Auth User
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
      return
    }
      setUserId(user.id)
      setEmail(user.email || '')
      
      // 2. Public Profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (profile) {
        setNome(profile.full_name || '')
        setAvatarUrl(profile.avatar_url || '')
        // Load preferences from metadata if exists
        if (profile.metadata?.theme) setTema(profile.metadata.theme)
      }

      // 3. Project & API Keys
      // Tenta pegar do localStorage ou busca o primeiro do usuário
      const storedProjId = localStorage.getItem('currentProjectId')
      let projId = storedProjId

      if (!projId) {
        // Fallback: buscar primeiro projeto da organização do usuário
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .limit(1)
        if (projects && projects.length > 0) {
          projId = projects[0].id
          localStorage.setItem('currentProjectId', projId!)
        }
      }

      setCurrentProjectId(projId)

      if (projId) {
        const { data: project } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projId)
          .single()
          
        if (project) {
          setAllowedDomainsCustom(project.allowed_origins?.join('\n') || '')
        }
      }

      // 4. Organization & Billing
      if (profile?.default_org_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.default_org_id)
          .single()
          
        setOrgData(org)

        // Fetch active subscription details
        if (org?.subscription_id) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('*, plans(*)')
            .eq('id', org.subscription_id)
            .single()
          setSubscriptionData(sub)
        }
      }

    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar dados do usuário')
    } finally {
      setLoading(false)
    }
  }

  const aplicarTema = async (valor: 'auto' | 'claro' | 'escuro') => {
    setTema(valor)
    if (valor === 'auto') {
      document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      document.documentElement.classList.toggle('dark', valor === 'escuro')
    }
    localStorage.setItem('preferencias.tema', valor)
    
    // Persist preference
    if (userId) {
      await supabase.from('users').update({
        metadata: { theme: valor }
      }).eq('id', userId)
    }
    
    toast.success('Tema atualizado')
  }

  const salvarPerfil = async () => {
    if (!userId) return
    try {
      setSalvando(true)
      
      // Update Profile
      const { error } = await supabase
        .from('users')
        .update({
          full_name: nome,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar perfil')
      console.error(error)
    } finally {
      setSalvando(false)
    }
  }

  const salvarDominios = async () => {
    if (!currentProjectId) return
    try {
      setSalvando(true)
        const domainsArray = allowedDomainsCustom.split(/\s*,\s*|\n/).filter(d => d.trim() !== '')
      
      const { error } = await supabase
        .from('projects')
        .update({
          allowed_origins: domainsArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentProjectId)

      if (error) throw error
      
      toast.success('Domínios atualizados com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar domínios')
    } finally {
          setSalvando(false)
    }
  }

  if (loading) {
    return <div className="py-12 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className={cn("max-w-5xl mx-auto py-8 space-y-8", className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas preferências, chaves de API e assinatura.
                  </p>
                </div>
              </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4 h-auto p-1 bg-muted/50">
          <TabsTrigger value="account" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="w-4 h-4 mr-2" />
            Conta
          </TabsTrigger>
          <TabsTrigger value="security" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Shield className="w-4 h-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="preferences" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Palette className="w-4 h-4 mr-2" />
            Preferências
          </TabsTrigger>
          <TabsTrigger value="billing" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CreditCard className="w-4 h-4 mr-2" />
            Faturamento
          </TabsTrigger>
        </TabsList>

        {/* TAB: CONTA */}
        <TabsContent value="account" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Seus dados pessoais visíveis na plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-muted">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">Foto de Perfil</h3>
                    <p className="text-xs text-muted-foreground">
                      JPG ou PNG. Max 2MB. (Em breve)
                    </p>
                    <Button variant="outline" size="sm" disabled>Alterar foto</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={email}
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 bg-muted/10 flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Seu ID de usuário: <span className="font-mono">{userId}</span>
                </p>
                <Button onClick={salvarPerfil} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Origens Permitidas (CORS)</CardTitle>
                <CardDescription>
                  Domínios autorizados a enviar eventos e propagar UTMs para este projeto.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2 h-full flex flex-col">
                  <Label htmlFor="utms">Domínios permitidos (um por linha)</Label>
                  <Textarea
                    id="utms"
                    value={allowedDomainsCustom}
                    onChange={(e) => setAllowedDomainsCustom(e.target.value)}
                    className="font-mono text-sm flex-1 min-h-[120px] resize-none"
                    placeholder="exemplo.com&#10;checkout.pagamento.com"
                  />
                  <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 text-xs text-blue-700 dark:text-blue-300 mt-auto">
                    <Globe className="w-4 h-4" />
                    Isso habilita o rastreamento cross-domain e protege sua API.
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 bg-muted/10 flex justify-end">
                <Button onClick={salvarDominios} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar Domínios'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: SEGURANÇA */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Senha e Autenticação</CardTitle>
              <CardDescription>
                Gerencie como você acessa sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input id="new-password" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <Input id="confirm-password" type="password" placeholder="••••••••" />
                </div>
                  </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => toast.info('Enviaremos um email de redefinição.')}>
                  Redefinir por Email
                  </Button>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* TAB: PREFERÊNCIAS */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Personalize sua experiência visual.
              </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => aplicarTema('claro')}
                  className={cn(
                    "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground transition-all",
                    tema === 'claro' && "border-primary bg-accent shadow-sm"
                  )}
                >
                  <Sun className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Claro</span>
                </button>
                      <button
                  onClick={() => aplicarTema('escuro')}
                        className={cn(
                    "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground transition-all",
                    tema === 'escuro' && "border-primary bg-accent shadow-sm"
                  )}
                >
                  <Moon className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Escuro</span>
                </button>
                <button
                  onClick={() => aplicarTema('auto')}
                  className={cn(
                    "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground transition-all",
                    tema === 'auto' && "border-primary bg-accent shadow-sm"
                  )}
                >
                  <Laptop className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Sistema</span>
                      </button>
                </div>
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Controle o que enviamos para {email}.
              </CardDescription>
                </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium leading-none">Emails de marketing</span>
                  <span className="text-xs text-muted-foreground">
                    Novidades sobre recursos e dicas de otimização.
                  </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifEmail}
                      onChange={(e) => setNotifEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                      </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium leading-none">Alertas do sistema</span>
                  <span className="text-xs text-muted-foreground">
                    Avisos importantes sobre seus experimentos e pagamento.
                  </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSistema}
                      onChange={(e) => setNotifSistema(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
              </div>
                </CardContent>
              </Card>
        </TabsContent>

        {/* TAB: FATURAMENTO */}
        <TabsContent value="billing" className="space-y-6">
          <Card className={cn(
            "border-l-4",
            subscriptionData?.status === 'active' ? "border-l-green-500" : "border-l-yellow-500"
          )}>
            <CardHeader>
                  <div className="flex items-center justify-between">
                      <div>
                  <CardTitle className="flex items-center gap-2">
                    {subscriptionData?.plans?.name || orgData?.plan_slug || 'Plano Gratuito'}
                    {subscriptionData?.status === 'active' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Gerencie sua assinatura e método de pagamento.
                  </CardDescription>
                      </div>
                    </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscriptionData ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Valor</p>
                    <p className="text-2xl font-bold mt-1">
                      R$ {((subscriptionData.price_amount || 0) / 100).toFixed(2).replace('.', ',')}
                      <span className="text-sm font-normal text-muted-foreground">/{subscriptionData.billing_cycle === 'monthly' ? 'mês' : 'ano'}</span>
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Próxima cobrança</p>
                    <p className="text-2xl font-bold mt-1">
                      {subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                    <p className="text-xl font-bold mt-1 capitalize">{subscriptionData.status === 'active' ? 'Em dia' : subscriptionData.status}</p>
                  </div>
            </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 bg-muted/30 rounded-lg border border-dashed">
                  <CreditCard className="w-10 h-10 text-muted-foreground/50" />
                  <div>
                    <p className="font-medium">Nenhuma assinatura ativa encontrada</p>
                    <p className="text-sm text-muted-foreground">Você está usando o plano gratuito ou trial.</p>
                  </div>
                  <Button variant="default" size="sm">Fazer Upgrade</Button>
                </div>
              )}
              
              {subscriptionData && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recursos do seu plano</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Experimentos ilimitados</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Suporte prioritário</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> API Access</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Membros ilimitados</li>
                  </ul>
          </div>
        )}
            </CardContent>
            {subscriptionData && (
              <CardFooter className="border-t px-6 py-4 bg-muted/10 flex justify-between">
                <Button variant="outline" size="sm">Histórico de faturas</Button>
                <Button variant="default" size="sm">Gerenciar Assinatura (Kiwify)</Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
