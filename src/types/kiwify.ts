/**
 * Kiwify Integration Types
 * @description Tipos para integração com a API e webhooks da Kiwify
 */

// =====================================================
// WEBHOOK EVENTS
// =====================================================

export type KiwifyWebhookEventType =
  | 'purchase.approved'
  | 'purchase.refused'
  | 'purchase.chargeback'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'payment.approved'
  | 'payment.refused'
  | 'payment.late'
  | 'payment.refunded';

export interface KiwifyWebhookPayload {
  event: KiwifyWebhookEventType;
  data: KiwifyWebhookData;
  signature?: string;
  timestamp: string;
}

// =====================================================
// CUSTOMER DATA
// =====================================================

export interface KiwifyCustomer {
  id: string;
  email: string;
  name: string;
  cpf?: string;
  phone?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
}

// =====================================================
// PRODUCT DATA
// =====================================================

export interface KiwifyProduct {
  id: string;
  name: string;
  slug?: string;
  type?: 'subscription' | 'one_time';
}

// =====================================================
// SUBSCRIPTION DATA
// =====================================================

export interface KiwifySubscription {
  id: string;
  status: KiwifySubscriptionStatus;
  product: KiwifyProduct;
  customer: KiwifyCustomer;
  plan: {
    id: string;
    name: string;
    interval: 'monthly' | 'yearly' | 'quarterly';
    interval_count: number;
    amount: number;
  };
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

export type KiwifySubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

// =====================================================
// PAYMENT DATA
// =====================================================

export interface KiwifyPayment {
  id: string;
  order_id: string;
  subscription_id?: string;
  status: KiwifyPaymentStatus;
  amount: number;
  currency: string;
  payment_method: KiwifyPaymentMethod;
  paid_at?: string;
  refunded_at?: string;
  created_at: string;
}

export type KiwifyPaymentStatus =
  | 'pending'
  | 'approved'
  | 'refused'
  | 'refunded'
  | 'chargeback';

export type KiwifyPaymentMethod =
  | 'credit_card'
  | 'boleto'
  | 'pix'
  | 'paypal'
  | 'other';

// =====================================================
// PURCHASE DATA
// =====================================================

export interface KiwifyPurchase {
  id: string;
  order_id: string;
  customer: KiwifyCustomer;
  product: KiwifyProduct;
  subscription?: KiwifySubscription;
  payment: KiwifyPayment;
  status: 'approved' | 'refused' | 'pending';
  created_at: string;
}

// =====================================================
// WEBHOOK DATA (união de todos os tipos possíveis)
// =====================================================

export type KiwifyWebhookData =
  | {
      event_type: 'purchase.approved' | 'purchase.refused';
      purchase: KiwifyPurchase;
    }
  | {
      event_type:
        | 'subscription.created'
        | 'subscription.updated'
        | 'subscription.canceled';
      subscription: KiwifySubscription;
    }
  | {
      event_type:
        | 'payment.approved'
        | 'payment.refused'
        | 'payment.late'
        | 'payment.refunded';
      payment: KiwifyPayment;
      subscription?: KiwifySubscription;
    };

// =====================================================
// API RESPONSES
// =====================================================

export interface KiwifyAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface KiwifyListResponse<T> {
  data: T[];
  has_more: boolean;
  total_count: number;
}

// =====================================================
// API CLIENT TYPES
// =====================================================

export interface KiwifyClientConfig {
  apiKey: string;
  webhookSecret: string;
  baseUrl?: string;
}

export interface KiwifySubscriptionFilters {
  customer_email?: string;
  status?: KiwifySubscriptionStatus;
  product_id?: string;
  limit?: number;
  offset?: number;
}

// =====================================================
// WEBHOOK PROCESSING
// =====================================================

export interface ProcessWebhookResult {
  success: boolean;
  action: 'created' | 'updated' | 'ignored';
  subscriptionId?: string;
  userId?: string;
  error?: string;
}

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
}

// =====================================================
// INTERNAL MAPPING
// =====================================================

/**
 * Mapeamento entre status da Kiwify e status interno do sistema
 */
export const KiwifyStatusMap: Record<
  KiwifySubscriptionStatus,
  'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'unpaid',
  incomplete: 'past_due',
  incomplete_expired: 'canceled',
};

/**
 * Eventos que devem criar/atualizar assinatura
 */
export const SUBSCRIPTION_EVENTS: KiwifyWebhookEventType[] = [
  'purchase.approved',
  'subscription.created',
  'subscription.updated',
  'payment.approved',
];

/**
 * Eventos que indicam problema no pagamento
 */
export const PAYMENT_ISSUE_EVENTS: KiwifyWebhookEventType[] = [
  'payment.refused',
  'payment.late',
  'purchase.refused',
];

/**
 * Eventos de cancelamento
 */
export const CANCELLATION_EVENTS: KiwifyWebhookEventType[] = [
  'subscription.canceled',
  'purchase.chargeback',
  'payment.refunded',
];
