# 🔧 Guia de Debug - Conversões Não Funcionando

## 📋 CHECKLIST DE DIAGNÓSTICO

Execute cada passo na ordem e anote os resultados:

---

## ✅ PASSO 1: Verificar se Migration Foi Aplicada

### 1.1 Executar Query de Verificação

**No Supabase Dashboard → SQL Editor, execute:**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'experiments'
  AND column_name IN ('conversion_url', 'conversion_type', 'conversion_value')
ORDER BY column_name;
```

**Resultado esperado:**
```
conversion_type   | text
conversion_url    | text
conversion_value  | numeric
```

**❓ Quantas linhas retornou?**
- [ ] 0 linhas → **Migration NÃO foi aplicada** → Vá para PASSO 1.2
- [ ] 3 linhas → **Migration FOI aplicada** → Vá para PASSO 2

### 1.2 Aplicar Migration (se necessário)

Se retornou 0 linhas no PASSO 1.1:

1. Abra o arquivo: `supabase/migrations/20251018000000_add_conversion_fields.sql`
2. Copie **TODO** o conteúdo
3. Cole no Supabase SQL Editor
4. Clique em **Run**
5. **Aguarde a mensagem:** `✅ Todos os campos de conversão foram adicionados com sucesso!`
6. Volte ao PASSO 1.1 para confirmar

---

## ✅ PASSO 2: Criar Novo Experimento de Teste

**IMPORTANTE:** Se você já tinha experimentos ANTES de aplicar a migration, eles NÃO terão os campos novos. Você precisa criar um **NOVO** experimento.

### 2.1 Criar Experimento de Teste

1. Vá no dashboard da aplicação
2. Clique em **"+ Novo Experimento"**
3. Preencha:
   - **Etapa 1:**
     - Nome: "Teste de Conversão DEBUG"
     - URL da Página: `https://exemplo.com/teste`
   - **Etapa 2:**
     - Mantenha as variantes padrão
   - **Etapa 3 (IMPORTANTE):**
     - Tipo: **"Acesso a uma página"**
     - URL da página de sucesso: `https://exemplo.com/obrigado`
     - Valor da conversão: `100.00`
4. Clique em **"Criar Experimento"**

### 2.2 Verificar se Dados Foram Salvos

**Execute no SQL Editor:**

```sql
SELECT
  id,
  name,
  target_url,
  conversion_url,
  conversion_type,
  conversion_value,
  created_at
FROM experiments
WHERE name = 'Teste de Conversão DEBUG'
ORDER BY created_at DESC
LIMIT 1;
```

**❓ Qual foi o resultado?**

- [ ] `conversion_url` está **NULL** → **PROBLEMA NO CÓDIGO** → Vá para PASSO 3
- [ ] `conversion_url` = `"https://exemplo.com/obrigado"` → **DADOS SALVOS CORRETAMENTE** → Vá para PASSO 4

**📸 TIRE UM PRINT DO RESULTADO E GUARDE**

---

## ✅ PASSO 3: Diagnosticar Problema de Salvamento

Se `conversion_url` está NULL mesmo após criar novo experimento:

### 3.1 Verificar Console do Navegador

1. Abra o Dashboard
2. Pressione **F12** para abrir o DevTools
3. Vá na aba **Console**
4. Clique em **"+ Novo Experimento"**
5. Preencha o modal novamente
6. **ANTES de clicar em "Criar Experimento"**, verifique se há erros no console
7. Clique em "Criar Experimento"
8. **Observe os logs no console**

**❓ Há algum erro?**
- [ ] SIM → Copie o erro completo e cole aqui: _______________
- [ ] NÃO → Continue para 3.2

### 3.2 Verificar Dados Enviados

**No Console do navegador, procure por:**
```
📤 Chamando createExperiment via hook...
```

Logo acima desse log, deve ter outro log mostrando os dados:
```
{
  name: "Teste...",
  conversion_url: "https://...",
  conversion_type: "page_view",
  conversion_value: 100
}
```

**❓ O campo `conversion_url` está presente nos dados?**
- [ ] SIM → Dados estão sendo enviados → Problema pode ser no servidor
- [ ] NÃO → Dados NÃO estão sendo enviados → Problema no modal

### 3.3 Verificar Resposta da API

**No Console, procure por:**
```
✅ Experimento criado com sucesso: [id]
```

