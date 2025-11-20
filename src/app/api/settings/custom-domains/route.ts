import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID é obrigatório' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verificar se a chave de serviço está disponível
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY não está definida')
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500, headers: corsHeaders }
      )
    }

    const supabase = createServiceClient()

    // Primeiro, tenta selecionar os domínios
    let { data, error } = await supabase
      .from('project_settings')
      .select('allowed_domains_custom')
      .eq('project_id', projectId)
      .single()

    // Se o erro for sobre tabela não encontrada, tenta criar a tabela
    if (error && (error.code === 'PGRST205' || error.message?.includes('project_settings'))) {
      console.warn(
        `⚠️ Tabela project_settings não encontrada ou não acessível. ` +
        `Tentando criar/recuperar... Code: ${error.code}`
      )
      
      // Tentar criar a tabela
      const { error: createError } = await supabase.rpc('create_project_settings_table_if_not_exists')
      
      if (createError) {
        console.warn(`⚠️ RPC create_project_settings_table_if_not_exists não disponível: ${createError.message}`)
      }
      
      // Retornar dados vazios enquanto a tabela é criada
      return NextResponse.json(
        { domains: [], warning: 'Tabela de configurações de projeto está sendo inicializada' },
        { status: 200, headers: corsHeaders }
      )
    }

    if (error) {
      // PGRST116 significa que não há registros encontrados - isso é OK, retornamos array vazio
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { domains: [] },
          { status: 200, headers: corsHeaders }
        )
      }
      
      // Outros erros são tratados como erro real
      const errorResponse = { 
        error: 'Erro ao buscar domínios personalizados', 
        code: error.code || 'UNKNOWN',
        message: error.message || 'Erro desconhecido'
      }
      
      console.error(
        `Erro ao buscar domínios personalizados - Code: ${error.code}, ` +
        `Message: ${error.message}, Details: ${error.details}, ` +
        `Hint: ${error.hint}, ProjectId: ${projectId}`
      )
      
      return NextResponse.json(errorResponse, { status: 500, headers: corsHeaders })
    }

    // Se não houver erro, retornar os domínios (ou array vazio se não houver)
    const domains = data?.allowed_domains_custom || []
    
    // Garantir que domains é um array válido
    const validDomains = Array.isArray(domains) ? domains : []
    
    const responseData = { domains: validDomains }
    
    return NextResponse.json(responseData, { status: 200, headers: corsHeaders })

  } catch (error: any) {
    const errorResponse = {
      error: 'Erro interno do servidor',
      message: error?.message || String(error) || 'Erro desconhecido'
    }
    
    console.error(
      `Erro inesperado ao buscar domínios personalizados - ` +
      `Name: ${error?.name}, Message: ${error?.message}, Stack: ${error?.stack}`
    )
    
    return NextResponse.json(errorResponse, { status: 500, headers: corsHeaders })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, domains } = await request.json()

    if (!projectId || !Array.isArray(domains)) {
      return NextResponse.json({ error: 'Project ID e domínios são obrigatórios e devem ser um array' }, { status: 400, headers: corsHeaders })
    }

    // Verificar se a chave de serviço está disponível
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY não está definida')
      return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500, headers: corsHeaders })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('project_settings')
      .upsert(
        { project_id: projectId, allowed_domains_custom: domains },
        { onConflict: 'project_id' }
      )

    if (error) {
      console.error(
        `Erro ao salvar domínios personalizados - Code: ${error.code}, ` +
        `Message: ${error.message}, Details: ${error.details}, Hint: ${error.hint}`
      )
      return NextResponse.json({ 
        error: 'Erro ao salvar domínios personalizados',
        code: error.code,
        message: error.message
      }, { status: 500, headers: corsHeaders })
    }

    return NextResponse.json({ message: 'Domínios personalizados salvos com sucesso' }, { status: 200, headers: corsHeaders })

  } catch (error: any) {
    console.error(
      `Erro inesperado ao salvar domínios personalizados - ` +
      `Name: ${error?.name}, Message: ${error?.message}, Stack: ${error?.stack}`
    )
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error?.message || String(error)
    }, { status: 500, headers: corsHeaders })
  }
}
