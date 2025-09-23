import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validar dados obrigatórios
    if (!data.name || !data.project_id) {
      return NextResponse.json(
        { error: 'Nome e project_id são obrigatórios' },
        { status: 400 }
      )
    }

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

    // Construir dados do experimento
    const experimentData = {
      name: String(data.name).trim(),
      project_id: String(data.project_id),
      description: data.description || null,
      type: data.type || 'redirect',
      status: data.status || 'draft',
      traffic_allocation: data.traffic_allocation || 100,
      created_by: user.id,
      user_id: user.id
    }

    // Validar nome
    if (!experimentData.name || experimentData.name.length < 2) {
      return NextResponse.json(
        { error: 'Nome do experimento deve ter pelo menos 2 caracteres' },
        { status: 400 }
      )
    }

    // Criar experimento
    const { data: newExperiment, error: insertError } = await serviceClient
      .from('experiments')
      .insert(experimentData)
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar experimento:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar experimento: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      experiment: newExperiment
    })

  } catch (error) {
    console.error('Erro geral na criação de experimento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
