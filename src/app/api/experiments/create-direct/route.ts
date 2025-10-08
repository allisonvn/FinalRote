import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { safeTrafficAllocation } from '@/lib/numeric-utils'

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

    // Usar client do usuário autenticado para respeitar RLS
    const userClient = supabase

    // Usar SQL direto para inserir o experimento, contornando completamente o cache do Supabase
    const experimentName = String(data.name).trim()
    const projectId = String(data.project_id)
    const description = data.description || null
    const experimentType = data.type || 'redirect'
    const status = data.status || 'draft'
    const trafficAllocation = safeTrafficAllocation(data.traffic_allocation, 100)
    const createdBy = user.id
    const userId = user.id
    
    // Processar novos campos
    const algorithm = data.algorithm || 'uniform'
    const targetUrl = data.target_url || null
    const conversionUrl = data.conversion_url || null
    const conversionValue = data.conversion_value ? Math.max(Number(data.conversion_value) || 0, 0) : 0
    const conversionType = data.conversion_type || 'page_view'

    console.log('Tentando inserir experimento via SQL direto:', {
      experimentName,
      projectId,
      description,
      experimentType,
      status,
      trafficAllocation,
      createdBy,
      userId,
      algorithm,
      targetUrl,
      conversionUrl,
      conversionValue,
      conversionType
    })

    // Inserir com todos os campos de uma vez
    const { data: experimentResult, error: experimentError } = await (userClient as any)
      .from('experiments')
      .insert({
        name: experimentName,
        project_id: projectId,
        description: description,
        type: experimentType,
        status: status,
        traffic_allocation: trafficAllocation,
        user_id: userId,
        algorithm: algorithm,
        target_url: targetUrl,
        conversion_url: conversionUrl,
        conversion_value: conversionValue,
        conversion_type: conversionType
      })
      .select('id, name, project_id, description, type, status, traffic_allocation, user_id, algorithm, target_url, conversion_url, conversion_value, conversion_type, created_at')
      .single()

    if (experimentError) {
      console.error('Erro ao inserir experimento:', experimentError)
      return NextResponse.json(
        { error: 'Erro ao criar experimento: ' + experimentError.message },
        { status: 500 }
      )
    }

    // Usar resultado direto sem necessidade de update
    const experiment = {
      ...experimentResult,
      updated_at: new Date().toISOString()
    }

    // Criar variantes padrão para o experimento
    if (experimentResult && experimentResult.id) {
      console.log('Criando variantes padrão para experimento:', experimentResult.id)
      
      // Verificar se já existem variantes para este experimento
      const { data: existingVariants } = await userClient
        .from('variants')
        .select('id')
        .eq('experiment_id', experimentResult.id)
      
      if (existingVariants && existingVariants.length > 0) {
        console.log('Variantes já existem para este experimento, pulando criação')
      } else {
        const defaultVariants = [
          {
            experiment_id: experimentResult.id,
            name: 'Controle',
            description: 'Versão original',
            is_control: true,
            traffic_percentage: 50.00,
            redirect_url: null,
            changes: {},
            css_changes: null,
            js_changes: null,
            user_id: createdBy,
            visitors: 0,
            conversions: 0,
            conversion_rate: 0.0000,
            is_active: true
          },
          {
            experiment_id: experimentResult.id,
            name: 'Variante A',
            description: 'Versão alternativa',
            is_control: false,
            traffic_percentage: 50.00,
            redirect_url: null,
            changes: {},
            css_changes: null,
            js_changes: null,
            user_id: createdBy,
            visitors: 0,
            conversions: 0,
            conversion_rate: 0.0000,
            is_active: true
          }
        ]

        try {
          const { data: variants, error: variantsError } = await (userClient as any)
            .from('variants')
            .insert(defaultVariants)
            .select('id, name, is_control, traffic_percentage')

          if (variantsError) {
            console.error('Erro ao criar variantes:', variantsError.message)
            // Não falhamos a criação do experimento por causa das variantes
          } else {
            console.log('✅ Variantes criadas:', variants)
            experiment.variants = variants
          }
        } catch (variantErr) {
          console.error('Erro ao criar variantes:', variantErr)
        }
      }
    }

    return NextResponse.json({
      success: true,
      experiment: experiment
    })

  } catch (error) {
    console.error('Erro geral na criação de experimento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
