"use client"

import { useEffect, useRef, useState } from 'react'
import { Plus, BarChart3, Users, Target, TrendingUp, Activity, Settings, LogOut, MoreHorizontal, ArrowUpDown, Zap, Database, ArrowRight, ArrowLeft, Check, X, Globe, Eye, Clock, ChevronDown, Calendar, AlertCircle, MousePointer, Play, Pause, Flag, Layout, Trash2, Copy, Shuffle, Code, Lightbulb, Star, Filter, Upload, Sun, Moon, Shield, Bell, KeyRound, Globe2, User2, RefreshCw, Download, Save, Search, Trash, MousePointerClick, Goal, DollarSign } from 'lucide-react'
import { ResponsiveContainer, BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { ModernExperimentModal } from '@/components/dashboard/modern-experiment-modal'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { ChartsSection } from '@/components/dashboard/charts-section'
import { RealtimeActivity } from '@/components/dashboard/realtime-activity'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/providers/app-provider'
import { toast } from 'sonner'
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EmptyState } from '@/components/empty-state'

interface Variant { id: string; name: string; key: string; is_control: boolean; url?: string; description?: string; config?: any; weight?: number }
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
interface Stats { 
  activeExperiments: number; 
  totalVisitors: number; 
  conversionRate: number;
  totalProjects: number;
  totalRevenue?: number;
  avgSessionDuration?: number;
  bounceRate?: number;
}

