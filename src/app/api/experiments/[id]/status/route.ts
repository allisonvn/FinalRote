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

    // Verificar se o experimento pertence ao usuário
    const { data: experiment, error: fetchError } = await supabase
      .from('experiments')
      .select('id, user_id, status')
      .eq('id', experimentId)
      .single()

    if (fetchError || !experiment) {
      return NextResponse.json(
        { error: 'Experimento não encontrado' },
        { status: 404 }
      )
    }

    if (experiment.user_id !== user.id) {
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
