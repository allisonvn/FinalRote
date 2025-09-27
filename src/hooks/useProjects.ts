import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Tables } from '@/types/supabase'

type Project = Tables<'projects'>
type ProjectStatus = Tables<'project_statuses'>

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [statuses, setStatuses] = useState<ProjectStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Carregar projetos da organização atual
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProjects([])
        return
      }

      // Buscar organização atual do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('default_org_id')
        .eq('id', user.id)
        .single()

      if (!userData?.default_org_id) {
        setProjects([])
        return
      }

      // Buscar projetos da organização
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('org_id', userData.default_org_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setProjects(data || [])
    } catch (err) {
      console.error('Erro ao carregar projetos:', err)
      setError(err instanceof Error ? err.message : 'Falha ao carregar projetos')
      toast.error('Erro ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Carregar status disponíveis
  const loadStatuses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('project_statuses')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error

      setStatuses(data || [])
    } catch (err) {
      console.error('Erro ao carregar status:', err)
    }
  }, [supabase])

  // Criar novo projeto
  const createProject = useCallback(async (data: {
    name: string
    description?: string
    status?: string
    start_date?: string
    end_date?: string
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Buscar organização atual
      const { data: userData } = await supabase
        .from('users')
        .select('default_org_id')
        .eq('id', user.id)
        .single()

      if (!userData?.default_org_id) {
        throw new Error('Nenhuma organização selecionada')
      }

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name: data.name.trim(),
          description: data.description?.trim(),
          status: data.status || 'draft',
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          org_id: userData.default_org_id,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      await loadProjects()
      toast.success('Projeto criado com sucesso!')
      return newProject
    } catch (err) {
      console.error('Erro ao criar projeto:', err)
      toast.error('Erro ao criar projeto')
      throw err
    }
  }, [supabase, loadProjects])

  // Atualizar projeto
  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_by: user.id
        })
        .eq('id', id)

      if (error) throw error

      await loadProjects()
      toast.success('Projeto atualizado!')
    } catch (err) {
      console.error('Erro ao atualizar projeto:', err)
      toast.error('Erro ao atualizar projeto')
      throw err
    }
  }, [supabase, loadProjects])

  // Deletar projeto
  const deleteProject = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProjects(prev => prev.filter(project => project.id !== id))
      toast.success('Projeto deletado!')
    } catch (err) {
      console.error('Erro ao deletar projeto:', err)
      toast.error('Erro ao deletar projeto')
      throw err
    }
  }, [supabase])

  // Arquivar projeto
  const archiveProject = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('projects')
        .update({
          archived_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', id)

      if (error) throw error

      await loadProjects()
      toast.success('Projeto arquivado!')
    } catch (err) {
      console.error('Erro ao arquivar projeto:', err)
      toast.error('Erro ao arquivar projeto')
      throw err
    }
  }, [supabase, loadProjects])

  // Restaurar projeto
  const restoreProject = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('projects')
        .update({
          archived_at: null,
          updated_by: user.id
        })
        .eq('id', id)

      if (error) throw error

      await loadProjects()
      toast.success('Projeto restaurado!')
    } catch (err) {
      console.error('Erro ao restaurar projeto:', err)
      toast.error('Erro ao restaurar projeto')
      throw err
    }
  }, [supabase, loadProjects])

  // Stats
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    draft: projects.filter(p => p.status === 'draft').length,
    completed: projects.filter(p => p.status === 'completed').length,
    archived: projects.filter(p => p.archived_at !== null).length
  }

  // Carregar dados na montagem
  useEffect(() => {
    loadProjects()
    loadStatuses()
  }, [loadProjects, loadStatuses])

  return {
    projects,
    statuses,
    loading,
    error,
    stats,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    restoreProject,
    refetch: loadProjects
  }
}