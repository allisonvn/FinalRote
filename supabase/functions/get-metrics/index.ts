import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'GET') {
      throw new Error('Method not allowed')
    }

    // Get API key from header
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      throw new Error('API key required')
    }

    // Parse query parameters
    const url = new URL(req.url)
    const experimentKey = url.searchParams.get('experiment_key')
    const fromDate = url.searchParams.get('from_date')
    const toDate = url.searchParams.get('to_date')
    
    if (!experimentKey) {
      throw new Error('experiment_key is required')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate API key and get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .or(`public_key.eq.${apiKey},secret_key.eq.${apiKey}`)
      .single()

    if (projectError || !project) {
      throw new Error('Invalid API key')
    }

    // Get experiment
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .select('id, name, status, algorithm, started_at')
      .eq('project_id', project.id)
      .eq('key', experimentKey)
      .single()

    if (expError || !experiment) {
      throw new Error('Experiment not found')
    }

    // Call the metrics function
    const { data: metrics, error: metricsError } = await supabase
      .rpc('get_experiment_metrics', {
        exp_id: experiment.id,
        from_date: fromDate || experiment.started_at,
        to_date: toDate || new Date().toISOString()
      })

    if (metricsError) {
      throw metricsError
    }

    // Calculate statistical significance for each variant pair
    const variantsWithStats = []
    const controlVariant = metrics.find(m => m.variant_name === 'Controle' || m.variant_name === 'Control')
    
    for (const variant of metrics) {
      const variantData = {
        variant_id: variant.variant_id,
        variant_name: variant.variant_name,
        visitors: variant.visitors,
        conversions: variant.conversions,
        conversion_rate: variant.conversion_rate,
        revenue: variant.revenue,
        avg_value: variant.avg_value
      }

      // Calculate significance vs control
      if (controlVariant && variant.variant_id !== controlVariant.variant_id) {
        const { data: significance } = await supabase.rpc('calculate_significance', {
          control_conversions: controlVariant.conversions,
          control_visitors: controlVariant.visitors,
          variant_conversions: variant.conversions,
          variant_visitors: variant.visitors
        })

        variantData.significance = significance
      }

      variantsWithStats.push(variantData)
    }

    // Get recent events for trend analysis
    const { data: recentEvents } = await supabase
      .from('events')
      .select('created_at, event_type')
      .eq('experiment_id', experiment.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    // Calculate hourly trends
    const hourlyTrends = {}
    if (recentEvents) {
      recentEvents.forEach(event => {
        const hour = new Date(event.created_at).getHours()
        if (!hourlyTrends[hour]) {
          hourlyTrends[hour] = { visitors: 0, conversions: 0 }
        }
        if (event.event_type === 'page_view') {
          hourlyTrends[hour].visitors++
        } else if (event.event_type === 'conversion') {
          hourlyTrends[hour].conversions++
        }
      })
    }

    // Return comprehensive metrics
    const response = {
      experiment: {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        algorithm: experiment.algorithm,
        started_at: experiment.started_at
      },
      variants: variantsWithStats,
      trends: {
        hourly: hourlyTrends,
        last_updated: new Date().toISOString()
      },
      summary: {
        total_visitors: metrics.reduce((sum, v) => sum + v.visitors, 0),
        total_conversions: metrics.reduce((sum, v) => sum + v.conversions, 0),
        total_revenue: metrics.reduce((sum, v) => sum + v.revenue, 0),
        overall_conversion_rate: metrics.length > 0 
          ? (metrics.reduce((sum, v) => sum + v.conversions, 0) / 
             metrics.reduce((sum, v) => sum + v.visitors, 0) * 100).toFixed(2)
          : 0
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in get-metrics:', error)
    
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
