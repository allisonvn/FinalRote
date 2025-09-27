'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@/types/supabase'

type Organization = Tables<'organizations'>
type OrganizationMember = Tables<'organization_members'>

interface AuthUser extends User {
  profile?: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    default_org_id: string | null
  }
  organizations?: Array<{
    organization: Organization
    membership: OrganizationMember
  }>
  currentOrg?: Organization | null
}

interface AuthContext {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  switchOrganization: (orgId: string) => Promise<void>
  createOrganization: (name: string, slug: string) => Promise<string>
}

const AuthContext = createContext<AuthContext | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  // Carregar perfil e organizações do usuário
  const loadUserProfile = async (authUser: User): Promise<AuthUser> => {
    try {
      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      // Buscar organizações do usuário
      const { data: memberships } = await supabase
        .from('organization_members')
        .select(`
          *,
          organizations (*)
        `)
        .eq('user_id', authUser.id)

      const organizations = memberships?.map(m => ({
        organization: m.organizations,
        membership: m
      })) || []

      // Determinar organização atual
      const currentOrg = organizations.find(
        org => org.organization.id === profile?.default_org_id
      )?.organization || organizations[0]?.organization || null

      return {
        ...authUser,
        profile,
        organizations,
        currentOrg
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      return authUser as AuthUser
    }
  }

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Auth error:', error)
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (session?.user && mounted) {
          const userWithProfile = await loadUserProfile(session.user)
          setUser(userWithProfile)
        }
        
        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Session error:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      try {
        if (session?.user) {
          const userWithProfile = await loadUserProfile(session.user)
          setUser(userWithProfile)
        } else {
          setUser(null)
        }
        setLoading(false)
      } catch (error) {
        console.error('Auth state change error:', error)
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signIn = async (email: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })
      setLoading(false)
      return { error }
    } catch (error) {
      setLoading(false)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
    setLoading(false)
  }

  const switchOrganization = async (orgId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.rpc('switch_organization', {
        new_org_id: orgId
      })

      if (error) throw error

      // Atualizar estado local
      const newOrg = user.organizations?.find(
        org => org.organization.id === orgId
      )?.organization

      if (newOrg) {
        setUser({
          ...user,
          currentOrg: newOrg,
          profile: {
            ...user.profile!,
            default_org_id: orgId
          }
        })
      }
    } catch (error) {
      console.error('Erro ao trocar organização:', error)
      throw error
    }
  }

  const createOrganization = async (name: string, slug: string): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      const { data, error } = await supabase.rpc('create_organization', {
        name: name.trim(),
        slug: slug.trim()
      })

      if (error) throw error

      // Recarregar perfil do usuário para incluir nova organização
      const updatedUser = await loadUserProfile(user)
      setUser(updatedUser)

      return data
    } catch (error) {
      console.error('Erro ao criar organização:', error)
      throw error
    }
  }

  const value: AuthContext = {
    user,
    loading,
    signIn,
    signOut,
    switchOrganization,
    createOrganization,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}