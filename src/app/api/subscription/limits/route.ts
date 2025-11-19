/**
 * API: Subscription Limits
 * @description Endpoint para verificar limites e uso da organização
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 1. Verificar autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Buscar organização
    const { data: user } = await supabase
      .from('users')
      .select('default_org_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.default_org_id) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    const orgId = user.default_org_id;

    // 3. Buscar limites do plano
    const { data: limitsData } = await supabase.rpc('get_organization_limits', {
      org_uuid: orgId,
    });

    // 4. Buscar features do plano
    const { data: featuresData } = await supabase.rpc('get_organization_features', {
      org_uuid: orgId,
    });

    // 5. Buscar uso atual
    const { data: usageData } = await supabase
      .from('organization_usage')
      .select('*')
      .eq('org_id', orgId)
      .order('period_start', { ascending: false })
      .limit(1)
      .single();

    // 6. Verificar permissões específicas
    const { data: canCreateExperiment } = await supabase.rpc(
      'can_create_experiment',
      { org_uuid: orgId }
    );

    const { data: canCreateProject } = await supabase.rpc('can_create_project', {
      org_uuid: orgId,
    });

    return NextResponse.json({
      limits: limitsData || {},
      features: featuresData || {},
      usage: usageData || {
        experiments_count: 0,
        active_experiments_count: 0,
        projects_count: 0,
        visitors_count: 0,
        events_count: 0,
      },
      permissions: {
        can_create_experiment: canCreateExperiment || false,
        can_create_project: canCreateProject || false,
      },
    });
  } catch (error) {
    console.error('Error fetching limits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
