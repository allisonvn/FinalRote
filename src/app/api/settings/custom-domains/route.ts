import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID é obrigatório' }, { status: 400, headers: corsHeaders })
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('project_settings')
      .select('allowed_domains_custom')
      .eq('project_id', projectId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Erro ao buscar domínios personalizados:', error)
      return NextResponse.json({ error: 'Erro ao buscar domínios personalizados' }, { status: 500, headers: corsHeaders })
    }

    const domains = data?.allowed_domains_custom || []
    return NextResponse.json({ domains }, { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('Erro inesperado ao buscar domínios personalizados:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500, headers: corsHeaders })
  }
}

export async function POST(request: NextRequest) {
  const { projectId, domains } = await request.json()

  if (!projectId || !Array.isArray(domains)) {
    return NextResponse.json({ error: 'Project ID e domínios são obrigatórios e devem ser um array' }, { status: 400, headers: corsHeaders })
  }

  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('project_settings')
      .upsert(
        { project_id: projectId, allowed_domains_custom: domains },
        { onConflict: 'project_id' }
      )

    if (error) {
      console.error('Erro ao salvar domínios personalizados:', error)
      return NextResponse.json({ error: 'Erro ao salvar domínios personalizados' }, { status: 500, headers: corsHeaders })
    }

    return NextResponse.json({ message: 'Domínios personalizados salvos com sucesso' }, { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('Erro inesperado ao salvar domínios personalizados:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500, headers: corsHeaders })
  }
}
