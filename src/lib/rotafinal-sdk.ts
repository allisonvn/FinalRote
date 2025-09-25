/**
 * Rota Final JavaScript SDK
 * SDK otimizado para testes A/B com Multi-Armed Bandit
 */

interface RotaFinalConfig {
  apiKey: string
  apiUrl?: string
  debug?: boolean
  enableAutoPageView?: boolean
  enableAutoClickTracking?: boolean
  cookieDomain?: string
  cookieExpiry?: number // dias
  flushInterval?: number // ms
  maxBatchSize?: number
}

interface Variant {
  variant_id: string
  variant_key: string
  variant_name: string
  config?: any
  is_new: boolean
}

interface TrackEvent {
  visitor_id: string
  event_type: string
  event_name: string
  properties?: Record<string, any>
  value?: number
  experiment_key?: string
  timestamp?: string
}

interface ExperimentMetrics {
  experiment: {
    id: string
    name: string
    status: string
    algorithm: string
  }
  variants: Array<{
    variant_id: string
    variant_name: string
    visitors: number
    conversions: number
    conversion_rate: number
    revenue?: number
    significance?: any
  }>
  summary: {
    total_visitors: number
    total_conversions: number
    total_revenue: number
    overall_conversion_rate: number
  }
}

class RotaFinal {
  private config: Required<RotaFinalConfig>
  private visitorId: string
  private eventQueue: TrackEvent[] = []
  private flushTimer?: number
  private assignmentCache: Map<string, Variant> = new Map()
  private initialized = false

  constructor(config: RotaFinalConfig) {
    // Validar configuração
    if (!config.apiKey) {
      throw new Error('RotaFinal: apiKey é obrigatório')
    }

    // Configuração padrão
    this.config = {
      apiKey: config.apiKey,
      apiUrl: config.apiUrl || 'https://rotafinal.com.br/api',
      debug: config.debug || false,
      enableAutoPageView: config.enableAutoPageView !== false,
      enableAutoClickTracking: config.enableAutoClickTracking !== false,
      cookieDomain: config.cookieDomain || '',
      cookieExpiry: config.cookieExpiry || 365,
      flushInterval: config.flushInterval || 5000,
      maxBatchSize: config.maxBatchSize || 50
    }

    // Gerar ou recuperar visitor ID
    this.visitorId = this.getOrCreateVisitorId()

    // Inicializar
    this.init()
  }

