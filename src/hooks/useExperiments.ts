'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useState, useCallback, useMemo } from 'react'

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
  project?: {
    name: string
    slug: string
  }
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

type CreateExperimentInput = {
  name: string
  description?: string
  project_id?: string | null
  algorithm?: string
  traffic_allocation?: number
}

type UpdateExperimentInput = Partial<Experiment> & { id: string }

export function useExperiments() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<ExperimentFilters>({
    status: 'all',
    query: '',
    tags: [],
  })
  const [sort, setSort] = useState<ExperimentSort>({
    key: 'created_at',
    direction: 'desc'
  })

  // Query para buscar experimentos do Supabase
  const {
    data: experiments,
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['experiments', filters],
    queryFn: async () => {
      let query = supabase
        .from('experiments')
        .select(`
          *,
          variants (*),
          project:projects (name, slug)
        `)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters.query) {
        query = query.ilike('name', `%${filters.query}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching experiments:', error)
        throw new Error(`Falha ao carregar experimentos: ${error.message}`)
      }

      return (data || []) as Experiment[]
    },
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: true
  })

  const error = queryError instanceof Error ? queryError.message : null

  // Mutation para criar experimento
  const createMutation = useMutation({
    mutationFn: async (data: CreateExperimentInput) => {
      // Buscar user e org
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: userData } = await supabase
        .from('users')
        .select('default_org_id')
        .eq('id', user.id)
        .single()

      const orgId = userData?.default_org_id
      if (!orgId) throw new Error('Organização não encontrada')

      // Buscar ou criar projeto padrão se não especificado
      let projectId = data.project_id
      if (!projectId) {
        const { data: defaultProject } = await supabase
          .from('projects')
          .select('id')
          .eq('org_id', orgId)
          .limit(1)
          .single()

        projectId = defaultProject?.id
      }

      const { data: newExperiment, error } = await supabase
        .from('experiments')
        .insert({
          name: data.name.trim(),
          description: data.description?.trim() || null,
          project_id: projectId,
          algorithm: data.algorithm || 'thompson_sampling',
          traffic_allocation: data.traffic_allocation || 100,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error

      // Criar variantes padrão
      if (newExperiment) {
        await supabase.from('variants').insert([
          {
            experiment_id: newExperiment.id,
            name: 'Controle',
            key: 'A',
            is_control: true,
            traffic_percentage: 50,
            is_active: true,
          },
          {
            experiment_id: newExperiment.id,
            name: 'Variante B',
            key: 'B',
            is_control: false,
            traffic_percentage: 50,
            is_active: true,
          }
        ])
      }

      return newExperiment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
    }
  })

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateExperimentInput) => {
      const { data, error } = await supabase
        .from('experiments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
    }
  })

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Deletar variantes primeiro (cascade pode não estar configurado)
      await supabase.from('variants').delete().eq('experiment_id', id)

      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
    }
  })

  // Função para duplicar experimento
  const duplicateExperiment = useCallback(async (id: string) => {
    const original = experiments?.find(exp => exp.id === id)
    if (!original) throw new Error('Experimento não encontrado')

    const { data: newExperiment, error } = await supabase
      .from('experiments')
      .insert({
        name: `${original.name} (Cópia)`,
        description: original.description,
        project_id: original.project_id,
        algorithm: original.algorithm,
        traffic_allocation: original.traffic_allocation,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    // Duplicar variantes
    if (newExperiment && original.variants) {
      await supabase.from('variants').insert(
        original.variants.map(v => ({
          experiment_id: newExperiment.id,
          name: v.name,
          key: v.key,
          is_control: v.is_control,
          traffic_percentage: v.weight || 50,
          is_active: true,
        }))
      )
    }

    queryClient.invalidateQueries({ queryKey: ['experiments'] })
    return newExperiment
  }, [experiments, supabase, queryClient])

  // Experimentos filtrados e ordenados
  const filteredExperiments = useMemo(() => {
    const result = [...(experiments || [])]

    // Aplicar ordenação
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
    const exps = experiments || []
    const total = exps.length
    const running = exps.filter(exp => exp.status === 'running').length
    const draft = exps.filter(exp => exp.status === 'draft').length
    const completed = exps.filter(exp => exp.status === 'completed').length
    const paused = exps.filter(exp => exp.status === 'paused').length

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

  return {
    experiments: filteredExperiments,
    loading,
    error,
    stats,
    filters,
    sort,
    updateFilters,
    updateSort,
    createExperiment: createMutation.mutate,
    updateExperiment: updateMutation.mutate,
    deleteExperiment: deleteMutation.mutate,
    duplicateExperiment,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch
  }
}
