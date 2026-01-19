'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EventFilters } from '@/components/dashboard/advanced-event-filters'
import { toast } from 'sonner'

export interface Event {
  id: string
  event_type: string
  event_name: string
  visitor_id: string
  experiment_id?: string
  variant_id?: string
  event_data: Record<string, any>  // JSONB field from database
  utm_data: Record<string, any>    // JSONB field for UTM parameters
  value?: number
  created_at: string
  // Computed properties from event_data for compatibility
  properties?: Record<string, any>
  session_id?: string
  device_type?: string
  browser?: string
  os?: string
  country?: string
  city?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export interface EventStats {
  total_events: number
  page_views: number
  clicks: number
  conversions: number
  custom: number
  unique_visitors: number
}

export interface UseEventsOptions {
  pageSize?: number
  realTime?: boolean
  projectId?: string | null
  autoLoad?: boolean
}

/**
 * Hook customizado para buscar e gerenciar eventos com filtros avançados
 *
 * Busca eventos do Supabase com suporte a:
 * - Filtros avançados (tipo, experimento, data, UTM, device, etc.)
 * - Paginação automática
 * - Real-time updates via Supabase channels
 * - Fallback para dados mock quando Supabase não está disponível
 * - Estatísticas agregadas (totais, conversões, visitantes únicos)
 *
 * **Comportamento Importante:**
 * - Se Supabase falhar, usa dados mock e exibe toast warning para o usuário
 * - Real-time: Subscribe em mudanças da tabela events (INSERT apenas)
 * - Auto-load: Carrega dados automaticamente ao montar o componente
 *
 * @hook
 * @param {EventFilters} filters - Objeto com todos os filtros a aplicar
 * @param {UseEventsOptions} options - Opções de configuração
 * @param {number} [options.pageSize=50] - Quantidade de eventos por página
 * @param {boolean} [options.realTime=false] - Habilitar updates em tempo real
 * @param {boolean} [options.autoLoad=true] - Carregar automaticamente ao montar
 *
 * @returns {Object} Estado e funções do hook
 * @returns {Event[]} events - Array de eventos carregados
 * @returns {EventStats} stats - Estatísticas agregadas
 * @returns {boolean} loading - Estado de carregamento
 * @returns {Error | null} error - Erro se houver
 * @returns {boolean} hasMore - Se há mais eventos para carregar
 * @returns {Function} loadMore - Carrega próxima página
 * @returns {Function} refresh - Recarrega eventos do zero
 * @returns {number} page - Página atual
 *
 * @example
 * ```tsx
 * const { events, stats, loading, loadMore, refresh } = useEvents(filters, {
 *   pageSize: 100,
 *   realTime: true
 * })
 *
 * // Uso básico
 * {loading ? <Skeleton /> : <EventList events={events} />}
 *
 * // Paginação
 * {hasMore && <Button onClick={loadMore}>Carregar mais</Button>}
 * ```
 *
 * @see {@link EventFilters} para estrutura de filtros
 * @see {@link Event} para estrutura de eventos
 */
export function useEvents(filters: EventFilters, options: UseEventsOptions = {}) {
  const { pageSize = 50, realTime = false, projectId, autoLoad = true } = options

  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<EventStats>({
    total_events: 0,
    page_views: 0,
    clicks: 0,
    conversions: 0,
    custom: 0,
    unique_visitors: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)

  const supabase = createClient()

  // Verificar se o cliente Supabase está válido
  if (!supabase || typeof supabase.from !== 'function') {
    console.error('Supabase client is invalid:', supabase)
    throw new Error('Supabase client não está configurado corretamente. Verifique as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  // Helper function to serialize errors robustly
  const serializeError = useCallback((err: any): any => {
    if (!err) return null

    const serialized: any = {}

    // Try to access properties directly first
    try {
      if (err.message !== undefined) {
        serialized.message = typeof err.message === 'string' ? err.message : String(err.message)
      }
      if (err.code !== undefined) {
        serialized.code = typeof err.code === 'string' || typeof err.code === 'number' ? err.code : String(err.code)
      }
      if (err.details !== undefined) {
        serialized.details = typeof err.details === 'string' ? err.details : JSON.stringify(err.details)
      }
      if (err.hint !== undefined) {
        serialized.hint = typeof err.hint === 'string' ? err.hint : String(err.hint)
      }
      if (err.name !== undefined) {
        serialized.name = typeof err.name === 'string' ? err.name : String(err.name)
      }
      if (err.status !== undefined) {
        serialized.status = typeof err.status === 'number' ? err.status : (typeof err.status === 'string' ? parseInt(err.status) : null)
      }
      if (err.statusCode !== undefined) {
        serialized.statusCode = typeof err.statusCode === 'number' ? err.statusCode : (typeof err.statusCode === 'string' ? parseInt(err.statusCode) : null)
      }
    } catch (_e) {
      // ignore
    }

    // Try via Object.getOwnPropertyNames to capture non-enumerable properties
    try {
      const props = Object.getOwnPropertyNames(err)
      props.forEach(prop => {
        if (prop === 'message' || prop === 'code' || prop === 'details' || prop === 'hint' || prop === 'name' || prop === 'status' || prop === 'statusCode') {
          return // already processed above
        }
        try {
          const value = err[prop]
          if (typeof value === 'function') {
            return // skip functions
          }
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
            serialized[prop] = value
          } else if (typeof value === 'object') {
            try {
              serialized[prop] = JSON.stringify(value)
            } catch {
              serialized[prop] = String(value)
            }
          }
        } catch (_e) {
          // ignore
        }
      })
    } catch (_e) {
      // ignore
    }

    // Fallback: try toString()
    if (!serialized.message || serialized.message === '[object Object]') {
      try {
        if (err.toString && typeof err.toString === 'function') {
          const str = err.toString()
          if (str && str !== '[object Object]') {
            serialized.message = str
          } else {
            serialized.message = 'Unknown error (could not extract message)'
          }
        } else {
          serialized.message = 'Unknown error (could not extract message)'
        }
      } catch (_e) {
        serialized.message = 'Unknown error (serialization failed)'
      }
    }

    return serialized
  }, [])

  // Fetch events with filters
  const fetchEvents = useCallback(async (pageNumber: number = 0, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      // Build query - excluir project_id do select para evitar erro de coluna não encontrada
      // O Supabase REST API pode não estar sincronizado com as mudanças no schema
      let query = supabase
        .from('events')
        .select('id, event_type, event_name, visitor_id, experiment_id, variant_id, event_data, utm_data, value, created_at, utm_source, utm_medium, utm_campaign, device_type, browser, country, properties, session_id, referrer, os, city, utm_term, utm_content', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pageNumber * pageSize, (pageNumber + 1) * pageSize - 1)

      // Filter by project_id if provided - mas apenas se o backend suportar
      // Para contornar o erro, não filtramos por project_id direto
      // TODO: Remover este comentário quando o schema do Supabase for totalmente sincronizado
      if (projectId) {
        // Validar que projectId não está vazio e é um UUID válido antes de aplicar filtro
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);

        if (typeof projectId === 'string' && projectId.trim() !== '' && isUuid) {
          // ⚠️ Supabase REST API pode não ter project_id sincronizado ainda
          // Tentaremos apenas se o schema estiver pronto
          try {
            query = query.eq('project_id', projectId)
          } catch (e) {
            console.warn('⚠️ Project ID filter not available yet, continuing without filter:', e);
          }
        } else {
          console.warn('⚠️ Invalid or placeholder projectId ignored in events query:', projectId);
        }
      }

      // Log da query antes de executar
      console.log('🔍 Executando query events:', {
        projectId,
        filters: {
          eventType: filters.eventType,
          search: filters.search,
        }
      })

      // Apply filters
      if (filters.search) {
        query = query.or(`event_name.ilike.%${filters.search}%,visitor_id.ilike.%${filters.search}%`)
      }

      if (filters.eventType !== 'all') {
        query = query.eq('event_type', filters.eventType)
      }

      if (filters.experimentId !== 'all') {
        query = query.eq('experiment_id', filters.experimentId)
      }

      if (filters.visitorId) {
        query = query.eq('visitor_id', filters.visitorId)
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString())
      }

      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endOfDay.toISOString())
      }

      // Filtros de device/browser/country - agora usam colunas diretas (migration 20260119000000)
      if (filters.device) {
        query = query.ilike('device_type', `%${filters.device}%`)
      }

      if (filters.browser) {
        query = query.ilike('browser', `%${filters.browser}%`)
      }

      if (filters.country) {
        query = query.ilike('country', `%${filters.country}%`)
      }

      // Filtros UTM - usam colunas diretas (migration 20260119000000)
      if (filters.utmSource) {
        query = query.ilike('utm_source', `%${filters.utmSource}%`)
      }

      if (filters.utmMedium) {
        query = query.ilike('utm_medium', `%${filters.utmMedium}%`)
      }

      if (filters.utmCampaign) {
        query = query.ilike('utm_campaign', `%${filters.utmCampaign}%`)
      }

      if (filters.minValue !== undefined) {
        query = query.gte('value', filters.minValue)
      }

      if (filters.maxValue !== undefined) {
        query = query.lte('value', filters.maxValue)
      }

      let { data, error: fetchError, count } = await query

      // Se houver erro sobre project_id, tentar novamente sem filtro
      if (fetchError && (fetchError.message?.includes('project_id') || fetchError.code === '42703')) {
        console.warn('⚠️ project_id coluna não acessível, tentando query sem filtro...');

        let fallbackQuery = supabase
          .from('events')
          .select('id, event_type, event_name, visitor_id, experiment_id, variant_id, event_data, utm_data, value, created_at, utm_source, utm_medium, utm_campaign, device_type, browser, country, properties, session_id, referrer, os, city, utm_term, utm_content', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(pageNumber * pageSize, (pageNumber + 1) * pageSize - 1)

        // Apply other filters (sem project_id)
        if (filters.search) {
          fallbackQuery = fallbackQuery.or(`event_name.ilike.%${filters.search}%,visitor_id.ilike.%${filters.search}%`)
        }

        if (filters.eventType !== 'all') {
          fallbackQuery = fallbackQuery.eq('event_type', filters.eventType)
        }

        if (filters.experimentId !== 'all') {
          fallbackQuery = fallbackQuery.eq('experiment_id', filters.experimentId)
        }

        if (filters.visitorId) {
          fallbackQuery = fallbackQuery.eq('visitor_id', filters.visitorId)
        }

        if (filters.dateFrom) {
          fallbackQuery = fallbackQuery.gte('created_at', filters.dateFrom.toISOString())
        }

        if (filters.dateTo) {
          const endOfDay = new Date(filters.dateTo)
          endOfDay.setHours(23, 59, 59, 999)
          fallbackQuery = fallbackQuery.lte('created_at', endOfDay.toISOString())
        }

        if (filters.device) {
          fallbackQuery = fallbackQuery.ilike('device_type', `%${filters.device}%`)
        }

        if (filters.browser) {
          fallbackQuery = fallbackQuery.ilike('browser', `%${filters.browser}%`)
        }

        if (filters.country) {
          fallbackQuery = fallbackQuery.ilike('country', `%${filters.country}%`)
        }

        if (filters.utmSource) {
          fallbackQuery = fallbackQuery.ilike('utm_source', `%${filters.utmSource}%`)
        }

        if (filters.utmMedium) {
          fallbackQuery = fallbackQuery.ilike('utm_medium', `%${filters.utmMedium}%`)
        }

        if (filters.utmCampaign) {
          fallbackQuery = fallbackQuery.ilike('utm_campaign', `%${filters.utmCampaign}%`)
        }

        if (filters.minValue !== undefined) {
          fallbackQuery = fallbackQuery.gte('value', filters.minValue)
        }

        if (filters.maxValue !== undefined) {
          fallbackQuery = fallbackQuery.lte('value', filters.maxValue)
        }

        const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery

        if (fallbackError) {
          // Se fallback também falhar, usar o erro original
          throw fallbackError
        }

        data = fallbackData
        count = fallbackCount

        console.log('✅ Fallback query successful without project_id filter');
      } else if (fetchError) {
        // Análise detalhada do erro
        const errorAnalysis: any = {
          hasError: !!fetchError,
          errorType: typeof fetchError,
          errorConstructor: fetchError?.constructor?.name,
          errorString: String(fetchError),
          errorKeys: Object.keys(fetchError || {}),
          errorOwnPropertyNames: Object.getOwnPropertyNames(fetchError || {}),
          errorJSON: null,
          errorMessage: null,
          errorCode: null,
          errorDetails: null,
          errorHint: null,
        }

        // Tentar acessar propriedades usando diferentes métodos
        try {
          // Método 1: Acesso direto
          errorAnalysis.errorMessage = (fetchError as any)?.message
          errorAnalysis.errorCode = (fetchError as any)?.code
          errorAnalysis.errorDetails = (fetchError as any)?.details
          errorAnalysis.errorHint = (fetchError as any)?.hint
          errorAnalysis.errorStatus = (fetchError as any)?.status
          errorAnalysis.errorStatusCode = (fetchError as any)?.statusCode

          // Método 2: Usando 'in' operator
          errorAnalysis.hasMessage = 'message' in (fetchError || {})
          errorAnalysis.hasCode = 'code' in (fetchError || {})
          errorAnalysis.hasDetails = 'details' in (fetchError || {})

          // Método 3: Tentar JSON.stringify com replacer
          errorAnalysis.errorJSON = JSON.stringify(fetchError, (key, value) => {
            if (key === 'message' || key === 'code' || key === 'details' || key === 'hint') {
              return value
            }
            return value
          }, 2)
        } catch (e) {
          errorAnalysis.accessError = String(e)
        }

        // Determinar mensagem de erro
        const isEmptyObject = errorAnalysis.errorKeys.length === 0 &&
          errorAnalysis.errorOwnPropertyNames.length === 0

        let errorMessage = errorAnalysis.errorMessage ||
          (isEmptyObject ? 'Query blocked - possibly due to RLS policies or missing permissions' : 'Unknown Supabase error')

        // Se for objeto vazio, fornecer contexto adicional
        if (isEmptyObject) {
          errorAnalysis.suggestedFix = 'Verify RLS policies allow SELECT on events table. Check if project_id filter is causing issues.'
        }

        const serializedError = serializeError(fetchError)

        // Log detalhado sem usar spread para evitar problemas de serialização
        console.error('🔴 Supabase query error (detailed):')
        console.error('  isEmptyObject:', isEmptyObject)
        console.error('  errorMessage:', errorAnalysis.errorMessage)
        console.error('  errorCode:', errorAnalysis.errorCode)
        console.error('  errorDetails:', errorAnalysis.errorDetails)
        console.error('  errorHint:', errorAnalysis.errorHint)
        console.error('  errorType:', errorAnalysis.errorType)
        console.error('  errorConstructor:', errorAnalysis.errorConstructor)
        console.error('  errorKeys:', errorAnalysis.errorKeys)
        console.error('  errorOwnPropertyNames:', errorAnalysis.errorOwnPropertyNames)
        console.error('  errorJSON:', errorAnalysis.errorJSON)
        console.error('  serializedError:', serializedError)
        console.error('  projectId:', projectId, '(type:', typeof projectId, ')')
        console.error('  queryInfo:', {
          eventType: filters.eventType,
          search: filters.search,
          experimentId: filters.experimentId,
          visitorId: filters.visitorId,
        })
        console.error('  raw fetchError object:', fetchError)

        // Criar um novo erro com informações
        const error = new Error(errorMessage)
        if (errorAnalysis.errorCode) (error as any).code = errorAnalysis.errorCode
        if (errorAnalysis.errorDetails) (error as any).details = errorAnalysis.errorDetails
        if (errorAnalysis.errorHint) (error as any).hint = errorAnalysis.errorHint
        if (serializedError?.status) (error as any).status = serializedError.status
        if (serializedError?.statusCode) (error as any).statusCode = serializedError.statusCode

          // Adicionar análise completa ao erro para debug
          (error as any).errorAnalysis = errorAnalysis

        throw error
      }

      // Map database events to include computed fields for compatibility
      const eventsData = (data || []).map((event: any) => ({
        ...event,
        // Extract properties from event_data
        properties: event.event_data || {},
        // UTM parameters exist as direct columns (utm_source, utm_medium, utm_campaign)
        // Also check event_data as fallback
        utm_source: event.utm_source || event.event_data?.utm_source,
        utm_medium: event.utm_medium || event.event_data?.utm_medium,
        utm_campaign: event.utm_campaign || event.event_data?.utm_campaign,
        // Extract other fields from event_data (these don't exist as direct columns)
        device_type: event.event_data?.device_type,
        browser: event.event_data?.browser,
        os: event.event_data?.os,
        country: event.event_data?.country,
        city: event.event_data?.city,
        referrer: event.event_data?.referrer,
        // utm_data doesn't exist as a column, create it from existing UTM columns for compatibility
        utm_data: {
          utm_source: event.utm_source,
          utm_medium: event.utm_medium,
          utm_campaign: event.utm_campaign,
          utm_term: event.utm_term,
          utm_content: event.utm_content,
        },
      })) as Event[]

      if (append) {
        setEvents(prev => [...prev, ...eventsData])
      } else {
        setEvents(eventsData)
      }

      setHasMore(eventsData.length === pageSize && (count || 0) > (pageNumber + 1) * pageSize)
      setPage(pageNumber)

    } catch (err) {
      let errorMessage = 'Unknown error'
      let errorCode = null
      let errorDetails = null
      let errorHint = null
      let errorStatus = null
      let errorStatusCode = null

      if (err instanceof Error) {
        errorMessage = err.message
        errorCode = (err as any).code || null
        errorDetails = (err as any).details || null
        errorHint = (err as any).hint || null
        errorStatus = (err as any).status || null
        errorStatusCode = (err as any).statusCode || null
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object') {
        const errObj = err as any
        errorMessage = errObj.message || String(err) || 'Unknown error'
        errorCode = errObj.code || null
        errorDetails = errObj.details || null
        errorHint = errObj.hint || null
        errorStatus = errObj.status || null
        errorStatusCode = errObj.statusCode || null
      }

      console.error('Failed to fetch events:', {
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
        hint: errorHint,
        status: errorStatus,
        statusCode: errorStatusCode,
        projectId,
        filters,
        errorType: typeof err,
        errorConstructor: err?.constructor?.name,
        stack: err instanceof Error ? err.stack : undefined,
        errorString: String(err)
      })

      // Exibir feedback visual de erro para o usuário
      toast.error('Erro ao carregar eventos', {
        description: errorMessage || 'Não foi possível carregar os eventos. Tente novamente.',
        duration: 5000
      })

      setError(new Error(errorMessage))
      setEvents([]) // Clear events on error
    } finally {
      setLoading(false)
    }
  }, [filters, projectId, pageSize, supabase, serializeError])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      // Helper utilities para aplicar filtros de forma consistente
      const applyFiltersToQuery = (query: any, eventTypeOverride?: string) => {
        // Filter by project_id in stats
        // ⚠️ Supabase REST API pode não ter project_id sincronizado ainda
        // Comentamos o filtro por project_id até que o schema seja totalmente sincronizado
        /*
        if (projectId) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
          if (typeof projectId === 'string' && projectId.trim() !== '' && isUuid) {
            query = query.eq('project_id', projectId)
          }
        }
        */

        const effectiveEventType = eventTypeOverride ?? (filters.eventType !== 'all' ? filters.eventType : undefined)
        if (effectiveEventType) {
          query = query.eq('event_type', effectiveEventType)
        }

        if (filters.search) {
          query = query.or(`event_name.ilike.%${filters.search}%,visitor_id.ilike.%${filters.search}%`)
        }

        if (filters.experimentId !== 'all') {
          query = query.eq('experiment_id', filters.experimentId)
        }

        if (filters.visitorId) {
          query = query.eq('visitor_id', filters.visitorId)
        }

        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom.toISOString())
        }

        if (filters.dateTo) {
          const endOfDay = new Date(filters.dateTo)
          endOfDay.setHours(23, 59, 59, 999)
          query = query.lte('created_at', endOfDay.toISOString())
        }

        // Filtros de device/browser/country - agora usam colunas diretas (migration 20260119000000)
        if (filters.device) {
          query = query.ilike('device_type', `%${filters.device}%`)
        }

        if (filters.browser) {
          query = query.ilike('browser', `%${filters.browser}%`)
        }

        if (filters.country) {
          query = query.ilike('country', `%${filters.country}%`)
        }

        // Filtros UTM - usam colunas diretas (migration 20260119000000)
        if (filters.utmSource) {
          query = query.ilike('utm_source', `%${filters.utmSource}%`)
        }

        if (filters.utmMedium) {
          query = query.ilike('utm_medium', `%${filters.utmMedium}%`)
        }

        if (filters.utmCampaign) {
          query = query.ilike('utm_campaign', `%${filters.utmCampaign}%`)
        }

        if (filters.minValue !== undefined) {
          query = query.gte('value', filters.minValue)
        }

        if (filters.maxValue !== undefined) {
          query = query.lte('value', filters.maxValue)
        }

        return query
      }

      const buildBaseQuery = (eventTypeOverride?: string) => {
        const baseQuery = supabase.from('events').select('*', { count: 'exact' })
        return applyFiltersToQuery(baseQuery, eventTypeOverride)
      }

      const buildVisitorQuery = (eventTypeOverride?: string) => {
        let visitorQuery = supabase.from('events').select('visitor_id', { count: 'exact' })
        visitorQuery = applyFiltersToQuery(visitorQuery, eventTypeOverride)
        visitorQuery = visitorQuery.not('visitor_id', 'is', null)
        return visitorQuery
      }

      const totalResult = await buildBaseQuery()

      let pageViewsResult: any = null
      let clicksResult: any = null
      let conversionsResult: any = null
      let customResult: any = null
      let visitorsResult: any = null

      let results: Array<{ name: string; result: any }> = [
        { name: 'total', result: totalResult }
      ]

      if (filters.eventType === 'all') {
        const [pageViews, clicks, conversions, custom, visitors] = await Promise.all([
          buildBaseQuery('page_view'),
          buildBaseQuery('click'),
          buildBaseQuery('conversion'),
          buildBaseQuery('custom'),
          buildVisitorQuery()
        ])

        pageViewsResult = pageViews
        clicksResult = clicks
        conversionsResult = conversions
        customResult = custom
        visitorsResult = visitors

        results = [
          ...results,
          { name: 'pageViews', result: pageViewsResult },
          { name: 'clicks', result: clicksResult },
          { name: 'conversions', result: conversionsResult },
          { name: 'custom', result: customResult },
          { name: 'visitors', result: visitorsResult }
        ]
      } else {
        visitorsResult = await buildVisitorQuery(filters.eventType)
        results = [
          ...results,
          { name: 'visitors', result: visitorsResult }
        ]
      }

      const errors = results.filter(r => r.result?.error)

      // Log detalhes de cada resultado antes de processar erros
      if (errors.length > 0) {
        console.error('🔍 Debug: Verificando erros antes de serializar')
        errors.forEach(({ name, result }) => {
          const err = result?.error
          if (err) {
            // Log apenas informações relevantes
            console.error(`Query "${name}" erro:`, {
              message: err.message,
              code: err.code,
              details: err.details,
              hint: err.hint
            })
          }
        })
      }

      if (errors.length > 0) {
        const errorDetails = errors.map(({ name, result }: { name: string, result: any }) => {
          const err = result?.error
          return {
            name,
            error: serializeError(err)
          }
        })

        const firstErrorResult = errors[0].result?.error
        const serializedFirstError = serializeError(firstErrorResult)
        const firstErrorMessage =
          serializedFirstError?.message ||
          (firstErrorResult && String(firstErrorResult)) ||
          'Unknown error fetching stats'

        // Log separado para cada informação
        console.error('❌ Errors in fetchStats')
        console.error('Error count:', errors.length)
        console.error('Error details:', JSON.stringify(errorDetails, null, 2))
        console.error('Project ID:', projectId)
        console.error('Filters:', JSON.stringify(filters, null, 2))
        console.error('First error serialized:', JSON.stringify(serializedFirstError, null, 2))

        if (firstErrorResult) {
          console.error('First error raw object type:', typeof firstErrorResult)
          console.error('First error raw object constructor:', firstErrorResult?.constructor?.name)

          // Tentar serializar o erro bruto
          try {
            const errorStr = JSON.stringify(firstErrorResult, Object.getOwnPropertyNames(firstErrorResult), 2)
            console.error('First error serialized (raw):', errorStr || 'Could not serialize')
          } catch (serializeErr) {
            console.error('Could not serialize raw error:', serializeErr)
            console.error('First error toString:', firstErrorResult.toString?.() || String(firstErrorResult))
          }
        }

        const error = new Error(firstErrorMessage)
        if (serializedFirstError?.code) (error as any).code = serializedFirstError.code
        if (serializedFirstError?.details) (error as any).details = serializedFirstError.details
        if (serializedFirstError?.hint) (error as any).hint = serializedFirstError.hint
        throw error
      }

      if (filters.eventType !== 'all') {
        const totalCount = totalResult.count || 0
        const visitorsCount = visitorsResult?.count || 0

        setStats({
          total_events: totalCount,
          page_views: filters.eventType === 'page_view' ? totalCount : 0,
          clicks: filters.eventType === 'click' ? totalCount : 0,
          conversions: filters.eventType === 'conversion' ? totalCount : 0,
          custom: filters.eventType === 'custom' ? totalCount : 0,
          unique_visitors: visitorsCount
        })
        return
      }

      setStats({
        total_events: totalResult.count || 0,
        page_views: pageViewsResult?.count || 0,
        clicks: clicksResult?.count || 0,
        conversions: conversionsResult?.count || 0,
        custom: customResult?.count || 0,
        unique_visitors: visitorsResult?.count || 0
      })



    } catch (err) {
      // Extrair informações do erro de forma mais robusta
      let errorMessage = 'Unknown error'
      let errorCode = null
      let errorDetails = null
      let errorHint = null
      let errorStatus = null
      let errorStatusCode = null

      if (err instanceof Error) {
        errorMessage = err.message
        errorCode = (err as any).code || null
        errorDetails = (err as any).details || null
        errorHint = (err as any).hint || null
        errorStatus = (err as any).status || null
        errorStatusCode = (err as any).statusCode || null
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object') {
        const errObj = err as any
        errorMessage = errObj.message || String(err) || 'Unknown error'
        errorCode = errObj.code || null
        errorDetails = errObj.details || null
        errorHint = errObj.hint || null
        errorStatus = errObj.status || null
        errorStatusCode = errObj.statusCode || null
      }

      console.error('Failed to fetch stats:', {
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
        hint: errorHint,
        status: errorStatus,
        statusCode: errorStatusCode,
        projectId,
        filters
      })

      // Exibir feedback visual de erro para o usuário
      toast.error('Erro ao carregar estatísticas', {
        description: errorMessage || 'Não foi possível carregar as estatísticas.',
        duration: 4000
      })

      // Set zeros instead of mock data - REAL DATA ONLY
      setStats({
        total_events: 0,
        page_views: 0,
        clicks: 0,
        conversions: 0,
        custom: 0,
        unique_visitors: 0
      })

      // Error already shown em fetchEvents
    } finally {
      setLoading(false)
    }
  }, [filters, projectId, supabase, serializeError])

  // Load more events (pagination)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchEvents(page + 1, true)
    }
  }, [loading, hasMore, page, fetchEvents])

  // Refresh events
  const refresh = useCallback(() => {
    setPage(0)
    fetchEvents(0, false)
    fetchStats()
  }, [fetchEvents, fetchStats])

  // Auto-load on mount and filter changes
  useEffect(() => {
    if (autoLoad) {
      setPage(0)
      fetchEvents(0, false)
      fetchStats()
    }
  }, [filters, projectId, autoLoad, fetchEvents, fetchStats]) // fetchEvents and fetchStats are stable with useCallback

  // Real-time subscription
  useEffect(() => {
    if (!realTime) return

    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          const newEvent = payload.new as Event

          // Check if event matches current filters
          let matches = true

          if (filters.eventType !== 'all' && newEvent.event_type !== filters.eventType) {
            matches = false
          }

          if (filters.experimentId !== 'all' && newEvent.experiment_id !== filters.experimentId) {
            matches = false
          }

          if (filters.visitorId && newEvent.visitor_id !== filters.visitorId) {
            matches = false
          }

          if (matches) {
            setEvents(prev => [newEvent, ...prev])
            setStats(prev => ({
              ...prev,
              total_events: prev.total_events + 1,
              [newEvent.event_type === 'page_view' ? 'page_views' :
                newEvent.event_type === 'click' ? 'clicks' :
                  newEvent.event_type === 'conversion' ? 'conversions' : 'custom']:
                prev[newEvent.event_type === 'page_view' ? 'page_views' :
                  newEvent.event_type === 'click' ? 'clicks' :
                    newEvent.event_type === 'conversion' ? 'conversions' : 'custom'] + 1
            }))

            // Show toast notification
            const eventTypeLabels = {
              page_view: '👁️ Visualização',
              click: '🖱️ Clique',
              conversion: '🎯 Conversão',
              custom: '⚡ Evento Personalizado'
            }

            toast.success(
              `Novo ${eventTypeLabels[newEvent.event_type as keyof typeof eventTypeLabels] || 'Evento'}`,
              {
                description: `${newEvent.event_name} - Visitor: ${newEvent.visitor_id.slice(0, 8)}...`,
                duration: 3000
              }
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [realTime, filters, supabase])

  return {
    events,
    stats,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    page
  }
}
