import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { createRequestLogger, logTypes } from '@/lib/enhanced-logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const logger = createRequestLogger(request)
  
  try {
    logger.info('🚀 Iniciando criação de experimento')
    
    const rawData = await request.json()
    logger.debug('Dados recebidos do frontend:', rawData)

    // Validar dados obrigatórios - apenas nome é necessário
    if (!rawData.name) {
      logTypes.validationFailed('name', rawData.name, 'string')
      return NextResponse.json(
        { error: 'Nome do experimento é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar autenticação do usuário
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.error('Falha na autenticação', authError)
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    logger.addContext({ userId: user.id })
    logger.info('✅ Usuário autenticado', { user_id: user.id, email: user.email })

    // Usar client do usuário autenticado para respeitar RLS
    const userClient = supabase

    // Buscar projeto padrão do usuário automaticamente
    let projectId = rawData.project_id; // Usar se fornecido
    
    if (!projectId) {
      logger.info('🔍 Buscando projeto padrão do usuário')
      
      // Buscar primeiro projeto disponível (RLS vai filtrar automaticamente)
      const { data: userProjects, error: projectError } = await userClient
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: true })
        .limit(1) as { data: Array<{id: string, name: string}> | null, error: any };

      if (projectError || !userProjects || userProjects.length === 0) {
        logger.error('❌ Nenhum projeto encontrado para o usuário', projectError)
        return NextResponse.json(
          { error: 'Nenhum projeto encontrado. Entre em contato com o suporte.' },
          { status: 400 }
        )
      }

      projectId = userProjects[0]!.id;
      logger.info('✅ Projeto padrão encontrado', { 
        projectId, 
        projectName: userProjects[0]?.name 
      })
    }

    // Função para converter e validar números
    const safeNumber = (value: any, defaultValue: number, min?: number, max?: number): number => {
      const num = parseFloat(value) || defaultValue
      if (min !== undefined && num < min) return min
      if (max !== undefined && num > max) return max
      return num
    }

    // Construir dados do experimento com validação de tipos
    const experimentData = {
      name: String(rawData.name).trim(),
      project_id: projectId, // Usar projectId encontrado automaticamente
      description: rawData.description ? String(rawData.description) : null,
      type: rawData.type || 'redirect', // Padrão: redirect
      traffic_allocation: safeNumber(rawData.traffic_allocation, 100, 1, 100), // Padrão: 100%
      status: rawData.status || 'draft', // Padrão: draft
      created_by: user.id,
      user_id: user.id
    }

    logger.validation('Dados do experimento validados', experimentData)

    // Dados para inserir - incluindo todos os campos obrigatórios com tipos corretos
    const insertData = {
      name: experimentData.name,
      project_id: experimentData.project_id,
      description: experimentData.description,
      type: experimentData.type,
      traffic_allocation: experimentData.traffic_allocation,
      status: experimentData.status,
      created_by: experimentData.created_by,
      user_id: experimentData.user_id
    }

    // Contexto adicional para os logs
    const experimentContext = {
      projectId: experimentData.project_id,
      experimentName: experimentData.name 
    }
    logger.debug('Dados para inserção no banco:', insertData)

    // Validar nome
    if (!experimentData.name || experimentData.name.length < 2) {
      logTypes.validationFailed('experiment name', experimentData.name, 'string with min length 2')
      return NextResponse.json(
        { error: 'Nome do experimento deve ter pelo menos 2 caracteres' },
        { status: 400 }
      )
    }

    // Criar experimento com logging detalhado
    logger.experiment('create', 'Tentando criar experimento no banco de dados', {
      experimentName: experimentData.name,
      projectId: experimentData.project_id
    })
    
    let newExperiment;
    let insertError;
    
    // Primeira tentativa: insert normal com todos os campos
    const { data: firstResult, error: firstError } = await (userClient as any)
      .from('experiments')
      .insert(insertData)
      .select('id,name,project_id,description,type,traffic_allocation,status,created_at')
      .single();
    
    if (firstError) {
      logger.database('insert', 'experiments', null, firstError)
      logTypes.experimentError('create', firstError, {
        experimentName: experimentData.name,
        projectId: experimentData.project_id,
        insertData
      })
    } else {
      logger.database('insert', 'experiments', firstResult)
      newExperiment = firstResult
    }
    
    if (firstError) {
      insertError = firstError
      
      return NextResponse.json(
        { error: `Erro ao criar experimento: ${firstError.message}` },
        { status: 500 }
      )
    }

    // Preencher valores padrão esperados pelo frontend
    const safeExperiment: any = {
      ...newExperiment,
      variants: [] // Será preenchido abaixo se variantes forem criadas
    }

    // Criar variantes padrão para o experimento
    if (newExperiment && newExperiment.id) {
      logger.experiment('create', 'Criando variantes padrão para experimento', {
        experimentId: newExperiment.id,
        experimentName: newExperiment.name
      })
      
      const defaultVariants = [
        {
          experiment_id: newExperiment.id,
          name: 'Controle',
          description: 'Versão original',
          is_control: true,
          traffic_percentage: 50.00,
          redirect_url: null,
          changes: {},
          css_changes: null,
          js_changes: null,
          created_by: user.id,
          visitors: 0,
          conversions: 0,
          conversion_rate: 0.00,
          is_active: true
        },
        {
          experiment_id: newExperiment.id,
          name: 'Variante B',
          description: 'Versão alternativa',
          is_control: false,
          traffic_percentage: 50.00,
          redirect_url: null,
          changes: {},
          css_changes: null,
          js_changes: null,
          created_by: user.id,
          visitors: 0,
          conversions: 0,
          conversion_rate: 0.00,
          is_active: true
        }
      ]

      logger.debug('Dados das variantes para inserção:', defaultVariants)

      try {
        const { data: variants, error: variantsError } = await (userClient as any)
          .from('variants')
          .insert(defaultVariants)
          .select('id, name, is_control, traffic_percentage')

        if (variantsError) {
          logger.database('insert', 'variants', null, variantsError)
          logTypes.experimentError('create', variantsError, {
            experimentId: newExperiment.id,
            action: 'create_variants'
          })
          // Não falhamos a criação do experimento por causa das variantes
        } else {
          logger.database('insert', 'variants', variants)
          safeExperiment.variants = variants
        }
      } catch (variantErr) {
        logger.error('Exceção ao criar variantes', variantErr)
      }
    }

    // Log de sucesso com métricas de performance
    const duration = Date.now() - startTime
    logTypes.experimentCreated(newExperiment.id, newExperiment.name, user.id)
    logTypes.apiTiming('/api/experiments', 'POST', duration, 200)
    
    return NextResponse.json({
      success: true,
      experiment: safeExperiment
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('💥 Erro geral na criação de experimento', error)
    logTypes.apiTiming('/api/experiments', 'POST', duration, 500)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const logger = createRequestLogger(request)
  
  try {
    logger.info('🔍 Listando experimentos do usuário')

    // Verificar autenticação do usuário
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.error('Falha na autenticação', authError)
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    logger.addContext({ userId: user.id })
    logger.info('✅ Usuário autenticado', { user_id: user.id, email: user.email })

    // Buscar experimentos do usuário
    const { data: experiments, error: experimentsError } = await supabase
      .from('experiments')
      .select(`
        id,
        name,
        description,
        type,
        status,
        traffic_allocation,
        created_at,
        updated_at,
        variants:variants(
          id,
          name,
          is_control,
          traffic_percentage
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (experimentsError) {
      logger.error('❌ Erro ao buscar experimentos', experimentsError)
      return NextResponse.json(
        { error: 'Erro ao buscar experimentos' },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logTypes.apiTiming('/api/experiments', 'GET', duration, 200)
    
    logger.info('✅ Experimentos encontrados', { count: experiments?.length || 0 })

    return NextResponse.json({
      success: true,
      experiments: experiments || [],
      count: experiments?.length || 0
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('💥 Erro geral ao listar experimentos', error)
    logTypes.apiTiming('/api/experiments', 'GET', duration, 500)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
