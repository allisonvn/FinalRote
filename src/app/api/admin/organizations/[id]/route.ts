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

// GET /api/admin/organizations/[id] - Obter detalhes de uma organização
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const hasAdminAccess = await isAdmin(supabase, user.id)
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar organização
    const { data: org, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (error) throw error

    // Buscar membros
    const { data: members } = await supabase
      .from('organization_members')
      .select(`
        role,
        created_at,
        user:profiles (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('organization_id', orgId)

    // Buscar projetos
    const { data: projects, count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)

    // Contar experimentos
    let experimentsCount = 0
    if (projects && projects.length > 0) {
      const { count } = await supabase
        .from('experiments')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projects.map(p => p.id))
      experimentsCount = count || 0
    }

    return NextResponse.json({
      organization: {
        ...org,
        members: members?.map((m: any) => ({
          ...m.user,
          role: m.role,
          joined_at: m.created_at
        })) || [],
        projects: projects || [],
        stats: {
          members_count: members?.length || 0,
          projects_count: projectsCount || 0,
          experiments_count: experimentsCount
        }
      }
    })
  } catch (error: any) {
    console.error('Erro ao obter organização:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/organizations/[id] - Atualizar organização
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params
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
    const {
      name,
      slug,
      subscription_status,
      subscription_plan,
      subscription_expires_at,
      is_blocked
    } = body

    // Verificar se slug já está em uso por outra org
    if (slug) {
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .neq('id', orgId)
        .single()

      if (existingOrg) {
        return NextResponse.json(
          { error: 'Slug já está em uso' },
          { status: 400 }
        )
      }
    }

    const update: Record<string, any> = {}
    if (name !== undefined) update.name = name
    if (slug !== undefined) update.slug = slug
    if (subscription_status !== undefined) {
      update.subscription_status = subscription_status
      if (subscription_status === 'canceled') {
        update.subscription_canceled_at = new Date().toISOString()
      }
    }
    if (subscription_plan !== undefined) update.subscription_plan = subscription_plan
    if (subscription_expires_at !== undefined) update.subscription_expires_at = subscription_expires_at
    if (is_blocked !== undefined) update.is_blocked = is_blocked

    const { createServiceClient } = await import('@/lib/supabase/server')
    const adminSupabase = createServiceClient()

    const { error } = await adminSupabase
      .from('organizations')
      .update(update)
      .eq('id', orgId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao atualizar organização:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/organizations/[id] - Deletar organização
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const hasAdminAccess = await isAdmin(supabase, user.id)
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { createServiceClient } = await import('@/lib/supabase/server')
    const adminSupabase = createServiceClient()

    // Buscar projetos da organização
    const { data: projects } = await adminSupabase
      .from('projects')
      .select('id')
      .eq('organization_id', orgId)

    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id)

      // Deletar experimentos dos projetos
      await adminSupabase
        .from('experiments')
        .delete()
        .in('project_id', projectIds)

      // Deletar projetos
      await adminSupabase
        .from('projects')
        .delete()
        .eq('organization_id', orgId)
    }

    // Remover membros
    await adminSupabase
      .from('organization_members')
      .delete()
      .eq('organization_id', orgId)

    // Atualizar default_org_id dos usuários que tinham essa org
    await adminSupabase
      .from('profiles')
      .update({ default_org_id: null })
      .eq('default_org_id', orgId)

    // Deletar organização
    const { error } = await adminSupabase
      .from('organizations')
      .delete()
      .eq('id', orgId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao deletar organização:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
