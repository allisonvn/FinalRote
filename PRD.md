# PRD - Proteção de Assinaturas e Fluxos de Billing

## 1. Visão Geral
Este documento define os requisitos técnicos para a implementação do controle de acesso baseado em status de assinatura (Subscription Gating). Atualmente, o sistema processa webhooks da Kiwify mas não impede o acesso de usuários inadimplentes ou cancelados.

## 2. Objetivos
1.  **Bloquear acesso** a rotas protegidas (`/dashboard`, `/experiments`, etc.) para usuários com assinaturas inválidas.
2.  **Redirecionar usuários** para páginas informativas específicas (Inadimplente, Cancelado, Bloqueado).
3.  **Notificar usuários** via email (Resend) sobre eventos de assinatura.

## 3. Especificações Técnicas

### 3.1. Middleware de Verificação (Core)
O arquivo `src/middleware.ts` deve ser atualizado para realizar uma verificação secundária após a autenticação do usuário.

**Fluxo Lógico:**
1.  Usuário autenticado (Supabase Auth).
2.  Middleware busca dados do usuário em `public.users` para obter `default_org_id`.
3.  Middleware busca dados da organização em `public.organizations` (`subscription_status`, `is_blocked`).
4.  **Regras de Redirecionamento:**
    *   Se `is_blocked` == `true` ➡ Redirecionar para `/blocked`
    *   Se `subscription_status` == `'past_due'` ➡ Redirecionar para `/billing/unpaid`
    *   Se `subscription_status` == `'canceled'` ➡ Redirecionar para `/billing/canceled`
    *   Se `subscription_status` == `'inactive'` (ou null) ➡ Redirecionar para `/billing/inactive`
    *   Se `subscription_status` == `'active'` ou `'trialing'` ➡ Permitir acesso.

**Arquivos:**
*   `src/middleware.ts` (Atualizar)
*   `src/lib/auth/subscription-check.ts` (Novo: Lógica reutilizável de verificação server-side)

### 3.2. Páginas de Billing (Novas Interfaces)
Criar um *route group* `(billing)` para isolar o layout dessas páginas, que devem ser simples e focadas na conversão/resolução.

**Estrutura de Arquivos:**
*   `src/app/(billing)/layout.tsx` (Layout limpo, sem sidebar)
*   `src/app/(billing)/blocked/page.tsx` (Mensagem de bloqueio por violação/fraude)
*   `src/app/(billing)/billing/unpaid/page.tsx` (Pagamento atrasado - Botão para atualizar cartão)
*   `src/app/(billing)/billing/canceled/page.tsx` (Assinatura cancelada - Botão para reativar)
*   `src/app/(billing)/billing/inactive/page.tsx` (Sem assinatura ativa - CTA para checkout)
*   `src/components/billing/PaymentButton.tsx` (Componente para links de pagamento)

### 3.3. Integração de Log e Emails (Resend)
Preencher os TODOs deixados nos webhooks da Kiwify.

**Arquivos:**
*   `src/lib/email/client.ts` (Configuração do Resend)
*   `src/lib/email/templates/WelcomeEmail.tsx` (React Email template)
*   `src/lib/kiwify/webhooks-integrated.ts` (Integrar chamada de email no evento `purchase.approved`)

## 4. Banco de Dados (Schema existente)
As tabelas já existem e estão sendo populadas pelo webhook atual, conforme análise de `src/lib/kiwify/webhooks-integrated.ts`. Nenhuma migração nova é estritamente necessária para a lógica *core*, mas devemos garantir que a migração de logs (`103_create_logs.sql`) foi aplicada.

**Tabelas Chave:**
*   `organizations` (Colunas: `subscription_status`, `is_blocked`)
*   `subscriptions` (Fonte da verdade para detalhes de pagamento)

## 5. Plano de Implementação (Passo a Passo)

### Fase 1: Páginas de Erro (Frontend)
1.  Criar layout `(billing)`.
2.  Implementar páginas estáticas `/billing/*` e `/blocked` com design "Premium" (seguindo guia de estilo).

### Fase 2: Lógica de Middleware (Backend)
1.  Criar função helper para checar status da organização (usando Supabase Server Client).
2.  Integrar chamada no `middleware.ts`.
3.  Testar fluxos de redirecionamento manuais (alterando status no banco).

### Fase 3: Emails (Notificações)
1.  Configurar API Key do Resend.
2.  Criar template de email de boas-vindas.
3.  Descomentar/Implementar envio no webhook `purchase.approved`.

## 6. Referências
*   [Kiwify Webhooks Docs](https://help.kiwify.com.br/pt-br/article/webhooks-1s1k2c6/)
*   [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
*   [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
