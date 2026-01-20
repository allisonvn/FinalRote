/**
 * Rate Limiting
 * @description Sistema de rate limiting para APIs públicas
 * Suporta tanto Upstash Redis quanto fallback em memória
 */

// Configuração de limites por endpoint
export const rateLimitConfig = {
  // API pública de tracking: 100 requests por minuto por IP
  tracking: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minuto
  },
  // API pública de assignment: 50 requests por minuto por IP
  assignment: {
    limit: 50,
    windowMs: 60 * 1000,
  },
  // Webhooks: 20 requests por segundo por IP (proteção DDoS)
  webhooks: {
    limit: 20,
    windowMs: 1000,
  },
  // API autenticada geral: 1000 requests por minuto por usuário
  authenticated: {
    limit: 1000,
    windowMs: 60 * 1000,
  }
}

// =====================================================
// RATE LIMITING EM MEMÓRIA (fallback sem Redis)
// =====================================================

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

/**
 * Rate limiter em memória (para desenvolvimento ou sem Redis)
 */
export function rateLimitMemory(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.resetTime }
  }

  record.count++
  return { success: true, remaining: limit - record.count, reset: record.resetTime }
}

// Limpeza periódica do cache em memória
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }, 60000) // Limpar a cada minuto
}

// =====================================================
// RATE LIMITING COM UPSTASH REDIS (recomendado para produção)
// =====================================================

let upstashRatelimit: any = null
let upstashRedis: any = null

/**
 * Inicializar Upstash rate limiter (lazy loading)
 */
async function initUpstashRatelimit() {
  if (upstashRatelimit) return upstashRatelimit

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl || !redisToken) {
    console.warn('[RateLimit] Upstash credentials not configured, using memory fallback')
    return null
  }

  try {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis } = await import('@upstash/redis')

    upstashRedis = new Redis({
      url: redisUrl,
      token: redisToken
    })

    upstashRatelimit = {
      tracking: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.slidingWindow(rateLimitConfig.tracking.limit, '1 m'),
        analytics: true,
        prefix: 'ratelimit:tracking'
      }),
      assignment: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.slidingWindow(rateLimitConfig.assignment.limit, '1 m'),
        analytics: true,
        prefix: 'ratelimit:assignment'
      }),
      webhooks: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.tokenBucket(rateLimitConfig.webhooks.limit, '1 s', 30),
        analytics: true,
        prefix: 'ratelimit:webhooks'
      }),
      authenticated: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.slidingWindow(rateLimitConfig.authenticated.limit, '1 m'),
        analytics: true,
        prefix: 'ratelimit:auth'
      })
    }

    console.log('[RateLimit] Upstash rate limiter initialized')
    return upstashRatelimit
  } catch (error) {
    console.warn('[RateLimit] Failed to initialize Upstash, using memory fallback:', error)
    return null
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Extrair IP do cliente da requisição
 */
export function getClientIP(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')

  if (cfIP) return cfIP // Cloudflare
  if (xff) return xff.split(',')[0].trim()
  if (realIP) return realIP
  return '127.0.0.1'
}

/**
 * Aplicar rate limit (auto-detecta Upstash ou fallback para memória)
 */
export async function applyRateLimit(
  request: Request,
  type: keyof typeof rateLimitConfig = 'authenticated',
  identifier?: string
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const id = identifier || getClientIP(request)
  const config = rateLimitConfig[type]

  // Tentar usar Upstash primeiro
  const upstash = await initUpstashRatelimit()

  if (upstash && upstash[type]) {
    try {
      const result = await upstash[type].limit(id)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset
      }
    } catch (error) {
      console.warn('[RateLimit] Upstash error, falling back to memory:', error)
    }
  }

  // Fallback para rate limiting em memória
  const memoryResult = rateLimitMemory(
    `${type}:${id}`,
    config.limit,
    config.windowMs
  )

  return {
    success: memoryResult.success,
    limit: config.limit,
    remaining: memoryResult.remaining,
    reset: memoryResult.reset
  }
}

/**
 * Criar resposta de rate limit exceeded
 */
export function rateLimitResponse(result: {
  limit: number
  remaining: number
  reset: number
}): Response {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

  return new Response('Too Many Requests', {
    status: 429,
    headers: {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.toString(),
      'Retry-After': Math.max(1, retryAfter).toString(),
      'Content-Type': 'text/plain'
    }
  })
}

/**
 * Adicionar headers de rate limit à resposta
 */
export function addRateLimitHeaders(
  headers: Headers,
  result: { limit: number; remaining: number; reset: number }
): void {
  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.reset.toString())
}
