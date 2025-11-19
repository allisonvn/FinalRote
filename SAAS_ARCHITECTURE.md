# 🏗️ Arquitetura SaaS - Sistema Completo

## 📋 Visão Geral

Sistema SaaS moderno e escalável para gestão de assinaturas, com integração completa de pagamentos via **Kiwify**, autenticação via **Supabase Auth** e envio de emails via **Resend**.

---

## 🎯 Stack Tecnológica

### Frontend
- **Next.js 15** (App Router)
- **React 19** com TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **React Query** para cache e estados
- **Zod** para validação

### Backend
- **Supabase Pro**
  - PostgreSQL (banco de dados)
  - Auth (autenticação)
  - Edge Functions (serverless)
  - Storage (arquivos)
  - Realtime (websockets)

### Serviços Externos
- **Kiwify** - Gateway de pagamentos
- **Resend** - Envio de emails transacionais
- **Vercel** - Deploy e Edge Network

### Infraestrutura
- **Vercel Cron Jobs** - Tarefas agendadas
- **GitHub Actions** - CI/CD
- **Sentry** - Monitoramento de erros (opcional)

---

## 📁 Estrutura de Pastas

```
/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   ├── kiwify/
│   │   │   │   │   ├── purchase-approved/route.ts
│   │   │   │   │   ├── payment-late/route.ts
│   │   │   │   │   └── canceled/route.ts
│   │   │   ├── admin/
│   │   │   │   ├── users/route.ts
│   │   │   │   ├── subscriptions/route.ts
│   │   │   │   ├── plans/route.ts
│   │   │   │   └── logs/route.ts
│   │   │   ├── subscriptions/
│   │   │   │   ├── check-status/route.ts
│   │   │   │   ├── upgrade/route.ts
│   │   │   │   └── downgrade/route.ts
│   │   │   └── cron/
│   │   │       └── check-payments/route.ts
│   │   ├── auth/
│   │   │   ├── signin/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── callback/route.ts
│   │   ├── dashboard/
│   │   │   ├── page.tsx (overview)
│   │   │   ├── subscription/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx (overview)
│   │   │   ├── users/page.tsx
│   │   │   ├── subscriptions/page.tsx
│   │   │   ├── plans/page.tsx
│   │   │   └── logs/page.tsx
│   │   └── middleware.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── admin.ts
│   │   ├── kiwify/
│   │   │   ├── client.ts
│   │   │   ├── webhooks.ts
│   │   │   └── types.ts
│   │   ├── resend/
│   │   │   ├── client.ts
│   │   │   ├── templates.ts
│   │   │   └── send.ts
│   │   ├── auth/
│   │   │   ├── session.ts
│   │   │   ├── middleware.ts
│   │   │   └── permissions.ts
│   │   ├── subscriptions/
│   │   │   ├── status.ts
│   │   │   ├── limits.ts
│   │   │   └── upgrade.ts
│   │   └── utils/
│   │       ├── validation.ts
│   │       ├── logger.ts
│   │       └── errors.ts
│   ├── types/
│   │   ├── database.ts
│   │   ├── kiwify.ts
│   │   ├── subscription.ts
│   │   └── user.ts
│   └── components/
│       ├── auth/
│       ├── dashboard/
│       ├── admin/
│       ├── subscription/
│       └── ui/
├── supabase/
│   ├── migrations/
│   │   ├── 100_create_plans.sql
│   │   ├── 101_create_subscriptions.sql
│   │   ├── 102_create_users_extra.sql
│   │   ├── 103_create_logs.sql
│   │   ├── 104_create_rls_policies.sql
│   │   └── 105_create_functions.sql
│   └── functions/
│       ├── check-payments/
│       └── process-webhook/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
    ├── API.md
    ├── KIWIFY.md
    ├── RESEND.md
    └── DEPLOYMENT.md
```

---

## 🗄️ Modelo de Dados

### Tabelas Principais

#### 1. `auth.users` (Supabase nativo)
```sql
-- Gerenciado automaticamente pelo Supabase Auth
id: uuid (PK)
email: string
encrypted_password: string
email_confirmed_at: timestamp
created_at: timestamp
updated_at: timestamp
```

