# 📊 Resumo Visual: Rastreamento de Conversões

**Data:** 17/10/2025

---

## 🎯 RESPOSTA RÁPIDA

### Como as conversões são contabilizadas?

**✅ SIM**, as conversões são contabilizadas **TODAS as vezes** que um usuário acessa a **URL da página de sucesso** cadastrada no modal (Etapa 3 - Meta).

### E são contabilizadas na variante correta?

**✅ SIM**, o sistema identifica **automaticamente** qual variante o usuário viu e contabiliza a conversão **naquela variante específica**.

---

## 🔄 FLUXO VISUAL SIMPLIFICADO

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. CONFIGURAÇÃO NO MODAL (Dashboard)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Etapa 3 - Meta de Conversão:                                       │
│  ┌────────────────────────────────────────────────────────┐         │
│  │ URL da página de sucesso: https://site.com/obrigado   │         │
│  │ Valor da conversão: R$ 150,00                          │         │
│  └────────────────────────────────────────────────────────┘         │
│                                                                      │
│  ✅ Salvo no banco: experiments.conversion_url                      │
│  ✅ Salvo no banco: experiments.conversion_value                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. USUÁRIO ACESSA PÁGINA ORIGINAL                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  URL: https://site.com/landing                                      │
│                                                                      │
│  SDK Rota Final:                                                    │
│  ┌────────────────────────────────────────────────────────┐         │
│  │ ✅ Atribui variante: "Variante A"                      │         │
│  │ ✅ Salva no localStorage:                              │         │
│  │    - experimentId: "abc-123"                           │         │
│  │    - variantId: "var-456"                              │         │
│  │    - variantName: "Variante A"                         │         │
│  │    - visitorId: "rf_xyz_789"                           │         │
│  └────────────────────────────────────────────────────────┘         │
│                                                                      │
│  ↓ Redireciona para: https://site.com/landing-a                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. USUÁRIO ACESSA PÁGINA DE SUCESSO                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  URL: https://site.com/obrigado                                     │
│       ↑                                                              │
│       └─ Mesma URL para TODAS as variantes                          │
│                                                                      │
│  Script de Conversão (conversion-tracker.js):                       │
│  ┌────────────────────────────────────────────────────────┐         │
│  │ 1. Busca localStorage:                                 │         │
│  │    ✅ variantId = "var-456" (Variante A)               │         │
│  │                                                         │         │
│  │ 2. Busca valor de conversão da API:                    │         │
│  │    ✅ conversion_value = 150.00                        │         │
│  │                                                         │         │
│  │ 3. Prepara payload:                                    │         │
│  │    {                                                    │         │
│  │      experiment_id: "abc-123",                         │         │
│  │      variant_id: "var-456",  ← Variante A             │         │
│  │      visitor_id: "rf_xyz_789",                         │         │
│  │      event_type: "conversion",                         │         │
│  │      value: 150.00           ← Valor configurado      │         │
│  │    }                                                    │         │
│  │                                                         │         │
│  │ 4. Envia para: POST /api/track                         │         │
│  └────────────────────────────────────────────────────────┘         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. API PROCESSA (src/app/api/track/route.ts)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────┐         │
│  │ 1. Insere na tabela events:                            │         │
│  │    INSERT INTO events (                                │         │
│  │      experiment_id,                                    │         │
│  │      variant_id,      ← "var-456" (Variante A)        │         │
│  │      event_type,      ← "conversion"                   │         │
│  │      value            ← 150.00                         │         │
│  │    )                                                    │         │
│  │                                                         │         │
│  │ 2. Chama RPC increment_variant_conversions:            │         │
│  │    - p_variant_id: "var-456"                           │         │
│  │    - p_revenue: 150.00                                 │         │
│  └────────────────────────────────────────────────────────┘         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. BANCO DE DADOS ATUALIZA (variant_stats)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SQL executado automaticamente:                                     │
│  ┌────────────────────────────────────────────────────────┐         │
│  │ UPDATE variant_stats                                   │         │
│  │ SET                                                     │         │
│  │   conversions = conversions + 1,    ← +1 conversão    │         │
│  │   revenue = revenue + 150.00,       ← +R$ 150,00      │         │
│  │   last_updated = NOW()                                 │         │
│  │ WHERE                                                   │         │
│  │   experiment_id = 'abc-123'                            │         │
│  │   AND variant_id = 'var-456'  ← Variante A            │         │
│  └────────────────────────────────────────────────────────┘         │
│                                                                      │
│  Resultado na tabela:                                               │
│  ┌───────────┬──────────┬────────────┬─────────┐                   │
│  │ Variante  │ Visitors │ Conversões │ Receita │                   │
│  ├───────────┼──────────┼────────────┼─────────┤                   │
│  │ Variante A│  1000    │  51 ← +1  │ 7650 ←  │                   │
│  │ Variante B│  1020    │  62        │ 9300    │                   │
│  └───────────┴──────────┴────────────┴─────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 6. DASHBOARD ATUALIZA                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐           │
│  │ 📊 Experimento: Teste Landing Page                  │           │
│  │                                                       │           │
│  │ Variante A (Controle)                                │           │
│  │ • Visitantes: 1000                                   │           │
│  │ • Conversões: 51 ✅                                  │           │
│  │ • Taxa: 5.10%                                        │           │
│  │ • Receita: R$ 7.650,00 ✅                            │           │
│  │                                                       │           │
│  │ Variante B                                           │           │
│  │ • Visitantes: 1020                                   │           │
│  │ • Conversões: 62                                     │           │
│  │ • Taxa: 6.08% 🏆                                     │           │
│  │ • Receita: R$ 9.300,00                               │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 PONTOS-CHAVE

