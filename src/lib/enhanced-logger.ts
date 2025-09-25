import winston from 'winston'

// Configuração do logger aprimorado
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
      let output = `${timestamp} [${level.toUpperCase()}] [${service || 'SYSTEM'}] ${message}`
      
      if (Object.keys(meta).length > 0) {
        output += `\n${JSON.stringify(meta, null, 2)}`
      }
      
      return output
    })
  ),
  defaultMeta: { service: 'rotafinal-api' },
  transports: [
    // Console transport sempre ativo
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          let emoji = '📝'
          if (level.includes('error')) emoji = '🔴'
          else if (level.includes('warn')) emoji = '🟡'
          else if (level.includes('info')) emoji = '🔵'
          else if (level.includes('debug')) emoji = '🟣'
          
          let output = `${emoji} ${timestamp} [${service || 'SYSTEM'}] ${message}`
          
          if (Object.keys(meta).length > 0) {
            output += `\n${JSON.stringify(meta, null, 2)}`
          }
          
          return output
        })
      )
    })
  ]
})

// Se não estamos em produção, adicionar transport de arquivo
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    format: winston.format.json()
  }))
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    format: winston.format.json()
  }))
}

// Interface para estruturar logs de API
interface ApiLogContext {
  userId?: string
  requestId?: string
  endpoint?: string
  method?: string
  userAgent?: string
  ip?: string
  duration?: number
  statusCode?: number
}

interface ExperimentLogContext extends ApiLogContext {
  experimentId?: string
  experimentName?: string
  projectId?: string
  variantId?: string
  action?: 'create' | 'update' | 'delete' | 'view' | 'assign' | 'convert'
}

export class EnhancedLogger {
  private context: ApiLogContext = {}

  constructor(initialContext?: ApiLogContext) {
    if (initialContext) {
      this.context = { ...initialContext }
    }
  }

  // Adicionar contexto persistente
  addContext(context: Partial<ApiLogContext>) {
    this.context = { ...this.context, ...context }
    return this
  }

  // Logs gerais
  info(message: string, meta?: any) {
    logger.info(message, { ...this.context, ...meta })
  }

  warn(message: string, meta?: any) {
    logger.warn(message, { ...this.context, ...meta })
  }

  error(message: string, error?: any, meta?: any) {
    const errorMeta = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        details: error.details,
        hint: error.hint
      }
    } : {}
    
    logger.error(message, { ...this.context, ...errorMeta, ...meta })
  }

  debug(message: string, meta?: any) {
    logger.debug(message, { ...this.context, ...meta })
  }

  // Logs específicos para experimentos
  experiment(action: ExperimentLogContext['action'], message: string, context?: ExperimentLogContext) {
    const experimentContext = {
      ...this.context,
      ...context,
      action,
      type: 'experiment'
    }
    
    logger.info(`[EXPERIMENT-${action?.toUpperCase()}] ${message}`, experimentContext)
  }

  // Log de performance de API
  apiCall(message: string, context: ApiLogContext) {
    const perfContext = {
      ...this.context,
      ...context,
      type: 'api_performance'
    }
    
    logger.info(`[API] ${message}`, perfContext)
  }

  // Log de dados de entrada (data validation)
  validation(message: string, data?: any, errors?: any) {
    const validationContext = {
      ...this.context,
      type: 'validation',
      inputData: data,
      validationErrors: errors
    }
    
    logger.debug(`[VALIDATION] ${message}`, validationContext)
  }

  // Log de banco de dados
  database(operation: string, table: string, result?: any, error?: any) {
    const dbContext = {
      ...this.context,
      type: 'database',
      operation,
      table,
      result: result ? { success: true, recordCount: Array.isArray(result) ? result.length : 1 } : undefined,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : undefined
    }
    
    if (error) {
      logger.error(`[DB-${operation.toUpperCase()}] ${table} operation failed`, dbContext)
    } else {
      logger.info(`[DB-${operation.toUpperCase()}] ${table} operation successful`, dbContext)
    }
  }
}

// Helper para criar logger com contexto de request
export const createRequestLogger = (req: any) => {
  const requestId = Math.random().toString(36).substring(7)
  const context: ApiLogContext = {
    requestId,
    endpoint: req.url,
    method: req.method,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
  }
  
  return new EnhancedLogger(context)
}

// Logger global para uso geral
export const log = new EnhancedLogger()

// Logs estruturados específicos para diferentes operações
export const logTypes = {
  // Experimento
  experimentCreated: (experimentId: string, experimentName: string, userId: string) => {
    log.experiment('create', `Experimento criado com sucesso`, {
      experimentId,
      experimentName,
      userId
    })
  },
  
  experimentError: (action: string, error: any, context?: any) => {
    log.experiment(action as any, `Erro na operação de experimento`, {
      ...context,
      error: {
        message: error.message,
        code: error.code,
        details: error.details
      }
    })
  },

  // API Performance
  apiTiming: (endpoint: string, method: string, duration: number, statusCode: number) => {
    log.apiCall(`${method} ${endpoint} completed`, {
      endpoint,
      method,
      duration,
      statusCode
    })
  },

  // Validação
  validationFailed: (field: string, value: any, expectedType: string) => {
    log.validation(`Validation failed for field: ${field}`, {
      field,
      value,
      expectedType
    })
  }
}

export default logger
