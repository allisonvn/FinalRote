/**
 * API: Subscription Limits
 * @description Endpoint para verificar limites e uso da organização
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verificar autenticação
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Buscar organização
    const { data: user } = await supabase
      .from('users')
      .select('default_org_id')
      .eq('id', authUser.id)
      .single();

    if (!user?.default_org_id) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    const orgId = user.default_org_id;

    // 3. Buscar limites do plano via subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        plan:plans (
          id,
          name,
          slug,
          features
        )
      `)
      .eq('org_id', orgId)
      .in('status', ['active', 'trialing'])
      .single();

    // Extrair features do plano ou usar defaults
    const planFeatures = (subscription?.plan as any)?.features || {
      max_experiments: 10,
      max_projects: 5,
      max_visitors: 100000,
      max_events: 1000000,
      custom_domains: false,
      api_access: true
    };

    // 4. Contar uso atual diretamente das tabelas
    const [experimentsCount, projectsCount, eventsCount] = await Promise.all([
      // Contar experimentos
      supabase
        .from('experiments')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', orgId),

      // Contar projetos
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId),

      // Contar eventos (últimos 30 dias)
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    // 5. Calcular permissões baseadas nos limites
    const usage = {
      experiments_count: experimentsCount.count || 0,
      active_experiments_count: 0, // Calculate if needed
      projects_count: projectsCount.count || 0,
      visitors_count: 0, // Would need visitor tracking
      events_count: eventsCount.count || 0,
    };

    const limits = {
      max_experiments: planFeatures.max_experiments || 10,
      max_projects: planFeatures.max_projects || 5,
      max_visitors: planFeatures.max_visitors || 100000,
      max_events: planFeatures.max_events || 1000000,
    };

    const permissions = {
      can_create_experiment: (usage.experiments_count || 0) < limits.max_experiments,
      can_create_project: (usage.projects_count || 0) < limits.max_projects,
    };

    return NextResponse.json({
      limits,
      features: planFeatures,
      usage,
      permissions,
      plan: subscription?.plan || null,
    });
  } catch (error) {
    console.error('Error fetching limits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
