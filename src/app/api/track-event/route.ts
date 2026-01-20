import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// CORS headers para todas as respostas
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RF-Version, X-API-Key',
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events } = body

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'events array is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    logger.info('Processing batch events', { count: events.length })

    const supabase = createServiceClient()
    const results: any[] = []

    // Processar cada evento
    for (const event of events) {
      try {
        // Converter experiment_key para experiment_id se necessário
        let experimentId = event.experiment_id

        if (!experimentId && event.experiment_key) {
          // Buscar experiment_id pelo experiment_key
          const { data: experiment } = await supabase
            .from('experiments')
            .select('id')
            .eq('id', event.experiment_key)
            .single()

          if (experiment) {
            experimentId = experiment.id
          }
        }

        if (!experimentId) {
          logger.warn('No experiment_id found for event', { eventName: event.event_name })
          results.push({ success: false, error: 'No experiment_id' })
          continue
        }

        // Preparar dados do evento (suporta tanto properties quanto event_data)
        const eventProperties = event.properties || event.event_data || {}
        const eventData: any = {
          experiment_id: experimentId,
          visitor_id: event.visitor_id,
          event_type: event.event_type,
          event_name: event.event_name,
          event_data: eventProperties,
          properties: eventProperties, // Manter ambos para compatibilidade
          value: event.value || eventProperties.conversion_value || null,
          created_at: event.timestamp || new Date().toISOString()
        }

        // Adicionar variant_id se disponível (do evento ou das properties)
        if (event.variant_id) {
          eventData.variant_id = event.variant_id
        } else if (eventProperties.variant_id) {
          eventData.variant_id = eventProperties.variant_id
        }

        // Inserir evento
        const { error: insertError } = await supabase
          .from('events')
          .insert(eventData)

        if (insertError) {
          logger.error('Failed to insert event', { error: insertError })
          results.push({ success: false, error: insertError.message })
          continue
        }

        logger.debug('Event inserted', { eventType: event.event_type })

        // Se for conversão, atualizar variant_stats
        if (event.event_type === 'conversion' && event.variant_id) {
          logger.debug('Updating conversion stats', { variantId: event.variant_id })

          const { error: rpcError } = await supabase.rpc('increment_variant_conversions', {
            p_variant_id: event.variant_id,
            p_experiment_id: experimentId,
            p_revenue: event.value || 0
          })

          if (rpcError) {
            logger.error('Failed to increment conversions', { error: rpcError })
          } else {
            logger.debug('Conversion stats updated')
          }
        }

        results.push({ success: true })
      } catch (eventError) {
        logger.error('Error processing event', { error: eventError })
        results.push({ success: false, error: eventError instanceof Error ? eventError.message : 'Unknown error' })
      }
    }

    const successCount = results.filter(r => r.success).length
    logger.info('Batch processing complete', { successful: successCount, total: events.length })

    return NextResponse.json(
      {
        success: true,
        processed: events.length,
        successful: successCount,
        failed: events.length - successCount,
        results
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    logger.error('Batch processing error', error instanceof Error ? error : { error })
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
}