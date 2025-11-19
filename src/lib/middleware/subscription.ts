/**
 * Subscription Middleware for Organizations
 * @description Middleware para verificar status de assinatura das organizations
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

// Rotas que não exigem subscription ativa
const PUBLIC_ROUTES = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/blocked',
  '/billing',
  '/pricing',
];

// Rotas de API públicas
const PUBLIC_API_ROUTES = [
  '/api/webhooks',
  '/api/health',
  '/api/cron',
  '/api/track', // SDK tracking deve ser sempre público
  '/api/assign-variant', // Assignment deve funcionar mesmo com trial
];

/**
 * Verificar se organização tem assinatura ativa
 */
export async function checkOrganizationSubscription(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Ignorar rotas públicas
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );
  const isPublicApiRoute = PUBLIC_API_ROUTES.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute || isPublicApiRoute) {
    return res;
  }

  try {
    // 1. Verificar sessão
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      const redirectUrl = new URL('/auth/signin', req.url);
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const userId = session.user.id;

    // 2. Buscar organização padrão do usuário
    const { data: user } = await supabase
      .from('users')
      .select('default_org_id')
      .eq('id', userId)
      .single();

    if (!user?.default_org_id) {
      // Usuário sem organização - redirecionar para criar
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // 3. Buscar dados da organização
    const { data: org } = await supabase
      .from('organizations')
      .select(
        'id, name, is_active, is_blocked, blocked_reason, subscription_status, subscription_end, plan_slug'
      )
      .eq('id', user.default_org_id)
      .single();

    if (!org) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // 4. Verificar se organização está bloqueada
    if (org.is_blocked) {
      const blockedUrl = new URL('/blocked', req.url);
      blockedUrl.searchParams.set('reason', org.blocked_reason || 'unknown');
      blockedUrl.searchParams.set('org', org.id);
      return NextResponse.redirect(blockedUrl);
    }

    // 5. Verificar se organização está ativa
    if (!org.is_active) {
      return NextResponse.redirect(new URL('/billing/inactive', req.url));
    }

    // 6. Verificar status da subscription
    if (org.subscription_status === 'canceled') {
      return NextResponse.redirect(new URL('/billing/canceled', req.url));
    }

    if (org.subscription_status === 'unpaid') {
      return NextResponse.redirect(new URL('/billing/unpaid', req.url));
    }

    if (org.subscription_status === 'past_due') {
      // Permitir acesso mas adicionar aviso
      res.headers.set('X-Subscription-Past-Due', 'true');
    }

    // 7. Verificar se subscription expirou
    if (org.subscription_end) {
      const periodEnd = new Date(org.subscription_end);
      const now = new Date();

      if (periodEnd < now) {
        return NextResponse.redirect(new URL('/billing/expired', req.url));
      }

      // Avisar se vai expirar em breve (próximos 3 dias)
      const daysUntilExpiration = Math.floor(
        (periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysUntilExpiration <= 3 && daysUntilExpiration > 0) {
        res.headers.set('X-Subscription-Expiring', daysUntilExpiration.toString());
      }
    }

    // 8. Adicionar informações ao header para uso nas páginas
    res.headers.set('X-Organization-Id', org.id);
    res.headers.set('X-Organization-Plan', org.plan_slug || 'trial');
    res.headers.set('X-Subscription-Status', org.subscription_status || 'unknown');

    return res;
  } catch (error) {
    console.error('Subscription middleware error:', error);
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
}

/**
 * Helper: Verificar se usuário tem permissão na organização
 */
export async function checkOrganizationPermission(
  supabase: any,
  userId: string,
  orgId: string,
  requiredRoles: string[] = ['owner', 'admin', 'member']
): Promise<boolean> {
  const { data } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single();

  if (!data) return false;

  return requiredRoles.includes(data.role);
}

/**
 * Helper: Obter organização do usuário atual
 */
export async function getCurrentOrganization(supabase: any, userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('default_org_id')
    .eq('id', userId)
    .single();

  if (!user?.default_org_id) return null;

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.default_org_id)
    .single();

  return org;
}

/**
 * Helper: Verificar se pode executar ação baseada em limites do plano
 */
export async function canPerformAction(
  supabase: any,
  orgId: string,
  action: 'create_experiment' | 'create_project' | 'feature_access',
  featureKey?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc(
    action === 'create_experiment'
      ? 'can_create_experiment'
      : action === 'create_project'
        ? 'can_create_project'
        : 'organization_has_feature',
    action === 'feature_access'
      ? { org_uuid: orgId, feature_key: featureKey }
      : { org_uuid: orgId }
  );

  if (error) {
    return { allowed: false, reason: error.message };
  }

  if (!data) {
    return {
      allowed: false,
      reason:
        action === 'create_experiment'
          ? 'Limite de experimentos atingido'
          : action === 'create_project'
            ? 'Limite de projetos atingido'
            : 'Feature não disponível no seu plano',
    };
  }

  return { allowed: true };
}
