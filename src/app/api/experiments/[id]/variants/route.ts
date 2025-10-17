import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const experimentId = id
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

    // Verificar se o experimento existe e o usuário tem permissão
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .select('id, name, project_id')
      .eq('id', experimentId)
      .single()

    if (expError || !experiment) {
      return NextResponse.json(
        { error: 'Experimento não encontrado' },
        { status: 404 }
      )
    }

    // Criar variantes padrão se não fornecidas
    const variantsToCreate = data.variants || [
      {
        name: 'Controle',
        description: 'Versão original',
        is_control: true,
        traffic_percentage: 50.00,
        redirect_url: null,
        changes: {},
        css_changes: null,
        js_changes: null
      },
      {
        name: 'Variante B',
        description: 'Versão alternativa',
        is_control: false,
        traffic_percentage: 50.00,
        redirect_url: null,
        changes: {},
        css_changes: null,
        js_changes: null
      }
    ]

    // Processar cada variante para suportar múltiplas URLs
    const processedVariants = variantsToCreate.map(variant => {
      let changesData = variant.changes || {}
      
      // Se múltiplas URLs foram fornecidas, armazenar no campo changes
      if (variant.urls && Array.isArray(variant.urls) && variant.urls.length > 1) {
        const validUrls = variant.urls.filter((url: string) => url && url.trim())
        
        changesData = {
          ...changesData,
          multipage: true,
          pages: validUrls.map((url: string, index: number) => ({
            id: index + 1,
            url: url.trim(),
            weight: variant.weights?.[index] || (100 / validUrls.length),
            description: variant.page_descriptions?.[index] || `Página ${index + 1}`,
            active: true
          })),
          total_pages: validUrls.length,
          selection_mode: variant.selection_mode || 'random' // random, weighted, sequential
        }
        
        // Usar primeira URL como redirect_url principal
        variant.redirect_url = validUrls[0]
      } else if (variant.urls && variant.urls.length === 1) {
        // Uma única URL
        variant.redirect_url = variant.urls[0]
      }
      
      return {
        name: variant.name,
        description: variant.description,
        is_control: variant.is_control,
        traffic_percentage: variant.traffic_percentage,
        redirect_url: variant.redirect_url,
        changes: changesData,
        css_changes: variant.css_changes,
        js_changes: variant.js_changes
      }
    })

    // Adicionar experiment_id a cada variante
    const variantsWithExpId = processedVariants.map(variant => ({
      ...variant,
      experiment_id: experimentId,
      user_id: user.id
    }))

    console.log('Criando variantes para experimento:', experimentId, variantsWithExpId)

    // Inserir variantes
    const { data: newVariants, error: variantsError } = await (supabase as any)
      .from('variants')
      .insert(variantsWithExpId)
      .select()

    if (variantsError) {
      console.error('Erro ao criar variantes:', variantsError)
      return NextResponse.json(
        { error: 'Erro ao criar variantes: ' + variantsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      variants: newVariants,
      experiment: experiment
    })

  } catch (error) {
    console.error('Erro geral na criação de variantes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const experimentId = id

    // Verificar autenticação do usuário
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Buscar variantes do experimento
    const { data: variants, error: variantsError } = await supabase
      .from('variants')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('created_at')

    if (variantsError) {
      console.error('Erro ao buscar variantes:', variantsError)
      return NextResponse.json(
        { error: 'Erro ao buscar variantes: ' + variantsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      variants: variants || []
    })

  } catch (error) {
    console.error('Erro geral ao buscar variantes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
