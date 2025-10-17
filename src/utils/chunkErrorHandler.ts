/**
 * Utilitário para tratar erros de ChunkLoadError
 * Intercepta e corrige problemas de carregamento de chunks JavaScript
 */

interface ChunkErrorInfo {
  chunkId: string
  chunkUrl: string
  error: Error
  timestamp: number
}

class ChunkErrorHandler {
  private retryAttempts = new Map<string, number>()
  private maxRetries = 3
  private retryDelay = 1000
  private isHandling = false

  constructor() {
    this.setupGlobalErrorHandling()
  }

  private setupGlobalErrorHandling() {
    // Interceptar erros de chunk loading
    if (typeof window !== 'undefined') {
      // Interceptar erros de webpack
      const originalWebpackRequire = (window as any).__webpack_require__
      if (originalWebpackRequire) {
        (window as any).__webpack_require__ = (id: string) => {
          try {
            return originalWebpackRequire(id)
          } catch (error) {
            if (this.isChunkError(error)) {
              this.handleChunkError(error, id)
              throw error
            }
            throw error
          }
        }
      }

      // Interceptar erros globais
      window.addEventListener('error', (event) => {
        if (this.isChunkError(event.error)) {
          this.handleChunkError(event.error)
        }
      })

      // Interceptar rejeições de Promise
      window.addEventListener('unhandledrejection', (event) => {
        if (this.isChunkError(event.reason)) {
          this.handleChunkError(event.reason)
        }
      })
    }
  }

  private isChunkError(error: any): boolean {
    if (!error) return false
    
    const errorMessage = error.message || error.toString()
    const errorName = error.name || ''
    
    return (
      errorName === 'ChunkLoadError' ||
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('ChunkLoadError') ||
      errorMessage.includes('Loading CSS chunk') ||
      errorMessage.includes('ERR_ABORTED') ||
      errorMessage.includes('net::ERR_ABORTED')
    )
  }

  private extractChunkInfo(error: Error): ChunkErrorInfo | null {
    const message = error.message || ''
    
    // Extrair URL do chunk do erro
    const urlMatch = message.match(/https?:\/\/[^\s]+\.js/)
    const chunkUrl = urlMatch ? urlMatch[0] : ''
    
    // Extrair ID do chunk
    const chunkIdMatch = message.match(/chunks\/(\d+)-/)
    const chunkId = chunkIdMatch ? chunkIdMatch[1] : 'unknown'

    return {
      chunkId,
      chunkUrl,
      error,
      timestamp: Date.now()
    }
  }

  private async handleChunkError(error: Error, chunkId?: string) {
    if (this.isHandling) return
    
    this.isHandling = true
    
    try {
      const chunkInfo = this.extractChunkInfo(error)
      if (!chunkInfo) {
        console.warn('Não foi possível extrair informações do chunk do erro:', error)
        return
      }

      const currentAttempts = this.retryAttempts.get(chunkInfo.chunkId) || 0
      
      if (currentAttempts >= this.maxRetries) {
        console.error(`Máximo de tentativas atingido para chunk ${chunkInfo.chunkId}. Recarregando página...`)
        this.forceReload()
        return
      }

      console.log(`Tentativa ${currentAttempts + 1} de ${this.maxRetries} para carregar chunk ${chunkInfo.chunkId}`)
      
      // Incrementar contador de tentativas
      this.retryAttempts.set(chunkInfo.chunkId, currentAttempts + 1)

      // Aguardar antes da próxima tentativa
      await this.delay(this.retryDelay * (currentAttempts + 1))

      // Tentar recarregar o chunk
      const success = await this.retryChunkLoad(chunkInfo.chunkUrl)
      
      if (success) {
        console.log(`Chunk ${chunkInfo.chunkId} carregado com sucesso`)
        this.retryAttempts.delete(chunkInfo.chunkId)
      } else {
        console.warn(`Falha ao carregar chunk ${chunkInfo.chunkId} na tentativa ${currentAttempts + 1}`)
      }

    } catch (retryError) {
      console.error('Erro ao tentar recarregar chunk:', retryError)
    } finally {
      this.isHandling = false
    }
  }

  private async retryChunkLoad(chunkUrl: string): Promise<boolean> {
    try {
      // Tentar carregar o chunk com cache bypass
      const response = await fetch(chunkUrl, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Verificar se o conteúdo é JavaScript válido
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('javascript')) {
        throw new Error(`MIME type incorreto: ${contentType}`)
      }

      return true
    } catch (error) {
      console.warn('Erro ao recarregar chunk:', error)
      return false
    }
  }

  private forceReload() {
    // Limpar cache do navegador e recarregar
    if (typeof window !== 'undefined') {
      // Tentar limpar cache
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name)
          })
        })
      }
      
      // Recarregar página
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Método público para resetar tentativas
  public resetRetryCount(chunkId?: string) {
    if (chunkId) {
      this.retryAttempts.delete(chunkId)
    } else {
      this.retryAttempts.clear()
    }
  }

  // Método público para forçar reload
  public forceReloadPage() {
    this.forceReload()
  }
}

// Instância singleton
export const chunkErrorHandler = new ChunkErrorHandler()

// Hook para usar em componentes React
export function useChunkErrorHandler() {
  return {
    resetRetryCount: (chunkId?: string) => chunkErrorHandler.resetRetryCount(chunkId),
    forceReload: () => chunkErrorHandler.forceReloadPage()
  }
}
