'use client'

// Handler robusto para ChunkLoadError
// Intercepta especificamente o erro 404 em chunks do Next.js

if (typeof window !== 'undefined') {
  console.log('Robust ChunkErrorHandler inicializado')

  // Interceptar erros globais
  const handleGlobalError = (event: ErrorEvent) => {
    const error = event.error
    if (error && (
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('ERR_ABORTED') ||
      error.message?.includes('net::ERR_ABORTED') ||
      error.message?.includes('404 (Not Found)')
    )) {
      console.warn('ChunkLoadError detectado globalmente:', error)
      
      // Recarregar página imediatamente para chunks 404
      if (error.message?.includes('404 (Not Found)') || error.message?.includes('ERR_ABORTED')) {
        console.log('Chunk 404 detectado, recarregando página...')
        setTimeout(() => {
          window.location.reload()
        }, 500)
        return
      }
      
      // Para outros tipos de ChunkLoadError, tentar recarregar após delay
      setTimeout(() => {
        console.log('Recarregando página devido a ChunkLoadError...')
        window.location.reload()
      }, 2000)
    }
  }

  // Interceptar rejeições de promise não tratadas
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason
    if (error && (
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('ERR_ABORTED') ||
      error.message?.includes('net::ERR_ABORTED') ||
      error.message?.includes('404 (Not Found)')
    )) {
      console.warn('ChunkLoadError detectado em promise rejeitada:', error)
      
      // Recarregar página imediatamente para chunks 404
      if (error.message?.includes('404 (Not Found)') || error.message?.includes('ERR_ABORTED')) {
        console.log('Chunk 404 detectado em promise, recarregando página...')
        setTimeout(() => {
          window.location.reload()
        }, 500)
        return
      }
      
      // Para outros tipos de ChunkLoadError, tentar recarregar após delay
      setTimeout(() => {
        console.log('Recarregando página devido a ChunkLoadError em promise...')
        window.location.reload()
      }, 2000)
    }
  }

  // Interceptar fetch para chunks específicos
  const originalFetch = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const response = await originalFetch(input, init)
      
      // Verificar se é uma requisição para chunks do Next.js que falhou
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/_next/static/chunks/') && !response.ok) {
        console.warn(`Chunk 404 detectado: ${url} - Status: ${response.status}`)
        
        // Recarregar página imediatamente para chunks 404
        setTimeout(() => {
          console.log('Recarregando página devido a chunk 404...')
          window.location.reload()
        }, 500)
      }
      
      return response
    } catch (error: any) {
      // Verificar se é um erro de chunk loading
      if (error && (
        error.name === 'ChunkLoadError' ||
        error.message?.includes('Loading chunk') ||
        error.message?.includes('ChunkLoadError') ||
        error.message?.includes('ERR_ABORTED') ||
        error.message?.includes('net::ERR_ABORTED')
      )) {
        console.warn('ChunkLoadError em fetch:', error)
        
        // Recarregar página após delay
        setTimeout(() => {
          console.log('Recarregando página devido a ChunkLoadError em fetch...')
          window.location.reload()
        }, 1000)
      }
      
      throw error
    }
  }

  // Interceptar webpack require
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
          console.warn('ChunkLoadError em webpack require:', error)
          
          // Recarregar página após delay
          setTimeout(() => {
            console.log('Recarregando página devido a ChunkLoadError em webpack...')
            window.location.reload()
          }, 1000)
        }
        throw error
      }
    }
  }

  // Adicionar listeners
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)

  // Cleanup quando a página for descarregada
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('error', handleGlobalError)
    window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  })
}
