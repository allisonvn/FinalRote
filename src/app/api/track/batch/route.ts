import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { config } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events } = body

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Events array required' }, { status: 400 })
    }

    // Validar API key
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    const supabase = createClient()

    // Verificar API key
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('api_key', apiKey)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const results = []
    const eventsToInsert = []

    // Processar cada evento
    for (const event of events) {
      try {
        const {
          experimentId,
          userId,
          eventType,
          properties,
          timestamp,
          url,
          referrer,
          userAgent,
          variant
        } = event

        // Buscar atribuição
        const { data: assignment } = await supabase
          .from('assignments')
          .select(`
            variant_id,
            variant:variants(key, name)
          `)
          .eq('experiment_id', experimentId)
          .eq('user_id', userId)
          .single()

        if (assignment) {
          // Preparar evento para inserção em batch
          eventsToInsert.push({
            experiment_id: experimentId,
            variant_id: assignment.variant_id,
            user_id: userId,
            event_type: eventType,
            event_data: {
              properties: properties || {},
              url,
              referrer,
              user_agent: userAgent,
              timestamp: timestamp || new Date().toISOString()
            },
            created_at: new Date().toISOString()
          })

          results.push({ success: true, eventType })
        } else {
          results.push({ success: false, eventType, error: 'Assignment not found' })
        }
      } catch (error) {
        results.push({ success: false, eventType: event.eventType, error: 'Processing failed' })
      }
    }

    // Inserir todos os eventos de uma vez
    if (eventsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('events')
        .insert(eventsToInsert)

      if (insertError) {
        console.error('Batch insert error:', insertError)
        return NextResponse.json({ error: 'Failed to insert events' }, { status: 500 })
      }

      // Atualizar métricas para conversões
      const conversions = eventsToInsert.filter(e => e.event_type === 'conversion')
      for (const conversion of conversions) {
        await updateConversionMetrics(
          supabase,
          conversion.experiment_id,
          conversion.variant_id,
          conversion.event_data.properties?.value || 1
        )
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      inserted: eventsToInsert.length,
      results
    })

  } catch (error) {
    console.error('Batch tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Função auxiliar para atualizar métricas de conversão
async function updateConversionMetrics(
  supabase: any,
  experimentId: string,
  variantId: string,
  value: number
) {
  try {
    // Buscar ou criar snapshot de métricas diário
    const today = new Date().toISOString().split('T')[0]

    const { data: existingSnapshot } = await supabase
      .from('metrics_snapshots')
      .select('*')
      .eq('experiment_id', experimentId)
      .eq('variant_id', variantId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .single()

    if (existingSnapshot) {
      // Atualizar snapshot existente
      await supabase
        .from('metrics_snapshots')
        .update({
          conversions: (existingSnapshot.conversions || 0) + 1,
          revenue: (existingSnapshot.revenue || 0) + value,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSnapshot.id)
    } else {
      // Calcular métricas atuais
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('variant_id', variantId)

      const { data: conversions } = await supabase
        .from('events')
        .select('id')
        .eq('variant_id', variantId)
        .eq('event_type', 'conversion')

      const visitors = assignments?.length || 0
      const totalConversions = conversions?.length || 0

      // Criar novo snapshot
      await supabase
        .from('metrics_snapshots')
        .insert({
          experiment_id: experimentId,
          variant_id: variantId,
          visitors: visitors,
          conversions: totalConversions,
          revenue: value,
          conversion_rate: visitors > 0 ? totalConversions / visitors : 0,
          created_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Error updating conversion metrics:', error)
  }
}

// CORS headers
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RF-Version',
    },
  })
}