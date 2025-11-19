/**
 * Subscription Middleware
 * @description Middleware para verificar status de assinatura e bloquear acesso
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

// Rotas que não exigem assinatura ativa
const PUBLIC_ROUTES = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/blocked',
  '/billing',
  '/billing/expired',
  '/api/webhooks',
];

// Rotas de API que não exigem verificação
const PUBLIC_API_ROUTES = [
  '/api/webhooks',
  '/api/health',
  '/api/cron',
];

export async function subscriptionMiddleware(req: NextRequest) {
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

    // 2. Buscar informações do usuário
    const { data: userExtra, error: userError } = await supabase
      .from('users_extra')
      .select('is_blocked, blocked_reason, role')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // 3. Verificar se usuário está bloqueado
    if (userExtra?.is_blocked) {
      const blockedUrl = new URL('/blocked', req.url);
      blockedUrl.searchParams.set('reason', userExtra.blocked_reason || 'unknown');
      return NextResponse.redirect(blockedUrl);
    }

    // 4. Admins têm acesso total
    if (userExtra?.role === 'admin' || userExtra?.role === 'superadmin') {
      return res;
    }

    // 5. Verificar assinatura ativa
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('status, current_period_end, cancel_at_period_end')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single();

    if (subError || !subscription) {
      // Sem assinatura ativa - redirecionar para billing
      const billingUrl = new URL('/billing/expired', req.url);
      return NextResponse.redirect(billingUrl);
    }

    // 6. Verificar se a assinatura já expirou
    const periodEnd = new Date(subscription.current_period_end);
    const now = new Date();

    if (periodEnd < now) {
      const expiredUrl = new URL('/billing/expired', req.url);
      return NextResponse.redirect(expiredUrl);
    }

    // 7. Avisar se a assinatura vai expirar em breve
    const daysUntilExpiration = Math.floor(
      (periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysUntilExpiration <= 3 && daysUntilExpiration > 0) {
      // Adicionar header de aviso
      res.headers.set('X-Subscription-Expiring', daysUntilExpiration.toString());
    }

    // 8. Avisar se a assinatura está marcada para cancelamento
    if (subscription.cancel_at_period_end) {
      res.headers.set('X-Subscription-Canceling', 'true');
    }

    // 9. Atualizar último acesso
    await supabase.rpc('update_last_access', { user_uuid: userId });

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
