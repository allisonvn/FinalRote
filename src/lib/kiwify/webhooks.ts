/**
 * Kiwify Webhook Processing
 * @description Funções para validar e processar webhooks da Kiwify
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import {
  type KiwifyWebhookPayload,
  type ProcessWebhookResult,
  type WebhookValidationResult,
  KiwifyStatusMap,
} from '@/types/kiwify';

/**
 * Validar assinatura do webhook da Kiwify
 */
export function validateKiwifyWebhook(
  payload: string,
  signature: string,
  secret: string
): WebhookValidationResult {
  try {
    // Kiwify usa HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return {
      valid: isValid,
      error: isValid ? undefined : 'Invalid webhook signature',
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation error',
    };
  }
}

/**
 * Processar webhook da Kiwify
 */
export async function processKiwifyWebhook(
  webhook: KiwifyWebhookPayload
): Promise<ProcessWebhookResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    switch (webhook.event) {
      case 'purchase.approved':
        return await handlePurchaseApproved(webhook, supabase);

      case 'subscription.created':
      case 'subscription.updated':
        return await handleSubscriptionUpdated(webhook, supabase);

      case 'subscription.canceled':
        return await handleSubscriptionCanceled(webhook, supabase);

      case 'payment.approved':
        return await handlePaymentApproved(webhook, supabase);

      case 'payment.late':
      case 'payment.refused':
        return await handlePaymentIssue(webhook, supabase);

      case 'payment.refunded':
      case 'purchase.chargeback':
        return await handleRefundOrChargeback(webhook, supabase);

      default:
        return {
          success: true,
          action: 'ignored',
          error: `Event type not handled: ${webhook.event}`,
        };
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      success: false,
      action: 'ignored',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handler: Purchase Approved
 */
async function handlePurchaseApproved(
  webhook: KiwifyWebhookPayload,
  supabase: ReturnType<typeof createClient>
): Promise<ProcessWebhookResult> {
  if (webhook.data.event_type !== 'purchase.approved') {
    return { success: false, action: 'ignored', error: 'Invalid event type' };
  }

  const { purchase } = webhook.data;
  const customerEmail = purchase.customer.email;

  // 1. Verificar se usuário já existe
  const { data: existingUser } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', customerEmail)
    .single();

  let userId = existingUser?.id;

  // 2. Se não existir, criar usuário
  if (!userId) {
    const { data: newUser, error: signUpError } =
      await supabase.auth.admin.createUser({
        email: customerEmail,
        email_confirm: true,
        user_metadata: {
          full_name: purchase.customer.name,
          cpf_cnpj: purchase.customer.cpf,
        },
      });

    if (signUpError || !newUser.user) {
      return {
        success: false,
        action: 'ignored',
        error: `Failed to create user: ${signUpError?.message}`,
      };
    }

    userId = newUser.user.id;
  }

  // 3. Buscar plano correspondente ao produto da Kiwify
  const { data: plan } = await supabase
    .from('plans')
    .select('id')
    .eq('kiwify_product_id', purchase.product.id)
    .single();

  if (!plan) {
    return {
      success: false,
      action: 'ignored',
      error: `No plan found for product: ${purchase.product.id}`,
    };
  }

  // 4. Criar ou atualizar assinatura
  const subscriptionData = {
    user_id: userId,
    plan_id: plan.id,
    kiwify_subscription_id: purchase.subscription?.id || purchase.order_id,
    kiwify_customer_id: purchase.customer.id,
    kiwify_order_id: purchase.order_id,
    status: 'active' as const,
    billing_cycle: purchase.subscription?.plan.interval || 'monthly',
    current_period_start: new Date().toISOString(),
    current_period_end:
      purchase.subscription?.current_period_end ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 dias
    price_amount: purchase.payment.amount,
    last_payment_at: purchase.payment.paid_at || new Date().toISOString(),
    next_payment_at:
      purchase.subscription?.current_period_end ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'kiwify_subscription_id',
    })
    .select('id')
    .single();

  if (subError || !subscription) {
    return {
      success: false,
      action: 'ignored',
      error: `Failed to create subscription: ${subError?.message}`,
    };
  }

  // 5. Log do evento
  await supabase.from('subscription_logs').insert({
    subscription_id: subscription.id,
    user_id: userId,
    event_type: 'purchase',
    event_source: 'kiwify',
    new_status: 'active',
    new_plan_id: plan.id,
    metadata: {
      order_id: purchase.order_id,
      payment_method: purchase.payment.payment_method,
      amount: purchase.payment.amount,
    },
  });

  return {
    success: true,
    action: 'created',
    subscriptionId: subscription.id,
    userId,
  };
}

