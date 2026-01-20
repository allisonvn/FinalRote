import { z } from 'zod'

// Schema para customer
const kiwifyCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  mobile: z.string().optional(),
  CPF: z.string().optional()
})

// Schema para produto
const kiwifyProductSchema = z.object({
  id: z.string(),
  name: z.string()
})

// Schema para pedido
const kiwifyOrderSchema = z.object({
  id: z.string(),
  status: z.string(),
  amount: z.number().optional(),
  checkout_url: z.string().url().optional()
})

// Schema para assinatura
const kiwifySubscriptionSchema = z.object({
  id: z.string(),
  status: z.enum(['active', 'canceled', 'past_due', 'trialing']),
  next_billing_at: z.string().optional()
})

// Schema principal do webhook
export const kiwifyWebhookSchema = z.object({
  event: z.enum([
    'boleto_gerado',
    'pix_gerado',
    'carrinho_abandonado',
    'compra_recusada',
    'compra_aprovada',
    'compra_reembolsada',
    'chargeback',
    'subscription_canceled',
    'subscription_late',
    'subscription_renewed'
  ]),
  data: z.object({
    customer: kiwifyCustomerSchema,
    product: kiwifyProductSchema.optional(),
    order: kiwifyOrderSchema.optional(),
    subscription: kiwifySubscriptionSchema.optional()
  }),
  timestamp: z.string()
})

// Schema para validação de assinatura HMAC
export const webhookSignatureSchema = z.object({
  payload: z.string(),
  signature: z.string(),
  secret: z.string()
})

// Tipos inferidos
export type KiwifyWebhookPayload = z.infer<typeof kiwifyWebhookSchema>
export type KiwifyCustomer = z.infer<typeof kiwifyCustomerSchema>
export type KiwifyProduct = z.infer<typeof kiwifyProductSchema>
export type KiwifyOrder = z.infer<typeof kiwifyOrderSchema>
export type KiwifySubscription = z.infer<typeof kiwifySubscriptionSchema>
