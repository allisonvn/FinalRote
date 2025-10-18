# ❌ Conversões Não Funcionando - Diagnóstico Completo

## 🎯 RESUMO DO PROBLEMA

Você aplicou a migration mas as conversões ainda não estão sendo contabilizadas.

## 📋 VERIFICAÇÕES OBRIGATÓRIAS

Execute estas verificações **NA ORDEM** e me diga em qual passo falhou:

---

### ✅ PASSO 1: Migration Foi Aplicada?

**Execute no Supabase SQL Editor:**

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'experiments'
  AND column_name IN ('conversion_url', 'conversion_type', 'conversion_value');
```

**❓ Quantas linhas retornou?**
- [ ] 0 linhas → **Migration NÃO aplicada** → Execute a migration novamente
- [ ] 3 linhas → **Migration OK** → Vá para PASSO 2

---

### ✅ PASSO 2: Experimento foi Criado DEPOIS da Migration?

**IMPORTANTE:** Experimentos criados ANTES da migration NÃO terão os campos novos!

**Execute no SQL Editor:**

```sql
SELECT
  id,
  name,
  conversion_url,
  conversion_type,
  conversion_value,
  created_at
FROM experiments
ORDER BY created_at DESC
LIMIT 3;
```

**❓ O experimento que você está testando foi criado DEPOIS de aplicar a migration?**

Verifique a data em `created_at` e compare com a hora que aplicou a migration.

- [ ] Criado ANTES → **Criar novo experimento** após migration
- [ ] Criado DEPOIS → Vá para PASSO 3

---

### ✅ PASSO 3: Campo conversion_url Está Preenchido?

**No resultado do PASSO 2, verifique:**

**❓ O campo `conversion_url` está NULL ou preenchido?**

- [ ] **NULL** → **PROBLEMA: Dados não foram salvos** → Vá para PASSO 4
- [ ] **Preenchido** (ex: "https://site.com/obrigado") → Vá para PASSO 5

---

### ✅ PASSO 4: Por Que conversion_url Está NULL?

Se o experimento foi criado DEPOIS da migration mas `conversion_url` está NULL, há um problema no código.

**Teste manual - Execute no SQL Editor:**

```sql
-- Atualizar manualmente o experimento mais recente
UPDATE experiments
SET
  conversion_url = 'https://exemplo.com/obrigado',
  conversion_type = 'page_view',
  conversion_value = 100.00
WHERE id = (
  SELECT id FROM experiments ORDER BY created_at DESC LIMIT 1
);

-- Verificar se atualizou
SELECT conversion_url, conversion_type, conversion_value
FROM experiments
ORDER BY created_at DESC
LIMIT 1;
```

**❓ A atualização funcionou?**

- [ ] SIM → `conversion_url` agora está preenchido → Vá para PASSO 5
- [ ] NÃO → Erro no SQL → Me mostre o erro

---

### ✅ PASSO 5: Variantes Têm Configuração de Conversão?

**Execute no SQL Editor:**

```sql
SELECT
  v.name,
  v.is_control,
  v.changes->'conversion'->>'url' as conversion_url_in_changes,
  e.conversion_url as experiment_conversion_url
FROM variants v
JOIN experiments e ON v.experiment_id = e.id
WHERE e.id = (
  SELECT id FROM experiments ORDER BY created_at DESC LIMIT 1
)
ORDER BY v.is_control DESC;
```

**❓ O campo `conversion_url_in_changes` está preenchido?**

```
Expected:
name         | conversion_url_in_changes      | experiment_conversion_url
-------------|--------------------------------|---------------------------
Controle     | https://exemplo.com/obrigado   | https://exemplo.com/obrigado
Variante A   | https://exemplo.com/obrigado   | https://exemplo.com/obrigado
```

- [ ] **NULL** → **PROBLEMA: Variantes sem configuração** → Execute correção no PASSO 6
- [ ] **Preenchido** → Vá para PASSO 7

---

### ✅ PASSO 6: Corrigir Variantes Manualmente

**Execute no SQL Editor:**

```sql
-- Atualizar variantes com configuração de conversão
UPDATE variants
SET changes = jsonb_set(
  COALESCE(changes, '{}'::jsonb),
  '{conversion}',
  jsonb_build_object(
    'type', 'page_view',
    'url', (SELECT conversion_url FROM experiments WHERE id = variants.experiment_id),
    'value', (SELECT conversion_value FROM experiments WHERE id = variants.experiment_id)
  )
)
WHERE experiment_id = (
  SELECT id FROM experiments ORDER BY created_at DESC LIMIT 1
)
AND (changes->'conversion' IS NULL OR changes->'conversion'->>'url' IS NULL);

