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

    // Validate API key from headers
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')
    let project: { id: string } | null = null

    if (apiKey) {
      // Try to find project by API key (public_key)
      const { data: projectByKey, error: keyError } = await supabase
        .from('projects')
        .select('id')
        .or(`public_key.eq.${apiKey},secret_key.eq.${apiKey}`)
        .single()

      if (!keyError && projectByKey) {
        project = projectByKey
        console.log('Project found by API key:', project.id)
      }
    }

    // Fallback: Get first available project (development mode)
    if (!project) {
      const { data: defaultProject, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .limit(1)
        .single()

      if (projectError || !defaultProject) {
        throw new Error('No project found. Please provide a valid API key.')
      }
      project = defaultProject
      console.warn('Using default project (no API key provided)')
    }

    // Validate origin if provided
    const origin = req.headers.get('origin')
    if (origin && project) {
      const { data: projectWithOrigins } = await supabase
        .from('projects')
        .select('allowed_origins')
        .eq('id', project.id)
        .single()

      if (projectWithOrigins?.allowed_origins?.length > 0) {
        const isAllowedOrigin = projectWithOrigins.allowed_origins.some(
          (allowed: string) => allowed === '*' || origin.includes(allowed)
        )
        if (!isAllowedOrigin) {
          console.warn(`Origin ${origin} not in allowed list`)
          // For now, just warn - can be enforced later
        }
      }
    }

    // Get experiment by key or name
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .select('id, status, name, key, conversion_url, conversion_value, conversion_type, algorithm')
      .eq('project_id', project.id)
      .or(`key.eq.${experiment_key},name.eq.${experiment_key}`)
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
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          experiment_id: experiment.id,
          visitor_id: visitor_id,
          variant_id: selectedVariantId,
          context: context,
          assigned_at: new Date().toISOString()
        })
        .select()
        .single()

      if (!assignmentError) {
        // CRITICAL: Increment visitor count for MAB algorithms
        const { error: incrementError } = await supabase.rpc('increment_variant_visitors', {
          p_variant_id: selectedVariantId,
          p_experiment_id: experiment.id
        })

        if (incrementError) {
          console.error('Failed to increment visitor count:', incrementError)
          // Continue anyway - assignment was saved
        } else {
          console.log('Visitor count incremented for variant:', selectedVariantId)
        }
      } else {
        console.error('Failed to save assignment:', assignmentError)
      }
    }

    // Get full variant data
    const { data: selectedVariant } = await supabase
      .from('variants')
      .select('id, name, key, is_control, traffic_percentage')
      .eq('id', selectedVariantId)
      .single()

    if (!selectedVariant) {
      throw new Error('Selected variant not found')
    }

    // Log the assignment event (correct field names)
    await supabase.from('events').insert({
      project_id: project.id,
      experiment_id: experiment.id,
      variant_id: selectedVariant.id,
      visitor_id: visitor_id,
      event_type: 'experiment_assignment',
      event_name: 'variant_assigned',
      properties: {
        variant_id: selectedVariant.id,
        variant_key: selectedVariant.key || selectedVariant.name,
        variant_name: selectedVariant.name,
        page_url: req.headers.get('referer') || '',
        ...context
      },
      event_data: {
        variant_id: selectedVariant.id,
        variant_key: selectedVariant.key || selectedVariant.name,
        is_control: selectedVariant.is_control
      }
    })

    return new Response(
      JSON.stringify({
        variant_id: selectedVariant.id,
        variant_key: selectedVariant.key || selectedVariant.name,
        variant_name: selectedVariant.name,
        config: {},
        is_new: !existingAssignment,
        variant: selectedVariant.key || selectedVariant.name, // SDK compatibility
        experiment: {
          id: experiment.id,
          name: experiment.name,
          key: experiment.key || experiment.name,
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
