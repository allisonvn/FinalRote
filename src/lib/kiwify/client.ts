/**
 * Kiwify API Client
 * @description Cliente para interagir com a API da Kiwify
 */

import {
  type KiwifyAPIResponse,
  type KiwifyClientConfig,
  type KiwifyListResponse,
  type KiwifySubscription,
  type KiwifySubscriptionFilters,
} from '@/types/kiwify';

export class KiwifyClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: KiwifyClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.kiwify.com.br/v1';
  }

  /**
   * Método genérico para fazer requisições à API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<KiwifyAPIResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: errorData.message || response.statusText,
          },
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown network error',
        },
      };
    }
  }

  /**
   * Buscar assinatura por ID
   */
  async getSubscription(
    subscriptionId: string
  ): Promise<KiwifyAPIResponse<KiwifySubscription>> {
    return this.request<KiwifySubscription>(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Listar assinaturas com filtros
   */
  async listSubscriptions(
    filters?: KiwifySubscriptionFilters
  ): Promise<KiwifyAPIResponse<KiwifyListResponse<KiwifySubscription>>> {
    const params = new URLSearchParams();

    if (filters?.customer_email) {
      params.append('customer_email', filters.customer_email);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.product_id) {
      params.append('product_id', filters.product_id);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params.append('offset', filters.offset.toString());
    }

    const query = params.toString();
    const endpoint = `/subscriptions${query ? `?${query}` : ''}`;

    return this.request<KiwifyListResponse<KiwifySubscription>>(endpoint);
  }

  /**
   * Buscar assinatura por email do cliente
   */
  async getSubscriptionByEmail(
    email: string
  ): Promise<KiwifyAPIResponse<KiwifySubscription | null>> {
    const response = await this.listSubscriptions({
      customer_email: email,
      limit: 1,
    });

    if (!response.success || !response.data?.data.length) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: response.data.data[0],
    };
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<KiwifyAPIResponse<KiwifySubscription>> {
    return this.request<KiwifySubscription>(
      `/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({
          cancel_at_period_end: cancelAtPeriodEnd,
        }),
      }
    );
  }

  /**
   * Reativar assinatura cancelada
   */
  async reactivateSubscription(
    subscriptionId: string
  ): Promise<KiwifyAPIResponse<KiwifySubscription>> {
    return this.request<KiwifySubscription>(
      `/subscriptions/${subscriptionId}/reactivate`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Atualizar método de pagamento
   */
  async updatePaymentMethod(
    subscriptionId: string,
    paymentMethodId: string
  ): Promise<KiwifyAPIResponse<KiwifySubscription>> {
    return this.request<KiwifySubscription>(
      `/subscriptions/${subscriptionId}/payment-method`,
      {
        method: 'PUT',
        body: JSON.stringify({
          payment_method_id: paymentMethodId,
        }),
      }
    );
  }

  /**
   * Criar um link de checkout
   */
  async createCheckoutLink(params: {
    product_id: string;
    customer_email?: string;
    customer_name?: string;
    success_url?: string;
    cancel_url?: string;
  }): Promise<KiwifyAPIResponse<{ url: string }>> {
    return this.request<{ url: string }>('/checkout/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Health check da API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request('/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

/**
 * Instância singleton do cliente Kiwify
 */
let kiwifyClient: KiwifyClient | null = null;

export function getKiwifyClient(): KiwifyClient {
  if (!kiwifyClient) {
    const apiKey = process.env.KIWIFY_API_KEY;
    const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET;

    if (!apiKey || !webhookSecret) {
      throw new Error(
        'KIWIFY_API_KEY and KIWIFY_WEBHOOK_SECRET must be set in environment variables'
      );
    }

    kiwifyClient = new KiwifyClient({
      apiKey,
      webhookSecret,
    });
  }

  return kiwifyClient;
}

/**
 * Helper: Verificar se a API da Kiwify está acessível
 */
export async function checkKiwifyConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    const client = getKiwifyClient();
    const isHealthy = await client.healthCheck();

    return {
      connected: isHealthy,
      error: isHealthy ? undefined : 'API health check failed',
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
