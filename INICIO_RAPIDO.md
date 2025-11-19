# 🚀 Início Rápido - Sistema SaaS

## ✅ O QUE JÁ ESTÁ PRONTO

**Backend 100% implementado:**
- ✅ Banco de dados completo (7 tabelas)
- ✅ 20+ funções SQL úteis
- ✅ Integração Kiwify (webhooks)
- ✅ Integração Resend (emails)
- ✅ Cron job de inadimplência
- ✅ Middleware de segurança
- ✅ RLS em todas as tabelas

---

## 🔧 CONFIGURAÇÃO (5 passos)

### 1. Configurar Variáveis de Ambiente

```bash
cp .env.example .env.local
```

Preencher com suas credenciais:

```bash
# Supabase (obter em: https://app.supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Resend (obter em: https://resend.com/api-keys)
RESEND_API_KEY=re_sua_key
RESEND_FROM_EMAIL=noreply@seudominio.com

# Kiwify (obter em: https://dashboard.kiwify.com.br)
KIWIFY_API_KEY=sua_key_kiwify
KIWIFY_WEBHOOK_SECRET=seu_secret

# Cron (gerar: openssl rand -hex 32)
CRON_SECRET=seu_token_seguro

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 2. Executar Migrations do Banco

**Opção A: Via Supabase CLI**
```bash
supabase login
supabase link --project-ref seu-project-ref
supabase db push
```

**Opção B: Via SQL Editor (Supabase Dashboard)**
1. Acessar: https://app.supabase.com → SQL Editor
2. Executar em ordem:
   - `100_create_plans.sql`
   - `101_create_subscriptions.sql`
   - `102_create_users_extra.sql`
   - `103_create_logs.sql`
   - `104_create_admin_functions_and_views.sql`

### 3. Configurar Webhooks na Kiwify

No dashboard da Kiwify, criar 3 webhooks:

```
1. Purchase Approved
   URL: https://seudominio.com/api/webhooks/kiwify/purchase-approved
   Events: purchase.approved

2. Payment Late
   URL: https://seudominio.com/api/webhooks/kiwify/payment-late
   Events: payment.late, payment.refused

3. Subscription Canceled
   URL: https://seudominio.com/api/webhooks/kiwify/canceled
   Events: subscription.canceled
```

### 4. Instalar Dependências

```bash
npm install
# ou
yarn install
```

### 5. Criar Primeiro Admin

Depois de fazer signup, executar no SQL Editor:

```sql
UPDATE users_extra
SET role = 'superadmin'
WHERE id = 'UUID-DO-SEU-USUARIO';
```

Para obter o UUID:
```sql
SELECT id, email FROM auth.users;
```

---

## 🧪 TESTAR O SISTEMA

### 1. Testar Migrations

```sql
-- Verificar se tabelas foram criadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deve retornar: audit_logs, email_logs, kiwify_webhooks,
-- plans, subscription_logs, subscriptions, users_extra

-- Verificar planos seed
SELECT id, name, slug, price_monthly FROM plans;
```

### 2. Testar Webhook (desenvolvimento)

```bash
# Simular webhook da Kiwify
curl -X POST http://localhost:3001/api/webhooks/kiwify/purchase-approved \
  -H "Content-Type: application/json" \
  -H "x-kiwify-signature: test-signature" \
  -d '{
    "event": "purchase.approved",
    "data": {
      "event_type": "purchase.approved",
      "purchase": {
        "id": "test-purchase-123",
        "order_id": "order-123",
        "customer": {
          "id": "customer-123",
          "email": "teste@example.com",
          "name": "João Silva"
        },
        "product": {
          "id": "prod_xxx",
          "name": "Plano Pro"
        },
        "payment": {
          "id": "pay-123",
          "amount": 99.90,
          "payment_method": "credit_card",
          "paid_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
        }
      }
    }
  }'
```

### 3. Testar Envio de Email

```typescript
// No seu código
import { sendEmail } from '@/lib/resend/client';

await sendEmail({
  to: 'seu-email@example.com',
  template: 'welcome',
  data: {
    name: 'Teste',
    appName: 'Meu SaaS',
    planName: 'Pro',
    dashboardUrl: 'https://app.com/dashboard'
  }
});
```

### 4. Testar Cron Job

```bash
# Executar manualmente
curl -X POST http://localhost:3001/api/cron/check-payments \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

---

## 📊 CONSULTAS ÚTEIS

### Ver Usuários e Assinaturas

```sql
SELECT * FROM admin_users_view
ORDER BY user_created_at DESC
LIMIT 10;
```

### Ver Estatísticas

```sql
-- Via view
SELECT * FROM admin_subscription_stats;

-- Via função
SELECT get_admin_dashboard_stats();
```

### Ver Receita por Plano

```sql
SELECT * FROM admin_revenue_by_plan
ORDER BY mrr DESC;
```

### Ver Últimos Webhooks

```sql
SELECT
  id,
  event_type,
  processed,
  received_at,
  error_message
FROM kiwify_webhooks
ORDER BY received_at DESC
LIMIT 20;
```

### Ver Últimos Emails

```sql
SELECT
  id,
  template,
  recipient,
  status,
  sent_at
FROM email_logs
ORDER BY sent_at DESC
LIMIT 20;
```

### Ver Logs de Assinatura

