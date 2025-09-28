import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createRequestLogger, logTypes } from '@/lib/enhanced-logger'
import { safeTrafficAllocation } from '@/lib/numeric-utils'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const logger = createRequestLogger(request)
  
  try {
    logger.info('🧪 [TESTE] Iniciando criação de experimento de teste')
    
    const rawData = await request.json()
    logger.debug('Dados recebidos do teste:', rawData)

    // Validar dados obrigatórios - apenas nome é necessário
    if (!rawData.name) {
      logTypes.validationFailed('name', rawData.name, 'string')
      return NextResponse.json(
        { error: 'Nome do experimento é obrigatório' },
        { status: 400 }
      )
    }

    // Para testes, usar service client que não requer autenticação
    const serviceClient = createServiceClient()
    
    // Buscar primeiro projeto disponível para teste
    logger.info('🔍 [TESTE] Buscando projeto para teste')
    
    // Usar ID fixo do projeto que sabemos que existe
    const projectId = '6671b171-446f-4093-a9e3-23a795349222'
    const projectName = 'Projeto Final Teste'
    
    logger.info('✅ [TESTE] Usando projeto fixo para teste', { 
      projectId, 
      projectName 
    })

    // Projeto fixo já definido acima

    // Construir dados do experimento com validação de tipos
    const trafficAllocation = safeTrafficAllocation(rawData.traffic_allocation, 99.99)
    logger.debug('Traffic allocation processado:', trafficAllocation)
    
    // Forçar valor seguro para teste (máximo 99.99 para numeric(5,2))
    const safeTrafficValue = Math.min(Math.max(Number(trafficAllocation) || 99.99, 1), 99.99)
    logger.debug('Traffic allocation para teste:', safeTrafficValue)
    
    const experimentData = {
      name: String(rawData.name).trim(),
      project_id: projectId,
      description: rawData.description ? String(rawData.description) : null,
      type: (rawData.type || 'redirect') as 'redirect' | 'element' | 'split_url' | 'mab',
      traffic_allocation: Number(safeTrafficValue),
      status: (rawData.status || 'draft') as 'draft' | 'running' | 'paused' | 'completed' | 'archived',
      user_id: null // Para teste, não associar a usuário específico
    }

    logger.validation('Dados do experimento de teste validados', experimentData)

    // Dados para inserir
    const insertData = {
      name: experimentData.name,
      project_id: experimentData.project_id,
      description: experimentData.description,
      type: experimentData.type,
      traffic_allocation: safeTrafficValue,
      status: experimentData.status,
      user_id: experimentData.user_id
    }
    
    logger.debug('Dados para inserção no banco (teste):', JSON.stringify(insertData, null, 2))

    // Validar nome
    if (!experimentData.name || experimentData.name.length < 2) {
      logTypes.validationFailed('experiment name', experimentData.name, 'string with min length 2')
      return NextResponse.json(
        { error: 'Nome do experimento deve ter pelo menos 2 caracteres' },
        { status: 400 }
      )
    }

    // Criar experimento
    logger.experiment('create', 'Tentando criar experimento de teste no banco de dados', {
      experimentName: experimentData.name,
      projectId: experimentData.project_id
    })
    
    const { data: newExperiment, error } = await serviceClient
      .from('experiments')
      .insert(insertData)
      .select('id, name, traffic_allocation, status, created_at')
      .single()
    
    if (error) {
        logger.database('insert', 'experiments', null, error)
        logTypes.experimentError('create', error, {
            experimentName: experimentData.name,
            projectId: experimentData.project_id,
            insertData
        })
        
        return NextResponse.json(
          { error: `Erro ao criar experimento de teste: ${error.message}` },
          { status: 500 }
        )
    }

    logger.database('insert', 'experiments', newExperiment)

    // Preencher valores padrão esperados pelo frontend
    const safeExperiment: any = {
      ...newExperiment,
      variants: [] // Será preenchido abaixo se variantes forem criadas
    }

    // Criar variantes padrão para o experimento de teste
    if (newExperiment && newExperiment.id) {
      logger.experiment('create', 'Criando variantes padrão para experimento de teste', {
        experimentId: newExperiment.id,
        experimentName: newExperiment.name
      })
      
      // Verificar se já existem variantes para este experimento
      const { data: existingVariants } = await userClient
        .from('variants')
        .select('id')
        .eq('experiment_id', newExperiment.id)
      
      if (existingVariants && existingVariants.length > 0) {
        logger.warn('Variantes já existem para este experimento de teste, pulando criação')
      } else {
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
            visitors: 0,
            conversions: 0,
            conversion_rate: 0.0000,
            is_active: true,
            created_by: null // Para teste
          },
          {
            experiment_id: newExperiment.id,
            name: 'Variante A',
            description: 'Versão alternativa',
            is_control: false,
            traffic_percentage: 50.00,
            redirect_url: null,
            changes: {},
            css_changes: null,
            js_changes: null,
            visitors: 0,
            conversions: 0,
            conversion_rate: 0.0000,
            is_active: true,
            created_by: null // Para teste
          }
        ]

        logger.debug('Dados das variantes para inserção (teste):', defaultVariants)

        try {
          const { data: variants, error: variantsError } = await serviceClient
            .from('variants')
            .insert(defaultVariants)
            .select('id, name, description, is_control, traffic_percentage, visitors, conversions, conversion_rate')

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
          logger.error('Exceção ao criar variantes de teste', variantErr)
        }
      }
    }

    // Log de sucesso com métricas de performance
    const duration = Date.now() - startTime
    logTypes.experimentCreated(newExperiment.id, newExperiment.name, 'test-user')
    logTypes.apiTiming('/api/test/experiments', 'POST', duration, 200)
    
    return NextResponse.json({
      success: true,
      experiment: safeExperiment,
      message: 'Experimento de teste criado com sucesso!'
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('💥 Erro geral na criação de experimento de teste', error)
    logTypes.apiTiming('/api/test/experiments', 'POST', duration, 500)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor no teste' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const logger = createRequestLogger(request)
  
  try {
    logger.info('🔍 [TESTE] Listando experimentos de teste')

    // Para testes, usar service client que não requer autenticação
    const serviceClient = createServiceClient()

    // Buscar experimentos de teste (sem user_id específico)
    const { data: experiments, error: experimentsError } = await serviceClient
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
          description,
          is_control,
          traffic_percentage,
          visitors,
          conversions,
          conversion_rate
        )
      `)
      .is('user_id', null) // Apenas experimentos de teste
      .order('created_at', { ascending: false })
      .limit(10) // Limitar para teste

    if (experimentsError) {
      logger.error('❌ Erro ao buscar experimentos de teste', experimentsError)
      return NextResponse.json(
        { error: 'Erro ao buscar experimentos de teste' },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logTypes.apiTiming('/api/test/experiments', 'GET', duration, 200)
    
    logger.info('✅ Experimentos de teste encontrados', { count: experiments?.length || 0 })

    return NextResponse.json({
      success: true,
      experiments: experiments || [],
      count: experiments?.length || 0,
      message: 'Experimentos de teste listados com sucesso!'
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('💥 Erro geral ao listar experimentos de teste', error)
    logTypes.apiTiming('/api/test/experiments', 'GET', duration, 500)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor no teste' },
      { status: 500 }
    )
  }
}
