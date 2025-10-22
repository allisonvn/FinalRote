# 🎯 SOLUÇÃO: Conversões Não Funcionam

## ⚡ DIAGNÓSTICO RÁPIDO (Escolha 1 método)

### 🚀 **MÉTODO 1: Teste via Navegador** (Mais Rápido)

1. Abra o dashboard do RotaFinal
2. Pressione **F12** para abrir DevTools
3. Vá na aba **Console**
4. Cole e execute este código:

```javascript
fetch('/api/experiments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'TESTE ' + Date.now(),
    type: 'split_url',
    conversion_url: 'https://exemplo.com/obrigado',
    traffic_allocation: 100
  })
})
.then(r => r.json())
.then(d => {
  if (d.experiment?.conversion_url) {
    console.log('✅ FUNCIONA: conversion_url =', d.experiment.conversion_url);
  } else {
    console.log('❌ NÃO FUNCIONA: conversion_url está NULL');
    console.log('🚨 APLICAR MIGRATION: APLICAR_MIGRATION_AGORA.md');
  }
});
```

**Se mostrar `✅ FUNCIONA`:** Sistema OK! Vá para [Teste Real](#teste-real)

**Se mostrar `❌ NÃO FUNCIONA`:** Continue abaixo ⬇️

---

### 🗄️ **MÉTODO 2: Teste via SQL** (Direto no Banco)

Acesse: https://supabase.com/dashboard → Seu Projeto → SQL Editor

Execute esta query:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'experiments'
  AND column_name = 'conversion_url';
```

**Se retornar 1 linha:** Migration aplicada! Sistema OK!

**Se retornar 0 linhas:** Migration NÃO foi aplicada. Continue ⬇️

---

## 🔧 APLICAR MIGRATION (Se testes falharam)

### Passo 1: Copiar Migration

```sql
-- Cole este código COMPLETO no SQL Editor do Supabase

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='target_url') THEN
        ALTER TABLE experiments ADD COLUMN target_url TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='conversion_url') THEN
        ALTER TABLE experiments ADD COLUMN conversion_url TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='conversion_type') THEN
        ALTER TABLE experiments ADD COLUMN conversion_type TEXT DEFAULT 'page_view';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='conversion_value') THEN
        ALTER TABLE experiments ADD COLUMN conversion_value NUMERIC(10,2) DEFAULT 0.00;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='duration_days') THEN
        ALTER TABLE experiments ADD COLUMN duration_days INTEGER DEFAULT 14;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_experiments_conversion_url
ON experiments(conversion_url)
WHERE conversion_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_experiments_target_url
ON experiments(target_url)
WHERE target_url IS NOT NULL;
```

### Passo 2: Executar

1. Vá em: https://supabase.com/dashboard
2. Selecione seu projeto
3. Menu → **SQL Editor**
4. **New query**
5. Cole o código acima
6. Clique **Run**

### Passo 3: Verificar

Execute esta query:

```sql
SELECT COUNT(*) as total
FROM information_schema.columns
WHERE table_name = 'experiments'
  AND column_name IN ('conversion_url', 'conversion_type', 'conversion_value', 'target_url', 'duration_days');
```

**Resultado esperado:** `total = 5`

✅ **Se retornou 5:** Migration aplicada com sucesso!

❌ **Se retornou < 5:** Algo deu errado. Ver [Troubleshooting](#troubleshooting)

---

## 🧪 TESTE REAL

Após aplicar a migration:

### 1. Criar Novo Experimento

No dashboard:
- Nome: **"Teste de Conversão"**
- Tipo: **Split URL**
- Etapa 3:
  - Tipo: **"Acesso a uma página"**
  - URL: **`/obrigado`**
  - Valor: **`100`**

### 2. Verificar no Banco

```sql
SELECT
  name,
  conversion_url,
  conversion_value
FROM experiments
WHERE name = 'Teste de Conversão';
```

**Resultado esperado:**

| name                | conversion_url | conversion_value |
|---------------------|----------------|------------------|
| Teste de Conversão  | /obrigado      | 100.00           |

### 3. Copiar Código e Testar

1. Copie o código de integração do experimento
2. Cole em uma página HTML de teste
3. Navegue para `/obrigado`
4. Veja no console: `🎯 Conversion page detected!`

---

## 🔍 TROUBLESHOOTING

### Problema: Migration falha com erro de permissão

**Solução:**
- Verifique se está logado como **Owner** do projeto
- Ou execute como **Service Role** (aba no SQL Editor)

### Problema: Campos criados mas conversion_url ainda NULL

**Causa:** Experimentos criados ANTES da migration não têm conversão

**Solução:**
1. Crie um **NOVO** experimento (após aplicar migration)
2. Configure conversão na Etapa 3
3. Experimentos antigos não serão atualizados automaticamente

### Problema: SDK não detecta conversão

**Checklist:**
- [ ] Migration aplicada (verificar com query SQL)
- [ ] Experimento NOVO criado (após migration)
- [ ] conversion_url preenchido no banco
- [ ] Código de integração REGENERADO (copiar novamente)
- [ ] Cache do navegador limpo (Ctrl+Shift+R)
- [ ] URL atual corresponde à conversion_url configurada

### Problema: Eventos de conversão não aparecem

Execute:

```sql
SELECT * FROM events
WHERE event_type = 'conversion'
ORDER BY created_at DESC
LIMIT 5;
```

Se retornar 0 linhas:
- Verifique Network tab (F12) se chamada `/api/track` foi feita
- Ative debug: `localStorage.setItem('rf_debug', '1')`
- Recarregue página e veja console

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para mais detalhes, consulte:

| Arquivo | Descrição |
|---------|-----------|
| `VERIFICAR_CONVERSOES_SIMPLES.sql` | Queries SQL individuais |
| `APLICAR_MIGRATION_AGORA.md` | Guia visual passo a passo |
| `TESTE_RAPIDO_CONVERSOES.md` | Diagnóstico via JavaScript |
| `GUIA_ATIVAR_CONVERSOES.md` | Documentação completa |
| `DIAGNOSTICO_COMPLETO_CONVERSOES.md` | Análise técnica detalhada |

---

## ✅ CHECKLIST FINAL

Antes de considerar resolvido:

- [ ] Migration aplicada no Supabase
- [ ] 5 campos criados na tabela experiments
- [ ] Experimento NOVO criado com conversion_url preenchido
- [ ] Código de integração gerado e colado na página
- [ ] Teste em página real: navegou para URL de conversão
- [ ] Console mostra: `🎯 Conversion page detected!`
- [ ] Evento salvo no banco: `SELECT * FROM events WHERE event_type='conversion'`

---

## 🎯 RESUMO EXECUTIVO

### O que está causando o problema?

Os campos `conversion_url`, `conversion_type`, `conversion_value` **não existem** na tabela `experiments` do banco de dados.

### Por que isso acontece?

A migration que cria esses campos ainda não foi executada no Supabase em produção.

### Qual a solução?

Executar a migration SQL no SQL Editor do Supabase (código acima).

### Todo o resto funciona?

**SIM!** Modal, API, SDK - tudo está implementado corretamente. Só falta a migration.

### Quanto tempo leva?

**2 minutos** para aplicar a migration e testar.

---

**Última atualização:** 2025-10-22
**Status:** Aguardando aplicação de migration
