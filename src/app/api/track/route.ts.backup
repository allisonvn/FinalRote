import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { config } from '@/lib/config'

// Headers CORS para todas as respostas
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RF-Version',
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Suporte para ambos os formatos: novo SDK e legado
    let experimentId = data.experimentId || data.experiment_id
    const userId = data.userId || data.visitor_id
    const eventType = data.eventType || data.event_type

    // Validar dados obrigatórios
    if (!experimentId || !userId || !eventType) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: experimentId/experiment_id, userId/visitor_id, eventType/event_type' },
        { status: 400, headers: corsHeaders }
      )
    }

    // ✅ ENDPOINT PÚBLICO: API key é opcional (não obrigatória)
    // Isso permite que o código gerado funcione sem autenticação
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    let project = null

    const supabase = await createClient()

    if (apiKey) {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('api_key', apiKey)
        .single()

      // ✅ Se API key é inválida, apenas ignora (não retorna erro 401)
      if (!projectError && projectData) {
        project = projectData
      }
    }

    // Extrair UTMs das propriedades
    const utmParams = {
      utm_source: data.properties?.utm_source || null,
      utm_medium: data.properties?.utm_medium || null,
      utm_campaign: data.properties?.utm_campaign || null,
      utm_term: data.properties?.utm_term || null,
      utm_content: data.properties?.utm_content || null
    }

    // Extrair dados de sessão
    const sessionData = {
      user_agent: request.headers.get('user-agent') || null,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') || null,
      referrer: data.properties?.referrer || request.headers.get('referer') || null,
      device_type: data.properties?.device_type || 'unknown',
      browser_name: data.properties?.browser_name || null,
      browser_version: data.properties?.browser_version || null,
      os_name: data.properties?.os_name || null,
      os_version: data.properties?.os_version || null,
      screen_resolution: data.properties?.screen_resolution || null
    }

    // Extrair experiment_id real (remover prefixo 'exp_' se existir)
    experimentId = experimentId.replace('exp_', '')

    // Verificar se o experimento existe
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .select('id, project_id')
      .eq('id', experimentId)
      .single()

    if (expError || !experiment) {
      console.warn('Experimento não encontrado:', experimentId)
      return NextResponse.json(
        { error: 'Experimento não encontrado' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Preparar dados do evento
    const eventData = {
      project_id: experiment.project_id,
      experiment_id: experimentId,
      visitor_id: data.visitor_id,
      event_type: data.event_type,
      event_name: data.event_type,
      properties: {
        variant: data.variant,
        url: data.url,
        ...data.properties
      },
      value: data.value || (data.properties?.value ? parseFloat(data.properties.value) : null),
      created_at: data.timestamp || new Date().toISOString()
    }

    // Inserir evento na tabela events
    const { error: insertError } = await supabase
      .from('events')
      .insert(eventData)

    if (insertError) {
      console.error('Erro ao inserir evento:', insertError)
      return NextResponse.json(
        { error: 'Erro ao salvar evento' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Se for conversão, atualizar variant_stats
    if (data.event_type === 'conversion') {
      console.log('📊 [CONVERSION] Registrando conversão', {
        experiment: experimentId,
        visitor: data.visitor_id,
        variant: data.variant,
        value: eventData.value
      })

      try {
        // Buscar variante pelo nome
        const { data: variant } = await supabase
          .from('variants')
          .select('id')
          .eq('experiment_id', experimentId)
          .eq('name', data.variant)
          .single()

        if (variant) {
          // Atualizar estatísticas da variante
          await supabase.rpc('increment_variant_conversions', {
            p_variant_id: variant.id,
            p_experiment_id: experimentId,
            p_revenue: eventData.value || 0
          })

          console.log('✅ [CONVERSION] Estatísticas atualizadas para variante:', variant.id)
        }
      } catch (conversionError) {
        console.error('⚠️ [WARNING] Erro ao atualizar estatísticas de conversão:', conversionError)
        // Não falhar a requisição
      }
    }

    // Criar ou atualizar sessão do visitante com UTMs
    const sessionId = `${data.visitor_id}_${new Date().toISOString().split('T')[0]}`
    
    try {
      await supabase
        .from('visitor_sessions')
        .upsert({
          project_id: experiment.project_id,
          visitor_id: data.visitor_id,
          session_id: sessionId,
          user_agent: sessionData.user_agent,
          ip_address: sessionData.ip_address,
          referrer: sessionData.referrer,
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          utm_campaign: utmParams.utm_campaign,
          utm_content: utmParams.utm_content,
          utm_term: utmParams.utm_term,
          device_type: sessionData.device_type,
          browser_name: sessionData.browser_name,
          browser_version: sessionData.browser_version,
          os_name: sessionData.os_name,
          os_version: sessionData.os_version,
          screen_resolution: sessionData.screen_resolution,
          events_count: 1,
          started_at: new Date().toISOString()
        }, {
          onConflict: 'project_id,visitor_id,session_id',
          ignoreDuplicates: false
        })
    } catch (sessionError) {
      console.warn('Erro ao atualizar sessão:', sessionError)
      // Não falhar a requisição por erro de sessão
    }

    // Se for um evento de page_view e experiment_start, também criar/atualizar assignment
    if (data.event_type === 'page_view' && data.properties?.experiment_start) {
      try {
        // Buscar variante pelo nome
        const { data: variant, error: variantError } = await supabase
          .from('variants')
          .select('id')
          .eq('experiment_id', experimentId)
          .eq('name', data.variant)
          .single()

        if (!variantError && variant) {
          // Criar ou atualizar assignment
          const { error: assignmentError } = await supabase
            .from('assignments')
            .upsert({
              experiment_id: experimentId,
              variant_id: variant.id,
              visitor_id: data.visitor_id,
              context: {
                user_agent: request.headers.get('user-agent'),
                url: data.url,
                timestamp: data.timestamp
              }
            }, {
              onConflict: 'experiment_id,visitor_id'
            })

          if (assignmentError) {
            console.warn('Erro ao criar assignment:', assignmentError)
          }
        }
      } catch (assignmentError) {
        console.warn('Erro ao processar assignment:', assignmentError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Evento registrado com sucesso',
      experiment_id: experimentId
    }, {
      headers: corsHeaders
    })

  } catch (error) {
    console.error('Erro no tracking:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}