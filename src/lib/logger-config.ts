import { logger, LogLevel, ConsoleTransport, SupabaseTransport } from './logger'

/**
 * Configuração do sistema de logs
 */

export function configureLogger() {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  
  const transports = []

  // Console transport para desenvolvimento
  if (isDevelopment || process.env.ENABLE_CONSOLE_LOGS === 'true') {
    transports.push(new ConsoleTransport())
  }

  // Supabase transport para produção
  if (isProduction && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    transports.push(
      new SupabaseTransport(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    )
  }

  logger.configure({
    minLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
    transports,
    context: {
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      service: 'rotafinal-web'
    }
  })
}

// Middleware para API routes
export function withLogger(handler: Function) {
  return async (req: any, res: any) => {
    const requestId = req.headers['x-request-id'] || generateRequestId()
    const startTime = Date.now()

    // Criar logger com contexto do request
    const requestLogger = logger.withContext({
      requestId,
      method: req.method,
      path: req.url,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    })

    // Adicionar logger ao request
    req.logger = requestLogger

    // Log do início do request
    requestLogger.info('Request iniciado', {
      headers: req.headers,
      query: req.query,
      body: req.body
    })

    // Interceptar response
    const originalJson = res.json
    res.json = function(data: any) {
      const duration = Date.now() - startTime
      
      requestLogger.info('Request concluído', {
        statusCode: res.statusCode,
        duration,
        responseSize: JSON.stringify(data).length,
        tags: ['api', 'request']
      })

      return originalJson.call(this, data)
    }

    try {
      await handler(req, res)
    } catch (error) {
      const duration = Date.now() - startTime
      
      requestLogger.error('Request falhou', {
        error,
        duration,
        tags: ['api', 'error']
      })

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          requestId
        })
      }
    }
  }
}

// Hook para usar logger em componentes React
import { useEffect, useRef } from 'react'

export function useLogger(componentName: string, props?: any) {
  const loggerRef = useRef(
    logger.withContext({
      component: componentName,
      props: props ? Object.keys(props) : undefined
    })
  )

  useEffect(() => {
    loggerRef.current.debug(`Componente ${componentName} montado`)
    
    return () => {
      loggerRef.current.debug(`Componente ${componentName} desmontado`)
    }
  }, [componentName])

  return loggerRef.current
}

// Utilitários
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}

// Error boundary com logging
import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class LoggingErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React Error Boundary capturou erro', {
      error,
      componentStack: errorInfo.componentStack,
      tags: ['react', 'error-boundary']
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Algo deu errado
          </h2>
          <p className="text-gray-600">
            Um erro inesperado ocorreu. Por favor, recarregue a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recarregar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Monitoramento de Web Vitals
export function reportWebVitals(metric: any) {
  logger.info('Web Vital reportado', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    tags: ['performance', 'web-vitals', metric.name.toLowerCase()]
  })

  // Enviar para analytics se configurado
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating
    })
  }
}

// Tracking de erros do cliente
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Erro não capturado no cliente', {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error,
      tags: ['client', 'uncaught-error']
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Promise rejeitada não tratada', {
      reason: event.reason,
      promise: event.promise,
      tags: ['client', 'unhandled-rejection']
    })
  })
}