export default function Dashboard() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  // Projetos removidos
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'draft' | 'paused' | 'completed'>('all')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [sort, setSort] = useState<{ key: 'name' | 'created' | 'status'; dir: 'asc' | 'desc' }>({ key: 'created', dir: 'desc' })
  // Stats removido - agora usamos realtimeStats
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newForm, setNewForm] = useState<{ name: string; variants: number }>({ name: '', variants: 2 })
  const [activeTab, setActiveTab] = useState('overview')
  const { preferences, updatePreference } = useApp()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [projectFilter, setProjectFilter] = useState<'all' | string>('all')
  const [projects, setProjects] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)

  // Hook de analytics em tempo real
  const {
    stats: realtimeStats,
    metrics: realtimeMetrics,
    recentEvents,
    recentAssignments,
    isConnected,
    lastUpdate,
    refreshData
  } = useRealtimeAnalytics(timeRange)
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

  // Sync local timeRange with global preference
  useEffect(() => {
    setTimeRange((preferences?.defaultTimeRange as any) || '30d')
  }, [preferences?.defaultTimeRange])

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
        if (!sessionData.session?.user) {
          console.log('⚠️ Usuário não autenticado para carregar projetos')
          return
        }
        
        console.log('🔄 Carregando projetos para usuário:', sessionData.session.user.id)
        
        const { data, error } = await (supabase as any)
          .from('projects')
          .select('id, name')
          .order('created_at', { ascending: false })
          
        if (error) {
          console.error('❌ Erro ao carregar projetos:', error)
          // Usar projeto padrão se houver erro
          setProjects([{ id: 'b302fac6-3255-4923-833b-5e71a11d5bfe', name: 'Projeto Principal' }])
          return
        }
        
        console.log('✅ Projetos carregados:', data?.length || 0)
        setProjects(data || [{ id: 'b302fac6-3255-4923-833b-5e71a11d5bfe', name: 'Projeto Principal' }])
      } catch (err) {
        console.error('❌ Erro ao buscar projetos:', err)
        // Usar projeto padrão em caso de erro
        setProjects([{ id: 'b302fac6-3255-4923-833b-5e71a11d5bfe', name: 'Projeto Principal' }])
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
        const code = enhanceInstallCode(generateInstallCodeForExperiment(e))
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

  // Recarregar dados ao alterar período global/local
  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  // Função para recarregar dados
  const refreshData = () => {
    loadDashboardData()
  }

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Erro ao verificar autenticação:', error)
        // Redirecionar para login se não autenticado
        window.location.href = '/auth/signin'
        return
      }

      if (user) {
        console.log('✅ Usuário autenticado:', user.email)
        setUser(user)
      } else {
        console.log('❌ Usuário não autenticado, redirecionando...')
        window.location.href = '/auth/signin'
      }
    } catch (error) {
      console.error('Erro na verificação de usuário:', error)
      window.location.href = '/auth/signin'
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Carregando experimentos do Supabase...')
      
      // Verificar autenticação primeiro
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 Usuário autenticado:', user?.id || 'NENHUM')
      
      if (authError || !user) {
        console.log('⚠️ Usuário não autenticado, usando dados vazios')
        setExperiments([])
        return
      }
      
      // Carregar experimentos (filtrar por organizações do usuário)
      const { data: experimentsData, error: experimentsError } = await supabase
        .from('experiments')
        .select(`
          *,
          variants:variants(*),
          projects:projects!inner(
            id,
            name,
            organization_members!inner(user_id)
          )
        `)
        .eq('projects.organization_members.user_id', user.id)
        .order('created_at', { ascending: false })

      if (experimentsError) {
        console.error('Erro ao carregar experimentos:', experimentsError)
        throw experimentsError
      }

      console.log('✅ Experimentos carregados para o usuário:', experimentsData?.length || 0)
      
      // Transformar dados para o formato esperado
      const formattedExperiments = (experimentsData || []).map(exp => ({
        id: exp.id,
        name: exp.name,
        description: exp.description,
        status: exp.status,
        created_at: exp.created_at,
        project_id: exp.project_id,
        algorithm: exp.mab_config?.algorithm || 'thompson_sampling',
        traffic_allocation: exp.traffic_allocation,
        variants: (exp.variants || []).map((v: any) => ({
          id: v.id,
          name: v.name,
          key: v.key || v.name?.toLowerCase().replace(/\s+/g, '-') || 'variant',
          is_control: v.is_control,
          weight: v.weight || v.traffic_percentage || 50,
          url: v.url || v.target_url || v.config?.url || v.config?.target_url || undefined,
          description: v.description || (typeof v.config?.rules === 'string' ? v.config.rules : (v.config?.rules ? JSON.stringify(v.config.rules) : undefined)),
          config: v.config || {}
        }))
      }))

      setExperiments(formattedExperiments)
      
      // ✅ Estatísticas agora vêm do hook em tempo real
      console.log('📊 Estatísticas em tempo real:', realtimeStats)
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Em caso de erro, mostrar lista vazia
      console.log('❌ Erro ao carregar experimentos, mostrando lista vazia')
      setExperiments([])
      
      // ✅ Estatísticas agora são gerenciadas pelo hook em tempo real
      console.log('📈 Hook em tempo real carregará as estatísticas automaticamente')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      console.log('🚪 Fazendo logout...')
      await supabase.auth.signOut()
      console.log('✅ Logout realizado com sucesso')
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Forçar redirecionamento mesmo com erro
      window.location.href = '/auth/signin'
    }
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
    try {
      const exp = selectedExperiment || experiments[0]
      const code = exp ? enhanceInstallCode(generateInstallCodeForExperiment(exp)) : "<script>/* Rota Final: crie um experimento para gerar o código */</script>"
      await navigator.clipboard.writeText(code)
      toast.success('Código de instalação copiado')
    } catch {
      toast.error('Não foi possível copiar o código')
    }
  }

  // Aplica melhorias ao snippet: anti-flicker e ajustes de robustez
  const enhanceInstallCode = (code: string) => {
    try {
      let out = code
      // Anti-flicker: adiciona estilo e aplica classe no começo do script
      out = out.replace('\n<script>(function(){', '\n<style id="rf-af">html.rf-af{opacity:0!important}</style>\n<script>(function(){try{document.documentElement.classList.add("rf-af")}catch(e){};setTimeout(function(){try{document.documentElement.classList.remove("rf-af")}catch(e){}},1500);')
      // Após aplicar regras, apenas remove anti-flicker antes do primeiro track
      out = out.replace('applyRules(variant);\n    window.rotaFinal.track', 'applyRules(variant);\n    try{document.documentElement.classList.remove("rf-af")}catch(e){}\n    window.rotaFinal.track')
      return out
    } catch {
      return code
    }
  }

  // Gera o código que deve estar na página para um experimento específico
  const generateInstallCodeForExperiment = (exp: Experiment) => {
    const experimentId = `exp_${exp.id}`
    const name = exp.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const variants = (exp.variants || []).map(v => ({
      name: v.name,
      key: v.key || v.name.toLowerCase(),
      url: v.url ?? (v as any).target_url ?? v.config?.url ?? v.config?.target_url ?? null,
      isControl: v.is_control,
      weight: v.weight || 50,
      description: v.description ?? (typeof v.config?.rules === 'string' ? v.config.rules : (v.config?.rules ? JSON.stringify(v.config.rules) : null))
    }))
    const goal = (exp as any).goal_value || (exp as any).goal_type || 'conversion'
    const goalType = (exp as any).goal_type || 'page_view'
    const targetUrl = (exp as any).target_url || ''
    const algorithm = exp.algorithm || 'thompson_sampling'
    const inferredMethod = variants.some(v => !!v.url) ? 'split_url' : 'visual'
    const method = (exp as any).test_type || inferredMethod

    // Build goal handler melhorado
    const goalHandler = (() => {
      if (goalType === 'click' && exp.goal_value) {
        return `document.addEventListener('click',function(e){if(e.target.matches('${exp.goal_value}')||e.target.closest('${exp.goal_value}')){window.rotaFinal.track('${goal}',{variant:variant,selector:'${exp.goal_value}',value:1})}});`
      }
      if (goalType === 'form_submit' && exp.goal_value) {
        return `var f=document.querySelector('${exp.goal_value}');if(f){f.addEventListener('submit',function(e){window.rotaFinal.track('${goal}',{variant:variant,form:'${exp.goal_value}',value:1})})}`
      }
      if (goalType === 'page_view' && exp.goal_value) {
        return `if(location.pathname==='${exp.goal_value}'||location.href.indexOf('${exp.goal_value}')>-1){window.rotaFinal.track('${goal}',{variant:variant,page:'${exp.goal_value}',value:1})}`
      }
      return `window.rotaFinal.track('page_view',{variant:variant,experiment_start:true,value:1});`
    })()

    return `<!-- 🚀 Rota Final - Experimento: ${name} -->\n<script>(function(){\n  const CONFIG={experimentId:'${experimentId}',algorithm:'${algorithm}',method:'${method}',targetUrl:'${targetUrl}',goal:'${goal}',goalType:'${goalType}',variants:${JSON.stringify(variants)}};\n  const userId=localStorage.getItem('rf_user_id')||'user_'+Math.random().toString(36).slice(2)+Date.now();\n  localStorage.setItem('rf_user_id',userId);\n  \n  function assign(){\n    const saved=localStorage.getItem('rf_variant_'+CONFIG.experimentId);\n    if(saved && CONFIG.variants.find(v=>v.name===saved)) return saved;\n    \n    // Algoritmo de atribuição melhorado\n    if(CONFIG.algorithm==='thompson_sampling'){\n      // Simulação simples do Thompson Sampling\n      const weights=CONFIG.variants.map(v=>v.weight||50);\n      const total=weights.reduce((a,b)=>a+b,0);\n      const random=Math.random()*total;\n      let cumulative=0;\n      for(let i=0;i<weights.length;i++){\n        cumulative+=weights[i];\n        if(random<=cumulative){\n          const variant=CONFIG.variants[i].name;\n          localStorage.setItem('rf_variant_'+CONFIG.experimentId,variant);\n          return variant;\n        }\n      }\n    }\n    \n    // Fallback: hash consistente baseado no userId\n    const hash=userId.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);\n    const idx=Math.abs(hash)%CONFIG.variants.length;\n    const variant=CONFIG.variants[idx]?.name||CONFIG.variants[0]?.name;\n    localStorage.setItem('rf_variant_'+CONFIG.experimentId,variant);\n    return variant;\n  }\n  \n  // Utilitários de aplicação visual melhorados\n  function applyRules(variant){\n    try {\n      const cfg=CONFIG.variants.find(v=>v.name===variant);\n      let rules={};\n      if(cfg?.description){ \n        try{ rules=JSON.parse(cfg.description) }catch(e){ \n          console.warn('Rota Final: descrição da variante não é JSON válido', e);\n          // Tentar interpretar como CSS simples\n          if(typeof cfg.description==='string' && cfg.description.includes(':')){\n            rules={injectCSS:cfg.description};\n          }\n        } \n      }\n      \n      // Aplicar regras com melhor tratamento de erros\n      const applyRule=(ruleType,handler)=>{\n        const ruleList=Array.isArray(rules[ruleType])?rules[ruleType]:[];\n        ruleList.forEach(rule=>{\n          try{ handler(rule) }catch(e){ console.warn('Rota Final: erro ao aplicar regra '+ruleType,e) }\n        });\n      };\n      \n      // Hide elements\n      applyRule('hide',sel=>{\n        document.querySelectorAll(sel).forEach(el=>el.style.setProperty('display','none','important'));\n      });\n      \n      // Show elements\n      applyRule('show',sel=>{\n        document.querySelectorAll(sel).forEach(el=>el.style.removeProperty('display'));\n      });\n      \n      // Text replacement\n      applyRule('text',rule=>{\n        document.querySelectorAll(rule.selector).forEach(el=>el.textContent=rule.value);\n      });\n      \n      // Attribute changes\n      applyRule('attr',rule=>{\n        document.querySelectorAll(rule.selector).forEach(el=>el.setAttribute(rule.name,rule.value));\n      });\n      \n      // CSS styles\n      applyRule('css',rule=>{\n        document.querySelectorAll(rule.selector).forEach(el=>{\n          const currentStyle=el.getAttribute('style')||'';\n          el.setAttribute('style',currentStyle+';'+rule.style);\n        });\n      });\n      \n      // Inject CSS\n      if(rules.injectCSS){\n        const style=document.createElement('style');\n        style.textContent=String(rules.injectCSS);\n        style.setAttribute('data-rf-experiment',CONFIG.experimentId);\n        document.head.appendChild(style);\n      }\n      \n      // URL redirect for split testing\n      if(CONFIG.method==='split_url' && cfg?.url && !cfg.isControl){\n        if(location.href.indexOf(cfg.url)===-1){\n          location.href=cfg.url;\n          return;\n        }\n      }\n      \n    } catch(err){ console.warn('Rota Final: erro geral ao aplicar regras',err) }\n  }\n  \n  // API de tracking melhorada\n  window.rotaFinal=window.rotaFinal||{\n    track:(event,properties={})=>{\n      const data={\n        experiment_id:CONFIG.experimentId,\n        event_type:event,\n        visitor_id:userId,\n        variant:document.documentElement.getAttribute('data-rf-variant'),\n        url:location.href,\n        timestamp:new Date().toISOString(),\n        properties:properties\n      };\n      console.log('📊 Rota Final Track:',data);\n      \n      // Enviar para servidor (se disponível)\n      try{\n        if(navigator.sendBeacon){\n          navigator.sendBeacon('/api/track',JSON.stringify(data));\n        } else {\n          fetch('/api/track',{\n            method:'POST',\n            headers:{'Content-Type':'application/json'},\n            body:JSON.stringify(data)\n          }).catch(e=>console.warn('Tracking failed:',e));\n        }\n      }catch(e){\n        console.warn('Rota Final: falha ao enviar evento',e);\n      }\n    },\n    getVariant:()=>document.documentElement.getAttribute('data-rf-variant'),\n    getUserId:()=>userId,\n    getExperimentId:()=>CONFIG.experimentId\n  };\n  \n  const variant=assign();\n  \n  function init(){\n    document.documentElement.setAttribute('data-rf-variant',variant);\n    document.documentElement.setAttribute('data-rf-experiment',CONFIG.experimentId);\n    \n    applyRules(variant);\n    \n    // Track page view\n    ${goalHandler}\n    \n    // Adicionar listeners para conversões automáticas\n    document.addEventListener('click',function(e){\n      const el=e.target.closest('[data-rf-conversion]');\n      if(el){\n        const conversionType=el.getAttribute('data-rf-conversion');\n        const value=el.getAttribute('data-rf-value')||1;\n        window.rotaFinal.track(conversionType,{variant:variant,element:el.tagName,value:parseFloat(value)});\n      }\n    });\n    \n    console.log('🧪 Rota Final: Experimento iniciado',{experiment:CONFIG.experimentId,variant:variant});\n  }\n  \n  if(document.readyState==='loading'){\n    document.addEventListener('DOMContentLoaded',init);\n  } else {\n    init();\n  }\n})();</script>`
  }

  const copyExperimentCode = async (exp: Experiment) => {
    try {
      const code = enhanceInstallCode(generateInstallCodeForExperiment(exp))
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
        console.warn('⚠️ Usando projeto padrão para o experimento:', projectId)
      } else {
        console.log('📋 Usando projeto selecionado:', projectId)
      }
      
      // Validar se o projeto existe
      if (projectId !== 'b302fac6-3255-4923-833b-5e71a11d5bfe') {
        console.warn('⚠️ Projeto inválido detectado, usando projeto padrão')
        projectId = 'b302fac6-3255-4923-833b-5e71a11d5bfe'
      }

      // Verificar status de autenticação
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Usuário não autenticado. Faça login para criar um experimento.')
        setSaving(false)
        return
      }
      
      console.log('👤 Usuário autenticado para criação:', user.id, user.email)

      // Construir o objeto de inserção de forma limpa e direta
      const experimentData = {
        name: String(experimentForm.name || '').trim(),
        project_id: String(projectId),
        description: experimentForm.description || null,
        type: 'redirect', // Tipo padrão
        status: 'draft',
        traffic_allocation: 100,
        created_by: user.id
      }

      // Validar dados antes de enviar
      if (!experimentData.name || experimentData.name.length < 2) {
        toast.error('Nome do experimento é obrigatório e deve ter pelo menos 2 caracteres')
        setSaving(false)
        return
      }

      console.log('=== DEBUG EXPERIMENT CREATION ===')
      console.log('Dados para envio:', experimentData)
      console.log('=== FIM DEBUG ===')
      
      // Criar experimento via API route
      console.log('🚀 Criando experimento via API...')
      
      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(experimentData)
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Erro ao criar experimento:', result)
        toast.error('Erro ao criar experimento: ' + result.error)
        setSaving(false)
        return
      }

      const newExperiment = result.experiment
      console.log('✅ Experimento criado via API:', newExperiment)
      
      // Criar variantes padrão
      const defaultVariants = [
        { name: 'Controle', key: 'A', is_control: true, weight: 50 },
        { name: 'Variante B', key: 'B', is_control: false, weight: 50 }
      ]

      // Criar variantes padrão via API (por enquanto, vamos pular isso)
      // TODO: Criar API para variantes
      console.log('📝 Variantes padrão serão criadas:', defaultVariants)

      // Formatar experimento para o frontend
      const formattedExperiment = {
        id: newExperiment.id,
        name: newExperiment.name,
        description: newExperiment.description,
        status: newExperiment.status,
        created_at: newExperiment.created_at,
        project_id: newExperiment.project_id,
        algorithm: newExperiment.mab_config?.algorithm || 'thompson_sampling',
        traffic_allocation: newExperiment.traffic_allocation,
        variants: (variants || []).map((v: any) => ({
          id: v.id,
          name: v.name,
          key: v.name?.toLowerCase().replace(/\s+/g, '-') || 'variant',
          is_control: v.is_control,
          weight: v.traffic_percentage || 50
        }))
      }

      // Adicionar à lista de experimentos no frontend
      setExperiments(prev => [formattedExperiment, ...prev])
      
      toast.success(`Experimento "${newExperiment.name}" criado com sucesso!`)
      setShowNew(false)
      setExperimentStep(1)
      // Abrir o painel já na aba de código para facilitar a instalação no site
      setSelectedExperiment(formattedExperiment as any)
      setDrawerTab('code')
      setDrawerOpen(true)
      
      console.log('🎉 Experimento criado e adicionado à lista!')
      
    } catch (error) {
      console.error('Erro geral ao criar experimento:', error)
      toast.error('Erro inesperado ao criar experimento')
    } finally {
      setSaving(false)
    }
  }

  // Função para inserir variantes (será implementada depois)
  const handleCreateVariants = async (experimentId: string) => {
    console.log('Variantes serão implementadas em versão futura')
    return
  }

  const handleCreateModernExperiment = async (formData: any) => {
    try {
      setSaving(true)

      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Usuário não autenticado. Faça login para criar um experimento.')
        return
      }

      // Get project ID
      let projectId = projectFilter !== 'all' ? String(projectFilter) : (projects[0]?.id || null)
      if (!projectId) {
        projectId = 'b302fac6-3255-4923-833b-5e71a11d5bfe' // Default project
      }

      console.log('🔍 Project validation:', {
        projectFilter,
        availableProjects: projects.map(p => ({ id: p.id, name: p.name })),
        selectedProjectId: projectId,
        projectIdType: typeof projectId,
        projectIdLength: projectId.length
      })

      // Utility to generate slug
      const toKey = (text: string) =>
        (text || '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')

      // Prepare experiment data (aligned with schema)
      const experimentData = {
        name: String(formData.name || '').trim(),
        key: toKey(formData.name) || 'experiment',
        project_id: String(projectId),
        description: formData.description || null,
        status: 'draft' as const,
        algorithm: formData.algorithm as any || 'thompson_sampling',
        traffic_allocation: Math.min(100, Math.max(1, Math.round(formData.trafficAllocation || 100)))
      }

      console.log('📋 Creating experiment with data:', experimentData)

      // Validate data types
      console.log('🔍 Data validation:', {
        name_type: typeof experimentData.name,
        name_length: experimentData.name.length,
        traffic_allocation_type: typeof experimentData.traffic_allocation,
        traffic_allocation_value: experimentData.traffic_allocation,
        algorithm_type: typeof experimentData.algorithm,
        algorithm_value: experimentData.algorithm
      })

      // Create experiment
      const { data: experiment, error: expError } = await supabase
        .from('experiments')
        .insert([experimentData])
        .select()
        .single()

      if (expError) {
        console.error('❌ Experiment creation error:', expError)
        console.error('❌ Error details:', {
          code: expError.code,
          message: expError.message,
          details: expError.details,
          hint: expError.hint
        })
        throw new Error(`Erro ao criar experimento: ${expError.message}`)
      }

      console.log('✅ Experiment created:', experiment.id)

      // Create variants (aligned with schema)
      const totalVariants = formData.variants.length
      const baseWeight = Math.floor(100 / totalVariants)
      const remainder = 100 - (baseWeight * totalVariants)

      const variantsData = formData.variants.map((variant: any, index: number) => ({
        experiment_id: experiment.id,
        name: variant.name,
        key: toKey(variant.name) || `variant_${index}`,
        weight: baseWeight + (index < remainder ? 1 : 0), // Distribute remainder
        is_control: variant.isControl,
        config: {
          type: formData.testType,
          url: variant.url || formData.targetUrl,
          changes: [],
          target_url: formData.targetUrl,
          conversion_type: formData.conversionType,
          conversion_url: formData.conversionUrl,
          conversion_selector: formData.conversionSelector,
          conversion_event: formData.conversionEvent
        }
      }))

      console.log('📋 Creating variants with data:', variantsData)
      console.log('🔍 Variants validation:', {
        totalVariants,
        baseWeight,
        remainder,
        weights: variantsData.map(v => v.weight),
        weightSum: variantsData.reduce((sum, v) => sum + v.weight, 0)
      })

      const { error: variantsError } = await supabase
        .from('variants')
        .insert(variantsData)

      if (variantsError) {
        console.error('❌ Variants creation error:', variantsError)
        console.error('❌ Error details:', {
          code: variantsError.code,
          message: variantsError.message,
          details: variantsError.details,
          hint: variantsError.hint
        })
        throw new Error(`Erro ao criar variantes: ${variantsError.message}`)
      }

      console.log('✅ Variants created for experiment:', experiment.id)

      // Create goal (aligned with schema)
      if (formData.primaryGoal) {
        const goalData = {
          experiment_id: experiment.id,
          name: formData.primaryGoal,
          key: toKey(formData.primaryGoal) || 'primary_goal',
          type: formData.conversionType === 'page_view' ? 'page_view' :
                formData.conversionType === 'click' ? 'click' :
                formData.conversionType === 'form_submit' ? 'conversion' : 'custom',
          value_type: 'binary' as const,
          description: `Objetivo: ${formData.primaryGoal}`
        }

        const { error: goalError } = await supabase
          .from('goals')
          .insert([goalData])

        if (goalError) {
          console.error('Goal creation error:', goalError)
          // Don't throw - goal is optional
        } else {
          console.log('✅ Goal created for experiment:', experiment.id)
        }
      }

      // Success
      toast.success('Experimento criado com sucesso!')

      // Refresh data and close modal
      await loadDashboardData()
      setShowNew(false)

    } catch (error) {
      console.error('Error creating experiment:', error)
      toast.error('Erro ao criar experimento: ' + (error as any)?.message || 'Erro desconhecido')
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

  // ✅ Stats são atualizadas automaticamente pelo hook em tempo real
  const updateStatsFromExperiments = (next: Experiment[]) => {
    // Não precisa mais atualizar stats manualmente
    console.log('📊 Stats atualizadas automaticamente pelo hook')
  }

   const startExperiment = async (id: string) => {
     try {
       // Atualizar via API
       const response = await fetch(`/api/experiments/${id}`, {
         method: 'PATCH',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ 
           status: 'running',
           started_at: new Date().toISOString()
         })
       })

       if (!response.ok) {
         const result = await response.json()
         throw new Error(result.error || 'Erro ao atualizar experimento')
       }

      // Sucesso - atualizar estado local
      setExperiments(prev => {
        const next = prev.map(e => e.id === id ? { ...e, status: 'running' as const, started_at: new Date().toISOString() } : e)
        updateStatsFromExperiments(next)
        return next
      })
      
      toast.success('Experimento iniciado com sucesso!')
       setMenuOpen(null)
     } catch (error) {
       console.error('Erro ao iniciar experimento:', error)
       toast.error('Erro ao iniciar experimento')
     }
   }

   const pauseExperiment = async (id: string) => {
     try {
       // Atualizar via API
       const response = await fetch(`/api/experiments/${id}`, {
         method: 'PATCH',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ status: 'paused' })
       })

       if (!response.ok) {
         const result = await response.json()
         throw new Error(result.error || 'Erro ao pausar experimento')
       }

       // Atualizar na lista local
       setExperiments(prev => {
         const next = prev.map(e => e.id === id ? { ...e, status: 'paused' as const } : e)
         updateStatsFromExperiments(next)
         return next
       })
       
       toast.info('Experimento pausado')
       setMenuOpen(null)
     } catch (error) {
       console.error('Erro ao pausar experimento:', error)
       toast.error('Erro ao pausar experimento')
     }
   }

   const completeExperiment = async (id: string) => {
     try {
       // Atualizar via API
       const response = await fetch(`/api/experiments/${id}`, {
         method: 'PATCH',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ 
           status: 'completed',
           ended_at: new Date().toISOString()
         })
       })

       if (!response.ok) {
         const result = await response.json()
         throw new Error(result.error || 'Erro ao completar experimento')
       }

      // Sucesso - atualizar estado local
      setExperiments(prev => {
        const next = prev.map(e => e.id === id ? { ...e, status: 'completed' as const, ended_at: new Date().toISOString() } : e)
        updateStatsFromExperiments(next)
        return next
      })
      
      toast.success('Experimento concluído')
       setMenuOpen(null)
     } catch (error) {
       console.error('Erro ao concluir experimento:', error)
       toast.error('Erro ao concluir experimento')
     }
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

  const deleteExperiment = async (id: string) => {
    try {
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Usuário não autenticado')
        return
      }

      // Verificar se o experimento pertence ao usuário
      const experimentToDelete = experiments.find(e => e.id === id)
      if (!experimentToDelete) {
        toast.error('Experimento não encontrado')
        return
      }

      // Deletar via API
      const response = await fetch(`/api/experiments/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao deletar experimento')
      }

      // Sucesso - remover da lista local
      setExperiments(prev => {
        const next = prev.filter(e => e.id !== id)
        updateStatsFromExperiments(next)
        return next
      })
      
      toast.success('Experimento excluído com sucesso!')
      setMenuOpen(null)
    } catch (error) {
      console.error('Erro ao deletar experimento:', error)
      toast.error('Erro ao excluir experimento')
    }
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
      
      // TODO: Implementar criação real do experimento no Supabase
      console.log('Criando experimento:', newForm.name.trim())
      
      // Por enquanto, apenas fechar o modal
      setShowNew(false)
      toast.success('Funcionalidade em desenvolvimento - experimento não foi criado')
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
            <Select value={timeRange} onValueChange={(val) => { setTimeRange(val as any); updatePreference('defaultTimeRange', val as any) }}>
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
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-3xl font-bold text-primary">{realtimeStats?.activeExperiments || 0}</div>
                  {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Dados em tempo real" />}
                </div>
                <div className="text-sm text-muted-foreground">Testes Ativos</div>
              </div>
              <div className="card-glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-3xl font-bold text-success">{(realtimeStats?.totalVisitors || 0).toLocaleString('pt-BR', { notation: 'compact' })}</div>
                  {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Dados em tempo real" />}
                </div>
                <div className="text-sm text-muted-foreground">Visitantes</div>
              </div>
              <div className="card-glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-3xl font-bold text-warning">{(realtimeStats?.conversionRate || 0).toFixed(1)}%</div>
                  {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Dados em tempo real" />}
                </div>
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
      {/** helper to label current period */}
      { /* NOTE: simple map for period label */ }
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {(() => { /* block scope to compute label */ })()}
        { /* compute label inline */ }
        { /* eslint-disable-next-line */ }
        { null }
        { /* Using local timeRange for subtitles */ }
        <KpiCard
          title="Experimentos Ativos"
          value={realtimeStats?.activeExperiments || 0}
          change={(realtimeStats?.activeExperiments || 0) > 0 ? 15 : 0}
          trend={(realtimeStats?.activeExperiments || 0) > 0 ? 'up' : 'neutral'}
          subtitle={isConnected ? `Tempo real • Última atualização: ${lastUpdate?.toLocaleTimeString('pt-BR')}` : `Período: ${timeRange === '7d' ? 'últimos 7 dias' : timeRange === '90d' ? 'últimos 90 dias' : 'últimos 30 dias'}`}
          icon={<Zap />}
          highlight={(realtimeStats?.activeExperiments || 0) > 0}
          color="primary"
          sparklineData={[3, 5, 2, 7, 8, 6, 9, 12]}
          realtime={isConnected}
        />
        <KpiCard
          title="Visitantes Únicos"
          value={(realtimeStats?.totalVisitors || 0).toLocaleString('pt-BR')}
          change={recentAssignments?.length || 0}
          trend={recentAssignments?.length ? 'up' : 'neutral'}
          subtitle={isConnected ? `Tempo real • ${recentAssignments?.length || 0} novos visitantes` : `Período: ${timeRange === '7d' ? 'últimos 7 dias' : timeRange === '90d' ? 'últimos 90 dias' : 'últimos 30 dias'}`}
          icon={<Users />}
          color="success"
          realtime={isConnected}
          sparklineData={[20, 25, 23, 29, 40, 38, 45, 52]}
        />
        <KpiCard 
          title="Taxa de Conversão" 
          value={`${stats.conversionRate.toFixed(2)}%`}
          change={8}
          trend="up"
          subtitle={`Período: ${timeRange === '7d' ? 'últimos 7 dias' : timeRange === '90d' ? 'últimos 90 dias' : 'últimos 30 dias'}`}
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
        return (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <ChartsSection
                experiments={experiments}
                stats={realtimeStats}
                realtime={{
                  isConnected,
                  recentEvents,
                  recentAssignments,
                  lastUpdate
                }}
              />
            </div>
            <div className="xl:col-span-1">
              <RealtimeActivity
                recentEvents={recentEvents}
                recentAssignments={recentAssignments}
                isConnected={isConnected}
                className="sticky top-4"
              />
            </div>
          </div>
        )
      case 'audiences':
        return renderAudiencesContent()
      case 'events':
        return renderEventsContent()
      case 'data':
        return renderDataContent()
      case 'settings':
        return renderSettingsContent()
      default:
        return renderOverviewContent()
    }
  }

  // ===== Events Content =====
  const renderEventsContent = () => {
    return <EventsSection />
  }

  const EventsSection = () => {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [eventTypeFilter, setEventTypeFilter] = useState('all')
    const [experimentFilter, setExperimentFilter] = useState('all')
    const [dateRange, setDateRange] = useState('7d')
    const [utmSourceFilter, setUtmSourceFilter] = useState('all')
    const [utmMediumFilter, setUtmMediumFilter] = useState('all')
    const [utmCampaignFilter, setUtmCampaignFilter] = useState('all')
    const [eventStats, setEventStats] = useState({
      total: 0,
      pageviews: 0,
      clicks: 0,
      conversions: 0,
      uniqueVisitors: 0,
      totalRevenue: 0
    })

    useEffect(() => {
      loadEventsData()
    }, [eventTypeFilter, experimentFilter, dateRange, utmSourceFilter, utmMediumFilter, utmCampaignFilter])

    const loadEventsData = async () => {
      setLoading(true)
      try {
        const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
        const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

        const { data: eventsData, error } = await supabase
          .from('events')
          .select('*, experiments(name)')
          .gte('created_at', startDate)
          .order('created_at', { ascending: false })
          .limit(500)

        if (error) console.error('Erro ao buscar eventos:', error)

        if (!eventsData || eventsData.length === 0) {
          const mockEvents = generateMockEvents(daysAgo)
          setEvents(mockEvents)
          calculateMockEventStats(mockEvents)
        } else {
          setEvents(eventsData)
          await calculateEventStats(startDate)
        }
      } catch (error) {
        console.error('Erro ao carregar eventos:', error)
        const mockEvents = generateMockEvents(7)
        setEvents(mockEvents)
        calculateMockEventStats(mockEvents)
      } finally {
        setLoading(false)
      }
    }

    const generateMockEvents = (daysAgo: number) => {
      const events = []
      const eventTypes = ['pageview', 'click', 'conversion', 'custom']
      const experiments = [
        { id: 'exp-1', name: 'Landing Page A/B Test' },
        { id: 'exp-2', name: 'CTA Button Experiment' },
        { id: 'exp-3', name: 'Pricing Page Test' }
      ]
      const visitors = Array.from({ length: 20 }, (_, i) => `visitor_${i + 1}_` + Math.random().toString(36).slice(2, 8))

      for (let i = 0; i < 100; i++) {
        const experiment = experiments[Math.floor(Math.random() * experiments.length)]
        const adjustedType = Math.random() < 0.6 ? 'pageview' : Math.random() < 0.3 ? 'click' : Math.random() < 0.1 ? 'conversion' : 'custom'
        
        events.push({
          id: `mock-event-${i}`,
          type: adjustedType,
          name: getEventName(adjustedType),
          visitor_id: visitors[Math.floor(Math.random() * visitors.length)],
          value: adjustedType === 'conversion' ? Math.round(Math.random() * 200 + 25) : 0,
          properties: getEventProperties(adjustedType, experiment),
          created_at: new Date(Date.now() - Math.random() * daysAgo * 24 * 60 * 60 * 1000).toISOString(),
          page_url: getEventUrl(adjustedType),
          experiments: experiment,
        })
      }
      return events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    const getEventName = (type: string) => {
      const names = { pageview: ['landing_page_view'], click: ['cta_button_click'], conversion: ['purchase_completed'], custom: ['video_watched'] }
      return names[type as keyof typeof names]?.[0] || 'generic_event'
    }
    const getEventProperties = (type: string, experiment: any) => {
      const utmSources = ['google', 'facebook', 'instagram', 'email', 'direct', 'youtube', 'linkedin']
      const utmMediums = ['cpc', 'social', 'email', 'organic', 'referral', 'display']
      const utmCampaigns = ['black_friday_2024', 'summer_sale', 'product_launch', 'remarketing', 'brand_awareness']
      const baseProps = { variant: Math.random() < 0.5 ? 'Controle' : 'Variante A', utm_source: utmSources[Math.floor(Math.random() * utmSources.length)], utm_medium: utmMediums[Math.floor(Math.random() * utmMediums.length)], utm_campaign: utmCampaigns[Math.floor(Math.random() * utmCampaigns.length)], device: Math.random() < 0.7 ? 'desktop' : 'mobile' }
      if (type === 'click') return { ...baseProps, button_text: 'Começar Agora' }
      if (type === 'conversion') return { ...baseProps, value: Math.round(Math.random() * 200 + 25) }
      return baseProps
    }
    const getEventUrl = (type: string) => `https://exemplo.com/${type}`
    const calculateMockEventStats = (events: any[]) => {
      setEventStats({
        total: events.length,
        pageviews: events.filter(e => e.type === 'pageview').length,
        clicks: events.filter(e => e.type === 'click').length,
        conversions: events.filter(e => e.type === 'conversion').length,
        uniqueVisitors: new Set(events.map(e => e.visitor_id)).size,
        totalRevenue: events.filter(e => e.type === 'conversion').reduce((sum, e) => sum + (e.value || 0), 0)
      })
    }
    const calculateEventStats = async (startDate: string) => {
      const { count: total } = await supabase.from('events').select('*', { count: 'exact', head: true }).gte('created_at', startDate)
      const { count: pageviews } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('type', 'pageview').gte('created_at', startDate)
      const { count: clicks } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('type', 'click').gte('created_at', startDate)
      const { count: conversions } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('type', 'conversion').gte('created_at', startDate)
      const { data: uniqueData } = await supabase.from('events').select('visitor_id, value').gte('created_at', startDate)
      setEventStats({ total: total || 0, pageviews: pageviews || 0, clicks: clicks || 0, conversions: conversions || 0, uniqueVisitors: uniqueData ? new Set(uniqueData.map(e => e.visitor_id)).size : 0, totalRevenue: uniqueData?.reduce((sum, e) => sum + (e.value || 0), 0) || 0 })
    }

    const eventTypes = ['all', 'pageview', 'click', 'conversion', 'custom']
    const experimentsList = [...new Set(events.map(e => e.experiments?.name).filter(Boolean))]

    const filteredEvents = events.filter(event => {
      return (eventTypeFilter === 'all' || event.type === eventTypeFilter) &&
             (experimentFilter === 'all' || event.experiments?.name === experimentFilter) &&
             (utmSourceFilter === 'all' || event.properties?.utm_source === utmSourceFilter) &&
             (utmMediumFilter === 'all' || event.properties?.utm_medium === utmMediumFilter) &&
             (utmCampaignFilter === 'all' || event.properties?.utm_campaign === utmCampaignFilter)
    })

    const formatEventType = (type: string) => ({ pageview: 'Visualização', click: 'Clique', conversion: 'Conversão', custom: 'Custom' }[type] || type)
    
    if (loading && events.length === 0) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">{[...Array(6)].map((_, i) => <Card key={i} className="card-glass p-4 h-28 animate-pulse bg-muted/50" />)}</div>
          <Card className="card-glass p-4 h-24 animate-pulse bg-muted/50" />
          <Card className="card-glass p-4 space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-lg animate-pulse bg-muted/50" />)}</Card>
        </div>
      )
    }

    if (!loading && filteredEvents.length === 0) {
      return <EmptyState 
        title="Nenhum evento encontrado" 
        description="Ainda não há eventos para os filtros selecionados. Tente ajustar os filtros ou aguarde novos eventos."
        icon={<Search className="w-12 h-12 text-gray-400" />}
        actionLabel="Limpar Filtros"
        onAction={() => { setEventTypeFilter('all'); setExperimentFilter('all'); setUtmSourceFilter('all'); setUtmMediumFilter('all'); setUtmCampaignFilter('all'); }}
      />
    }

    const eventTypeIcons: Record<string, JSX.Element> = {
      pageview: <Eye className="w-4 h-4 text-blue-500" />,
      click: <MousePointerClick className="w-4 h-4 text-orange-500" />,
      conversion: <Goal className="w-4 h-4 text-green-500" />,
      custom: <Code className="w-4 h-4 text-purple-500" />,
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="card-glass"><div className="p-4 flex flex-col"><div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">Total de Eventos</span><Activity className="w-5 h-5 text-muted-foreground" /></div><span className="text-3xl font-bold mt-2">{formatNumber(eventStats.total)}</span></div></Card>
          <Card className="card-glass"><div className="p-4 flex flex-col"><div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">Visitantes Únicos</span><Users className="w-5 h-5 text-muted-foreground" /></div><span className="text-3xl font-bold mt-2">{formatNumber(eventStats.uniqueVisitors)}</span></div></Card>
          <Card className="card-glass"><div className="p-4 flex flex-col"><div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">Page Views</span><Eye className="w-5 h-5 text-muted-foreground" /></div><span className="text-3xl font-bold mt-2">{formatNumber(eventStats.pageviews)}</span></div></Card>
          <Card className="card-glass"><div className="p-4 flex flex-col"><div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">Cliques</span><MousePointerClick className="w-5 h-5 text-muted-foreground" /></div><span className="text-3xl font-bold mt-2">{formatNumber(eventStats.clicks)}</span></div></Card>
          <Card className="card-glass"><div className="p-4 flex flex-col"><div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">Conversões</span><Goal className="w-5 h-5 text-muted-foreground" /></div><span className="text-3xl font-bold mt-2">{formatNumber(eventStats.conversions)}</span></div></Card>
          <Card className="card-glass"><div className="p-4 flex flex-col"><div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">Receita Total</span><DollarSign className="w-5 h-5 text-muted-foreground" /></div><span className="text-3xl font-bold mt-2">{formatCurrency(eventStats.totalRevenue)}</span></div></Card>
        </div>

        <Card className="card-glass">
          <div className="p-4">
            <div className="flex items-center mb-2"><Filter className="w-4 h-4 mr-2 text-muted-foreground" /><h3 className="text-md font-semibold">Filtros</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}><SelectTrigger><SelectValue placeholder="Tipo de evento" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os tipos</SelectItem>{eventTypes.slice(1).map(type => <SelectItem key={type} value={type}>{formatEventType(type)}</SelectItem>)}</SelectContent></Select>
              <Select value={experimentFilter} onValueChange={setExperimentFilter}><SelectTrigger><SelectValue placeholder="Experimento" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{experimentsList.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select>
              <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7d">7 dias</SelectItem><SelectItem value="30d">30 dias</SelectItem><SelectItem value="90d">90 dias</SelectItem></SelectContent></Select>
              <Select value={utmSourceFilter} onValueChange={setUtmSourceFilter}><SelectTrigger><SelectValue placeholder="Fonte" /></SelectTrigger><SelectContent><SelectItem value="all">Fontes</SelectItem> {['google', 'facebook', 'instagram', 'email', 'direct', 'youtube', 'linkedin'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)} </SelectContent></Select>
              <Select value={utmMediumFilter} onValueChange={setUtmMediumFilter}><SelectTrigger><SelectValue placeholder="Meio" /></SelectTrigger><SelectContent><SelectItem value="all">Meios</SelectItem> {['cpc', 'social', 'email', 'organic', 'referral', 'display'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)} </SelectContent></Select>
              <Select value={utmCampaignFilter} onValueChange={setUtmCampaignFilter}><SelectTrigger><SelectValue placeholder="Campanha" /></SelectTrigger><SelectContent><SelectItem value="all">Campanhas</SelectItem> {['black_friday_2024', 'summer_sale', 'product_launch', 'remarketing', 'brand_awareness'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)} </SelectContent></Select>
            </div>
          </div>
        </Card>

        <Card className="card-glass">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-lg font-semibold">Feed de Eventos</h3><p className="text-sm text-muted-foreground">Mostrando {filteredEvents.length} de {events.length} eventos</p></div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={loadEventsData} disabled={loading}><RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
                <Button variant="outline" size="sm" onClick={() => {
                   const csvData = filteredEvents.map(event => ({
                    timestamp: new Date(event.created_at).toLocaleString('pt-BR'),
                    tipo: formatEventType(event.type),
                    nome: event.name,
                    experimento: event.experiments?.name || 'Nenhum',
                    visitante: event.visitor_id,
                    valor: event.value || 0,
                    url: event.page_url || '',
                    propriedades: JSON.stringify(event.properties || {})
                  }))
                  
                  if (csvData.length === 0) {
                    toast.error('Nenhum evento para exportar')
                    return
                  }
                  
                  const csv = [
                    Object.keys(csvData[0] || {}),
                    ...csvData.map(row => Object.values(row))
                  ].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n')

                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `eventos-${new Date().toISOString().split('T')[0]}.csv`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                  toast.success('Eventos exportados com sucesso!')
                }}><Download className="w-4 h-4 mr-2" />Exportar</Button>
              </div>
            </div>
            <div className="space-y-4">
              {filteredEvents.map(event => (
                <div key={event.id} className="p-3 rounded-lg border border-border/50 bg-background/50 flex items-start gap-4">
                  <div className="mt-1"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">{eventTypeIcons[event.type] || <Activity className="w-4 h-4" />}</span></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between"><p className="font-semibold text-sm">{formatEventType(event.type)}: <span className="font-normal">{event.name}</span></p><span className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString('pt-BR')}</span></div>
                    <p className="text-xs text-muted-foreground mt-1">Visitante: <span className="font-mono text-foreground">{event.visitor_id.substring(0, 15)}...</span>{event.experiments?.name && ` | Experimento: ${event.experiments.name}`}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {event.properties?.utm_source && <Badge variant="outline">Fonte: {event.properties.utm_source}</Badge>}
                      {event.properties?.utm_campaign && <Badge variant="outline">Campanha: {event.properties.utm_campaign}</Badge>}
                      {event.properties?.utm_medium && <Badge variant="outline">Meio: {event.properties.utm_medium}</Badge>}
                      {event.properties?.device && <Badge variant="secondary">Dispositivo: {event.properties.device}</Badge>}
                      {event.value > 0 && <Badge variant="success">Valor: {formatCurrency(event.value)}</Badge>}
                      <Popover><PopoverTrigger asChild><Button variant="ghost" size="sm" className="text-xs h-auto py-0.5 px-2">Mais ({Object.keys(event.properties || {}).length}) <ChevronDown className="w-3 h-3 ml-1" /></Button></PopoverTrigger><PopoverContent className="w-80"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(event.properties, null, 2)}</pre></PopoverContent></Popover>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // ===== Audiences (UTMs & Segmentos) =====
  type UTMEvent = { ts: string; path: string; referrer: string | null; source?: string | null; medium?: string | null; campaign?: string | null; term?: string | null; content?: string | null }
  type SegmentCond = { field: 'utm_source'|'utm_medium'|'utm_campaign'|'utm_term'|'utm_content'; op: 'equals'|'contains'; value: string }
  type Audience = { id: string; name: string; conditions: SegmentCond[] }

  const getUtmEvents = (): UTMEvent[] => { try { return JSON.parse(localStorage.getItem('utm_events') || '[]') } catch { return [] } }
  const getAudiences = (): Audience[] => { try { return JSON.parse(localStorage.getItem('audiences') || '[]') } catch { return [] } }
  const saveAudiences = (list: Audience[]) => { localStorage.setItem('audiences', JSON.stringify(list)) }
  const countBy = (arr: string[]) => { const m: Record<string, number> = {}; for (const a of arr) m[a] = (m[a]||0)+1; return m }

  const renderAudiencesContent = () => {
    return <AudiencesSection />
  }

  const AudiencesSection = () => {
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [segments, setSegments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [sourceFilter, setSourceFilter] = useState('all')
    const [audienceTab, setAudienceTab] = useState('campanhas')
    const { preferences, updatePreference } = useApp()
    const [periodFilter, setPeriodFilter] = useState<'7d'|'30d'|'90d'>(
      (preferences?.defaultTimeRange as any) || '90d'
    )

    useEffect(() => {
      loadAudienceData()
    }, [periodFilter])

    useEffect(() => {
      setPeriodFilter(((preferences?.defaultTimeRange as any) || '90d') as any)
    }, [preferences?.defaultTimeRange])

    const loadAudienceData = async () => {
      setLoading(true)
      try {
        // Usar as funções de analytics criadas
        const { getCampaignData, getAudienceSegments } = await import('@/lib/analytics')
        const [campaignData, segmentData] = await Promise.all([
          getCampaignData(periodFilter),
          getAudienceSegments(periodFilter as any)
        ])
        setCampaigns(campaignData)
        setSegments(segmentData)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    const filteredCampaigns = campaigns.filter(campaign => {
      const matchesSearch = campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.campaign?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSource = sourceFilter === 'all' || campaign.source === sourceFilter
      return matchesSearch && matchesSource
    })

    const totalMetrics = campaigns.reduce((acc, campaign) => ({
      visitors: acc.visitors + (campaign.visitors || 0),
      conversions: acc.conversions + (campaign.conversions || 0),
      revenue: acc.revenue + (campaign.revenue || 0),
      cost: acc.cost + (campaign.cost || 0)
    }), { visitors: 0, conversions: 0, revenue: 0, cost: 0 })

    const avgConversionRate = totalMetrics.visitors > 0 ? (totalMetrics.conversions / totalMetrics.visitors) * 100 : 0
    const roas = totalMetrics.cost > 0 ? totalMetrics.revenue / totalMetrics.cost : 0

    const uniqueSources = [...new Set(campaigns.map(c => c.source).filter(Boolean))]

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }

    const formatNumber = (value: number) => {
      return new Intl.NumberFormat('pt-BR').format(value)
    }

    if (loading) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="h-28 animate-pulse" />
            ))}
          </div>
          <Card className="h-80 animate-pulse" />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Visitantes" value={formatNumber(totalMetrics.visitors)} subtitle={`Período: ${periodFilter}`} icon={<Users />} color="info" />
          <KpiCard title="Conversões" value={formatNumber(totalMetrics.conversions)} subtitle={`Período: ${periodFilter}`} icon={<Check />} color="success" />
          <KpiCard title="Conversão" value={`${avgConversionRate.toFixed(2)}%`} subtitle="Média ponderada" icon={<TrendingUp />} color="warning" />
          <KpiCard title="ROAS" value={`${roas.toFixed(2)}x`} subtitle="Receita/Investimento" icon={<BarChart3 />} color="primary" />
        </div>

        {/* Filters */}
        <Card className="card-glass">
          <div className="p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar campanhas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as fontes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fontes</SelectItem>
                  {uniqueSources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={(v) => { setPeriodFilter(v as any); updatePreference('defaultTimeRange', v as any) }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros Avançados
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card className="card-glass">
          <div className="border-b border-border/60">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setAudienceTab('campanhas')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  audienceTab === 'campanhas'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Campanhas
              </button>
              <button
                onClick={() => setAudienceTab('segmentos')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  audienceTab === 'segmentos'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Segmentos
              </button>
              <button
                onClick={() => setAudienceTab('analytics')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  audienceTab === 'analytics'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          <div className="p-6">
            {audienceTab === 'campanhas' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Campanhas Ativas</h3>
                    <p className="text-sm text-gray-600">
                      {filteredCampaigns.length} campanhas encontradas
                    </p>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Campanha
                  </Button>
                </div>
                
                {/* Active filter chips */}
                {(sourceFilter !== 'all' || searchTerm) && (
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {sourceFilter !== 'all' && (
                      <button className="chip text-primary bg-primary/10 border-primary/20" onClick={() => setSourceFilter('all')}>
                        Fonte: {sourceFilter}
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {searchTerm && (
                      <button className="chip" onClick={() => setSearchTerm('')}>
                        Busca: "{searchTerm}"
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/60">
                      <tr>
                        <th className="text-left p-4 font-medium">Campanha</th>
                        <th className="text-left p-4 font-medium">Fonte</th>
                        <th className="text-left p-4 font-medium">Visitantes</th>
                        <th className="text-left p-4 font-medium">Conversões</th>
                        <th className="text-left p-4 font-medium">Taxa Conv.</th>
                        <th className="text-left p-4 font-medium">Receita</th>
                        <th className="text-left p-4 font-medium">CPC</th>
                        <th className="text-left p-4 font-medium">CTR</th>
                        <th className="text-left p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredCampaigns.slice(0, 12).map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-secondary/60 cursor-pointer" onClick={() => { setSourceFilter(campaign.source || 'all'); setSearchTerm(campaign.campaign || campaign.name || '') }}>
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{campaign.name}</p>
                              <p className="text-sm text-muted-foreground">{campaign.campaign}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="chip">{campaign.source}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-medium">{formatNumber(campaign.visitors)}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-medium">{formatNumber(campaign.conversions)}</span>
                          </td>
                          <td className="p-4">
                            <span className={`font-medium ${campaign.conversionRate > 3 ? 'text-success' : ''}`}>
                              {campaign.conversionRate?.toFixed(2)}%
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-medium">{formatCurrency(campaign.revenue)}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-muted-foreground">
                              {campaign.cpc ? formatCurrency(campaign.cpc) : '-'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-muted-foreground">
                              {campaign.ctr ? `${campaign.ctr.toFixed(2)}%` : '-'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`chip ${campaign.status === 'active' ? 'text-success bg-success/10 border-success/20' : ''}`}>
                              {campaign.status === 'active' ? 'Ativa' : 'Pausada'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredCampaigns.length > 12 && (
                    <div className="flex justify-center py-4">
                      <Button variant="outline" onClick={() => setSearchTerm('')}>Ver todas ({filteredCampaigns.length})</Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {audienceTab === 'segmentos' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Segmentos de Audiência</h3>
                    <p className="text-sm text-gray-600">
                      {segments.length} segmentos identificados
                    </p>
                  </div>
                  <Button>
                    <Target className="h-4 w-4 mr-2" />
                    Criar Segmento
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {segments.map((segment) => (
                    <Card key={segment.id} className="p-6 card-glass hover-lift">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{segment.name}</h4>
                            <p className="text-sm text-muted-foreground">{segment.description}</p>
                          </div>
                          <span className="chip ml-2">{formatNumber(segment.visitors)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                            <p className="text-lg font-semibold">
                              {segment.conversionRate?.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Valor Médio</p>
                            <p className="text-lg font-semibold">
                              {formatCurrency(segment.avgValue)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Receita Total</p>
                          <p className="text-xl font-bold">
                            {formatCurrency(segment.totalRevenue)}
                          </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Target className="h-4 w-4 mr-1" />
                            Segmentar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {audienceTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 card-glass">
                  <h3 className="text-lg font-semibold mb-4">Performance por Fonte</h3>
                  <div className="space-y-4">
                    {uniqueSources.map(source => {
                      const sourceCampaigns = campaigns.filter(c => c.source === source)
                      const sourceMetrics = sourceCampaigns.reduce((acc, c) => ({
                        visitors: acc.visitors + (c.visitors || 0),
                        revenue: acc.revenue + (c.revenue || 0),
                        conversions: acc.conversions + (c.conversions || 0)
                      }), { visitors: 0, revenue: 0, conversions: 0 })
                      
                      const convRate = sourceMetrics.visitors > 0 ? 
                        (sourceMetrics.conversions / sourceMetrics.visitors) * 100 : 0

                      return (
                        <div key={source} className="flex items-center justify-between p-4 rounded-lg border border-input card-glass">
                          <div className="flex items-center gap-3">
                            <span className="chip">{source}</span>
                            <div>
                              <p className="font-medium">{formatNumber(sourceMetrics.visitors)} visitantes</p>
                              <p className="text-sm text-muted-foreground">{convRate.toFixed(2)}% conversão</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(sourceMetrics.revenue)}</p>
                            <p className="text-sm text-muted-foreground">{formatNumber(sourceMetrics.conversions)} conversões</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Métricas Principais</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MousePointer className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">CTR Médio</p>
                          <p className="text-sm text-gray-600">Taxa de clique</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">6.42%</p>
                        <p className="text-sm text-green-600">+1.2% ↗</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Zap className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">CPC Médio</p>
                          <p className="text-sm text-gray-600">Custo por clique</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">R$ 2,45</p>
                        <p className="text-sm text-red-600">+0.15 ↗</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Eye className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">CPM Médio</p>
                          <p className="text-sm text-gray-600">Custo por mil impressões</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">R$ 15,67</p>
                        <p className="text-sm text-green-600">-2.3% ↘</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">LTV Médio</p>
                          <p className="text-sm text-gray-600">Valor de vida do cliente</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">R$ 234,50</p>
                        <p className="text-sm text-green-600">+12.5% ↗</p>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 card-glass">
                  <h3 className="text-lg font-semibold mb-4">Top Campanhas por Receita</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RBarChart data={filteredCampaigns.sort((a,b)=> (b.revenue||0)-(a.revenue||0)).slice(0,6)} layout="vertical" margin={{ left: 16, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickFormatter={(v)=>`R$ ${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" width={140} tickFormatter={(v)=> String(v).slice(0,24) + (String(v).length>24?'…':'')} />
                        <Tooltip content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const val = payload[0].value as number
                            return (
                              <div className="rounded-xl border bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-3 shadow-2xl">
                                <div className="font-semibold mb-1">{label}</div>
                                <div className="text-sm">Receita: R$ {(val/1000).toFixed(1)}k</div>
                              </div>
                            )
                          }
                          return null
                        }} />
                        <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[0,6,6,0]} />
                      </RBarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  const renderExperimentDrawer = () => {
    if (!selectedExperiment) return null
    const exp = selectedExperiment
    const projectName = ''
    const variantCount = exp.variants?.length || 0
    const code = enhanceInstallCode(generateInstallCodeForExperiment(exp))
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
                <div className="text-xs text-muted-foreground">As alterações visuais são aplicadas automaticamente pelo código gerado, com base nas configurações das variantes. Não é necessário alterar o HTML.</div>
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

    const code = enhanceInstallCode(generateInstallCodeForExperiment(tempExp))
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
                  <span>As variações visuais são aplicadas automaticamente pelo código gerado.</span>
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
          activeExperiments: realtimeStats?.activeExperiments || 0,
          totalVisitors: realtimeStats?.totalVisitors || 0
        }}
        realtime={{ isConnected, lastUpdate }}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <Skeleton />
        ) : (
          <>
            {getTabContent()}
            {renderExperimentDrawer()}
            <ModernExperimentModal
              isOpen={showNew}
              onClose={() => setShowNew(false)}
              onSave={handleCreateModernExperiment}
              saving={saving}
            />
          </>
        )}
      </main>
    </div>
  )
}
