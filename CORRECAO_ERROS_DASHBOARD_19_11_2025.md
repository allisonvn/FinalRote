# 🔧 Guia de Correção de Erros do Dashboard

**Data:** 19 de Novembro de 2025

## 📋 Resumo dos Erros Detectados

Seu dashboard está apresentando 2 erros principais:

### Erro 1: Tabela `project_settings` não encontrada
```
Status: 500
Erro: "Could not find the table 'public.project_settings' in the schema cache"
Endpoint: GET /api/settings/custom-domains
```

### Erro 2: RPC `get_experiment_stats` retornando 400
```
Status: 400 (Bad Request)
Função: POST /rest/v1/rpc/get_experiment_stats
```

---

## ✅ Solução Unificada

### Passo 1: Aplicar as Migrações SQL

**3 migrações foram criadas para corrigir ambos os problemas:**

1. `supabase/migrations/20251119_ensure_project_settings.sql`
   - Cria a tabela `project_settings` se não existir
   - Configura RLS e políticas de segurança

2. `supabase/migrations/20251119_create_rpc_helpers.sql`
   - Cria funções auxiliares RPC
   - Permite criar tabela dinamicamente se necessário

3. `supabase/migrations/20251119_fix_rpc_get_experiment_stats.sql`
   - Melhora a função `get_experiment_stats`
   - Torna compatível com ambos os nomes de parâmetro

### Passo 2: Aplicar as Migrações

#### Opção A: Via Script Node (Recomendado)

```bash
cd /Users/allisonnascimento/Desktop/site/rotafinal
node apply-project-settings-migration.js
```

#### Opção B: Via Console Supabase (Manual)

1. Acesse: https://app.supabase.com/project/_/sql/new
2. Para cada arquivo de migração abaixo, copie TODO O CONTEÚDO e execute:

**Migração 1:** Copie tudo do arquivo:
```
supabase/migrations/20251119_ensure_project_settings.sql
```

**Migração 2:** Copie tudo do arquivo:
```
supabase/migrations/20251119_create_rpc_helpers.sql
```

**Migração 3:** Copie tudo do arquivo:
```
supabase/migrations/20251119_fix_rpc_get_experiment_stats.sql
```

3. Clique em "Run" para cada um

#### Opção C: Via Supabase CLI

```bash
cd /Users/allisonnascimento/Desktop/site/rotafinal

# Se ainda não está linkado
supabase link --project-ref seu-project-id

# Aplicar migrações
supabase db push
```

---

## 🔍 Verificar se Funcionou

### No Console Supabase

Execute este comando SQL:

```sql
-- 1. Verificar se a tabela project_settings existe
SELECT EXISTS(
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'project_settings'
) AS project_settings_exists;

-- 2. Verificar se as funções RPC existem
SELECT 
    proname,
    pronargs as num_params
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND proname IN (
      'get_experiment_stats',
      'create_project_settings_table_if_not_exists',
      'ensure_project_settings',
      'get_experiment_stats_simple'
  )
ORDER BY proname;

-- 3. Verificar dados da tabela
SELECT COUNT(*) as project_settings_records FROM public.project_settings;

-- 4. Verificar RLS policies
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'project_settings';
```

### No Dashboard da Aplicação

1. ✅ Recarregue a página de eventos
2. ✅ Verifique se não há mais erros 500 ou 400 no console
3. ✅ Verifique se os dados aparecem corretamente

---

## 📊 O que Cada Migração Faz

### Migração 1: `20251119_ensure_project_settings.sql`

**Objetivo:** Criar a tabela `project_settings`

**Ações:**
- ✅ Cria `project_settings` com campos: `project_id`, `allowed_domains_custom`, `created_at`, `updated_at`
- ✅ Habilita Row Level Security (RLS)
- ✅ Cria policies para `service_role` (necessário para o servidor acessar)
- ✅ Cria trigger para atualizar `updated_at` automaticamente
- ✅ Cria índices para performance
- ✅ Força refresh do schema cache do Supabase

