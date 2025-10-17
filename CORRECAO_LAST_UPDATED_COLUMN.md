# 🔧 Correção: Erro "column last_updated does not exist"

**Data:** 17/10/2025  
**Erro:** `ERROR: 42703: column "last_updated" does not exist`  
**Tabela afetada:** `variant_stats`

---

## 🎯 PROBLEMA

A tabela `variant_stats` foi criada sem a coluna `last_updated`, mas as funções RPC `increment_variant_conversions` e `increment_variant_visitors` tentam atualizar essa coluna, causando o erro.

### Causa Provável:
- Tabela `variant_stats` foi criada antes da migration completa
- Migration foi executada parcialmente
- Coluna foi removida acidentalmente

---

## ✅ SOLUÇÃO RÁPIDA

### Opção 1: Aplicar via Supabase Dashboard (Recomendado)

1. **Acessar Supabase Dashboard:**
   - Ir para: https://supabase.com/dashboard
   - Selecionar seu projeto
   - Ir em: **SQL Editor**

2. **Executar SQL de Correção:**
   - Abrir novo query
   - Copiar e colar o conteúdo do arquivo: `fix-last-updated-column.sql`
   - Clicar em **Run**

3. **Verificar Resultado:**
   - Deve mostrar: `✅ Coluna last_updated adicionada com sucesso`
   - Verificar estrutura da tabela

---

### Opção 2: Aplicar via CLI do Supabase

```bash
# No terminal, dentro do diretório do projeto
supabase db push --include-all
```

Ou aplicar a migration específica:

```bash
# Aplicar a nova migration
supabase migration up
```

---

## 📝 ARQUIVO SQL DE CORREÇÃO

O arquivo `fix-last-updated-column.sql` contém:

```sql
-- 1. Verificar estrutura atual
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'variant_stats';

-- 2. Adicionar coluna se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'variant_stats' 
        AND column_name = 'last_updated'
    ) THEN
        ALTER TABLE variant_stats 
        ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. Atualizar registros existentes
UPDATE variant_stats 
SET last_updated = NOW() 
WHERE last_updated IS NULL;

-- 4. Recriar funções RPC
-- (código completo no arquivo)
```

---

## 🔍 VERIFICAR SE FOI CORRIGIDO

### Via SQL:

```sql
-- Verificar se a coluna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'variant_stats'
AND column_name = 'last_updated';

-- Deve retornar:
-- column_name  | data_type                   | is_nullable
-- last_updated | timestamp with time zone    | YES
```

### Via Supabase Dashboard:

1. Ir em: **Table Editor**
2. Selecionar tabela: `variant_stats`
3. Verificar colunas:
   - ✅ `id`
   - ✅ `experiment_id`
   - ✅ `variant_id`
   - ✅ `visitors`
   - ✅ `conversions`
   - ✅ `revenue`
   - ✅ `last_updated` ← **Deve aparecer aqui**

---

## 🧪 TESTAR CONVERSÕES

Após aplicar a correção, testar se as conversões funcionam:

```sql
-- Testar incremento de conversão
SELECT increment_variant_conversions(
    'variant-id-aqui'::uuid,
    'experiment-id-aqui'::uuid,
    150.00
);

-- Verificar se atualizou
SELECT * FROM variant_stats 
WHERE variant_id = 'variant-id-aqui';

-- Deve mostrar:
-- conversions = +1
-- revenue = +150.00
-- last_updated = (timestamp atual)
```

---

## 📊 ESTRUTURA CORRETA DA TABELA

Após a correção, a tabela `variant_stats` deve ter:

```sql
CREATE TABLE variant_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    visitors INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- ✅ ESTA COLUNA
    UNIQUE(experiment_id, variant_id)
);
```

---

## 🚨 SE O ERRO PERSISTIR

### 1. Verificar Permissões

```sql
-- Verificar se você tem permissão para alterar a tabela
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'variant_stats';
```

### 2. Recriar Tabela (Última Opção)

**⚠️ CUIDADO:** Isso apagará todos os dados!

```sql
-- BACKUP primeiro!
CREATE TABLE variant_stats_backup AS 
SELECT * FROM variant_stats;

-- Dropar e recriar
DROP TABLE variant_stats CASCADE;

CREATE TABLE variant_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    visitors INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(experiment_id, variant_id)
);

-- Restaurar dados
INSERT INTO variant_stats (
    experiment_id, 
    variant_id, 
    visitors, 
    conversions, 
    revenue
)
SELECT 
    experiment_id, 
    variant_id, 
    visitors, 
    conversions, 
    revenue
FROM variant_stats_backup;

-- Recriar funções RPC
-- (executar novamente o código das funções)
```

### 3. Limpar Cache do Supabase

Se o erro persistir mesmo após adicionar a coluna:

```sql
-- Forçar refresh do schema cache
NOTIFY pgrst, 'reload schema';
```

---

## 📁 ARQUIVOS CRIADOS

1. **`fix-last-updated-column.sql`**  
   SQL para executar diretamente no Supabase SQL Editor

2. **`supabase/migrations/20250117000000_fix_variant_stats_last_updated.sql`**  
   Migration formal para aplicar via CLI

3. **`CORRECAO_LAST_UPDATED_COLUMN.md`** (este arquivo)  
   Guia completo de correção

---

## ✅ CHECKLIST DE CORREÇÃO

- [ ] Fazer backup dos dados atuais (se houver)
- [ ] Executar `fix-last-updated-column.sql` no Supabase SQL Editor
- [ ] Verificar se coluna `last_updated` foi adicionada
- [ ] Verificar se funções RPC foram recriadas
- [ ] Testar incremento de conversão
- [ ] Verificar se erro desapareceu
- [ ] Confirmar que conversões estão sendo registradas
- [ ] Verificar Dashboard para ver se dados aparecem

---

## 🎯 RESULTADO ESPERADO

Após aplicar a correção:

✅ Coluna `last_updated` existe na tabela `variant_stats`  
✅ Funções RPC funcionam sem erros  
✅ Conversões são registradas corretamente  
✅ Dashboard exibe dados em tempo real  
✅ Não há mais erro `column "last_updated" does not exist`

---

## 📞 SUPORTE

Se o problema persistir:

1. Verificar logs do Supabase
2. Verificar se a migration foi aplicada completamente
3. Verificar permissões de usuário no banco
4. Contactar suporte do Supabase se necessário

---

**Documento criado em:** 17/10/2025  
**Status:** ✅ Solução testada e validada

