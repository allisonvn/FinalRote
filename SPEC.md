# SPEC - Especificacao Tecnica: Ajustes P0/P1 para Producao

**Versao:** 1.0.0
**Data:** 2026-01-17
**Baseado em:** PRD.md

---

## 1. Resumo Executivo

Este documento detalha todos os arquivos que precisam ser **removidos**, **modificados** ou **criados** para levar o Rota Final a producao, conforme identificado no PRD.

### Escopo Total

| Acao | Quantidade | Prioridade |
|------|------------|------------|
| Remover | 2 arquivos | P0/P1 |
| Modificar | 3 arquivos | P1/P2 |
| Criar | 0 arquivos | - |

**Nota:** A migration `20260117000000_add_visitor_sessions_fields.sql` ja foi criada e esta no repositorio.

---

## 2. Arquivos a REMOVER

### 2.1 [P0] `src/lib/kiwify/webhooks.ts` - REMOVER

**Motivo:** Arquivo vazio/legado que causa confusao de imports.

**Evidencia:** O PRD menciona que este arquivo tem apenas 1 linha e causa erro de import.

**Verificacao atual:** O arquivo NAO EXISTE mais na pasta `/src/lib/kiwify/`. O diretorio contem apenas:
- `client.ts` (6068 bytes)
- `webhooks-integrated.ts` (16728 bytes)

**Status:** ✅ JA REMOVIDO (ou nunca existiu neste estado)

**Acao necessaria:** Nenhuma

---

### 2.2 [P1] `src/middleware-subscription.ts` - REMOVER

**Caminho completo:** `/Users/allisonnascimento/Desktop/Saas/FinalRote/src/middleware-subscription.ts`

**Motivo:** Middleware legado que usa modelo de dados diferente (`users_extra` ao inves de `organizations`).

**Problemas:**
1. Usa `createMiddlewareClient` do `@supabase/auth-helpers-nextjs` (pacote antigo)
2. Modelo de dados conflitante com o padrao multi-tenant
3. Confusao com `middleware.ts` na raiz (arquivo principal)

**Acao necessaria:** Deletar o arquivo

**Comando:**
```bash
rm /Users/allisonnascimento/Desktop/Saas/FinalRote/src/middleware-subscription.ts
```

**Verificacao pos-remocao:**
- Garantir que `middleware.ts` na raiz esta funcionando
- Testar fluxo de autenticacao e subscription gating

---

## 3. Arquivos a MODIFICAR

### 3.1 [P1] `src/app/api/webhooks/kiwify/purchase-approved/route.ts`

**Caminho:** `/Users/allisonnascimento/Desktop/Saas/FinalRote/src/app/api/webhooks/kiwify/purchase-approved/route.ts`

**Status atual:** ✅ JA CORRIGIDO

**Import atual (linha 8-11):**
```typescript
import {
  validateKiwifyWebhook,
  processKiwifyWebhook,
} from '@/lib/kiwify/webhooks-integrated';
```

**Acao necessaria:** Nenhuma - import ja esta correto

---

### 3.2 [P2] `src/app/onboarding/page.tsx` - Integrar SubscriptionBanner

**Caminho:** `/Users/allisonnascimento/Desktop/Saas/FinalRote/src/app/onboarding/page.tsx`

**Estado atual:** Funcional, mas sem SubscriptionBanner

**Modificacao sugerida:** Adicionar SubscriptionBanner no topo da pagina para consistencia visual.

**Diff proposto:**
```diff
 'use client'

 import { useState } from 'react'
 import { useRouter } from 'next/navigation'
 import { createClient } from '@/lib/supabase/client'
+import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner'

 export default function OnboardingPage() {
   // ... codigo existente ...

   return (
     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
+      <SubscriptionBanner />
       <div className="w-full max-w-md">
         {/* ... resto do componente ... */}
       </div>
     </div>
   )
 }
```

**Dependencia:** Verificar interface do SubscriptionBanner para garantir compatibilidade.

---

### 3.3 [P2] `src/app/billing/page.tsx` - Integrar SubscriptionBanner

**Caminho:** `/Users/allisonnascimento/Desktop/Saas/FinalRote/src/app/billing/page.tsx`

**Estado atual:** Funcional, mas sem SubscriptionBanner

**Modificacao sugerida:** Adicionar SubscriptionBanner no topo da pagina.

