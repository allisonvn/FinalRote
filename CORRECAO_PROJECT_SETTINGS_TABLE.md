# 🔧 Correção: Tabela project_settings não encontrada

## Problema Detectado

Você está recebendo o erro:
```
"Could not find the table 'public.project_settings' in the schema cache"
```

Isso significa que a migração que cria a tabela `project_settings` não foi aplicada ao seu banco de dados Supabase.

## ✅ Solução

### Opção 1: Aplicar via Script Node (Recomendado)

```bash
cd /Users/allisonnascimento/Desktop/site/rotafinal
node apply-project-settings-migration.js
```

Este script tentará aplicar a migração automaticamente via Supabase REST API.

### Opção 2: Aplicar Manualmente via Console Supabase

1. **Acesse o SQL Editor**
   - Vá para: https://app.supabase.com/project/_/sql/new
   - Substitua `_` pelo seu project ID (você pode achar em qualquer URL do console)

2. **Cole o conteúdo das migrações**
   
   Abra os arquivos nesta ordem e execute cada um:

   **Arquivo 1:** `supabase/migrations/20251119_ensure_project_settings.sql`
   
   ```sql
   -- Cole todo o conteúdo do arquivo aqui
   CREATE TABLE IF NOT EXISTS public.project_settings (
       project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
       allowed_domains_custom TEXT[] DEFAULT ARRAY[]::TEXT[],
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   -- ... resto do conteúdo
   ```

   **Arquivo 2:** `supabase/migrations/20251119_create_rpc_helpers.sql`
   
   ```sql
   -- Cole todo o conteúdo do arquivo aqui
   CREATE OR REPLACE FUNCTION public.create_project_settings_table_if_not_exists()
   -- ... resto do conteúdo
   ```

3. **Execute cada um clicando em "Run"** (ícone de play)

### Opção 3: Via Supabase CLI (Se você tem CLI instalada)

```bash
# Dentro do diretório do projeto
cd /Users/allisonnascimento/Desktop/site/rotafinal

# Fazer login (se não estiver)
supabase login

# Ligar ao projeto
supabase link --project-ref <seu-project-ref>

# Aplicar migrações
supabase db push
```

## 🔍 Verificar se Funcionou

Depois de aplicar a migração, você pode verificar se tudo está funcionando:

```bash
# Abra a página de eventos no navegador
# Você deve ver que não há mais o erro "Could not find the table 'public.project_settings'"
```

Ou execute este comando SQL no console Supabase:

```sql
-- Verificar se a tabela existe
SELECT EXISTS(
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'project_settings'
) AS table_exists;

-- Verificar as policies
SELECT * FROM pg_policies
WHERE tablename = 'project_settings';

-- Contar registros
SELECT COUNT(*) FROM public.project_settings;
```

## 📋 O que a Migração Faz

1. ✅ **Cria a tabela `project_settings`** com os campos corretos
2. ✅ **Habilita Row Level Security (RLS)**
3. ✅ **Cria policies para service_role** (necessário para o servidor acessar)
4. ✅ **Cria trigger para atualizar `updated_at`** automaticamente
5. ✅ **Cria índices para performance**

## 🚀 Próximos Passos

Depois que a migração for aplicada:

1. ✅ O erro de `project_settings` desaparecerá
2. ✅ A página de eventos funcionará corretamente
3. ✅ Você poderá gerenciar domínios personalizados

## ⚠️ Problemas?

### Erro: "RPC execute_sql não disponível"

Se receber este erro ao rodar o script Node, não se preocupe! É normal. Neste caso:
- Aplique manualmente via opção 2 (Console Supabase)
- Ou use o Supabase CLI (opção 3)

### Erro: "Relation does not exist"

Se ao executar SQL no console receber um erro sobre relação não existir:
- É porque ainda não foi executada a migração corretamente
- Verifique se você está logado corretamente no Supabase
- Tente novamente a partir do zero

### Erro: "Access denied"

Se receber erro de acesso:
- Verifique se está usando a `SUPABASE_SERVICE_ROLE_KEY` correta (não é a chave pública)
- A chave de serviço deve estar com permissões de admin

## 📞 Suporte

Se os problemas persistirem:
1. Verifique se as variáveis de ambiente estão configuradas corretamente
2. Verifique se você tem acesso ao banco de dados Supabase
3. Tente recarregar a página no navegador após aplicar a migração

---

**Última atualização:** 19 de Novembro de 2025

