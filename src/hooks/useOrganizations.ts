import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Tables } from '@/types/supabase'

type Organization = Tables<'organizations'>
type OrganizationMember = Tables<'organization_members'>
type User = Tables<'users'>

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Carregar organizações do usuário
  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setOrganizations([])
        setCurrentOrg(null)
        setMembers([])
        return
      }

      // Buscar organizações onde o usuário é membro
      const { data: orgData, error: orgError } = await supabase
        .from('organization_members')
        .select(`
          *,
          organizations (
            id,
            name,
            slug,
            plan,
            metadata,
            is_active,
            created_at,
            created_by
          )
        `)
        .eq('user_id', user.id)

      if (orgError) throw orgError

      const userOrgs = orgData?.map(member => member.organizations).filter(Boolean) as Organization[]
      setOrganizations(userOrgs || [])

      // Buscar organização padrão do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('default_org_id')
        .eq('id', user.id)
        .single()

      const defaultOrg = userOrgs?.find(org => org.id === userData?.default_org_id)
      setCurrentOrg(defaultOrg || userOrgs?.[0] || null)

      // Carregar membros da organização atual
      if (defaultOrg || userOrgs?.[0]) {
        await loadMembers(defaultOrg?.id || userOrgs?.[0]?.id)
      }

    } catch (err) {
      console.error('Erro ao carregar organizações:', err)
      setError(err instanceof Error ? err.message : 'Falha ao carregar organizações')
      toast.error('Erro ao carregar organizações')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Carregar membros de uma organização
  const loadMembers = useCallback(async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('org_id', orgId)
        .order('joined_at', { ascending: false })

      if (error) throw error

      setMembers(data || [])
    } catch (err) {
      console.error('Erro ao carregar membros:', err)
      toast.error('Erro ao carregar membros')
    }
  }, [supabase])

  // Criar nova organização
  const createOrganization = useCallback(async (name: string, slug: string) => {
    try {
      const { data, error } = await supabase.rpc('create_organization', {
        name: name.trim(),
        slug: slug.trim()
      })

      if (error) throw error

      await loadOrganizations()
      toast.success('Organização criada com sucesso!')
      return data
    } catch (err) {
      console.error('Erro ao criar organização:', err)
      toast.error('Erro ao criar organização')
      throw err
    }
  }, [supabase, loadOrganizations])

  // Trocar organização atual
  const switchOrganization = useCallback(async (orgId: string) => {
    try {
      const { error } = await supabase.rpc('switch_organization', {
        new_org_id: orgId
      })

      if (error) throw error

      const newOrg = organizations.find(org => org.id === orgId)
      setCurrentOrg(newOrg || null)
      
      if (newOrg) {
        await loadMembers(orgId)
      }

      toast.success('Organização alterada!')
    } catch (err) {
      console.error('Erro ao trocar organização:', err)
      toast.error('Erro ao trocar organização')
      throw err
    }
  }, [supabase, organizations, loadMembers])

  // Adicionar membro à organização
  const addMember = useCallback(async (email: string, role: string) => {
    if (!currentOrg) return

    try {
      // Primeiro, buscar o usuário pelo email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (userError || !userData) {
        throw new Error('Usuário não encontrado')
      }

      const { error } = await supabase.rpc('add_user_to_org', {
        target_org: currentOrg.id,
        target_user: userData.id,
        target_role: role
      })

      if (error) throw error

      await loadMembers(currentOrg.id)
      toast.success('Membro adicionado com sucesso!')
    } catch (err) {
      console.error('Erro ao adicionar membro:', err)
      toast.error('Erro ao adicionar membro')
      throw err
    }
  }, [supabase, currentOrg, loadMembers])

  // Remover membro da organização
  const removeMember = useCallback(async (userId: string) => {
    if (!currentOrg) return

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('org_id', currentOrg.id)
        .eq('user_id', userId)

      if (error) throw error

      await loadMembers(currentOrg.id)
      toast.success('Membro removido!')
    } catch (err) {
      console.error('Erro ao remover membro:', err)
      toast.error('Erro ao remover membro')
      throw err
    }
  }, [supabase, currentOrg, loadMembers])

  // Atualizar papel do membro
  const updateMemberRole = useCallback(async (userId: string, newRole: string) => {
    if (!currentOrg) return

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('org_id', currentOrg.id)
        .eq('user_id', userId)

      if (error) throw error

      await loadMembers(currentOrg.id)
      toast.success('Papel atualizado!')
    } catch (err) {
      console.error('Erro ao atualizar papel:', err)
      toast.error('Erro ao atualizar papel')
      throw err
    }
  }, [supabase, currentOrg, loadMembers])

  // Carregar dados na montagem
  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  return {
    organizations,
    currentOrg,
    members,
    loading,
    error,
    createOrganization,
    switchOrganization,
    addMember,
    removeMember,
    updateMemberRole,
    refetch: loadOrganizations
  }
}
