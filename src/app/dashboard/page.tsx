"use client"

import { useEffect, useRef, useState } from 'react'
import { Plus, BarChart3, Users, Target, TrendingUp, Activity, Settings, LogOut, MoreHorizontal, ArrowUpDown, Zap, Database, ArrowRight, ArrowLeft, Check, X, Globe, Eye, Clock, ChevronDown, Calendar, AlertCircle, MousePointer, Play, Pause, Flag, Layout, Trash2, Copy, Shuffle, Code, Lightbulb, Star, Filter, Upload, Sun, Moon, Shield, Bell, KeyRound, Globe2, User2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { ChartsSection } from '@/components/dashboard/charts-section'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Variant { id: string; name: string; key: string; is_control: boolean; url?: string; description?: string }
interface Experiment {
  id: string
  name: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  created_at: string
  variants?: Variant[]
  // Configurações estendidas
  description?: string
  algorithm?: 'uniform' | 'thompson_sampling' | 'ucb1'
  target_url?: string
  goal_type?: 'page_view' | 'click' | 'form_submit' | 'custom'
  goal_value?: string
  duration_days?: number
  traffic_allocation?: number
  test_type?: 'split_url' | 'visual' | 'feature_flag'
  tags?: string[]
  min_sample_size?: number
  project_id?: string
}
interface Stats { activeExperiments: number; totalVisitors: number; conversionRate: number }

export default function Dashboard() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  // Projetos removidos
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'draft' | 'paused' | 'completed'>('all')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [sort, setSort] = useState<{ key: 'name' | 'created' | 'status'; dir: 'asc' | 'desc' }>({ key: 'created', dir: 'desc' })
  const [stats, setStats] = useState<Stats>({ activeExperiments: 0, totalVisitors: 0, conversionRate: 0 })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newForm, setNewForm] = useState<{ name: string; variants: number }>({ name: '', variants: 2 })
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [projectFilter, setProjectFilter] = useState<'all' | string>('all')
  const [projects, setProjects] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [drawerTab, setDrawerTab] = useState<'details'|'code'|'timeline'>('details')
  // Filtro por múltiplas tags
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [clickPickerActive, setClickPickerActive] = useState(false)
  const [clickPickerHighlight, setClickPickerHighlight] = useState<HTMLElement | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [layout, setLayout] = useState<'grid'|'list'>('grid')
  const [groupBy, setGroupBy] = useState<'none'|'project'|'tag'>('none')
  const [savedViews, setSavedViews] = useState<Array<{ id: string; name: string; config: any; created_at: string }>>([])
  const [activeViewId, setActiveViewId] = useState<string>('')
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [newTagValue, setNewTagValue] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [tagHighlightIndex, setTagHighlightIndex] = useState<number>(0)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  
  const supabase = createClient()

  // Estado da aba Configurações (render dentro do dashboard)
  const [cfgNome, setCfgNome] = useState('Usuário Demo')
  const [cfgEmail] = useState('demo@rotafinal.com')
  const [cfgTema, setCfgTema] = useState<'auto'|'claro'|'escuro'>('auto')
  const [cfgIdioma, setCfgIdioma] = useState<'pt-BR'>('pt-BR')
  const [cfgNotifEmail, setCfgNotifEmail] = useState(true)
  const [cfgNotifSistema, setCfgNotifSistema] = useState(true)
  const [cfgApiKey, setCfgApiKey] = useState('rf_live_' + Math.random().toString(36).slice(2, 10))
  const [cfgSalvando, setCfgSalvando] = useState(false)
  
  // Close action menus on outside click
  useEffect(() => {
    if (!menuOpen) return
    const onClick = () => setMenuOpen(null)
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [menuOpen])

  // Persist favorites locally
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pinnedExperiments')
      if (saved) setPinnedIds(JSON.parse(saved))
      const savedTags = localStorage.getItem('filters.tags')
      if (savedTags) setTagFilters(JSON.parse(savedTags))
      const views = localStorage.getItem('dashboard.savedViews')
      if (views) setSavedViews(JSON.parse(views))
      const activeView = localStorage.getItem('dashboard.activeViewId')
      if (activeView) setActiveViewId(activeView)
      const storedTema = localStorage.getItem('preferencias.tema') as 'auto'|'claro'|'escuro' | null
      const storedIdioma = localStorage.getItem('preferencias.idioma') as 'pt-BR' | null
      if (storedTema) setCfgTema(storedTema)
      if (storedIdioma) setCfgIdioma(storedIdioma)
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem('pinnedExperiments', JSON.stringify(pinnedIds))
      localStorage.setItem('filters.tags', JSON.stringify(tagFilters))
      localStorage.setItem('dashboard.savedViews', JSON.stringify(savedViews))
      localStorage.setItem('dashboard.activeViewId', activeViewId)
    } catch {}
  }, [pinnedIds, tagFilters, savedViews, activeViewId])

  useEffect(() => {
    // Reset campo de nova tag ao abrir outro experimento
    setNewTagValue('')
  }, [selectedExperiment?.id])

  // Carregar projetos acessíveis do usuário autenticado
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session?.user) return
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .order('created_at', { ascending: false })
        if (error) {
          console.error('Erro ao carregar projetos:', error)
          return
        }
        setProjects(data || [])
      } catch (err) {
        console.error('Erro ao buscar projetos:', err)
      }
    }
    loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleGroupCollapsed = (key: string) => {
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderSettingsContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua conta, preferências e integrações</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User2 className="w-4 h-4" /> Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <Input value={cfgNome} onChange={(e) => setCfgNome(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={cfgEmail} disabled className="mt-1" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={salvarCfg} disabled={cfgSalvando}>{cfgSalvando ? 'Salvando...' : 'Salvar alterações'}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Senha atual</label>
                  <Input type="password" className="mt-1" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-sm font-medium">Nova senha</label>
                  <Input type="password" className="mt-1" placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label className="text-sm font-medium">Confirmar</label>
                  <Input type="password" className="mt-1" placeholder="Repita a senha" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => toast.info('Em breve: alteração de senha')}>Atualizar senha</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe2 className="w-4 h-4" /> Preferências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tema</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Button variant={cfgTema==='auto'?'default':'outline'} onClick={() => aplicarTema('auto')} className="w-full flex items-center gap-2">
                    <Sun className="w-4 h-4" /> Automático
                  </Button>
                  <Button variant={cfgTema==='claro'?'default':'outline'} onClick={() => aplicarTema('claro')} className="w-full flex items-center gap-2">
                    <Sun className="w-4 h-4" /> Claro
                  </Button>
                  <Button variant={cfgTema==='escuro'?'default':'outline'} onClick={() => aplicarTema('escuro')} className="w-full flex items-center gap-2">
                    <Moon className="w-4 h-4" /> Escuro
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Idioma</label>
                <Select value={cfgIdioma} onValueChange={(v) => setCfgIdioma(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Notificações</label>
                <div className="mt-2 space-y-2 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={cfgNotifEmail} onChange={(e) => setCfgNotifEmail(e.target.checked)} /> Email</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={cfgNotifSistema} onChange={(e) => setCfgNotifSistema(e.target.checked)} /> Notificações do sistema</label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Integrações & API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Chave de API</label>
                <div className="mt-2 flex items-center gap-2">
                  <Input value={cfgApiKey} readOnly className="font-mono" />
                  <Button variant="outline" onClick={copiarChave}><Copy className="w-4 h-4 mr-1" /> Copiar</Button>
                  <Button variant="outline" onClick={regenerarChave}><RefreshCw className="w-4 h-4 mr-1" /> Regenerar</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Guarde sua chave com segurança. Ela permite acesso aos recursos da API.</p>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bell className="w-4 h-4" />
                  Receba alertas semanais sobre seus experimentos por email
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const exportJSON = () => {
    try {
      const dataStr = JSON.stringify(sorted.map(e => ({
        id: e.id,
        nome: e.name,
        status: e.status,
        projeto: getProjectName(e.project_id) || null,
        metodo: e.test_type || null,
        algoritmo: e.algorithm || null,
        url_alvo: e.target_url || null,
        meta_tipo: e.goal_type || null,
        meta_valor: e.goal_value || null,
        duracao_dias: e.duration_days || null,
        alocacao_trafego: e.traffic_allocation || null,
        variantes: (e.variants||[]).map(v => ({ nome: v.name, controle: v.is_control, url: v.url || null })),
        tags: e.tags || []
      })), null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'experimentos.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) { toast.error('Falha ao exportar JSON') }
  }
  const exportCSV = () => {
    try {
      const headers = ['id','nome','status','metodo','meta_tipo','meta_valor','algoritmo','url_alvo','variantes','urls_variantes','tags']
      const rows = sorted.map(e => [
        e.id,
        '"' + (e.name||'').replace(/"/g,'""') + '"',
        e.status,
        // coluna projeto removida,
        e.test_type || '',
        e.goal_type || '',
        '"' + (e.goal_value || '').replace(/"/g,'""') + '"',
        e.algorithm || '',
        '"' + (e.target_url || '').replace(/"/g,'""') + '"',
        String(e.variants?.length||0),
        '"' + ((e.variants||[]).map(v => `${v.name}:${v.url||''}`).join('|').replace(/"/g,'""')) + '"',
        '"' + ((e.tags||[]).join('|').replace(/"/g,'""')) + '"'
      ].join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'experimentos.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) { toast.error('Falha ao exportar CSV') }
  }

  // Relatório CSV com link de código (data URL)
  const exportReportCSV = () => {
    try {
      const headers = ['id','nome','status','projeto','meta_tipo','meta_valor','link_codigo_html']
      const rows = sorted.map(e => {
        const code = generateInstallCodeForExperiment(e)
        const html = `<!doctype html>\n<html><head><meta charset=\"utf-8\"/><title>${(e.name||'').replace(/"/g,'""')}</title></head><body>\n${code}\n</body></html>`
        const base64 = btoa(unescape(encodeURIComponent(html)))
        const dataUrl = `data:text/html;base64,${base64}`
        return [
          e.id,
          '"' + (e.name||'').replace(/"/g,'""') + '"',
          e.status,
          e.goal_type || '',
          '"' + (e.goal_value || '').replace(/"/g,'""') + '"',
          '"' + dataUrl + '"'
        ].join(',')
      })
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'relatorio_experimentos.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) { toast.error('Falha ao exportar relatório') }
  }

  // Ações da aba Configurações
  const aplicarTema = (valor: 'auto'|'claro'|'escuro') => {
    setCfgTema(valor)
    if (valor === 'auto') {
      document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      document.documentElement.classList.toggle('dark', valor === 'escuro')
    }
    localStorage.setItem('preferencias.tema', valor)
    toast.success('Tema atualizado')
  }
  const salvarCfg = async () => {
    try {
      setCfgSalvando(true)
      localStorage.setItem('preferencias.idioma', cfgIdioma)
      toast.success('Configurações salvas com sucesso')
    } catch {
      toast.error('Não foi possível salvar as configurações')
    } finally {
      setCfgSalvando(false)
    }
  }
  const copiarChave = async () => {
    try { await navigator.clipboard.writeText(cfgApiKey); toast.success('Chave copiada') } catch { toast.error('Falha ao copiar chave') }
  }
  const regenerarChave = () => { const nova = 'rf_live_' + Math.random().toString(36).slice(2, 12); setCfgApiKey(nova); toast.success('Nova chave gerada') }

  const saveCurrentView = () => {
    const name = window.prompt('Nome da visão (ex.: Ativos • LP)')?.trim()
    if (!name) return
    const id = `view_${Date.now()}`
    const config = { statusFilter, tagFilters, sort, layout, groupBy }
    const item = { id, name, config, created_at: new Date().toISOString() }
    setSavedViews(prev => [item, ...prev])
    setActiveViewId(id)
    toast.success('Visão salva')
  }
  const applyView = (id: string) => {
    const v = savedViews.find(x => x.id === id)
    if (!v) return
    const cfg = v.config || {}
    setStatusFilter(cfg.statusFilter ?? 'all')
    // projeto removido
    setTagFilters(cfg.tagFilters ?? [])
    setSort(cfg.sort ?? { key: 'created', dir: 'desc' })
    setLayout(cfg.layout ?? 'grid')
    setGroupBy(cfg.groupBy ?? 'none')
    setActiveViewId(id)
    toast.success(`Visão "${v.name}" aplicada`)
  }
  const deleteActiveView = () => {
    if (!activeViewId) return
    const v = savedViews.find(x => x.id === activeViewId)
    if (v && !window.confirm(`Excluir a visão "${v.name}"?`)) return
    setSavedViews(prev => prev.filter(x => x.id !== activeViewId))
    setActiveViewId('')
    toast.success('Visão excluída')
  }
  
  // Modal management
  const modalRef = useRef<HTMLDivElement | null>(null)
  const step1NameRef = useRef<HTMLInputElement | null>(null)
  const step2UrlRef = useRef<HTMLInputElement | null>(null)
  const step3Variant0Ref = useRef<HTMLInputElement | null>(null)
  const step4GoalRef = useRef<HTMLInputElement | null>(null)

  // Estilos estáticos para o stepper por cor (evita classes dinâmicas que o Tailwind não compila)
  const stepColorStyles: Record<'blue' | 'green' | 'purple' | 'orange' | 'red', { active: string; completed: string; labelActive: string; labelCompleted: string }> = {
    blue: {
      active: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100 dark:ring-blue-500/30',
      completed: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30',
      labelActive: 'text-blue-600 dark:text-blue-400',
      labelCompleted: 'text-blue-500 dark:text-blue-400',
    },
    green: {
      active: 'bg-green-500 text-white shadow-lg shadow-green-500/30 ring-4 ring-green-100 dark:ring-green-500/30',
      completed: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30',
      labelActive: 'text-green-600 dark:text-green-400',
      labelCompleted: 'text-green-500 dark:text-green-400',
    },
    purple: {
      active: 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 ring-4 ring-purple-100 dark:ring-purple-500/30',
      completed: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-500/30',
      labelActive: 'text-purple-600 dark:text-purple-400',
      labelCompleted: 'text-purple-500 dark:text-purple-400',
    },
    orange: {
      active: 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 ring-4 ring-orange-100 dark:ring-orange-500/30',
      completed: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-500/30',
      labelActive: 'text-orange-600 dark:text-orange-400',
      labelCompleted: 'text-orange-500 dark:text-orange-400',
    },
    red: {
      active: 'bg-red-500 text-white shadow-lg shadow-red-500/30 ring-4 ring-red-100 dark:ring-red-500/30',
      completed: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30',
      labelActive: 'text-red-600 dark:text-red-400',
      labelCompleted: 'text-red-500 dark:text-red-400',
    },
  }

  // reuse top-level supabase instance
  
  // New experiment modal states
  const [experimentStep, setExperimentStep] = useState(1)
  const [experimentForm, setExperimentForm] = useState({
    // Step 1: Basic Info
    name: '',
    description: '',
    
    // Step 2: Test Setup
    targetUrl: '',
    testType: 'split_url', // 'split_url', 'visual', 'feature_flag'
    audienceType: 'all', // 'all', 'returning', 'custom'
    trafficAllocation: 100,
    
    // Step 3: Variants
    variants: [
      { name: 'Original', description: 'Versão atual da sua página', url: '', isControl: true },
      { name: 'Variação A', description: 'Nova versão para testar', url: '', isControl: false }
    ],
    
    // Step 4: Conversion Setup (NEW)
    conversionType: 'page_view', // 'page_view', 'click', 'form_submit', 'custom'
    conversionUrl: '', // URL da página de conversão/obrigado
    conversionSelector: '', // Para cliques ou formulários
    conversionEvent: '', // Para eventos customizados
    
    // Step 5: Goals & Metrics
    primaryGoal: '',
    goalType: 'page_view', // 'page_view', 'click', 'form_submit', 'custom'
    goalValue: '',
    duration: 14, // days
    minSampleSize: 1000,
    
    // Algorithm
    algorithm: 'thompson_sampling', // 'uniform', 'thompson_sampling', 'ucb1'
    
    // Step 6: Install Code (new)
    installCode: ''
  })

  useEffect(() => {
    checkUser()
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkUser = async () => {
    // Temporariamente usando usuário demo devido a problemas de RLS no Supabase
    console.log('Using demo user due to Supabase RLS configuration issue')
    setUser({ 
      id: 'demo-user', 
      email: 'demo@rotafinal.com',
      user_metadata: {
        full_name: 'Usuário Demo'
      }
    })
  }

  const loadDashboardData = async () => {
    // Temporariamente desabilitado devido a erro de RLS no Supabase
    // "infinite recursion detected in policy for relation 'organization_members'"
    console.log('Using mock data due to Supabase RLS configuration issue')
    
    try {
      // Dados mockados para demonstração
      const mockExperiments = [
        {
          id: '1',
          name: 'Teste de CTA Principal',
          status: 'running' as const,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias atrás
          variants: [
            { id: '1', name: 'Variante A (Controle)', key: 'A', is_control: true },
            { id: '2', name: 'Variante B', key: 'B', is_control: false }
          ]
        },
        {
          id: '2',
          name: 'Teste de Cores do Header',
          status: 'draft' as const,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
          variants: [
            { id: '3', name: 'Azul (Controle)', key: 'A', is_control: true },
            { id: '4', name: 'Verde', key: 'B', is_control: false },
            { id: '5', name: 'Roxo', key: 'C', is_control: false }
          ]
        },
        {
          id: '3',
          name: 'Teste de Onboarding',
          status: 'completed' as const,
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dias atrás
          variants: [
            { id: '6', name: 'Fluxo Original', key: 'A', is_control: true },
            { id: '7', name: 'Fluxo Simplificado', key: 'B', is_control: false }
          ]
        }
      ]
      setExperiments(mockExperiments)
      
      // Calcular estatísticas dos dados mockados
      const activeCount = mockExperiments.filter(e => e.status === 'running').length
      const totalVisitors = Math.floor(Math.random() * 10000) + 5000
      const conversionRate = Math.random() * 0.15 + 0.05
      
      setStats({ activeExperiments: activeCount, totalVisitors, conversionRate })
      
    } catch (error) {
      console.error('Error loading mock data:', error)
      // Fallback mínimo em caso de erro
      setExperiments([])
      setStats({ activeExperiments: 0, totalVisitors: 1000, conversionRate: 0.02 })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/signin'
  }

  const handleNewExperiment = () => {
    setShowNew(true)
    setExperimentStep(1)
    // Reset form
    setExperimentForm({
      name: '',
      description: '',
      // projeto removido
      targetUrl: '',
      testType: 'split_url',
      audienceType: 'all',
      trafficAllocation: 100,
      variants: [
        { name: 'Original', description: 'Versão atual da sua página', url: '', isControl: true },
        { name: 'Variação A', description: 'Nova versão para testar', url: '', isControl: false }
      ],
      // Novo step de conversão
      conversionType: 'page_view',
      conversionUrl: '',
      conversionSelector: '',
      conversionEvent: '',
      primaryGoal: '',
      goalType: 'page_view',
      goalValue: '',
      duration: 14,
      minSampleSize: 1000,
      algorithm: 'thompson_sampling',
      installCode: ''
    })
  }
  
  const copyInstallSnippet = async () => {
    const snippet = "<script>/* Rota Final SDK inline: substitua por código do experimento */</script>"
    try {
      await navigator.clipboard.writeText(snippet)
      toast.success('Snippet de instalação copiado para a área de transferência')
    } catch {
      toast.error('Não foi possível copiar o snippet')
    }
  }

  // Gera o código que deve estar na página para um experimento específico
  const generateInstallCodeForExperiment = (exp: Experiment) => {
    const experimentId = `exp_${exp.id}`
    const name = exp.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const variants = (exp.variants || []).map(v => ({ name: v.name, url: v.url || null, isControl: v.is_control, description: v.description || null }))
    const goal = exp.goal_value || exp.goal_type || 'conversion'
    const goalType = exp.goal_type || 'page_view'
    const targetUrl = exp.target_url || ''
    const algorithm = exp.algorithm || 'thompson_sampling'
    const method = exp.test_type || 'split_url'
    // Build goal handler (simple)
    const goalHandler = (() => {
      if (goalType === 'click' && exp.goal_value) {
        return `document.addEventListener('click',function(e){if(e.target.matches('${exp.goal_value}')||e.target.closest('${exp.goal_value}')){window.rotaFinal.track('${goal}',{variant:variant,selector:'${exp.goal_value}'})}});`
      }
      if (goalType === 'form_submit' && exp.goal_value) {
        return `var f=document.querySelector('${exp.goal_value}');if(f){f.addEventListener('submit',function(){window.rotaFinal.track('${goal}',{variant:variant,form:'${exp.goal_value}'})})}`
      }
      if (goalType === 'page_view' && exp.goal_value) {
        return `if(location.pathname==='${exp.goal_value}'||location.href.indexOf('${exp.goal_value}')>-1){window.rotaFinal.track('${goal}',{variant:variant,page:'${exp.goal_value}'})}`
      }
      return ''
    })()

    return `<!-- 🚀 Rota Final - Experimento: ${name} -->\n<script>(function(){\n  const CONFIG={experimentId:'${experimentId}',algorithm:'${algorithm}',method:'${method}',targetUrl:'${targetUrl}',goal:'${goal}',goalType:'${goalType}',variants:${JSON.stringify(variants)}};\n  const userId=localStorage.getItem('rf_user_id')||'user_'+Math.random().toString(36).slice(2);\n  localStorage.setItem('rf_user_id',userId);\n  function assign(){\n    const saved=localStorage.getItem('rf_variant_'+CONFIG.experimentId);\n    if(saved) return saved;\n    const hash=userId.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);\n    const idx=Math.abs(hash)%CONFIG.variants.length;\n    const v=CONFIG.variants[idx]?.name||CONFIG.variants[0]?.name;\n    localStorage.setItem('rf_variant_'+CONFIG.experimentId, v);\n    return v;\n  }\n  // Utilitários de aplicação visual SEM alterar HTML\n  function applyRules(variant){\n    try {\n      var cfg=(CONFIG.variants||[]).find(function(v){return v.name===variant});\n      var rules={};\n      if(cfg && cfg.description){ try{ rules=JSON.parse(cfg.description) }catch(e){ console.warn('Rota Final: descrição da variante não é JSON', e) } }\n      // Estrutura esperada: { hide: ['.sel'], show: ['.sel'], text: [{selector, value}], attr: [{selector, name, value}], css: [{selector, style}] }\n      // Hide\n      (rules.hide||[]).forEach(function(sel){ try{ document.querySelectorAll(sel).forEach(function(el){ el.style.setProperty('display','none','important') }) }catch(e){} })\n      // Show\n      (rules.show||[]).forEach(function(sel){ try{ document.querySelectorAll(sel).forEach(function(el){ el.style.removeProperty('display') }) }catch(e){} })\n      // Text replace\n      (rules.text||[]).forEach(function(t){ try{ var els=document.querySelectorAll(t.selector); els.forEach(function(el){ el.textContent = t.value }) }catch(e){} })\n      // Attr\n      (rules.attr||[]).forEach(function(a){ try{ document.querySelectorAll(a.selector).forEach(function(el){ el.setAttribute(a.name, a.value) }) }catch(e){} })\n      // CSS inline\n      (rules.css||[]).forEach(function(c){ try{ document.querySelectorAll(c.selector).forEach(function(el){ el.setAttribute('style', (el.getAttribute('style')||'') + ';' + c.style) }) }catch(e){} })\n      // CSS injetado\n      if(rules.injectCSS){ try{ var style=document.createElement('style'); style.textContent=String(rules.injectCSS); document.head.appendChild(style) }catch(e){} }\n    } catch(err){ console.warn('Rota Final: erro ao aplicar regras da variante', err) }\n  }\n  window.rotaFinal=window.rotaFinal||{track:(e,p={})=>{const d={experiment_id:CONFIG.experimentId,event:e,variant:document.documentElement.getAttribute('data-rf-variant'),url:location.href,timestamp:new Date().toISOString(),...p};console.log('📊 Rota Final Track:',d);}};\n  const variant=assign();\n  function init(){\n    document.documentElement.setAttribute('data-rf-variant',variant);\n    // Redirecionamento apenas para Split URL\n    if(CONFIG.method==='split_url'){\n      var cfg=CONFIG.variants.find(function(v){return v.name===variant});\n      if(cfg&&cfg.url&&cfg.isControl!==true){ if(location.href.indexOf(cfg.url)===-1){ location.href=cfg.url; return; } }\n    }\n    applyRules(variant);\n    window.rotaFinal.track('page_view',{variant:variant,experiment_start:true});\n    ${goalHandler}\n  }\n  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init) } else { init() }\n})();</script>`
  }

  const copyExperimentCode = async (exp: Experiment) => {
    try {
      const code = generateInstallCodeForExperiment(exp)
      await navigator.clipboard.writeText(code)
      toast.success('Código do experimento copiado')
    } catch {
      toast.error('Falha ao copiar o código')
    }
  }

  const openExperimentDrawer = (exp: Experiment) => {
    setSelectedExperiment(exp)
    setDrawerOpen(true)
  }
  const closeExperimentDrawer = () => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedExperiment(null), 250)
  }

  // Close drawer with ESC
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeExperimentDrawer() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  // Seletor visual de elementos (para metas de clique)
  function getUniqueSelector(el: Element): string {
    if (!(el instanceof Element)) return ''
    if (el.id) return `#${el.id}`
    const parts: string[] = []
    let current: Element | null = el
    while (current && current.nodeType === 1 && parts.length < 5) {
      let selector = current.nodeName.toLowerCase()
      if ((current as HTMLElement).className) {
        const cls = (current as HTMLElement).className
          .toString()
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((c: string) => `.${c.replace(/[^a-z0-9_-]/gi, '')}`)
          .join('')
        selector += cls
      }
      const parent = current.parentElement
      if (parent) {
        const siblings = Array.from(parent.children).filter(ch => ch.nodeName === current!.nodeName)
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1
          selector += `:nth-of-type(${index})`
        }
      }
      parts.unshift(selector)
      if (current.id) break
      current = current.parentElement
    }
    return parts.join(' > ')
  }

  useEffect(() => {
    if (!clickPickerActive) return
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Ignorar interações no Drawer
      const inDrawer = target.closest('aside[role="dialog"]')
      if (inDrawer) return
      if (clickPickerHighlight && clickPickerHighlight !== target) {
        clickPickerHighlight.style.outline = (clickPickerHighlight as any).__prevOutline || ''
      }
      ;(target as any).__prevOutline = target.style.outline
      target.style.outline = '2px solid hsl(var(--primary))'
      setClickPickerHighlight(target)
    }
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const inDrawer = target.closest('aside[role="dialog"]')
      if (inDrawer) return
      e.preventDefault()
      e.stopPropagation()
      const selector = getUniqueSelector(target)
      if (selector) {
        // Atualiza para meta de clique
        setSelectedExperiment(se => se ? { ...se, goal_type: 'click', goal_value: selector } : se)
        setExperiments(prev => prev.map(ex => ex.id === selectedExperiment?.id ? { ...ex, goal_type: 'click', goal_value: selector } : ex))
        toast.success('Elemento selecionado! Meta configurada para clique no seletor.')
      }
      setClickPickerActive(false)
    }
    document.addEventListener('mouseover', onOver, true)
    document.addEventListener('click', onClick, true)
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setClickPickerActive(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mouseover', onOver, true)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKey)
      if (clickPickerHighlight) clickPickerHighlight.style.outline = (clickPickerHighlight as any).__prevOutline || ''
      setClickPickerHighlight(null)
    }
  }, [clickPickerActive, selectedExperiment])

  const buildMockTimeline = (exp: Experiment) => {
    const base = new Date(exp.created_at).getTime()
    const minutes = (m: number) => new Date(base + m * 60 * 1000).toLocaleString('pt-BR')
    const items = [
      { time: minutes(0), title: 'Criado', description: 'Experimento foi criado', color: 'hsl(var(--muted-foreground))' },
    ] as Array<{ time: string; title: string; description: string; color: string }>
    if (exp.status === 'running' || exp.status === 'paused' || exp.status === 'completed') {
      items.push({ time: minutes(5), title: 'Iniciado', description: 'Tráfego direcionado às variantes', color: 'hsl(var(--success))' })
      items.push({ time: minutes(30), title: 'Primeiras conversões', description: `${(exp.variants?.length||2)} variantes recebendo tráfego`, color: 'hsl(var(--primary))' })
    }
    if (exp.status === 'paused') {
      items.push({ time: minutes(60), title: 'Pausado', description: 'Execução pausada temporariamente', color: 'hsl(var(--warning))' })
    }
    if (exp.status === 'completed') {
      items.push({ time: minutes(120), title: 'Concluído', description: 'Resultados prontos para análise', color: 'hsl(var(--primary))' })
    }
    return items
  }

  // Modal: focus trap, keyboard shortcuts and scroll lock
  useEffect(() => {
    if (!showNew) return

    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'

    // Focus first input of the current step
    const focusCurrentStep = () => {
      const candidate =
        (experimentStep === 1 && step1NameRef.current) ||
        (experimentStep === 2 && step2UrlRef.current) ||
        (experimentStep === 3 && step3Variant0Ref.current) ||
        (experimentStep === 4 && step4GoalRef.current) ||
        modalRef.current
      candidate?.focus()
    }
    const to = setTimeout(focusCurrentStep, 0)

    const keyHandler = (e: KeyboardEvent) => {
      if (!modalRef.current) return
      const active = document.activeElement as HTMLElement | null
      // Close on ESC
      if (e.key === 'Escape') {
        e.preventDefault()
        if (!saving) setShowNew(false)
        return
      }
      // Focus trap with Tab
      if (e.key === 'Tab') {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null)
        if (focusable.length === 0) return
        const first = focusable[0] as HTMLElement | undefined
        const last = focusable[focusable.length - 1] as HTMLElement | undefined
        if (e.shiftKey) {
          if ((first && active === first) || !modalRef.current.contains(active)) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (last && active === last) {
            e.preventDefault()
            first?.focus()
          }
        }
        return
      }
      // Enter to advance/submit (avoid in textareas or when modifier keys pressed)
      const tag = (active?.tagName || '').toLowerCase()
      if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.altKey && tag !== 'textarea') {
        e.preventDefault()
        if (experimentStep < 5) {
          if (validateCurrentStep()) setExperimentStep(prev => prev + 1)
        } else {
          if (!saving) void handleCreateFullExperiment()
        }
      }
    }

    window.addEventListener('keydown', keyHandler)
    return () => {
      clearTimeout(to)
      window.removeEventListener('keydown', keyHandler)
      root.style.overflow = previousOverflow
    }
  }, [showNew, experimentStep, saving])
  
  const validateCurrentStep = (): boolean => {
    switch (experimentStep) {
      case 1:
        if (!experimentForm.name.trim()) {
          toast.error('Nome do teste é obrigatório')
          return false
        }
        return true
      
      case 2:
        if (!experimentForm.targetUrl.trim()) {
          toast.error('URL da página é obrigatória')
          return false
        }
        try {
          new URL(experimentForm.targetUrl)
        } catch {
          toast.error('URL deve ser válida (ex: https://seusite.com)')
          return false
        }
        return true
      
      case 3:
        if (experimentForm.variants.length < 2) {
          toast.error('É necessário pelo menos 2 versões')
          return false
        }
        const hasControl = experimentForm.variants.some(v => v.isControl)
        if (!hasControl) {
          toast.error('É necessário definir a versão original')
          return false
        }
        for (const variant of experimentForm.variants) {
          if (!variant.name.trim()) {
            toast.error('Todas as versões devem ter nome')
            return false
          }
          if (experimentForm.testType === 'split_url' && !variant.url.trim() && !variant.isControl) {
            toast.error('Versões devem ter URL específica')
            return false
          }
        }
        return true
      
      case 4:
        // Validação do Step 4 - Conversão
        if (experimentForm.conversionType === 'page_view' && !experimentForm.conversionUrl.trim()) {
          toast.error('URL da página de conversão é obrigatória')
          return false
        }
        if ((experimentForm.conversionType === 'click' || experimentForm.conversionType === 'form_submit') && !experimentForm.conversionSelector.trim()) {
          toast.error('Seletor CSS é obrigatório para este tipo de conversão')
          return false
        }
        if (experimentForm.conversionType === 'custom' && !experimentForm.conversionEvent.trim()) {
          toast.error('Nome do evento personalizado é obrigatório')
          return false
        }
        return true
        
      case 5:
        return true
      
      default:
        return true
    }
  }
  
  const handleExperimentStepNext = () => {
    if (validateCurrentStep() && experimentStep < 5) {
      setExperimentStep(prev => prev + 1)
    }
  }
  
  const handleExperimentStepPrev = () => {
    if (experimentStep > 1) {
      setExperimentStep(prev => prev - 1)
    }
  }

  // Validação por etapa para navegação direta
  const validateStepNumber = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!experimentForm.name.trim()) {
          toast.error('Nome do experimento é obrigatório')
          return false
        }
        return true
      case 2:
        if (!experimentForm.targetUrl.trim()) {
          toast.error('URL de destino é obrigatória')
          return false
        }
        try {
          new URL(experimentForm.targetUrl)
        } catch {
          toast.error('URL deve ser válida (ex: https://exemplo.com)')
          return false
        }
        return true
      case 3:
        if (experimentForm.variants.length < 2) {
          toast.error('É necessário pelo menos 2 variantes')
          return false
        }
        const hasControl = experimentForm.variants.some(v => v.isControl)
        if (!hasControl) {
          toast.error('É necessário definir uma variante de controle')
          return false
        }
        for (const variant of experimentForm.variants) {
          if (!variant.name.trim()) {
            toast.error('Todos as variantes devem ter nome')
            return false
          }
          if (experimentForm.testType === 'split_url' && !variant.url?.trim() && !variant.isControl) {
            toast.error('Variantes de Split URL devem ter URL específica')
            return false
          }
        }
        return true
      case 4:
        if (!experimentForm.primaryGoal.trim()) {
          toast.error('Objetivo principal é obrigatório')
          return false
        }
        if (experimentForm.goalType !== 'page_view' && !experimentForm.goalValue.trim()) {
          toast.error('Valor do objetivo é obrigatório para este tipo de meta')
          return false
        }
        return true
      case 5:
        return true
      default:
        return true
    }
  }

  const goToStep = (target: number) => {
    if (target < 1 || target > 5) return
    if (target <= experimentStep) {
      setExperimentStep(target)
      return
    }
    if (target === experimentStep + 1) {
      if (validateCurrentStep()) setExperimentStep(target)
      return
    }
    // Não permite pular etapas múltiplas à frente
  }
  
  const addVariant = () => {
    if (experimentForm.variants.length >= 5) {
      toast.error('Máximo de 5 variantes permitidas')
      return
    }
    
    const letter = String.fromCharCode(65 + experimentForm.variants.length - 1)
    const newVariant = {
      name: `Variante ${letter}`,
      description: '',
      url: experimentForm.testType === 'split_url' ? '' : experimentForm.targetUrl,
      isControl: false
    }
    setExperimentForm(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }))
  }
  
  const removeVariant = (index: number) => {
    if (experimentForm.variants.length <= 2) {
      toast.error('É necessário pelo menos 2 variantes')
      return
    }
    
    if (experimentForm.variants[index]?.isControl) {
      toast.error('Não é possível remover a variante de controle')
      return
    }
    
    setExperimentForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }))
  }
  
  const updateVariant = (index: number, field: string, value: string) => {
    setExperimentForm(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }))
  }
  
  const setVariantAsControl = (index: number) => {
    setExperimentForm(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => ({
        ...variant,
        isControl: i === index
      }))
    }))
  }
  
  const handleCreateFullExperiment = async () => {
    try {
      setSaving(true)
      
      // Validate final step
      if (!validateCurrentStep()) {
        return
      }

      // Utilitário simples para gerar chave slug
      const toKey = (text: string) =>
        (text || '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')

      // Obter projeto para vincular o experimento (obrigatório)
      let projectId = projectFilter !== 'all' ? String(projectFilter) : (projects[0]?.id || null)
      
      // Se não há projeto, usar o projeto padrão conhecido
      if (!projectId) {
        projectId = 'b302fac6-3255-4923-833b-5e71a11d5bfe' // Projeto Principal
        console.warn('Usando projeto padrão para o experimento')
      }

      // Inserir experimento no Supabase (campos compatíveis com o schema)
      const traffic = Math.max(1, Math.min(100, Math.round(Number(experimentForm.trafficAllocation || 100))))
      const insertData: any = {
        name: experimentForm.name.trim(),
        project_id: projectId, // Obrigatório
        description: experimentForm.description || null,
        traffic_allocation: parseFloat(traffic.toFixed(2)) // Garantir precisão (5,2)
      }

      console.log('Inserindo experimento com dados:', insertData)
      
      const { data: exp, error: expError } = await supabase
        .from('experiments')
        .insert(insertData)
        .select('id, name, status, created_at')
        .single()

      if (expError) {
        console.error('Erro ao salvar experimento:', expError)
        console.error('Dados enviados:', insertData)
        toast.error(`Erro ao salvar experimento: ${expError.message || 'Erro desconhecido'}`)
        return
      }

      // Inserir variantes
      const variantsCount = experimentForm.variants.length || 1
      const trafficPerVariant = parseFloat((100 / variantsCount).toFixed(2)) // Garantir precisão (5,2)
      
      const variantsPayload = experimentForm.variants.map((v: any, i: number) => ({
        experiment_id: exp.id,
        name: v.name,
        is_control: Boolean(v.isControl),
        traffic_percentage: trafficPerVariant,
      })) as any

      const { data: insertedVars, error: varError } = await (supabase as any)
        .from('variants')
        .insert(variantsPayload)
        .select('id, name, is_control')

      if (varError) {
        console.error('Erro ao salvar variantes:', varError)
        toast.error(`Erro ao salvar variantes: ${varError.message || 'Erro desconhecido'}`)
        return
      }

      const saved: Experiment = {
        id: exp.id,
        name: exp.name,
        status: exp.status as any,
        created_at: exp.created_at,
        project_id: projectId || undefined,
        variants: (insertedVars || []).map((v: any) => ({ 
          id: v.id, 
          name: v.name, 
          key: v.key || v.name?.toLowerCase().replace(/\s+/g, '-'), 
          is_control: v.is_control 
        })) as Variant[],
      }

      setExperiments(prev => [saved, ...prev])
      
      // Close modal and reset
      setShowNew(false)
      setExperimentStep(1)
      
      toast.success(`Experimento "${experimentForm.name}" criado com sucesso!`)
      
    } catch (error) {
      console.error('Erro ao criar experimento:', error)
      toast.error('Erro ao criar experimento')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning'> = {
      draft: 'secondary', running: 'success', paused: 'warning', completed: 'default',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  // Projeto removido
  const getProjectName = (_projectId?: string) => ''

  const isPinned = (id: string) => pinnedIds.includes(id)
  const togglePin = (id: string) => {
    setPinnedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev])
  }

  // Experiment actions
  const updateStatsFromExperiments = (next: Experiment[]) => {
    const activeCount = next.filter(e => e.status === 'running').length
    setStats(s => ({ ...s, activeExperiments: activeCount }))
  }

   const startExperiment = (id: string) => {
     setExperiments(prev => {
       const next = prev.map(e => e.id === id ? { ...e, status: 'running' as const } : e)
       updateStatsFromExperiments(next)
       return next
     })
     toast.success('Experimento iniciado')
     setMenuOpen(null)
   }

   const pauseExperiment = (id: string) => {
     setExperiments(prev => {
       const next = prev.map(e => e.id === id ? { ...e, status: 'paused' as const } : e)
       updateStatsFromExperiments(next)
       return next
     })
     toast.info('Experimento pausado')
     setMenuOpen(null)
   }

   const completeExperiment = (id: string) => {
     setExperiments(prev => {
       const next = prev.map(e => e.id === id ? { ...e, status: 'completed' as const } : e)
       updateStatsFromExperiments(next)
       return next
     })
     toast.success('Experimento concluído')
     setMenuOpen(null)
   }

  const duplicateExperiment = (id: string) => {
    setExperiments(prev => {
      const original = prev.find(e => e.id === id)
      if (!original) return prev
      const copy: Experiment = {
        ...original,
        id: `${Date.now()}`,
        name: `${original.name} (Cópia)`,
        status: 'draft',
        created_at: new Date().toISOString(),
      }
      const next = [copy, ...prev]
      updateStatsFromExperiments(next)
      return next
    })
    toast.success('Experimento duplicado')
    setMenuOpen(null)
  }

  const deleteExperiment = (id: string) => {
    setExperiments(prev => {
      const next = prev.filter(e => e.id !== id)
      updateStatsFromExperiments(next)
      return next
    })
    toast.success('Experimento excluído')
    setMenuOpen(null)
  }

  // Bulk selection helpers
  const isSelected = (id: string) => selectedIds.includes(id)
  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const clearSelection = () => setSelectedIds([])
  const startSelected = () => { selectedIds.forEach(startExperiment); clearSelection(); }
  const pauseSelected = () => { selectedIds.forEach(pauseExperiment); clearSelection(); }
  const completeSelected = () => { selectedIds.forEach(completeExperiment); clearSelection(); }
  const deleteSelected = () => { if (window.confirm('Excluir selecionados?')) { selectedIds.forEach(deleteExperiment); clearSelection(); } }

  const Skeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-32 rounded-2xl bg-gray-200/60" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-28 rounded-2xl bg-gray-200/60" />))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-80 rounded-2xl bg-gray-200/60 lg:col-span-2" />
        <div className="h-80 rounded-2xl bg-gray-200/60" />
      </div>
      {showNew && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setShowNew(false)} />
          <div className="relative mx-auto mt-24 w-full max-w-lg rounded-2xl border bg-background/90 backdrop-blur shadow-xl">
            <form onSubmit={handleCreateExperiment} className="p-6">
              <h3 className="text-lg font-semibold mb-1">Novo Experimento</h3>
              <p className="text-sm text-muted-foreground mb-4">Defina nome, projeto e variantes iniciais</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <Input value={newForm.name} onChange={(e) => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Hero CTA Test" className="mt-1" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Variantes</label>
                  <input type="number" min={1} max={5} className="mt-1 w-full h-10 rounded-md border bg-background px-3 text-sm" value={newForm.variants} onChange={(e) => setNewForm(f => ({ ...f, variants: Number(e.target.value) }))} />
                  <p className="text-xs text-muted-foreground mt-1">A primeira variante será o controle</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNew(false)} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Criando…' : 'Criar experimento'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )

  const filterTabs: Array<{ key: typeof statusFilter; label: string }> = [
    { key: 'all', label: 'Todos' }, { key: 'running', label: 'Ativos' }, { key: 'draft', label: 'Rascunho' }, { key: 'paused', label: 'Pausados' }, { key: 'completed', label: 'Concluídos' },
  ]

  const filtered = experiments
    .filter(e => (statusFilter === 'all' ? true : e.status === statusFilter))
    .filter(e => (query ? e.name.toLowerCase().includes(query.toLowerCase()) : true))
    // Sem filtro por projeto
    .filter(e => (tagFilters.length === 0 ? true : tagFilters.every(t => (e.tags || []).includes(t))))

  const sorted = [...filtered].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    if (sort.key === 'name') return a.name.localeCompare(b.name) * dir
    if (sort.key === 'status') return a.status.localeCompare(b.status) * dir
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir
  }).sort((a, b) => Number(isPinned(b.id)) - Number(isPinned(a.id)))

  const toggleSort = (key: 'name' | 'created' | 'status') => setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newForm.name.trim()) {
      toast.error('Preencha o nome do experimento')
      return
    }
    if (newForm.variants < 1 || newForm.variants > 5) {
      toast.error('Quantidade de variantes deve ser entre 1 e 5')
      return
    }
    try {
      setSaving(true)
      
      // Criar experimento mock para demonstração
      const mockExperiment: Experiment = {
        id: Date.now().toString(),
        name: newForm.name.trim(),
        status: 'draft',
        created_at: new Date().toISOString(),
        // projeto removido
        variants: Array.from({ length: newForm.variants }).map((_, i) => ({
          id: `${Date.now()}-${i}`,
          name: `Variante ${String.fromCharCode(65 + i)}`,
          key: String.fromCharCode(65 + i),
          is_control: i === 0,
        }))
      }

      setExperiments(prev => [mockExperiment, ...prev])
      setShowNew(false)
      toast.success('Experimento criado!')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Erro ao criar experimento')
    } finally {
      setSaving(false)
    }
  }

  const renderOverviewContent = () => (
    <>
      {/* Header with User Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Rota Final</h1>
              <p className="text-muted-foreground">Otimização de conversões com IA</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="hover:bg-accent/50"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button 
            size="sm" 
            className="bg-gradient-primary shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={handleNewExperiment}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Experimento
          </Button>
        </div>
      </div>

      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-border/20 p-8 md:p-12 mb-10">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gradient-brand blur-3xl" />
          <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-gradient-primary blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 blur-3xl" />
        </div>
        
        {/* Toolbar superior: período */}
        <div className="relative mb-6 flex justify-end">
          <div className="inline-flex items-center gap-2 rounded-xl border border-border/40 bg-background/70 backdrop-blur px-2 py-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={(val) => setTimeRange(val as any)}>
              <SelectTrigger className="h-8 w-[160px] bg-transparent border-0 focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Plataforma de A/B Testing
            </div>
            
            <h2 id="dashboard-hero-title" className="text-balance text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-foreground mb-4">
              Otimize suas conversões com IA
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-8">
              Execute experimentos A/B com distribuição inteligente de tráfego e maximize resultados sem esforço.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleNewExperiment}
                size="lg" 
                className="bg-gradient-primary text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Experimento
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-border/50 hover:bg-accent/50"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Ver Relatórios
              </Button>
            </div>
          </div>
          
          {/* Stats Preview */}
          <div className="lg:w-80">
            <div className="grid grid-cols-2 gap-4">
              <div className="card-glass rounded-2xl p-4">
                <div className="text-3xl font-bold text-primary mb-1">{stats.activeExperiments}</div>
                <div className="text-sm text-muted-foreground">Testes Ativos</div>
              </div>
              <div className="card-glass rounded-2xl p-4">
                <div className="text-3xl font-bold text-success mb-1">{stats.totalVisitors.toLocaleString('pt-BR', { notation: 'compact' })}</div>
                <div className="text-sm text-muted-foreground">Visitantes</div>
              </div>
              <div className="card-glass rounded-2xl p-4">
                <div className="text-3xl font-bold text-warning mb-1">{(stats.conversionRate * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Conversão</div>
              </div>
              <div className="card-glass rounded-2xl p-4">
                {/* cartão de projetos removido */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section aria-labelledby="quick-actions" className="mb-10">
        <h2 id="quick-actions" className="sr-only">Ações rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            type="button"
            onClick={handleNewExperiment}
            className="card-glass hover-lift p-4 rounded-2xl border text-left flex items-center gap-3"
            aria-label="Criar novo experimento"
            title="Criar novo experimento"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium">Novo experimento</div>
              <div className="text-xs text-muted-foreground">Comece um teste A/B</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className="card-glass hover-lift p-4 rounded-2xl border text-left flex items-center gap-3"
            aria-label="Ver analytics"
            title="Ver analytics"
          >
            <div className="w-10 h-10 rounded-xl bg-success/10 text-success border border-success/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium">Relatórios</div>
              <div className="text-xs text-muted-foreground">Visão geral de desempenho</div>
            </div>
          </button>

          <button
            type="button"
            onClick={copyInstallSnippet}
            className="card-glass hover-lift p-4 rounded-2xl border text-left flex items-center gap-3"
            aria-label="Copiar código para a página"
            title="Copiar código para a página"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/20 text-foreground border border-border/40 flex items-center justify-center">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium">Copiar código</div>
              <div className="text-xs text-muted-foreground">Cole no HTML da página</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toast.info('Em breve: Templates de testes')}
            className="card-glass hover-lift p-4 rounded-2xl border text-left flex items-center gap-3"
            aria-label="Ver templates de testes"
            title="Ver templates de testes"
          >
            <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning border border-warning/20 flex items-center justify-center">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium">Templates</div>
              <div className="text-xs text-muted-foreground">Padrões prontos para uso</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toast.info('Em breve: Importar audiência')}
            className="card-glass hover-lift p-4 rounded-2xl border text-left flex items-center gap-3"
            aria-label="Importar audiência"
            title="Importar audiência"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium">Importar audiência</div>
              <div className="text-xs text-muted-foreground">Segmente seus visitantes</div>
            </div>
          </button>
        </div>
      </section>

      {/* Enhanced KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KpiCard 
          title="Experimentos Ativos" 
          value={stats.activeExperiments}
          change={stats.activeExperiments > 0 ? 15 : 0}
          trend={stats.activeExperiments > 0 ? 'up' : 'neutral'}
          subtitle="testes em execução"
          icon={<Zap />}
          highlight={stats.activeExperiments > 0}
          color="primary"
          sparklineData={[3, 5, 2, 7, 8, 6, 9, 12]}
        />
        <KpiCard 
          title="Visitantes Únicos" 
          value={stats.totalVisitors.toLocaleString('pt-BR')}
          change={23}
          trend="up"
          subtitle="últimos 30 dias"
          icon={<Users />}
          color="success"
          sparklineData={[20, 25, 23, 29, 40, 38, 45, 52]}
        />
        <KpiCard 
          title="Taxa de Conversão" 
          value={`${(stats.conversionRate * 100).toFixed(2)}%`}
          change={8}
          trend="up"
          subtitle="média geral"
          icon={<TrendingUp />}
          color="success"
          sparklineData={[1.2, 1.8, 1.6, 2.4, 2.1, 2.7, 3.0, 3.2]}
        />
        {/* KPI de projetos removido */}
      </div>

      <ChartsSection />
    </>
  )

  const renderExperimentsContent = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experimentos</h1>
          <p className="text-muted-foreground">Gerencie, filtre e acompanhe seus testes A/B</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleNewExperiment} className="bg-gradient-primary text-primary-foreground shadow-lg hover:shadow-xl">
            <Plus className="w-4 h-4 mr-2" /> Novo Experimento
          </Button>
        </div>
      </div>

      {/* Filtros principais */}
      <div className="flex flex-col gap-3">
        {/* Tabs de status */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterTabs.map(t => (
            <button
              key={t.key}
              className={"chip hover-lift " + (statusFilter===t.key? 'bg-primary/10 border-primary/30 text-primary' : '')}
              onClick={() => setStatusFilter(t.key)}
            >{t.label}</button>
          ))}
        </div>

        {/* Linha de busca e controles */}
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Agrupar */}
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
              <SelectTrigger className="h-10 w-[150px]"><SelectValue placeholder="Agrupar por" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem grupo</SelectItem>
                <SelectItem value="tag">Tag</SelectItem>
              </SelectContent>
            </Select>

            {/* Layout */}
            <div className="inline-flex items-center gap-1 rounded-xl border px-1 py-1">
              <Button variant={layout==='grid'?'default':'ghost'} size="sm" onClick={() => setLayout('grid')} className="h-8">Grid</Button>
              <Button variant={layout==='list'?'default':'ghost'} size="sm" onClick={() => setLayout('list')} className="h-8">Lista</Button>
            </div>
          </div>
        </div>

        {/* Tags ativas */}
        <div className="flex items-center gap-2 flex-wrap">
          {tagFilters.map(tag => (
            <span key={tag} className="chip">
              {tag}
              <button className="ml-2 text-xs" onClick={() => setTagFilters(prev => prev.filter(t => t!==tag))}>remover</button>
            </span>
          ))}
          <div className="flex items-center gap-2">
            <Input value={newTagValue} onChange={(e) => setNewTagValue(e.target.value)} placeholder="Adicionar tag" className="h-8 w-[160px]" />
            <Button size="sm" variant="outline" className="h-8" onClick={() => { if (newTagValue.trim() && !tagFilters.includes(newTagValue.trim())) { setTagFilters(prev => [...prev, newTagValue.trim()]); setNewTagValue('') } }}>Adicionar</Button>
          </div>
        </div>

        {/* Views salvas */}
        <div className="flex items-center gap-2">
          <Select value={activeViewId} onValueChange={applyView}>
            <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Aplicar visão salva" /></SelectTrigger>
            <SelectContent>
              {savedViews.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma visão salva</div>}
              {savedViews.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={saveCurrentView}>Salvar visão</Button>
          {activeViewId && <Button size="sm" variant="ghost" onClick={deleteActiveView}>Excluir visão</Button>}
        </div>
      </div>

      {/* Ações em massa */}
      {selectedIds.length > 0 && (
        <div className="card-glass p-3 rounded-xl flex items-center gap-2">
          <span className="text-sm">Selecionados: {selectedIds.length}</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={startSelected}>Iniciar</Button>
            <Button size="sm" variant="outline" onClick={pauseSelected}>Pausar</Button>
            <Button size="sm" variant="outline" onClick={completeSelected}>Concluir</Button>
            <Button size="sm" variant="ghost" onClick={deleteSelected}>Excluir</Button>
            <Button size="sm" variant="outline" onClick={clearSelection}>Limpar</Button>
          </div>
        </div>
      )}

      {/* Lista / Grid */}
      {loading ? (
        <Skeleton />
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
            <BarChart3 className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum experimento encontrado</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Ajuste os filtros ou crie um novo experimento.</p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" onClick={() => { setQuery(''); setStatusFilter('all'); setProjectFilter('all'); setTagFilters([]) }}>Limpar filtros</Button>
            <Button onClick={handleNewExperiment}>Criar experimento</Button>
          </div>
        </div>
      ) : (
        <>
          {layout === 'list' ? (
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pl-3">
                      <input type="checkbox" aria-label="Selecionar todos" checked={selectedIds.length>0 && selectedIds.length===sorted.length} onChange={(e) => { if (e.target.checked) setSelectedIds(sorted.map(x=>x.id)); else clearSelection() }} />
                    </th>
                    <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort('name')}>Nome</th>
          {/* coluna de projeto removida */}
                    <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort('status')}>Status</th>
                    <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort('created')}>Criado</th>
                    <th className="py-2 pr-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(e => (
                    <tr key={e.id} className="border-t hover:bg-accent/30">
                      <td className="py-2 pl-3">
                        <input type="checkbox" checked={isSelected(e.id)} onChange={() => toggleSelect(e.id)} aria-label="Selecionar" />
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => togglePin(e.id)} aria-label="Fixar" className={"text-xs " + (isPinned(e.id)?'text-yellow-500':'text-muted-foreground')}><Star className="w-4 h-4" /></button>
                          <span className="font-medium">{e.name}</span>
                          {(e.tags||[]).slice(0,3).map(t => (<span key={t} className="chip text-[11px]">{t}</span>))}
                        </div>
                      </td>
                      {/* coluna de projeto removida */}
                      <td className="py-2 pr-4">
                        <Badge className={
                          e.status==='running'? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          e.status==='paused'? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          e.status==='completed'? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }>
                          {e.status === 'running' ? 'Ativo' : e.status === 'paused' ? 'Pausado' : e.status === 'completed' ? 'Concluído' : 'Rascunho'}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">{new Date(e.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openExperimentDrawer(e)}>Detalhes</Button>
                          {e.status!=='running' && <Button size="sm" variant="outline" onClick={() => startExperiment(e.id)}>Iniciar</Button>}
                          {e.status==='running' && <Button size="sm" variant="outline" onClick={() => pauseExperiment(e.id)}>Pausar</Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sorted.map(e => (
                <Card key={e.id} className="hover:shadow-lg transition-shadow group">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="group-hover:text-primary transition-colors">{e.name}</CardTitle>
                        {/* descrição de projeto removida */}
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={isSelected(e.id)} onChange={() => toggleSelect(e.id)} aria-label="Selecionar" />
                        <button onClick={() => togglePin(e.id)} aria-label="Fixar" className={"chip " + (isPinned(e.id)?'bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200':'') }>
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={
                        e.status==='running'? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        e.status==='paused'? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        e.status==='completed'? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }>
                        {e.status === 'running' ? 'Ativo' : e.status === 'paused' ? 'Pausado' : e.status === 'completed' ? 'Concluído' : 'Rascunho'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">{e.description || 'Sem descrição'}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(e.tags||[]).slice(0,3).map(t => (<span key={t} className="chip text-[11px]">{t}</span>))}
                        <span className="text-xs text-muted-foreground">{e.variants?.length||0} variantes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openExperimentDrawer(e)}>Detalhes</Button>
                        {e.status!=='running' && <Button size="sm" variant="outline" onClick={() => startExperiment(e.id)}>Iniciar</Button>}
                        {e.status==='running' && <Button size="sm" variant="outline" onClick={() => pauseExperiment(e.id)}>Pausar</Button>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )

  // renderProjectsContent removido

  const getTabContent = () => {
    switch (activeTab) {
      case 'experiments':
        return renderExperimentsContent()
      case 'analytics':
        return <ChartsSection {...({ experiments, stats } as any)} />
      case 'audiences':
        return renderAudiencesContent()
      case 'settings':
        return renderSettingsContent()
      default:
        return renderOverviewContent()
    }
  }
  // ===== Audiências (UTMs & Segmentos) =====
  type UTMEvent = { ts: string; path: string; referrer: string | null; source?: string | null; medium?: string | null; campaign?: string | null; term?: string | null; content?: string | null }
  type SegmentCond = { field: 'utm_source'|'utm_medium'|'utm_campaign'|'utm_term'|'utm_content'; op: 'equals'|'contains'; value: string }
  type Audience = { id: string; name: string; conditions: SegmentCond[] }

  const getUtmEvents = (): UTMEvent[] => { try { return JSON.parse(localStorage.getItem('utm_events') || '[]') } catch { return [] } }
  const getAudiences = (): Audience[] => { try { return JSON.parse(localStorage.getItem('audiences') || '[]') } catch { return [] } }
  const saveAudiences = (list: Audience[]) => { localStorage.setItem('audiences', JSON.stringify(list)) }
  const countBy = (arr: string[]) => { const m: Record<string, number> = {}; for (const a of arr) m[a] = (m[a]||0)+1; return m }

  const renderAudiencesContent = () => {
    const utms = getUtmEvents().reverse()
    const summary = {
      total: utms.length,
      bySource: countBy(utms.map(u => u.source || 'indefinido')),
      byCampaign: countBy(utms.map(u => u.campaign || 'indefinido'))
    }
    const audiences = getAudiences()

    const Builder = () => {
      const [name, setName] = useState('Campanha X')
      const [conds, setConds] = useState<SegmentCond[]>([{ field: 'utm_campaign', op: 'contains', value: '' }])
      const addCond = () => setConds(prev => [...prev, { field: 'utm_source', op: 'equals', value: '' }])
      const removeCond = (i: number) => setConds(prev => prev.filter((_, idx) => idx !== i))
      const update = (i: number, patch: Partial<SegmentCond>) => setConds(prev => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c))
      const save = () => {
        if (!name.trim()) { toast.error('Informe um nome'); return }
        const item: Audience = { id: 'aud_'+Date.now(), name: name.trim(), conditions: conds }
        const next = [item, ...audiences]
        saveAudiences(next)
        toast.success('Audiência salva')
      }
      return (
        <Card className="card-glass">
          <CardHeader><CardTitle>Nova audiência</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Campanha BlackFriday - Google Ads" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Condições</label>
              {conds.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select value={c.field} onValueChange={(v) => update(i, { field: v as any })}>
                    <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utm_source">utm_source</SelectItem>
                      <SelectItem value="utm_medium">utm_medium</SelectItem>
                      <SelectItem value="utm_campaign">utm_campaign</SelectItem>
                      <SelectItem value="utm_term">utm_term</SelectItem>
                      <SelectItem value="utm_content">utm_content</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={c.op} onValueChange={(v) => update(i, { op: v as any })}>
                    <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">é igual a</SelectItem>
                      <SelectItem value="contains">contém</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="h-9" value={c.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="valor" />
                  <Button variant="ghost" size="sm" className="h-9" onClick={() => removeCond(i)}>Remover</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCond}>Adicionar condição</Button>
            </div>
            <div className="flex justify-end">
              <Button onClick={save}>Salvar audiência</Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    const AudiencesList = () => {
      const [list, setList] = useState(audiences)
      const remove = (id: string) => { const next = list.filter(a => a.id !== id); setList(next); saveAudiences(next) }
      const matchesCount = (a: Audience) => {
        const test = (u: UTMEvent, c: SegmentCond) => {
          const map: any = { utm_source: u.source||'', utm_medium: u.medium||'', utm_campaign: u.campaign||'', utm_term: u.term||'', utm_content: u.content||'' }
          const val = map[c.field].toLowerCase(); const v = c.value.toLowerCase()
          return c.op === 'equals' ? val === v : val.includes(v)
        }
        return utms.filter(u => a.conditions.every(c => test(u, c))).length
      }
      return (
        <Card className="card-glass">
          <CardHeader><CardTitle>Audiências salvas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {list.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma audiência criada</div>}
            {list.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.conditions.map(c => `${c.field} ${c.op === 'equals' ? '=' : 'contém'} "${c.value}"`).join(' • ')}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{matchesCount(a)} ocorrências</span>
                  <Button variant="ghost" size="sm" onClick={() => remove(a.id)} className="h-8">Excluir</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )
    }

    const SummaryCards = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-glass"><CardHeader><CardTitle>Total de sessões com UTM</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.total}</div></CardContent></Card>
        <Card className="card-glass"><CardHeader><CardTitle>Fontes</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2 text-xs">{Object.entries(summary.bySource).map(([k,v]) => (<span key={k} className="chip">{k}: {v as number}</span>))}</div></CardContent></Card>
        <Card className="card-glass"><CardHeader><CardTitle>Campanhas</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2 text-xs">{Object.entries(summary.byCampaign).map(([k,v]) => (<span key={k} className="chip">{k}: {v as number}</span>))}</div></CardContent></Card>
      </div>
    )

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audiências</h1>
          <p className="text-muted-foreground">Defina audiências com base em UTMs e campanhas</p>
        </div>
        <SummaryCards />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">
            {/* UTMs recentes */}
            <Card className="card-glass">
              <CardHeader><CardTitle>UTMs recentes</CardTitle></CardHeader>
              <CardContent>
                {utms.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum evento UTM capturado ainda</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2 pr-4">Data</th>
                          <th className="py-2 pr-4">utm_source</th>
                          <th className="py-2 pr-4">utm_medium</th>
                          <th className="py-2 pr-4">utm_campaign</th>
                          <th className="py-2 pr-4">Página</th>
                        </tr>
                      </thead>
                      <tbody>
                        {utms.slice(0, 20).map((u, i) => (
                          <tr key={i} className="border-t">
                            <td className="py-2 pr-4">{new Date(u.ts).toLocaleString('pt-BR')}</td>
                            <td className="py-2 pr-4">{u.source || '-'}</td>
                            <td className="py-2 pr-4">{u.medium || '-'}</td>
                            <td className="py-2 pr-4">{u.campaign || '-'}</td>
                            <td className="py-2 pr-4">{u.path}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Builder />
            <AudiencesList />
          </div>
        </div>
      </div>
    )
  }

  const renderExperimentDrawer = () => {
    if (!selectedExperiment) return null
    const exp = selectedExperiment
    const projectName = ''
    const variantCount = exp.variants?.length || 0
    const code = generateInstallCodeForExperiment(exp)
    const getStatusLabel = (s: Experiment['status']) => (
      s === 'running' ? 'Ativo' : s === 'paused' ? 'Pausado' : s === 'completed' ? 'Concluído' : 'Rascunho'
    )
    const getMethodLabel = (m: NonNullable<Experiment['test_type']>) => (
      m === 'split_url' ? 'Divisão de URL' : m === 'visual' ? 'Teste visual' : 'Sinalizador de recurso'
    )
    const getAlgoLabel = (a: NonNullable<Experiment['algorithm']>) => (
      a === 'thompson_sampling' ? 'Amostragem de Thompson' : a === 'ucb1' ? 'UCB1' : 'Uniforme'
    )
    const getGoalTypeLabel = (g: NonNullable<Experiment['goal_type']>) => (
      g === 'page_view' ? 'Visualização de página' : g === 'click' ? 'Clique em elemento' : g === 'form_submit' ? 'Envio de formulário' : 'Evento customizado'
    )
    const changeStatus = (status: Experiment['status']) => {
      setExperiments(prev => {
        const next = prev.map(e => e.id === exp.id ? { ...e, status } : e)
        updateStatsFromExperiments(next)
        return next
      })
      setSelectedExperiment(se => se ? { ...se, status } : se)
    }
    const saveName = () => {
      if (!selectedExperiment?.name.trim()) { toast.error('Nome não pode ser vazio'); return }
      setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, name: selectedExperiment.name } : e))
      toast.success('Nome atualizado')
    }
    return (
      <div className={"fixed inset-0 z-50 " + (drawerOpen ? '' : 'pointer-events-none') } aria-hidden={!drawerOpen}>
        {/* Overlay */}
        <div className={"absolute inset-0 bg-black/40 transition-opacity " + (drawerOpen ? 'opacity-100' : 'opacity-0')} onClick={closeExperimentDrawer} />
        {/* Panel */}
        <aside className={"absolute right-0 top-0 h-full w-full sm:w-[520px] bg-background border-l border-border/50 shadow-2xl transition-transform sm:rounded-l-2xl overflow-hidden " + (drawerOpen ? 'translate-x-0' : 'translate-x-full')} role="dialog" aria-label="Detalhes do experimento">
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between p-5 border-b border-border/50 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Select value={exp.status} onValueChange={(v) => changeStatus(v as any)}>
                    <SelectTrigger className="h-8 w-[168px] rounded-xl">
                      <span className="text-sm">{getStatusLabel(exp.status)}</span>
                      <SelectValue className="sr-only" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="running">Ativo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* projeto removido */}
                </div>
                <div className="flex items-center gap-2">
                  <Input value={exp.name} onChange={(e) => setSelectedExperiment(se => se ? { ...se, name: e.target.value } : se)} className="h-9 w-full max-w-md" />
                  <Button size="sm" variant="outline" onClick={saveName}>Salvar</Button>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Criado em {new Date(exp.created_at).toLocaleString('pt-BR')}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {exp.status !== 'running' && (
                  <Button size="sm" variant="outline" onClick={() => startExperiment(exp.id)}>
                    <Play className="w-4 h-4 mr-1" /> Iniciar
                  </Button>
                )}
                {exp.status === 'running' && (
                  <Button size="sm" variant="outline" onClick={() => pauseExperiment(exp.id)}>
                    <Pause className="w-4 h-4 mr-1" /> Pausar
                  </Button>
                )}
                {exp.status !== 'completed' && (
                  <Button size="sm" variant="outline" onClick={() => completeExperiment(exp.id)}>
                    <Flag className="w-4 h-4 mr-1" /> Concluir
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={closeExperimentDrawer} aria-label="Fechar">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Tabs e Aparência aprimorada */}
              <div>
                <div className="inline-flex items-center gap-1 rounded-xl border bg-card/60 p-1 mb-4">
                  <button className={"px-3 py-1.5 rounded-lg text-sm transition-all " + (drawerTab==='details' ? 'bg-primary/10 text-primary border border-primary/30 shadow-sm' : 'text-muted-foreground hover:bg-accent/60 border border-transparent')} onClick={() => setDrawerTab('details')}>Detalhes</button>
                  <button className={"px-3 py-1.5 rounded-lg text-sm transition-all " + (drawerTab==='code' ? 'bg-primary/10 text-primary border border-primary/30 shadow-sm' : 'text-muted-foreground hover:bg-accent/60 border border-transparent')} onClick={() => setDrawerTab('code')}>Código</button>
                  <button className={"px-3 py-1.5 rounded-lg text-sm transition-all " + (drawerTab==='timeline' ? 'bg-primary/10 text-primary border border-primary/30 shadow-sm' : 'text-muted-foreground hover:bg-accent/60 border border-transparent')} onClick={() => setDrawerTab('timeline')}>Timeline</button>
                </div>
              </div>

              {drawerTab === 'details' && (
              <>
              {/* Overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border bg-card/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="font-medium">{getStatusLabel(exp.status)}</div>
                  </div>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="p-4 rounded-xl border bg-card/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Variantes</div>
                    <div className="font-medium">{variantCount}</div>
                  </div>
                  <Shuffle className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Configurações gerais (editáveis) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-card/60 md:col-span-2">
                  <label className="text-xs text-muted-foreground">Descrição</label>
                  <Textarea value={exp.description || ''} onChange={(e) => {
                    const val = e.target.value
                    setSelectedExperiment(se => se ? { ...se, description: val } : se)
                    setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, description: val } : e))
                  }} className="mt-1" rows={3} placeholder="Explique o objetivo, hipótese e contexto do experimento" />
                </div>
                <div className="p-4 rounded-xl border bg-card/60">
                  <label className="text-xs text-muted-foreground">Projeto</label>
                  <Select value={exp.project_id || 'none'} onValueChange={(v) => {
                    setSelectedExperiment(se => se ? { ...se, project_id: v === 'none' ? undefined : v } : se)
                    setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, project_id: v === 'none' ? undefined : v } : e))
                  }}>
                    <SelectTrigger className="mt-1 h-9 rounded-xl">
                      <span>{projects.find(p => p.id === exp.project_id)?.name || 'Sem projeto'}</span>
                      <SelectValue className="sr-only" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem projeto</SelectItem>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 rounded-xl border bg-card/60">
                  <label className="text-xs text-muted-foreground">Método</label>
                  <Select value={exp.test_type || 'split_url'} onValueChange={(v) => {
                    setSelectedExperiment(se => se ? { ...se, test_type: v as any } : se)
                    setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, test_type: v as any } : e))
                  }}>
                    <SelectTrigger className="mt-1 h-9 rounded-xl">
                      <span>{getMethodLabel(exp.test_type || 'split_url')}</span>
                      <SelectValue className="sr-only" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="split_url">Divisão de URL</SelectItem>
                      <SelectItem value="visual">Teste visual</SelectItem>
                      <SelectItem value="feature_flag">Sinalizador de recurso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 rounded-xl border bg-card/60">
                  <label className="text-xs text-muted-foreground">Algoritmo</label>
                  <Select value={exp.algorithm || 'thompson_sampling'} onValueChange={(v) => {
                    setSelectedExperiment(se => se ? { ...se, algorithm: v as any } : se)
                    setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, algorithm: v as any } : e))
                  }}>
                    <SelectTrigger className="mt-1 h-9 rounded-xl">
                      <span>{getAlgoLabel(exp.algorithm || 'thompson_sampling')}</span>
                      <SelectValue className="sr-only" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thompson_sampling">Amostragem de Thompson</SelectItem>
                      <SelectItem value="ucb1">UCB1</SelectItem>
                      <SelectItem value="uniform">Uniforme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 rounded-xl border bg-card/60">
                  <label className="text-xs text-muted-foreground">URL da página</label>
                  <Input value={exp.target_url || ''} onChange={(e) => {
                    const val = e.target.value
                    setSelectedExperiment(se => se ? { ...se, target_url: val } : se)
                    setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, target_url: val } : e))
                  }} className="mt-1 h-9" placeholder="https://seusite.com" />
                </div>
                <div className="p-4 rounded-xl border bg-card/60">
                  <label className="text-xs text-muted-foreground">Duração (dias)</label>
                  <Input type="number" min={1} max={90} value={exp.duration_days || 14} onChange={(e) => {
                    const val = Number(e.target.value)
                    setSelectedExperiment(se => se ? { ...se, duration_days: val } : se)
                    setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, duration_days: val } : e))
                  }} className="mt-1 h-9" />
                </div>
                <div className="p-4 rounded-xl border bg-card/60">
                  <label className="text-xs text-muted-foreground">Amostra mínima</label>
                  <Input type="number" min={100} value={exp.min_sample_size || 1000} onChange={(e) => {
                    const val = Number(e.target.value)
                    setSelectedExperiment(se => se ? { ...se, min_sample_size: val } : se)
                    setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, min_sample_size: val } : e))
                  }} className="mt-1 h-9" />
                </div>
                <div className="p-4 rounded-xl border bg-card/60">
                  <label className="text-xs text-muted-foreground">Alocação de tráfego (%)</label>
                  <Input type="number" min={1} max={100} value={Math.round((exp.traffic_allocation||1))} onChange={(e) => {
                    const val = Math.max(1, Math.min(100, Number(e.target.value)))
                    const trafficAllocation = parseFloat(val.toFixed(2)) // Garantir precisão (5,2)
                    setSelectedExperiment(se => se ? { ...se, traffic_allocation: trafficAllocation } : se)
                    setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, traffic_allocation: trafficAllocation } : e))
                  }} className="mt-1 h-9" />
                </div>
                <div className="p-4 rounded-xl border bg-card/60">
                  <label className="text-xs text-muted-foreground">Tipo de meta</label>
                  <Select value={exp.goal_type || 'page_view'} onValueChange={(v) => {
                    setSelectedExperiment(se => se ? { ...se, goal_type: v as any } : se)
                    setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, goal_type: v as any } : e))
                  }}>
                    <SelectTrigger className="mt-1 h-9 rounded-xl">
                      <span>{getGoalTypeLabel(exp.goal_type || 'page_view')}</span>
                      <SelectValue className="sr-only" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page_view">Visualização de página</SelectItem>
                      <SelectItem value="click">Clique em elemento</SelectItem>
                      <SelectItem value="form_submit">Envio de formulário</SelectItem>
                      <SelectItem value="custom">Evento customizado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={exp.goal_value || ''} onChange={(e) => {
                    const val = e.target.value
                    setSelectedExperiment(se => se ? { ...se, goal_value: val } : se)
                    setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, goal_value: val } : e))
                  }} className="mt-2 h-9" placeholder=".selector ou /caminho ou nome_do_evento" />
                  { (exp.goal_type || 'page_view') === 'click' && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button size="sm" variant={clickPickerActive ? 'default' : 'outline'} onClick={() => setClickPickerActive(!clickPickerActive)}>
                        {clickPickerActive ? 'Clique em um elemento na página (ESC para cancelar)' : 'Selecionar no site'}
                      </Button>
                      <span className="text-[11px] text-muted-foreground">Dica: abra a página alvo e use o seletor visual.</span>
                    </div>
                  )}

                  {/* Templates rápidos de metas */}
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1">Templates rápidos</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedExperiment(se => se ? { ...se, goal_type: 'click', goal_value: '.btn-primary' } : se)
                        setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, goal_type: 'click', goal_value: '.btn-primary' } : e))
                      }}>.btn-primary</Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedExperiment(se => se ? { ...se, goal_type: 'form_submit', goal_value: '#contact-form' } : se)
                        setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, goal_type: 'form_submit', goal_value: '#contact-form' } : e))
                      }}>#contact-form</Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedExperiment(se => se ? { ...se, goal_type: 'page_view', goal_value: '/checkout' } : se)
                        setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, goal_type: 'page_view', goal_value: '/checkout' } : e))
                      }}>/checkout</Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedExperiment(se => se ? { ...se, goal_type: 'custom', goal_value: 'purchase_complete' } : se)
                        setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, goal_type: 'custom', goal_value: 'purchase_complete' } : e))
                      }}>purchase_complete</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="p-4 rounded-xl border bg-card/60">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Tags</h4>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {(exp.tags||[]).length === 0 && (
                    <span className="text-xs text-muted-foreground">Sem tags</span>
                  )}
                  {(exp.tags||[]).map((t, i) => (
                    <span key={i} className="chip bg-accent/40 border-border/60">
                      {t}
                      <button className="ml-1" onClick={() => {
                        setSelectedExperiment(se => se ? { ...se, tags: (se.tags||[]).filter(x => x !== t) } : se)
                        setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, tags: (e.tags||[]).filter(x => x !== t) } : e))
                      }}>×</button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Nova tag" className="h-9" onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = newTagValue.trim()
                      if (!val) return
                      setSelectedExperiment(se => se ? { ...se, tags: Array.from(new Set([...(se.tags||[]), val])) } : se)
                      setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, tags: Array.from(new Set([...(e.tags||[]), val])) } : e))
                      setNewTagValue('')
                    }
                  }} value={newTagValue} onChange={(e) => setNewTagValue(e.target.value)} />
                  <Button size="sm" variant="outline" onClick={() => {
                    const val = newTagValue.trim()
                    if (!val) return
                    setSelectedExperiment(se => se ? { ...se, tags: Array.from(new Set([...(se.tags||[]), val])) } : se)
                    setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, tags: Array.from(new Set([...(e.tags||[]), val])) } : e))
                    setNewTagValue('')
                  }}>Adicionar</Button>
                </div>
                {(() => {
                  const tagSet = new Set<string>()
                  experiments.forEach(e => (e.tags || []).forEach(t => tagSet.add(t)))
                  const existing = new Set(exp.tags || [])
                  const suggestions = Array.from(tagSet).filter(t => !existing.has(t) && t.toLowerCase().includes(newTagValue.toLowerCase())).slice(0, 6)
                  if (suggestions.length === 0 || !newTagValue) return null
                  return (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-muted-foreground mr-1">Sugestões:</span>
                      {suggestions.map(s => (
                        <button key={s} className="chip hover-lift" onClick={() => {
                          setSelectedExperiment(se => se ? { ...se, tags: Array.from(new Set([...(se.tags||[]), s])) } : se)
                          setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, tags: Array.from(new Set([...(e.tags||[]), s])) } : e))
                          setNewTagValue('')
                        }}>{s}</button>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Variantes (com links) */}
              {variantCount > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Variantes</h4>
                  <div className="space-y-2">
                    {exp.variants!.map((v, idx) => (
                      <div key={v.id} className="flex items-center justify-between p-2 rounded-md border bg-accent/20">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={"w-2 h-2 rounded-full " + (v.is_control ? 'bg-primary' : 'bg-muted-foreground')} />
                          <Input 
                            value={v.name}
                            onChange={(e) => {
                              const newName = e.target.value
                              // Update local drawer state
                              setSelectedExperiment(se => {
                                if (!se || !se.variants) return se
                                const updated = se.variants.map((vv, i) => i === idx ? { ...vv, name: newName } : vv)
                                return { ...se, variants: updated }
                              })
                              // Update global list
                              setExperiments(prev => prev.map(ex => {
                                if (ex.id !== exp.id || !ex.variants) return ex
                                const updated = ex.variants.map((vv, i) => i === idx ? { ...vv, name: newName } : vv)
                                return { ...ex, variants: updated }
                              }))
                            }}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          {v.is_control ? (
                            <Badge variant="outline" className="text-xs">Controle</Badge>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => {
                              // Set this variant as control
                              setSelectedExperiment(se => {
                                if (!se || !se.variants) return se
                                const updated = se.variants.map((vv, i) => ({ ...vv, is_control: i === idx }))
                                return { ...se, variants: updated }
                              })
                              setExperiments(prev => prev.map(ex => {
                                if (ex.id !== exp.id || !ex.variants) return ex
                                const updated = ex.variants.map((vv, i) => ({ ...vv, is_control: i === idx }))
                                return { ...ex, variants: updated }
                              }))
                            }} className="h-8">
                              Definir Controle
                            </Button>
                          )}
                          {exp.variants!.length > 2 && !v.is_control && (
                            <Button size="sm" variant="ghost" className="text-destructive h-8" onClick={() => {
                              setSelectedExperiment(se => {
                                if (!se || !se.variants) return se
                                if (se.variants.length <= 2) { toast.error('É necessário pelo menos 2 variantes'); return se }
                                const updated = se.variants.filter((_, i) => i !== idx)
                                return { ...se, variants: updated }
                              })
                              setExperiments(prev => prev.map(ex => {
                                if (ex.id !== exp.id || !ex.variants) return ex
                                if (ex.variants.length <= 2) return ex
                                const updated = ex.variants.filter((_, i) => i !== idx)
                                return { ...ex, variants: updated }
                              }))
                            }}>
                              Remover
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelectedExperiment(se => {
                        if (!se) return se
                        const count = se.variants?.length || 0
                        if (count >= 6) { toast.error('Máximo de 6 variantes'); return se }
                        const nextName = `Variante ${String.fromCharCode(65 + count - 1)}`
                        const newVar: Variant = { id: `v-${Date.now()}`, name: nextName, key: nextName.toLowerCase().replace(/\s+/g, '-'), is_control: false, url: '' }
                        return { ...se, variants: [...(se.variants||[]), newVar] }
                      })
                      setExperiments(prev => prev.map(ex => {
                        if (ex.id !== exp.id) return ex
                        const count = ex.variants?.length || 0
                        if (count >= 6) return ex
                        const nextName = `Variante ${String.fromCharCode(65 + count - 1)}`
                        const newVar: Variant = { id: `v-${Date.now()}`, name: nextName, key: nextName.toLowerCase().replace(/\s+/g, '-'), is_control: false, url: '' }
                        return { ...ex, variants: [...(ex.variants||[]), newVar] }
                      }))
                    }}>Adicionar Variante</Button>
                  </div>
                  {/* Links das variantes (Split URL) */}
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-muted-foreground">Links das variantes {exp.test_type === 'split_url' ? '' : '(somente em Split URL)'}</div>
                    {exp.test_type === 'split_url' && (
                      <div className="mb-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          const urls = (exp.variants||[]).map(v => v.url).filter(Boolean) as string[]
                          if (urls.length === 0) { toast.error('Nenhuma URL definida para as variantes'); return }
                          urls.forEach(u => window.open(u, '_blank'))
                        }}>Abrir todas as URLs</Button>
                      </div>
                    )}
                    {exp.variants!.map((v, idx) => (
                      <div key={v.id+"-url"} className="flex items-center gap-2">
                        <span className="text-xs w-16 shrink-0 {v.is_control ? 'text-primary' : ''}">{v.is_control ? 'Controle' : 'Variante'}</span>
                        <Input
                          value={v.url || ''}
                          onChange={(e) => {
                            const url = e.target.value
                            setSelectedExperiment(se => {
                              if (!se || !se.variants) return se
                              const updated = se.variants.map((vv, i) => i === idx ? { ...vv, url } : vv)
                              return { ...se, variants: updated }
                            })
                            setExperiments(prev => prev.map(ex => {
                              if (ex.id !== exp.id || !ex.variants) return ex
                              const updated = ex.variants.map((vv, i) => i === idx ? { ...vv, url } : vv)
                              return { ...ex, variants: updated }
                            }))
                          }}
                          placeholder={exp.test_type === 'split_url' ? (v.is_control ? exp.target_url || 'https://seusite.com/pagina-original' : 'https://seusite.com/variante') : 'N/A'}
                          disabled={exp.test_type !== 'split_url' || v.is_control}
                          className="h-8 text-sm"
                        />
                        {v.url && (
                          <a href={v.url} target="_blank" className="text-xs text-primary underline">
                            Abrir
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </>
              )}

              {drawerTab === 'code' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Código para inserir na página</h4>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyExperimentCode(exp)}>
                      <Code className="w-4 h-4 mr-1" /> Copiar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      const blob = new Blob([
                        '<!doctype html>\n<html><head><meta charset="utf-8"/><title>Experimento '+(exp.name||'')+'</title></head><body>\n',
                        code,
                        '\n<!-- Conteúdo da página -->\n</body></html>'
                      ], { type: 'text/html' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `experimento-${exp.id}.html`
                      document.body.appendChild(a)
                      a.click()
                      a.remove()
                      URL.revokeObjectURL(url)
                    }}>
                      Baixar .html
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <pre className="text-xs whitespace-pre-wrap leading-relaxed">{code}</pre>
                </div>
              </div>
              )}

              {drawerTab === 'details' && (
              /* Tips */
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="text-sm font-medium mb-1 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Dica</div>
                <div className="text-xs text-muted-foreground">Use as classes rf-show-<i>nome</i> e rf-hide-<i>nome</i> para alternar blocos de UI por variante.</div>
              </div>
              )}

              {drawerTab === 'timeline' && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Eventos Recentes</h4>
                  <div className="space-y-3">
                    {buildMockTimeline(exp).map((ev, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-1.5 " style={{ backgroundColor: ev.color }} />
                        <div>
                          <div className="text-sm font-medium">{ev.title}</div>
                          <div className="text-xs text-muted-foreground">{ev.time} • {ev.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </aside>
      </div>
    )
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-4">
        {[
          { number: 1, title: 'Básico', icon: Target, color: 'blue' as const },
          { number: 2, title: 'Configuração', icon: Globe, color: 'green' as const },
          { number: 3, title: 'Variantes', icon: Shuffle, color: 'purple' as const },
          { number: 4, title: 'Metas & Conversão', icon: TrendingUp, color: 'orange' as const }
        ].map((step, index) => {
          const isActive = step.number === experimentStep
          const isCompleted = step.number < experimentStep
          const canClick = step.number <= experimentStep + 1
          const Icon = step.icon
          const palette = stepColorStyles[step.color]
          
          return (
            <div key={step.number} className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => canClick && goToStep(step.number)}
                  disabled={!canClick}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 relative
                  ${isActive ? palette.active : isCompleted ? palette.completed : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}
                  ${canClick ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </button>
                
                <div className="text-center">
                  <div className={`text-sm font-semibold ${isActive ? palette.labelActive : isCompleted ? palette.labelCompleted : 'text-gray-400 dark:text-gray-500'}`}>
                    {step.title}
                  </div>
                </div>
              </div>
              
              {index < 3 && (
                <div className={`w-12 h-1 rounded-full transition-all duration-300 ${experimentStep > step.number ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-200">
          <Target className="w-10 h-10 text-indigo-600" />
        </div>
        <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Informações Básicas
        </h3>
        <p className="text-slate-600 text-lg">
          Vamos começar definindo o seu experimento
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            Nome do Experimento *
          </label>
          <Input 
            ref={step1NameRef}
            value={experimentForm.name}
            onChange={(e) => setExperimentForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Teste CTA Principal - Botão vs Link"
            className="h-14 text-base border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl bg-white shadow-sm transition-all"
          />
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Use um nome descritivo que identifique claramente o teste
          </p>
        </div>
        
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            Descrição
            <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">(Opcional)</span>
          </label>
          <Textarea 
            value={experimentForm.description}
            onChange={(e) => setExperimentForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descreva sua hipótese e o que espera descobrir com este teste..."
            className="min-h-[120px] text-base border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl bg-white resize-none shadow-sm transition-all"
            rows={5}
          />
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Documente sua hipótese para acompanhar os resultados
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Dicas para um bom experimento
          </h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span>Teste <strong>uma mudança</strong> por vez para resultados claros</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span>Defina uma <strong>hipótese clara</strong> antes de começar</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span>Escolha um elemento com <strong>impacto nas conversões</strong></span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )


  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
          <Globe className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Configuração do Teste</h3>
        <p className="text-muted-foreground">Configure onde e como o teste será executado</p>
      </div>

          <div className="space-y-4">
            <div>
          <label className="text-sm font-medium text-foreground">URL de Destino *</label>
              <Input 
            ref={step2UrlRef}
            value={experimentForm.targetUrl}
            onChange={(e) => setExperimentForm(prev => ({ ...prev, targetUrl: e.target.value }))}
            placeholder="https://seusite.com/pagina"
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">Página onde o teste será executado</p>
            </div>
            
            <div>
          <label className="text-sm font-medium text-foreground">Tipo de Teste</label>
          <Select 
            value={experimentForm.testType} 
            onValueChange={(value) => setExperimentForm(prev => ({ ...prev, testType: value as any }))}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Selecione o tipo de teste" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="split_url">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Teste de URL</div>
                    <div className="text-xs text-muted-foreground">Testa páginas diferentes</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="visual">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Teste Visual</div>
                    <div className="text-xs text-muted-foreground">Testa elementos visuais</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="feature_flag">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Feature Flag</div>
                    <div className="text-xs text-muted-foreground">Teste funcionalidades</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Audiência</label>
            <Select 
              value={experimentForm.audienceType} 
              onValueChange={(value) => setExperimentForm(prev => ({ ...prev, audienceType: value as any }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione o tipo de teste" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os visitantes</SelectItem>
                <SelectItem value="returning">Visitantes recorrentes</SelectItem>
                <SelectItem value="custom">Audiência customizada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Alocação de Tráfego</label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input 
                type="number" 
                min={1} 
                max={100}
                value={experimentForm.trafficAllocation}
                onChange={(e) => setExperimentForm(prev => ({ ...prev, trafficAllocation: Number(e.target.value) }))}
                className="text-right"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Configuração do Teste</p>
              <p className="text-xs text-muted-foreground">
                {experimentForm.testType === 'split_url' && 'Cada variante terá uma URL específica para redirecionar o tráfego.'}
                {experimentForm.testType === 'visual' && 'O teste modificará elementos visuais da página usando JavaScript.'}
                {experimentForm.testType === 'feature_flag' && 'O teste habilitará/desabilitará funcionalidades específicas.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/20">
          <Shuffle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Variantes do Teste</h3>
        <p className="text-muted-foreground">Configure as diferentes versões que serão testadas</p>
      </div>

      <div className="space-y-4">
        {experimentForm.variants.map((variant, index) => (
          <div key={index} className={`p-4 rounded-lg border-2 transition-colors ${
            variant.isControl 
              ? 'border-primary/50 bg-primary/5' 
              : 'border-border bg-card'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  variant.isControl ? 'bg-primary' : 'bg-muted-foreground'
                }`} />
                <Input
                  ref={index === 0 ? step3Variant0Ref : undefined}
                  value={variant.name}
                  onChange={(e) => updateVariant(index, 'name', e.target.value)}
                  className="font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                  placeholder="Nome da variante"
                />
                {variant.isControl && (
                  <Badge variant="outline" className="text-xs">Controle</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {!variant.isControl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setVariantAsControl(index)}
                    className="h-8 px-2 text-xs"
                  >
                    Definir como Controle
            </Button>
                )}
                {experimentForm.variants.length > 2 && !variant.isControl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(index)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
            </Button>
                )}
          </div>
            </div>

            <Textarea
              value={variant.description}
              onChange={(e) => updateVariant(index, 'description', e.target.value)}
              placeholder="Descreva o que esta variante testa..."
              className="mb-3 text-sm"
              rows={2}
            />

            {experimentForm.testType === 'split_url' && (
              <Input
                value={variant.url}
                onChange={(e) => updateVariant(index, 'url', e.target.value)}
                placeholder={variant.isControl ? experimentForm.targetUrl : "https://seusite.com/variante-a"}
                className="text-sm"
                disabled={variant.isControl}
              />
            )}
          </div>
        ))}

        {experimentForm.variants.length < 5 && (
          <Button
            type="button"
            variant="outline"
            onClick={addVariant}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Variante
          </Button>
        )}

        <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Configuração das Variantes</p>
              <p className="text-xs text-muted-foreground">
                A variante de controle representa a versão atual. As outras variantes serão as novas versões a testar. O tráfego será distribuído igualmente entre todas as variantes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
          <TrendingUp className="w-8 h-8 text-orange-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Metas & Conversão</h3>
        <p className="text-muted-foreground">Configure o objetivo do teste e como medir o sucesso</p>
      </div>

      <div className="space-y-6">
        {/* Objetivo do Teste */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Objetivo do Teste
          </h4>
          <div>
            <label className="text-sm font-medium text-blue-900">Qual é o objetivo principal? *</label>
            <Input 
              ref={step4GoalRef}
              value={experimentForm.primaryGoal}
              onChange={(e) => setExperimentForm(prev => ({ ...prev, primaryGoal: e.target.value }))}
              placeholder="Ex: Aumentar conversões do botão principal"
              className="mt-2 border-blue-200 focus:border-blue-500"
            />
            <p className="text-xs text-blue-700 mt-1">Descreva claramente o que você quer otimizar com este teste</p>
          </div>
        </div>

        {/* Configuração de Conversão */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Como Medir a Conversão
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-green-900">Tipo de Conversão *</label>
              <Select 
                value={experimentForm.conversionType} 
                onValueChange={(value) => setExperimentForm(prev => ({ ...prev, conversionType: value as any }))}
              >
                <SelectTrigger className="mt-2 border-green-200 focus:border-green-500">
                  <SelectValue placeholder="Selecione como medir a conversão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page_view">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Visualização de Página</div>
                        <div className="text-xs text-muted-foreground">Quando acessa uma página específica</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="click">
                    <div className="flex items-center gap-2">
                      <MousePointer className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Clique em Elemento</div>
                        <div className="text-xs text-muted-foreground">Quando clica em botão ou link</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="form_submit">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Envio de Formulário</div>
                        <div className="text-xs text-muted-foreground">Quando envia um formulário</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Evento Personalizado</div>
                        <div className="text-xs text-muted-foreground">Evento via JavaScript</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {experimentForm.conversionType === 'page_view' && (
              <div>
                <label className="text-sm font-medium text-green-900">URL da Página de Conversão *</label>
                <Input 
                  value={experimentForm.conversionUrl}
                  onChange={(e) => setExperimentForm(prev => ({ ...prev, conversionUrl: e.target.value }))}
                  placeholder="https://seusite.com/obrigado"
                  className="mt-2 border-green-200 focus:border-green-500"
                />
                <p className="text-xs text-green-700 mt-1">URL da página que indica sucesso (ex: página de agradecimento)</p>
              </div>
            )}

            {experimentForm.conversionType === 'click' && (
              <div>
                <label className="text-sm font-medium text-green-900">Seletor CSS do Elemento *</label>
                <Input 
                  value={experimentForm.conversionSelector}
                  onChange={(e) => setExperimentForm(prev => ({ ...prev, conversionSelector: e.target.value }))}
                  placeholder=".btn-comprar, #botao-checkout"
                  className="mt-2 border-green-200 focus:border-green-500"
                />
                <p className="text-xs text-green-700 mt-1">Seletor CSS do elemento que será monitorado</p>
              </div>
            )}

            {experimentForm.conversionType === 'form_submit' && (
              <div>
                <label className="text-sm font-medium text-green-900">Seletor do Formulário *</label>
                <Input 
                  value={experimentForm.conversionSelector}
                  onChange={(e) => setExperimentForm(prev => ({ ...prev, conversionSelector: e.target.value }))}
                  placeholder="#form-contato, .form-newsletter"
                  className="mt-2 border-green-200 focus:border-green-500"
                />
                <p className="text-xs text-green-700 mt-1">Seletor CSS do formulário</p>
              </div>
            )}

            {experimentForm.conversionType === 'custom' && (
              <div>
                <label className="text-sm font-medium text-green-900">Nome do Evento Personalizado *</label>
                <Input 
                  value={experimentForm.conversionEvent}
                  onChange={(e) => setExperimentForm(prev => ({ ...prev, conversionEvent: e.target.value }))}
                  placeholder="purchase_complete, signup_success"
                  className="mt-2 border-green-200 focus:border-green-500"
                />
                <p className="text-xs text-green-700 mt-1">Nome do evento que será disparado via JavaScript</p>
              </div>
            )}
          </div>
        </div>

        {/* Configurações Avançadas */}
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6">
          <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações do Teste
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-purple-900">Duração Estimada</label>
              <div className="mt-2 flex items-center gap-2">
                <Input 
                  type="number"
                  min={1}
                  max={90}
                  value={experimentForm.duration}
                  onChange={(e) => setExperimentForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  className="text-right border-purple-200 focus:border-purple-500"
                />
                <span className="text-sm text-purple-700">dias</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-purple-900">Algoritmo de Otimização</label>
              <Select 
                value={experimentForm.algorithm} 
                onValueChange={(value) => setExperimentForm(prev => ({ ...prev, algorithm: value as any }))}
              >
                <SelectTrigger className="mt-2 border-purple-200 focus:border-purple-500">
                  <SelectValue placeholder="Selecione o algoritmo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thompson_sampling">
                    <div>
                      <div className="font-medium">Thompson Sampling</div>
                      <div className="text-xs text-muted-foreground">Otimização inteligente (recomendado)</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="ucb1">
                    <div>
                      <div className="font-medium">UCB1</div>
                      <div className="text-xs text-muted-foreground">Limite Superior de Confiança</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="uniform">
                    <div>
                      <div className="font-medium">Distribuição Uniforme</div>
                      <div className="text-xs text-muted-foreground">Tráfego igual para todas as variantes</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-4">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-slate-800">
            <Eye className="w-4 h-4" />
            Resumo do Experimento
          </h4>
          <div className="space-y-1 text-xs text-slate-600">
            <p><span className="font-medium">Teste:</span> {experimentForm.name || 'Não definido'}</p>
            <p><span className="font-medium">Página:</span> {experimentForm.targetUrl || 'Não definida'}</p>
            <p><span className="font-medium">Variantes:</span> {experimentForm.variants.length} configuradas</p>
            <p><span className="font-medium">Objetivo:</span> {experimentForm.primaryGoal || 'Não definido'}</p>
            <p><span className="font-medium">Conversão:</span> {
              experimentForm.conversionType === 'page_view' ? 'Visualização de Página' :
              experimentForm.conversionType === 'click' ? 'Clique em Elemento' :
              experimentForm.conversionType === 'form_submit' ? 'Envio de Formulário' :
              experimentForm.conversionType === 'custom' ? 'Evento Personalizado' : 'Não definido'
            }</p>
            <p><span className="font-medium">Duração:</span> {experimentForm.duration} dias</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep5 = () => {
    // Construir um objeto Experiment temporário a partir do formulário
    const tempExp: Experiment = {
      id: `temp-${Date.now()}`,
      name: experimentForm.name || 'Novo Experimento',
      status: 'draft',
      created_at: new Date().toISOString(),
      // projeto removido
      algorithm: experimentForm.algorithm as any,
      target_url: experimentForm.targetUrl || undefined,
      goal_type: experimentForm.goalType as any,
      goal_value: experimentForm.goalValue || undefined,
      duration_days: experimentForm.duration,
      traffic_allocation: parseFloat((experimentForm.trafficAllocation || 100).toFixed(2)),
      variants: experimentForm.variants.map((v, i) => ({ id: `v-${i}`, name: v.name, key: v.name.toLowerCase().replace(/\s+/g, '-'), is_control: v.isControl }))
    }

    const code = generateInstallCodeForExperiment(tempExp)
    const copyCode = async () => {
      try {
        await navigator.clipboard.writeText(code)
        toast.success('Código copiado!')
      } catch (error) {
        toast.error('Erro ao copiar código')
      }
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/20">
            <Code className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Código de Instalação</h3>
          <p className="text-muted-foreground">Copie e cole este código no seu site</p>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-600" />
                Código 100% Pronto
              </h4>
              <Button
                type="button"
                size="sm"
                onClick={copyCode}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar & Colar
              </Button>
            </div>
              <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
              <code>{code}</code>
              </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-5">
              <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                ✅ Sistema Inteligente
              </h4>
              <ul className="space-y-2 text-sm text-emerald-800">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-2 flex-shrink-0" />
                  <span><strong>ID único</strong> gerado automaticamente</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-2 flex-shrink-0" />
                  <span><strong>Distribuição</strong> baseada em hash consistente</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-2 flex-shrink-0" />
                  <span><strong>Rastreamento</strong> automático configurado</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-2 flex-shrink-0" />
                  <span><strong>Backup local</strong> dos dados incluído</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                🎯 Como Usar
              </h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span>Cole antes do <strong>&lt;/head&gt;</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span>Use classes <strong>.rf-show-*</strong> e <strong>.rf-hide-*</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span>Publique e o teste <strong>inicia automaticamente</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span>Monitore via <strong>console.log</strong> ou analytics</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
            <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              💡 Classes CSS Geradas Automaticamente
            </h4>
            <div className="bg-white rounded-xl p-4 border border-purple-100">
              <pre className="text-sm text-purple-800 whitespace-pre-wrap">
{experimentForm.variants.map(variant => {
  const className = variant.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `/* ${variant.name} */
.rf-show-${className} { /* Mostra apenas para ${variant.name} */ }
.rf-hide-${className} { /* Oculta apenas para ${variant.name} */ }`;
}).join('\n\n')}

{`/* Exemplo de uso no HTML */
<div class="rf-show-original">Versão Original</div>
<div class="rf-show-variacao">Nova Versão</div>`}
              </pre>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
            <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              ⚡ Funcionalidades Incluídas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-800">
              <div>
                <h5 className="font-medium mb-2">🚀 Automático:</h5>
                <ul className="space-y-1">
                  <li>• Distribuição consistente de usuários</li>
                  <li>• Persistência de variante no localStorage</li>
                  <li>• Redirecionamento para Split URL</li>
                  <li>• Anti-flicker CSS integrado</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">📊 Rastreamento:</h5>
                <ul className="space-y-1">
                  <li>• Page views automáticos</li>
                  <li>• Conversões configuradas</li>
                  <li>• Backup local dos eventos</li>
                  <li>• Debug logs no console</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNewExperimentModal = () => (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="new-experiment-title">
      {/* Enhanced Backdrop */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-indigo-900/60 backdrop-blur-md" 
        onClick={() => !saving && setShowNew(false)} 
      />
      
      {/* Enhanced Modal */}
      <div ref={modalRef} className="relative mx-auto mt-4 mb-4 w-full max-w-4xl h-[92vh] rounded-3xl bg-white shadow-2xl border border-white/20 overflow-hidden focus:outline-none" tabIndex={-1} style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex flex-col h-full">
          {/* Modern Header */}
          <div className="relative px-8 py-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-white/5 to-transparent rounded-full -translate-y-32 translate-x-32" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 id="new-experiment-title" className="text-2xl font-bold">
                      Novo Experimento A/B
                    </h2>
                    <p className="text-white/80 text-sm">Otimize suas conversões com testes inteligentes</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => !saving && setShowNew(false)}
                  className="h-10 w-10 p-0 rounded-xl hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                  disabled={saving}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Enhanced Progress */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(experimentStep / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80 font-medium">Passo {experimentStep} de 5</span>
                  <span className="text-white font-semibold">{Math.round((experimentStep / 5) * 100)}% concluído</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Step Navigator */}
          <div className="px-8 py-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/60">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-6">
                {[
                  { number: 1, title: 'Básico', icon: Target, color: 'indigo' },
                  { number: 2, title: 'Setup', icon: Globe, color: 'blue' },
                  { number: 3, title: 'Variantes', icon: Shuffle, color: 'purple' },
                  { number: 4, title: 'Objetivos', icon: TrendingUp, color: 'pink' },
                  { number: 5, title: 'Deploy', icon: Zap, color: 'emerald' }
                ].map((step, index) => {
                  const isActive = step.number === experimentStep
                  const isCompleted = step.number < experimentStep
                  const canClick = step.number <= experimentStep + 1
                  const Icon = step.icon
                  
                  return (
                    <div key={step.number} className="flex items-center gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          type="button"
                          onClick={() => canClick && goToStep(step.number)}
                          disabled={!canClick}
                          className={`relative w-12 h-12 rounded-2xl flex items-center justify-center font-semibold transition-all duration-300 transform
                            ${isActive 
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-110 ring-4 ring-indigo-500/20' 
                              : isCompleted
                              ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border border-slate-300 hover:scale-105 hover:shadow-md'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'}
                            ${canClick ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                          `}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                          {isActive && (
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
                          )}
                        </button>
                        
                        <div className="text-center">
                          <div className={`text-xs font-semibold transition-colors ${
                            isActive ? 'text-indigo-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                          }`}>
                            {step.title}
                          </div>
                        </div>
                      </div>
                      
                      {index < 4 && (
                        <div className={`w-16 h-1 rounded-full transition-all duration-500 ${
                          experimentStep > step.number 
                            ? 'bg-gradient-to-r from-indigo-400 to-purple-400' 
                            : 'bg-slate-200'
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Enhanced Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              <div className="max-w-2xl mx-auto">
                {experimentStep === 1 && renderStep1()}
                {experimentStep === 2 && renderStep2()}
                {experimentStep === 3 && renderStep3()}
                {experimentStep === 4 && renderStep4()}
                {experimentStep === 5 && renderStep5()}
              </div>
            </div>
          </div>

          {/* Modern Footer */}
          <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200/60">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleExperimentStepPrev}
                disabled={experimentStep === 1 || saving}
                className="h-11 px-6 rounded-xl border-slate-300 hover:bg-slate-100 hover:border-slate-400 font-medium transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              <div className="flex items-center gap-4">
                {experimentStep < 5 ? (
                  <Button
                    onClick={handleExperimentStepNext}
                    disabled={saving}
                    className="h-11 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-105"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleCreateFullExperiment}
                    disabled={saving}
                    className="h-11 px-8 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-105"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Criar Experimento
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <DashboardNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={{
          activeExperiments: stats.activeExperiments,
          totalVisitors: stats.totalVisitors
        }}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <Skeleton />
        ) : (
          <>
            {getTabContent()}
            {renderExperimentDrawer()}
            {showNew && renderNewExperimentModal()}
          </>
        )}
      </main>
    </div>
  )
}
