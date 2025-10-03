import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { safeTrafficAllocation } from '@/lib/numeric-utils'

type Variant = {
  id: string
  name: string
  description?: string
  is_control: boolean
  traffic_percentage?: number
  redirect_url?: string
  changes?: any
  css_changes?: string
  js_changes?: string
  visitors?: number
  conversions?: number
  conversion_rate?: number
  is_active?: boolean
}

type Experiment = {
  id: string
  name: string
  key?: string
  description?: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  algorithm?: 'uniform' | 'thompson_sampling' | 'ucb1' | 'epsilon_greedy'
  traffic_allocation?: number
  created_at: string
  updated_at?: string
  started_at?: string | null
  ended_at?: string | null
  project_id?: string | null
  variants?: Variant[]
  tags?: string[]
  metrics?: {
    visitors: number
    conversions: number
    conversion_rate: number
    confidence?: number
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

export function useSupabaseExperiments() {
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

  const supabase = createClient()

  // Carregar experimentos do Supabase
  const loadExperiments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Construir query base
      let query = supabase
        .from('experiments')
        .select(`
          *,
          variants (
            id,
            name,
            description,
            is_control,
            traffic_percentage,
            redirect_url,
            changes,
            css_changes,
            js_changes,
            visitors,
            conversions,
            conversion_rate,
            is_active
          )
        `)

      // Aplicar filtros
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }

      if (filters.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
      }

      // Aplicar ordenação
      query = query.order(sort.key, { ascending: sort.direction === 'asc' })

      const { data, error: queryError } = await query

      if (queryError) {
        throw queryError
      }

      // Carregar métricas para experimentos ativos
      const experimentsWithMetrics = await Promise.all(
        (data || []).map(async (exp: any) => {
          if (exp.status === 'running' || exp.status === 'completed') {
            // Buscar métricas do cache
            const { data: metricsData } = await supabase
              .from('metrics_snapshots')
              .select('*')
              .eq('experiment_id', exp.id)
              .order('computed_at', { ascending: false })
              .limit(1)

            if (metricsData && metricsData.length > 0) {
              const metrics = metricsData[0]
              return {
                ...exp,
                metrics: {
                  visitors: metrics.count || 0,
                  conversions: 0, // Será calculado
                  conversion_rate: metrics.value || 0,
                  confidence: metrics.confidence_interval?.confidence_level || 0
                }
              }
            }
          }
          return exp
        })
      )

      setExperiments(experimentsWithMetrics as Experiment[])
    } catch (err) {
      console.error('Erro ao carregar experimentos:', err)
      setError(err instanceof Error ? err.message : 'Falha ao carregar experimentos')
      toast.error('Erro ao carregar experimentos')
    } finally {
      setLoading(false)
    }
  }, [filters, sort, supabase])

  // Criar novo experimento
  const createExperiment = useCallback(async (data: {
    name: string
    description?: string
    project_id?: string | null
    algorithm?: string
    traffic_allocation?: number
    target_url?: string
    conversion_type?: string
    conversion_url?: string
    conversion_value?: number
    conversion_selector?: string
  }) => {
    try {
      // Gerar API key única para o experimento
      const generateApiKey = () => {
        const randomBytes = new Uint8Array(16)
        crypto.getRandomValues(randomBytes)
        const hexString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')
        return `exp_${hexString}`
      }

      const experimentApiKey = generateApiKey()

      // Inserir experimento COM API key e target_url
      const { data: newExp, error: insertError } = await supabase
        .from('experiments')
        .insert({
          name: data.name.trim(),
          description: data.description?.trim(),
          project_id: data.project_id,
          algorithm: (data.algorithm || 'thompson_sampling') as any,
          traffic_allocation: safeTrafficAllocation(data.traffic_allocation, 100),
          status: 'draft',
          api_key: experimentApiKey,  // ✅ API key única para o experimento
          target_url: data.target_url?.trim() || null  // ✅ Salvar URL da página original
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Preparar configuração de conversão para todas as variantes
      const conversionConfig = data.conversion_type ? {
        conversion: {
          type: data.conversion_type,
          url: data.conversion_url || null,
          selector: data.conversion_selector || null,
          value: data.conversion_value || 0
        }
      } : {}

      // Criar variantes padrão
      // ✅ CORREÇÃO: Variante de controle usa a URL da página configurada na etapa 01
      const variants = [
        { 
          experiment_id: newExp.id, 
          name: 'Controle', 
          description: 'Versão original - URL da página configurada no setup',
          is_control: true,
          traffic_percentage: 50.00,
          redirect_url: data.target_url?.trim() || null,  // ✅ Usar URL da etapa 01 como controle
          changes: conversionConfig,  // ✅ Adicionar config de conversão
          css_changes: null,
          js_changes: null,
          visitors: 0,
          conversions: 0,
          conversion_rate: 0.0000,
          is_active: true
        },
        { 
          experiment_id: newExp.id, 
          name: 'Variante A', 
          description: 'Versão alternativa - configurar URL na próxima etapa',
          is_control: false,
          traffic_percentage: 50.00,
          redirect_url: null,  // ✅ Usuário configura manualmente na etapa de variantes
          changes: conversionConfig,  // ✅ Adicionar config de conversão
          css_changes: null,
          js_changes: null,
          visitors: 0,
          conversions: 0,
          conversion_rate: 0.0000,
          is_active: true
        }
      ]

      const { error: variantsError } = await supabase
        .from('variants')
        .insert(variants)

      if (variantsError) throw variantsError

      // Recarregar experimentos
      await loadExperiments()
      
      toast.success('Experimento criado com sucesso!')
      return newExp
    } catch (err) {
      console.error('Erro ao criar experimento:', err)
      toast.error('Erro ao criar experimento')
      throw err
    }
  }, [supabase, loadExperiments])

  // Atualizar experimento
  const updateExperiment = useCallback(async (id: string, updates: Partial<Experiment>) => {
    try {
      const { error } = await supabase
        .from('experiments')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Atualizar localmente
      setExperiments(prev =>
        prev.map(exp =>
          exp.id === id ? { ...exp, ...updates } : exp
        )
      )

      toast.success('Experimento atualizado!')
    } catch (err) {
      console.error('Erro ao atualizar experimento:', err)
      toast.error('Erro ao atualizar experimento')
      throw err
    }
  }, [supabase])

  // Atualizar variante (incluindo URL)
  const updateVariant = useCallback(async (variantId: string, updates: Partial<Variant>) => {
    try {
      const { error } = await supabase
        .from('variants')
        .update(updates)
        .eq('id', variantId)

      if (error) throw error

      // Atualizar localmente
      setExperiments(prev =>
        prev.map(exp => ({
          ...exp,
          variants: exp.variants?.map(variant =>
            variant.id === variantId ? { ...variant, ...updates } : variant
          )
        }))
      )

      toast.success('Variante atualizada!')
    } catch (err) {
      console.error('Erro ao atualizar variante:', err)
      toast.error('Erro ao atualizar variante')
      throw err
    }
  }, [supabase])

  // Atualizar múltiplas variantes de uma vez
  const updateVariants = useCallback(async (experimentId: string, variants: Partial<Variant>[]) => {
    try {
      // Atualizar cada variante individualmente
      const updatePromises = variants.map(variant => {
        if (variant.id) {
          return supabase
            .from('variants')
            .update({
              name: variant.name,
              description: variant.description,
              redirect_url: variant.redirect_url,
              traffic_percentage: variant.traffic_percentage,
              changes: variant.changes,
              css_changes: variant.css_changes,
              js_changes: variant.js_changes,
              is_active: variant.is_active
            })
            .eq('id', variant.id)
        }
        return Promise.resolve()
      })

      await Promise.all(updatePromises)

      // Recarregar experimentos para garantir sincronização
      await loadExperiments()

      toast.success('Variantes atualizadas!')
    } catch (err) {
      console.error('Erro ao atualizar variantes:', err)
      toast.error('Erro ao atualizar variantes')
      throw err
    }
  }, [supabase, loadExperiments])

  // Iniciar experimento
  const startExperiment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({ 
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      await loadExperiments()
      toast.success('Experimento iniciado!')
    } catch (err) {
      console.error('Erro ao iniciar experimento:', err)
      toast.error('Erro ao iniciar experimento')
      throw err
    }
  }, [supabase, loadExperiments])

  // Pausar experimento
  const pauseExperiment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({ status: 'paused' })
        .eq('id', id)

      if (error) throw error

      await loadExperiments()
      toast.success('Experimento pausado!')
    } catch (err) {
      console.error('Erro ao pausar experimento:', err)
      toast.error('Erro ao pausar experimento')
      throw err
    }
  }, [supabase, loadExperiments])

  // Finalizar experimento
  const completeExperiment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      await loadExperiments()
      toast.success('Experimento finalizado!')
    } catch (err) {
      console.error('Erro ao finalizar experimento:', err)
      toast.error('Erro ao finalizar experimento')
      throw err
    }
  }, [supabase, loadExperiments])

  // Deletar experimento
  const deleteExperiment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', id)

      if (error) throw error

      setExperiments(prev => prev.filter(exp => exp.id !== id))
      toast.success('Experimento deletado!')
    } catch (err) {
      console.error('Erro ao deletar experimento:', err)
      toast.error('Erro ao deletar experimento')
      throw err
    }
  }, [supabase])

  // Duplicar experimento
  const duplicateExperiment = useCallback(async (id: string) => {
    try {
      const original = experiments.find(exp => exp.id === id)
      if (!original) throw new Error('Experimento não encontrado')

      // Criar cópia
      const { data: newExp, error: insertError } = await supabase
        .from('experiments')
        .insert({
          name: `${original.name} (Cópia)`,
          description: original.description,
          project_id: original.project_id,
          algorithm: original.algorithm,
          traffic_allocation: safeTrafficAllocation(original.traffic_allocation, 100),
          status: 'draft'
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Copiar variantes
      if (original.variants) {
        const newVariants = original.variants.map((v: any) => ({
          experiment_id: newExp.id,
          name: v.name,
          description: v.description,
          is_control: v.is_control,
          traffic_percentage: v.traffic_percentage,
          redirect_url: v.redirect_url,
          changes: v.changes,
          css_changes: v.css_changes,
          js_changes: v.js_changes,
          visitors: 0,
          conversions: 0,
          conversion_rate: 0.0000,
          is_active: true
        }))

        const { error: variantsError } = await supabase
          .from('variants')
          .insert(newVariants)

        if (variantsError) throw variantsError
      }

      await loadExperiments()
      toast.success('Experimento duplicado!')
      return newExp
    } catch (err) {
      console.error('Erro ao duplicar experimento:', err)
      toast.error('Erro ao duplicar experimento')
      throw err
    }
  }, [experiments, supabase, loadExperiments])

  // Stats
  const stats = useMemo(() => {
    const total = experiments.length
    const running = experiments.filter(exp => exp.status === 'running').length
    const draft = experiments.filter(exp => exp.status === 'draft').length
    const completed = experiments.filter(exp => exp.status === 'completed').length
    const paused = experiments.filter(exp => exp.status === 'paused').length

    return { total, running, draft, completed, paused }
  }, [experiments])

  // Atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<ExperimentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Atualizar ordenação
  const updateSort = useCallback((newSort: Partial<ExperimentSort>) => {
    setSort(prev => ({ ...prev, ...newSort }))
  }, [])

  // Carregar experimentos na montagem e quando filtros mudam
  useEffect(() => {
    loadExperiments()
  }, [loadExperiments])

  return {
    experiments,
    loading,
    error,
    stats,
    filters,
    sort,
    updateFilters,
    updateSort,
    createExperiment,
    updateExperiment,
    updateVariant,
    updateVariants,
    deleteExperiment,
    duplicateExperiment,
    startExperiment,
    pauseExperiment,
    completeExperiment,
    refetch: loadExperiments
  }
}
