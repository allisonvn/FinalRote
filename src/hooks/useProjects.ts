import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Project = {
  id: string
  organization_id: string
  name: string
  description?: string
  public_key?: string
  secret_key?: string
  allowed_origins?: string[]
  created_at: string
  updated_at?: string
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)

  const supabase = createClient()

  // Carregar projetos do usuário
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (queryError) {
        throw queryError
      }

      setProjects(data || [])

      // Se não há projeto atual selecionado, selecionar o primeiro
      if (!currentProject && data && data.length > 0) {
        setCurrentProject(data[0])
      }
    } catch (err) {
      console.error('Erro ao carregar projetos:', err)
      setError(err instanceof Error ? err.message : 'Falha ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }, [supabase, currentProject])

  // Criar novo projeto
  const createProject = useCallback(async (data: {
    name: string
    description?: string
  }) => {
    try {
      // Gerar chaves API
      const publicKey = `pk_live_${generateApiKey()}`
      const secretKey = `sk_live_${generateApiKey()}`

      // Buscar organização do usuário
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Usuário não autenticado')

      // Buscar primeira organização do usuário
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userData.user.id)
        .single()

      if (!memberData) throw new Error('Usuário não pertence a nenhuma organização')

      const { data: newProject, error: insertError } = await supabase
        .from('projects')
        .insert({
          organization_id: memberData.organization_id,
          name: data.name.trim(),
          description: data.description?.trim(),
          public_key: publicKey,
          secret_key: secretKey,
          allowed_origins: ['http://localhost:*', 'https://localhost:*']
        })
        .select()
        .single()

      if (insertError) throw insertError

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
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setProjects(prev =>
        prev.map(proj =>
          proj.id === id ? { ...proj, ...updates } : proj
        )
      )

      // Atualizar projeto atual se for o mesmo
      if (currentProject?.id === id) {
        setCurrentProject(prev => prev ? { ...prev, ...updates } : null)
      }

      toast.success('Projeto atualizado!')
    } catch (err) {
      console.error('Erro ao atualizar projeto:', err)
      toast.error('Erro ao atualizar projeto')
      throw err
    }
  }, [supabase, currentProject])

  // Regenerar chaves API
  const regenerateApiKeys = useCallback(async (id: string) => {
    try {
      const publicKey = `pk_live_${generateApiKey()}`
      const secretKey = `sk_live_${generateApiKey()}`

      await updateProject(id, { public_key: publicKey, secret_key: secretKey })
      toast.success('Chaves API regeneradas!')
    } catch (err) {
      console.error('Erro ao regenerar chaves:', err)
      toast.error('Erro ao regenerar chaves')
      throw err
    }
  }, [updateProject])

  // Deletar projeto
  const deleteProject = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProjects(prev => prev.filter(proj => proj.id !== id))
      
      // Se deletou o projeto atual, selecionar outro
      if (currentProject?.id === id) {
        const remaining = projects.filter(p => p.id !== id)
        setCurrentProject(remaining.length > 0 ? remaining[0] : null)
      }

      toast.success('Projeto deletado!')
    } catch (err) {
      console.error('Erro ao deletar projeto:', err)
      toast.error('Erro ao deletar projeto')
      throw err
    }
  }, [supabase, currentProject, projects])

  // Selecionar projeto atual
  const selectProject = useCallback((project: Project) => {
    setCurrentProject(project)
    // Salvar no localStorage para persistir
    localStorage.setItem('currentProjectId', project.id)
  }, [])

  // Carregar projeto salvo do localStorage
  useEffect(() => {
    const savedProjectId = localStorage.getItem('currentProjectId')
    if (savedProjectId && projects.length > 0) {
      const savedProject = projects.find(p => p.id === savedProjectId)
      if (savedProject) {
        setCurrentProject(savedProject)
      }
    }
  }, [projects])

  // Carregar projetos na montagem
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return {
    projects,
    currentProject,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    regenerateApiKeys,
    selectProject,
    refetch: loadProjects
  }
}

// Função auxiliar para gerar chave API
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = ''
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}
