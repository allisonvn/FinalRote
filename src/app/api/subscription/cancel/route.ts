/**
 * API: Cancel Subscription
 * @description Endpoint para cancelar assinatura (marca para cancelar no fim do período)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
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

    // 3. Verificar se usuário é owner ou admin
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', user.default_org_id)
      .eq('user_id', session.user.id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Buscar subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, kiwify_subscription_id, status')
      .eq('org_id', user.default_org_id)
      .in('status', ['active', 'trialing'])
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // 5. Marcar para cancelar no fim do período
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        cancel_reason: 'user_requested',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    // 6. Log do evento
    await supabase.from('subscription_logs').insert({
      subscription_id: subscription.id,
      user_id: session.user.id,
      event_type: 'cancel_requested',
      event_source: 'user',
      metadata: {
        org_id: user.default_org_id,
      },
    });

    // TODO: Cancelar também na Kiwify via API
    // if (subscription.kiwify_subscription_id) {
    //   await kiwifyClient.cancelSubscription(subscription.kiwify_subscription_id);
    // }

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of current period',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