-- Verificar
SELECT
  name,
  changes->'conversion'->>'url' as conversion_url
FROM variants
WHERE experiment_id = (
  SELECT id FROM experiments ORDER BY created_at DESC LIMIT 1
);
```

**❓ Agora está preenchido?**
- [ ] SIM → Vá para PASSO 7
- [ ] NÃO → Me mostre o erro

---

### ✅ PASSO 7: Testar Código Gerado

1. Vá no dashboard
2. Clique no experimento
3. Copie o **código de integração**
4. Cole em um editor de texto (VSCode, Notepad++, etc)
5. Procure por: `checkAndTrackConversion`

**❓ Encontrou a função `checkAndTrackConversion`?**
- [ ] SIM → Continue para 7.1
- [ ] NÃO → **PROBLEMA: Função não gerada** → Reportar

### 7.1 Procurar por conversion_url no código

Procure por:
```javascript
conversion_url:"
```

**❓ Qual é o valor que aparece depois de `conversion_url:"`?**

Deve ser algo como:
```javascript
conversion_url:"https://exemplo.com/obrigado"
```

- [ ] **Valor correto** → Vá para PASSO 8
- [ ] **NULL ou vazio** → PROBLEMA no gerador de código
- [ ] **Não encontrei** → PROBLEMA no gerador de código

---

### ✅ PASSO 8: Testar Rastreamento Real

Crie um arquivo HTML de teste:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Teste de Conversão</title>

  <!-- COLE SEU CÓDIGO AQUI (do dashboard) -->

</head>
<body>
  <h1>Teste de Conversão</h1>

  <div id="info"></div>

  <hr>

  <button onclick="testarConversao()">🧪 Simular Conversão Manual</button>

  <script>
    // Habilitar debug
    if (window.RotaFinal) {
      window.RotaFinal.setDebug(true);
    }

    // Mostrar info
    setTimeout(() => {
      const variant = window.RotaFinal?.getVariant();
      document.getElementById('info').innerHTML = `
        <p><strong>Variante:</strong> ${variant?.name || 'N/A'}</p>
        <p><strong>Experiment ID:</strong> ${variant?.experiment_id || 'N/A'}</p>
      `;
    }, 1000);

    // Testar conversão manual
    function testarConversao() {
      console.log('🧪 Testando conversão manual...');
      if (window.RotaFinal && window.RotaFinal.convert) {
        window.RotaFinal.convert(100, {
          teste: true,
          url: window.location.href
        });
        alert('✅ Conversão enviada! Verifique o console.');
      } else {
        alert('❌ RotaFinal.convert() não encontrado!');
      }
    }
  </script>
</body>
</html>
```

**Instruções:**

1. Salve como `teste.html`
2. Abra no navegador
3. Abra o Console (F12)
4. Clique no botão "🧪 Simular Conversão Manual"
5. Observe os logs

**❓ O que apareceu no console?**

Logs esperados:
```
[RotaFinal v3.0.1-auto-conversion] Init
[RotaFinal v3.0.1-auto-conversion] Track conversion {...}
```

- [ ] Logs apareceram → Conversão foi enviada → Vá para PASSO 9
- [ ] Nenhum log → SDK não está rodando
- [ ] Erro no console → Me mostre o erro

---

### ✅ PASSO 9: Verificar se Chegou no Banco

**Execute no SQL Editor:**

```sql
-- Buscar eventos dos últimos 5 minutos
SELECT
  id,
  experiment_id,
  event_type,
  properties->>'value' as value,
  properties->>'url' as url,
  created_at
