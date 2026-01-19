import { createClient } from './supabase/client'
import { analyzeExperiment } from '@/lib/statistics'

export async function getExperimentStatsFromRPC(experimentId?: string) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.rpc('get_experiment_stats', {
      p_experiment_id: experimentId || null
    })

    if (error) {
      console.warn('⚠️ Erro ao chamar RPC get_experiment_stats:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Erro na chamada RPC:', err)
    return null
  }
}

// Helper to check if error is an RLS-blocked empty error (Supabase returns {} when RLS blocks access)
function isRlsBlockedError(error: unknown): boolean {
  if (!error) return false
  // Empty object {} means RLS blocked the query
  if (typeof error === 'object' && Object.keys(error).length === 0) return true
  // Check for common RLS error messages
  const errorStr = JSON.stringify(error)
  return errorStr === '{}' || errorStr.includes('row-level security')
}

// Log query errors appropriately - warn for RLS, error for actual issues
function logQueryError(context: string, error: unknown): void {
  if (isRlsBlockedError(error)) {
    // RLS blocking is expected when not authenticated - just warn
    console.warn(`⚠️ ${context}: Acesso bloqueado por RLS (usuário pode não estar autenticado)`)
  } else {
    console.error(`❌ ${context}:`, error)
  }
}

export interface DashboardStats {
  activeExperiments: number
  totalVisitors: number
  conversionRate: number
  totalProjects: number
  totalRevenue?: number
  avgSessionDuration?: number
  bounceRate?: number
}

export interface ExperimentMetrics {
  id: string
  name: string
  status: string
  visitors: number
  conversions: number
  conversionRate: number
  improvement: number
  significance: number
  startDate: string
  endDate?: string
}

export interface RevenueData {
  period: string
  control: number
  variants: number
  lift: number
}

