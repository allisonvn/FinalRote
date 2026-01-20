/**
 * Kiwify Webhook Signature Verification
 * @description Utilitários para verificar assinatura HMAC dos webhooks Kiwify
 */

import crypto from 'crypto'

interface VerifySignatureOptions {
  payload: string | Buffer
  signature: string
  secret: string
}

/**
 * Verifica a assinatura HMAC SHA256 de um webhook Kiwify
 * Usa comparação segura contra timing attacks
 */
export function verifyKiwifySignature({
  payload,
  signature,
  secret
}: VerifySignatureOptions): boolean {
  if (!signature || !secret) {
    console.warn('[Kiwify] Assinatura ou secret não fornecidos')
    return false
  }

  try {
    // Calcular HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(typeof payload === 'string' ? payload : payload.toString('utf8'))
      .digest('hex')

    // Comparação segura contra timing attacks
    const signatureBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  } catch (error) {
    console.error('[Kiwify] Erro ao verificar assinatura:', error)
    return false
  }
}

/**
 * Extrair assinatura do header da requisição
 * Kiwify pode usar diferentes headers
 */
export function extractSignature(request: Request): string | null {
  const signature =
    request.headers.get('x-kiwify-signature') ||
    request.headers.get('x-webhook-signature') ||
    request.headers.get('x-signature')

  return signature
}

/**
 * Verifica webhook com logging detalhado
 */
export function verifyWebhookWithLogging(
  rawBody: string,
  signature: string | null,
  secret: string
): { valid: boolean; error?: string } {
  if (!secret) {
    return {
      valid: false,
      error: 'Webhook secret not configured'
    }
  }

  if (!signature) {
    return {
      valid: false,
      error: 'Signature header not found'
    }
  }

  const isValid = verifyKiwifySignature({
    payload: rawBody,
    signature,
    secret
  })

  if (!isValid) {
    console.warn('[Kiwify] Invalid webhook signature', {
      receivedSignature: signature.substring(0, 10) + '...',
      payloadLength: rawBody.length
    })
    return {
      valid: false,
      error: 'Invalid signature'
    }
  }

  return { valid: true }
}

/**
 * Gerar assinatura para testes
 */
export function generateTestSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}