/**
 * Handler: Subscription Updated
 */
async function handleSubscriptionUpdated(
  webhook: KiwifyWebhookPayload,
  supabase: ReturnType<typeof createClient>
): Promise<ProcessWebhookResult> {
  if (
    webhook.data.event_type !== 'subscription.created' &&
    webhook.data.event_type !== 'subscription.updated'
  ) {
    return { success: false, action: 'ignored', error: 'Invalid event type' };
  }

  const { subscription: kiwifySub } = webhook.data;

  // Buscar assinatura existente
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, user_id, status')
    .eq('kiwify_subscription_id', kiwifySub.id)
    .single();

  if (!existingSub) {
    return {
      success: false,
      action: 'ignored',
      error: 'Subscription not found',
    };
  }

  // Atualizar status
  const newStatus = KiwifyStatusMap[kiwifySub.status];

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: newStatus,
      current_period_start: kiwifySub.current_period_start,
      current_period_end: kiwifySub.current_period_end,
      cancel_at_period_end: kiwifySub.cancel_at_period_end,
      canceled_at: kiwifySub.canceled_at || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingSub.id);

  if (updateError) {
    return {
      success: false,
      action: 'ignored',
      error: `Failed to update subscription: ${updateError.message}`,
    };
  }

  // Log do evento
  await supabase.from('subscription_logs').insert({
    subscription_id: existingSub.id,
    user_id: existingSub.user_id,
    event_type: 'updated',
    event_source: 'kiwify',
    old_status: existingSub.status,
    new_status: newStatus,
  });

  return {
    success: true,
    action: 'updated',
    subscriptionId: existingSub.id,
    userId: existingSub.user_id,
  };
}

/**
 * Handler: Subscription Canceled
 */
async function handleSubscriptionCanceled(
  webhook: KiwifyWebhookPayload,
  supabase: ReturnType<typeof createClient>
): Promise<ProcessWebhookResult> {
  if (webhook.data.event_type !== 'subscription.canceled') {
    return { success: false, action: 'ignored', error: 'Invalid event type' };
  }

  const { subscription: kiwifySub } = webhook.data;

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('kiwify_subscription_id', kiwifySub.id)
    .single();

  if (!existingSub) {
    return {
      success: false,
      action: 'ignored',
      error: 'Subscription not found',
    };
  }

  // Atualizar para canceled
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingSub.id);

  // Log do evento
  await supabase.from('subscription_logs').insert({
    subscription_id: existingSub.id,
    user_id: existingSub.user_id,
    event_type: 'canceled',
    event_source: 'kiwify',
    new_status: 'canceled',
  });

  return {
    success: true,
    action: 'updated',
    subscriptionId: existingSub.id,
    userId: existingSub.user_id,
  };
}

/**
 * Handler: Payment Approved
 */