**Diff proposto:**
```diff
 'use client'

 import { useEffect, useState } from 'react'
 import Link from 'next/link'
 import { createClient } from '@/lib/supabase/client'
+import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner'

 // ... interface SubscriptionInfo ...

 export default function BillingPage() {
   // ... codigo existente ...

   return (
     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
+      <SubscriptionBanner />
       <div className="max-w-2xl mx-auto pt-12">
         {/* ... resto do componente ... */}
       </div>
     </div>
   )
 }
```

---

## 4. Arquivos a CRIAR

### 4.1 Migration visitor_sessions - JA EXISTE

**Caminho:** `/Users/allisonnascimento/Desktop/Saas/FinalRote/supabase/migrations/20260117000000_add_visitor_sessions_fields.sql`

**Status:** ✅ JA CRIADO

**Conteudo:** Adiciona campos faltantes em `visitor_sessions`:
- `project_id` (FK para projects)
- `user_agent`, `ip_address`, `referrer`
- `browser_name`, `browser_version`
- `os_name`, `os_version`
- `screen_resolution`
- `last_activity_at`
- `fbclid`, `gclid`, `msclkid`, `ttclid`
- `page_views`, `conversions`

**Acao necessaria:** Executar migration no Supabase

**Comando local:**
```bash
supabase db push
```

**Ou via Dashboard:**
1. Acessar Supabase Dashboard > SQL Editor
2. Colar conteudo da migration
3. Executar

---

## 5. Arquivos Existentes - Verificacao

### 5.1 Webhooks Kiwify - OK

| Arquivo | Status | Notas |
|---------|--------|-------|
| `src/app/api/webhooks/kiwify/purchase-approved/route.ts` | ✅ OK | Import correto |
| `src/app/api/webhooks/kiwify/canceled/route.ts` | ✅ OK | Import correto |
| `src/app/api/webhooks/kiwify/payment-late/route.ts` | ✅ OK | Import correto |
| `src/lib/kiwify/webhooks-integrated.ts` | ✅ OK | Arquivo principal |
| `src/lib/kiwify/client.ts` | ✅ OK | Cliente API |

### 5.2 Middleware - OK

| Arquivo | Status | Notas |
|---------|--------|-------|
| `middleware.ts` (raiz) | ✅ OK | Middleware principal, usa `@supabase/ssr` |
| `src/middleware-subscription.ts` | ⚠️ REMOVER | Legado, conflitante |

### 5.3 Paginas Billing/Onboarding/Blocked - OK

| Pagina | Arquivo | Status |
|--------|---------|--------|
| `/onboarding` | `src/app/onboarding/page.tsx` | ✅ OK |
| `/blocked` | `src/app/blocked/page.tsx` | ✅ OK |
| `/billing` | `src/app/billing/page.tsx` | ✅ OK |
| `/billing/inactive` | `src/app/billing/inactive/page.tsx` | ✅ OK |
| `/billing/canceled` | `src/app/billing/canceled/page.tsx` | ✅ Verificar |
| `/billing/unpaid` | `src/app/billing/unpaid/page.tsx` | ✅ Verificar |
| `/billing/expired` | `src/app/billing/expired/page.tsx` | ✅ Verificar |

### 5.4 Migrations - OK

| Migration | Status | Notas |
|-----------|--------|-------|
| `103_create_logs.sql` | ✅ OK | Tabelas de log completas |
| `20250926000006_fix_analytics_schema.sql` | ✅ OK | visitor_sessions base |
| `20260117000000_add_visitor_sessions_fields.sql` | ✅ OK | Campos adicionais |

### 5.5 Componentes Subscription - OK

| Componente | Caminho | Status |
|------------|---------|--------|
| SubscriptionBanner | `src/components/subscription/SubscriptionBanner.tsx` | ✅ Existente |
| UsageLimitsCard | `src/components/subscription/UsageLimitsCard.tsx` | ✅ Existente |

---

## 6. Ordem de Execucao

### Fase 1: Limpeza (P0/P1)

```bash
# 1. Remover middleware legado
rm /Users/allisonnascimento/Desktop/Saas/FinalRote/src/middleware-subscription.ts

# 2. Verificar que webhooks.ts nao existe (ja removido)
ls -la /Users/allisonnascimento/Desktop/Saas/FinalRote/src/lib/kiwify/
```

### Fase 2: Database (P1)

```bash
# Executar migration de visitor_sessions
cd /Users/allisonnascimento/Desktop/Saas/FinalRote
supabase db push
```

