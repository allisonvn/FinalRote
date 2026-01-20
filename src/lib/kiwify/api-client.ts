/**
 * Kiwify API Client
 * @description Cliente para integração com a API da Kiwify
 */

interface KiwifyAPIOptions {
  apiKey: string
  baseUrl?: string
}

interface CancelSubscriptionResult {
  success: boolean
  error?: string
}

interface GetSubscriptionResult {
  success: boolean
  data?: {
    id: string
    status: string
    next_billing_at?: string
    plan?: {
      id: string
      name: string
    }
  }
  error?: string
}

export class KiwifyClient {
  private apiKey: string
  private baseUrl: string

  constructor(options: KiwifyAPIOptions) {
    this.apiKey = options.apiKey
    this.baseUrl = options.baseUrl || 'https://public-api.kiwify.com/v1'
  }

  /**
   * Cancelar assinatura na Kiwify
   */
  async cancelSubscription(subscriptionId: string): Promise<CancelSubscriptionResult> {
    if (!this.apiKey) {
      console.warn('[KiwifyClient] API key not configured')
      return {
        success: false,
        error: 'Kiwify API key not configured'
      }
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[KiwifyClient] Cancel subscription error:', {
          status: response.status,
          error: errorData
        })
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`
        }
      }

      return { success: true }
    } catch (error) {
      console.error('[KiwifyClient] Cancel subscription error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Buscar informações de uma assinatura
   */
  async getSubscription(subscriptionId: string): Promise<GetSubscriptionResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Kiwify API key not configured'
      }
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/subscriptions/${subscriptionId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`
        }
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Pausar assinatura
   */
  async pauseSubscription(subscriptionId: string): Promise<CancelSubscriptionResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Kiwify API key not configured'
      }
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/subscriptions/${subscriptionId}/pause`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Reativar assinatura pausada
   */
  async resumeSubscription(subscriptionId: string): Promise<CancelSubscriptionResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Kiwify API key not configured'
      }
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/subscriptions/${subscriptionId}/resume`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Singleton instance
let _kiwifyClient: KiwifyClient | null = null

export function getKiwifyClient(): KiwifyClient {
  if (!_kiwifyClient) {
    _kiwifyClient = new KiwifyClient({
      apiKey: process.env.KIWIFY_API_KEY || ''
    })
  }
  return _kiwifyClient
}

// Export default instance
export const kiwifyClient = new KiwifyClient({
  apiKey: process.env.KIWIFY_API_KEY || ''
})
