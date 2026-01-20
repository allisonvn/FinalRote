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

// GET /api/admin/organizations - Listar todas as organizações
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
      .from('organizations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('subscription_status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    const { data: organizations, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      organizations,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao listar organizações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/admin/organizations - Criar nova organização
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
    const { name, slug, owner_email, subscription_status = 'trialing', subscription_plan = null } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se slug já existe
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Slug já está em uso' },
        { status: 400 }
      )
    }

    const { createServiceClient } = await import('@/lib/supabase/server')
    const adminSupabase = createServiceClient()

    // Criar organização
    const { data: org, error: orgError } = await adminSupabase
      .from('organizations')
      .insert({
        name,
        slug,
        subscription_status,
        subscription_plan,
        subscription_started_at: subscription_status !== 'inactive' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (orgError) throw orgError

    // Se owner_email fornecido, buscar usuário e adicionar como owner
    if (owner_email) {
      const { data: ownerProfile } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('email', owner_email)
        .single()

      if (ownerProfile) {
        await adminSupabase
          .from('organization_members')
          .insert({
            organization_id: org.id,
            user_id: ownerProfile.id,
            role: 'owner'
          })

        // Atualizar default_org_id do usuário se não tiver
        await adminSupabase
          .from('profiles')
          .update({ default_org_id: org.id })
          .eq('id', ownerProfile.id)
          .is('default_org_id', null)
      }
    }

    return NextResponse.json({
      success: true,
      organization: org
    })
  } catch (error: any) {
    console.error('Erro ao criar organização:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
