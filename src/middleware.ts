import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const pathname = request.nextUrl.pathname

  // Ignora assets internos do Next
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return response
  }

  // Anti-flicker para rotas públicas
  const isPublicRoute = pathname === '/' || 
                       pathname.startsWith('/experiments/') ||
                       pathname.startsWith('/demo/')

  if (isPublicRoute) {
    // Adicionar headers para anti-flicker
    response.headers.set('X-RF-Ready', 'true')
    response.headers.set('X-RF-Route', pathname)
    
    // Adicionar CSP header permitindo inline script
    const csp = response.headers.get('Content-Security-Policy') || ''
    if (!csp.includes('unsafe-inline')) {
      response.headers.set(
        'Content-Security-Policy',
        `${csp}${csp ? '; ' : ''}script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline';`
      )
    }

    // Cache control para melhor performance
    response.headers.set(
      'Cache-Control',
      'public, max-age=0, must-revalidate'
    )

    // Adicionar timing headers para debug
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-RF-Timing', Date.now().toString())
    }
  }

  // Adicionar CORS headers para Edge Functions
  const origin = request.headers.get('origin')
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Api-Key'
    )
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


