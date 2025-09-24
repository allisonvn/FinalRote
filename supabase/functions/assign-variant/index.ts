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

    // Get experiment (using key field)
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .select('id, status, name, key')
      .eq('project_id', project.id)
      .eq('key', experiment_key)
      .single()

    if (expError || !experiment) {
      throw new Error('Experiment not found')
    }

    if (experiment.status !== 'running') {
      throw new Error('Experiment is not running')
    }

    // Check existing assignment (correct table name)
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
        .select('id, name, key, is_control, config')
        .eq('id', existingAssignment.variant_id)
        .single()

      return new Response(
        JSON.stringify({
          variant_id: variant.id,
          variant_key: variant.key,
          variant_name: variant.name,
          config: variant.config || {},
          is_new: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Get all variants for this experiment (correct field names)
    const { data: variants, error: variantsError } = await supabase
      .from('variants')
      .select('id, name, key, is_control, weight, config')
      .eq('experiment_id', experiment.id)
      .order('created_at')

    if (variantsError || !variants || variants.length === 0) {
      throw new Error('No active variants found for experiment')
    }

    // Simple random assignment based on weight
    const random = Math.random() * 100
    let cumulative = 0
    let selectedVariant = variants[0] // Fallback to first variant

    for (const variant of variants) {
      cumulative += variant.weight
      if (random <= cumulative) {
        selectedVariant = variant
        break
      }
    }

    // Save assignment (correct table and fields)
    const { error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        experiment_id: experiment.id,
        variant_id: selectedVariant.id,
        visitor_id: visitor_id,
        context: context || {}
      })

    if (assignmentError) {
      console.error('Error saving assignment:', assignmentError)
      // Continue even if assignment save fails
    }

    // Log the assignment event (correct field names)
    await supabase.from('events').insert({
      project_id: project.id,
      experiment_id: experiment.id,
      visitor_id: visitor_id,
      event_type: 'experiment_assignment',
      event_name: 'variant_assigned',
      properties: {
        variant_id: selectedVariant.id,
        variant_key: selectedVariant.key,
        variant_name: selectedVariant.name,
        page_url: req.headers.get('referer') || '',
        ...context
      }
    })

    return new Response(
      JSON.stringify({
        variant_id: selectedVariant.id,
        variant_key: selectedVariant.key,
        variant_name: selectedVariant.name,
        config: selectedVariant.config || {},
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