  /**
   * Inicializa o SDK
   */
  private init(): void {
    if (this.initialized) return

    // Inicializar captura de UTMs
    this.initUTMCapture()

    // Auto-tracking de page view
    if (this.config.enableAutoPageView && typeof window !== 'undefined') {
      const utmData = this.getUTMData()
      const sessionInfo = this.getSessionInfo()
      this.track('page_view', window.location.pathname, {
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
        ...utmData,
        ...sessionInfo
      })

      // Escutar mudanças de rota (SPA)
      const originalPushState = history.pushState
      history.pushState = (...args) => {
        originalPushState.apply(history, args)
        this.track('page_view', window.location.pathname, {
          url: window.location.href,
          title: document.title
        })
      }

      window.addEventListener('popstate', () => {
        this.track('page_view', window.location.pathname, {
          url: window.location.href,
          title: document.title
        })
      })
    }

    // Auto-tracking de cliques
    if (this.config.enableAutoClickTracking && typeof document !== 'undefined') {
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const clickData = {
          tag: target.tagName,
          text: target.textContent?.substring(0, 100),
          class: target.className,
          id: target.id
        }

        // Rastrear apenas elementos interativos
        if (['A', 'BUTTON', 'INPUT', 'SELECT'].includes(target.tagName)) {
          this.track('click', `${target.tagName.toLowerCase()}_click`, clickData)
        }
      })
    }

    // Configurar flush automático
    if (this.config.flushInterval > 0) {
      this.flushTimer = window.setInterval(() => {
        this.flush()
      }, this.config.flushInterval)
    }

    // Flush ao sair da página
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true) // Force sync flush
      })
    }

    this.initialized = true
    this.log('SDK inicializado')
  }

  /**
   * Obtém variante de um experimento
   */
  async getVariant(experimentKey: string, context?: Record<string, any>): Promise<Variant | null> {
    try {
      // Verificar cache
      const cacheKey = `${experimentKey}_${this.visitorId}`
      if (this.assignmentCache.has(cacheKey)) {
        return this.assignmentCache.get(cacheKey)!
      }

      // Buscar do servidor
      const response = await fetch(`${this.config.apiUrl}/assign-variant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey
        },
        body: JSON.stringify({
          experiment_key: experimentKey,
          visitor_id: this.visitorId,
          context: context || {}
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao obter variante')
      }

      const variant = await response.json()
      
      // Cachear resultado
      this.assignmentCache.set(cacheKey, variant)
      
      // Aplicar configuração se houver
      if (variant.config) {
        this.applyVariantConfig(variant.config)
      }

      this.log('Variante atribuída:', variant)
      return variant
    } catch (error) {
      this.error('Erro ao obter variante:', error)
      return null
    }
  }

  /**
   * Rastreia um evento
   */
  track(
    eventType: string, 
    eventName: string, 
    properties?: Record<string, any>, 
    value?: number,
    experimentKey?: string
  ): void {
    const event: TrackEvent = {
      visitor_id: this.visitorId,
      event_type: eventType,
      event_name: eventName,
      properties: properties || {},
      value,
      experiment_key: experimentKey,
      timestamp: new Date().toISOString()
    }

    // Adicionar à fila
    this.eventQueue.push(event)
    this.log('Evento rastreado:', event)

    // Flush se atingiu o tamanho máximo
    if (this.eventQueue.length >= this.config.maxBatchSize) {
      this.flush()
    }
  }

  /**
   * Marca uma conversão
   */
  conversion(name: string, value?: number, properties?: Record<string, any>): void {
    const utmData = this.getUTMData()
    this.track('conversion', name, {
      ...properties,
      ...utmData
    }, value)
  }

  /**
   * Inicializa captura de UTMs
   */
  private initUTMCapture(): void {
    if (typeof window === 'undefined') return

    const urlParams = new URLSearchParams(window.location.search)
    const utmParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'src', 'sck', 'msclkid', 'ttclid'
    ]

    let hasUTMs = false

    utmParams.forEach(param => {
      const value = urlParams.get(param)
      if (value) {
        // Sanitizar valor
        const sanitizedValue = this.sanitizeUTMValue(value, param)
        
        // Salvar em localStorage e cookie
        localStorage.setItem(`rf_${param}`, sanitizedValue)
        this.setCookie(param, sanitizedValue, 30)
        
        hasUTMs = true
        this.log(`UTM captured: ${param} = ${sanitizedValue}`)
      }
    })

    // Limpar URL se capturou UTMs
    if (hasUTMs && window.history?.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash
      window.history.replaceState({}, document.title, cleanUrl)
      this.log('URL cleaned, UTM parameters preserved')
    }
  }

  /**
   * Sanitiza valor de UTM
   */
  private sanitizeUTMValue(value: string, param: string): string {
    if (!value) return value
    
    // Para UTM source, medium, campaign - limpar espaços
    if (['utm_source', 'utm_medium', 'utm_campaign'].includes(param)) {
      return value.trim().replace(/\s+/g, '_')
    }
    
    return value.trim()
  }

  /**
   * Define cookie
   */
  private setCookie(name: string, value: string, days: number): void {
    if (typeof document === 'undefined') return
    
    const expires = new Date()
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
    
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; Secure; SameSite=Lax`
  }

  /**
   * Obtém cookie
   */
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }

  /**
   * Obtém dados UTM salvos
   */
  private getUTMData(): Record<string, string> {
    if (typeof window === 'undefined') return {}

    const utmData: Record<string, string> = {}
    const utmParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'src', 'sck', 'msclkid', 'ttclid'
    ]

    utmParams.forEach(param => {
      // Priorizar localStorage, fallback para cookie
      const value = localStorage.getItem(`rf_${param}`) || this.getCookie(param)
      if (value) {
        utmData[param] = value
      }
    })

    return utmData
  }

  /**
   * API pública para obter parâmetros UTM
   */
  public getUTMParams(): Record<string, string> {
    return this.getUTMData()
  }

  /**
   * API pública para obter parâmetro UTM específico
   */
  public getUTMParam(param: string): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(`rf_${param}`) || this.getCookie(param)
  }

  /**
   * Limpar parâmetros UTM salvos
   */
  public clearUTMParams(): void {
    if (typeof window === 'undefined') return

    const utmParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'src', 'sck', 'msclkid', 'ttclid'
    ]

    utmParams.forEach(param => {
      localStorage.removeItem(`rf_${param}`)
      if (typeof document !== 'undefined') {
        document.cookie = `${param}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
    })

    this.log('UTM parameters cleared')
  }

  /**
   * Obtém informações da sessão atual
   */
  private getSessionInfo(): Record<string, string> {
    if (typeof window === 'undefined') return {}

    const userAgent = navigator.userAgent
    let deviceType = 'desktop'
    let browserName = 'unknown'
    let browserVersion = 'unknown'
    let osName = 'unknown'
    let osVersion = 'unknown'

    // Detectar tipo de dispositivo
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      deviceType = 'tablet'
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      deviceType = 'mobile'
    }

    // Detectar browser
    if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome'
      const match = userAgent.match(/Chrome\/([0-9.]+)/)
      browserVersion = match ? match[1] : 'unknown'
    } else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox'
      const match = userAgent.match(/Firefox\/([0-9.]+)/)
      browserVersion = match ? match[1] : 'unknown'
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari'
      const match = userAgent.match(/Version\/([0-9.]+)/)
      browserVersion = match ? match[1] : 'unknown'
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge'
      const match = userAgent.match(/Edge\/([0-9.]+)/)
      browserVersion = match ? match[1] : 'unknown'
    }

    // Detectar OS
    if (userAgent.indexOf('Windows NT') > -1) {
      osName = 'Windows'
      const match = userAgent.match(/Windows NT ([0-9.]+)/)
      osVersion = match ? match[1] : 'unknown'
    } else if (userAgent.indexOf('Mac OS X') > -1) {
      osName = 'macOS'
      const match = userAgent.match(/Mac OS X ([0-9_.]+)/)
      osVersion = match ? match[1].replace(/_/g, '.') : 'unknown'
    } else if (userAgent.indexOf('Linux') > -1) {
      osName = 'Linux'
    } else if (/Android/.test(userAgent)) {
      osName = 'Android'
      const match = userAgent.match(/Android ([0-9.]+)/)
      osVersion = match ? match[1] : 'unknown'
    } else if (/iPhone|iPad|iPod/.test(userAgent)) {
      osName = 'iOS'
      const match = userAgent.match(/OS ([0-9_]+)/)
      osVersion = match ? match[1].replace(/_/g, '.') : 'unknown'
    }

    return {
      device_type: deviceType,
      browser_name: browserName,
      browser_version: browserVersion,
      os_name: osName,
      os_version: osVersion,
      screen_resolution: `${screen.width}x${screen.height}`
    }
  }

  /**
   * Envia eventos pendentes
   */
  async flush(sync = false): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      const request = fetch(`${this.config.apiUrl}/track-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey
        },
        body: JSON.stringify({ events }),
        keepalive: sync // Para beforeunload
      })

      if (sync) {
        // Esperar resposta em flush síncrono
        await request
      }

      this.log(`${events.length} eventos enviados`)
    } catch (error) {
      // Re-adicionar eventos à fila em caso de erro
      this.eventQueue.unshift(...events)
      this.error('Erro ao enviar eventos:', error)
    }
  }

  /**
   * Obtém métricas de um experimento
   */
  async getMetrics(
    experimentKey: string, 
    fromDate?: string, 
    toDate?: string
  ): Promise<ExperimentMetrics | null> {
    try {
      const params = new URLSearchParams({
        experiment_key: experimentKey
      })
      
      if (fromDate) params.append('from_date', fromDate)
      if (toDate) params.append('to_date', toDate)

      const response = await fetch(
        `${this.config.apiUrl}/get-metrics?${params}`,
        {
          headers: {
            'x-api-key': this.config.apiKey
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao obter métricas')
      }

      return await response.json()
    } catch (error) {
      this.error('Erro ao obter métricas:', error)
      return null
    }
  }

  /**
   * Identifica o visitante (opcional)
   */
  identify(userId: string, traits?: Record<string, any>): void {
    this.track('identify', 'user_identified', {
      ...traits,
      user_id: userId
    })
  }

  /**
   * Reseta o visitante (novo visitor ID)
   */
  reset(): void {
    this.visitorId = this.generateVisitorId()
    this.setCookie('rf_visitor_id', this.visitorId)
    this.assignmentCache.clear()
    this.log('Visitor ID resetado:', this.visitorId)
  }

  /**
   * Aplica configuração de variante
   */
  private applyVariantConfig(config: any): void {
    if (!config || typeof config !== 'object') return

    // CSS customizado
    if (config.css) {
      const style = document.createElement('style')
      style.textContent = config.css
      style.setAttribute('data-rf-variant', 'true')
      document.head.appendChild(style)
    }

    // JavaScript customizado
    if (config.js && typeof config.js === 'string') {
      try {
        new Function(config.js)()
      } catch (error) {
        this.error('Erro ao executar JS da variante:', error)
      }
    }

    // Atributos HTML
    if (config.attributes && typeof config.attributes === 'object') {
      Object.entries(config.attributes).forEach(([selector, attrs]) => {
        try {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => {
            Object.entries(attrs as any).forEach(([key, value]) => {
              el.setAttribute(key, String(value))
            })
          })
        } catch (error) {
          this.error('Erro ao aplicar atributos:', error)
        }
      })
    }
  }

  /**
   * Gera ou recupera visitor ID
   */
  private getOrCreateVisitorId(): string {
    const existing = this.getCookie('rf_visitor_id')
    if (existing) return existing

    const newId = this.generateVisitorId()
    this.setCookie('rf_visitor_id', newId)
    return newId
  }

  /**
   * Gera novo visitor ID
   */
  private generateVisitorId(): string {
    return 'rf_' + Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  /**
   * Helpers de cookie
   */
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? match[2] : null
  }

  private setCookie(name: string, value: string): void {
    if (typeof document === 'undefined') return

    const expires = new Date()
    expires.setDate(expires.getDate() + this.config.cookieExpiry)
    
    let cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`
    if (this.config.cookieDomain) {
      cookie += `; domain=${this.config.cookieDomain}`
    }
    
    document.cookie = cookie
  }

  /**
   * Logging helpers
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[RotaFinal]', ...args)
    }
  }

  private error(...args: any[]): void {
    console.error('[RotaFinal]', ...args)
  }

  /**
   * Destrutor
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush(true)
    this.initialized = false
  }
}

// Exportar classe e tipos
export { RotaFinal, RotaFinalConfig, Variant, TrackEvent, ExperimentMetrics }

// Exportar como default também
export default RotaFinal
