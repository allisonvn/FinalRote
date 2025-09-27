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

    // Parse request body
    const { experiment_key, visitor_id, context = {} }: AssignRequest = await req.json()
    
    if (!experiment_key || !visitor_id) {
      throw new Error('experiment_key and visitor_id are required')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Simplified: Use default project (no API key required)
    // Get the first available project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .limit(1)
      .single();

    if (projectError || !project) {
      throw new Error('No project found')
    }

    // Validate origin if provided (simplified - allow all in development)
    const origin = req.headers.get('origin')
    // For now, allow all origins - can be restricted later if needed

    // Get experiment by name (using name field instead of key)
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .select('id, status, name')
      .eq('project_id', project.id)
      .eq('name', experiment_key)
      .single()

    if (expError || !experiment) {
      throw new Error('Experiment not found')
    }

    if (experiment.status !== 'running') {
      throw new Error('Experiment is not running')
    }

    // For now, skip assignment tracking and always assign randomly
    // TODO: Implement assignment table for consistent user experience

    // Get all variants for this experiment (using name instead of key)
    const { data: variants, error: variantsError } = await supabase
      .from('variants')
      .select('id, name, is_control, traffic_percentage')
      .eq('experiment_id', experiment.id)
      .order('created_at')

    if (variantsError || !variants || variants.length === 0) {
      throw new Error('No active variants found for experiment')
    }

    // Simple random assignment based on traffic_percentage
    const random = Math.random() * 100
    let cumulative = 0
    let selectedVariant = variants[0] // Fallback to first variant

    for (const variant of variants) {
      cumulative += (variant.traffic_percentage || 50) // Default 50% if null
      if (random <= cumulative) {
        selectedVariant = variant
        break
      }
    }

    // Skip assignment saving for now
    // TODO: Implement assignment table

    // Log the assignment event (correct field names)
    await supabase.from('events').insert({
      project_id: project.id,
      experiment_id: experiment.id,
      visitor_id: visitor_id,
      event_type: 'experiment_assignment',
      event_name: 'variant_assigned',
      properties: {
        variant_id: selectedVariant.id,
        variant_key: selectedVariant.name, // Using name as key
        variant_name: selectedVariant.name,
        page_url: req.headers.get('referer') || '',
        ...context
      }
    })

    return new Response(
      JSON.stringify({
        variant_id: selectedVariant.id,
        variant_key: selectedVariant.name, // Using name as key
        variant_name: selectedVariant.name,
        config: {},
        is_new: true,
        variant: selectedVariant.name // SDK compatibility using name
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