#### 2. `public.plans`
```sql
CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price_monthly decimal(10,2) NOT NULL,
  price_yearly decimal(10,2),
  kiwify_product_id text,
  features jsonb DEFAULT '{}'::jsonb,
  limits jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Limits example: {"max_experiments": 10, "max_visitors": 10000}
-- Features example: {"custom_domains": true, "priority_support": true}
```

#### 3. `public.subscriptions`
```sql
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES plans(id),
  kiwify_subscription_id text UNIQUE,
  kiwify_customer_id text,

  status text NOT NULL CHECK (status IN (
    'active',
    'trialing',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
  )),

  trial_ends_at timestamptz,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at timestamptz,
  canceled_at timestamptz,

  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id) -- Um usuário só pode ter uma assinatura ativa
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_kiwify_id ON subscriptions(kiwify_subscription_id);
```

#### 4. `public.users_extra`
```sql
CREATE TABLE users_extra (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  company_name text,
  phone text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),

  -- Tracking
  first_access_at timestamptz,
  last_access_at timestamptz,
  access_count integer DEFAULT 0,

  -- Preferences
  preferences jsonb DEFAULT '{}'::jsonb,

  -- Status
  is_blocked boolean DEFAULT false,
  blocked_reason text,
  blocked_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_users_extra_role ON users_extra(role);
```

#### 5. `public.subscription_logs`
```sql
CREATE TABLE subscription_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  event_type text NOT NULL, -- purchase, payment, late, canceled, upgraded, etc.
  event_source text NOT NULL, -- kiwify, manual, system, cron

  old_status text,
  new_status text,

  old_plan_id uuid REFERENCES plans(id),
  new_plan_id uuid REFERENCES plans(id),

  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscription_logs_subscription_id ON subscription_logs(subscription_id);
CREATE INDEX idx_subscription_logs_user_id ON subscription_logs(user_id);
CREATE INDEX idx_subscription_logs_event_type ON subscription_logs(event_type);
CREATE INDEX idx_subscription_logs_created_at ON subscription_logs(created_at DESC);
```

#### 6. `public.email_logs`
```sql
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  template text NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL,

  status text NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  provider_id text, -- Resend email ID
  error_message text,

  metadata jsonb DEFAULT '{}'::jsonb,

  sent_at timestamptz DEFAULT now()
);

CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
```

#### 7. `public.kiwify_webhooks`
```sql
CREATE TABLE kiwify_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  signature text,

  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_kiwify_webhooks_event_type ON kiwify_webhooks(event_type);
CREATE INDEX idx_kiwify_webhooks_processed ON kiwify_webhooks(processed);
CREATE INDEX idx_kiwify_webhooks_created_at ON kiwify_webhooks(created_at DESC);
```

---

## 🔐 Row Level Security (RLS)

### Estratégia Geral
- Todas as tabelas públicas têm RLS habilitado
- Políticas separadas para `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- Usuários só acessam seus próprios dados
- Admins têm acesso total via função `is_admin()`

### Políticas Principais

```sql
-- Helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users_extra
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Only system can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Only system can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (is_admin());

-- Users Extra
CREATE POLICY "Users can view own profile"
  ON users_extra FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own profile"
  ON users_extra FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Logs são read-only para usuários
CREATE POLICY "Users can view own logs"
  ON subscription_logs FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Admins podem ver tudo
CREATE POLICY "Admins have full access"
  ON plans FOR ALL
  USING (is_admin());
```

---

## 🔄 Fluxo de Integração Kiwify

### 1. Eventos de Webhook

#### Purchase Approved
```typescript
// Novo pagamento aprovado
POST /api/webhooks/kiwify/purchase-approved

Payload:
{
  "event": "purchase.approved",
  "data": {
    "subscription_id": "sub_xxx",
    "customer": {
      "email": "user@example.com",
      "name": "John Doe"
    },
    "product": {
      "id": "prod_xxx",
      "name": "Plano Pro"
    },
    "amount": 99.90,
    "payment_method": "credit_card"
  }
}

