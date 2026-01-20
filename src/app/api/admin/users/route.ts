import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Lista de emails de administradores do sistema
const ADMIN_EMAILS = [
  'admin@rotafinal.com',
  'suporte@rotafinal.com',
]

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  try {
    // Verificar por email
    const { data: user } = await supabase.auth.getUser()
    if (user?.user?.email && ADMIN_EMAILS.includes(user.user.email)) {
      return true
    }

    // Verificar metadata
    if (user?.user?.user_metadata?.is_super_admin === true) {
      return true
    }

    // Verificar tabela de admins
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

// GET /api/admin/users - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const hasAdminAccess = await isAdmin(supabase, user.id)
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status === 'blocked') {
      query = query.eq('is_blocked', true)
    } else if (status === 'active') {
      query = query.eq('is_blocked', false)
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    const { data: users, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
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
    const { email, full_name, password, send_invite } = body

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    // Usar service role para criar usuário
    const { createServiceClient } = await import('@/lib/supabase/server')
    const adminSupabase = createServiceClient()

    // Criar usuário no Auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: password || undefined,
      email_confirm: !send_invite,
      user_metadata: { full_name }
    })

    if (authError) throw authError

    // Criar perfil na tabela profiles
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name,
        is_blocked: false
      })

    if (profileError) throw profileError

    // Se send_invite, enviar email de convite
    if (send_invite && !password) {
      await adminSupabase.auth.admin.inviteUserByEmail(email)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        full_name
      }
    })
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
