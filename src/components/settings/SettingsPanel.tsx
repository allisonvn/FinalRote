"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  User,
  Lock,
  Bell,
  CreditCard,
  Moon,
  Sun,
  Laptop,
  Check,
  Shield,
  Palette,
  Sparkles,
  Zap,
  Crown,
  Calendar
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
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  
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
      setCreatedAt(user.created_at)
      
      // 2. Public Profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (profile) {
        setNome(profile.full_name || '')
        setAvatarUrl(profile.avatar_url || '')
        if (profile.metadata?.theme) setTema(profile.metadata.theme)
      }

      // 3. Project
      const storedProjId = localStorage.getItem('currentProjectId')
      let projId = storedProjId

      if (!projId) {
        const { data: projects } = await supabase.from('projects').select('id').limit(1)
        if (projects && projects.length > 0) {
          projId = projects[0].id
          localStorage.setItem('currentProjectId', projId!)
        }
      }
      setCurrentProjectId(projId)

      // 4. Organization & Billing
      if (profile?.default_org_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.default_org_id)
          .single()
          
        setOrgData(org)

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
      toast.error('Erro ao carregar dados')
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

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500", className)}>
      
      {/* PREMIUM HEADER CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 shadow-2xl border border-white/10">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] opacity-50" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] opacity-30" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
                  </div>

        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300 backdrop-blur-md">
                <Sparkles className="mr-2 h-3.5 w-3.5 text-blue-400 animate-pulse" />
                Configurações da Conta
                </div>
                <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Olá, {nome.split(' ')[0] || 'Usuário'}
                  </h1>
                <p className="text-slate-400 mt-2 text-lg max-w-xl">
                  Gerencie suas preferências pessoais, segurança e detalhes do plano em um só lugar.
                  </p>
                </div>
              </div>

            {/* Header Stats Cards */}
            <div className="flex gap-3">
              <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-4 min-w-[140px]">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Plano Atual</span>
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <Crown className="w-4 h-4 text-amber-400" />
                    {subscriptionData?.plans?.name || orgData?.plan_slug || 'Free'}
                  </div>
                  </div>
                </div>

              <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-4 min-w-[140px]">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Membro desde</span>
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    {createdAt ? new Date(createdAt).getFullYear() : '2024'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg py-4 -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent md:backdrop-blur-none md:static">
          <TabsList className="w-full justify-start h-auto p-1 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl overflow-x-auto md:overflow-visible scrollbar-hide">
            <TabsTrigger 
              value="account" 
              className="flex-1 md:flex-none px-6 py-3 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg transition-all duration-300"
            >
              <User className="w-4 h-4 mr-2" />
              Conta
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex-1 md:flex-none px-6 py-3 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Shield className="w-4 h-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="flex-1 md:flex-none px-6 py-3 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Palette className="w-4 h-4 mr-2" />
              Preferências
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className="flex-1 md:flex-none px-6 py-3 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg transition-all duration-300"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Faturamento
            </TabsTrigger>
          </TabsList>
      </div>

        {/* TAB CONTENT: CONTA */}
        <TabsContent value="account" className="space-y-6 focus-visible:outline-none animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Card */}
            <Card className="md:col-span-2 overflow-hidden border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="h-24 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-slate-100 dark:border-slate-800" />
              <div className="px-8 -mt-12 mb-6 relative">
                <div className="h-24 w-24 rounded-2xl bg-white dark:bg-slate-900 p-1 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
                  <div className="h-full w-full rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
              
              <CardContent className="space-y-6 px-8 pb-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-slate-600 dark:text-slate-400 font-medium">Nome completo</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 h-11 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-600 dark:text-slate-400 font-medium">Email</Label>
                    <div className="relative">
                    <Input
                        id="email"
                      value={email}
                      disabled
                        className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-11 text-slate-500"
                    />
                      <div className="absolute right-3 top-3 text-green-500 tooltip" title="Verificado">
                        <Check className="w-4 h-4" />
                  </div>
                </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-8 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <p className="text-xs text-slate-500 font-mono">ID: {userId?.slice(0, 8)}...</p>
                <Button onClick={salvarPerfil} disabled={salvando} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </CardFooter>
            </Card>

            {/* Info Card */}
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950/50 backdrop-blur-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Status da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Reputação</span>
                    <span className="text-sm font-bold text-green-500">Excelente</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[95%] bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="text-sm text-slate-500 leading-relaxed">
                  Sua conta está totalmente verificada e sem restrições. Aproveite todos os recursos do seu plano.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB CONTENT: SEGURANÇA */}
        <TabsContent value="security" className="space-y-6 focus-visible:outline-none animate-in slide-in-from-bottom-4 duration-500">
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                Autenticação
              </CardTitle>
              <CardDescription>Proteja sua conta com uma senha forte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input id="new-password" type="password" className="h-11" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <Input id="confirm-password" type="password" className="h-11" placeholder="••••••••" />
                </div>
                  </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => toast.info('Enviaremos um email de redefinição.')} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  Redefinir senha por email
                  </Button>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* TAB CONTENT: PREFERÊNCIAS */}
        <TabsContent value="preferences" className="space-y-6 focus-visible:outline-none animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-500" />
                  Tema e Aparência
                </CardTitle>
                <CardDescription>Personalize a interface do sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'claro', icon: Sun, label: 'Claro' },
                    { id: 'escuro', icon: Moon, label: 'Escuro' },
                    { id: 'auto', icon: Laptop, label: 'Sistema' }
                    ].map((option) => (
                      <button
                      key={option.id}
                      onClick={() => aplicarTema(option.id as any)}
                        className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105",
                        tema === option.id 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10" 
                          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700"
                      )}
                    >
                      <option.icon className={cn("w-6 h-6 mb-3", tema === option.id && "animate-pulse")} />
                      <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Notificações
                </CardTitle>
                <CardDescription>Controle o que você recebe.</CardDescription>
                </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <span className="font-medium text-sm">Emails de marketing</span>
                    <p className="text-xs text-slate-500">Dicas e novidades do produto.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifEmail}
                      onChange={(e) => setNotifEmail(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                      </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <span className="font-medium text-sm">Alertas do sistema</span>
                    <p className="text-xs text-slate-500">Segurança e pagamentos.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSistema}
                      onChange={(e) => setNotifSistema(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                </div>
                </CardContent>
              </Card>
          </div>
        </TabsContent>

        {/* TAB CONTENT: FATURAMENTO */}
        <TabsContent value="billing" className="space-y-6 focus-visible:outline-none animate-in slide-in-from-bottom-4 duration-500">
          <Card className="overflow-hidden border-none shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-95" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            
            <CardContent className="relative z-10 p-8 text-white">
              <div className="flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                      {subscriptionData?.status === 'active' ? 'Assinatura Ativa' : 'Plano Gratuito'}
                    </Badge>
                  </div>
                  <h2 className="text-4xl font-bold">
                    {subscriptionData?.plans?.name || orgData?.plan_slug || 'Plano Básico'}
                  </h2>
                  <p className="text-blue-100 max-w-md">
                    {subscriptionData?.status === 'active' 
                      ? 'Obrigado por ser um membro Pro! Você tem acesso a todos os recursos.' 
                      : 'Faça upgrade para desbloquear experimentos ilimitados.'}
                  </p>
                  </div>

                <div className="flex flex-col items-end gap-4">
                  <div className="text-right">
                    <p className="text-sm text-blue-200 uppercase tracking-wider font-medium">Valor mensal</p>
                    <p className="text-3xl font-bold">
                      R$ {((subscriptionData?.price_amount || 0) / 100).toFixed(2).replace('.', ',')}
                      <span className="text-lg opacity-70 font-normal">/mês</span>
                    </p>
                  </div>
                  <Button variant="secondary" size="lg" className="shadow-xl hover:shadow-2xl transition-all hover:scale-105 font-semibold">
                    Gerenciar Assinatura
                  </Button>
                </div>
                    </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/20">
                {[
                  'Experimentos Ilimitados',
                  'Suporte Prioritário',
                  'API Access',
                  'Membros Ilimitados'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{feat}</span>
                  </div>
                ))}
                  </div>
                </CardContent>
              </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
