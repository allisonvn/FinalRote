import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkSubscription } from '@/lib/auth/subscription-check'

// Lista de emails de administradores do sistema
const ADMIN_EMAILS = [
  'admin@rotafinal.com',
  'suporte@rotafinal.com',
  'eu@allison.com.br',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Bypass completo para todos os arquivos do Next.js (estáticos, chunks, HMR, etc.)
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  const isAuthRoute = pathname.startsWith('/auth')
  const isAdminRoute = pathname.startsWith('/root-panel') || pathname.startsWith('/api/admin')
  const isProtectedRoute = ['/dashboard', '/experiments', '/analytics', '/settings', '/billing', '/blocked'].some(route =>
    pathname.startsWith(route)
  )

  // Anti-flicker para rotas públicas relevantes
  if (pathname === '/' || pathname.startsWith('/experiments/public/')) {
    response.headers.set('X-RF-Ready', 'true')
  }

  // Se não for rota protegida nem rota de auth nem rota admin, não precisamos de Supabase aqui
  if (!isProtectedRoute && !isAuthRoute && !isAdminRoute) {
    return response
  }

  // Checagem de configuração mínima do Supabase (evita travar em dev sem credenciais reais)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseConfigured = Boolean(
    supabaseUrl && supabaseAnonKey &&
    !supabaseUrl.includes('example.supabase.co') &&
    !supabaseAnonKey.includes('demo')
  )

  if (!supabaseConfigured) {
    // Sem Supabase configurado: permite telas de auth carregarem e bloqueia rotas protegidas/admin
    if (isProtectedRoute || isAdminRoute) {
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Verificação de rotas admin
  if (isAdminRoute) {
    if (!user) {
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Verificar se é admin pelo email ou metadata
    const userEmail = user.email || ''
    const userMetadata = user.user_metadata || {}
    const isSystemAdmin = ADMIN_EMAILS.includes(userEmail) || userMetadata.is_super_admin === true

    // Se não é admin por email/metadata, verificar tabela (será feito no layout/API)
    // Aqui fazemos apenas uma verificação básica para performance
    if (!isSystemAdmin) {
      // Tentar verificar na tabela system_admins
      const { data: adminCheck } = await supabase
        .from('system_admins')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!adminCheck) {
        // Não é admin, redirecionar para dashboard
        return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url))
      }
    }

    // É admin, permitir acesso
    return response
  }

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 3. Subscription Gate (Post-Auth)
  if (user && isProtectedRoute) {
    const { allowed, redirectUrl } = await checkSubscription({
      supabase,
      userId: user.id,
      path: pathname
    })

    if (!allowed && redirectUrl) {
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
  }

  if (isAuthRoute && user && !pathname.includes('/callback')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)$).*)',
  ],
}