FROM events
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 10;
```

**❓ Há algum evento com `event_type = 'conversion'`?**

- [ ] SIM → **SUCESSO!** Conversões estão funcionando! ✅
- [ ] NÃO, mas há outros eventos → Problema no tipo do evento
- [ ] NÃO, nenhum evento → Problema na comunicação com API

---

## 🐛 POSSÍVEIS PROBLEMAS E SOLUÇÕES

### Problema 1: Migration Não Foi Aplicada

**Sintoma:** PASSO 1 retorna 0 linhas

**Solução:**
1. Abra: `supabase/migrations/20251018000000_add_conversion_fields.sql`
2. Copie TODO o conteúdo
3. Cole no Supabase SQL Editor
4. Execute
5. Aguarde: `✅ Todos os campos de conversão foram adicionados com sucesso!`

---

### Problema 2: Experimento Criado Antes da Migration

**Sintoma:** PASSO 2 mostra data antiga, PASSO 3 mostra NULL

**Solução:**
1. Criar um **NOVO** experimento após aplicar migration
2. OU atualizar o experimento existente com PASSO 4

---

### Problema 3: Dados Não Salvos (conversion_url NULL)

**Sintoma:** Experimento novo mas conversion_url está NULL

**Causas possíveis:**
- Modal não está enviando os dados
- Hook não está salvando os dados
- Cache do browser

**Solução:**
1. Limpar cache do browser (Ctrl+Shift+Delete)
2. Abrir console ao criar experimento
3. Verificar logs para ver se `conversion_url` está sendo enviado
4. Se não estiver, reportar o erro

---

### Problema 4: Variantes Sem Configuração

**Sintoma:** PASSO 5 mostra NULL em `conversion_url_in_changes`

**Solução:**
Execute PASSO 6 para corrigir manualmente

---

### Problema 5: SDK Não Gera checkAndTrackConversion

**Sintoma:** PASSO 7 não encontra a função

**Causas:**
- Variantes não têm configuração de conversão
- Problema no componente OptimizedCodeGenerator

**Solução:**
1. Executar PASSO 6
2. Copiar código novamente
3. Verificar PASSO 7 novamente

---

### Problema 6: Conversão Não Detectada

**Sintoma:** PASSO 8 não mostra detecção automática

**Causas:**
- URL não corresponde (ex: http vs https, com/sem www)
- Conversão já foi rastreada antes (sessão guardada)
- Código não está rodando

**Solução:**

```javascript
// Limpar sessão e testar novamente
if (window.RotaFinal) {
  window.RotaFinal.reload();
}
```

---

## 📞 REPORTE SEU PROBLEMA

Se ainda não funcionou, me diga:

**1. Em qual PASSO falhou?** (1-9)

**2. Resultado do PASSO:**

**3. Print/log do erro:**

**4. Arquivos para verificar:**
- [ ] `test-conversion-query.sql` (executar e colar resultado)
- [ ] Console do navegador (print dos logs)
- [ ] Código gerado (buscar por `checkAndTrackConversion`)

---

## 📁 ARQUIVOS DE APOIO

| Arquivo | Descrição |
|---------|-----------|
| `test-conversion-query.sql` | Script SQL completo de diagnóstico |
| `GUIA_DEBUG_CONVERSOES.md` | Guia detalhado de debug |
| `supabase/migrations/20251018000000_add_conversion_fields.sql` | Migration para aplicar |
| `DIAGNOSTICO_COMPLETO_CONVERSOES.md` | Análise detalhada do problema original |

---

## ✅ CHECKLIST FINAL

Antes de reportar, confirme que:

- [ ] Migration foi aplicada (PASSO 1 = 3 linhas)
- [ ] Experimento foi criado DEPOIS da migration
- [ ] Campo `conversion_url` está preenchido no banco
- [ ] Variantes têm `conversion_url_in_changes` preenchido
- [ ] Código gerado tem função `checkAndTrackConversion`
- [ ] Código gerado tem `conversion_url:"..."` com valor correto
- [ ] Testei com `RotaFinal.convert()` manual
- [ ] Limpei cache e testei em aba anônima

**Se todos os itens acima estão ✅ mas ainda não funciona, há um bug que preciso investigar mais.**
