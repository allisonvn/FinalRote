import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

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

    // Usar service client para contornar RLS
    const serviceClient = createServiceClient()

    // Atualizar experimento
    const { data: updatedExperiment, error: updateError } = await serviceClient
      .from('experiments')
      .update(data)
      .eq('id', experimentId)
      .eq('created_by', user.id) // Garantir que só o criador pode atualizar
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

    // Usar service client para contornar RLS
    const serviceClient = createServiceClient()

    // Deletar experimento
    const { error: deleteError } = await serviceClient
      .from('experiments')
      .delete()
      .eq('id', experimentId)
      .eq('created_by', user.id) // Garantir que só o criador pode deletar

    if (deleteError) {
      console.error('Erro ao deletar experimento:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar experimento: ' + deleteError.message },
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
