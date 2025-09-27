import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Tables } from '@/types/supabase'

type Task = Tables<'tasks'>
type TaskStatus = Tables<'task_statuses'>
type TaskPriority = Tables<'task_priorities'>
type TaskComment = Tables<'task_comments'>

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [statuses, setStatuses] = useState<TaskStatus[]>([])
  const [priorities, setPriorities] = useState<TaskPriority[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Carregar tarefas
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setTasks([])
        return
      }

      // Buscar organização atual do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('default_org_id')
        .eq('id', user.id)
        .single()

      if (!userData?.default_org_id) {
        setTasks([])
        return
      }

      // Construir query base
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('org_id', userData.default_org_id)

      // Filtrar por projeto se especificado
      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })

      if (error) throw error

      setTasks(data || [])
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err)
      setError(err instanceof Error ? err.message : 'Falha ao carregar tarefas')
      toast.error('Erro ao carregar tarefas')
    } finally {
      setLoading(false)
    }
  }, [supabase, projectId])

  // Carregar status e prioridades
  const loadLookups = useCallback(async () => {
    try {
      const [statusesResult, prioritiesResult] = await Promise.all([
        supabase
          .from('task_statuses')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('task_priorities')
          .select('*')
          .order('sort_order', { ascending: true })
      ])

      if (statusesResult.error) throw statusesResult.error
      if (prioritiesResult.error) throw prioritiesResult.error

      setStatuses(statusesResult.data || [])
      setPriorities(prioritiesResult.data || [])
    } catch (err) {
      console.error('Erro ao carregar lookups:', err)
    }
  }, [supabase])

  // Criar nova tarefa
  const createTask = useCallback(async (data: {
    title: string
    description?: string
    project_id: string
    status?: string
    priority?: string
    assignee_id?: string
    due_date?: string
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

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          title: data.title.trim(),
          description: data.description?.trim(),
          project_id: data.project_id,
          status: data.status || 'backlog',
          priority: data.priority || 'medium',
          assignee_id: data.assignee_id || null,
          due_date: data.due_date || null,
          org_id: userData.default_org_id,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      await loadTasks()
      toast.success('Tarefa criada com sucesso!')
      return newTask
    } catch (err) {
      console.error('Erro ao criar tarefa:', err)
      toast.error('Erro ao criar tarefa')
      throw err
    }
  }, [supabase, loadTasks])

  // Atualizar tarefa
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_by: user.id
        })
        .eq('id', id)

      if (error) throw error

      await loadTasks()
      toast.success('Tarefa atualizada!')
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err)
      toast.error('Erro ao atualizar tarefa')
      throw err
    }
  }, [supabase, loadTasks])

  // Deletar tarefa
  const deleteTask = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTasks(prev => prev.filter(task => task.id !== id))
      toast.success('Tarefa deletada!')
    } catch (err) {
      console.error('Erro ao deletar tarefa:', err)
      toast.error('Erro ao deletar tarefa')
      throw err
    }
  }, [supabase])

  // Completar tarefa
  const completeTask = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', id)

      if (error) throw error

      await loadTasks()
      toast.success('Tarefa completada!')
    } catch (err) {
      console.error('Erro ao completar tarefa:', err)
      toast.error('Erro ao completar tarefa')
      throw err
    }
  }, [supabase, loadTasks])

  // Reabrir tarefa
  const reopenTask = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'in_progress',
          completed_at: null,
          updated_by: user.id
        })
        .eq('id', id)

      if (error) throw error

      await loadTasks()
      toast.success('Tarefa reaberta!')
    } catch (err) {
      console.error('Erro ao reabrir tarefa:', err)
      toast.error('Erro ao reabrir tarefa')
      throw err
    }
  }, [supabase, loadTasks])

  // Stats
  const stats = {
    total: tasks.length,
    backlog: tasks.filter(t => t.status === 'backlog').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length
  }

  // Carregar dados na montagem
  useEffect(() => {
    loadTasks()
    loadLookups()
  }, [loadTasks, loadLookups])

  return {
    tasks,
    statuses,
    priorities,
    loading,
    error,
    stats,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    reopenTask,
    refetch: loadTasks
  }
}

// Hook para comentários de tarefas
export function useTaskComments(taskId: string) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadComments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('task_id', taskId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error

      setComments(data || [])
    } catch (err) {
      console.error('Erro ao carregar comentários:', err)
      setError(err instanceof Error ? err.message : 'Falha ao carregar comentários')
    } finally {
      setLoading(false)
    }
  }, [supabase, taskId])

  const addComment = useCallback(async (content: string) => {
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

      const { data: newComment, error } = await supabase
        .from('task_comments')
        .insert({
          content: content.trim(),
          task_id: taskId,
          org_id: userData.default_org_id,
          author_id: user.id
        })
        .select(`
          *,
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      setComments(prev => [...prev, newComment])
      toast.success('Comentário adicionado!')
      return newComment
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err)
      toast.error('Erro ao adicionar comentário')
      throw err
    }
  }, [supabase, taskId])

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('task_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('author_id', user.id) // Só o autor pode deletar

      if (error) throw error

      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Comentário removido!')
    } catch (err) {
      console.error('Erro ao remover comentário:', err)
      toast.error('Erro ao remover comentário')
      throw err
    }
  }, [supabase])

  useEffect(() => {
    if (taskId) {
      loadComments()
    }
  }, [loadComments, taskId])

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    refetch: loadComments
  }
}
