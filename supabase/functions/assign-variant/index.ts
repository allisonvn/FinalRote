import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  thompsonSampling,
  ucb1,
  epsilonGreedy,
  uniformDistribution,
  type VariantStats
} from './mab.ts'

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
      .select('id, status, name, conversion_url, conversion_value, conversion_type, algorithm')
      .eq('project_id', project.id)
      .eq('name', experiment_key)
      .single()

    if (expError || !experiment) {
      throw new Error('Experiment not found')
    }

    if (experiment.status !== 'running') {
      throw new Error('Experiment is not running')
    }

    // Check for existing assignment
    const { data: existingAssignment } = await supabase
      .from('assignments')
      .select('variant_id')
      .eq('experiment_id', experiment.id)
      .eq('visitor_id', visitor_id)
      .single()

    let selectedVariantId: string

    if (existingAssignment) {
      // Use existing assignment for consistent experience
      selectedVariantId = existingAssignment.variant_id
      console.log('Using existing assignment:', selectedVariantId)
    } else {
      // Get all variants for this experiment
      const { data: variants, error: variantsError } = await supabase
        .from('variants')
        .select('id, name, is_control, traffic_percentage')
        .eq('experiment_id', experiment.id)
        .order('created_at')

      if (variantsError || !variants || variants.length === 0) {
        throw new Error('No active variants found for experiment')
      }

      // Get variant stats for MAB algorithms
      const { data: stats } = await supabase
        .from('variant_stats')
        .select('variant_id, visitors, conversions, revenue')
        .eq('experiment_id', experiment.id)

      const statsMap = new Map<string, { visitors: number; conversions: number; revenue: number }>()
      if (stats) {
        for (const stat of stats) {
          statsMap.set(stat.variant_id, {
            visitors: stat.visitors || 0,
            conversions: stat.conversions || 0,
            revenue: stat.revenue || 0
          })
        }
      }

      // Prepare variant stats for MAB
      const variantStats: VariantStats[] = variants.map(v => {
        const stat = statsMap.get(v.id) || { visitors: 0, conversions: 0, revenue: 0 }
        return {
          id: v.id,
          name: v.name,
          visitors: stat.visitors,
          conversions: stat.conversions,
          revenue: stat.revenue,
          traffic_percentage: v.traffic_percentage || 50,
          is_control: v.is_control || false
        }
      })

      // Select variant using configured algorithm
      const algorithm = experiment.algorithm || 'uniform'
      const totalVisitors = variantStats.reduce((sum, v) => sum + v.visitors, 0)
      const useMAB = algorithm !== 'uniform' && totalVisitors >= 100 // Minimum 100 visitors for MAB

      let result

      if (useMAB) {
        console.log(`Using MAB algorithm: ${algorithm}, Total visitors: ${totalVisitors}`)

        switch (algorithm) {
          case 'thompson_sampling':
            result = thompsonSampling(variantStats)
            break
          case 'ucb1':
            result = ucb1(variantStats)
            break
          case 'epsilon_greedy':
            result = epsilonGreedy(variantStats)
            break
          default:
            result = uniformDistribution(variantStats, visitor_id)
        }
      } else {
        console.log('Using uniform distribution (classic A/B)')
        result = uniformDistribution(variantStats, visitor_id)
      }

      selectedVariantId = result.variantId
      console.log(`Selected variant: ${selectedVariantId}, Algorithm: ${result.algorithm}, Score: ${result.score}`)

      // Save assignment for consistent experience
      await supabase
        .from('assignments')
        .insert({
          experiment_id: experiment.id,
          visitor_id: visitor_id,
          variant_id: selectedVariantId,
          assigned_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    // Get full variant data
    const { data: selectedVariant } = await supabase
      .from('variants')
      .select('id, name, is_control, traffic_percentage')
      .eq('id', selectedVariantId)
      .single()

    if (!selectedVariant) {
      throw new Error('Selected variant not found')
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
        variant: selectedVariant.name, // SDK compatibility using name
        experiment: {
          id: experiment.id,
          name: experiment.name,
          conversion_url: experiment.conversion_url,
          conversion_type: experiment.conversion_type,
          conversion_value: experiment.conversion_value
        }
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
