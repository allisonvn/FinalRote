import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const pathname = request.nextUrl.pathname

  // Anti-flicker para rotas públicas relevantes
  if (pathname === '/' || pathname.startsWith('/experiments/public/')) {
    response.headers.set('X-RF-Ready', 'true')
  }

  // Ignora totalmente assets internos do Next (performance e evita interferências)
  if (pathname.startsWith('/_next')) {
    return response
  }

  // Não realizar nenhum redirecionamento/validação de sessão no middleware
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css)$).*)',
  ],
}


