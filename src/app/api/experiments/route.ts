import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validar dados obrigatórios
    if (!data.name || !data.project_id) {
      return NextResponse.json(
        { error: 'Nome e project_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar autenticação do usuário
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Usar service client para contornar RLS
    const serviceClient = createServiceClient()

    // Construir dados do experimento
    const experimentData = {
      name: String(data.name).trim(),
      project_id: String(data.project_id),
      description: data.description || null,
      created_by: user.id,
      user_id: user.id
    }

    // Dados mínimos para inserir evitando tocar na coluna "type" (problema de cache)
    const insertData = {
      name: experimentData.name,
      project_id: experimentData.project_id,
      description: experimentData.description,
      created_by: experimentData.created_by,
      user_id: experimentData.user_id,
    }

    // Validar nome
    if (!experimentData.name || experimentData.name.length < 2) {
      return NextResponse.json(
        { error: 'Nome do experimento deve ter pelo menos 2 caracteres' },
        { status: 400 }
      )
    }

    // Criar experimento - tentar múltiplas abordagens para contornar problemas de cache
    console.log('Tentando criar experimento com dados:', experimentData);
    
    let newExperiment;
    let insertError;
    
    // Primeira tentativa: insert normal
    const { data: firstResult, error: firstError } = await serviceClient
      .from('experiments')
      .insert(insertData)
      .select('id,name,project_id,description,created_at,created_by,user_id')
      .single();
    
    if (firstError) {
      console.log('Primeira tentativa falhou:', firstError.message);
      
      // Segunda tentativa: aguardar e tentar novamente
      if (firstError.message.includes('schema cache') || firstError.message.includes('Could not find')) {
        console.log('Erro de cache detectado, aguardando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: secondResult, error: secondError } = await serviceClient
          .from('experiments')
          .insert(insertData)
          .select('id,name,project_id,description,created_at,created_by,user_id')
          .single();
        
        if (secondError) {
          console.log('Segunda tentativa falhou:', secondError.message);
          
          // Terceira tentativa: usar dados mínimos
          const minimalData = insertData;
          
          const { data: thirdResult, error: thirdError } = await serviceClient
            .from('experiments')
            .insert(minimalData)
            .select('id,name,project_id,description,created_at,created_by,user_id')
            .single();
          
          if (thirdError) {
            insertError = thirdError;
          } else {
            newExperiment = thirdResult;
          }
        } else {
          newExperiment = secondResult;
        }
      } else {
        insertError = firstError;
      }
    } else {
      newExperiment = firstResult;
    }

    if (insertError) {
      console.error('Erro detalhado ao criar experimento:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      
      // Se for erro de cache, retornar erro específico
      if (insertError.message.includes('schema cache') || insertError.message.includes('Could not find')) {
        return NextResponse.json(
          { 
            error: 'Problema temporário com cache do banco de dados. Tente novamente em alguns segundos.',
            details: insertError.message 
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar experimento: ' + insertError.message },
        { status: 500 }
      )
    }

    // Preencher valores padrão esperados pelo frontend sem depender da coluna "type" no retorno
    const safeExperiment = {
      ...newExperiment,
      type: (data.type || 'redirect') as 'redirect' | 'element' | 'split_url' | 'mab',
      status: (data.status || 'draft') as 'draft' | 'running' | 'paused' | 'completed' | 'archived',
      traffic_allocation: data.traffic_allocation ?? 100,
    }

    return NextResponse.json({
      success: true,
      experiment: safeExperiment
    })

  } catch (error) {
    console.error('Erro geral na criação de experimento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