Ações:
1. Validar assinatura do webhook
2. Verificar se usuário existe (via email)
3. Se não existir: criar conta no Supabase Auth
4. Buscar plano correspondente (via kiwify_product_id)
5. Criar/atualizar subscription
6. Enviar email de boas-vindas via Resend
7. Log do evento
```

#### Payment Late
```typescript
// Pagamento atrasado
POST /api/webhooks/kiwify/payment-late

Payload:
{
  "event": "payment.late",
  "data": {
    "subscription_id": "sub_xxx",
    "days_late": 3,
    "amount_due": 99.90
  }
}

Ações:
1. Validar webhook
2. Atualizar status subscription para 'past_due'
3. Enviar email de aviso via Resend
4. Log do evento
```

#### Canceled
```typescript
// Assinatura cancelada
POST /api/webhooks/kiwify/canceled

Payload:
{
  "event": "subscription.canceled",
  "data": {
    "subscription_id": "sub_xxx",
    "reason": "customer_request"
  }
}

Ações:
1. Validar webhook
2. Atualizar status para 'canceled'
3. Definir cancel_at para fim do período atual
4. Enviar email de cancelamento
5. Log do evento
```

### 2. Consulta de Status via API

```typescript
// Rotina diária: verifica status de todas as assinaturas ativas
async function checkKiwifyPayments() {
  const subscriptions = await supabase
    .from('subscriptions')
    .select('*')
    .in('status', ['active', 'trialing', 'past_due']);

  for (const sub of subscriptions) {
    const kiwifyStatus = await kiwifyClient.getSubscription(
      sub.kiwify_subscription_id
    );

    if (kiwifyStatus.status !== sub.status) {
      await updateSubscriptionStatus(sub.id, kiwifyStatus);
    }
  }
}
```

---

## 📧 Integração Resend

### Templates de Email

```typescript
// 1. Boas-vindas
{
  template: 'welcome',
  subject: 'Bem-vindo ao [SaaS Name]!',
  data: { name, planName, features }
}

// 2. Confirmação de Pagamento
{
  template: 'payment-confirmed',
  subject: 'Pagamento confirmado',
  data: { amount, invoiceUrl, nextBillingDate }
}

// 3. Aviso de Atraso
{
  template: 'payment-late',
  subject: 'Ação necessária: Pagamento atrasado',
  data: { daysLate, amount, updatePaymentUrl }
}

// 4. Bloqueio de Conta
{
  template: 'account-blocked',
  subject: 'Sua conta foi bloqueada',
  data: { reason, regularizeUrl }
}

// 5. Desbloqueio
{
  template: 'account-unblocked',
  subject: 'Conta reativada com sucesso!',
  data: { planName, accessUrl }
}

// 6. Upgrade
{
  template: 'plan-upgraded',
  subject: 'Parabéns pelo upgrade!',
  data: { oldPlan, newPlan, newFeatures }
}