async function handlePaymentApproved(
  webhook: KiwifyWebhookPayload,
  supabase: ReturnType<typeof createClient>
): Promise<ProcessWebhookResult> {
  if (webhook.data.event_type !== 'payment.approved') {
    return { success: false, action: 'ignored', error: 'Invalid event type' };
  }

  const { payment, subscription: kiwifySub } = webhook.data;

  if (!kiwifySub) {
    return {
      success: false,
      action: 'ignored',
      error: 'No subscription in payment webhook',
    };
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('kiwify_subscription_id', kiwifySub.id)
    .single();

  if (!existingSub) {
    return {
      success: false,
      action: 'ignored',
      error: 'Subscription not found',
    };
  }

  // Atualizar datas de pagamento e status
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      last_payment_at: payment.paid_at || new Date().toISOString(),
      payment_failed_count: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingSub.id);

  // Desbloquear usuário se estiver bloqueado
  await supabase
    .from('users_extra')
    .update({
      is_blocked: false,
      blocked_reason: null,
      blocked_at: null,
    })
    .eq('id', existingSub.user_id)
    .eq('blocked_reason', 'payment_overdue');

  // Log do evento
  await supabase.from('subscription_logs').insert({
    subscription_id: existingSub.id,
    user_id: existingSub.user_id,
    event_type: 'payment',
    event_source: 'kiwify',
    new_status: 'active',
    metadata: {
      payment_id: payment.id,
      amount: payment.amount,
    },
  });

  return {
    success: true,
    action: 'updated',
    subscriptionId: existingSub.id,
    userId: existingSub.user_id,
  };
}

/**
 * Handler: Payment Issue (late/refused)
 */
async function handlePaymentIssue(
  webhook: KiwifyWebhookPayload,
  supabase: ReturnType<typeof createClient>
): Promise<ProcessWebhookResult> {
  if (
    webhook.data.event_type !== 'payment.late' &&
    webhook.data.event_type !== 'payment.refused'
  ) {
    return { success: false, action: 'ignored', error: 'Invalid event type' };
  }

  const { payment, subscription: kiwifySub } = webhook.data;

  if (!kiwifySub) {
    return {
      success: false,
      action: 'ignored',
      error: 'No subscription in payment webhook',
    };
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, user_id, payment_failed_count')
    .eq('kiwify_subscription_id', kiwifySub.id)
    .single();

  if (!existingSub) {
    return {
      success: false,
      action: 'ignored',
      error: 'Subscription not found',
    };
  }

  // Atualizar status para past_due e incrementar contador
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      payment_failed_count: (existingSub.payment_failed_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingSub.id);

  // Log do evento
  await supabase.from('subscription_logs').insert({
    subscription_id: existingSub.id,
    user_id: existingSub.user_id,
    event_type: 'late',
    event_source: 'kiwify',
    new_status: 'past_due',
    metadata: {
      payment_id: payment.id,
      failed_attempts: (existingSub.payment_failed_count || 0) + 1,
    },
  });

  return {
    success: true,
    action: 'updated',
    subscriptionId: existingSub.id,
    userId: existingSub.user_id,
  };
}

/**
 * Handler: Refund or Chargeback
 */
async function handleRefundOrChargeback(
  webhook: KiwifyWebhookPayload,
  supabase: ReturnType<typeof createClient>
): Promise<ProcessWebhookResult> {
  if (
    webhook.data.event_type !== 'payment.refunded' &&
    webhook.data.event_type !== 'purchase.chargeback'
  ) {
    return { success: false, action: 'ignored', error: 'Invalid event type' };
  }

  const { payment } = webhook.data;

  // Buscar assinatura pelo payment
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('kiwify_order_id', payment.order_id)
    .single();

  if (!existingSub) {
    return {
      success: false,
      action: 'ignored',
      error: 'Subscription not found',
    };
  }

  // Cancelar assinatura imediatamente
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      cancel_reason: webhook.event,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingSub.id);

  // Bloquear usuário
  await supabase
    .from('users_extra')
    .update({
      is_blocked: true,
      blocked_reason: webhook.event,
      blocked_at: new Date().toISOString(),
    })
    .eq('id', existingSub.user_id);

  // Log do evento
  await supabase.from('subscription_logs').insert({
    subscription_id: existingSub.id,
    user_id: existingSub.user_id,
    event_type: webhook.event === 'payment.refunded' ? 'refunded' : 'chargeback',
    event_source: 'kiwify',
    new_status: 'canceled',
    metadata: {
      payment_id: payment.id,
    },
  });

  return {
    success: true,
    action: 'updated',
    subscriptionId: existingSub.id,
    userId: existingSub.user_id,
  };
}
