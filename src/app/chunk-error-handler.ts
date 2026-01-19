'use client'

// Script para inicializar o tratamento de erros de chunk loading
// Este arquivo é executado no lado do cliente
// Side-effect apenas - não precisa exportar nada

// Inicializar o handler de erros de chunk
if (typeof window !== 'undefined') {
  // Aguardar o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('ChunkErrorHandler inicializado')
    })
  } else {
    console.log('ChunkErrorHandler inicializado')
  }

  // Interceptar erros de webpack chunks especificamente
  const originalWebpackRequire = (window as any).__webpack_require__
  if (originalWebpackRequire) {
    (window as any).__webpack_require__ = (id: string) => {
      try {
        return originalWebpackRequire(id)
      } catch (error: any) {
        // Verificar se é um erro de chunk loading
        if (error && (
          error.name === 'ChunkLoadError' ||
          error.message?.includes('Loading chunk') ||
          error.message?.includes('ChunkLoadError') ||
          error.message?.includes('ERR_ABORTED') ||
          error.message?.includes('net::ERR_ABORTED')
        )) {
          console.warn('ChunkLoadError interceptado:', error)

          // Tentar recarregar a página após um delay
          setTimeout(() => {
            console.log('Recarregando página devido a ChunkLoadError...')
            window.location.reload()
          }, 1000)
        }
        throw error
      }
    }
  }

  // Interceptar erros de fetch para chunks
  const originalFetch = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Extrair URL primeiro para verificar antes de fazer a requisição
    const url = typeof input === 'string' ? input : input.toString()
    const isChunkOrStatic = url.includes('/_next/static/') || url.includes('/assets/')

    try {
      const response = await originalFetch(input, init)

      // Verificar se é uma requisição para chunks do Next.js
      if (isChunkOrStatic && !response.ok) {
        console.warn(`Erro ao carregar chunk: ${url} - Status: ${response.status}`)

        // Se for erro 400 ou 404, tentar recarregar a página
        if (response.status === 400 || response.status === 404) {
          setTimeout(() => {
            console.log('Recarregando página devido a erro de chunk...')
            window.location.reload()
          }, 1000)
        }
      }

      return response
    } catch (error) {
      // Se for chunk ou recurso estático, logar e retornar resposta mockada
      if (isChunkOrStatic) {
        console.warn(`Erro ao carregar recurso estático: ${url}`, error)
        return new Response(null, {
          status: 404,
          statusText: 'Not Found (mock)'
        })
      }

      // Para requisições ao Supabase, não logar "Failed to fetch" pois será tratado pelo código da aplicação
      const isSupabaseRequest = url.includes('supabase.co') || url.includes('/rest/v1/')
      if (isSupabaseRequest) {
        // Propagar o erro silenciosamente - o código de analytics já trata isso
        throw error
      }

      // Para outras requisições, propagar o erro normalmente
      throw error
    }
  }
}

// Este arquivo é apenas para side-effects, não precisa exportar nada
