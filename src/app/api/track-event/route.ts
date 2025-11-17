import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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

    console.log(`📊 [BATCH] Processing ${events.length} events`)

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
          console.warn('❌ [WARNING] No experiment_id found for event:', event.event_name)
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
          console.error('❌ [ERROR] Failed to insert event:', insertError)
          results.push({ success: false, error: insertError.message })
          continue
        }

        console.log(`✅ [SUCCESS] Event inserted: ${event.event_type}`)

        // Se for conversão, atualizar variant_stats
        if (event.event_type === 'conversion' && event.variant_id) {
          console.log(`📈 [CONVERSION] Updating stats for variant: ${event.variant_id}`)

          const { error: rpcError } = await supabase.rpc('increment_variant_conversions', {
            p_variant_id: event.variant_id,
            p_experiment_id: experimentId,
            p_revenue: event.value || 0
          })

          if (rpcError) {
            console.error('❌ [ERROR] Failed to increment conversions:', rpcError)
          } else {
            console.log('✅ [SUCCESS] Conversion stats updated')
          }
        }

        results.push({ success: true })
      } catch (eventError) {
        console.error('❌ [ERROR] Error processing event:', eventError)
        results.push({ success: false, error: eventError instanceof Error ? eventError.message : 'Unknown error' })
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(`📊 [BATCH] Processed ${successCount}/${events.length} events successfully`)

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
    console.error('❌ [ERROR] Batch processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
}