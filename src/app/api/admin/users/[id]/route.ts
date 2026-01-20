import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Lista de emails de administradores do sistema
const ADMIN_EMAILS = [
  'admin@rotafinal.com',
  'suporte@rotafinal.com',
]

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (user?.user?.email && ADMIN_EMAILS.includes(user.user.email)) {
      return true
    }
    if (user?.user?.user_metadata?.is_super_admin === true) {
      return true
    }
    const { data: adminCheck } = await supabase
      .from('system_admins')
      .select('id')
      .eq('user_id', userId)
      .single()
    return !!adminCheck
  } catch {
    return false
  }
}

// GET /api/admin/users/[id] - Obter detalhes de um usuário
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const hasAdminAccess = await isAdmin(supabase, user.id)
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar perfil
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    // Buscar organizações do usuário
    const { data: memberships } = await supabase
      .from('organization_members')
      .select(`
        role,
        created_at,
        organization:organizations (
          id,
          name,
          slug,
          subscription_status
        )
      `)
      .eq('user_id', userId)

    // Buscar auth user info via service role
    const { createServiceClient } = await import('@/lib/supabase/server')
    const adminSupabase = createServiceClient()
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(userId)

    return NextResponse.json({
      user: {
        ...profile,
        auth: authUser?.user ? {
          last_sign_in_at: authUser.user.last_sign_in_at,
          created_at: authUser.user.created_at,
          email_confirmed_at: authUser.user.email_confirmed_at,
          phone: authUser.user.phone,
          providers: authUser.user.app_metadata?.providers || []
        } : null,
        organizations: memberships?.map((m: any) => ({
          ...m.organization,
          role: m.role,
          joined_at: m.created_at
        })) || []
      }
    })
  } catch (error: any) {
    console.error('Erro ao obter usuário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const hasAdminAccess = await isAdmin(supabase, user.id)
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, phone, is_blocked, email, password } = body

    // Atualizar perfil
    const profileUpdate: Record<string, any> = {}
    if (full_name !== undefined) profileUpdate.full_name = full_name
    if (phone !== undefined) profileUpdate.phone = phone
    if (is_blocked !== undefined) profileUpdate.is_blocked = is_blocked

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId)

      if (profileError) throw profileError
    }

    // Atualizar auth user se necessário
    const { createServiceClient } = await import('@/lib/supabase/server')
    const adminSupabase = createServiceClient()

    const authUpdate: Record<string, any> = {}
    if (email) authUpdate.email = email
    if (password) authUpdate.password = password
    if (is_blocked !== undefined) authUpdate.ban_duration = is_blocked ? 'none' : undefined

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await adminSupabase.auth.admin.updateUserById(
        userId,
        authUpdate
      )

      if (authError) throw authError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const hasAdminAccess = await isAdmin(supabase, user.id)
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Não permitir deletar a si mesmo
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Você não pode deletar sua própria conta' },
        { status: 400 }
      )
    }

    const { createServiceClient } = await import('@/lib/supabase/server')
    const adminSupabase = createServiceClient()

    // Remover memberships primeiro
    await adminSupabase
      .from('organization_members')
      .delete()
      .eq('user_id', userId)

    // Deletar perfil
    await adminSupabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    // Deletar usuário do Auth
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId)

    if (authError) throw authError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
