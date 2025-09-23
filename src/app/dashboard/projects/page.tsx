"use client"

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import { ProjectCard } from '@/components/dashboard/project-card'
import { cn } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/providers/app-provider'
import Link from 'next/link'

interface Project { id: string; name: string; description?: string; created_at: string }

function rangeToSince(range: '7d'|'30d'|'90d') {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

async function fetchProjectMetrics(supabase: any, projectIds: string[], range: '7d'|'30d'|'90d') {
  const metrics: Record<string, { experimentsCount: number; activeExperiments: number; visitors30d: number; revenue30d: number }> = {}
  projectIds.forEach(id => { metrics[id] = { experimentsCount: 0, activeExperiments: 0, visitors30d: 0, revenue30d: 0 } })

  // Experiments per project
  const { data: experiments, error: expError } = await supabase
    .from('experiments')
    .select('id, project_id, status')
    .in('project_id', projectIds)
  if (!expError && experiments) {
    experiments.forEach((e: any) => {
      if (!e.project_id) return
      metrics[e.project_id].experimentsCount += 1
      if (e.status === 'running') metrics[e.project_id].activeExperiments += 1
    })
  }

  // Unique visitors (30d) per project
  const since = rangeToSince(range)
  const { data: events, error: evError } = await supabase
    .from('events')
    .select('project_id, visitor_id, created_at')
    .in('project_id', projectIds)
    .gte('created_at', since)
  if (!evError && events) {
    const setMap = new Map<string, Set<string>>()
    projectIds.forEach(id => setMap.set(id, new Set()))
    events.forEach((ev: any) => {
      const set = setMap.get(ev.project_id)
      if (set) set.add(ev.visitor_id)
    })
    setMap.forEach((s, id) => {
      metrics[id].visitors30d = s.size
    })
  }

  // Revenue (sum of value on conversion events) per project
  const { data: revenueEvents } = await supabase
    .from('events')
    .select('project_id, value, event_type, created_at')
    .in('project_id', projectIds)
    .eq('event_type', 'conversion')
    .gte('created_at', since)
  if (revenueEvents) {
    revenueEvents.forEach((ev: any) => {
      const id = ev.project_id
      if (!metrics[id]) return
      const val = Number(ev.value || 0)
      metrics[id].revenue30d += isFinite(val) ? val : 0
    })
  }

  return metrics
}

export default function ProjectsPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [projectMetrics, setProjectMetrics] = useState<Record<string, { experimentsCount: number; activeExperiments: number; visitors30d: number }>>({})
  const { preferences, updatePreference } = useApp()
  const [timeRange, setTimeRange] = useState<'7d'|'30d'|'90d'>(preferences.defaultTimeRange || '30d')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setProjects([]); return }
        const { data, error } = await (supabase as any)
          .from('projects')
          .select('id, name, description, created_at')
          .order('created_at', { ascending: false })
        if (error) throw error
        const list = data || []
        setProjects(list)
        // Fetch metrics per project using real data
        const ids = list.map((p: any) => p.id)
        if (ids.length > 0) {
          const m = await fetchProjectMetrics(supabase, ids, timeRange)
          setProjectMetrics(m)
        }
      } catch (e) {
        console.error('Erro ao carregar projetos', e)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [timeRange])


  const filtered = useMemo(() => {
    if (!query) return projects
    return projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
  }, [projects, query])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground">Organize seus experimentos por projeto</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
            <Input placeholder="Buscar projetos..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 w-64" />
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
          <Button asChild className="bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90">
            <Link href="/dashboard">
              <Plus className="h-4 w-4 mr-2" strokeWidth={1.75} />
              Novo Projeto
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-48 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum projeto encontrado"
          description={query ? 'Tente outro termo ou limpe a busca.' : 'Crie um projeto para agrupar seus experimentos.'}
          actionLabel="Criar Projeto"
          onAction={() => (window.location.href = '/dashboard')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const m = projectMetrics[p.id] || { experimentsCount: 0, activeExperiments: 0, visitors30d: 0, revenue30d: 0 }
            return (
            <ProjectCard
              key={p.id}
              name={p.name}
              description={p.description}
              createdAt={p.created_at}
              experimentsCount={m.experimentsCount}
              activeExperiments={m.activeExperiments}
              visitors30d={m.visitors30d}
              totalRevenue30d={m.revenue30d}
              onOpen={() => (window.location.href = '/dashboard')}
              onSettings={() => (window.location.href = '/settings')}
            />
          )})}
        </div>
      )}
    </div>
  )
}
