import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json()

    // Validar dados obrigatórios
    if (!rawData.name) {
      return NextResponse.json(
        { error: 'Nome do experimento é obrigatório' },
        { status: 400 }
      )
    }

    // Simular criação de experimento para teste
    const experiment = {
      id: 'test-' + Date.now(),
      name: rawData.name,
      description: rawData.description || 'Experimento de teste',
      type: rawData.type || 'redirect',
      traffic_allocation: rawData.traffic_allocation || 50,
      status: rawData.status || 'draft',
      created_at: new Date().toISOString(),
      variants: [
        {
          id: 'variant-1',
          name: 'Controle',
          description: 'Versão original',
          is_control: true,
          traffic_percentage: 50,
          visitors: 0,
          conversions: 0,
          conversion_rate: 0
        },
        {
          id: 'variant-2',
          name: 'Variante B',
          description: 'Versão alternativa',
          is_control: false,
          traffic_percentage: 50,
          visitors: 0,
          conversions: 0,
          conversion_rate: 0
        }
      ]
    }

    return NextResponse.json({
      success: true,
      experiment: experiment,
      message: 'Experimento de teste criado com sucesso!'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor no teste' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Simular lista de experimentos para teste
    const experiments = [
      {
        id: 'test-1',
        name: 'Teste Botão Verde',
        description: 'Teste de cor do botão',
        type: 'redirect',
        status: 'running',
        traffic_allocation: 50,
        created_at: new Date().toISOString(),
        variants: []
      },
      {
        id: 'test-2',
        name: 'Teste Headline',
        description: 'Teste de headline',
        type: 'element',
        status: 'draft',
        traffic_allocation: 75,
        created_at: new Date().toISOString(),
        variants: []
      }
    ]

    return NextResponse.json({
      success: true,
      experiments: experiments,
      count: experiments.length,
      message: 'Experimentos de teste listados com sucesso!'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor no teste' },
      { status: 500 }
    )
  }
}
