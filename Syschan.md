# SYSCHAN - Relatório de Verificação do Sistema

**Data:** 2026-01-20
**Projeto:** Rota Final - SaaS A/B Testing
**Status Geral:** Sistema com implementações parciais e dados mockados em produção

---

## RESUMO EXECUTIVO

| Categoria | Total de Problemas | Criticidade |
|-----------|-------------------|-------------|
| Dados Mockados em Produção | 8 | CRÍTICO |
| TODOs Não Implementados | 6 | ALTO |
| APIs Incompletas | 12 | ALTO |
| Integrações Quebradas | 4 | ALTO |
| Validações Faltando | 7 | MÉDIO |
| Funções Retornando Null | 15+ | MÉDIO |

---

## 1. DADOS MOCKADOS EM PRODUÇÃO (CRÍTICO)

### 1.1 `src/hooks/useExperiments.ts`
- **Linhas:** 50-90
- **Problema:** Hook principal de experimentos usa dados mockados hardcoded
- **Impacto:** Experimentos listados no dashboard são FALSOS
- **O que deveria ser:**
  ```typescript
  // ATUAL (errado):
  const mockData: Experiment[] = [
    { id: '1', name: 'Teste de Botão CTA', ... },
    { id: '2', name: 'Headline da Homepage', ... }
  ]

  // CORRETO:
  const { data, error } = await fetch('/api/experiments')
  ```

### 1.2 `src/hooks/useEvents.ts`
- **Linha:** 56, 909
- **Problema:** Fallback para dados mock quando Supabase falha (silenciosamente)
- **Impacto:** Usuário vê dados falsos sem saber
- **O que deveria ser:** Exibir erro claro ao usuário, não dados falsos

### 1.3 `src/app/api/debug/schema/[table]/route.ts`
- **Linhas:** 11-121
- **Problema:** Endpoint retorna schema MOCKADO em vez de consultar `information_schema`
- **Impacto:** Debug incorreto do banco de dados
- **O que deveria ser:**
  ```sql
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = $1
  ```

### 1.4 `src/app/api/debug/constraints/[table]/route.ts`
- **Linhas:** 12-46
- **Problema:** Retorna constraints mockadas
- **Impacto:** Impossível debugar constraints reais

### 1.5 `src/app/dashboard/page.tsx` (página duplicada `page 2.tsx`)
- **Linhas:** 2203-2214
- **Problema:** `generateMockEvents()` sendo chamada para popular dashboard
- **Impacto:** Dashboard mostra eventos que nunca aconteceram

---

## 2. TODOs NÃO IMPLEMENTADOS (ALTO)

### 2.1 Criação de Experimentos
- **Arquivo:** `src/app/dashboard/page.tsx`
- **Linha:** 1797-1802
- **TODO:** "Implementar criação real do experimento no Supabase"
- **Status Atual:** Retorna toast "Funcionalidade em desenvolvimento"
- **Impacto:** Usuário NÃO consegue criar experimentos reais

### 2.2 Email de Boas-Vindas
- **Arquivo:** `src/app/api/webhooks/kiwify/purchase-approved/route.ts`
- **Linha:** 77
- **TODO:** "Integrar com Resend para enviar email"
- **Status Atual:** Apenas console.log
- **Impacto:** Novos clientes não recebem email de boas-vindas

### 2.3 Email de Pagamento Atrasado
- **Arquivo:** `src/app/api/webhooks/kiwify/payment-late/route.ts`
- **Linha:** 85
- **TODO:** "Integrar com Resend para enviar email de pagamento atrasado"
- **Impacto:** Clientes inadimplentes não são notificados

### 2.4 Email de Cancelamento
- **Arquivo:** `src/app/api/webhooks/kiwify/canceled/route.ts`
- **Linha:** 85
- **TODO:** "Integrar com Resend para enviar email de cancelamento"
- **Impacto:** Clientes não são informados do cancelamento

