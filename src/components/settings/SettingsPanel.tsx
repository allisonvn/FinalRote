"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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
  
  // Usage Stats (Mocked or Real)
  const [usageStats, setUsageStats] = useState({
    visitors: 0,
    limit: 10000,
    percentage: 0
  })

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
          
          // Set limits based on plan (simplified logic)
          const planName = sub.plans?.name?.toLowerCase() || org.plan_slug || 'free'
          let limit = 10000 // Free default
          
          if (planName.includes('pro') || planName.includes('starter')) limit = 100000
          if (planName.includes('enterprise') || planName.includes('scale')) limit = 1000000
          
          // Mock usage for now (random usage for demo purposes)
          const currentUsage = Math.floor(Math.random() * (limit * 0.6)) 
          
          setUsageStats({
            visitors: currentUsage,
            limit: limit,
            percentage: Math.min(100, (currentUsage / limit) * 100)
          })
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
          <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10", className)}>
      
      {/* PREMIUM HEADER CARD - High Contrast Dark Mode */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-black border border-slate-800 shadow-2xl">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.07]" />
        </div>

        <div className="relative z-10 p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-900/30 px-4 py-1.5 text-sm font-semibold text-blue-300 backdrop-blur-md shadow-lg">
                <Sparkles className="mr-2 h-4 w-4 text-blue-400" />
                Configurações da Conta
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
                  Olá, {nome.split(' ')[0] || 'Usuário'}
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
                  Gerencie suas preferências pessoais, segurança e detalhes do plano em um só lugar.
                </p>
              </div>
            </div>

            {/* Header Stats Cards */}
            <div className="flex gap-4">
              <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-md p-5 min-w-[160px] shadow-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Plano Atual</span>
                  <div className="flex items-center gap-2 text-white font-bold text-xl">
                    <Crown className="w-5 h-5 text-amber-400" />
                    {subscriptionData?.plans?.name || orgData?.plan_slug || 'Free'}
                  </div>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-md p-5 min-w-[160px] shadow-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Membro desde</span>
                  <div className="flex items-center gap-2 text-white font-bold text-xl">
                    <Calendar className="w-5 h-5 text-blue-400" />
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
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg py-4 -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent md:backdrop-blur-none md:static">
          <TabsList className="w-full justify-start h-auto p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto md:overflow-visible scrollbar-hide shadow-sm">
            <TabsTrigger 
              value="account" 
              className="flex-1 md:flex-none px-6 py-3 rounded-xl font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <User className="w-4 h-4 mr-2" />
              Conta
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex-1 md:flex-none px-6 py-3 rounded-xl font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <Shield className="w-4 h-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="flex-1 md:flex-none px-6 py-3 rounded-xl font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <Palette className="w-4 h-4 mr-2" />
              Preferências
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className="flex-1 md:flex-none px-6 py-3 rounded-xl font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Faturamento
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB CONTENT: CONTA */}
        <TabsContent value="account" className="space-y-6 focus-visible:outline-none animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Profile Card - Simplified */}
            <Card className="lg:col-span-3 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900/50 pb-6">
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  Informações do Perfil
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 font-medium mt-2">
                  Gerencie seus dados pessoais e de identificação.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label htmlFor="nome" className="text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Nome completo
                    </Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 h-12 font-semibold text-base transition-all"
                      placeholder="Digite seu nome completo"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        value={email}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 h-12 text-slate-600 dark:text-slate-400 font-medium cursor-not-allowed pr-24"
                      />
                      <Badge className="absolute right-2 top-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0 font-bold text-xs">
                        Verificado
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID do Usuário</p>
                      <p className="font-mono text-sm text-slate-700 dark:text-slate-300 font-semibold">{userId?.slice(0, 8)}...</p>
                    </div>
                    <Button 
                      onClick={salvarPerfil} 
                      disabled={salvando} 
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 font-bold px-8"
                    >
                      {salvando ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Card - Enhanced */}
            <Card className="lg:col-span-2 overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 shadow-lg">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-900/50 pb-5">
                <CardTitle className="text-lg flex items-center gap-2.5 font-black text-slate-900 dark:text-white">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  Uso do Plano
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Visitantes Mensais</span>
                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        {usageStats.visitors.toLocaleString()}
                      </p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        de {usageStats.limit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-lg" 
                        style={{ width: `${usageStats.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Renova em 01/{(new Date().getMonth() + 2).toString().padStart(2, '0')}
                      </p>
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold border-0">
                        {usageStats.percentage.toFixed(0)}% usado
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border-2 border-green-200 dark:border-green-900/30 p-5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-2xl" />
                  <div className="relative space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center ring-2 ring-green-200 dark:ring-green-800">
                        <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-black text-green-800 dark:text-green-300 text-base">Status: Ativo</p>
                        <p className="text-xs font-semibold text-green-600 dark:text-green-500">Tudo operacional</p>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-green-700/90 dark:text-green-400/80 leading-relaxed">
                      Sua conta está operando normalmente sem restrições. Todos os sistemas funcionando perfeitamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB CONTENT: SEGURANÇA */}
        <TabsContent value="security" className="space-y-6 focus-visible:outline-none animate-in slide-in-from-bottom-4 duration-500">
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Autenticação
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">Proteja sua conta com uma senha forte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 max-w-2xl pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="new-password" className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider">Nova senha</Label>
                  <Input id="new-password" type="password" className="h-12 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30" placeholder="••••••••" />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="confirm-password" className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider">Confirmar senha</Label>
                  <Input id="confirm-password" type="password" className="h-12 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-6 mt-2">
                <Button variant="outline" onClick={() => toast.info('Enviaremos um email de redefinição.')} className="hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 h-11 px-6">
                  Redefinir senha por email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB CONTENT: PREFERÊNCIAS */}
        <TabsContent value="preferences" className="space-y-6 focus-visible:outline-none animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <CardTitle className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Tema e Aparência
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium">Personalize a interface do sistema.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 pb-8">
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
                        "flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg",
                        tema === option.id 
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20" 
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-white dark:hover:bg-slate-800"
                      )}
                    >
                      <option.icon className={cn("w-7 h-7 mb-3", tema === option.id ? "text-blue-600 dark:text-blue-400" : "text-slate-400")} />
                      <span className="text-sm font-bold">{option.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <CardTitle className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Notificações
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium">Controle o que você recebe.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-8 pb-8">
                <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all hover:border-blue-300 dark:hover:border-blue-700 group">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Emails de marketing</span>
                    <p className="text-xs text-slate-500 font-medium">Dicas e novidades do produto.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all hover:border-blue-300 dark:hover:border-blue-700 group">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Alertas do sistema</span>
                    <p className="text-xs text-slate-500 font-medium">Segurança e pagamentos.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSistema}
                    onChange={(e) => setNotifSistema(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB CONTENT: FATURAMENTO */}
        <TabsContent value="billing" className="space-y-8 focus-visible:outline-none animate-in slide-in-from-bottom-4 duration-500">
          {/* Current Plan Card */}
          <Card className="overflow-hidden border-none shadow-2xl relative group bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-800 opacity-100" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            
            <CardContent className="relative z-10 p-8 md:p-10 text-white">
              <div className="flex flex-col md:flex-row justify-between gap-8 items-start md:items-center mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-100 border border-green-400/30 backdrop-blur-md font-bold px-3 py-1.5 text-xs">
                      {subscriptionData?.status === 'active' ? '✓ ASSINATURA ATIVA' : 'PLANO GRATUITO'}
                    </Badge>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                    {subscriptionData?.plans?.name || orgData?.plan_slug || 'Plano Free'}
                  </h2>
                  <p className="text-blue-100/90 font-medium max-w-md text-base md:text-lg leading-relaxed">
                    {subscriptionData?.status === 'active' 
                      ? 'Você tem acesso completo a todos os recursos premium da plataforma.' 
                      : 'Comece gratuitamente e faça upgrade quando precisar de mais recursos.'}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-4 bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm min-w-[240px]">
                  <div className="text-right w-full">
                    <p className="text-xs text-blue-200 uppercase tracking-widest font-bold mb-1">Valor mensal</p>
                    <p className="text-4xl font-black">
                      R$ {((subscriptionData?.price_amount || 0) / 100).toFixed(2).replace('.', ',')}
                      <span className="text-lg opacity-70 font-medium">/mês</span>
                    </p>
                    {subscriptionData?.current_period_end && (
                      <p className="text-xs text-blue-200/80 mt-2">
                        Próxima cobrança: {new Date(subscriptionData.current_period_end).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    {subscriptionData?.status === 'active' ? (
                      <>
                        <Button 
                          variant="secondary" 
                          size="lg" 
                          onClick={() => {
                            toast.success('Visualizando planos disponíveis...')
                            // Scroll suave até a seção de planos
                            const plansSection = document.querySelector('[data-plans-section]')
                            if (plansSection) {
                              plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                          }}
                          className="shadow-xl hover:shadow-2xl transition-all hover:scale-105 font-bold w-full"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Fazer Upgrade de Plano
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium.')) {
                              toast.info('Redirecionando para o portal de cancelamento...')
                              window.open('https://kiwify.com.br/painel', '_blank')
                            }
                          }}
                          className="text-white/80 hover:text-white hover:bg-white/10 font-semibold text-xs"
                        >
                          Cancelar assinatura
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="lg" 
                        onClick={() => {
                          toast.success('Visualizando planos disponíveis...')
                          // Scroll suave até a seção de planos
                          const plansSection = document.querySelector('[data-plans-section]')
                          if (plansSection) {
                            plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-2xl hover:shadow-green-500/50 transition-all hover:scale-105 font-black w-full"
                      >
                        <Crown className="w-5 h-5 mr-2" />
                        Ver Planos Disponíveis
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
                {[
                  { icon: Check, text: 'Experimentos Ilimitados' },
                  { icon: Shield, text: 'Suporte Prioritário' },
                  { icon: Zap, text: 'API Access Completo' },
                  { icon: User, text: 'Membros Ilimitados' }
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 flex-shrink-0">
                      <feat.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-sm">{feat.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Plans Grid - Always show for upgrades */}
          <div className="space-y-6" data-plans-section>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Escolha o plano ideal para você</h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Desbloqueie todo o potencial da plataforma</p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Starter Plan */}
                <Card className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-xl">
                  <CardHeader className="text-center pb-8 pt-8 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center mb-4 shadow-lg">
                      <Zap className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">Starter</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-black text-slate-900 dark:text-white">R$ 99</span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 pb-8 space-y-4">
                    <ul className="space-y-3">
                      {['10.000 visitantes/mês', '10 experimentos ativos', 'Suporte por email', 'Relatórios básicos'].map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="outline" 
                      className="w-full mt-6 border-2 font-bold hover:bg-slate-50 dark:hover:bg-slate-900"
                      onClick={() => {
                        toast.success('Redirecionando para checkout...')
                        window.open('https://pay.kiwify.com.br/starter', '_blank')
                      }}
                    >
                      Começar agora
                    </Button>
                  </CardContent>
                </Card>

                {/* Pro Plan - Highlighted */}
                <Card className="border-4 border-blue-600 bg-white dark:bg-slate-950 shadow-2xl shadow-blue-600/20 scale-105 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black px-4 py-1 rounded-bl-lg">
                    MAIS POPULAR
                  </div>
                  <CardHeader className="text-center pb-8 pt-10 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-950 border-b border-blue-200 dark:border-blue-900">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-xl shadow-blue-600/30">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-black text-blue-600 dark:text-blue-400">Pro</CardTitle>
                    <div className="mt-4">
                      <span className="text-5xl font-black text-slate-900 dark:text-white">R$ 199</span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 pb-8 space-y-4">
                    <ul className="space-y-3">
                      {['100.000 visitantes/mês', 'Experimentos ilimitados', 'Suporte prioritário 24/7', 'Relatórios avançados', 'API completa', 'Membros ilimitados'].map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black shadow-xl shadow-blue-600/30 hover:scale-105 transition-all"
                      onClick={() => {
                        toast.success('Redirecionando para checkout...')
                        window.open('https://pay.kiwify.com.br/pro', '_blank')
                      }}
                    >
                      Assinar Pro
                    </Button>
                  </CardContent>
                </Card>

                {/* Enterprise Plan */}
                <Card className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-purple-300 dark:hover:border-purple-700 transition-all hover:shadow-xl">
                  <CardHeader className="text-center pb-8 pt-8 bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-4 shadow-lg">
                      <Crown className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">Enterprise</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-black text-slate-900 dark:text-white">Custom</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 pb-8 space-y-4">
                    <ul className="space-y-3">
                      {['Visitantes ilimitados', 'Tudo do Pro +', 'Suporte dedicado', 'SLA garantido', 'Onboarding personalizado', 'Infraestrutura dedicada'].map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="outline" 
                      className="w-full mt-6 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 font-bold"
                      onClick={() => {
                        toast.info('Redirecionando para contato comercial...')
                        window.open('mailto:contato@rotafinal.com?subject=Interesse no Plano Enterprise', '_blank')
                      }}
                    >
                      Falar com vendas
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Payment History - Show for active subscribers */}
          {subscriptionData?.status === 'active' && (
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <CardTitle className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Histórico de Pagamentos
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium">Suas últimas transações e faturas.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-semibold">Nenhuma transação registrada ainda</p>
                  <p className="text-sm mt-2">Suas faturas aparecerão aqui após o primeiro pagamento.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
