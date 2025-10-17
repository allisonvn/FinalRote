'use client'

// Script para inicializar o tratamento de erros de chunk loading
// Este arquivo é executado no lado do cliente

import { chunkErrorHandler } from '@/utils/chunkErrorHandler'

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
          error.message?.includes('ERR_ABORTED')
        )) {
          console.warn('ChunkLoadError interceptado:', error)
          
          // Tentar recarregar a página após um delay
          setTimeout(() => {
            console.log('Recarregando página devido a ChunkLoadError...')
            window.location.reload()
          }, 2000)
        }
        throw error
      }
    }
  }

  // Interceptar erros de fetch para chunks
  const originalFetch = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const response = await originalFetch(input, init)
      
      // Verificar se é uma requisição para chunks do Next.js
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/_next/static/chunks/') && !response.ok) {
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
      console.error('Erro no fetch:', error)
      throw error
    }
  }
}

export default chunkErrorHandler
