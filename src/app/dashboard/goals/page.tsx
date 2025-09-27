"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/empty-state'
import { Calendar, CheckCircle2, Clock, Flag, Plus, Search, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/providers/app-provider'

type GoalStatus = 'active' | 'paused' | 'completed'

interface DbGoal {
  id: string
  experiment_id: string
  name: string
  key: string
  type: 'page_view' | 'click' | 'conversion' | 'custom'
  value_type: 'binary' | 'numeric'
  target_value?: number | null
  description?: string
  created_at?: string
}

interface Goal extends DbGoal {
  status: GoalStatus
  progress: number
  target?: number
  current?: number
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
}

export default function GoalsPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | GoalStatus>('all')
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<{ experimentId: string; name: string; key: string; type: DbGoal['type']; valueType: DbGoal['value_type']; target: string }>(
    { experimentId: '', name: '', key: '', type: 'conversion', valueType: 'binary', target: '' }
  )
  const [experiments, setExperiments] = useState<Array<{ id: string; name: string }>>([])
  const { preferences, updatePreference } = useApp()
  const [timeRange, setTimeRange] = useState<'7d'|'30d'|'90d'>(preferences.defaultTimeRange || '30d')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setGoals([]); return }
        // Buscar metas reais + status do experimento
        const { data: dbGoals, error } = await supabase
          .from('goals')
          .select('id, experiment_id, name, key, type, value_type, target_value, description, created_at')
          .order('created_at', { ascending: false })
        if (error) throw error

        if (!dbGoals || dbGoals.length === 0) { setGoals([]); return }

        // Buscar status dos experimentos relacionados
        const expIds = Array.from(new Set(dbGoals.map(g => g.experiment_id)))
        const { data: exps } = await supabase
          .from('experiments')
          .select('id, status')
          .in('id', expIds)

        const expStatus = new Map<string, string>()
        exps?.forEach((e: any) => expStatus.set(e.id, e.status))

        // Buscar eventos reais últimos 30 dias para calcular progresso
        const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        const { data: events } = await supabase
          .from('events')
          .select('experiment_id, event_type, event_name, visitor_id, created_at')
          .in('experiment_id', expIds)
          .gte('created_at', since)

        const grouped = new Map<string, Set<string>>()
        events?.forEach((ev: any) => {
          const key = `${ev.experiment_id}|${ev.event_type}|${ev.event_name}`
          if (!grouped.has(key)) grouped.set(key, new Set())
          grouped.get(key)!.add(ev.visitor_id)
        })

        const computed: Goal[] = dbGoals.map((g: any) => {
          const mapKey1 = `${g.experiment_id}|${g.type}|${g.key}`
          const mapKey2 = `${g.experiment_id}|${g.type}|${g.name}`
          const visitors = grouped.get(mapKey1)?.size ?? grouped.get(mapKey2)?.size ?? 0
          const target = g.target_value ? Number(g.target_value) : undefined
          const current = visitors
          const progress = target && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
          const expStat = expStatus.get(g.experiment_id) || 'running'
          const status: GoalStatus = current >= (target || Infinity) ? 'completed' : (expStat === 'paused' ? 'paused' : 'active')
          const priority: 'low'|'medium'|'high' = progress < 40 ? 'high' : progress < 75 ? 'medium' : 'low'
          return { ...g, status, progress, target, current, priority }
        })

        setGoals(computed)
      } catch (e) {
        console.error('Erro ao carregar metas', e)
        setGoals([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [timeRange])

  useEffect(() => {
    setTimeRange(preferences.defaultTimeRange || '30d')
  }, [preferences.defaultTimeRange])

  // Load experiments for selection
  useEffect(() => {
    const loadExps = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('experiments')
          .select('id, name')
          .order('created_at', { ascending: false })
        setExperiments(data || [])
      } catch (e) {
        console.error('Erro ao carregar experimentos', e)
      }
    }
    void loadExps()
  }, [])

  const filtered = useMemo(() => {
    return goals.filter(g => {
      if (status !== 'all' && g.status !== status) return false
      if (query && !g.name.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [goals, status, query])

  const StatusPill = ({ value, label, tone }: { value: 'all' | GoalStatus; label: string; tone?: 'success'|'warning'|'info' }) => (
    <button
      onClick={() => setStatus(value)}
      className={cn(
        'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
        status === value ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/60 text-foreground/80 border-border hover:bg-secondary'
      )}
    >{label}</button>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metas</h1>
          <p className="text-muted-foreground">Defina metas e acompanhe o progresso</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
            <Input placeholder="Buscar metas..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 w-72" />
          </div>
          <Select
            value={timeRange}
            onValueChange={(v) => { setTimeRange(v as any); updatePreference('defaultTimeRange', v as any) }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90 gap-2" onClick={() => { setEditingId(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" strokeWidth={1.75} /> Nova Meta
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-glass">
        <div className="p-4 flex items-center gap-2 flex-wrap">
          <StatusPill value="all" label="Todas" />
          <StatusPill value="active" label="Ativas" />
          <StatusPill value="paused" label="Pausadas" />
          <StatusPill value="completed" label="Concluídas" />
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-48 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma meta"
          description="Crie metas para acompanhar seus objetivos de negócio."
          actionLabel="Criar Meta"
          onAction={() => {
            // Direcionar para dashboard principal
            window.location.href = '/dashboard'
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <Card key={g.id} className="relative overflow-hidden card-glass hover-lift">
              {/* Ribbon */}
              <div className={cn('absolute right-0 top-0 w-20 h-20 bg-gradient-to-bl from-primary/15 to-transparent', g.status === 'completed' && 'from-success/20', g.status === 'paused' && 'from-warning/20')} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{g.name}</CardTitle>
                  <Badge className={cn('text-xs',
                    g.status === 'completed' ? 'bg-success text-success-foreground' :
                    g.status === 'paused' ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground'
                  )}>
                    {g.status === 'completed' ? 'Concluída' : g.status === 'paused' ? 'Pausada' : 'Ativa'}
                  </Badge>
                </div>
                {g.description && <p className="text-sm text-muted-foreground">{g.description}</p>}
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {g.dueDate ? `Prazo: ${new Date(g.dueDate).toLocaleDateString('pt-BR')}` : 'Sem prazo'}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">Progresso</div>
                  <div className="text-muted-foreground">{g.current || 0}/{g.target || 100}</div>
                </div>
                <Progress value={g.progress} />
                <div className="flex items-center gap-2 text-xs">
                  <div className={cn('chip', g.priority === 'high' ? 'text-danger bg-danger/10 border-danger/20' : g.priority === 'medium' ? 'text-warning bg-warning/10 border-warning/20' : 'text-muted-foreground')}>Prioridade: {g.priority || 'média'}</div>
                  {g.status === 'completed' ? (
                    <div className="chip text-success bg-success/10 border-success/20">
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Concluída
                    </div>
                  ) : g.status === 'paused' ? (
                    <div className="chip text-warning bg-warning/10 border-warning/20">
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.75} /> Pausada
                    </div>
                  ) : (
                    <div className="chip text-primary bg-primary/10 border-primary/20">
                      <Zap className="h-3.5 w-3.5" strokeWidth={1.75} /> Em andamento
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingId(g.id)
                    setForm({
                      experimentId: g.experiment_id,
                      name: g.name,
                      key: g.key,
                      type: g.type,
                      valueType: g.value_type,
                      target: String(g.target ?? g.target_value ?? '')
                    })
                    setShowForm(true)
                  }}>Editar</Button>
                  {g.status !== 'completed' && (
                    <Button variant="outline" size="sm" onClick={() => setGoals(prev => prev.map(x => x.id === g.id ? { ...x, status: x.status === 'paused' ? 'active' : 'paused' } : x))}>
                      {g.status === 'paused' ? 'Retomar' : 'Pausar'}
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setGoals(prev => prev.map(x => x.id === g.id ? { ...x, status: 'completed', progress: 100, current: x.target } : x))}>
                    <Flag className="h-4 w-4 mr-1" strokeWidth={1.75} /> Concluir
                  </Button>
                </div>
              </CardContent>
              {/* Bottom accent */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 to-primary opacity-70" />
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <Card className="relative z-10 w-full max-w-lg card-glass">
            <CardHeader>
              <CardTitle>{editingId ? 'Editar Meta' : 'Nova Meta'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Experimento</label>
                <Select value={form.experimentId} onValueChange={(v) => setForm(prev => ({ ...prev, experimentId: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um experimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {experiments.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input className="mt-1" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={form.type} onValueChange={(v) => setForm(prev => ({ ...prev, type: v as any }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page_view">Visualização de Página</SelectItem>
                      <SelectItem value="click">Clique</SelectItem>
                      <SelectItem value="conversion">Conversão</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor</label>
                  <Select value={form.valueType} onValueChange={(v) => setForm(prev => ({ ...prev, valueType: v as any }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="binary">Binário</SelectItem>
                      <SelectItem value="numeric">Numérico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Chave do Evento (key)</label>
                <Input className="mt-1" placeholder="ex: purchase_completed" value={form.key} onChange={(e) => setForm(prev => ({ ...prev, key: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Meta (target)</label>
                <Input className="mt-1" type="number" min={0} value={form.target} onChange={(e) => setForm(prev => ({ ...prev, target: e.target.value }))} />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client')
                  const supabase = createClient()
                  try {
                    if (!form.experimentId || !form.name.trim() || !form.key.trim()) return
                    if (editingId) {
                      const { error } = await supabase
                        .from('goals')
                        .update({
                          experiment_id: form.experimentId,
                          name: form.name.trim(),
                          key: form.key.trim(),
                          type: form.type,
                          value_type: form.valueType,
                          target_value: form.target ? Number(form.target) : null
                        })
                        .eq('id', editingId)
                      if (error) throw error
                    } else {
                      const { error } = await supabase
                        .from('goals')
                        .insert({
                          experiment_id: form.experimentId,
                          name: form.name.trim(),
                          key: form.key.trim(),
                          type: form.type,
                          value_type: form.valueType,
                          target_value: form.target ? Number(form.target) : null
                        })
                      if (error) throw error
                    }
                    window.location.reload()
                  } catch (e) {
                    console.error('Erro ao salvar meta', e)
                  }
                }}>{editingId ? 'Salvar' : 'Criar'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