// 7. Cancelamento
{
  template: 'subscription-canceled',
  subject: 'Assinatura cancelada',
  data: { accessUntil, exportDataUrl }
}
```

### Função de Envio

```typescript
// src/lib/resend/send.ts
import { Resend } from 'resend';
import { templates } from './templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  template: keyof typeof templates,
  data: Record<string, any>
) {
  const { subject, html } = templates[template](data);

  try {
    const response = await resend.emails.send({
      from: 'noreply@seudominio.com',
      to,
      subject,
      html
    });

    // Log de sucesso
    await logEmail({
      user_id: data.userId,
      template,
      recipient: to,
      subject,
      status: 'sent',
      provider_id: response.id
    });

    return response;
  } catch (error) {
    // Log de erro
    await logEmail({
      user_id: data.userId,
      template,
      recipient: to,
      subject,
      status: 'failed',
      error_message: error.message
    });

    throw error;
  }
}
```

---

## ⏰ Rotina Automática de Inadimplência

### Vercel Cron Job

```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-payments",
      "schedule": "0 6 * * *" // Todo dia às 6h
    }
  ]
}
```

### Endpoint de Verificação

```typescript
// src/app/api/cron/check-payments/route.ts
export async function GET(request: Request) {
  // Validar cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 1. Buscar assinaturas para verificar
  const subscriptionsToCheck = await getSubscriptionsToCheck();

  // 2. Verificar status na Kiwify
  for (const sub of subscriptionsToCheck) {
    const kiwifyStatus = await checkKiwifyStatus(sub);

    // 3. Atualizar se necessário
    if (needsUpdate(sub, kiwifyStatus)) {
      await updateSubscription(sub, kiwifyStatus);
      await sendNotificationEmail(sub, kiwifyStatus);
    }
  }

  // 4. Bloquear contas vencidas há mais de X dias
  await blockExpiredAccounts();

  return Response.json({ success: true });
}
```

### Lógica de Bloqueio

```typescript
async function blockExpiredAccounts() {
  const GRACE_PERIOD_DAYS = 7;

  const expiredSubs = await supabase
    .from('subscriptions')
    .select('*, users_extra(*)')
    .eq('status', 'past_due')
    .lt(
      'current_period_end',
      new Date(Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)
    );

  for (const sub of expiredSubs) {
    // Bloquear usuário
    await supabase
      .from('users_extra')
      .update({
        is_blocked: true,
        blocked_reason: 'payment_overdue',
        blocked_at: new Date()
      })
      .eq('id', sub.user_id);

    // Atualizar status
    await supabase
      .from('subscriptions')
      .update({ status: 'unpaid' })
      .eq('id', sub.id);

    // Enviar email
    await sendEmail(sub.users_extra.email, 'account-blocked', {
      userId: sub.user_id,
      daysOverdue: GRACE_PERIOD_DAYS
    });

    // Log
    await logEvent({
      subscription_id: sub.id,
      user_id: sub.user_id,
      event_type: 'blocked',
      event_source: 'cron'
    });
  }
}
```

---

## 🛡️ Middleware de Autenticação

```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // 1. Verificar sessão
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  // 2. Verificar se usuário está bloqueado
  const { data: userExtra } = await supabase
    .from('users_extra')
    .select('is_blocked, blocked_reason')
    .eq('id', session.user.id)
    .single();

  if (userExtra?.is_blocked) {
    return NextResponse.redirect(
      new URL('/blocked?reason=' + userExtra.blocked_reason, req.url)
    );
  }

  // 3. Verificar assinatura
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', session.user.id)
    .single();

  if (!subscription || subscription.status !== 'active') {
    // Permitir acesso a páginas de cobrança
    if (!req.nextUrl.pathname.startsWith('/billing')) {
      return NextResponse.redirect(new URL('/billing/expired', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/protected/:path*']
};
```

---

## 👑 Painel Administrativo

### Páginas do Admin

1. **Overview** (`/admin`)
   - Total de usuários
   - Receita mensal
   - Taxa de churn
   - Assinaturas ativas/inativas
   - Gráficos de crescimento

2. **Usuários** (`/admin/users`)
   - Listagem com filtros
   - Busca por email/nome
   - Status da assinatura
   - Ações: bloquear, desbloquear, editar plano

3. **Assinaturas** (`/admin/subscriptions`)
   - Listagem de todas as assinaturas
   - Filtros por status, plano, data
   - Histórico de pagamentos
   - Ações manuais (upgrade, downgrade, cancelar)

4. **Planos** (`/admin/plans`)
   - CRUD de planos
   - Configuração de limites
   - Configuração de features
   - Preços e periodicidade

5. **Logs** (`/admin/logs`)
   - Eventos de webhook
   - Logs de assinatura
   - Logs de email
   - Filtros avançados

### Permissões

```typescript
// Middleware específico para admin
export async function checkAdminAccess(userId: string) {
  const { data } = await supabase
    .from('users_extra')
    .select('role')
    .eq('id', userId)
    .single();

  return data?.role === 'admin' || data?.role === 'superadmin';
}
```

---

## 🧪 Estratégia de Testes

### 1. Testes Unitários (Jest)

```typescript
// tests/unit/subscriptions.test.ts
describe('Subscription Status', () => {
  it('should update status when payment is late', async () => {
    const sub = await createTestSubscription();
    await updateStatus(sub.id, 'past_due');

    const updated = await getSubscription(sub.id);
    expect(updated.status).toBe('past_due');
  });
});
```

### 2. Testes de Integração

```typescript
// tests/integration/kiwify-webhook.test.ts
describe('Kiwify Webhooks', () => {
  it('should create subscription on purchase approved', async () => {
    const payload = mockPurchaseApproved();

    const response = await fetch('/api/webhooks/kiwify/purchase-approved', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(200);

    const sub = await getSubscriptionByKiwifyId(payload.subscription_id);
    expect(sub).toBeDefined();
    expect(sub.status).toBe('active');
  });
});
```

### 3. Testes E2E (Cypress)

```typescript
// tests/e2e/auth-flow.cy.ts
describe('Authentication Flow', () => {
  it('should allow user to sign up and access dashboard', () => {
    cy.visit('/auth/signup');
    cy.get('[name="email"]').type('test@example.com');
    cy.get('[name="password"]').type('password123');
    cy.get('[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo');
  });
});
```

---

## 🔒 Segurança e LGPD

### Medidas de Segurança

1. **Autenticação**
   - Senhas hash automático (Supabase)
   - 2FA opcional
   - Rate limiting em endpoints sensíveis

2. **Dados Sensíveis**
   - Nunca armazenar dados de cartão
   - Criptografar campos sensíveis se necessário
   - Logs sem informações pessoais

3. **API**
   - Validação de todos os inputs (Zod)
   - CORS configurado
   - CSRF protection
   - Webhook signature validation

### Conformidade LGPD

1. **Consentimento**
   - Checkbox explícito no cadastro
   - Política de privacidade acessível

2. **Direito de Acesso**
   - Endpoint para exportar todos os dados do usuário
   ```typescript
   GET /api/user/export-data
   ```

3. **Direito ao Esquecimento**
   - Endpoint para deletar conta e todos os dados
   ```typescript
   DELETE /api/user/delete-account
   ```

4. **Anonimização**
   - Após 5 anos de inatividade, anonimizar dados
   - Manter apenas dados agregados para analytics

---

## 🚀 Deploy e CI/CD

### GitHub Actions

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Migrations

```bash
# Desenvolvimento
supabase db reset

# Staging
supabase db push --db-url $STAGING_DB_URL

# Production
supabase db push --db-url $PRODUCTION_DB_URL
```

---

## 📊 Monitoramento

### Métricas Essenciais

1. **Negócio**
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - LTV (Lifetime Value)
   - CAC (Customer Acquisition Cost)

2. **Técnico**
   - API response time
   - Error rate
   - Database queries performance
   - Email delivery rate

3. **Assinaturas**
   - Conversão trial → pago
   - Taxa de inadimplência
   - Upgrades/Downgrades
   - Cancelamentos

### Dashboards

```typescript
// src/app/admin/analytics/page.tsx
- Gráficos de receita
- Funil de conversão
- Mapa de calor de churn
- Relatórios exportáveis (CSV, PDF)
```

---

## 🎓 Documentação Complementar

1. **API.md** - Documentação completa de endpoints
2. **KIWIFY.md** - Guia de integração Kiwify
3. **RESEND.md** - Templates e exemplos Resend
4. **DEPLOYMENT.md** - Guia de deploy passo a passo

---

## ✅ Checklist de Implementação

- [ ] Setup inicial do projeto
- [ ] Configurar Supabase
- [ ] Criar schema do banco
- [ ] Implementar RLS policies
- [ ] Configurar Supabase Auth
- [ ] Implementar páginas de auth
- [ ] Criar endpoints de API
- [ ] Integrar Kiwify (webhooks)
- [ ] Integrar Resend (emails)
- [ ] Implementar middleware
- [ ] Criar dashboard do usuário
- [ ] Criar painel administrativo
- [ ] Implementar cron job
- [ ] Escrever testes
- [ ] Configurar CI/CD
- [ ] Deploy staging
- [ ] Testes em staging
- [ ] Deploy production
- [ ] Monitoramento ativo

---

**Última atualização:** 2025-11-19
**Versão:** 1.0.0
