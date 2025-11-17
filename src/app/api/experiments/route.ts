import { NextRequest, NextResponse } from 'next/server'
// Removido fallback com service client para evitar dependência de service role key
import { createClient } from '@/lib/supabase/server'
import { createRequestLogger, logTypes } from '@/lib/enhanced-logger'
import { safeTrafficAllocation } from '@/lib/numeric-utils'

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
    // Forçar refresh do schema cache
    const userClient = supabase
    
    // Usaremos o client do usuário autenticado (RLS controlará permissões)
    
    // Tentar forçar refresh do cache fazendo múltiplas queries
    try {
      // Query 1: Listar tabelas
      await (userClient as any).from('experiments').select('id').limit(1)
      // Query 2: Verificar schema
      await (userClient as any).from('experiments').select('type').limit(1)
      // Query 3: Verificar user_id
      await (userClient as any).from('experiments').select('user_id').limit(1)
    } catch (cacheError) {
      logger.debug('Cache refresh queries falharam (normal)', cacheError)
    }

    // Buscar projeto padrão do usuário automaticamente
    // Determinar projeto no servidor (não confiar no client)
    let projectId: string | null = null;
    
    if (!projectId) {
      logger.info('🔍 Buscando projeto padrão do usuário')
      
      // Buscar primeiro projeto disponível (RLS vai filtrar automaticamente)
      const { data: userProjects, error: projectError } = await userClient
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: true })
        .limit(1) as { data: Array<{id: string, name: string}> | null, error: any };

      if (!projectError && userProjects && userProjects.length > 0) {
        projectId = userProjects[0]!.id;
        logger.info('✅ Projeto padrão encontrado', { 
          projectId, 
          projectName: userProjects[0]?.name 
        })
      } else {
        // Provisionar automaticamente organização e projeto padrão
        logger.info('🏗️ Nenhum projeto encontrado. Provisionando organização e projeto padrão...')

        // Gerar slug simples
        const baseSlug = (user.email || user.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const orgName = `Workspace de ${user.email || user.id.slice(0, 8)}`
        const orgSlug = `${baseSlug}-ws`

        try {
          // Criar organização via função (security definer)
          const { data: newOrgId, error: orgError } = await (userClient as any)
            .rpc('create_organization', { name: orgName, slug: orgSlug })
            
          if (orgError || !newOrgId) {
            logger.error('❌ Erro ao criar organização padrão', orgError)
            return NextResponse.json(
              { error: 'Não foi possível criar organização padrão para o usuário.' },
              { status: 500 }
            )
          }

          logger.info('✅ Organização padrão criada', { orgId: newOrgId })

          // Criar projeto padrão
          const { data: newProject, error: newProjError } = await (userClient as any)
            .from('projects')
            .insert({
              org_id: newOrgId,
              name: 'Projeto Padrão',
              description: 'Projeto criado automaticamente'
            })
            .select('id, name')
            .single()

          if (newProjError || !newProject) {
            logger.error('❌ Erro ao criar projeto padrão', newProjError)
            return NextResponse.json(
              { error: 'Não foi possível criar projeto padrão para o usuário.' },
              { status: 500 }
            )
          }

          projectId = newProject.id
          logger.info('✅ Projeto padrão criado', { projectId })
        } catch (provErr) {
          logger.error('💥 Exceção ao provisionar organização/projeto padrão', provErr)
          return NextResponse.json(
            { error: 'Falha ao provisionar ambiente padrão do usuário.' },
            { status: 500 }
          )
        }
      }
    }

    // Construir dados do experimento com validação de tipos
    const trafficAllocation = safeTrafficAllocation(rawData.traffic_allocation, 99.99)
    logger.debug('Traffic allocation original:', rawData.traffic_allocation)
    logger.debug('Traffic allocation processado:', trafficAllocation)
    logger.debug('Tipo do traffic allocation:', typeof trafficAllocation)
    logger.debug('É um número válido?', !isNaN(trafficAllocation))
    
    // Forçar valor seguro para teste (máximo 99.99 para numeric(4,2))
    const safeTrafficValue = Math.min(Math.max(Number(trafficAllocation) || 99.99, 0), 99.99)
    logger.debug('Traffic allocation forçado para teste:', safeTrafficValue)
    logger.debug('Tipo do safeTrafficValue:', typeof safeTrafficValue)
    logger.debug('safeTrafficValue é número?', !isNaN(safeTrafficValue))
    logger.debug('safeTrafficValue valor exato:', safeTrafficValue)
    
    // Processar conversion_value com segurança
    const conversionValue = rawData.conversion_value 
      ? Math.max(Number(rawData.conversion_value) || 0, 0) 
      : 0
    
    const experimentData = {
      name: String(rawData.name).trim(),
      project_id: projectId as string, // Garantido acima
      description: rawData.description ? String(rawData.description) : null,
      type: (rawData.type || 'redirect') as 'redirect' | 'element' | 'split_url' | 'mab',
      traffic_allocation: Number(safeTrafficValue), // Forçar tipo numérico
      status: (rawData.status || 'draft') as 'draft' | 'running' | 'paused' | 'completed' | 'archived',
      user_id: user.id,
      // Novos campos adicionados
      algorithm: rawData.algorithm || 'uniform',
      target_url: rawData.target_url || null,
      conversion_url: rawData.conversion_url || null,
      conversion_value: conversionValue,
      conversion_type: rawData.conversion_type || 'page_view'
      // confidence_level usa valor padrão do banco (0.95)
    }

    logger.validation('Dados do experimento validados', experimentData)

    // Dados para inserir - todos os campos disponíveis
    const insertData = {
      name: experimentData.name,
      project_id: experimentData.project_id,
      description: experimentData.description,
      type: experimentData.type,
      traffic_allocation: safeTrafficValue,
      status: experimentData.status,
      user_id: experimentData.user_id,
      algorithm: experimentData.algorithm,
      target_url: experimentData.target_url,
      conversion_url: experimentData.conversion_url,
      conversion_value: experimentData.conversion_value,
      conversion_type: experimentData.conversion_type
      // confidence_level usa valor padrão do banco (0.95)
    }
    
    // Log detalhado dos dados que serão inseridos
    logger.debug('Dados para inserção no banco:', JSON.stringify(insertData, null, 2))

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
    
    let insertError;
    
    // SOLUÇÃO FINAL: Usar inserção direta que contorna cache completamente
    logger.info('🔄 Tentando inserção direta para contornar cache')
    
    // Criar dados de inserção com todos os campos
    // NOTA: confidence_level tem valor padrão no banco (0.95), então não precisamos incluí-lo
    const directInsertData = {
      name: insertData.name,
      project_id: insertData.project_id,
      description: insertData.description || null,
      type: insertData.type,
      traffic_allocation: insertData.traffic_allocation,
      status: insertData.status,
      user_id: insertData.user_id || null,
      algorithm: insertData.algorithm,
      target_url: insertData.target_url,
      conversion_url: insertData.conversion_url,
      conversion_value: insertData.conversion_value,
      conversion_type: insertData.conversion_type,
      duration_days: insertData.duration_days || rawData.duration_days || 14  // ✅ Duração planejada
      // confidence_level não incluído - usa valor padrão do banco (0.95)
    }
    
    // Usar inserção direta que sabemos que funciona
    const { data: newExperiment, error } = await (userClient as any)
      .from('experiments')
      .insert(directInsertData)
      .select('id, name, type, traffic_allocation, status, algorithm, target_url, conversion_url, conversion_value, conversion_type, duration_days, created_at')
      .single();
    
    if (error) {
        logger.database('insert', 'experiments', null, error)
        logTypes.experimentError('create', error, {
            experimentName: experimentData.name,
            projectId: experimentData.project_id,
            insertData
        })
        insertError = error
    } else {
        logger.database('insert', 'experiments', newExperiment)
    }
    
    if (insertError) {
      return NextResponse.json(
        { error: `Erro ao criar experimento: ${insertError.message}` },
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
      
      // Verificar se já existem variantes para este experimento
      const { data: existingVariants } = await userClient
        .from('variants')
        .select('id')
        .eq('experiment_id', newExperiment.id)
      
      if (existingVariants && existingVariants.length > 0) {
        logger.warn('Variantes já existem para este experimento, pulando criação', {
          experimentId: newExperiment.id,
          existingCount: existingVariants.length
        })
      } else {
        const defaultVariants = [
          {
            experiment_id: newExperiment.id,
            name: 'Controle',
            description: 'Versão original',
            is_control: true,
            traffic_percentage: 50.00,
            is_active: true,
            config: {} // Armazenar dados adicionais no campo config (jsonb)
          },
          {
            experiment_id: newExperiment.id,
            name: 'Variante A',
            description: 'Versão alternativa',
            is_control: false,
            traffic_percentage: 50.00,
            is_active: true,
            config: {} // Armazenar dados adicionais no campo config (jsonb)
          }
        ]

        logger.debug('Dados das variantes para inserção:', defaultVariants)

        try {
          const { data: variants, error: variantsError } = await (userClient as any)
            .from('variants')
            .insert(defaultVariants)
            .select('id, name, description, is_control, traffic_percentage, config, is_active')

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

export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
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

    // Buscar experimentos do usuário (diretos ou via organização)
    // Primeiro, buscar experimentos diretos do usuário
    const { data: directExperiments, error: directError } = await (supabase as any)
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
        user_id,
        project_id,
        variants:variants(
          id,
          name,
          description,
          is_control,
          traffic_percentage,
          config,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Buscar experimentos via organização
    const { data: orgExperiments, error: orgError } = await (supabase as any)
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
        user_id,
        project_id,
        projects!inner(
          id,
          org_id,
          organization_members!inner(
            user_id,
            role
          )
        ),
        variants:variants(
          id,
          name,
          description,
          is_control,
          traffic_percentage,
          config,
          is_active
        )
      `)
      .eq('projects.organization_members.user_id', user.id)
      .is('user_id', null)
      .order('created_at', { ascending: false })

    // Combinar resultados
    const experiments = [
      ...(directExperiments || []),
      ...(orgExperiments || [])
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const experimentsError = directError || orgError

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
