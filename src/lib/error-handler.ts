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
  // Garantir que temos um Error válido
  let errorObj: Error
  if (error instanceof Error) {
    errorObj = error
  } else if (typeof error === 'string') {
    errorObj = new Error(error)
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorObj = new Error(String(error.message))
  } else {
    errorObj = new Error('Erro desconhecido')
  }

  const errorData: ErrorInfo = {
    message: errorObj.message || 'Erro desconhecido',
    stack: errorObj.stack,
    timestamp: Date.now(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    ...errorInfo,
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Logged')
    console.error('Error:', errorObj)
    // Só logar errorData se tiver informações relevantes
    const logData: Partial<ErrorInfo> = {}
    if (errorData.message) logData.message = errorData.message
    if (errorData.stack) logData.stack = errorData.stack
    if (errorData.componentStack) logData.componentStack = errorData.componentStack
    if (errorData.errorBoundary) logData.errorBoundary = errorData.errorBoundary
    if (errorData.timestamp) logData.timestamp = errorData.timestamp
    
    if (Object.keys(logData).length > 0) {
      console.error('Error Info:', logData)
    }
    console.groupEnd()
  }

  // In production, you would send this to an error reporting service
  // like Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorService(errorData)
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
