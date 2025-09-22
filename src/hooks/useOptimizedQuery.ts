import { useState, useEffect, useCallback, useRef } from 'react'

interface QueryOptions {
  enabled?: boolean
  refetchInterval?: number
  staleTime?: number
  cacheTime?: number
  retry?: number
  retryDelay?: number
}

interface QueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  isStale: boolean
  lastUpdated: Date | null
}

type QueryKey = string | Array<string | number | boolean | object>
type QueryFunction<T> = () => Promise<T>

// Simple cache implementation
class QueryCache {
  private cache = new Map<string, {
    data: any
    timestamp: number
    staleTime: number
    cacheTime: number
  }>()

  private getKeyString(key: QueryKey): string {
    return typeof key === 'string' ? key : JSON.stringify(key)
  }

  set(key: QueryKey, data: any, staleTime: number, cacheTime: number) {
    const keyString = this.getKeyString(key)
    this.cache.set(keyString, {
      data,
      timestamp: Date.now(),
      staleTime,
      cacheTime
    })

    // Auto cleanup after cache time
    setTimeout(() => {
      this.delete(key)
    }, cacheTime)
  }

  get(key: QueryKey) {
    const keyString = this.getKeyString(key)
    return this.cache.get(keyString)
  }

  delete(key: QueryKey) {
    const keyString = this.getKeyString(key)
    this.cache.delete(keyString)
  }

  isStale(key: QueryKey): boolean {
    const entry = this.get(key)
    if (!entry) return true
    return Date.now() - entry.timestamp > entry.staleTime
  }

  clear() {
    this.cache.clear()
  }
}

const globalCache = new QueryCache()

export function useOptimizedQuery<T>(
  key: QueryKey,
  queryFn: QueryFunction<T>,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    enabled = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 30 * 60 * 1000, // 30 minutes
    retry = 3,
    retryDelay = 1000
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const retryCountRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Check if data is stale
  const isStale = !data || globalCache.isStale(key)

  const executeQuery = useCallback(async (isRetry = false) => {
    if (!enabled) return

    // Check cache first
    const cached = globalCache.get(key)
    if (cached && !globalCache.isStale(key)) {
      setData(cached.data)
      setLoading(false)
      setError(null)
      setLastUpdated(new Date(cached.timestamp))
      return
    }

    if (!isRetry) {
      setLoading(true)
      setError(null)
    }

    try {
      const result = await queryFn()

      // Update cache
      globalCache.set(key, result, staleTime, cacheTime)

      setData(result)
      setError(null)
      setLastUpdated(new Date())
      retryCountRef.current = 0
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'

      if (retryCountRef.current < retry) {
        retryCountRef.current++
        setTimeout(() => {
          executeQuery(true)
        }, retryDelay * retryCountRef.current)
      } else {
        setError(errorMessage)
        retryCountRef.current = 0
      }
    } finally {
      setLoading(false)
    }
  }, [key, queryFn, enabled, staleTime, cacheTime, retry, retryDelay])

  const refetch = useCallback(async () => {
    // Force refetch by invalidating cache
    globalCache.delete(key)
    await executeQuery()
  }, [key, executeQuery])

  // Initial fetch
  useEffect(() => {
    executeQuery()
  }, [executeQuery])

  // Setup refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        if (globalCache.isStale(key)) {
          executeQuery()
        }
      }, refetchInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
    return undefined
  }, [refetchInterval, enabled, key, executeQuery])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    refetch,
    isStale,
    lastUpdated
  }
}

// Mutation hook for data updates
export function useOptimizedMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: Error, variables: TVariables) => void
    invalidateQueries?: QueryKey[]
  } = {}
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (variables: TVariables) => {
    setLoading(true)
    setError(null)

    try {
      const result = await mutationFn(variables)

      // Invalidate specified queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(key => {
          globalCache.delete(key)
        })
      }

      options.onSuccess?.(result, variables)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error.message)
      options.onError?.(error, variables)
      throw error
    } finally {
      setLoading(false)
    }
  }, [mutationFn, options])

  return {
    mutate,
    loading,
    error
  }
}

// Utility functions for cache management
export const queryCache = {
  invalidate: (key: QueryKey) => globalCache.delete(key),
  clear: () => globalCache.clear(),
  setData: <T>(key: QueryKey, data: T, staleTime = 5 * 60 * 1000, cacheTime = 30 * 60 * 1000) => {
    globalCache.set(key, data, staleTime, cacheTime)
  }
}