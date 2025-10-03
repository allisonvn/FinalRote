import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const testData = {
      experiment_id: 'c9226905-fd8e-4460-8b36-2c13371b0a5d',
      variant_id: null,
      visitor_id: 'test-supabase-api',
      event_type: 'page_view',
      event_name: 'page_view',
      event_data: { variant: null, url: 'https://esmalt.com.br' },
      utm_data: {},
      value: null,
      created_at: new Date().toISOString()
    }

    const { error: insertError } = await supabase
      .from('events')
      .insert(testData)

    if (insertError) {
      return NextResponse.json({
        error: 'Erro no Supabase',
        debug: insertError
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase funcionando'
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Erro geral',
      debug: error.message
    })
  }
}
