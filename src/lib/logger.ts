/**
 * Sistema de Logging Estruturado para Rota Final
 * Suporta múltiplos transportes e níveis de log
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogContext {
  userId?: string
  organizationId?: string
  projectId?: string
  experimentId?: string
  variantId?: string
  visitorId?: string
  sessionId?: string
  requestId?: string
  [key: string]: any
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: LogContext
  error?: Error
  metadata?: Record<string, any>
  duration?: number
  tags?: string[]
}

interface LogTransport {
  log(entry: LogEntry): void | Promise<void>
}

// Transport para console (desenvolvimento)
class ConsoleTransport implements LogTransport {
  log(entry: LogEntry): void {
    const levelColors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m'  // Magenta
    }

    const reset = '\x1b[0m'
    const color = levelColors[entry.level]
    const levelName = LogLevel[entry.level]
    const timestamp = entry.timestamp.toISOString()

    console.log(
      `${color}[${levelName}]${reset} ${timestamp} - ${entry.message}`,
      {
        context: entry.context,
        metadata: entry.metadata,
        error: entry.error,
        duration: entry.duration,
        tags: entry.tags
      }
    )

    if (entry.error) {
      console.error(entry.error)
    }
  }
}

// Transport para Supabase (produção)
class SupabaseTransport implements LogTransport {
  private queue: LogEntry[] = []
  private flushTimer?: NodeJS.Timeout
  private flushInterval = 5000 // 5 segundos
  private maxBatchSize = 50

  constructor(private supabaseUrl: string, private supabaseKey: string) {
    this.startFlushTimer()
  }

  async log(entry: LogEntry): Promise<void> {
    this.queue.push(entry)

    if (this.queue.length >= this.maxBatchSize) {
      await this.flush()
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const batch = this.queue.splice(0, this.maxBatchSize)

    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify(
          batch.map(entry => ({
            level: LogLevel[entry.level],
            message: entry.message,
            timestamp: entry.timestamp.toISOString(),
            context: entry.context,
            metadata: entry.metadata,
            error_message: entry.error?.message,
            error_stack: entry.error?.stack,
            duration_ms: entry.duration,
            tags: entry.tags
          }))
        )
      })

      if (!response.ok) {
        console.error('Falha ao enviar logs para Supabase:', response.statusText)
      }
    } catch (error) {
      console.error('Erro ao enviar logs:', error)
      // Re-adicionar à fila em caso de erro
      this.queue.unshift(...batch)
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush()
  }
}

// Transport para métricas (performance)
class MetricsTransport implements LogTransport {
  private metrics = new Map<string, number[]>()

  log(entry: LogEntry): void {
    if (entry.duration !== undefined && entry.tags) {
      entry.tags.forEach(tag => {
        if (!this.metrics.has(tag)) {
          this.metrics.set(tag, [])
        }
        this.metrics.get(tag)!.push(entry.duration)
      })
    }
  }

  getMetrics(tag: string): { count: number; avg: number; min: number; max: number; p95: number } | null {
    const values = this.metrics.get(tag)
    if (!values || values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)
    const p95Index = Math.floor(values.length * 0.95)

    return {
      count: values.length,
      avg: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[p95Index]
    }
  }

  reset(): void {
    this.metrics.clear()
  }
}

// Logger principal
export class Logger {
  private static instance: Logger
  private transports: LogTransport[] = []
  private context: LogContext = {}
  private minLevel: LogLevel = LogLevel.INFO

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  configure(options: {
    minLevel?: LogLevel
    transports?: LogTransport[]
    context?: LogContext
  }): void {
    if (options.minLevel !== undefined) {
      this.minLevel = options.minLevel
    }

    if (options.transports) {
      this.transports = options.transports
    }

    if (options.context) {
      this.context = { ...this.context, ...options.context }
    }
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport)
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context }
  }

  clearContext(): void {
    this.context = {}
  }

  withContext(context: LogContext): Logger {
    const childLogger = Object.create(this)
    childLogger.context = { ...this.context, ...context }
    return childLogger
  }

  private log(level: LogLevel, message: string, metadata?: any): void {
    if (level < this.minLevel) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: this.context,
      metadata
    }

    if (metadata instanceof Error) {
      entry.error = metadata
      entry.metadata = undefined
    } else if (metadata?.error instanceof Error) {
      entry.error = metadata.error
      delete metadata.error
    }

    if (metadata?.duration !== undefined) {
      entry.duration = metadata.duration
      delete metadata.duration
    }

    if (metadata?.tags) {
      entry.tags = metadata.tags
      delete metadata.tags
    }

    this.transports.forEach(transport => {
      try {
        transport.log(entry)
      } catch (error) {
        console.error('Erro no transport de log:', error)
      }
    })
  }

  debug(message: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, metadata)
  }

  info(message: string, metadata?: any): void {
    this.log(LogLevel.INFO, message, metadata)
  }

  warn(message: string, metadata?: any): void {
    this.log(LogLevel.WARN, message, metadata)
  }

  error(message: string, error?: Error | any): void {
    this.log(LogLevel.ERROR, message, error)
  }

  fatal(message: string, error?: Error | any): void {
    this.log(LogLevel.FATAL, message, error)
  }

  // Métodos de performance
  time(label: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.info(`${label} concluído`, { 
        duration, 
        tags: ['performance', label] 
      })
    }
  }

  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - start
      
      this.info(`${label} concluído`, { 
        duration, 
        tags: ['performance', label] 
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      this.error(`${label} falhou`, {
        error,
        duration,
        tags: ['performance', label, 'error']
      })
      
      throw error
    }
  }
}

// Exportar instância singleton
export const logger = Logger.getInstance()

// Configuração padrão para desenvolvimento
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  logger.configure({
    minLevel: LogLevel.DEBUG,
    transports: [new ConsoleTransport()]
  })
}

// Helpers para contexto de request
export function createRequestLogger(requestId: string, context?: LogContext): Logger {
  return logger.withContext({ requestId, ...context })
}

// Middleware para Next.js
export function loggerMiddleware(req: any, res: any, next: () => void): void {
  const requestId = req.headers['x-request-id'] || generateRequestId()
  const requestLogger = createRequestLogger(requestId, {
    method: req.method,
    path: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  })

  req.logger = requestLogger

  const endTimer = requestLogger.time('request')

  res.on('finish', () => {
    endTimer()
    requestLogger.info('Request concluído', {
      statusCode: res.statusCode,
      contentLength: res.get('content-length')
    })
  })

  next()
}

// Utilidades
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}

// Exportar tipos e classes
export { ConsoleTransport, SupabaseTransport, MetricsTransport, LogTransport }