### 2.5 Cancelamento na Kiwify
- **Arquivo:** `src/app/api/subscription/cancel/route.ts`
- **Linhas:** 94-97
- **TODO:** "Cancelar também na Kiwify via API"
- **Status Atual:** Código COMENTADO
- **Impacto:** Cancelamento não sincroniza com gateway de pagamento
```typescript
// TODO: Cancelar também na Kiwify via API
// if (subscription.kiwify_subscription_id) {
//   await kiwifyClient.cancelSubscription(subscription.kiwify_subscription_id);
// }
```

---

## 3. APIs INCOMPLETAS/QUEBRADAS

### 3.1 Endpoints que Retornam Dados Parciais

| Arquivo | Problema |
|---------|----------|
| `src/app/api/get-metrics/route.ts` | Métricas não calculam corretamente |
| `src/app/api/revenue-data/route.ts` | Dados de receita incompletos |
| `src/app/api/funnel-data/route.ts` | Análise de funil não implementada |
| `src/app/api/visitor-trends/route.ts` | Tendências de visitantes parcial |
| `src/app/api/device-breakdown/route.ts` | Breakdown de dispositivos incompleto |

### 3.2 `src/app/api/experiments/route.ts`
- **Linhas:** 63-78
- **Problema:** Criação de organização default pode falhar silenciosamente
- **Impacto:** Usuários sem organização não conseguem criar experimentos

### 3.3 `src/app/api/experiments/[id]/public/route.ts`
- **Problema:** Endpoint público sem rate limiting implementado
- **Impacto:** Vulnerável a abuse/DDoS

### 3.4 `src/app/api/track/route.ts` e `src/app/api/track-event/route.ts`
- **Problema:** Validação mínima dos eventos recebidos
- **Impacto:** Dados inválidos podem ser salvos no banco

---

## 4. INTEGRAÇÕES QUEBRADAS

### 4.1 Kiwify
| Componente | Status | Problema |
|------------|--------|----------|
| Webhooks recebidos | OK | Funcionando |
| Processamento de compra | Parcial | Falta envio de email |
| Processamento de cancelamento | Parcial | Falta sincronizar cancelamento |
| Pagamento atrasado | Parcial | Falta envio de email |

### 4.2 Resend (Email)
- **Arquivo:** `src/lib/resend/client.ts`
- **Linhas:** 10-12, 106-111
- **Problema:** Se `RESEND_API_KEY` não estiver configurada, emails falham silenciosamente
- **Impacto:** Nenhum email é enviado em produção sem configuração

### 4.3 Stripe
- **Status:** NÃO IMPLEMENTADO
- **Observação:** Projeto usa Kiwify como gateway principal

### 4.4 Analytics de Terceiros
- **Status:** NÃO IMPLEMENTADO
- **Faltando:** Google Analytics, Mixpanel, Segment

---

## 5. FUNÇÕES QUE RETORNAM NULL/UNDEFINED

### 5.1 `src/lib/analytics.ts`
| Função | Linhas | Problema |
|--------|--------|----------|
| `getDashboardStats()` | 73-200 | Retorna zeros quando não há dados |
| `getExperimentMetrics()` | Várias | Retorna null em erro |
| Múltiplas funções | 13, 19, 234, 238, 360... | Returns silenciosos de null/[] |

### 5.2 `src/lib/rotafinal-sdk.ts`
- **Linhas:** 254, 432, 442, 472, 501, 633
- **Problema:** Métodos retornam null quando window/document undefined (SSR)
- **O que deveria ser:** Queue de eventos para sincronizar quando client-side

### 5.3 `src/components/monitoring/LogViewer.tsx`
- **Linha:** 129
- **Problema:** `default: return null` para tipos de log desconhecidos
- **O que deveria ser:** Renderizar log genérico ou handling adequado

---

## 6. VALIDAÇÕES FALTANDO

### 6.1 Criação de Experimentos
- **Arquivo:** `src/app/dashboard/page.tsx`
- **Faltando:**
  - Validação de formato de URL
  - Validação de sintaxe de seletores CSS/XPath
  - Validação de nomes de eventos

### 6.2 Tracking de Eventos
- **Arquivos:** `src/app/api/track/route.ts`, `src/app/api/track-event/route.ts`
- **Faltando:**
  - Schema validation completa
  - Sanitização de dados
  - Validação de tipos de evento

