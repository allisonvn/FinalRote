"use client"

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExperimentCard } from '@/components/dashboard/experiment-card'
import { EmptyState } from '@/components/empty-state'
import { cn } from '@/lib/utils'
import { Plus, Grid, List, Filter, Search, Tag } from 'lucide-react'
import Link from 'next/link'

type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed'

interface Variant { id: string; name: string; key: string; is_control: boolean; weight?: number; url?: string; description?: string; config?: any }

interface Experiment {
  id: string
  name: string
  description?: string
  status: ExperimentStatus
  created_at: string
  project_id?: string
  algorithm?: string
  traffic_allocation?: number
  tags?: string[]
  variants?: Variant[]
}

export default function ExperimentsPage() {
  const supabase = createClient()
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | ExperimentStatus>('all')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [activeTags, setActiveTags] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setExperiments([])
          return
        }
        const { data, error } = await supabase
          .from('experiments')
          .select('*, variants:variants(*)')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        const mapped: Experiment[] = (data || []).map(exp => ({
          id: exp.id,
          name: exp.name,
          description: exp.description || undefined,
          status: exp.status,
          created_at: exp.created_at,
          project_id: exp.project_id,
          algorithm: exp.mab_config?.algorithm || 'thompson_sampling',
          traffic_allocation: exp.traffic_allocation || undefined,
          tags: (exp.tags as any) || [],
          variants: (exp.variants || []).map((v: any) => ({
            id: v.id,
            name: v.name,
            key: v.key || v.name?.toLowerCase().replace(/\s+/g, '-') || 'variant',
            is_control: !!v.is_control,
            weight: v.weight || v.traffic_percentage || 50,
            url: v.url || v.target_url || v.config?.url || undefined,
            description: v.description || undefined,
            config: v.config || {}
          }))
        }))
        setExperiments(mapped)
      } catch (e) {
        console.error('Erro ao carregar experimentos', e)
        setExperiments([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    experiments.forEach(e => (e.tags || []).forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [experiments])

  const filtered = useMemo(() => {
    return experiments.filter(e => {
      if (status !== 'all' && e.status !== status) return false
      if (query && !e.name.toLowerCase().includes(query.toLowerCase())) return false
      if (activeTags.length > 0) {
        const tags = e.tags || []
        if (!activeTags.every(t => tags.includes(t))) return false
      }
      return true
    })
  }, [experiments, status, query, activeTags])

  const toggleTag = (t: string) => {
    setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const StatusPill = ({ value, label }: { value: 'all' | ExperimentStatus; label: string }) => (
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
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Experimentos</h1>
          <p className="text-muted-foreground">Gerencie, filtre e crie testes A/B</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90">
            <Link href="/dashboard">
              <Plus className="h-4 w-4 mr-2" strokeWidth={1.75} />
              Novo Experimento
            </Link>
          </Button>
          <div className="hidden md:flex rounded-xl border border-input card-glass items-center px-2 py-1.5">
            <button onClick={() => setLayout('grid')} className={cn('px-2 py-1 rounded-lg', layout === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
              <Grid className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button onClick={() => setLayout('list')} className={cn('px-2 py-1 rounded-lg', layout === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
              <List className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-glass">
        <div className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill value="all" label="Todos" />
            <StatusPill value="running" label="Ativos" />
            <StatusPill value="draft" label="Rascunhos" />
            <StatusPill value="paused" label="Pausados" />
            <StatusPill value="completed" label="Concluídos" />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
              <Input placeholder="Buscar por nome..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 w-64" />
            </div>
            <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" strokeWidth={1.75} />Filtros</Button>
          </div>
        </div>
        {allTags.length > 0 && (
          <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={cn('chip transition-colors', activeTags.includes(t) ? 'bg-primary/10 border-primary/30 text-primary' : '')}
              >
                <Tag className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum experimento encontrado"
          description={query || activeTags.length || status !== 'all' ? 'Ajuste os filtros ou limpe a busca.' : 'Crie seu primeiro teste A/B em minutos.'}
          actionLabel="Criar Experimento"
          onAction={() => (window.location.href = '/dashboard')}
        />
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((exp) => (
            <ExperimentCard key={exp.id} experiment={exp} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exp) => (
            <div key={exp.id} className="rounded-xl border border-input card-glass p-3 hover-lift">
              <div className="flex items-center gap-3">
                <Badge className={cn('text-xs',
                  exp.status === 'running' ? 'bg-success text-success-foreground' :
                  exp.status === 'paused' ? 'bg-warning text-warning-foreground' :
                  exp.status === 'completed' ? 'bg-info text-info-foreground' : 'bg-muted text-muted-foreground'
                )}>{exp.status}</Badge>
                <div className="font-medium flex-1 min-w-0 truncate">{exp.name}</div>
                <div className="text-xs text-muted-foreground hidden md:block">{new Date(exp.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

