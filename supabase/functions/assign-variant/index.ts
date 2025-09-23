import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface AssignRequest {
  experiment_key: string
  visitor_id: string
  context?: Record<string, any>
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
    const { experiment_key, visitor_id, context = {} }: AssignRequest = await req.json()
    
    if (!experiment_key || !visitor_id) {
      throw new Error('experiment_key and visitor_id are required')
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

    // Get experiment
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .select('id, status')
      .eq('project_id', project.id)
      .eq('key', experiment_key)
      .single()

    if (expError || !experiment) {
      throw new Error('Experiment not found')
    }

    if (experiment.status !== 'running') {
      throw new Error('Experiment is not running')
    }

    // Check existing assignment
    const { data: existingAssignment } = await supabase
      .from('assignments')
      .select('variant_id')
      .eq('experiment_id', experiment.id)
      .eq('visitor_id', visitor_id)
      .single()

    if (existingAssignment) {
      // Return existing assignment
      const { data: variant } = await supabase
        .from('variants')
        .select('id, key, name, config')
        .eq('id', existingAssignment.variant_id)
        .single()

      return new Response(
        JSON.stringify({
          variant_id: variant.id,
          variant_key: variant.key,
          variant_name: variant.name,
          config: variant.config,
          is_new: false
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Assign new variant using MAB algorithm
    const { data: assignResult, error: assignError } = await supabase
      .rpc('assign_variant', {
        exp_id: experiment.id,
        visitor_id: visitor_id,
        context_data: context
      })

    if (assignError) {
      throw assignError
    }

    // Get assigned variant details
    const { data: variant } = await supabase
      .from('variants')
      .select('id, key, name, config')
      .eq('id', assignResult)
      .single()

    // Log the assignment event
    await supabase.from('events').insert({
      project_id: project.id,
      experiment_id: experiment.id,
      visitor_id: visitor_id,
      event_type: 'assignment',
      event_name: 'variant_assigned',
      properties: {
        variant_id: variant.id,
        variant_key: variant.key,
        context
      }
    })

    return new Response(
      JSON.stringify({
        variant_id: variant.id,
        variant_key: variant.key,
        variant_name: variant.name,
        config: variant.config,
        is_new: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in assign-variant:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message?.includes('not found') || error.message?.includes('Invalid') ? 400 : 500
      }
    )
  }
})