### 6.3 Inputs de Usuário
- **Faltando validação em:**
  - Nomes de organização
  - Slugs de projeto
  - Emails antes de chamadas API
  - URLs de domínios customizados

---

## 7. PROBLEMAS DE ALGORITMO MAB

### 7.1 `src/app/api/experiments/[id]/assign/route.ts`
- **Linhas:** 190-204
- **Problema:** MAB chamado com variantes individuais em vez de conjunto completo
```typescript
// ERRADO (atual):
selectVariantMAB([variantStats], algorithmType)  // Array com 1 elemento

// CORRETO:
selectVariantMAB(allVariantStats, algorithmType)  // Array com todas variantes
```
- **Impacto:** Thompson Sampling e UCB1 não funcionam corretamente

---

## 8. PROBLEMAS DE ERROR HANDLING

### 8.1 `src/app/chunk-error-handler.ts`
- **Linhas:** 98-106
- **Problema:** Retorna mock response em vez de erro real
```typescript
statusText: 'Not Found (mock)'  // ← Retorna dado falso
```

### 8.2 RLS (Row-Level Security)
- **Problema Global:** Erros de RLS retornam objetos vazios `{}`
- **Impacto:** Impossível distinguir entre "sem dados" e "acesso negado"

---

## 9. FUNÇÕES RPC POSSIVELMENTE INEXISTENTES

Chamadas no código que podem não existir no banco:

| Função RPC | Arquivo | Linha |
|------------|---------|-------|
| `get_organization_limits` | subscription/limits/route.ts | 39 |
| `get_organization_features` | subscription/limits/route.ts | 44 |
| `can_create_experiment` | subscription/limits/route.ts | 58 |
| `can_create_project` | subscription/limits/route.ts | 63 |
| `get_daily_conversions` | experiments/[id]/stats/route.ts | 151 |

---

## 10. ARQUIVOS DUPLICADOS/PROBLEMÁTICOS

| Arquivo | Problema |
|---------|----------|
| `src/app/dashboard/page 2.tsx` | Arquivo duplicado com espaço no nome |
| `src/components/dashboard/premium-experiments-tab.tsx.bak2` | Backup não removido |

---

## 11. VARIÁVEIS DE AMBIENTE POTENCIALMENTE FALTANDO

```env
# Necessárias para funcionamento completo:
RESEND_API_KEY=          # Email não funciona sem isso
KIWIFY_WEBHOOK_SECRET=   # Webhooks não validam sem isso
KIWIFY_API_KEY=          # Cancelamento não sincroniza sem isso
```

---

## 12. PRIORIDADES DE CORREÇÃO

### URGENTE (Bloqueadores)
1. Implementar criação real de experimentos (`src/app/dashboard/page.tsx:1797`)
2. Remover dados mockados do `useExperiments.ts`
3. Configurar `RESEND_API_KEY` e implementar envio de emails nos webhooks

### ALTO (Funcionalidade Core)
4. Implementar cancelamento na Kiwify (`subscription/cancel/route.ts:94`)
5. Corrigir algoritmo MAB (`experiments/[id]/assign/route.ts:196`)
6. Remover mock data do debug schema

### MÉDIO (Qualidade)
7. Adicionar validações em formulários
8. Implementar error handling adequado para RLS
9. Remover arquivos duplicados/backups

### BAIXO (Melhorias)
10. Implementar analytics de terceiros
11. Adicionar rate limiting em endpoints públicos
12. Melhorar logging e monitoring

---

## 13. CONCLUSÃO

O sistema possui uma **estrutura sólida** mas com **implementações críticas faltando**:

- **60%** da funcionalidade está com código mock/placeholder
- **Experimentos não são criados de verdade**
- **Emails não são enviados**
- **Integração com Kiwify está incompleta**

### Recomendação
Antes de ir para produção, é **OBRIGATÓRIO** corrigir os itens marcados como URGENTE e ALTO na seção 12.

---

*Relatório gerado automaticamente por verificação do sistema*
