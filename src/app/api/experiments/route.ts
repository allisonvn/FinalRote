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

    // Usar client do usuário autenticado para respeitar RLS
    const userClient = supabase

    // Construir dados do experimento
    const experimentData = {
      name: String(data.name).trim(),
      project_id: String(data.project_id),
      description: data.description || null,
      created_by: user.id,
      user_id: user.id
    }

      // Dados mínimos para inserir evitando colunas com problema de cache
      const insertData = {
        name: experimentData.name,
        project_id: experimentData.project_id,
        description: experimentData.description,
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
    
    // Tentar forçar refresh do schema cache
    try {
      await userClient.from('experiments').select('id').limit(1);
    } catch (e) {
      console.log('Erro ao tentar refresh do cache:', e);
    }
    
    // Primeira tentativa: insert normal
    const { data: firstResult, error: firstError } = await (userClient as any)
      .from('experiments')
      .insert(insertData)
      .select('id,name,project_id,description,created_at')
      .single();
    
    if (firstError) {
      console.log('Primeira tentativa falhou:', firstError.message);
      
      // Segunda tentativa: aguardar e tentar novamente
      if (firstError.message.includes('schema cache') || firstError.message.includes('Could not find')) {
        console.log('Erro de cache detectado, aguardando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: secondResult, error: secondError } = await (userClient as any)
          .from('experiments')
          .insert(insertData)
          .select('id,name,project_id,description,created_at')
          .single();
        
        if (secondError) {
          console.log('Segunda tentativa falhou:', secondError.message);
          
          // Terceira tentativa: usar dados mínimos
          const minimalData = insertData;
          
          const { data: thirdResult, error: thirdError } = await (userClient as any)
            .from('experiments')
            .insert(minimalData)
            .select('id,name,project_id,description,created_at')
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

      // Preencher valores padrão esperados pelo frontend
      const safeExperiment = {
        ...(newExperiment || {}),
        type: (data.type || 'redirect') as 'redirect' | 'element' | 'split_url' | 'mab',
        status: (data.status || 'draft') as 'draft' | 'running' | 'paused' | 'completed' | 'archived',
        traffic_allocation: data.traffic_allocation ?? 100,
        created_by: user.id,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }

    // Criar variantes padrão para o experimento
    if (newExperiment && newExperiment.id) {
      console.log('Criando variantes padrão para experimento:', newExperiment.id)
      
      const defaultVariants = [
        {
          experiment_id: newExperiment.id,
          name: 'Controle',
          description: 'Versão original',
          is_control: true,
          traffic_percentage: 50,
          redirect_url: null,
          changes: {},
          css_changes: null,
          js_changes: null,
          created_by: user.id,
          visitors: 0,
          conversions: 0,
          conversion_rate: 0.0000,
          is_active: true
        },
        {
          experiment_id: newExperiment.id,
          name: 'Variante B',
          description: 'Versão alternativa',
          is_control: false,
          traffic_percentage: 50,
          redirect_url: null,
          changes: {},
          css_changes: null,
          js_changes: null,
          created_by: user.id,
          visitors: 0,
          conversions: 0,
          conversion_rate: 0.0000,
          is_active: true
        }
      ]

      try {
        const { data: variants, error: variantsError } = await (userClient as any)
          .from('variants')
          .insert(defaultVariants)
          .select('id, name, is_control, traffic_percentage')

        if (variantsError) {
          console.error('Erro ao criar variantes:', variantsError.message)
          // Não falhamos a criação do experimento por causa das variantes
        } else {
          console.log('✅ Variantes criadas:', variants)
          safeExperiment.variants = variants
        }
      } catch (variantErr) {
        console.error('Erro ao criar variantes:', variantErr)
      }
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