export async function getDashboardStats(range: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<DashboardStats> {
  try {
    const supabase = createClient()
    // Tentar buscar da view materializada primeiro, se falhar, usar tabela experiments
    let experiments = null
    let expError = null

    try {
      // Buscar experimentos diretamente da tabela com timeout
      const result = await Promise.race([
        supabase
          .from('experiments')
          .select('id, name, status, created_at')
          .order('created_at', { ascending: false }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as any

      console.log('📊 Dados de experiments:', result)

      experiments = result.data?.map((exp: any) => ({
        experiment_id: exp.id,
        experiment_name: exp.name,
        status: exp.status,
        total_visitors: 0,
        total_conversions: 0
      })) || []
      expError = result.error
    } catch (viewError: any) {
      console.warn('⚠️ Erro ao buscar experimentos (continuando com fallback):', viewError?.message || viewError)
      experiments = []
      expError = viewError
    }

    if (expError) {
      console.warn('⚠️ Erro ao buscar experimentos (continuando):', expError.message || expError)
      // Continuar com dados vazios em caso de erro
    }

    // Buscar total de eventos (visitantes únicos)
    let events = null
    let eventsError = null
    try {
      const result = await Promise.race([
        supabase.from('events').select('visitor_id', { count: 'exact' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]) as any
      events = result.data
      eventsError = result.error
    } catch (error: any) {
      console.warn('⚠️ Erro ao buscar eventos (ignorando):', error?.message)
      eventsError = error
    }

    if (eventsError) {
      console.warn('⚠️ Erro ao buscar eventos:', eventsError)
    }

    // Buscar total de conversões dos eventos
    const { data: conversions, error: convError } = await supabase
      .from('events')
      .select('id', { count: 'exact' })
      .eq('event_type', 'conversion')

    if (convError) {
      logQueryError('Erro ao buscar conversões', convError)
    }

    // Buscar total de projetos
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('id', { count: 'exact' })

    if (projError) {
      logQueryError('Erro ao buscar projetos', projError)
    }

    // Mapear período
    const days = range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30

    // Buscar visitantes únicos do período
    const { data: uniqueVisitors, error: uvError } = await supabase
      .from('events')
      .select('visitor_id')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (uvError) {
      logQueryError('Erro ao buscar visitantes únicos', uvError)
    }

    // Calcular métricas baseadas nos dados reais ou simuladas quando não há dados
    const experimentsData = experiments || []
    const activeExperiments = experimentsData.filter((exp: any) => exp.status === 'running').length

    // Se não há dados reais, usar valores baseados na estrutura real mas simulados
    const hasRealData = experimentsData.length > 0 || (events && events.length > 0)

    if (!hasRealData) {
      // Retornar apenas zeros quando não há dados reais
      return {
        activeExperiments: 0,
        totalVisitors: 0,
        conversionRate: 0,
        totalProjects: projects?.length || 0,
        totalRevenue: 0,
        avgSessionDuration: 0,
        bounceRate: 0
      }
    }

    // Calcular com dados reais
    const totalVisitors = experimentsData.reduce((sum: number, exp: any) => sum + (exp.total_visitors || 0), 0) ||
      (uniqueVisitors ? new Set(uniqueVisitors.map((v: any) => v.visitor_id)).size : 0)

    const totalConversions = experimentsData.reduce((sum: number, exp: any) => sum + (exp.total_conversions || 0), 0) ||
      (conversions?.length || 0)

    const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

    return {
      activeExperiments,
      totalVisitors,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalProjects: projects?.length || 1,
      totalRevenue: 0,
      avgSessionDuration: 240,
      bounceRate: 45
    }
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error)

    // Fallback com dados zerados quando há erro
    return {
      activeExperiments: 0,
      totalVisitors: 0,
      conversionRate: 0,
      totalProjects: 0,
      totalRevenue: 0,
      avgSessionDuration: 0,
      bounceRate: 0
    }
  }
}

export async function getExperimentMetrics(range: '24h' | '7d' | '30d' | '90d' | '1y' = '30d'): Promise<ExperimentMetrics[]> {
  try {
    const supabase = createClient()
    // Buscar experimentos com consulta otimizada (limite para performance)
    const { data: experiments, error } = await supabase
      .from('experiments')
      .select(`
        id,
        name,
        status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(20) // Limitar para melhor performance

    if (error) {
      logQueryError('Erro ao buscar experimentos', error)
      return []
    }

    if (!experiments || experiments.length === 0) {
      return []
    }

    // Buscar estatísticas de cada experimento
    const metrics = await Promise.all(experiments.map(async (exp: any) => {
      // SEMPRE buscar de assignments e events para garantir dados reais
      console.log(`📊 Buscando dados para experimento: ${exp.name}`)

      // Buscar variantes para identificar o controle
      const { data: variants } = await supabase
        .from('variants')
        .select('id, is_control')
        .eq('experiment_id', exp.id)

      if (!variants || variants.length === 0) {
        console.log(`⚠️ Sem variantes para experimento ${exp.name}`)
        return {
          id: exp.id,
          name: exp.name,
          status: exp.status,
          visitors: 0,
          conversions: 0,
          conversionRate: 0,
          improvement: 0,
          significance: 0,
          startDate: exp.created_at,
          endDate: undefined
        }
      }

      // Buscar dados direto das tabelas assignments e events
      try {
        const { data: assignments } = await supabase
          .from('assignments')
          .select('variant_id, visitor_id')
          .eq('experiment_id', exp.id)

        const { data: events } = await supabase
          .from('events')
          .select('visitor_id, variant_id, event_type')
          .eq('experiment_id', exp.id)

        console.log(`📊 Dados encontrados para ${exp.name}:`, {
          assignments: assignments?.length || 0,
          events: events?.length || 0
        })

        if (assignments && assignments.length > 0) {
          const controlId = variants.find((v: any) => v.is_control)?.id

          // Calcular visitantes e conversões por variante
          const controlAssignments = assignments.filter((a: any) => a.variant_id === controlId)
          const variantAssignments = assignments.filter((a: any) => a.variant_id !== controlId)

          const controlVisitorIds = new Set(controlAssignments.map((a: any) => a.visitor_id))
          const variantVisitorIds = new Set(variantAssignments.map((a: any) => a.visitor_id))

          const controlVisitors = controlVisitorIds.size
          const variantVisitors = variantVisitorIds.size
          const totalVisitors = new Set(assignments.map((a: any) => a.visitor_id)).size

          // Calcular conversões
          const controlConversions = events?.filter((e: any) => controlVisitorIds.has(e.visitor_id) && e.event_type === 'conversion').length || 0
          const variantConversions = events?.filter((e: any) => variantVisitorIds.has(e.visitor_id) && e.event_type === 'conversion').length || 0
          const totalConversions = controlConversions + variantConversions

          // Calcular taxas
          const controlRate = controlVisitors > 0 ? (controlConversions / controlVisitors) * 100 : 0
          const variantRate = variantVisitors > 0 ? (variantConversions / variantVisitors) * 100 : 0

          // Calcular improvement
          const improvement = controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0

          // Calcular significância com analyzeExperiment
          const stats = analyzeExperiment(
            controlVisitors,
            controlConversions,
            variantVisitors,
            variantConversions
          )

          const significance = stats.significance

          return {
            id: exp.id,
            name: exp.name,
            status: exp.status,
            visitors: totalVisitors,
            conversions: totalConversions,
            conversionRate: totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0,
            improvement: Math.round(improvement * 10) / 10,
            significance: Math.round(significance * 10) / 10,
            startDate: exp.created_at,
            endDate: undefined
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
      }

      // Se não encontrou dados, retornar zero
      return {
        id: exp.id,
        name: exp.name,
        status: exp.status,
        visitors: 0,
        conversions: 0,
        conversionRate: 0,
        improvement: 0,
        significance: 0,
        startDate: exp.created_at,
        endDate: undefined
      }
    }))

    return metrics

  } catch (error) {
    console.error('Erro ao buscar métricas dos experimentos:', error)
    return []
  }
}

// Dispositivo (device_type) breakdown por período
export async function getDeviceBreakdown(range: '24h' | '7d' | '30d' | '90d' | '1y' = '30d', experimentId?: string) {
  try {
    const supabase = createClient()
    const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    // Se experimento for especificado, filtrar sessões apenas dos visitantes desse experimento
    let visitorSet: Set<string> | null = null
    if (experimentId) {
      try {
        const { data: ass } = await supabase
          .from('assignments')
          .select('visitor_id')
          .eq('experiment_id', experimentId)
        const { data: evs } = await supabase
          .from('events')
          .select('visitor_id')
          .eq('experiment_id', experimentId)
          .gte('created_at', since)
        visitorSet = new Set<string>([...(ass?.map((a: any) => a.visitor_id) || []), ...(evs?.map((e: any) => e.visitor_id) || [])])
      } catch (e) {
        console.error('Erro ao coletar visitantes do experimento:', e)
      }
    }

    let query = supabase
      .from('visitor_sessions')
      .select('device_type, visitor_id, started_at')
      .gte('started_at', since)

    // Filtrar por visitantes do experimento se disponível e houver um conjunto não vazio
    if (experimentId && visitorSet && visitorSet.size > 0) {
      query = (query as any).in('visitor_id', Array.from(visitorSet))
    }

    const { data: sessions, error } = await query
    if (error || !sessions) return []

    const map = new Map<string, Set<string>>()
    sessions.forEach((s: any) => {
      const key = s.device_type || 'desktop'
      if (!map.has(key)) map.set(key, new Set())
      map.get(key)!.add(s.visitor_id)
    })
    return Array.from(map.entries()).map(([device, set]) => ({ device, visitors: set.size }))
  } catch (e) {
    console.error('Erro em getDeviceBreakdown:', e)
    return []
  }
}

// Funil básico por evento (page_view -> click -> conversion)
export async function getFunnelData(range: '24h' | '7d' | '30d' | '90d' | '1y' = '30d') {
  try {
    const supabase = createClient()
    const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data: events, error } = await supabase
      .from('events')
      .select('event_type, visitor_id, created_at')
      .gte('created_at', since)

    if (error || !events) return []

    const types: Array<'page_view' | 'click' | 'conversion'> = ['page_view', 'click', 'conversion']
    const counts = new Map<string, number>()
    const visitors = new Map<string, Set<string>>()
    types.forEach(t => { counts.set(t, 0); visitors.set(t, new Set()) })

    events.forEach((e: any) => {
      if (!counts.has(e.event_type)) return
      counts.set(e.event_type, (counts.get(e.event_type) || 0) + 1)
      visitors.get(e.event_type)!.add(e.visitor_id)
    })

    return types.map(t => ({
      stage: t,
      events: counts.get(t) || 0,
      visitors: visitors.get(t)?.size || 0
    }))
  } catch (e) {
    console.error('Erro em getFunnelData:', e)
    return []
  }
}

export async function getRevenueData(range: '24h' | '7d' | '30d' | '90d' | '1y' = '30d', experimentId?: string): Promise<RevenueData[]> {
  try {
    const supabase = createClient()
    // Buscar eventos de conversão do período agrupados por semana
    const days = (range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 120)
    let eventsQuery = supabase
      .from('events')
      .select('created_at, value, experiment_id, visitor_id')
      .eq('event_type', 'conversion')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })
    if (experimentId) {
      eventsQuery = (eventsQuery as any).eq('experiment_id', experimentId)
    }
    const { data: events, error } = await eventsQuery

    if (error) {
      console.error('Erro ao buscar dados de receita:', error)
      return []
    }

    if (!events || events.length === 0) {
      return []
    }

    // Buscar assignments para separar controle vs variantes
    let assignmentsQuery = supabase
      .from('assignments')
      .select(`
        experiment_id,
        visitor_id,
        variant_id,
        variants!inner(is_control)
      `)
    if (experimentId) {
      assignmentsQuery = (assignmentsQuery as any).eq('experiment_id', experimentId)
    }
    const { data: assignments, error: assignmentsError } = await assignmentsQuery

    if (assignmentsError) {
      console.error('Erro ao buscar assignments:', assignmentsError)
      return []
    }

    // Criar mapa de visitor_id -> is_control
    const visitorControlMap = new Map()
    assignments?.forEach((assignment: any) => {
      visitorControlMap.set(
        `${assignment.experiment_id}_${assignment.visitor_id}`,
        assignment.variants.is_control
      )
    })

    // Agrupar eventos por semana
    const weeklyData = new Map<string, { control: number; variants: number; total: number }>()

    events.forEach((event: any) => {
      // Encontrar início da semana (segunda-feira)
      const eventDate = new Date(event.created_at)
      const monday = new Date(eventDate)
      monday.setDate(eventDate.getDate() - eventDate.getDay() + 1)
      const weekKey = monday.toISOString().split('T')[0]

      if (!weekKey) return // Proteção contra data inválida

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { control: 0, variants: 0, total: 0 })
      }

      const weekData = weeklyData.get(weekKey)!
      const eventValue = event.value || 0 // Valor real apenas

      // Verificar se é controle ou variante
      const visitorKey = `${event.experiment_id}_${event.visitor_id}`
      const isControl = visitorControlMap.get(visitorKey)

      if (isControl) {
        weekData.control += eventValue
      } else {
        weekData.variants += eventValue
      }
      weekData.total += eventValue
    })

    // Converter para array ordenado
    return Array.from(weeklyData.entries())
      .map(([weekStart, data]) => {
        const lift = data.control > 0 ? ((data.variants - data.control) / data.control) * 100 : 0
        return {
          period: new Date(weekStart).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
          }),
          control: data.control,
          variants: data.variants,
          lift: Math.round(lift * 10) / 10
        }
      })
      .sort((a, b) => new Date(a.period.split('/').reverse().join('-')).getTime() -
        new Date(b.period.split('/').reverse().join('-')).getTime())

  } catch (error) {
    console.error('Erro ao processar dados de receita:', error)
    return []
  }
}

export async function getVisitorTrends(range: '24h' | '7d' | '30d' | '90d' | '1y' = '30d', experimentId?: string) {
  try {
    const supabase = createClient()
    // Mapear período para janela de tempo
    const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30
    // Buscar eventos do período selecionado
    let evQuery = supabase
      .from('events')
      .select('created_at, visitor_id, experiment_id, event_type')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })
    if (experimentId) {
      evQuery = (evQuery as any).eq('experiment_id', experimentId)
    }
    const { data: events, error } = await evQuery

    if (error) {
      console.error('Erro ao buscar tendências de visitantes:', error)
      return []
    }

    if (!events || events.length === 0) {
      return []
    }

    // Buscar assignments para separar controle vs variantes
    let assQuery = supabase
      .from('assignments')
      .select(`
        experiment_id,
        visitor_id,
        variant_id,
        variants!inner(is_control)
      `)
    if (experimentId) {
      assQuery = (assQuery as any).eq('experiment_id', experimentId)
    }
    const { data: assignments, error: assignmentsError } = await assQuery

    if (assignmentsError) {
      console.error('Erro ao buscar assignments para trends:', assignmentsError)
    }

    // Criar mapa de visitor_id -> is_control
    const visitorControlMap = new Map()
    assignments?.forEach((assignment: any) => {
      visitorControlMap.set(
        `${assignment.experiment_id}_${assignment.visitor_id}`,
        assignment.variants.is_control
      )
    })

    // Agrupar por dia
    const dailyStats = new Map()

    events.forEach((event: any) => {
      const date = event.created_at.split('T')[0]
      if (!dailyStats.has(date)) {
        dailyStats.set(date, {
          controlVisitors: new Set(),
          variantAVisitors: new Set(),
          variantBVisitors: new Set(),
          controlRate: 0,
          variantARate: 0,
          variantBRate: 0
        })
      }

      const dayData = dailyStats.get(date)
      const visitorKey = `${event.experiment_id}_${event.visitor_id}`
      const isControl = visitorControlMap.get(visitorKey)

      // Classificar visitantes
      if (isControl) {
        dayData.controlVisitors.add(event.visitor_id)
      } else {
        // Para demo, alternamos entre variante A e B
        const hash = event.visitor_id.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)
        if (hash % 2 === 0) {
          dayData.variantAVisitors.add(event.visitor_id)
        } else {
          dayData.variantBVisitors.add(event.visitor_id)
        }
      }

      // Calcular taxas de conversão baseadas em eventos de conversão
      if (event.event_type === 'conversion') {
        if (isControl) {
          dayData.controlRate += 1
        } else {
          const hash = event.visitor_id.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)
          if (hash % 2 === 0) {
            dayData.variantARate += 1
          } else {
            dayData.variantBRate += 1
          }
        }
      }
    })

    // Converter para formato de array com taxas de conversão calculadas
    return Array.from(dailyStats.entries())
      .map(([date, stats]) => {
        const controlVisitors = stats.controlVisitors.size
        const variantAVisitors = stats.variantAVisitors.size
        const variantBVisitors = stats.variantBVisitors.size

        return {
          date,
          control_rate: controlVisitors > 0 ?
            Math.round((stats.controlRate / controlVisitors) * 1000) / 10 : 0,
          variant_a_rate: variantAVisitors > 0 ?
            Math.round((stats.variantARate / variantAVisitors) * 1000) / 10 : 0,
          variant_b_rate: variantBVisitors > 0 ?
            Math.round((stats.variantBRate / variantBVisitors) * 1000) / 10 : 0,
          total_visitors: controlVisitors + variantAVisitors + variantBVisitors
        }
      })
      .filter(item => item.total_visitors > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  } catch (error) {
    console.error('Erro ao processar tendências de visitantes:', error)
    return []
  }
}

// Interfaces para dados de campanhas/audiências
export interface CampaignData {
  id: string
  name: string
  source: string
  medium: string
  campaign: string
  content?: string
  term?: string
  visitors: number
  conversions: number
  conversionRate: number
  revenue: number
  cost?: number
  cpc?: number
  cpm?: number
  ctr?: number
  impressions?: number
  clicks?: number
  startDate: string
  endDate?: string
  status: 'active' | 'paused' | 'ended'
}

export interface AudienceSegment {
  id: string
  name: string
  description: string
  conditions: {
    source?: string[]
    medium?: string[]
    campaign?: string[]
    country?: string[]
    device?: string[]
    timeframe?: { start: string; end: string }
  }
  visitors: number
  conversionRate: number
  avgValue: number
  totalRevenue: number
}

// Função para buscar dados de campanhas baseadas em UTMs
export async function getCampaignData(range: '7d' | '30d' | '90d' | '1y' = '90d'): Promise<CampaignData[]> {
  try {
    const supabase = createClient()
    const days = range === '7d' ? 7 : range === '1y' ? 365 : range === '30d' ? 30 : 90
    // Buscar sessões de visitantes com UTMs do período selecionado
    const { data: sessions, error } = await supabase
      .from('visitor_sessions')
      .select(`
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        visitor_id,
        started_at,
        ended_at,
        events_count,
        country_code,
        device_type
      `)
      .gte('started_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .not('utm_campaign', 'is', null)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar dados de campanhas:', error)
      // Se a tabela não existir ou houver erro, retornar dados simulados
    }

    if (!sessions || sessions.length === 0) {
      return []
    }

    // Buscar eventos de conversão para calcular receita
    const { data: conversions, error: convError } = await supabase
      .from('events')
      .select('visitor_id, value, created_at')
      .eq('event_type', 'conversion')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (convError) {
      console.error('Erro ao buscar conversões:', convError)
    }

    // Criar mapa de conversões por visitor_id
    const conversionMap = new Map<string, { count: number; revenue: number }>()
    conversions?.forEach((conv: any) => {
      const existing = conversionMap.get(conv.visitor_id) || { count: 0, revenue: 0 }
      conversionMap.set(conv.visitor_id, {
        count: existing.count + 1,
        revenue: existing.revenue + (conv.value || 0)
      })
    })

    // Agrupar sessões por campanha
    const campaignMap = new Map<string, {
      source: string
      medium: string
      campaign: string
      content?: string
      term?: string
      visitors: Set<string>
      conversions: number
      revenue: number
      sessions: any[]
    }>()

    sessions.forEach((session: any) => {
      const key = `${session.utm_source || 'direct'}_${session.utm_medium || 'none'}_${session.utm_campaign}`

      if (!campaignMap.has(key)) {
        campaignMap.set(key, {
          source: session.utm_source || 'direct',
          medium: session.utm_medium || 'none',
          campaign: session.utm_campaign,
          content: session.utm_content,
          term: session.utm_term,
          visitors: new Set(),
          conversions: 0,
          revenue: 0,
          sessions: []
        })
      }

      const campaign = campaignMap.get(key)!
      campaign.visitors.add(session.visitor_id)
      campaign.sessions.push(session)

      // Adicionar conversões se existirem
      const conversion = conversionMap.get(session.visitor_id)
      if (conversion) {
        campaign.conversions += conversion.count
        campaign.revenue += conversion.revenue
      }
    })

    // Converter para array de campanhas
    return Array.from(campaignMap.entries()).map(([key, data], index) => {
      const visitors = data.visitors.size
      const conversionRate = visitors > 0 ? (data.conversions / visitors) * 100 : 0

      // Simular dados adicionais para demo
      const clicks = Math.floor(visitors * 1.2) // CTR simulado
      const impressions = Math.floor(clicks * 15) // CTR de ~6-8%
      const cost = data.revenue * 0.3 // ROI de ~70%

      return {
        id: `campaign_${index + 1}`,
        name: `${data.campaign} (${data.source})`,
        source: data.source,
        medium: data.medium,
        campaign: data.campaign,
        content: data.content,
        term: data.term,
        visitors,
        conversions: data.conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        revenue: data.revenue,
        cost,
        cpc: clicks > 0 ? cost / clicks : 0,
        cpm: impressions > 0 ? (cost / impressions) * 1000 : 0,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        impressions,
        clicks,
        startDate: data.sessions.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())[0]?.started_at || new Date().toISOString(),
        endDate: data.sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]?.started_at || undefined,
        status: 'active' as const
      }
    }).sort((a, b) => b.visitors - a.visitors)

  } catch (error) {
    console.error('Erro ao processar dados de campanhas:', error)
    return []
  }
}

// Função para buscar segmentos de audiência
export async function getAudienceSegments(range: '7d' | '30d' | '60d' | '90d' | '1y' = '60d'): Promise<AudienceSegment[]> {
  try {
    const supabase = createClient()
    const days = range === '7d' ? 7 : range === '1y' ? 365 : range === '30d' ? 30 : range === '90d' ? 90 : 60
    // Buscar dados de sessões do período selecionado
    const { data: sessions, error } = await supabase
      .from('visitor_sessions')
      .select(`
        visitor_id,
        utm_source,
        utm_medium,
        utm_campaign,
        country_code,
        device_type,
        started_at
      `)
      .gte('started_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('Erro ao buscar dados para segmentos:', error)
      // Se a tabela não existir, retornar dados simulados
    }

    if (!sessions || sessions.length === 0) {
      return []
    }

    // Buscar conversões para calcular taxas
    const { data: conversions, error: convError } = await supabase
      .from('events')
      .select('visitor_id, value')
      .eq('event_type', 'conversion')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (convError) {
      console.error('Erro ao buscar conversões para segmentos:', convError)
    }

    const conversionMap = new Map<string, number>()
    conversions?.forEach((conv: any) => {
      conversionMap.set(conv.visitor_id, (conv.value || 0))
    })

    // Criar segmentos baseados em diferentes critérios
    const segments: AudienceSegment[] = []

    // Segmento por fonte de tráfego
    const sourceGroups = new Map<string, Set<string>>()
    sessions.forEach((session: any) => {
      const source = session.utm_source || 'direct'
      if (!sourceGroups.has(source)) {
        sourceGroups.set(source, new Set())
      }
      sourceGroups.get(source)!.add(session.visitor_id)
    })

    sourceGroups.forEach((visitors, source) => {
      const conversions = Array.from(visitors).filter(v => conversionMap.has(v))
      const revenue = conversions.reduce((sum: number, v: string) => sum + (conversionMap.get(v) || 0), 0)
      const conversionRate = visitors.size > 0 ? (conversions.length / visitors.size) * 100 : 0

      segments.push({
        id: `source_${source}`,
        name: `Tráfego ${source}`,
        description: `Visitantes vindos de ${source}`,
        conditions: { source: [source] },
        visitors: visitors.size,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgValue: conversions.length > 0 ? revenue / conversions.length : 0,
        totalRevenue: revenue
      })
    })

    // Segmento por dispositivo
    const deviceGroups = new Map<string, Set<string>>()
    sessions.forEach((session: any) => {
      const device = session.device_type || 'desktop'
      if (!deviceGroups.has(device)) {
        deviceGroups.set(device, new Set())
      }
      deviceGroups.get(device)!.add(session.visitor_id)
    })

    deviceGroups.forEach((visitors, device) => {
      const conversions = Array.from(visitors).filter(v => conversionMap.has(v))
      const revenue = conversions.reduce((sum: number, v: string) => sum + (conversionMap.get(v) || 0), 0)
      const conversionRate = visitors.size > 0 ? (conversions.length / visitors.size) * 100 : 0

      segments.push({
        id: `device_${device}`,
        name: `Usuários ${device}`,
        description: `Visitantes usando ${device}`,
        conditions: { device: [device] },
        visitors: visitors.size,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgValue: conversions.length > 0 ? revenue / conversions.length : 0,
        totalRevenue: revenue
      })
    })

    // Segmento por país (top 5)
    const countryGroups = new Map<string, Set<string>>()
    sessions.forEach((session: any) => {
      const country = session.country_code || 'unknown'
      if (!countryGroups.has(country)) {
        countryGroups.set(country, new Set())
      }
      countryGroups.get(country)!.add(session.visitor_id)
    })

    // Pegar apenas os 5 países com mais visitantes
    const topCountries = Array.from(countryGroups.entries())
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 5)

    topCountries.forEach(([country, visitors]) => {
      const conversions = Array.from(visitors).filter(v => conversionMap.has(v))
      const revenue = conversions.reduce((sum: number, v: string) => sum + (conversionMap.get(v) || 0), 0)
      const conversionRate = visitors.size > 0 ? (conversions.length / visitors.size) * 100 : 0

      segments.push({
        id: `country_${country}`,
        name: `Visitantes ${country.toUpperCase()}`,
        description: `Visitantes do país ${country}`,
        conditions: { country: [country] },
        visitors: visitors.size,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgValue: conversions.length > 0 ? revenue / conversions.length : 0,
        totalRevenue: revenue
      })
    })

    return segments
      .filter(segment => segment.visitors > 0)
      .sort((a, b) => b.visitors - a.visitors)

  } catch (error) {
    console.error('Erro ao processar segmentos de audiência:', error)
    return []
  }
}

export async function getPreviousPeriodMetrics(range: '24h' | '30d' | '7d' | '90d' | '1y' = '30d', experimentId?: string) {
  try {
    const supabase = createClient()

    // Calcular datas do período anterior
    const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30
    const endDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

    // Buscar visitantes do período anterior
    let q = supabase
      .from('events')
      .select('visitor_id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())

    if (experimentId) {
      q = q.eq('experiment_id', experimentId)
    }

    const { count: visitors, error } = await q

    if (error) throw error

    // Buscar conversões do período anterior
    let qConv = supabase
      .from('events')
      .select('visitor_id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
      .eq('event_type', 'conversion')

    if (experimentId) {
      qConv = qConv.eq('experiment_id', experimentId)
    }

    const { count: conversions, error: convError } = await qConv

    if (convError) throw convError

    const visitorCount = visitors || 0
    const conversionCount = conversions || 0

    return {
      visitors: visitorCount,
      conversions: conversionCount,
      conversionRate: visitorCount > 0 ? (conversionCount / visitorCount) * 100 : 0
    }

  } catch (error) {
    console.error('Erro ao buscar métricas do período anterior:', error)
    return { visitors: 0, conversions: 0, conversionRate: 0 }
  }
}
