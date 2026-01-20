// Error handling utilities for better development experience

export interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  errorBoundary?: string
  timestamp: number
  userAgent?: string
  url?: string
}

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, AppError)
  }
}

export function logError(error: Error | unknown, errorInfo?: Partial<ErrorInfo>) {
  try {
    // Garantir que temos um Error válido
    let errorObj: Error
    try {
      if (error instanceof Error) {
        errorObj = error
      } else if (typeof error === 'string') {
        errorObj = new Error(error)
      } else if (error && typeof error === 'object') {
        // Tentar extrair o máximo de informação possível
        const err = error as Record<string, unknown>
        const message = err.message || err.error || err.code || ''

        if (message && typeof message === 'string') {
          errorObj = new Error(message)
        } else if (
          typeof err.toString === 'function' &&
          err.toString() !== '[object Object]'
        ) {
          errorObj = new Error(err.toString())
        } else {
          // Tentar stringify se for um objeto simples
          try {
            const str = JSON.stringify(err)
            if (str && str !== '{}') {
              errorObj = new Error(`Erro objeto: ${str}`)
            } else {
              errorObj = new Error('Erro desconhecido (objeto sem propriedades enumeráveis)')
            }
          } catch {
            errorObj = new Error('Erro desconhecido (objeto não serializável)')
          }
        }

        // Copiar propriedades extras se existirem (stack, digest, etc)
        if (err.stack && typeof err.stack === 'string') errorObj.stack = err.stack
        if (err.digest && typeof err.digest === 'string') (errorObj as any).digest = err.digest
      } else if (error === null || error === undefined) {
        errorObj = new Error('Erro desconhecido (null/undefined)')
      } else {
        errorObj = new Error(`Erro desconhecido (tipo: ${typeof error}): ${String(error)}`)
      }
    } catch (e) {
      errorObj = new Error('Erro ao processar objeto de erro')
    }

    // Construir errorData de forma segura
    const errorData: ErrorInfo = {
      message: (errorObj?.message || 'Erro desconhecido').substring(0, 500), // Limitar tamanho
      stack: errorObj?.stack || undefined,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location?.href : undefined,
      ...errorInfo,
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      try {
        console.group('🚨 Error Logged')
        console.error('Error:', errorObj)

        // Construir logData de forma segura e garantida
        const logData: Record<string, unknown> = {
          message: errorData.message || 'Erro desconhecido',
          timestamp: errorData.timestamp,
        }

        if (errorData.stack) {
          logData.stack = errorData.stack
        }
        if (errorData.componentStack) {
          logData.componentStack = errorData.componentStack
        }
        if (errorData.errorBoundary) {
          logData.errorBoundary = errorData.errorBoundary
        }
        if (errorData.userAgent) {
          logData.userAgent = errorData.userAgent
        }
        if (errorData.url) {
          logData.url = errorData.url
        }

        // Garantir que sempre temos pelo menos message e timestamp
        console.error('Error Info:', {
          ...logData,
          _isLogged: true,
          _source: errorInfo?.errorBoundary || 'unknown'
        })
        console.groupEnd()
      } catch (loggingError) {
        // Se houver erro ao logar, pelo menos logar o erro original de forma simples
        console.error('Erro ao processar log:', loggingError)
        console.error('Erro original (string):', String(error))
      }
    }

    // In production, you would send this to an error reporting service
    // like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorService(errorData)
    }
  } catch (outerError) {
    // Última linha de defesa - se tudo falhar, pelo menos logar algo
    console.error('Erro crítico no logError:', outerError)
    console.error('Erro original (raw):', error)
  }
}

export function handleChunkLoadError(error: Error) {
  console.warn('Chunk load error detected, attempting recovery...', error)

  // Attempt to reload the page after a short delay
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
}

export function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    error.message.includes('Loading chunk') ||
    error.message.includes('Loading CSS chunk')
  )
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    try {
      const errorObj = error instanceof Error
        ? error
        : typeof error === 'string'
          ? new Error(error)
          : new Error(JSON.stringify(error))

      logError(errorObj, {
        errorBoundary: 'unhandledrejection',
      })
    } catch (e) {
      console.error('Error logging unhandled rejection:', e, 'Original:', error)
    }
  })

  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message)
    logError(error, {
      errorBoundary: 'global',
    })
  })
}
