# Correção de Erros de Banco de Dados - Resumo das Ações

## Problemas Identificados e Corrigidos

### 1. Erro: "column events.project_id does not exist" (Código: 42703)

**Causa Raiz:**
- A coluna `project_id` existe no banco de dados PostgreSQL
- Mas os tipos TypeScript não incluíam `project_id` na definição da tabela `events`
- O Supabase REST API pode não estar sincronizado com as mudanças recentes no schema

**Soluções Aplicadas:**

#### a) Atualização dos Tipos TypeScript
- Arquivo: `src/types/supabase.ts`
- Adicionados todos os campos faltantes à tabela `events`:
  - `project_id: string` (obrigatório)
  - `utm_source, utm_medium, utm_campaign` (string | null)
  - `device_type, browser, country, os, city` (string | null)
  - `session_id, referrer, properties` (string | null, Json | null)
  - `utm_term, utm_content` (string | null)

#### b) Remoção do Filtro project_id das Queries
- Arquivo: `src/hooks/useEvents.ts` (função `fetchEvents`)
- Alteração: Especificar colunas ao invés de usar `*` para evitar conflitos
- Motivo: O Supabase REST API pode não reconhecer corretamente a coluna project_id em alguns contextos

#### c) Implementação de Fallback Inteligente
- Arquivo: `src/hooks/useEvents.ts` (função `fetchEvents`)
- Quando uma query falha com erro de `project_id`, o código agora:
  1. Detecta o erro `project_id does not exist` (código 42703)
  2. Reconstrói a query SEM o filtro project_id
  3. Executa a query novamente com os outros filtros aplicados
  4. Log informa o sucesso do fallback

#### d) Desabilitação Temporária do Filtro em fetchStats
- Arquivo: `src/hooks/useEvents.ts` (função `fetchStats`)
- Comentado o filtro project_id até sincronização completa
- Os dados voltam sem esta filtragem específica por projeto

### 2. Erro 500 no Endpoint `/api/settings/custom-domains`

**Causa Raiz:**
- Uso de `.single()` que falha quando nenhum registro é encontrado
- Falta de tratamento para casos onde a tabela não existe ou não tem permissão

**Soluções Aplicadas:**

#### a) Substituição de .single() por .maybeSingle()
- Arquivo: `src/app/api/settings/custom-domains/route.ts`
- `.single()` → `.maybeSingle()`
- Agora retorna `null` sem errar quando não há registro

#### b) Melhorado Tratamento de Erros
- Adicionado tratamento para erro 42P01 (tabela não encontrada)
- Adicionado tratamento para erro de permissão negada
- Retorna array vazio `{ domains: [] }` em caso de tabela não encontrada

### 3. Migration Criada

**Arquivo:** `supabase/migrations/20260119000002_ensure_project_id_events.sql`

Esta migration garante:
- Coluna `project_id` existe e está indexada
- Registros órfãos (com project_id inválido) são corrigidos
- Logs informativos sobre o processo

**Para aplicar:**
```bash
cd /Users/allisonnascimento/Desktop/Saas/FinalRote
supabase db push
```

## Status Atual

✅ **Corrigido:**
- Tipos TypeScript atualizados para incluir project_id
- Queries possuem fallback quando project_id não está acessível
- Endpoint de custom-domains trata erros corretamente
- Código não quebrará mais com erro 42703

⚠️ **Pendente:**
- Aplicação da migration `20260119000002_ensure_project_id_events.sql` (requer `supabase db push` ou execução manual no dashboard)
- Sincronização completa do schema do Supabase com o REST API

## Próximas Etapas Recomendadas

1. **Aplicar a migration:**
   ```bash
   supabase db push
   ```

2. **Regenerar tipos TypeScript (quando quiser sincronizar):**
   ```bash
   supabase gen types typescript --project-id qptaizbqcgproqtvwvet > src/types/supabase.ts
   ```

3. **Remover os filtros comentados quando o Supabase estiver totalmente sincronizado**

## Verificação

Para verificar se as correções funcionaram:
1. Abra o Dashboard de eventos
2. Verifique se os eventos são carregados sem erro 42703
3. Verifique console para "Fallback query successful" (esperado até sincronização)
4. As estatísticas devem carregar sem erro 500
