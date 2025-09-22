import { useState, useEffect, useCallback, useMemo } from 'react'

type Experiment = {
  id: string
  name: string
  description?: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  created_at: string
  updated_at?: string
  project_id?: string | null
  algorithm?: string
  traffic_allocation?: number
  tags?: string[]
  variants?: Array<{
    id: string
    name: string
    key: string
    is_control: boolean
    weight?: number
    config?: any
  }>
}

type ExperimentFilters = {
  status?: 'all' | 'draft' | 'running' | 'paused' | 'completed'
  query?: string
  tags?: string[]
  project_id?: string | null
}

type ExperimentSort = {
  key: 'name' | 'created_at' | 'status' | 'updated_at'
  direction: 'asc' | 'desc'
}

export function useExperiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ExperimentFilters>({
    status: 'all',
    query: '',
    tags: [],
  })
  const [sort, setSort] = useState<ExperimentSort>({
    key: 'created_at',
    direction: 'desc'
  })

  // Mock data for development
  const loadExperiments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Mock data
      const mockData: Experiment[] = [
        {
          id: '1',
          name: 'Teste de Botão CTA',
          description: 'Testando diferentes cores do botão principal',
          status: 'running',
          created_at: new Date().toISOString(),
          algorithm: 'thompson_sampling',
          traffic_allocation: 100,
          variants: [
            { id: '1a', name: 'Controle', key: 'A', is_control: true, weight: 50 },
            { id: '1b', name: 'Verde', key: 'B', is_control: false, weight: 50 }
          ]
        },
        {
          id: '2',
          name: 'Headline da Homepage',
          description: 'Testando diferentes headlines',
          status: 'draft',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          algorithm: 'ucb1',
          traffic_allocation: 50,
          variants: [
            { id: '2a', name: 'Original', key: 'A', is_control: true, weight: 50 },
            { id: '2b', name: 'Nova versão', key: 'B', is_control: false, weight: 50 }
          ]
        }
      ]

      // Apply filters
      let filteredData = mockData

      if (filters.status && filters.status !== 'all') {
        filteredData = filteredData.filter(exp => exp.status === filters.status)
      }

      if (filters.query) {
        const searchTerm = filters.query.toLowerCase()
        filteredData = filteredData.filter(exp =>
          exp.name.toLowerCase().includes(searchTerm) ||
          exp.description?.toLowerCase().includes(searchTerm)
        )
      }

      setExperiments(filteredData)
    } catch (err) {
      console.error('Error loading experiments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load experiments')
    } finally {
      setLoading(false)
    }
  }, [filters, sort])

  // Create new experiment
  const createExperiment = useCallback(async (data: {
    name: string
    description?: string
    project_id?: string | null
    algorithm?: string
    traffic_allocation?: number
  }) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      const newExperiment: Experiment = {
        id: Date.now().toString(),
        name: data.name.trim(),
        description: data.description?.trim(),
        status: 'draft',
        created_at: new Date().toISOString(),
        project_id: data.project_id,
        algorithm: data.algorithm || 'thompson_sampling',
        traffic_allocation: data.traffic_allocation || 100,
        variants: [
          { id: Date.now() + '_a', name: 'Controle', key: 'A', is_control: true, weight: 50 },
          { id: Date.now() + '_b', name: 'Variante B', key: 'B', is_control: false, weight: 50 }
        ]
      }

      setExperiments(prev => [newExperiment, ...prev])
      return newExperiment
    } catch (err) {
      console.error('Error creating experiment:', err)
      throw err
    }
  }, [loadExperiments])

  // Update experiment
  const updateExperiment = useCallback(async (id: string, updates: Partial<Experiment>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200))

      setExperiments(prev =>
        prev.map(exp =>
          exp.id === id ? { ...exp, ...updates } : exp
        )
      )
    } catch (err) {
      console.error('Error updating experiment:', err)
      throw err
    }
  }, [])

  // Delete experiment
  const deleteExperiment = useCallback(async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200))

      setExperiments(prev => prev.filter(exp => exp.id !== id))
    } catch (err) {
      console.error('Error deleting experiment:', err)
      throw err
    }
  }, [])

  // Duplicate experiment
  const duplicateExperiment = useCallback(async (id: string) => {
    try {
      const original = experiments.find(exp => exp.id === id)
      if (!original) throw new Error('Experiment not found')

      await new Promise(resolve => setTimeout(resolve, 300))

      const duplicated: Experiment = {
        ...original,
        id: Date.now().toString(),
        name: `${original.name} (Cópia)`,
        status: 'draft',
        created_at: new Date().toISOString(),
        variants: original.variants?.map(v => ({
          ...v,
          id: Date.now() + '_' + v.key.toLowerCase()
        }))
      }

      setExperiments(prev => [duplicated, ...prev])
      return duplicated
    } catch (err) {
      console.error('Error duplicating experiment:', err)
      throw err
    }
  }, [experiments])

  // Filtered and sorted experiments
  const filteredExperiments = useMemo(() => {
    const result = [...experiments]

    // Apply sorting
    result.sort((a, b) => {
      const aVal = a[sort.key]
      const bVal = b[sort.key]

      if (aVal === bVal) return 0

      const isAsc = sort.direction === 'asc'

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return isAsc
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return isAsc
        ? (aVal! < bVal! ? -1 : 1)
        : (bVal! < aVal! ? -1 : 1)
    })

    return result
  }, [experiments, sort])

  // Stats
  const stats = useMemo(() => {
    const total = experiments.length
    const running = experiments.filter(exp => exp.status === 'running').length
    const draft = experiments.filter(exp => exp.status === 'draft').length
    const completed = experiments.filter(exp => exp.status === 'completed').length
    const paused = experiments.filter(exp => exp.status === 'paused').length

    return { total, running, draft, completed, paused }
  }, [experiments])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ExperimentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Update sort
  const updateSort = useCallback((newSort: Partial<ExperimentSort>) => {
    setSort(prev => ({ ...prev, ...newSort }))
  }, [])

  // Load experiments on mount and when filters change
  useEffect(() => {
    loadExperiments()
  }, [loadExperiments])

  return {
    experiments: filteredExperiments,
    loading,
    error,
    stats,
    filters,
    sort,
    updateFilters,
    updateSort,
    createExperiment,
    updateExperiment,
    deleteExperiment,
    duplicateExperiment,
    refetch: loadExperiments
  }
}