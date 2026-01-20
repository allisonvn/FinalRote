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
  // Estatísticas agregadas do experimento
  total_visitors?: number
  total_conversions?: number
  conversion_rate?: number
  total_revenue?: number
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
          variants:variants(*)
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

      // Carregar métricas para experimentos ativos diretamente de variant_stats
      const experimentsWithMetrics = await Promise.all(
        (data || []).map(async (exp: any) => {
          try {
            // Buscar estatísticas agregadas de variant_stats
            const { data: statsData, error: statsError } = await supabase
              .from('variant_stats')
              .select('visitors, conversions, revenue')
              .eq('experiment_id', exp.id)

            if (statsError) {
              console.error(`Erro ao buscar variant_stats para ${exp.id}:`, statsError)
            }

            if (statsData && statsData.length > 0) {
              // Agregar totais
              const totalVisitors = statsData.reduce((sum, s) => sum + (s.visitors || 0), 0)
              const totalConversions = statsData.reduce((sum, s) => sum + (s.conversions || 0), 0)
              const totalRevenue = statsData.reduce((sum, s) => sum + (s.revenue || 0), 0)
              const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

              return {
                ...exp,
                total_visitors: totalVisitors,
                total_conversions: totalConversions,
                conversion_rate: conversionRate,
                total_revenue: totalRevenue,
                metrics: {
                  visitors: totalVisitors,
                  conversions: totalConversions,
                  conversion_rate: conversionRate,
                  confidence: 0
                }
              }
            }

            // Se não houver stats, retornar com zeros
            return {
              ...exp,
              total_visitors: 0,
              total_conversions: 0,
              conversion_rate: 0,
              total_revenue: 0,
              metrics: {
                visitors: 0,
                conversions: 0,
                conversion_rate: 0,
                confidence: 0
              }
            }
          } catch (error) {
            console.error(`Erro ao buscar métricas do experimento ${exp.id}:`, error)
            return {
              ...exp,
              total_visitors: 0,
              total_conversions: 0,
              conversion_rate: 0,
              total_revenue: 0
            }
          }
        })
      )

      setExperiments(experimentsWithMetrics as Experiment[])
    } catch (err) {
      // Melhorar serialização do erro para logging
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null
        ? JSON.stringify(err, Object.getOwnPropertyNames(err))
        : String(err)
      
      console.error('Erro ao carregar experimentos:', errorMessage, err)
      setError(errorMessage || 'Falha ao carregar experimentos')
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
      
      // Verificar autenticação ANTES de fazer qualquer operação
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ Erro de autenticação:', authError)
        throw new Error('Você precisa estar autenticado para criar um experimento')
      }
      

      // Gerar API key única para o experimento
      const generateApiKey = () => {
        const randomBytes = new Uint8Array(16)
        crypto.getRandomValues(randomBytes)
        const hexString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')
        return `exp_${hexString}`
      }

      const experimentApiKey = generateApiKey()

      // Inserir experimento COM API key, target_url, conversão e tipo
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
          target_url: data.target_url?.trim() || null,  // ✅ Salvar URL da página original
          conversion_url: data.conversion_url?.trim() || null,  // ✅ Salvar URL da página de sucesso
          conversion_value: data.conversion_value || 0,  // ✅ Salvar valor da conversão
          conversion_type: data.conversion_type || 'page_view',  // ✅ Salvar tipo de conversão
          type: 'split_url'  // ✅ CORREÇÃO: Definir tipo como split_url para permitir configuração de URLs
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Erro ao inserir experimento:', insertError)
        throw insertError
      }
      

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
      // ✅ CORREÇÃO: Usar campo config (jsonb) para armazenar dados adicionais
      const variants = [
        { 
          experiment_id: newExp.id, 
          name: 'Controle', 
          description: 'Versão original - URL da página configurada no setup',
          is_control: true,
          traffic_percentage: 50.00,
          is_active: true,
          config: {
            redirect_url: data.target_url?.trim() || null,
            ...conversionConfig
          }
        },
        { 
          experiment_id: newExp.id, 
          name: 'Variante A', 
          description: 'Versão alternativa - configurar URL na próxima etapa',
          is_control: false,
          traffic_percentage: 50.00,
          is_active: true,
          config: {
            redirect_url: null,
            ...conversionConfig
          }
        }
      ]

      // ✅ GARANTIA 100%: Criar variantes COM retry e validação
      
      let createdVariants = null
      let variantsError = null
      let retryCount = 0
      const maxRetries = 3

      // Tentar criar variantes com retry automático
      while (retryCount < maxRetries && !createdVariants) {
        if (retryCount > 0) {
          // Aguardar um pouco antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
        }

        const result = await supabase
          .from('variants')
          .insert(variants)
          .select()

        if (result.error) {
          variantsError = result.error
          console.error(`❌ Tentativa ${retryCount + 1} falhou:`, result.error)
          
          // Se o erro for de permissão RLS, logar detalhes
          if (result.error.message?.includes('policy') || result.error.message?.includes('permission')) {
            console.error('⚠️ Erro de permissão RLS detectado!')
            console.error('📋 Detalhes do erro:', {
              message: result.error.message,
              code: result.error.code,
              hint: result.error.hint
            })
          }
          
          retryCount++
        } else {
          createdVariants = result.data
        }
      }

      // Se ainda assim falhou após todas as tentativas
      if (variantsError && !createdVariants) {
        console.error('❌ FALHA CRÍTICA: Não foi possível criar variantes após', maxRetries, 'tentativas')
        console.error('📋 Último erro:', variantsError)
        
        // Mostrar erro mais detalhado para o usuário
        const errorMessage = variantsError.message?.includes('policy')
          ? 'Erro de permissão ao criar variantes. Verifique suas permissões de acesso.'
          : `Falha ao criar variantes: ${variantsError.message}`
        
        // Limpar o experimento criado
        await supabase.from('experiments').delete().eq('id', newExp.id)
        
        throw new Error(errorMessage)
      }

      // Validação final: garantir que as variantes foram criadas
      if (!createdVariants || createdVariants.length === 0) {
        console.error('❌ ERRO CRÍTICO: Nenhuma variante foi retornada após inserção!')
        
        // Tentar buscar as variantes para confirmar
        const { data: checkVariants } = await supabase
          .from('variants')
          .select('id')
          .eq('experiment_id', newExp.id)
        
        if (checkVariants && checkVariants.length > 0) {
          // As variantes existem, apenas não foram retornadas pelo insert
          createdVariants = checkVariants
        } else {
          console.error('❌ Variantes realmente não foram criadas!')
          // Limpar o experimento
          await supabase.from('experiments').delete().eq('id', newExp.id)
          throw new Error('Erro crítico: Nenhuma variante foi criada para o experimento')
        }
      }


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
      // Separar campos que existem na tabela dos que vão no config
      const { redirect_url, changes, css_changes, js_changes, visitors, conversions, conversion_rate, user_id, ...directFields } = updates
      
      // Preparar update direto (apenas campos que existem)
      const directUpdate: any = {}
      if (directFields.name !== undefined) directUpdate.name = directFields.name
      if (directFields.description !== undefined) directUpdate.description = directFields.description
      if (directFields.is_control !== undefined) directUpdate.is_control = directFields.is_control
      if (directFields.traffic_percentage !== undefined) directUpdate.traffic_percentage = directFields.traffic_percentage
      if (directFields.is_active !== undefined) directUpdate.is_active = directFields.is_active
      
      // Buscar config atual para mesclar
      const { data: currentVariant } = await supabase
        .from('variants')
        .select('config')
        .eq('id', variantId)
        .single()
      
      // Mesclar campos extras no config
      const currentConfig = (currentVariant?.config as any) || {}
      const newConfig: any = { ...currentConfig }
      
      if (redirect_url !== undefined) newConfig.redirect_url = redirect_url
      if (changes !== undefined) newConfig.changes = changes
      if (css_changes !== undefined) newConfig.css_changes = css_changes
      if (js_changes !== undefined) newConfig.js_changes = js_changes
      
      if (Object.keys(newConfig).length > 0) {
        directUpdate.config = newConfig
      }
      
      const { error } = await supabase
        .from('variants')
        .update(directUpdate)
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
          // Separar campos diretos dos que vão no config
          const { redirect_url, changes, css_changes, js_changes, visitors, conversions, conversion_rate, user_id, ...directFields } = variant
          
          // Preparar update direto
          const directUpdate: any = {}
          if (directFields.name !== undefined) directUpdate.name = directFields.name
          if (directFields.description !== undefined) directUpdate.description = directFields.description
          if (directFields.traffic_percentage !== undefined) directUpdate.traffic_percentage = directFields.traffic_percentage
          if (directFields.is_active !== undefined) directUpdate.is_active = directFields.is_active
          
          // Mesclar campos extras no config
          const newConfig: any = {}
          if (redirect_url !== undefined) newConfig.redirect_url = redirect_url
          if (changes !== undefined) newConfig.changes = changes
          if (css_changes !== undefined) newConfig.css_changes = css_changes
          if (js_changes !== undefined) newConfig.js_changes = js_changes
          
          if (Object.keys(newConfig).length > 0) {
            directUpdate.config = newConfig
          }
          
          return supabase
            .from('variants')
            .update(directUpdate)
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
          is_active: v.is_active ?? true,
          config: v.config || {
            redirect_url: v.redirect_url || null,
            changes: v.changes || {},
            css_changes: v.css_changes || null,
            js_changes: v.js_changes || null
          }
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
