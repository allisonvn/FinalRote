import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const experimentId = params.id

    // Verificar autenticação do usuário
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Buscar experimento com variantes
    const { data: experiment, error: fetchError } = await supabase
      .from('experiments')
      .select(`
        id,
        name,
        description,
        status,
        traffic_percentage,
        start_date,
        end_date,
        created_at,
        updated_at,
        project_id,
        user_id,
        variants(
          id,
          name,
          description,
          is_control,
          traffic_percentage,
          redirect_url,
          changes,
          css_changes,
          js_changes,
          visitors,
          conversions,
          conversion_rate,
          is_active,
          created_at
        )
      `)
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
      .select(`
        id,
        created_by,
        org_id,
        organization_members(
          user_id,
          role
        )
      `)
      .eq('id', experiment.project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar acesso: user_id direto, created_by do projeto, ou membro da organização
    const hasAccess = 
      experiment.user_id === user.id ||
      project.created_by === user.id ||
      project.organization_members.some((member: any) => 
        member.user_id === user.id && ['owner', 'admin', 'member'].includes(member.role)
      )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      experiment: experiment
    })

  } catch (error) {
    console.error('Erro ao buscar experimento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const experimentId = params.id
    const data = await request.json()

    // Verificar autenticação do usuário
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o experimento pertence ao usuário através do projeto
    const { data: experiment, error: fetchError } = await supabase
      .from('experiments')
      .select(`
        id, 
        user_id, 
        project_id,
        projects(
          id,
          created_by,
          org_id,
          organization_members(
            user_id,
            role
          )
        )
      `)
      .eq('id', experimentId)
      .single()

    if (fetchError || !experiment) {
      return NextResponse.json(
        { error: 'Experimento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem acesso ao experimento
    const hasAccess = experiment.user_id === user.id || 
                     experiment.projects?.created_by === user.id ||
                     experiment.projects?.organization_members?.some((member: any) => 
                       member.user_id === user.id && 
                       ['owner', 'admin', 'member'].includes(member.role)
                     )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Atualizar experimento usando o client do usuário autenticado
    const { data: updatedExperiment, error: updateError } = await supabase
      .from('experiments')
      .update(data)
      .eq('id', experimentId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar experimento:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar experimento: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      experiment: updatedExperiment
    })

  } catch (error) {
    console.error('Erro geral na atualização de experimento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const experimentId = params.id

    // Verificar autenticação do usuário
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o experimento pertence ao usuário através do projeto
    const { data: experiment, error: fetchError } = await supabase
      .from('experiments')
      .select(`
        id, 
        user_id, 
        project_id,
        projects(
          id,
          created_by,
          org_id,
          organization_members(
            user_id,
            role
          )
        )
      `)
      .eq('id', experimentId)
      .single()

    if (fetchError || !experiment) {
      return NextResponse.json(
        { error: 'Experimento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem acesso ao experimento
    const hasAccess = experiment.user_id === user.id || 
                     experiment.projects?.created_by === user.id ||
                     experiment.projects?.organization_members?.some((member: any) => 
                       member.user_id === user.id && 
                       ['owner', 'admin', 'member'].includes(member.role)
                     )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Remover dependências primeiro (ordem segura)
    const tables = [
      { name: 'assignments', col: 'experiment_id' },
      { name: 'events', col: 'experiment_id' },
      { name: 'goals', col: 'experiment_id' },
      { name: 'metrics_snapshots', col: 'experiment_id' },
      { name: 'variants', col: 'experiment_id' },
    ]

    for (const t of tables) {
      const { error } = await supabase.from(t.name).delete().eq(t.col, experimentId)
      if (error) {
        console.error(`Erro ao deletar ${t.name}:`, error)
        return NextResponse.json(
          { error: `Erro ao deletar ${t.name}: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // Por fim deletar o experimento
    const { error: expDeleteError } = await supabase
      .from('experiments')
      .delete()
      .eq('id', experimentId)

    if (expDeleteError) {
      console.error('Erro ao deletar experimento:', expDeleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar experimento: ' + expDeleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Erro geral na exclusão de experimento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
