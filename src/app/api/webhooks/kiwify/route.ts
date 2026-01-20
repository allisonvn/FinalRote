/**
 * Webhook Unificado Kiwify
 * URL: https://rotafinal.com.br/api/webhooks/kiwify
 * 
 * Recebe todos os eventos do Kiwify e processa de acordo com o tipo
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyKiwifySignature, extractSignature } from '@/lib/kiwify/verify-signature'
import { sendEmail } from '@/lib/resend/client'

// Tipos de eventos suportados pelo Kiwify
type KiwifyEvent =
    | 'boleto_gerado'
    | 'pix_gerado'
    | 'carrinho_abandonado'
    | 'compra_recusada'
    | 'compra_aprovada'
    | 'compra_reembolsada'
    | 'chargeback'
    | 'subscription_canceled'
    | 'subscription_late'
    | 'subscription_renewed'

interface KiwifyWebhookPayload {
    event: KiwifyEvent
    data: {
        customer: {
            email: string
            name?: string
            mobile?: string
            CPF?: string
        }
        product?: {
            id: string
            name: string
        }
        order?: {
            id: string
            status: string
            amount?: number
            checkout_url?: string
        }
        subscription?: {
            id: string
            status: 'active' | 'canceled' | 'past_due' | 'trialing'
            next_billing_at?: string
        }
    }
    timestamp: string
}

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Ler body como texto para validação de assinatura
        const rawBody = await request.text()

        // Verificar assinatura HMAC se configurado
        const signature = extractSignature(request)
        const secret = process.env.KIWIFY_WEBHOOK_SECRET

        if (secret && signature) {
            const isValid = verifyKiwifySignature({
                payload: rawBody,
                signature,
                secret
            })

            if (!isValid) {
                console.error('[Kiwify Webhook] ❌ Assinatura inválida')
                return NextResponse.json(
                    { error: 'Unauthorized', message: 'Invalid signature' },
                    { status: 401 }
                )
            }
        }

        // Parse do payload
        const payload: KiwifyWebhookPayload = JSON.parse(rawBody)
        const { event, data, timestamp } = payload


        // Criar cliente Supabase com service role
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Processar evento com base no tipo
        let result: { success: boolean; message: string; userId?: string }

        switch (event) {
            case 'compra_aprovada':
                result = await handlePurchaseApproved(supabase, data, payload)
                break

            case 'subscription_late':
                result = await handlePaymentLate(supabase, data, payload)
                break

            case 'subscription_canceled':
                result = await handleSubscriptionCanceled(supabase, data, payload)
                break

            case 'subscription_renewed':
                result = await handleSubscriptionRenewed(supabase, data, payload)
                break

            case 'compra_reembolsada':
                result = await handleRefund(supabase, data, payload)
                break

            case 'chargeback':
                result = await handleChargeback(supabase, data, payload)
                break

            case 'boleto_gerado':
            case 'pix_gerado':
                result = await handlePaymentPending(supabase, data, event, payload)
                break

            case 'carrinho_abandonado':
                result = await handleAbandonedCart(supabase, data, payload)
                break

            case 'compra_recusada':
                result = await handlePurchaseDeclined(supabase, data, payload)
                break

            default:
                result = { success: true, message: `Evento ${event} recebido mas não processado` }
        }

        // Log do resultado
        const duration = Date.now() - startTime

        // Registrar webhook no banco para auditoria
        try {
            await supabase.from('webhook_logs').insert({
                provider: 'kiwify',
                event_type: event,
                payload: payload,
                result: result,
                processed_at: new Date().toISOString(),
                duration_ms: duration
            })
        } catch (logError) {
            console.warn('[Kiwify Webhook] ⚠️ Erro ao registrar log:', logError)
        }

        return NextResponse.json({
            success: result.success,
            message: result.message,
            event,
            processed_at: new Date().toISOString(),
            duration_ms: duration
        })

    } catch (error) {
        console.error('[Kiwify Webhook] ❌ Erro:', error)
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// ===================================
// HANDLERS PARA CADA TIPO DE EVENTO
// ===================================

async function handlePurchaseApproved(
    supabase: any,
    data: KiwifyWebhookPayload['data'],
    payload: KiwifyWebhookPayload
) {
    const { customer, product, order, subscription } = data

    // 1. Verificar se usuário já existe
    const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', customer.email)
        .single()

    let userId = existingUser?.id

    if (!existingUser) {
        // 2. Criar usuário no Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: customer.email,
            email_confirm: true,
            user_metadata: {
                full_name: customer.name,
                source: 'kiwify'
            }
        })

        if (authError) {
            console.error('[Kiwify] Erro ao criar usuário:', authError)
            return { success: false, message: `Erro ao criar usuário: ${authError.message}` }
        }

        userId = authUser.user.id

        // 3. Criar perfil do usuário
        await supabase.from('users').insert({
            id: userId,
            email: customer.email,
            full_name: customer.name || customer.email.split('@')[0],
            created_at: new Date().toISOString()
        })

        // 4. Criar organização e membership
        const orgName = customer.name ? `${customer.name}'s Org` : 'Minha Organização'
        const { data: org } = await supabase
            .from('organizations')
            .insert({
                name: orgName,
                slug: `org-${Date.now()}`,
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (org) {
            await supabase.from('organization_members').insert({
                org_id: org.id,
                user_id: userId,
                role: 'owner',
                created_at: new Date().toISOString()
            })

            // Atualizar default_org_id do usuário
            await supabase
                .from('users')
                .update({ default_org_id: org.id })
                .eq('id', userId)

            // 5. Criar/atualizar assinatura
            await supabase.from('subscriptions').upsert({
                org_id: org.id,
                status: 'active',
                kiwify_subscription_id: subscription?.id || order?.id,
                kiwify_order_id: order?.id,
                plan_name: product?.name || 'Pro',
                amount: order?.amount || 0,
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'org_id'
            })
        }
    } else {
        // Usuário existe - apenas atualizar assinatura
        const { data: userOrg } = await supabase
            .from('users')
            .select('default_org_id')
            .eq('id', userId)
            .single()

        if (userOrg?.default_org_id) {
            await supabase.from('subscriptions').upsert({
                org_id: userOrg.default_org_id,
                status: 'active',
                kiwify_subscription_id: subscription?.id || order?.id,
                kiwify_order_id: order?.id,
                plan_name: product?.name || 'Pro',
                amount: order?.amount || 0,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'org_id'
            })
        }
    }

    // 6. Enviar email de boas-vindas
    try {
        await sendEmail({
            to: customer.email,
            template: 'welcome',
            data: {
                name: customer.name || customer.email.split('@')[0],
                appName: 'Rota Final',
                planName: product?.name || 'Pro',
                loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin`
            },
            userId
        })
    } catch (emailError) {
        console.error('[Kiwify] ⚠️ Erro ao enviar email:', emailError)
    }

    return {
        success: true,
        message: 'Compra processada com sucesso',
        userId
    }
}

async function handlePaymentLate(
    supabase: any,
    data: KiwifyWebhookPayload['data'],
    payload: KiwifyWebhookPayload
) {
    const { customer, subscription, order } = data

    // Buscar usuário e atualizar status
    const { data: user } = await supabase
        .from('users')
        .select('id, default_org_id')
        .eq('email', customer.email)
        .single()

    if (user?.default_org_id) {
        await supabase
            .from('subscriptions')
            .update({
                status: 'past_due',
                updated_at: new Date().toISOString()
            })
            .eq('org_id', user.default_org_id)

        // Enviar email de cobrança
        try {
            await sendEmail({
                to: customer.email,
                template: 'payment-late',
                data: {
                    name: customer.name || 'Cliente',
                    appName: 'Rota Final',
                    dueDate: subscription?.next_billing_at
                        ? new Date(subscription.next_billing_at).toLocaleDateString('pt-BR')
                        : 'Em breve',
                    amount: order?.amount
                        ? `R$ ${(order.amount / 100).toFixed(2)}`
                        : 'Valor pendente',
                    paymentUrl: order?.checkout_url || `${process.env.NEXT_PUBLIC_APP_URL}/billing`
                },
                userId: user.id
            })
        } catch (emailError) {
            console.error('[Kiwify] ⚠️ Erro ao enviar email:', emailError)
        }
    }

    return {
        success: true,
        message: 'Pagamento atrasado registrado',
        userId: user?.id
    }
}

async function handleSubscriptionCanceled(
    supabase: any,
    data: KiwifyWebhookPayload['data'],
    payload: KiwifyWebhookPayload
) {
    const { customer } = data

    const { data: user } = await supabase
        .from('users')
        .select('id, default_org_id')
        .eq('email', customer.email)
        .single()

    if (user?.default_org_id) {
        await supabase
            .from('subscriptions')
            .update({
                status: 'canceled',
                canceled_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('org_id', user.default_org_id)

        // Enviar email de cancelamento
        try {
            await sendEmail({
                to: customer.email,
                template: 'subscription-canceled',
                data: {
                    name: customer.name || 'Cliente',
                    appName: 'Rota Final',
                    cancelDate: new Date().toLocaleDateString('pt-BR'),
                    reactivateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
                },
                userId: user.id
            })
        } catch (emailError) {
            console.error('[Kiwify] ⚠️ Erro ao enviar email:', emailError)
        }
    }

    return {
        success: true,
        message: 'Assinatura cancelada',
        userId: user?.id
    }
}

async function handleSubscriptionRenewed(
    supabase: any,
    data: KiwifyWebhookPayload['data'],
    payload: KiwifyWebhookPayload
) {
    const { customer, order } = data

    const { data: user } = await supabase
        .from('users')
        .select('id, default_org_id')
        .eq('email', customer.email)
        .single()

    if (user?.default_org_id) {
        await supabase
            .from('subscriptions')
            .update({
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('org_id', user.default_org_id)
    }

    return {
        success: true,
        message: 'Assinatura renovada',
        userId: user?.id
    }
}

async function handleRefund(
    supabase: any,
    data: KiwifyWebhookPayload['data'],
    payload: KiwifyWebhookPayload
) {
    const { customer } = data

    const { data: user } = await supabase
        .from('users')
        .select('id, default_org_id')
        .eq('email', customer.email)
        .single()

    if (user?.default_org_id) {
        await supabase
            .from('subscriptions')
            .update({
                status: 'refunded',
                updated_at: new Date().toISOString()
            })
            .eq('org_id', user.default_org_id)
    }

    return {
        success: true,
        message: 'Reembolso processado',
        userId: user?.id
    }
}

async function handleChargeback(
    supabase: any,
    data: KiwifyWebhookPayload['data'],
    payload: KiwifyWebhookPayload
) {
    const { customer } = data

    const { data: user } = await supabase
        .from('users')
        .select('id, default_org_id')
        .eq('email', customer.email)
        .single()

    if (user?.default_org_id) {
        // Bloquear organização por chargeback
        await supabase
            .from('organizations')
            .update({
                is_blocked: true,
                blocked_reason: 'chargeback',
                updated_at: new Date().toISOString()
            })
            .eq('id', user.default_org_id)

        await supabase
            .from('subscriptions')
            .update({
                status: 'chargeback',
                updated_at: new Date().toISOString()
            })
            .eq('org_id', user.default_org_id)
    }

    return {
        success: true,
        message: 'Chargeback processado - conta bloqueada',
        userId: user?.id
    }
}

async function handlePaymentPending(
    supabase: any,
    data: KiwifyWebhookPayload['data'],
    eventType: 'boleto_gerado' | 'pix_gerado',
    payload: KiwifyWebhookPayload
) {
    const { customer, order } = data
    const paymentMethod = eventType === 'boleto_gerado' ? 'boleto' : 'pix'


    // Opcionalmente, enviar email com instruções de pagamento
    // await sendEmail({ ... })

    return {
        success: true,
        message: `${paymentMethod.toUpperCase()} registrado`
    }
}

async function handleAbandonedCart(
    supabase: any,
    data: KiwifyWebhookPayload['data'],
    payload: KiwifyWebhookPayload
) {
    const { customer, product, order } = data


    // Opcionalmente, enviar email de recuperação
    // await sendEmail({
    //   to: customer.email,
    //   template: 'abandoned-cart',
    //   data: { ... }
    // })

    return {
        success: true,
        message: 'Carrinho abandonado registrado'
    }
}

async function handlePurchaseDeclined(
    supabase: any,
    data: KiwifyWebhookPayload['data'],
    payload: KiwifyWebhookPayload
) {
    const { customer } = data


    return {
        success: true,
        message: 'Compra recusada registrada'
    }
}

// GET para verificar se o webhook está funcionando
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Kiwify webhook endpoint is active',
        timestamp: new Date().toISOString(),
        supported_events: [
            'compra_aprovada',
            'subscription_late',
            'subscription_canceled',
            'subscription_renewed',
            'compra_reembolsada',
            'chargeback',
            'boleto_gerado',
            'pix_gerado',
            'carrinho_abandonado',
            'compra_recusada'
        ]
    })
}
