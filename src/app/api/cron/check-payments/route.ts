/**
 * Cron Job: Check Payments
 * @description Rotina diária para verificar status de pagamentos e bloquear inadimplentes
 *
 * Configurar no vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-payments",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getKiwifyClient } from '@/lib/kiwify/client';
import { sendEmail } from '@/lib/resend/client';

const GRACE_PERIOD_DAYS = 7; // Período de tolerância antes de bloquear

export async function GET(request: NextRequest) {
  // 1. Validar autorização (Vercel Cron Secret)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const kiwify = getKiwifyClient();

  const results = {
    checked: 0,
    updated: 0,
    blocked: 0,
    errors: [] as string[],
    timestamp: new Date().toISOString(),
  };

  try {
    // 2. Buscar todas as assinaturas ativas ou em atraso
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*, users_extra(*), plans(*)')
      .in('status', ['active', 'trialing', 'past_due']);

    if (fetchError) {
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        ...results,
        message: 'No subscriptions to check',
      });
    }

    // 3. Verificar cada assinatura na Kiwify
    for (const sub of subscriptions) {
      results.checked++;

      if (!sub.kiwify_subscription_id) {
        continue; // Pular se não tiver ID da Kiwify
      }

      try {
        // Buscar status atualizado na Kiwify
        const kiwifyResponse = await kiwify.getSubscription(
          sub.kiwify_subscription_id
        );

        if (!kiwifyResponse.success || !kiwifyResponse.data) {
          results.errors.push(
            `Failed to fetch subscription ${sub.id} from Kiwify`
          );
          continue;
        }

        const kiwifyData = kiwifyResponse.data;
        const needsUpdate =
          kiwifyData.status !== sub.status ||
          new Date(kiwifyData.current_period_end) !==
            new Date(sub.current_period_end);

        // 4. Atualizar se necessário
        if (needsUpdate) {
          await supabase
            .from('subscriptions')
            .update({
              status: kiwifyData.status,
              current_period_start: kiwifyData.current_period_start,
              current_period_end: kiwifyData.current_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id);

          results.updated++;

          // Log da atualização
          await supabase.from('subscription_logs').insert({
            subscription_id: sub.id,
            user_id: sub.user_id,
            event_type: 'updated',
            event_source: 'cron',
            old_status: sub.status,
            new_status: kiwifyData.status,
          });
        }

        // 5. Verificar se precisa bloquear
        const isOverdue =
          sub.status === 'past_due' &&
          new Date(sub.current_period_end) <
            new Date(Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

        if (isOverdue && !sub.users_extra.is_blocked) {
          // Bloquear usuário
          await supabase
            .from('users_extra')
            .update({
              is_blocked: true,
              blocked_reason: 'payment_overdue',
              blocked_at: new Date().toISOString(),
            })
            .eq('id', sub.user_id);

          // Atualizar status da assinatura
          await supabase
            .from('subscriptions')
            .update({
              status: 'unpaid',
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id);

          results.blocked++;

          // Log do bloqueio
          await supabase.from('subscription_logs').insert({
            subscription_id: sub.id,
            user_id: sub.user_id,
            event_type: 'blocked',
            event_source: 'cron',
            old_status: 'past_due',
            new_status: 'unpaid',
            metadata: {
              reason: 'payment_overdue_grace_period_expired',
              grace_period_days: GRACE_PERIOD_DAYS,
            },
          });

          // Enviar email de bloqueio
          const { data: userData } = await supabase
            .from('auth.users')
            .select('email')
            .eq('id', sub.user_id)
            .single();

          if (userData?.email) {
            await sendEmail({
              to: userData.email,
              template: 'account-blocked',
              data: {
                name: sub.users_extra.full_name || userData.email,
                reason: 'payment_overdue',
                regularizeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
              },
              userId: sub.user_id,
            });
          }
        }

        // 6. Enviar avisos para assinaturas próximas do vencimento
        const daysUntilExpiration = Math.floor(
          (new Date(sub.current_period_end).getTime() - Date.now()) /
            (24 * 60 * 60 * 1000)
        );

        if (daysUntilExpiration > 0 && daysUntilExpiration <= 3) {
          // Enviar email de lembrete
          const { data: userData } = await supabase
            .from('auth.users')
            .select('email')
            .eq('id', sub.user_id)
            .single();

          if (userData?.email) {
            await sendEmail({
              to: userData.email,
              template: 'payment-late',
              data: {
                name: sub.users_extra.full_name || userData.email,
                daysLate: 0,
                amountDue: sub.price_amount,
                dueDate: sub.current_period_end,
                updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
              },
              userId: sub.user_id,
            });
          }
        }
      } catch (error) {
        results.errors.push(
          `Error processing subscription ${sub.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // 7. Executar função do banco para limpeza adicional
    await supabase.rpc('cron_check_expired_subscriptions');

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...results,
      },
      { status: 500 }
    );
  }
}

// Opcional: permitir POST também (para testes manuais)
export async function POST(request: NextRequest) {
  return GET(request);
}
