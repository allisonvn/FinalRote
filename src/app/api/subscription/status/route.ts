/**
 * API: Subscription Status
 * @description Endpoint para obter status da assinatura da organização atual
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

    // 2. Buscar organização do usuário
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

    // 3. Buscar dados da subscription diretamente da tabela subscriptions
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        price_amount,
        last_payment_at,
        next_payment_at,
        canceled_at,
        cancel_reason,
        created_at,
        updated_at,
        plan:plans (
          id,
          name,
          slug,
          description,
          price,
          interval,
          features
        )
      `)
      .eq('org_id', user.default_org_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 4. Buscar dados da organização
    const { data: organization } = await supabase
      .from('organizations')
      .select('id, name, slug, is_active, is_blocked, blocked_reason')
      .eq('id', user.default_org_id)
      .single();

    // Construir resposta consolidada
    const subscriptionData = subscription ? {
      id: subscription.id,
      status: subscription.status,
      billing_cycle: subscription.billing_cycle,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      price_amount: subscription.price_amount,
      last_payment_at: subscription.last_payment_at,
      next_payment_at: subscription.next_payment_at,
      canceled_at: subscription.canceled_at,
      cancel_reason: subscription.cancel_reason,
      plan: subscription.plan,
      organization: organization,
    } : null;

    // Se não há subscription, retornar dados básicos
    if (!subscriptionData) {
      return NextResponse.json({
        subscription: null,
        organization: organization,
        has_subscription: false,
        message: 'No active subscription found'
      });
    }

    return NextResponse.json({
      subscription: subscriptionData,
      organization: organization,
      has_subscription: true,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
