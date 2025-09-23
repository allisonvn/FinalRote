import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface TrackRequest {
  events: Array<{
    visitor_id: string
    event_type: string
    event_name: string
    properties?: Record<string, any>
    value?: number
    experiment_key?: string
    timestamp?: string
  }>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Get API key from header
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      throw new Error('API key required')
    }

    // Parse request body
    const { events }: TrackRequest = await req.json()
    
    if (!events || !Array.isArray(events) || events.length === 0) {
      throw new Error('events array is required')
    }

    // Validate events limit
    if (events.length > 100) {
      throw new Error('Maximum 100 events per request')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate API key and get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, allowed_origins')
      .or(`public_key.eq.${apiKey},secret_key.eq.${apiKey}`)
      .single()

    if (projectError || !project) {
      throw new Error('Invalid API key')
    }

    // Validate origin if provided
    const origin = req.headers.get('origin')
    if (origin && project.allowed_origins?.length > 0) {
      const isAllowed = project.allowed_origins.some((allowed: string) => {
        if (allowed.includes('*')) {
          const pattern = allowed.replace(/\*/g, '.*')
          return new RegExp(`^${pattern}$`).test(origin)
        }
        return allowed === origin
      })

      if (!isAllowed) {
        throw new Error('Origin not allowed')
      }
    }

    // Process events
    const processedEvents = []
    const errors = []

    for (const event of events) {
      try {
        // Validate required fields
        if (!event.visitor_id || !event.event_type || !event.event_name) {
          throw new Error('visitor_id, event_type, and event_name are required')
        }

        // Get experiment if specified
        let experimentId = null
        if (event.experiment_key) {
          const { data: experiment } = await supabase
            .from('experiments')
            .select('id')
            .eq('project_id', project.id)
            .eq('key', event.experiment_key)
            .single()

          if (experiment) {
            experimentId = experiment.id
          }
        }

        // Prepare event data
        const eventData = {
          project_id: project.id,
          experiment_id: experimentId,
          visitor_id: event.visitor_id,
          event_type: event.event_type,
          event_name: event.event_name,
          properties: event.properties || {},
          value: event.value || null,
          created_at: event.timestamp || new Date().toISOString()
        }

        processedEvents.push(eventData)
      } catch (error) {
        errors.push({
          event,
          error: error.message
        })
      }
    }

    // Batch insert events
    if (processedEvents.length > 0) {
      const { error: insertError } = await supabase
        .from('events')
        .insert(processedEvents)

      if (insertError) {
        console.error('Error inserting events:', insertError)
        throw new Error('Failed to insert events')
      }
    }

    // Update visitor sessions
    const uniqueVisitors = [...new Set(events.map(e => e.visitor_id))]
    for (const visitorId of uniqueVisitors) {
      // Get user agent and other metadata
      const userAgent = req.headers.get('user-agent') || ''
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                  req.headers.get('x-real-ip') || 
                  'unknown'

      // Update or create session
      await supabase.from('visitor_sessions').upsert({
        project_id: project.id,
        visitor_id: visitorId,
        session_id: `${visitorId}_${new Date().toISOString().split('T')[0]}`,
        user_agent: userAgent,
        ip_address: ip === 'unknown' ? null : ip,
        referrer: req.headers.get('referer'),
        events_count: processedEvents.filter(e => e.visitor_id === visitorId).length,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,visitor_id,session_id',
        ignoreDuplicates: false
      })
    }

    // Return response
    const response = {
      success: true,
      processed: processedEvents.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in track-event:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message?.includes('Invalid') || error.message?.includes('required') ? 400 : 500
      }
    )
  }
})
