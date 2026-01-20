'use client'

// Script para inicializar o tratamento de erros de chunk loading
// Este arquivo é executado no lado do cliente
// Side-effect apenas - não precisa exportar nada

// Inicializar o handler de erros de chunk
if (typeof window !== 'undefined') {
  // Aguardar o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('ChunkErrorHandler inicializado')
      }
    })
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log('ChunkErrorHandler inicializado')
    }
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
          if (process.env.NODE_ENV === 'development') {
            console.warn('ChunkLoadError interceptado:', error)
          }

          // Tentar recarregar a página após um delay
          setTimeout(() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Recarregando página devido a ChunkLoadError...')
            }
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
    let url: string
    try {
      if (typeof input === 'string') {
        url = input
      } else if (input instanceof URL) {
        url = input.toString()
      } else if (input instanceof Request) {
        url = input.url
      } else {
        url = String(input)
      }
    } catch {
      url = String(input)
    }
    
    const isChunkOrStatic = url.includes('/_next/static/') || url.includes('/assets/')
    const isSupabaseRequest = url.includes('supabase.co') || url.includes('/rest/v1/') || url.includes('/auth/v1/')

    try {
      const response = await originalFetch(input, init)

      // Verificar se é uma requisição para chunks do Next.js
      if (isChunkOrStatic && !response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Erro ao carregar chunk: ${url} - Status: ${response.status}`)
        }

        // Se for erro 400 ou 404, tentar recarregar a página
        if (response.status === 400 || response.status === 404) {
          setTimeout(() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Recarregando página devido a erro de chunk...')
            }
            window.location.reload()
          }, 1000)
        }
      }

      return response
    } catch (error: any) {
      // Se for chunk ou recurso estático, tentar retornar resposta mockada
      if (isChunkOrStatic) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Erro ao carregar recurso estático: ${url}`, error)
        }
        // Retornar resposta mockada para evitar quebrar a aplicação
        return new Response(null, {
          status: 404,
          statusText: 'Not Found (mock)'
        })
      }

      // Para requisições ao Supabase, propagar o erro silenciosamente
      // O código da aplicação já trata esses erros adequadamente
      if (isSupabaseRequest) {
        // Verificar se é um erro de rede esperado (não logar)
        const isNetworkError = error?.message?.includes('Failed to fetch') ||
                              error?.message?.includes('NetworkError') ||
                              error?.name === 'TypeError' ||
                              error?.name === 'NetworkError' ||
                              error?.message?.includes('ERR_NETWORK_CHANGED') ||
                              error?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
                              error?.message?.includes('ERR_NAME_NOT_RESOLVED')
        
        // Propagar o erro silenciosamente - será tratado pelo código da aplicação
        // Não logar erros de rede esperados do Supabase
        throw error
      }

      // Para outras requisições, verificar se é erro de rede esperado
      const isNetworkError = error?.message?.includes('Failed to fetch') ||
                            error?.message?.includes('NetworkError') ||
                            error?.name === 'TypeError' ||
                            error?.name === 'NetworkError' ||
                            error?.message?.includes('ERR_NETWORK_CHANGED') ||
                            error?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
                            error?.message?.includes('ERR_NAME_NOT_RESOLVED')
      
      // Se for erro de rede genérico, logar apenas em desenvolvimento
      if (isNetworkError && process.env.NODE_ENV === 'development') {
        console.warn(`Erro de rede ao fazer requisição: ${url}`, error)
      }

      // Propagar o erro normalmente
      throw error
    }
  }
}

// Este arquivo é apenas para side-effects, não precisa exportar nada
