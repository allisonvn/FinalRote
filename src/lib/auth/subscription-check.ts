import { SupabaseClient } from '@supabase/supabase-js'

interface SubscriptionCheckParams {
    supabase: SupabaseClient
    userId: string
    path: string
}

export type CheckResult =
    | { allowed: true; redirectUrl?: never }
    | { allowed: false; redirectUrl: string }

export async function checkSubscription({ supabase, userId, path }: SubscriptionCheckParams): Promise<CheckResult> {
    // Se já estiver em uma rota de billing ou blocked, permitir para evitar loops
    if (path.startsWith('/blocked') || (path.startsWith('/billing') && !path.startsWith('/billing/api'))) {
        return { allowed: true }
    }

    try {
        // 1. Buscar default_org_id do usuário
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('default_org_id')
            .eq('id', userId)
            .single()

        if (userError || !userData) {
            console.error('Erro ao buscar dados do usuário no middleware:', userError)
            // Fail open: permitir acesso se não conseguir verificar
            return { allowed: true }
        }

        if (!userData.default_org_id) {
            // Sem organização -> Redirecionar para onboarding
            if (!path.startsWith('/onboarding')) {
                return { allowed: false, redirectUrl: '/onboarding' }
            }
            return { allowed: true }
        }

        // 2. Buscar status da organização
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('subscription_status, is_blocked')
            .eq('id', userData.default_org_id)
            .single()

        if (orgError) {
            console.error('Erro ao buscar organização no middleware:', orgError)
            return { allowed: true }
        }

        // 3. Verificar bloqueio manual (Fraude/Violação)
        if (org.is_blocked) {
            return { allowed: false, redirectUrl: `/blocked?reason=terms_violation` }
        }

        const status = org.subscription_status

        // 4. Verificar status da assinatura
        // Allowed statuses
        if (status === 'active' || status === 'trialing') {
            return { allowed: true }
        }

        // Redirect rules
        if (status === 'past_due') {
            return { allowed: false, redirectUrl: '/billing/unpaid' }
        }

        if (status === 'canceled') {
            return { allowed: false, redirectUrl: '/billing/canceled' }
        }

        // Inactive, null, or unknown
        if (!status || status === 'inactive') {
            return { allowed: false, redirectUrl: '/billing/inactive' }
        }

        // Fallback default
        return { allowed: true }

    } catch (error) {
        console.error('Erro inesperado no checkSubscription:', error)
        return { allowed: true }
    }
}