### 1. Cadastro da URL de Sucesso
- ✅ Configurado no **Modal → Etapa 3 - Meta**
- ✅ Campo: "URL da página de sucesso *"
- ✅ Salvo em: `experiments.conversion_url`

### 2. Cadastro do Valor de Conversão
- ✅ Configurado no **Modal → Etapa 3 - Meta**
- ✅ Campo: "Valor da conversão (R$)"
- ✅ Salvo em: `experiments.conversion_value`

### 3. Rastreamento Automático
- ✅ **Adicionar na página de sucesso:**
  ```html
  <script src="https://rotafinal.com.br/conversion-tracker.js"></script>
  ```
- ✅ O script detecta **automaticamente** quando a página é acessada
- ✅ Busca qual variante o usuário viu (no `localStorage`)
- ✅ Envia conversão para a API

### 4. Contabilização por Variante
- ✅ **Cada conversão é atribuída à variante que o usuário VIU**
- ✅ Não importa qual URL o usuário está acessando agora
- ✅ O sistema usa o `variant_id` salvo no `localStorage`

### 5. Valor de Conversão
- ✅ **Sempre usa o valor configurado no experimento**
- ✅ Buscado automaticamente da API
- ✅ Somado ao total de receita da variante

### 6. Anti-Duplicação
- ✅ **Cada usuário converte apenas 1x por experimento**
- ✅ Sistema verifica `localStorage` antes de enviar
- ✅ Conversões duplicadas são ignoradas

---

## 📋 EXEMPLO PRÁTICO

### Configuração no Modal

```
Etapa 1 - Setup:
├─ Nome: "Teste Landing Page"
└─ URL Original: https://site.com/landing

Etapa 2 - Variantes:
├─ Variante A (Controle): https://site.com/landing-a
└─ Variante B: https://site.com/landing-b

Etapa 3 - Meta: ✅
├─ Tipo: Visualização de Página
├─ URL de Sucesso: https://site.com/obrigado  ← CONFIGURADO AQUI
└─ Valor: R$ 150,00                           ← CONFIGURADO AQUI
```

### Implementação

```html
<!-- Página: https://site.com/obrigado -->
<!DOCTYPE html>
<html>
<head>
  <title>Obrigado!</title>
  
  <!-- ✅ Adicionar este script -->
  <script src="https://rotafinal.com.br/conversion-tracker.js"></script>
</head>
<body>
  <h1>Obrigado pela sua compra!</h1>
  <p>Seu pedido foi confirmado.</p>
</body>
</html>
```

### Fluxo do Usuário

```
1. Usuário acessa: https://site.com/landing
   → SDK atribui: Variante A
   → Redireciona para: https://site.com/landing-a
   → Salva no localStorage: variant_id = "var-456"

2. Usuário clica em "Comprar"

3. Usuário acessa: https://site.com/obrigado
   → Script detecta variante no localStorage: "var-456"
   → Busca valor de conversão: R$ 150,00
   → Envia conversão para API

4. Banco de dados atualiza:
   → Variante A: +1 conversão
   → Variante A: +R$ 150,00 receita

5. Dashboard mostra:
   → Variante A: 51 conversões, R$ 7.650,00
```

