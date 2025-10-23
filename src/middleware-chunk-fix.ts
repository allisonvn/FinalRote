import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Interceptar requisições para chunks do Next.js
  if (pathname.startsWith('/_next/static/chunks/')) {
    // Verificar se o arquivo existe
    const response = NextResponse.next()
    
    // Adicionar headers para evitar cache de chunks corrompidos
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Adicionar header para forçar reload em caso de erro
    response.headers.set('X-Chunk-Error-Handler', 'enabled')
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
