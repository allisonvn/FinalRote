/**
 * Middleware Principal - Rota Final
 * @description Middleware para autenticação e verificação de subscription
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// =====================================================
// CONFIGURAÇÃO DE ROTAS
// =====================================================

// Rotas completamente públicas (sem autenticação)
const PUBLIC_ROUTES = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/pricing',
]

// Rotas de billing/status (acessíveis com sessão, mesmo sem subscription ativa)
const BILLING_ROUTES = [
  '/billing',
  '/billing/inactive',
  '/billing/canceled',
  '/billing/unpaid',
  '/billing/expired',
  '/blocked',
  '/onboarding',
]

// Rotas de API públicas (webhooks, tracking, health)
const PUBLIC_API_ROUTES = [
  '/api/webhooks',
  '/api/health',
  '/api/cron',
  '/api/track',
  '/api/track-event',
  '/api/assign-variant',
  '/api/experiments/', // Public experiment assignment endpoint
]

// Assets e arquivos estáticos
const STATIC_PATHS = [
  '/_next/',
  '/static/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/rotafinal-sdk',
]

// =====================================================
// HELPERS
// =====================================================

function isStaticPath(pathname: string): boolean {
  return STATIC_PATHS.some(path => pathname.includes(path))
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

function isBillingRoute(pathname: string): boolean {
  return BILLING_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))
}

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
}

// =====================================================
// MIDDLEWARE PRINCIPAL
// =====================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. BYPASS: Assets estáticos
  if (isStaticPath(pathname)) {
    return NextResponse.next()
  }

  // 2. Criar resposta base com headers de segurança
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  addSecurityHeaders(response)

  // 3. BYPASS: Rotas completamente públicas
  if (isPublicRoute(pathname)) {
    return response
  }

  // 4. BYPASS: APIs públicas
  if (isPublicApiRoute(pathname)) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    return response
  }

  // 5. Configurar cliente Supabase para middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          addSecurityHeaders(response)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 6. Verificar sessão de autenticação
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Middleware: Session error', sessionError.message)
  }

  // 7. SEM SESSÃO: Redirecionar para login
  if (!session) {
    // Se é rota de billing, ainda precisa de sessão
    if (isBillingRoute(pathname)) {
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Rotas protegidas requerem login
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 8. COM SESSÃO: Rotas de billing são sempre acessíveis
  if (isBillingRoute(pathname)) {
    return response
  }

  // 9. VERIFICAÇÃO DE SUBSCRIPTION (apenas para rotas protegidas)
  try {
    const userId = session.user.id

    // 9.1 Buscar dados do usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('default_org_id')
      .eq('id', userId)
      .single()

    // Usuário sem perfil: redirecionar para onboarding
    if (userError || !user?.default_org_id) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // 9.2 Buscar dados da organização
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, is_active, is_blocked, blocked_reason, subscription_status, subscription_end, plan_slug')
      .eq('id', user.default_org_id)
      .single()

    // Organização não encontrada: redirecionar para onboarding
    if (orgError || !org) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // 9.3 Verificar se organização está bloqueada
    if (org.is_blocked) {
      const blockedUrl = new URL('/blocked', request.url)
      blockedUrl.searchParams.set('reason', org.blocked_reason || 'unknown')
      return NextResponse.redirect(blockedUrl)
    }

    // 9.4 Verificar se organização está ativa
    if (!org.is_active) {
      return NextResponse.redirect(new URL('/billing/inactive', request.url))
    }

    // 9.5 Verificar status da subscription
    const subscriptionStatus = org.subscription_status || 'unknown'

    switch (subscriptionStatus) {
      case 'canceled':
        return NextResponse.redirect(new URL('/billing/canceled', request.url))

      case 'unpaid':
        return NextResponse.redirect(new URL('/billing/unpaid', request.url))

      case 'past_due':
        // Permitir acesso mas adicionar header de aviso
        response.headers.set('X-Subscription-Past-Due', 'true')
        break

      case 'active':
      case 'trialing':
        // Tudo OK
        break

      default:
        // Status desconhecido: permitir acesso mas logar
        console.warn(`Middleware: Unknown subscription status "${subscriptionStatus}" for org ${org.id}`)
    }

    // 9.6 Verificar se subscription expirou
    if (org.subscription_end) {
      const periodEnd = new Date(org.subscription_end)
      const now = new Date()

      if (periodEnd < now) {
        return NextResponse.redirect(new URL('/billing/expired', request.url))
      }

      // Avisar se vai expirar em breve (próximos 3 dias)
      const daysUntilExpiration = Math.floor((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      if (daysUntilExpiration <= 3 && daysUntilExpiration > 0) {
        response.headers.set('X-Subscription-Expiring', daysUntilExpiration.toString())
      }
    }

    // 9.7 Adicionar informações ao header para uso nas páginas
    response.headers.set('X-Organization-Id', org.id)
    response.headers.set('X-Organization-Plan', org.plan_slug || 'trial')
    response.headers.set('X-Subscription-Status', subscriptionStatus)

  } catch (error) {
    console.error('Middleware: Subscription check error', error)
    // Em caso de erro, permitir acesso (fail open) mas logar
    // Isso evita bloquear usuários por falhas temporárias
  }

  // 10. Headers para API routes autenticadas
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  }

  return response
}

// =====================================================
// CONFIGURAÇÃO DO MATCHER
// =====================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|static).*)',
  ],
}