---

## ✅ CHECKLIST RÁPIDO

### Configurar Experimento
- [ ] Definir URL de sucesso no Modal (Etapa 3)
- [ ] Definir valor de conversão no Modal (Etapa 3)
- [ ] Salvar experimento

### Implementar Rastreamento
- [ ] Adicionar script na página de sucesso:
  ```html
  <script src="https://rotafinal.com.br/conversion-tracker.js"></script>
  ```

### Testar
- [ ] Abrir modo incógnito
- [ ] Acessar página original (será atribuída uma variante)
- [ ] Acessar página de sucesso
- [ ] Verificar logs no DevTools (F12)
- [ ] Verificar Dashboard (deve mostrar +1 conversão)

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

### No Navegador (DevTools - F12)

```javascript
// 1. Após acessar página original, verificar localStorage:
Object.keys(localStorage)
  .filter(k => k.startsWith('rotafinal'))
  .forEach(k => console.log(k, localStorage.getItem(k)))

// Deve mostrar algo como:
// rotafinal_exp_abc123: {"experimentId":"abc-123","variantId":"var-456",...}
```

### No Console (após acessar página de sucesso)

```
Logs esperados:
🎯 [ConversionTracker] Iniciando ConversionTracker
🔍 [ConversionTracker] Procurando dados de atribuição
✅ [ConversionTracker] Dados encontrados
📡 [ConversionTracker] Buscando dados do experimento
📊 [ConversionTracker] Registrando conversão
✅ [ConversionTracker] Conversão registrada com sucesso!
```

### No Dashboard

```
1. Acessar: https://rotafinal.com.br/dashboard
2. Abrir experimento
3. Verificar card de conversões:
   • Conversões: +1 ✅
   • Receita: +R$ 150,00 ✅
   • Taxa de Conversão: atualizada ✅
```

---

## ❓ FAQ RÁPIDO

### P: A conversão é registrada toda vez que acesso a página de sucesso?

**R:** ✅ **SIM**, mas apenas a **primeira vez** por usuário. O sistema tem anti-duplicação.

---

### P: Como o sistema sabe qual variante originou a conversão?

**R:** ✅ O sistema salva o `variant_id` no `localStorage` quando o usuário acessa a página original. Quando ele acessa a página de sucesso, o script busca esse `variant_id` e envia junto com a conversão.

---

### P: E se o usuário limpar o localStorage?

**R:** ⚠️ Se o localStorage for limpo, o sistema **não consegue** identificar a variante. É importante que o usuário mantenha o localStorage entre a página original e a página de sucesso.

---

### P: Posso ter URLs de sucesso diferentes para cada variante?

**R:** ❌ **NÃO**. Atualmente o sistema usa **1 única URL de sucesso** para todas as variantes. O que diferencia é o `variant_id` salvo no `localStorage`.

---

### P: O valor de conversão pode ser diferente para cada variante?

**R:** ❌ **NÃO**. O valor de conversão é configurado no **experimento** (não por variante). Todas as variantes usam o mesmo valor.

---

### P: Como testar sem contaminar os dados reais?

**R:** ✅ Use **modo incógnito** do navegador. Cada janela incógnita é uma nova sessão com localStorage limpo.

---

## 📁 ARQUIVOS IMPORTANTES

| Arquivo | Função |
|---------|--------|
| `public/conversion-tracker.js` | Script automático de conversão |
| `src/app/api/track/route.ts` | API que recebe conversões |
| `supabase/migrations/20250102000000_add_mab_algorithms.sql` | Função RPC que incrementa conversões |
| `src/app/dashboard/page.tsx` | Modal de criação de experimentos |

---

## 🎯 CONCLUSÃO

### ✅ Conversões SÃO contabilizadas todas as vezes que:
1. Usuário acessa a **URL da página de sucesso** (cadastrada no modal)
2. Sistema detecta **qual variante** o usuário viu
3. Conversão é registrada **na variante correta**
4. Valor configurado é **somado à receita** da variante

### ✅ Contabilização na variante de origem:
- Sistema usa `variant_id` do `localStorage`
- Conversão sempre vai para a variante que o usuário **VIU**
- Não importa qual URL ele está acessando agora

### ✅ Implementação simples:
- **1 linha de código** na página de sucesso
- Rastreamento **100% automático**
- Dados em **tempo real** no dashboard

---

**Documento criado em:** 17/10/2025  
**Versão:** 1.0