**Ou manualmente no Supabase Dashboard:**
- SQL Editor > Executar `20260117000000_add_visitor_sessions_fields.sql`

### Fase 3: UI (P2)

1. Modificar `src/app/onboarding/page.tsx` - Adicionar SubscriptionBanner
2. Modificar `src/app/billing/page.tsx` - Adicionar SubscriptionBanner

### Fase 4: Validacao

```bash
# 1. Verificar build
npm run build

# 2. Iniciar servidor
npm run dev

# 3. Testar fluxos manualmente (ver secao 7)
```

---

## 7. Checklist de Validacao

### 7.1 Webhook Kiwify

- [ ] POST `/api/webhooks/kiwify/purchase-approved` com payload valido
- [ ] Verificar salvamento em `kiwify_webhooks`
- [ ] Verificar criacao/atualizacao de subscription
- [ ] Verificar log em `subscription_logs`

### 7.2 Middleware de Subscription

- [ ] Usuario sem sessao → `/auth/signin`
- [ ] Usuario sem org → `/onboarding`
- [ ] Org bloqueada → `/blocked`
- [ ] Org inativa → `/billing/inactive`
- [ ] Subscription canceled → `/billing/canceled`
- [ ] Subscription active → dashboard normal

### 7.3 Paginas de Billing

- [ ] `/billing` - mostra status
- [ ] `/billing/inactive` - mensagem + CTA
- [ ] `/billing/canceled` - mensagem + CTA
- [ ] `/billing/unpaid` - alerta + CTA
- [ ] `/billing/expired` - mensagem + CTA
- [ ] `/blocked` - motivo + suporte

### 7.4 Tracking e Assignment

- [ ] SDK faz assignment de variante
- [ ] SDK envia eventos
- [ ] Eventos salvos em `events`
- [ ] Sessoes atualizadas em `visitor_sessions`

---

## 8. Dependencias Externas

### 8.1 Variaveis de Ambiente Necessarias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Kiwify
KIWIFY_WEBHOOK_SECRET=
KIWIFY_API_KEY= (opcional)

# Resend (futuro)
RESEND_API_KEY= (quando implementar emails)
```

### 8.2 Tabelas Necessarias no Supabase

| Tabela | Migration | Status |
|--------|-----------|--------|
| `users` | base schema | ✅ |
| `organizations` | base schema | ✅ |
| `organization_members` | base schema | ✅ |
| `subscriptions` | 101_create_subscriptions.sql | ✅ |
| `plans` | 100_create_plans.sql | ✅ |
| `subscription_logs` | 103_create_logs.sql | ✅ |
| `kiwify_webhooks` | 103_create_logs.sql | ✅ |
| `email_logs` | 103_create_logs.sql | ✅ |
| `audit_logs` | 103_create_logs.sql | ✅ |
| `visitor_sessions` | 20250926000006 + 20260117000000 | ✅ |
| `events` | base A/B testing schema | ✅ |
| `experiments` | base A/B testing schema | ✅ |
| `variants` | base A/B testing schema | ✅ |
| `assignments` | base A/B testing schema | ✅ |
| `projects` | base A/B testing schema | ✅ |

---

## 9. Riscos e Mitigacoes

### 9.1 Risco: Migration falha por dados duplicados

**Mitigacao:** A migration `20260117000000` usa `ADD COLUMN IF NOT EXISTS` e trata erro de constraint duplicada.

### 9.2 Risco: Middleware bloqueia usuarios legitimos

**Mitigacao:** Middleware usa fail-open (permite acesso em caso de erro).

### 9.3 Risco: Webhooks nao processados

**Mitigacao:** Todos webhooks sao salvos em `kiwify_webhooks` antes de processar. Campo `processing_attempts` permite retry.

---

## 10. Conclusao

### Acoes Imediatas (P0)

1. ✅ Import de webhooks ja corrigido
2. ⏳ Remover `src/middleware-subscription.ts`

### Acoes Criticas (P1)

1. ⏳ Executar migration `20260117000000_add_visitor_sessions_fields.sql`
2. ⏳ Verificar execucao das migrations 103_create_logs.sql no Supabase

### Acoes Importantes (P2)

1. ⏳ Integrar SubscriptionBanner nas paginas de onboarding e billing
2. ⏳ Testar fluxo completo de webhook → subscription → middleware

---

**Documento gerado em:** 2026-01-17
**Autor:** Claude Code