```sql
SELECT
  sl.id,
  sl.event_type,
  sl.event_source,
  sl.old_status,
  sl.new_status,
  sl.created_at,
  u.email,
  p.name as plan_name
FROM subscription_logs sl
JOIN auth.users u ON sl.user_id = u.id
LEFT JOIN plans p ON sl.new_plan_id = p.id
ORDER BY sl.created_at DESC
LIMIT 20;
```

---

## 🎯 PRÓXIMOS PASSOS

### Fase 1: Frontend Básico
1. Criar páginas de autenticação
   - `/auth/signin`
   - `/auth/signup`
2. Criar dashboard do usuário
   - Ver assinatura atual
   - Ver faturas
3. Criar página de bloqueio/renovação

### Fase 2: Painel Admin
1. Dashboard com métricas
2. Tabela de usuários
3. Gestão de assinaturas
4. Visualização de logs

### Fase 3: Testes
1. Unit tests das funções
2. Integration tests dos webhooks
3. E2E tests dos fluxos principais

### Fase 4: Deploy
1. Deploy no Vercel
2. Configurar domínio customizado
3. Ativar Vercel Cron
4. Monitoramento (Sentry)

---

## 🔍 DEBUGGING

### Webhook não funciona?

1. Verificar assinatura HMAC:
```sql
SELECT * FROM kiwify_webhooks
WHERE processed = false
ORDER BY received_at DESC;
```

2. Ver erro específico:
```sql
SELECT payload, error_message FROM kiwify_webhooks
WHERE id = 'webhook-id';
```

### Email não enviado?

```sql
SELECT * FROM email_logs
WHERE status = 'failed'
ORDER BY sent_at DESC;
```

### Cron não executando?

1. Verificar configuração no Vercel
2. Testar manualmente com curl
3. Ver logs no Vercel Dashboard

---

## 📚 ARQUITETURA

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE                            │
│               (Compra na Kiwify)                        │
└────────────┬────────────────────────────────────────────┘
             │
             ├─ Compra aprovada
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│                  KIWIFY WEBHOOK                         │
│          /api/webhooks/kiwify/*                         │
└────────────┬────────────────────────────────────────────┘
             │
             ├─ Validar HMAC
             ├─ Salvar no kiwify_webhooks
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│              PROCESSAR WEBHOOK                          │
│    1. Criar/buscar usuário (Supabase Auth)             │
│    2. Criar assinatura                                  │
│    3. Log no subscription_logs                          │
└────────────┬────────────────────────────────────────────┘
             │
             ├─ Enviar email (Resend)
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│                  EMAIL ENVIADO                          │
│              (log no email_logs)                        │
└─────────────────────────────────────────────────────────┘

CRON DIÁRIO (06:00 AM):
┌─────────────────────────────────────────────────────────┐
│         /api/cron/check-payments                        │
│                                                         │
│   1. Buscar assinaturas ativas                          │
│   2. Verificar status na Kiwify API                     │
│   3. Atualizar se necessário                            │
│   4. Bloquear vencidas (> 7 dias)                       │
│   5. Enviar emails de aviso/bloqueio                    │
└─────────────────────────────────────────────────────────┘

MIDDLEWARE (toda requisição):
┌─────────────────────────────────────────────────────────┐
│        subscriptionMiddleware                           │
│                                                         │
│   1. Verificar autenticação                             │
│   2. Verificar se usuário está bloqueado                │
│   3. Verificar assinatura ativa                         │
│   4. Redirecionar se necessário                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎓 RECURSOS

### Documentação Completa
- `SAAS_ARCHITECTURE.md` - Arquitetura detalhada
- `SISTEMA_SAAS_COMPLETO.md` - Status de implementação
- Este arquivo - Guia de início rápido

### Exemplos de Uso

#### TypeScript
```typescript
// Verificar assinatura ativa
const { data: isActive } = await supabase
  .rpc('is_subscription_active', { user_uuid: userId });

// Buscar dados completos do usuário
const { data: userInfo } = await supabase
  .rpc('get_user_complete_info', { user_uuid: userId });

// Verificar acesso a feature
const { data: hasAccess } = await supabase
  .rpc('has_feature_access', {
    user_uuid: userId,
    feature_key: 'custom_domains'
  });

// Buscar limite de uso
const { data: limit } = await supabase
  .rpc('get_usage_limit', {
    user_uuid: userId,
    limit_key: 'max_experiments'
  });
```

---

## ✅ CHECKLIST DE PRODUÇÃO

Antes de lançar:

### Backend
- [x] Migrations executadas
- [x] RLS policies ativas
- [x] Funções SQL testadas
- [x] Webhooks configurados
- [ ] Cron job testado
- [ ] Emails testados

### Frontend
- [ ] Páginas de auth criadas
- [ ] Dashboard de usuário
- [ ] Painel admin
- [ ] Página de bloqueio

### Segurança
- [x] Variáveis de ambiente seguras
- [x] HMAC validation nos webhooks
- [x] RLS habilitado
- [ ] Rate limiting
- [ ] CSRF protection

### Monitoramento
- [ ] Sentry configurado
- [ ] Logs estruturados
- [ ] Alertas configurados
- [ ] Uptime monitoring

### Legal
- [ ] Termos de uso
- [ ] Política de privacidade
- [ ] Consentimentos LGPD
- [ ] Páginas legais

---

**Última atualização:** 2025-11-19
**Versão:** 1.0.0

**Dúvidas?** Consulte `SAAS_ARCHITECTURE.md` para detalhes técnicos.
