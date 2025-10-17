import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // CRÍTICO: Não processar NENHUMA requisição de assets estáticos
  // Deixar o Next.js/Vercel servir diretamente sem interceptação
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('/_next/static/') ||
    pathname.includes('/_next/image/') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('/robots.txt') ||
    pathname.includes('/sitemap.xml')
  ) {
    // Retornar undefined para que o Next.js processe normalmente
    return undefined
  }

  // Criar resposta padrão apenas para rotas de aplicação
  const response = NextResponse.next()
  
  // Headers para melhorar performance e segurança
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  // Headers para API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
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
     * - static files
     */
    '/((?!_next|static|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
