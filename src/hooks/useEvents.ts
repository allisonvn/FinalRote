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

      // Build query - Começar com colunas básicas que sempre existem
      // NÃO incluir project_id pois pode não estar acessível via REST API mesmo existindo no banco
      // O RLS já filtra eventos baseado no project_id do usuário autenticado
      // Tentar primeiro com colunas essenciais, depois expandir se necessário
      // Remover 'properties' da query inicial pois pode não estar acessível via REST API
      let query = supabase
        .from('events')
        .select('id, event_type, event_name, visitor_id, experiment_id, variant_id, event_data, utm_data, value, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pageNumber * pageSize, (pageNumber + 1) * pageSize - 1)

      // Log da query antes de executar (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Executando query events:', {
          projectId,
          filters: {
            eventType: filters.eventType,
            search: filters.search,
          }
        })
      }

      // Apply apenas filtros básicos que não dependem de colunas que podem não existir
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

      if (filters.minValue !== undefined) {
        query = query.gte('value', filters.minValue)
      }

      if (filters.maxValue !== undefined) {
        query = query.lte('value', filters.maxValue)
      }

      // NOTA: Filtros de device/browser/country/utm serão aplicados apenas na query expandida
      // se as colunas estiverem disponíveis

      let { data, error: fetchError, count } = await query

      // Se a query básica funcionou, tentar expandir com colunas adicionais
      if (!fetchError && data) {
        try {
          const expandedQuery = supabase
            .from('events')
            .select('id, event_type, event_name, visitor_id, experiment_id, variant_id, event_data, utm_data, value, created_at, utm_source, utm_medium, utm_campaign, device_type, browser, country, session_id, referrer, os, city, utm_term, utm_content', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(pageNumber * pageSize, (pageNumber + 1) * pageSize - 1)

          // Reaplicar todos os filtros (básicos + adicionais)
          let finalQuery = expandedQuery
          
          if (filters.search) {
            finalQuery = finalQuery.or(`event_name.ilike.%${filters.search}%,visitor_id.ilike.%${filters.search}%`)
          }
          if (filters.eventType !== 'all') {
            finalQuery = finalQuery.eq('event_type', filters.eventType)
          }
          if (filters.experimentId !== 'all') {
            finalQuery = finalQuery.eq('experiment_id', filters.experimentId)
          }
          if (filters.visitorId) {
            finalQuery = finalQuery.eq('visitor_id', filters.visitorId)
          }
          if (filters.dateFrom) {
            finalQuery = finalQuery.gte('created_at', filters.dateFrom.toISOString())
          }
          if (filters.dateTo) {
            const endOfDay = new Date(filters.dateTo)
            endOfDay.setHours(23, 59, 59, 999)
            finalQuery = finalQuery.lte('created_at', endOfDay.toISOString())
          }
          // Filtros adicionais que dependem de colunas que podem não estar acessíveis
          if (filters.device) {
            finalQuery = finalQuery.ilike('device_type', `%${filters.device}%`)
          }
          if (filters.browser) {
            finalQuery = finalQuery.ilike('browser', `%${filters.browser}%`)
          }
          if (filters.country) {
            finalQuery = finalQuery.ilike('country', `%${filters.country}%`)
          }
          if (filters.utmSource) {
            finalQuery = finalQuery.ilike('utm_source', `%${filters.utmSource}%`)
          }
          if (filters.utmMedium) {
            finalQuery = finalQuery.ilike('utm_medium', `%${filters.utmMedium}%`)
          }
          if (filters.utmCampaign) {
            finalQuery = finalQuery.ilike('utm_campaign', `%${filters.utmCampaign}%`)
          }
          if (filters.minValue !== undefined) {
            finalQuery = finalQuery.gte('value', filters.minValue)
          }
          if (filters.maxValue !== undefined) {
            finalQuery = finalQuery.lte('value', filters.maxValue)
          }

          const { data: expandedData, error: expandedError, count: expandedCount } = await finalQuery
          
          if (!expandedError && expandedData) {
            // Usar dados expandidos se disponível
            data = expandedData
            count = expandedCount
            console.log('✅ Query expandida bem-sucedida com todas as colunas')
          } else {
            // Se a query expandida falhar, usar dados básicos
            console.log('⚠️ Query expandida falhou, usando dados básicos')
          }
        } catch (expandErr) {
          // Se houver erro ao expandir, usar dados básicos
          console.log('⚠️ Erro ao expandir query, usando dados básicos:', expandErr)
        }
      }

      // Se houver erro sobre colunas não encontradas, tentar novamente com colunas básicas
      const isColumnError = fetchError && (
        fetchError.message?.includes('project_id') || 
        fetchError.message?.includes('utm_source') || 
        fetchError.message?.includes('utm_medium') ||
        fetchError.message?.includes('utm_campaign') ||
        fetchError.message?.includes('device_type') ||
        fetchError.message?.includes('browser') ||
        fetchError.message?.includes('country') ||
        fetchError.message?.includes('does not exist') || 
        fetchError.code === '42703'
      )

      if (isColumnError) {
        console.warn('⚠️ Algumas colunas não acessíveis, tentando query com colunas básicas...', {
          errorMessage: fetchError?.message,
          errorCode: fetchError?.code
        });

        // Query mínima com apenas colunas essenciais (sem project_id e sem properties)
        let fallbackQuery = supabase
          .from('events')
          .select('id, event_type, event_name, visitor_id, experiment_id, variant_id, event_data, utm_data, value, created_at', { count: 'exact' })
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

        // Remover filtros de colunas que podem não existir na query fallback
        // device, browser, country, utm_* serão filtrados no cliente se necessário

        if (filters.minValue !== undefined) {
          fallbackQuery = fallbackQuery.gte('value', filters.minValue)
        }

        if (filters.maxValue !== undefined) {
          fallbackQuery = fallbackQuery.lte('value', filters.maxValue)
        }

        const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery

        if (fallbackError) {
          // Tentar uma última query com apenas as colunas mais básicas
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Fallback query falhou, tentando query mínima...', {
              fallbackError: serializeError(fallbackError)
            })
          }

          try {
            const minimalQuery = supabase
              .from('events')
              .select('id, event_type, event_name, visitor_id, created_at', { count: 'exact' })
              .order('created_at', { ascending: false })
              .range(pageNumber * pageSize, (pageNumber + 1) * pageSize - 1)

            // Aplicar apenas filtros básicos
            if (filters.eventType !== 'all') {
              minimalQuery.eq('event_type', filters.eventType)
            }
            if (filters.experimentId !== 'all') {
              minimalQuery.eq('experiment_id', filters.experimentId)
            }

            const { data: minimalData, error: minimalError, count: minimalCount } = await minimalQuery

            if (minimalError) {
              // Se até a query mínima falhar, lançar o erro original
              throw fetchError
            }

            // Usar dados da query mínima
            data = minimalData
            count = minimalCount
          } catch (minimalErr) {
            // Se até a query mínima falhar, lançar o erro original
            throw fetchError
          }
        } else {
          data = fallbackData
          count = fallbackCount
        }

      } else if (fetchError) {
        // Usar serializeError para garantir que temos informações úteis
        const serializedError = serializeError(fetchError)
        
        // Determinar mensagem de erro
        const errorMessage = serializedError?.message || 
                            (fetchError as any)?.message ||
                            'Erro ao buscar eventos do banco de dados'

        // Log detalhado do erro (apenas em desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
          console.error('🔴 Supabase query error:', {
            serializedError,
            errorType: typeof fetchError,
            projectId,
          })
        }

        // Criar um novo erro com informações
        const error = new Error(errorMessage)
        if (serializedError?.code) (error as any).code = serializedError.code
        if (serializedError?.details) (error as any).details = serializedError.details
        if (serializedError?.hint) (error as any).hint = serializedError.hint
        if (serializedError?.status) (error as any).status = serializedError.status
        if (serializedError?.statusCode) (error as any).statusCode = serializedError.statusCode

        throw error
      }

      // Validar que temos dados ou um erro claro
      if (!data && !fetchError && process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Query retornou sem dados e sem erro - pode ser problema de RLS ou permissões')
        // Não lançar erro aqui, apenas usar array vazio
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
      // Usar serializeError para garantir que sempre temos informações úteis
      const serializedError = serializeError(err)
      
      // Log do erro apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error('🔴 Erro capturado no fetchEvents:', serializedError)
      }
      
      // Extrair informações do erro serializado com fallbacks robustos
      let errorMessage = 'Erro desconhecido ao carregar eventos'
      
      if (serializedError?.message) {
        errorMessage = serializedError.message
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object') {
        const errStr = String(err)
        if (errStr !== '[object Object]') {
          errorMessage = errStr
        } else {
          // Tentar extrair mensagem de propriedades comuns
          const errObj = err as any
          errorMessage = errObj.message || errObj.error || errObj.msg || errorMessage
        }
      }
      
      const errorCode = serializedError?.code || (err as any)?.code || undefined
      const errorDetails = serializedError?.details || (err as any)?.details || undefined
      const errorHint = serializedError?.hint || (err as any)?.hint || undefined
      const errorStatus = serializedError?.status || (err as any)?.status || undefined
      const errorStatusCode = serializedError?.statusCode || (err as any)?.statusCode || undefined

      // Construir objeto de log garantindo que sempre tenha informações úteis
      const errorLog: any = {
        message: errorMessage || 'Erro desconhecido',
        timestamp: new Date().toISOString(),
        projectId: projectId || 'não fornecido',
        filters: {
          eventType: filters.eventType || 'all',
          search: filters.search || '',
          experimentId: filters.experimentId || 'all',
        },
        errorType: typeof err,
        errorString: String(err || 'null/undefined')
      }

      // Adicionar propriedades opcionais apenas se existirem e não forem null/undefined
      if (errorCode !== undefined && errorCode !== null) errorLog.code = errorCode
      if (errorDetails !== undefined && errorDetails !== null) errorLog.details = errorDetails
      if (errorHint !== undefined && errorHint !== null) errorLog.hint = errorHint
      if (errorStatus !== undefined && errorStatus !== null) errorLog.status = errorStatus
      if (errorStatusCode !== undefined && errorStatusCode !== null) errorLog.statusCode = errorStatusCode
      
      if (err?.constructor?.name) errorLog.errorConstructor = err.constructor.name
      if (serializedError && serializedError !== null && typeof serializedError === 'object' && Object.keys(serializedError).length > 0) {
        errorLog.serializedError = serializedError
      }
      
      // Garantir que temos pelo menos algumas informações básicas
      if (!errorLog.message || errorLog.message === 'Erro desconhecido') {
        errorLog.message = `Erro do tipo ${typeof err} capturado em ${new Date().toISOString()}`
      }

      // Adicionar stack trace se disponível
      if (err instanceof Error && err.stack) {
        errorLog.stack = err.stack
      }

      // Adicionar informações adicionais se o erro for um objeto
      if (err && typeof err === 'object') {
        try {
          const keys = Object.keys(err)
          if (keys.length > 0) {
            errorLog.errorKeys = keys
          }
          const ownProps = Object.getOwnPropertyNames(err)
          if (ownProps.length > keys.length) {
            errorLog.ownPropertyNames = ownProps.filter(p => !keys.includes(p))
          }
        } catch (e) {
          // Ignorar erros ao tentar inspecionar o objeto
          errorLog.inspectionError = String(e)
        }
      }

      // Garantir que o log não está vazio e tem pelo menos a mensagem
      if (!errorLog.message || errorLog.message === 'Erro desconhecido ao carregar eventos') {
        // Tentar extrair qualquer informação útil do erro
        if (err === null || err === undefined) {
          errorLog.message = 'Erro null ou undefined capturado'
        } else if (typeof err === 'object') {
          try {
            const errStr = JSON.stringify(err, null, 2)
            if (errStr && errStr !== '{}' && errStr !== 'null') {
              errorLog.message = `Erro capturado: ${errStr.substring(0, 200)}`
            } else {
              errorLog.message = 'Erro capturado mas não foi possível extrair informações (objeto vazio)'
            }
          } catch {
            errorLog.message = `Erro capturado: ${String(err).substring(0, 200)}`
          }
        } else {
          errorLog.message = `Erro capturado: ${String(err).substring(0, 200)}`
        }
      }

      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Failed to fetch events:', errorLog)
      }

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

      // Log detalhes apenas em desenvolvimento
      if (errors.length > 0 && process.env.NODE_ENV === 'development') {
        errors.forEach(({ name, result }) => {
          const err = result?.error
          if (err) {
            console.error(`Query "${name}" erro:`, {
              message: err.message,
              code: err.code,
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

        // Log apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Errors in fetchStats:', {
            errorCount: errors.length,
            firstError: serializedFirstError,
            projectId
          })
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
