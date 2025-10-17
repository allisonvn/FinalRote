import { useEffect, useCallback } from 'react'

interface ChunkErrorHandlerOptions {
  maxRetries?: number
  retryDelay?: number
  onError?: (error: Error) => void
  onRetry?: (attempt: number) => void
  onSuccess?: () => void
}

export function useChunkErrorHandler(options: ChunkErrorHandlerOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onSuccess
  } = options

  const handleChunkError = useCallback((error: Error) => {
    console.warn('ChunkLoadError detectado:', error)
    
    // Verificar se é um ChunkLoadError
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      onError?.(error)
      
      // Tentar recarregar a página após um delay
      setTimeout(() => {
        console.log('Tentando recarregar a página devido a ChunkLoadError...')
        window.location.reload()
      }, retryDelay)
    }
  }, [onError, retryDelay])

  const retryChunkLoad = useCallback(async (chunkUrl: string, attempt: number = 1): Promise<boolean> => {
    try {
      onRetry?.(attempt)
      
      // Tentar carregar o chunk novamente
      const response = await fetch(chunkUrl, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        console.log(`Chunk carregado com sucesso na tentativa ${attempt}`)
        onSuccess?.()
        return true
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      console.warn(`Tentativa ${attempt} falhou:`, error)
      
      if (attempt < maxRetries) {
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        return retryChunkLoad(chunkUrl, attempt + 1)
      }
      
      // Todas as tentativas falharam
      console.error(`Falha ao carregar chunk após ${maxRetries} tentativas`)
      return false
    }
  }, [maxRetries, retryDelay, onRetry, onSuccess])

  useEffect(() => {
    // Interceptar erros de chunk loading globalmente
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.error && (
        event.error.name === 'ChunkLoadError' || 
        event.error.message?.includes('Loading chunk')
      )) {
        handleChunkError(event.error)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && (
        event.reason.name === 'ChunkLoadError' || 
        event.reason.message?.includes('Loading chunk')
      )) {
        handleChunkError(event.reason)
      }
    }

    // Adicionar listeners
    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [handleChunkError])

  return {
    handleChunkError,
    retryChunkLoad
  }
}
