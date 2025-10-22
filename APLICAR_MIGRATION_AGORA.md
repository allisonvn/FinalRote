# 🚨 APLICAR MIGRATION DE CONVERSÕES - PASSO A PASSO

## ⚡ AÇÃO IMEDIATA

Se as queries de verificação mostraram que os campos **NÃO EXISTEM**, siga este guia:

---

## 📝 PASSO 1: Copiar Migration

Abra o arquivo: `supabase/migrations/20251018000000_add_conversion_fields.sql`

Ou copie diretamente daqui:

```sql
-- =====================================================
-- ADICIONAR CAMPOS FALTANTES NA TABELA EXPERIMENTS
-- =====================================================

-- Adicionar target_url (URL onde o experimento será executado)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='target_url') THEN
        ALTER TABLE experiments ADD COLUMN target_url TEXT;
        RAISE NOTICE '✅ Campo target_url adicionado';
    ELSE
        RAISE NOTICE '⚠️ Campo target_url já existe';
    END IF;
END $$;

-- Adicionar conversion_url (URL da página de conversão/sucesso)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='conversion_url') THEN
        ALTER TABLE experiments ADD COLUMN conversion_url TEXT;
        RAISE NOTICE '✅ Campo conversion_url adicionado';
    ELSE
        RAISE NOTICE '⚠️ Campo conversion_url já existe';
    END IF;
END $$;

-- Adicionar conversion_type (tipo de conversão: page_view, click, form_submit)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='conversion_type') THEN
        ALTER TABLE experiments ADD COLUMN conversion_type TEXT DEFAULT 'page_view';
        RAISE NOTICE '✅ Campo conversion_type adicionado';
    ELSE
        RAISE NOTICE '⚠️ Campo conversion_type já existe';
    END IF;
END $$;

-- Adicionar conversion_value (valor monetário da conversão)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='conversion_value') THEN
        ALTER TABLE experiments ADD COLUMN conversion_value NUMERIC(10,2) DEFAULT 0.00;
        RAISE NOTICE '✅ Campo conversion_value adicionado';
    ELSE
        RAISE NOTICE '⚠️ Campo conversion_value já existe';
    END IF;
END $$;

-- Adicionar duration_days (duração planejada do experimento)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='duration_days') THEN
        ALTER TABLE experiments ADD COLUMN duration_days INTEGER DEFAULT 14;
        RAISE NOTICE '✅ Campo duration_days adicionado';
    ELSE
        RAISE NOTICE '⚠️ Campo duration_days já existe';
    END IF;
END $$;

-- =====================================================
-- INDICES PARA PERFORMANCE
-- =====================================================

-- Índice para busca por conversion_url (usado no rastreamento)
CREATE INDEX IF NOT EXISTS idx_experiments_conversion_url
ON experiments(conversion_url)
WHERE conversion_url IS NOT NULL;

-- Índice para busca por target_url
CREATE INDEX IF NOT EXISTS idx_experiments_target_url
ON experiments(target_url)
WHERE target_url IS NOT NULL;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todos os campos foram adicionados
DO $$
DECLARE
    campo_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO campo_count
    FROM information_schema.columns
    WHERE table_name='experiments'
      AND column_name IN ('target_url', 'conversion_url', 'conversion_type', 'conversion_value', 'duration_days');

    IF campo_count = 5 THEN
        RAISE NOTICE '✅ SUCESSO: Todos os 5 campos de conversão foram adicionados!';
    ELSE
        RAISE NOTICE '❌ ERRO: Apenas % de 5 campos foram adicionados', campo_count;
    END IF;
END $$;
```

---

## 🎯 PASSO 2: Abrir SQL Editor no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto do RotaFinal
3. No menu lateral esquerdo, clique em **"SQL Editor"**
4. Clique em **"New query"** (botão no canto superior direito)

---

## 📋 PASSO 3: Colar e Executar

1. **Cole** todo o código SQL acima no editor
2. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
3. Aguarde a execução (pode levar 5-10 segundos)

---

## ✅ PASSO 4: Verificar Resultado

Você deve ver mensagens como:

```
NOTICE:  ✅ Campo target_url adicionado
NOTICE:  ✅ Campo conversion_url adicionado
NOTICE:  ✅ Campo conversion_type adicionado
NOTICE:  ✅ Campo conversion_value adicionado
NOTICE:  ✅ Campo duration_days adicionado
NOTICE:  ✅ SUCESSO: Todos os 5 campos de conversão foram adicionados!
```

Se já foram aplicados antes:

```
NOTICE:  ⚠️ Campo target_url já existe
NOTICE:  ⚠️ Campo conversion_url já existe
...
NOTICE:  ✅ SUCESSO: Todos os 5 campos de conversão foram adicionados!
```

---

## 🔍 PASSO 5: Confirmar Instalação

Execute esta query para confirmar:

```sql
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'experiments'
  AND column_name IN ('conversion_url', 'conversion_type', 'conversion_value', 'target_url', 'duration_days')
ORDER BY column_name;
```

**Resultado esperado:**

| column_name       | data_type |
|-------------------|-----------|
| conversion_type   | text      |
| conversion_url    | text      |
| conversion_value  | numeric   |
| duration_days     | integer   |
| target_url        | text      |

✅ **5 linhas retornadas = MIGRATION APLICADA COM SUCESSO!**

---

## 🧪 PASSO 6: Testar

1. Vá para o dashboard do RotaFinal
2. Crie um **NOVO** experimento
3. Na **Etapa 3 - Meta**, configure:
   - Tipo: "Acesso a uma página"
   - URL: `/obrigado` ou `https://seusite.com/obrigado`
   - Valor: `100`
4. Salve o experimento
5. Execute esta query para confirmar que foi salvo:

```sql
SELECT
  name,
  conversion_url,
  conversion_type,
  conversion_value
FROM experiments
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**

| name          | conversion_url              | conversion_type | conversion_value |
|---------------|-----------------------------|-----------------|------------------|
| Seu Teste     | /obrigado                   | page_view       | 100.00           |

✅ **conversion_url preenchido = FUNCIONANDO!**

---

## 🚨 PROBLEMAS COMUNS

### Erro: "permission denied for table experiments"

**Causa:** Usuário sem permissão para alterar tabela

**Solução:**
1. Verifique se está logado como **Owner** do projeto no Supabase
2. Ou execute como **Service Role** (aba "Service role" no SQL Editor)

### Erro: "relation experiments does not exist"

**Causa:** Tabela experiments não existe

**Solução:**
1. Verifique se está no projeto correto
2. Execute: `SELECT * FROM experiments LIMIT 1;` para confirmar que a tabela existe

### Migration executou mas campos não aparecem

**Causa:** Cache do Supabase

**Solução:**
1. Feche e reabra o SQL Editor
2. Ou execute: `SELECT pg_reload_conf();` para recarregar configuração

---

## 📞 PRÓXIMOS PASSOS

Após aplicar a migration com sucesso:

1. ✅ Criar novo experimento com conversão configurada
2. ✅ Copiar código de integração
3. ✅ Testar em página real
4. ✅ Verificar eventos de conversão no banco

---

**Data:** 2025-10-22
**Migration:** `20251018000000_add_conversion_fields.sql`
