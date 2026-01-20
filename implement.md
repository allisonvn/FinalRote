# IMPLEMENT.md - Guia de Implementação das Correções

**Projeto:** Rota Final - SaaS A/B Testing
**Data:** 2026-01-20
**Baseado em:** Syschan.md - Relatório de Verificação do Sistema

---

## Sumário

1. [Correção de Dados Mockados](#1-correção-de-dados-mockados)
2. [Implementação de Emails com Resend](#2-implementação-de-emails-com-resend)
3. [Integração Completa com Kiwify](#3-integração-completa-com-kiwify)
4. [Correção do Algoritmo MAB](#4-correção-do-algoritmo-mab)
5. [Implementação de Validação com Zod](#5-implementação-de-validação-com-zod)
6. [Rate Limiting para APIs Públicas](#6-rate-limiting-para-apis-públicas)
7. [Error Handling para RLS](#7-error-handling-para-rls)
8. [Limpeza de Arquivos](#8-limpeza-de-arquivos)

---

## 1. Correção de Dados Mockados

### 1.1 `src/hooks/useExperiments.ts` - Hook Principal

**Problema:** Dados mockados hardcoded nas linhas 50-90

**Referências:**
- [Supabase React Hooks Guide](https://www.restack.io/docs/supabase-knowledge-supabase-react-hooks-guide)
- [React Query + Supabase](https://makerkit.dev/blog/saas/supabase-react-query)
- [supabase-react-query-codegen](https://github.com/barrymichaeldoyle/supabase-react-query-codegen)

**Solução - Substituir mock por chamada real:**

```typescript
// src/hooks/useExperiments.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export function useExperiments(filters?: ExperimentFilters) {
  const supabase = createClientComponentClient<Database>()
  const queryClient = useQueryClient()

  // Query para buscar experimentos
  const {
    data: experiments,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['experiments', filters],
    queryFn: async () => {
      let query = supabase
        .from('experiments')
        .select(`
          *,
          variants (*),
          project:projects (name, slug)
        `)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId)
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Experiment[]
    },
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: true
  })

  // Mutation para criar experimento
  const createExperiment = useMutation({
    mutationFn: async (newExperiment: CreateExperimentInput) => {
      const { data, error } = await supabase
        .from('experiments')
        .insert(newExperiment)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
    }
  })

  // Mutation para atualizar
  const updateExperiment = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateExperimentInput) => {
      const { data, error } = await supabase
        .from('experiments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
    }
  })

  // Mutation para deletar
  const deleteExperiment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
    }
  })

  return {
    experiments: experiments ?? [],
    isLoading,
    error,
    refetch,
    createExperiment: createExperiment.mutate,
    updateExperiment: updateExperiment.mutate,
    deleteExperiment: deleteExperiment.mutate,
    isCreating: createExperiment.isPending,
    isUpdating: updateExperiment.isPending,
    isDeleting: deleteExperiment.isPending
  }
}
```

**Dependências necessárias:**
```bash
npm install @tanstack/react-query
```

**Provider necessário (`src/providers/query-provider.tsx`):**
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minuto
        retry: 1
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

---

### 1.2 `src/hooks/useEvents.ts` - Fallback para Mock

**Problema:** Linha 56, 909 - Fallback silencioso para dados mock

**Solução - Exibir erro em vez de dados falsos:**

```typescript
// src/hooks/useEvents.ts - Linha ~56

// REMOVER este padrão:
// if (error) {
//   console.error('Supabase error, using mock data')
//   return mockEventData
// }

// SUBSTITUIR por:
if (error) {
  // Lançar erro para ser tratado pelo error boundary ou UI
  throw new Error(`Falha ao carregar eventos: ${error.message}`)
}

// Se não houver dados, retornar array vazio (não mock)
return data ?? []
```

**Componente de Erro para o Dashboard:**
```typescript
// src/components/events-error-state.tsx
export function EventsErrorState({ error, onRetry }: {
  error: Error
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-800">
        Erro ao carregar eventos
      </h3>
      <p className="text-red-600 text-sm mt-2 text-center max-w-md">
        {error.message}
      </p>
      <Button
        variant="outline"
        onClick={onRetry}
        className="mt-4"
      >
        Tentar novamente
      </Button>
    </div>
  )
}
```

---

### 1.3 Debug Schema - Remover Mock

**Arquivo:** `src/app/api/debug/schema/[table]/route.ts`

**Solução - Consultar information_schema real:**

```typescript
// src/app/api/debug/schema/[table]/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { table: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const tableName = params.table

  // Validar nome da tabela para prevenir SQL injection
  const validTables = [
    'experiments', 'variants', 'events', 'assignments',
    'projects', 'organizations', 'subscriptions'
  ]

  if (!validTables.includes(tableName)) {
    return NextResponse.json(
      { error: 'Tabela não permitida' },
      { status: 400 }
    )
  }

  // Consultar schema real do information_schema
  const { data, error } = await supabase.rpc('get_table_schema', {
    p_table_name: tableName
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ schema: data })
}
```

**Função RPC necessária (migração SQL):**

```sql
-- supabase/migrations/xxx_get_table_schema.sql

CREATE OR REPLACE FUNCTION get_table_schema(p_table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text,
  character_maximum_length integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    column_name::text,
    data_type::text,
    is_nullable::text,
    column_default::text,
    character_maximum_length
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = p_table_name
  ORDER BY ordinal_position;
$$;

-- Dar permissão apenas para authenticated
GRANT EXECUTE ON FUNCTION get_table_schema TO authenticated;
```

---

## 2. Implementação de Emails com Resend

### 2.1 Configuração Base

**Referências:**
- [Resend Official Docs - Next.js](https://resend.com/docs/send-with-nextjs)
- [Resend + React Email Tutorial](https://www.freecodecamp.org/news/create-and-send-email-templates-using-react-email-and-resend-in-nextjs/)
- [Dev.to - Implementing Resend](https://dev.to/adrianbailador/implementing-resend-in-nextjs-step-by-step-guide-2fae)

**O cliente já existe em:** `src/lib/resend/client.ts` (linhas 103-161)

**Variável de ambiente necessária:**
```env
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@seudominio.com
```

---

### 2.2 Webhook Purchase Approved - Enviar Email de Boas-Vindas

**Arquivo:** `src/app/api/webhooks/kiwify/purchase-approved/route.ts`
**TODO na linha 77**

**Código a adicionar após linha 76:**

```typescript
// src/app/api/webhooks/kiwify/purchase-approved/route.ts

import { sendEmail } from '@/lib/resend/client'

// ... código existente ...

// Após o processamento bem-sucedido do webhook (linha ~76)
if (result.success && result.userId) {
  try {
    // Buscar dados do usuário para o email
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', result.userId)
      .single()

    if (user?.email) {
      await sendEmail({
        to: user.email,
        template: 'welcome',
        data: {
          name: user.full_name || user.email.split('@')[0],
          appName: 'Rota Final',
          planName: webhookData.product?.name || 'Pro',
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
        },
        userId: result.userId
      })

      console.log(`[Webhook] Email de boas-vindas enviado para ${user.email}`)
    }
  } catch (emailError) {
    // Log mas não falha o webhook
    console.error('[Webhook] Erro ao enviar email de boas-vindas:', emailError)
  }
}
```

---

### 2.3 Webhook Payment Late - Email de Cobrança

**Arquivo:** `src/app/api/webhooks/kiwify/payment-late/route.ts`
**TODO na linha 85**

```typescript
// Após processamento do webhook
if (result.success && result.userId) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', result.userId)
      .single()

    if (user?.email) {
      await sendEmail({
        to: user.email,
        template: 'payment-late',
        data: {
          name: user.full_name || 'Cliente',
          appName: 'Rota Final',
          dueDate: new Date(webhookData.subscription?.next_billing_at).toLocaleDateString('pt-BR'),
          amount: webhookData.order?.amount
            ? `R$ ${(webhookData.order.amount / 100).toFixed(2)}`
            : 'Valor pendente',
          paymentUrl: webhookData.order?.checkout_url || `${process.env.NEXT_PUBLIC_APP_URL}/billing`
        },
        userId: result.userId
      })
    }
  } catch (emailError) {
    console.error('[Webhook] Erro ao enviar email de pagamento atrasado:', emailError)
  }
}
```

---

### 2.4 Webhook Canceled - Email de Cancelamento

**Arquivo:** `src/app/api/webhooks/kiwify/canceled/route.ts`
**TODO na linha 85**

```typescript
if (result.success && result.userId) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', result.userId)
      .single()

    if (user?.email) {
      await sendEmail({
        to: user.email,
        template: 'subscription-canceled',
        data: {
          name: user.full_name || 'Cliente',
          appName: 'Rota Final',
          cancelDate: new Date().toLocaleDateString('pt-BR'),
          reactivateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
        },
        userId: result.userId
      })
    }
  } catch (emailError) {
    console.error('[Webhook] Erro ao enviar email de cancelamento:', emailError)
  }
}
```

---

## 3. Integração Completa com Kiwify

### 3.1 Validação de Assinatura HMAC

**Referências:**
- [HMAC Webhook Verification - Hookdeck](https://hookdeck.com/webhooks/guides/how-to-implement-sha256-webhook-signature-verification)
- [HMAC in Node.js - Authgear](https://www.authgear.com/post/generate-verify-hmac-signatures)
- [Kiwify API Docs](https://docs.kiwify.com.br/api-reference/webhooks/create)

**Arquivo utilitário para validação:**

```typescript
// src/lib/kiwify/verify-signature.ts

import crypto from 'crypto'

interface VerifySignatureOptions {
  payload: string | Buffer
  signature: string
  secret: string
}

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

// Extrair assinatura do header (formato pode variar)
export function extractSignature(request: Request): string | null {
  // Kiwify pode usar diferentes headers
  const signature =
    request.headers.get('x-kiwify-signature') ||
    request.headers.get('x-webhook-signature') ||
    request.headers.get('x-signature')

  return signature
}
```

**Uso nos webhooks:**

```typescript
// src/app/api/webhooks/kiwify/[event]/route.ts

import { verifyKiwifySignature, extractSignature } from '@/lib/kiwify/verify-signature'

export async function POST(request: Request) {
  // Ler body como texto para preservar formato original
  const rawBody = await request.text()
  const signature = extractSignature(request)
  const secret = process.env.KIWIFY_WEBHOOK_SECRET

  // Verificar assinatura se secret configurado
  if (secret && signature) {
    const isValid = verifyKiwifySignature({
      payload: rawBody,
      signature,
      secret
    })

    if (!isValid) {
      console.error('[Webhook] Assinatura inválida')
      return new Response('Unauthorized', { status: 401 })
    }
  }

  // Parse JSON após validação
  const payload = JSON.parse(rawBody)

  // ... resto do processamento
}
```

---

### 3.2 Cancelamento na Kiwify via API

**Arquivo:** `src/app/api/subscription/cancel/route.ts`
**TODO nas linhas 94-97 (código comentado)**

**Implementação:**

```typescript
// src/lib/kiwify/api-client.ts

interface KiwifyAPIOptions {
  apiKey: string
  baseUrl?: string
}

export class KiwifyClient {
  private apiKey: string
  private baseUrl: string

  constructor(options: KiwifyAPIOptions) {
    this.apiKey = options.apiKey
    this.baseUrl = options.baseUrl || 'https://public-api.kiwify.com/v1'
  }

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
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
        const error = await response.json()
        return {
          success: false,
          error: error.message || `HTTP ${response.status}`
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

// Singleton
export const kiwifyClient = new KiwifyClient({
  apiKey: process.env.KIWIFY_API_KEY || ''
})
```

**Atualizar rota de cancelamento:**

```typescript
// src/app/api/subscription/cancel/route.ts

import { kiwifyClient } from '@/lib/kiwify/api-client'

// ... código existente ...

// Descomentar e usar (linhas 94-97):
if (subscription.kiwify_subscription_id) {
  const result = await kiwifyClient.cancelSubscription(
    subscription.kiwify_subscription_id
  )

  if (!result.success) {
    console.error('[Subscription] Falha ao cancelar na Kiwify:', result.error)
    // Decidir se deve falhar ou continuar com cancelamento local
  }
}
```

---

## 4. Correção do Algoritmo MAB

### 4.1 Problema no Assignment

**Arquivo:** `src/app/api/experiments/[id]/assign/route.ts`
**Problema:** Linhas 190-204 - MAB chamado individualmente para cada variante

**Referências:**
- [Thompson Sampling - Wikipedia](https://en.wikipedia.org/wiki/Thompson_sampling)
- [Bayesian A/B Testing](https://zlatankr.github.io/posts/2017/04/07/bayesian-ab-testing)
- [Multi-Armed Bandit Comparison (PDF)](https://www.researchgate.net/publication/350357541_Comparison_of_Various_Multi-Armed_Bandit_Algorithms)

**Código atual problemático:**
```typescript
// ERRADO - Loop que chama MAB para cada variante individualmente
for (const variantStats of variantStatsArray) {
  const result = selectVariantMAB([variantStats], algorithmType)
  variantProbabilities.push(result.score)
}
```

**Código corrigido:**

```typescript
// src/app/api/experiments/[id]/assign/route.ts - Linhas 190-220

// CORRETO - Passar TODAS as variantes para o algoritmo
const mabResult = selectVariantMAB(variantStatsArray, algorithmType)

// O algoritmo retorna a variante selecionada diretamente
const selectedVariant = variants.find(v => v.id === mabResult.variantId)

if (!selectedVariant) {
  // Fallback para seleção por hash se MAB falhar
  const hashResult = selectVariantByHash(visitorId, variants)
  return NextResponse.json({
    variantId: hashResult.variantId,
    variantKey: hashResult.variantKey,
    method: 'hash_fallback'
  })
}

return NextResponse.json({
  variantId: selectedVariant.id,
  variantKey: selectedVariant.key,
  method: algorithmType,
  score: mabResult.score
})
```

---

### 4.2 Algoritmo Thompson Sampling Corrigido

**Arquivo:** `src/lib/mab-algorithms.ts`

**Verificar/corrigir implementação:**

```typescript
// src/lib/mab-algorithms.ts

import { betaRandom } from './statistics'

interface VariantStats {
  variantId: string
  conversions: number
  impressions: number
}

interface MABResult {
  variantId: string
  score: number
  samples: Record<string, number>
}

export function thompsonSampling(variants: VariantStats[]): MABResult {
  if (variants.length === 0) {
    throw new Error('Nenhuma variante fornecida')
  }

  const samples: Record<string, number> = {}
  let bestVariant = variants[0]
  let bestSample = -Infinity

  for (const variant of variants) {
    // Parâmetros Beta: alpha = conversões + 1, beta = não-conversões + 1
    const alpha = variant.conversions + 1
    const beta = (variant.impressions - variant.conversions) + 1

    // Amostrar da distribuição Beta
    const sample = betaRandom(alpha, beta)
    samples[variant.variantId] = sample

    if (sample > bestSample) {
      bestSample = sample
      bestVariant = variant
    }
  }

  return {
    variantId: bestVariant.variantId,
    score: bestSample,
    samples
  }
}

export function ucb1(variants: VariantStats[]): MABResult {
  if (variants.length === 0) {
    throw new Error('Nenhuma variante fornecida')
  }

  const totalImpressions = variants.reduce((sum, v) => sum + v.impressions, 0)
  const samples: Record<string, number> = {}
  let bestVariant = variants[0]
  let bestScore = -Infinity

  for (const variant of variants) {
    // Se variante nunca foi testada, explorar primeiro
    if (variant.impressions === 0) {
      return {
        variantId: variant.variantId,
        score: Infinity,
        samples: { [variant.variantId]: Infinity }
      }
    }

    // UCB1: média + bônus de exploração
    const avgReward = variant.conversions / variant.impressions
    const explorationBonus = Math.sqrt(
      (2 * Math.log(totalImpressions)) / variant.impressions
    )
    const score = avgReward + explorationBonus

    samples[variant.variantId] = score

    if (score > bestScore) {
      bestScore = score
      bestVariant = variant
    }
  }

  return {
    variantId: bestVariant.variantId,
    score: bestScore,
    samples
  }
}

// Dispatcher principal
export function selectVariantMAB(
  variants: VariantStats[],
  algorithm: 'thompson_sampling' | 'ucb1' | 'epsilon_greedy'
): MABResult {
  switch (algorithm) {
    case 'thompson_sampling':
      return thompsonSampling(variants)
    case 'ucb1':
      return ucb1(variants)
    case 'epsilon_greedy':
      return epsilonGreedy(variants, 0.1)
    default:
      return thompsonSampling(variants)
  }
}
```

---

## 5. Implementação de Validação com Zod

### 5.1 Schemas Base

**Referências:**
- [Zod + React Hook Form - Contentful](https://www.contentful.com/blog/react-hook-form-validation-zod/)
- [Next.js + Zod Server Actions](https://dev.to/bookercodes/nextjs-form-validation-on-the-client-and-server-with-zod-lbc)
- [freeCodeCamp Zod Tutorial](https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/)

**Instalação:**
```bash
npm install zod @hookform/resolvers
```

**Criar estrutura de schemas:**

```typescript
// src/lib/schemas/experiment.ts

import { z } from 'zod'

// Schema para variante
export const variantSchema = z.object({
  name: z.string()
    .min(1, 'Nome da variante é obrigatório')
    .max(100, 'Nome muito longo'),
  key: z.string()
    .min(1, 'Chave é obrigatória')
    .max(50, 'Chave muito longa')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Chave deve conter apenas letras, números, - e _'),
  is_control: z.boolean().default(false),
  weight: z.number().min(0).max(100).default(50),
  changes: z.array(z.object({
    selector: z.string().min(1, 'Seletor é obrigatório'),
    property: z.string().min(1, 'Propriedade é obrigatória'),
    value: z.string()
  })).optional()
})

// Schema para criação de experimento
export const createExperimentSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200, 'Nome muito longo'),
  description: z.string().max(1000).optional(),
  project_id: z.string().uuid('ID do projeto inválido'),
  url_pattern: z.string()
    .url('URL inválida')
    .or(z.string().regex(/^\/.+/, 'Deve ser uma URL ou path começando com /')),
  algorithm: z.enum(['ab_test', 'thompson_sampling', 'ucb1', 'epsilon_greedy'])
    .default('ab_test'),
  variants: z.array(variantSchema)
    .min(2, 'Experimento precisa de pelo menos 2 variantes')
    .max(10, 'Máximo de 10 variantes'),
  goal_event: z.string()
    .min(1, 'Evento de conversão é obrigatório')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Nome de evento inválido'),
  traffic_percentage: z.number().min(1).max(100).default(100)
})

// Schema para atualização
export const updateExperimentSchema = createExperimentSchema.partial().extend({
  id: z.string().uuid()
})

// Tipos inferidos
export type CreateExperimentInput = z.infer<typeof createExperimentSchema>
export type UpdateExperimentInput = z.infer<typeof updateExperimentSchema>
export type VariantInput = z.infer<typeof variantSchema>
```

---

### 5.2 Schema para Tracking Events

```typescript
// src/lib/schemas/tracking.ts

import { z } from 'zod'

export const trackEventSchema = z.object({
  event_type: z.enum([
    'pageview',
    'click',
    'conversion',
    'custom'
  ]),
  event_name: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  experiment_id: z.string().uuid().optional(),
  variant_id: z.string().uuid().optional(),
  visitor_id: z.string().min(1).max(100),
  session_id: z.string().min(1).max(100).optional(),
  properties: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
  url: z.string().url().optional(),
  referrer: z.string().url().optional().nullable(),
  user_agent: z.string().max(500).optional(),
  ip_address: z.string().ip().optional()
})

export type TrackEventInput = z.infer<typeof trackEventSchema>
```

---

### 5.3 Schema para Webhooks Kiwify

```typescript
// src/lib/schemas/kiwify-webhook.ts

import { z } from 'zod'

const kiwifyCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  mobile: z.string().optional(),
  CPF: z.string().optional()
})

const kiwifyProductSchema = z.object({
  id: z.string(),
  name: z.string()
})

const kiwifyOrderSchema = z.object({
  id: z.string(),
  status: z.string(),
  amount: z.number().optional(),
  checkout_url: z.string().url().optional()
})

const kiwifySubscriptionSchema = z.object({
  id: z.string(),
  status: z.enum(['active', 'canceled', 'past_due', 'trialing']),
  next_billing_at: z.string().optional()
})

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

export type KiwifyWebhookPayload = z.infer<typeof kiwifyWebhookSchema>
```

---

### 5.4 Uso com React Hook Form

```typescript
// src/components/experiments/create-experiment-form.tsx

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createExperimentSchema, CreateExperimentInput } from '@/lib/schemas/experiment'

export function CreateExperimentForm() {
  const form = useForm<CreateExperimentInput>({
    resolver: zodResolver(createExperimentSchema),
    defaultValues: {
      algorithm: 'ab_test',
      traffic_percentage: 100,
      variants: [
        { name: 'Controle', key: 'control', is_control: true, weight: 50 },
        { name: 'Variante A', key: 'variant_a', is_control: false, weight: 50 }
      ]
    }
  })

  const onSubmit = async (data: CreateExperimentInput) => {
    try {
      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Falha ao criar experimento')
      }

      // Sucesso
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Campos do formulário com form.register() */}
      {form.formState.errors.name && (
        <span className="text-red-500">
          {form.formState.errors.name.message}
        </span>
      )}
    </form>
  )
}
```

---

## 6. Rate Limiting para APIs Públicas

### 6.1 Implementação com Upstash

**Referências:**
- [Upstash Rate Limiting - Vercel](https://upstash.com/blog/edge-rate-limiting)
- [Vercel Edge Middleware Rate Limit Template](https://vercel.com/templates/other/middleware-rate-limit)
- [4 Best Rate Limiting Solutions](https://dev.to/ethanleetech/4-best-rate-limiting-solutions-for-nextjs-apps-2024-3ljj)

**Instalação:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Configuração:**

```typescript
// src/lib/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Criar cliente Redis (configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

// Rate limiters para diferentes endpoints
export const rateLimiters = {
  // API pública de tracking: 100 requests por minuto por IP
  tracking: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:tracking'
  }),

  // API pública de assignment: 50 requests por minuto por IP
  assignment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 m'),
    analytics: true,
    prefix: 'ratelimit:assignment'
  }),

  // Webhooks: 10 requests por segundo por IP (proteção DDoS)
  webhooks: new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(10, '1 s', 20),
    analytics: true,
    prefix: 'ratelimit:webhooks'
  }),

  // API autenticada geral: 1000 requests por minuto por usuário
  authenticated: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth'
  })
}

// Helper para extrair IP
export function getClientIP(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (xff) {
    return xff.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  return '127.0.0.1'
}

// Helper para aplicar rate limit
export async function applyRateLimit(
  request: Request,
  limiter: Ratelimit,
  identifier?: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const id = identifier || getClientIP(request)
  const result = await limiter.limit(id)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset
  }
}
```

---

### 6.2 Middleware para Rate Limiting

```typescript
// src/middleware.ts (adicionar ao existente)

import { rateLimiters, getClientIP } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rate limiting para APIs públicas
  if (pathname.startsWith('/api/experiments/') && pathname.includes('/public')) {
    const ip = getClientIP(request)
    const result = await rateLimiters.assignment.limit(ip)

    if (!result.success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
        }
      })
    }
  }

  // Rate limiting para tracking
  if (pathname.startsWith('/api/track')) {
    const ip = getClientIP(request)
    const result = await rateLimiters.tracking.limit(ip)

    if (!result.success) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}
```

---

### 6.3 Rate Limiting Inline (Alternativa sem Redis)

```typescript
// src/lib/rate-limit-memory.ts

// Para projetos menores ou desenvolvimento local
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): { success: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 }
  }

  record.count++
  return { success: true, remaining: limit - record.count }
}

// Limpeza periódica
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60000)
```

---

## 7. Error Handling para RLS

### 7.1 Distinguir Erros de RLS

**Referências:**
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [RLS Troubleshooting](https://supabase.com/docs/guides/troubleshooting/rls-simplified-BJTcS8)
- [RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)

**Problema:** RLS retorna `[]` vazio em vez de erro quando acesso é negado

**Solução - Wrapper para queries:**

```typescript
// src/lib/supabase/query-helpers.ts

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js'

interface QueryResult<T> {
  data: T | null
  error: PostgrestError | null
  isRLSBlock: boolean
  isEmpty: boolean
}

/**
 * Wrapper que distingue entre "sem dados" e "acesso negado por RLS"
 */
export async function queryWithRLSCheck<T>(
  supabase: SupabaseClient,
  tableName: string,
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<QueryResult<T>> {
  const result = await queryFn()

  if (result.error) {
    return {
      data: null,
      error: result.error,
      isRLSBlock: result.error.code === '42501', // permission denied
      isEmpty: false
    }
  }

  // Se retornou vazio, verificar se é RLS ou realmente não há dados
  if (result.data === null || (Array.isArray(result.data) && result.data.length === 0)) {
    // Verificar contagem total via service role (se disponível)
    // ou marcar como potencial bloqueio RLS
    return {
      data: result.data,
      error: null,
      isRLSBlock: false, // Não podemos ter certeza sem service role
      isEmpty: true
    }
  }

  return {
    data: result.data,
    error: null,
    isRLSBlock: false,
    isEmpty: false
  }
}

/**
 * Verificar se usuário tem acesso a uma organização específica
 */
export async function checkOrganizationAccess(
  supabase: SupabaseClient,
  organizationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .single()

  return !error && data !== null
}

/**
 * Wrapper para operações com feedback de erro claro
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options?: {
    onEmpty?: () => T
    throwOnError?: boolean
  }
): Promise<T> {
  const { data, error } = await queryFn()

  if (error) {
    console.error('[Query Error]', error)

    if (options?.throwOnError) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (options?.onEmpty) {
      return options.onEmpty()
    }

    throw error
  }

  if (data === null || (Array.isArray(data) && data.length === 0)) {
    if (options?.onEmpty) {
      return options.onEmpty()
    }
  }

  return data as T
}
```

---

### 7.2 Índices para RLS Performance

```sql
-- supabase/migrations/xxx_rls_performance_indexes.sql

-- Índice para verificação de membership (usado em todas as policies)
CREATE INDEX IF NOT EXISTS idx_org_members_user_org
ON organization_members(user_id, organization_id);

-- Índice para experiments por projeto
CREATE INDEX IF NOT EXISTS idx_experiments_project
ON experiments(project_id);

-- Índice para projects por organização
CREATE INDEX IF NOT EXISTS idx_projects_org
ON projects(organization_id);

-- Índice para events por experiment (particionado)
CREATE INDEX IF NOT EXISTS idx_events_experiment_created
ON events(experiment_id, created_at DESC);

-- Analisar tabelas após criar índices
ANALYZE organization_members;
ANALYZE experiments;
ANALYZE projects;
ANALYZE events;
```

---

## 8. Limpeza de Arquivos

### 8.1 Arquivos para Remover

```bash
# Arquivos duplicados/problemáticos identificados no Syschan.md

# Arquivo duplicado com espaço no nome
rm "src/app/dashboard/page 2.tsx"

# Backup não removido
rm "src/components/dashboard/premium-experiments-tab.tsx.bak2"

# Verificar outros backups
find . -name "*.bak*" -type f
find . -name "*.backup" -type f
find . -name "*copy*" -type f
```

### 8.2 Script de Limpeza

```bash
#!/bin/bash
# scripts/cleanup.sh

echo "Limpando arquivos desnecessários..."

# Remover arquivos de backup
find . -name "*.bak" -type f -delete
find . -name "*.bak2" -type f -delete
find . -name "*.backup" -type f -delete

# Remover arquivos com espaços problemáticos
find . -name "* *" -type f -exec echo "Arquivo com espaço: {}" \;

# Limpar cache do Next.js
rm -rf .next

# Limpar node_modules e reinstalar (se necessário)
# rm -rf node_modules
# npm install

echo "Limpeza concluída!"
```

---

## 9. Checklist de Implementação

### URGENTE (Bloqueadores)

- [ ] **1.1** Substituir mock data em `useExperiments.ts` por React Query + Supabase
- [ ] **1.2** Remover fallback para mock em `useEvents.ts`
- [ ] **2.2** Adicionar envio de email em `purchase-approved/route.ts`
- [ ] **2.3** Adicionar envio de email em `payment-late/route.ts`
- [ ] **2.4** Adicionar envio de email em `canceled/route.ts`

### ALTO (Funcionalidade Core)

- [ ] **3.2** Descomentar e implementar cancelamento na Kiwify
- [ ] **4.1** Corrigir chamada do MAB em `assign/route.ts`
- [ ] **1.3** Remover mock data do debug schema
- [ ] **3.1** Implementar validação HMAC nos webhooks

### MÉDIO (Qualidade)

- [ ] **5.1** Criar schemas Zod para experimentos
- [ ] **5.2** Criar schemas Zod para tracking
- [ ] **5.3** Criar schemas Zod para webhooks
- [ ] **6.1** Implementar rate limiting com Upstash
- [ ] **7.1** Implementar helpers para RLS

### BAIXO (Melhorias)

- [ ] **7.2** Adicionar índices para performance RLS
- [ ] **8.1** Remover arquivos duplicados/backups
- [ ] Configurar `RESEND_API_KEY` em produção
- [ ] Configurar `KIWIFY_WEBHOOK_SECRET` em produção
- [ ] Configurar `KIWIFY_API_KEY` em produção

---

## 10. Variáveis de Ambiente Necessárias

```env
# .env.local

# Supabase (já configurado)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Resend (email)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@rotafinal.com

# Kiwify
KIWIFY_API_KEY=xxx
KIWIFY_WEBHOOK_SECRET=xxx

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# App
NEXT_PUBLIC_APP_URL=https://app.rotafinal.com
```

---

## 11. Fontes e Referências

### Supabase + React
- [Supabase React Hooks Guide](https://www.restack.io/docs/supabase-knowledge-supabase-react-hooks-guide)
- [React Query + Supabase](https://makerkit.dev/blog/saas/supabase-react-query)
- [supabase-react-query-codegen](https://github.com/barrymichaeldoyle/supabase-react-query-codegen)
- [supabase-query](https://github.com/HermanNygaard/supabase-query)

### Email com Resend
- [Resend Official Docs](https://resend.com/docs/send-with-nextjs)
- [React Email + Resend Tutorial](https://www.freecodecamp.org/news/create-and-send-email-templates-using-react-email-and-resend-in-nextjs/)
- [Implementing Resend - DEV](https://dev.to/adrianbailador/implementing-resend-in-nextjs-step-by-step-guide-2fae)

### Webhooks e HMAC
- [HMAC Verification - Hookdeck](https://hookdeck.com/webhooks/guides/how-to-implement-sha256-webhook-signature-verification)
- [HMAC Signatures - Authgear](https://www.authgear.com/post/generate-verify-hmac-signatures)
- [Kiwify API Docs](https://docs.kiwify.com.br/api-reference/webhooks/create)

### Multi-Armed Bandit
- [Thompson Sampling - Wikipedia](https://en.wikipedia.org/wiki/Thompson_sampling)
- [Bayesian A/B Testing](https://zlatankr.github.io/posts/2017/04/07/bayesian-ab-testing)
- [MAB Comparison Paper](https://www.researchgate.net/publication/350357541_Comparison_of_Various_Multi-Armed_Bandit_Algorithms)

### Validação com Zod
- [Zod + React Hook Form](https://www.contentful.com/blog/react-hook-form-validation-zod/)
- [Next.js + Zod Validation](https://dev.to/bookercodes/nextjs-form-validation-on-the-client-and-server-with-zod-lbc)
- [freeCodeCamp Zod Tutorial](https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/)

### Rate Limiting
- [Upstash Edge Rate Limiting](https://upstash.com/blog/edge-rate-limiting)
- [Vercel Rate Limit Template](https://vercel.com/templates/other/middleware-rate-limit)
- [Rate Limiting Solutions](https://dev.to/ethanleetech/4-best-rate-limiting-solutions-for-nextjs-apps-2024-3ljj)

### Supabase RLS
- [RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [RLS Performance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [RLS Troubleshooting](https://supabase.com/docs/guides/troubleshooting/rls-simplified-BJTcS8)

---

*Relatório gerado em 2026-01-20 com base na análise do Syschan.md e pesquisa de melhores práticas*