**❓ Essa mensagem aparece?**
- [ ] SIM → Experimento foi criado
- [ ] NÃO → Há erro na criação

---

## ✅ PASSO 4: Verificar Variantes

Se os dados foram salvos corretamente no experimento, vamos verificar as variantes:

**Execute no SQL Editor:**

```sql
SELECT
  v.id,
  v.name,
  v.is_control,
  v.changes::text as changes_json,
  v.changes->'conversion'->>'url' as conversion_url_in_changes,
  v.changes->'conversion'->>'type' as conversion_type_in_changes,
  e.conversion_url as experiment_conversion_url
FROM variants v
JOIN experiments e ON v.experiment_id = e.id
WHERE e.name = 'Teste de Conversão DEBUG'
ORDER BY v.is_control DESC;
```

**❓ Resultado esperado:**

```
variant_name | conversion_url_in_changes | experiment_conversion_url
-------------|--------------------------|---------------------------
Controle     | https://exemplo.com/obrigado | https://exemplo.com/obrigado
Variante A   | https://exemplo.com/obrigado | https://exemplo.com/obrigado
```

**❓ O campo `conversion_url_in_changes` está preenchido?**
- [ ] SIM → Variantes têm configuração correta → Vá para PASSO 5
- [ ] NÃO → Variantes NÃO têm configuração → Problema no hook

---

## ✅ PASSO 5: Verificar Código Gerado

Se os dados estão corretos, vamos verificar o código gerado:

### 5.1 Copiar Código de Integração

1. Vá no dashboard
2. Clique no experimento "Teste de Conversão DEBUG"
3. Clique na aba **"Código"** ou ícone `</>`
4. Copie o código completo

### 5.2 Procurar por `checkAndTrackConversion`

**Cole o código em um editor de texto e procure por:**

```javascript
checkAndTrackConversion=function(expData){
```

**❓ Esta função existe no código?**
- [ ] SIM → Continue para 5.3
- [ ] NÃO → **PROBLEMA: Função não foi gerada** → Reportar bug

### 5.3 Verificar se conversion_url está no código

**Dentro da função `checkAndTrackConversion`, procure por:**

```javascript
if(!expData||!expData.conversion_url)return;
var conversionUrl=expData.conversion_url;
```

**❓ A variável `conversionUrl` está preenchida?**

Para verificar, procure algumas linhas abaixo por:
```javascript
conversionUrl:"https://exemplo.com/obrigado"
```

- [ ] SIM → SDK tem a URL correta → Vá para PASSO 6
- [ ] NÃO → SDK NÃO tem a URL → Problema na geração do código

---

## ✅ PASSO 6: Testar Rastreamento Real

Agora vamos testar se o rastreamento funciona na prática:

### 6.1 Criar Página de Teste

Crie um arquivo HTML `teste-conversao.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Teste de Conversão</title>

  <!-- COLE O CÓDIGO DO EXPERIMENTO AQUI -->
  <!-- Código copiado do passo 5.1 -->

</head>
<body>
  <h1>Teste de Conversão</h1>

  <div id="status"></div>

  <hr>

  <button onclick="simularConversao()">Simular Acesso à Página de Sucesso</button>

  <script>
    // Mostrar status
    document.getElementById('status').innerHTML = `
      <p><strong>Experimento ID:</strong> ${window.RotaFinal?.getVariant?.()?.experiment_id || 'N/A'}</p>
      <p><strong>Variante:</strong> ${window.RotaFinal?.getVariant?.()?.name || 'N/A'}</p>
      <p><strong>Conversion URL configurada:</strong> ${document.querySelector('[data-rf-experiment]')?.getAttribute('data-conversion-url') || 'N/A'}</p>
    `;

    // Simular conversão
    function simularConversao() {
      console.log('🧪 Simulando conversão...');

      // Método 1: Chamar diretamente
      if (window.RotaFinal && window.RotaFinal.convert) {
        window.RotaFinal.convert(100, {
          teste: true,
          url: 'https://exemplo.com/obrigado'
        });
        alert('✅ Conversão registrada via RotaFinal.convert()');
      } else {
        alert('❌ RotaFinal.convert() não encontrado');
      }
    }
  </script>
</body>
</html>
```

### 6.2 Abrir e Testar

