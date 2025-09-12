import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith('/auth')
  const isProtectedRoute = ['/dashboard', '/experiments', '/analytics', '/settings'].some(route =>
    pathname.startsWith(route)
  )

  // Anti-flicker para rotas públicas relevantes
  if (pathname === '/' || pathname.startsWith('/experiments/public/')) {
    response.headers.set('X-RF-Ready', 'true')
  }

  // Ignora totalmente assets internos do Next (performance e evita interferências)
  if (pathname.startsWith('/_next')) {
    return response
  }

  // Se não for rota protegida nem rota de auth, não precisamos de Supabase aqui
  if (!isProtectedRoute && !isAuthRoute) {
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
    // Sem Supabase configurado: permite telas de auth carregarem e bloqueia rotas protegidas
    if (isProtectedRoute) {
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

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && user && !pathname.includes('/callback')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css)$).*)',
  ],
}


