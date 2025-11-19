/**
 * Kiwify Webhook: Payment Late
 * @description Endpoint para receber notificações de pagamentos atrasados
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  validateKiwifyWebhook,
  processKiwifyWebhook,
} from '@/lib/kiwify/webhooks';
import type { KiwifyWebhookPayload } from '@/types/kiwify';

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET!;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  try {
    // 1. Ler payload
    const rawBody = await request.text();
    const signature = request.headers.get('x-kiwify-signature') || '';

    // 2. Validar assinatura
    const validation = validateKiwifyWebhook(rawBody, signature, webhookSecret);

    if (!validation.valid) {
      console.error('Invalid webhook signature:', validation.error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 3. Parse payload
    const webhook: KiwifyWebhookPayload = JSON.parse(rawBody);

    // 4. Salvar webhook no banco
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: webhookRecord } = await supabase
      .from('kiwify_webhooks')
      .insert({
        event_type: webhook.event,
        payload: webhook,
        signature,
        headers: Object.fromEntries(request.headers.entries()),
        received_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // 5. Processar webhook
    const result = await processKiwifyWebhook(webhook);

    // 6. Atualizar registro do webhook
    if (webhookRecord) {
      await supabase
        .from('kiwify_webhooks')
        .update({
          processed: result.success,
          processed_at: new Date().toISOString(),
          error_message: result.error,
        })
        .eq('id', webhookRecord.id);
    }

    // 7. Se processou com sucesso, enviar email de aviso
    if (result.success && result.userId) {
      // Buscar informações do usuário e assinatura
      const { data: userInfo } = await supabase
        .from('users_extra')
        .select('*, subscriptions(*)')
        .eq('id', result.userId)
        .single();

      if (userInfo) {
        // TODO: Integrar com Resend para enviar email de pagamento atrasado
        console.log('Email de pagamento atrasado deve ser enviado para:', result.userId);
      }
    }

    // 8. Retornar resposta
    if (!result.success) {
      console.error('Failed to process webhook:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      action: result.action,
      subscription_id: result.subscriptionId,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