1. Abra o arquivo `teste-conversao.html` no navegador
2. Abra o Console (F12)
3. Procure por logs `[RotaFinal]`
4. Clique no botão **"Simular Acesso à Página de Sucesso"**
5. Observe os logs

**❓ Quais logs apareceram?**
- [ ] `[RotaFinal] 🎯 Conversion page detected!` → **FUNCIONOU!**
- [ ] `[RotaFinal] Init` mas sem detecção de conversão → Vá para 6.3
- [ ] Nenhum log apareceu → SDK não está rodando

### 6.3 Verificar Conversão no Banco

**Execute no SQL Editor:**

```sql
SELECT
  id,
  experiment_id,
  event_type,
  properties->>'url' as url,
  properties->>'value' as value,
  created_at
FROM events
WHERE experiment_id = (
  SELECT id FROM experiments WHERE name = 'Teste de Conversão DEBUG' LIMIT 1
)
ORDER BY created_at DESC
LIMIT 10;
```

**❓ Há algum evento com `event_type = 'conversion'`?**
- [ ] SIM → **CONVERSÃO FOI REGISTRADA!** ✅
- [ ] NÃO → Conversão não chegou no banco

---

## 📊 ANÁLISE DOS RESULTADOS

Com base nas suas respostas, identifique o problema:

### Cenário A: Migration não aplicada
- PASSO 1.1 retornou 0 linhas
- **SOLUÇÃO:** Executar migration

### Cenário B: Experimento criado antes da migration
- PASSO 1.1 retornou 3 linhas
- PASSO 2.2 mostra conversion_url = NULL em experimento antigo
- **SOLUÇÃO:** Criar novo experimento após migration

### Cenário C: Modal não envia dados
- PASSO 3.2 mostra que conversion_url NÃO está nos dados enviados
- **SOLUÇÃO:** Verificar código do modal

### Cenário D: Hook não salva dados
- PASSO 3.2 mostra dados enviados
- PASSO 2.2 mostra conversion_url = NULL no banco
- **SOLUÇÃO:** Verificar hook useSupabaseExperiments

### Cenário E: Variantes sem configuração
- PASSO 4 mostra conversion_url_in_changes = NULL
- **SOLUÇÃO:** Problema na criação das variantes

### Cenário F: SDK não gera código
- PASSO 5.2 não encontra função checkAndTrackConversion
- **SOLUÇÃO:** Problema no gerador de código

### Cenário G: Código correto mas não detecta
- PASSO 6.2 não mostra detecção de conversão
- **SOLUÇÃO:** URL não corresponde ou problema de matching

---

## 🆘 REPORTE O PROBLEMA

**Por favor, preencha:**

1. **Qual PASSO falhou?** _______________
2. **Resultado obtido:** _______________
3. **Cenário identificado (A-G):** _______________
4. **Prints/logs relevantes:** (cole aqui)

---

## 🔧 CORREÇÕES RÁPIDAS

### Se conversion_url está NULL no experimento

**Execute no SQL Editor para corrigir manualmente:**

```sql
-- Atualizar experimento específico
UPDATE experiments
SET
  conversion_url = 'https://exemplo.com/obrigado',
  conversion_type = 'page_view',
  conversion_value = 100.00
WHERE name = 'Teste de Conversão DEBUG';

-- Verificar se foi atualizado
SELECT conversion_url, conversion_type, conversion_value
FROM experiments
WHERE name = 'Teste de Conversão DEBUG';
```

### Se variantes não têm configuração de conversão

```sql
-- Atualizar variantes com configuração de conversão
UPDATE variants
SET changes = jsonb_set(
  COALESCE(changes, '{}'::jsonb),
  '{conversion}',
  jsonb_build_object(
    'type', 'page_view',
    'url', 'https://exemplo.com/obrigado',
    'value', 100
  )
)
WHERE experiment_id = (
  SELECT id FROM experiments WHERE name = 'Teste de Conversão DEBUG' LIMIT 1
);

-- Verificar
SELECT
  name,
  changes->'conversion'->>'url' as conversion_url
FROM variants
WHERE experiment_id = (
  SELECT id FROM experiments WHERE name = 'Teste de Conversão DEBUG' LIMIT 1
);
```

---

**Execute este guia completo e me diga em qual PASSO o problema apareceu!** 🔍
