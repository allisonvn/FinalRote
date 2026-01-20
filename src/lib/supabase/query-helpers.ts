/**
 * Supabase Query Helpers
 * @description Utilitários para queries seguras com tratamento de RLS
 */

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js'

interface QueryResult<T> {
  data: T | null
  error: PostgrestError | null
  isRLSBlock: boolean
  isEmpty: boolean
}

/**
 * Wrapper que distingue entre "sem dados" e "acesso negado por RLS"
 */
export async function queryWithRLSCheck<T>(
  supabase: SupabaseClient,
  tableName: string,
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<QueryResult<T>> {
  const result = await queryFn()

  if (result.error) {
    return {
      data: null,
      error: result.error,
      isRLSBlock: result.error.code === '42501', // permission denied
      isEmpty: false
    }
  }

  // Se retornou vazio, verificar se é RLS ou realmente não há dados
  if (result.data === null || (Array.isArray(result.data) && result.data.length === 0)) {
    return {
      data: result.data,
      error: null,
      isRLSBlock: false, // Não podemos ter certeza sem service role
      isEmpty: true
    }
  }

  return {
    data: result.data,
    error: null,
    isRLSBlock: false,
    isEmpty: false
  }
}

/**
 * Verificar se usuário tem acesso a uma organização específica
 */
export async function checkOrganizationAccess(
  supabase: SupabaseClient,
  organizationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('org_id', organizationId)
    .single()

  return !error && data !== null
}

/**
 * Verificar se usuário tem acesso a um projeto específico
 */
export async function checkProjectAccess(
  supabase: SupabaseClient,
  projectId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single()

  return !error && data !== null
}

/**
 * Wrapper para operações com feedback de erro claro
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options?: {
    onEmpty?: () => T
    throwOnError?: boolean
    errorMessage?: string
  }
): Promise<T> {
  const { data, error } = await queryFn()

  if (error) {
    console.error('[Query Error]', error)

    if (options?.throwOnError) {
      throw new Error(options?.errorMessage || `Database error: ${error.message}`)
    }

    if (options?.onEmpty) {
      return options.onEmpty()
    }

    throw error
  }

  if (data === null || (Array.isArray(data) && data.length === 0)) {
    if (options?.onEmpty) {
      return options.onEmpty()
    }
  }

  return data as T
}

/**
 * Buscar usuário atual com organização padrão
 */
export async function getCurrentUserWithOrg(supabase: SupabaseClient): Promise<{
  user: any | null
  organization: any | null
  error: string | null
}> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return { user: null, organization: null, error: 'Not authenticated' }
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, default_org_id')
      .eq('id', authUser.id)
      .single()

    if (userError || !userData) {
      return { user: authUser, organization: null, error: 'User profile not found' }
    }

    if (!userData.default_org_id) {
      return { user: userData, organization: null, error: 'No default organization' }
    }

    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userData.default_org_id)
      .single()

    return {
      user: userData,
      organization: orgData,
      error: null
    }
  } catch (error) {
    return {
      user: null,
      organization: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Verificar permissões de um membro da organização
 */
export async function checkMemberPermission(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  requiredRoles: string[] = ['owner', 'admin']
): Promise<{
  hasPermission: boolean
  role: string | null
  error: string | null
}> {
  try {
    const { data: member, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single()

    if (error || !member) {
      return { hasPermission: false, role: null, error: 'Not a member of this organization' }
    }

    const hasPermission = requiredRoles.includes(member.role)

    return {
      hasPermission,
      role: member.role,
      error: hasPermission ? null : 'Insufficient permissions'
    }
  } catch (error) {
    return {
      hasPermission: false,
      role: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Executar query com retry automático em caso de erro transiente
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: {
    maxRetries?: number
    retryDelay?: number
    retryOn?: string[] // Códigos de erro para retry
  } = {}
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryOn = ['PGRST301', '08006', '08003'] // Timeout, connection errors
  } = options

  let lastError: PostgrestError | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await queryFn()

    if (!result.error) {
      return result
    }

    lastError = result.error

    // Verificar se deve fazer retry
    if (!retryOn.includes(result.error.code)) {
      return result
    }

    // Aguardar antes do retry (exponential backoff)
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
    }
  }

  return { data: null, error: lastError }
}
