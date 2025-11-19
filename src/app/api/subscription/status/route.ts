/**
 * API: Subscription Status
 * @description Endpoint para obter status da assinatura da organização atual
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

    // 2. Buscar organização do usuário
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

    // 3. Buscar dados completos da subscription via view
    const { data: subscriptionData, error } = await supabase
      .from('organization_subscription_view')
      .select('*')
      .eq('org_id', user.default_org_id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscription: subscriptionData,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
