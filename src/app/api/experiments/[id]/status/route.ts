import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const experimentId = params.id
    const { status } = await request.json()
    
    // Validar status
    const validStatuses = ['draft', 'running', 'paused', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o experimento existe
    const { data: experiment, error: fetchError } = await supabase
      .from('experiments')
      .select('id, status, project_id, user_id')
      .eq('id', experimentId)
      .single()

    if (fetchError || !experiment) {
      return NextResponse.json(
        { error: 'Experimento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem acesso ao experimento
    // Verificação direta: user_id do experimento ou acesso via projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, created_by, org_id')
      .eq('id', experiment.project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário é membro da organização do projeto
    const { data: orgMember, error: orgMemberError } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('org_id', project.org_id)
      .eq('user_id', user.id)
      .single()

    // Verificar acesso: user_id direto, created_by do projeto, ou membro da organização
    const hasAccess = 
      experiment.user_id === user.id ||
      project.created_by === user.id ||
      (orgMember && ['owner', 'admin', 'member'].includes(orgMember.role))

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Atualizar status do experimento
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    }

    // Se está ativando o experimento, definir started_at
    if (status === 'running' && experiment.status !== 'running') {
      updateData.started_at = new Date().toISOString()
    }

    // Se está pausando ou completando, definir ended_at
    if ((status === 'paused' || status === 'completed') && experiment.status === 'running') {
      updateData.ended_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('experiments')
      .update(updateData)
      .eq('id', experimentId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar status do experimento:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar status do experimento' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      experiment: data 
    })

  } catch (error) {
    console.error('Erro geral na atualização de status:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