### Migração 2: `20251119_create_rpc_helpers.sql`

**Objetivo:** Criar funções RPC auxiliares

**Funções criadas:**
- `create_project_settings_table_if_not_exists()` - Cria tabela se não existir
- `ensure_project_settings(project_id UUID)` - Garante que projeto tem entrada

**Benefício:** Recuperação automática se a tabela estiver faltando

### Migração 3: `20251119_fix_rpc_get_experiment_stats.sql`

**Objetivo:** Melhorar função RPC de estatísticas

**Melhorias:**
- ✅ Aceita ambos: `p_experiment_id` e `experiment_uuid`
- ✅ Melhor tratamento de tipos de dados
- ✅ Cria `get_experiment_stats_simple()` para queries mais rápidas
- ✅ Melhor segurança com SECURITY DEFINER

---

## 🚀 Próximos Passos Após Aplicar

1. **Recarregue a aplicação**
   - Refresh na página (Ctrl+F5 ou Cmd+Shift+R)
   - Abra o DevTools (F12) para verificar o console

2. **Verifique os logs**
   - Procure por mensagens `✅` de sucesso
   - Se houver `❌` erros, analise a mensagem

3. **Teste as funcionalidades**
   - Página de Eventos - Debe carregar sem erro 500
   - Página de Análise - Não deve ter erro 400 no RPC
   - Gráficos de tendências - Deve exibir dados

---

## ⚠️ Resolução de Problemas

### Problema: "RPC execute_sql não disponível"

**Solução:** É normal. Use a Opção B (Console Supabase) ou Opção C (CLI)

### Problema: "Relation does not exist"

**Causa:** Migração não foi executada completamente

**Solução:**
1. Verifique se você está com permissões de admin no Supabase
2. Tente novamente a migração
3. Verifique logs no console Supabase

### Problema: "Access denied" ou "permission denied"

**Causa:** Permissões incorretas

**Verificação:**
```sql
-- Verificar se service_role pode acessar
SELECT * FROM information_schema.role_table_grants
WHERE table_name = 'project_settings';
```

**Solução:** Manualmente execute em seu console:
```sql
GRANT ALL ON public.project_settings TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
```

### Problema: Schema cache ainda não atualizado

**Solução:** Aguarde 2-5 minutos e recarregue a aplicação

Se persistir:
1. Deslogue e faça login novamente
2. Feche e reabra a aba do navegador
3. Execute no console SQL:
   ```sql
   SELECT pg_catalog.pg_sleep(2);
   ```

---

## 📞 Suporte & Debug

### Verificar status completo:

```bash
# Via script de diagnóstico
curl -X POST "https://rotafinal.com.br/api/health" \
  -H "Content-Type: application/json" \
  -d '{"check": "database"}'
```

### Ver logs da aplicação:

No console do navegador (F12):
- Abra a aba "Console"
- Procure por `📊` ou `🔍` para mensagens de debug
- Procure por `❌` ou `⚠️` para erros

---

## 📌 Checklist de Conclusão

- [ ] Baixou os arquivos de migração
- [ ] Executou as 3 migrações (em ordem)
- [ ] Verificou que todas as migrações rodaram sem erro
- [ ] Recarregou a aplicação no navegador
- [ ] Testou a página de eventos
- [ ] Testou a página de análise
- [ ] Não há mais erros 500 ou 400

---

## 🎯 Resumo Rápido

```bash
# Para usuários com conhecimento técnico:

# 1. Aplicar via script
node apply-project-settings-migration.js

# 2. Aguardar 2-5 minutos
# (Supabase precisa refreshar o schema cache)

# 3. Recarregar página
# Ctrl+F5 (Windows/Linux) ou Cmd+Shift+R (Mac)

# 4. Tudo pronto! ✅
```

---

**Última atualização:** 19 de Novembro de 2025  
**Versão:** 1.0  
**Status:** Pronto para Produção ✅

