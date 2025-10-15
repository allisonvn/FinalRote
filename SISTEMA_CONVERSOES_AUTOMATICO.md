# 🎯 SISTEMA DE CONVERSÕES AUTOMÁTICO - GUIA COMPLETO

**Data:** 15/10/2025  
**Status:** ✅ IMPLEMENTADO E FUNCIONANDO

---

## 📋 VISÃO GERAL

O sistema de conversões do Rota Final registra automaticamente quando um visitante completa uma ação desejada (conversão), associando essa conversão à variante correta do experimento A/B e salvando no Supabase.

---

## 🔄 FLUXO COMPLETO

```
1. VISITANTE ACESSA SITE
   ↓
2. SDK ATRIBUI VARIANTE (A ou B)
   ↓
3. VISITANTE VÊ VERSÃO DA PÁGINA
   ↓
4. VISITANTE CONVERTE (acessa página de sucesso)
   ↓
5. SCRIPT DETECTA CONVERSÃO
   ↓
6. CONVERSÃO REGISTRADA NO SUPABASE
   ↓
7. DADOS APARECEM NO DASHBOARD
```

---

## ⚙️ CONFIGURAÇÃO

### 1️⃣ Configure o Experimento

No dashboard, ao criar um experimento:

**Etapa 01 - Setup:**
```
Nome: "Teste Landing Page"
URL da Página Original: "https://seusite.com/landing"
```

**Etapa 04 - Meta de Conversão:**
```
Tipo de Conversão: Visualização de Página
URL de Sucesso: https://seusite.com/obrigado
Valor da Conversão: R$ 100,00
```

### 2️⃣ Adicione o Script na Página de Sucesso

Na página de sucesso/obrigado, adicione este código no `<head>`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Obrigado!</title>
    
    <!-- 🎯 SCRIPT DE RASTREAMENTO DE CONVERSÕES -->
    <script src="https://rotafinal.com.br/conversion-tracker.js"></script>
    
</head>
<body>
    <h1>Obrigado pela sua compra!</h1>
    <p>Seu pedido foi confirmado.</p>
</body>
</html>
```

**Pronto!** ✅ As conversões serão registradas automaticamente.

---

## 📊 COMO FUNCIONA TECNICAMENTE

### Passo a Passo do Rastreamento

1. **Visitante acessa site original:**
   ```javascript
   // SDK Rota Final atribui variante
   localStorage.setItem('rotafinal_exp_123', JSON.stringify({
     experimentId: 'abc-123',
     variantId: 'var-456',
     variant: 'Variante A',
     visitorId: 'rf_xyz_789',
     timestamp: Date.now()
   }))
   ```

2. **Visitante acessa página de sucesso:**
   ```javascript
   // Script conversion-tracker.js é carregado
   // Busca dados do localStorage
   const data = JSON.parse(localStorage.getItem('rotafinal_exp_123'))
   ```

3. **Script registra conversão:**
   ```javascript
   // POST para /api/track
   {
     experiment_id: "abc-123",
     visitor_id: "rf_xyz_789",
     variant_id: "var-456",
     variant: "Variante A",
     event_type: "conversion",
     value: 100,  // Valor configurado no experimento
     timestamp: "2025-10-15T10:30:00Z"
   }
   ```

4. **API processa e salva no Supabase:**
   ```sql
   -- Insere evento
   INSERT INTO events (
     experiment_id, 
     visitor_id, 
     variant_id,
     event_type, 
     value
   ) VALUES (
     'abc-123', 
     'rf_xyz_789', 
     'var-456',
     'conversion', 
     100
   )
   
   -- Atualiza estatísticas
   UPDATE variant_stats 
   SET 
     conversions = conversions + 1,
     revenue = revenue + 100
   WHERE variant_id = 'var-456'
   ```

---

## 🎨 VISUALIZAÇÃO NO DASHBOARD

### Modal "Detalhes do Experimento"

Quando você abre o modal de detalhes, verá:

#### 📈 Cards de Métricas Principais

```
┌─────────────────────────────────────────────────────────────┐
│  👥 VISITANTES    🎯 CONVERSÕES    📊 TAXA    🏆 CONFIANÇA  │
│     1.234             45            3.65%        95%        │
└─────────────────────────────────────────────────────────────┘
```

#### 💰 Seção de Conversões Detalhadas

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Conversões Registradas                      [45 conversões]│
│                                                               │
│  💵 Valor Total      📊 Taxa           💳 Ticket Médio      │
│  R$ 4.500,00        3.65%             R$ 100,00             │
│                                                               │
│  ℹ️  Como funciona o rastreamento                            │
│  As conversões são registradas automaticamente quando os     │
│  visitantes acessam a página /obrigado. O sistema           │
│  identifica qual variante estava ativa e registra no        │
│  Supabase com o valor de R$ 100 por conversão.             │
└─────────────────────────────────────────────────────────────┘
```

#### 📋 Tabela de Variantes

```
┌──────────────────────────────────────────────────────────────┐
│ Variante      Visitantes  Conversões  Taxa    Receita        │
├──────────────────────────────────────────────────────────────┤
│ 🏆 Controle      620         18       2.90%   R$ 1.800,00   │
│ ✨ Variante A    614         27       4.40%   R$ 2.700,00   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 RECURSOS AVANÇADOS

### Conversão Manual (Opcional)

Se você quiser controlar quando registrar a conversão:

```javascript
// Na página de sucesso
window.RotaFinalConversion.track({
  experimentId: 'abc-123',
  variantId: 'var-456',
  variantName: 'Variante A',
  visitorId: 'rf_xyz_789',
  value: 150  // Valor customizado
})
```

### Múltiplos Experimentos

O script detecta automaticamente todos os experimentos ativos:

```javascript
// Visitante participando de 2 experimentos
localStorage: {
  'rotafinal_exp_header': {...},
  'rotafinal_exp_cta': {...}
}

// Ambas conversões serão registradas
```

### Evitar Duplicatas

O sistema evita registrar a mesma conversão múltiplas vezes:

```javascript
// Primeira visita à página de sucesso: ✅ Registra
// Segunda visita: ⏭️ Ignora (já converteu)

localStorage.getItem('rotafinal_conversion_abc-123')
// { converted_at: "2025-10-15T10:30:00Z", variant: "Variante A" }
```

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Conversões não aparecem no dashboard

**Verificar:**
1. ✅ Script `conversion-tracker.js` está na página de sucesso
2. ✅ URL da página de sucesso está correta no experimento
3. ✅ localStorage tem dados do experimento
4. ✅ Console do navegador não mostra erros

**Teste manual:**
```javascript
// No console da página de sucesso
console.log(localStorage)
// Deve mostrar: rotafinal_exp_XXX

// Forçar rastreamento
window.RotaFinalConversion.debug(true)
window.location.reload()
```

### Conversões duplicadas

**Solução:**
```javascript
// Limpar localStorage se necessário
localStorage.removeItem('rotafinal_conversion_abc-123')
```

### Valor de conversão incorreto

**Verificar:**
1. ✅ Valor configurado no experimento (Etapa 04)
2. ✅ Campo `conversion_value` no Supabase

```sql
-- Verificar no Supabase
SELECT conversion_value FROM experiments WHERE id = 'abc-123';
```

---

## 📊 QUERIES ÚTEIS NO SUPABASE

### Ver todas as conversões de um experimento

```sql
SELECT 
  e.experiment_id,
  e.visitor_id,
  e.variant_id,
  v.name as variant_name,
  e.value,
  e.created_at
FROM events e
LEFT JOIN variants v ON e.variant_id = v.id
WHERE e.experiment_id = 'abc-123'
  AND e.event_type = 'conversion'
ORDER BY e.created_at DESC;
```

### Estatísticas por variante

```sql
SELECT 
  v.name,
  COUNT(DISTINCT a.visitor_id) as visitors,
  COUNT(e.id) as conversions,
  ROUND((COUNT(e.id)::numeric / COUNT(DISTINCT a.visitor_id)::numeric) * 100, 2) as conversion_rate,
  SUM(e.value) as total_revenue
FROM variants v
LEFT JOIN assignments a ON v.id = a.variant_id
LEFT JOIN events e ON v.id = e.variant_id AND e.event_type = 'conversion'
WHERE v.experiment_id = 'abc-123'
GROUP BY v.id, v.name;
```

### Conversões por dia

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as conversions,
  SUM(value) as revenue
FROM events
WHERE experiment_id = 'abc-123'
  AND event_type = 'conversion'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Experimento criado com URL de conversão configurada
- [ ] Valor de conversão definido
- [ ] Script `conversion-tracker.js` adicionado na página de sucesso
- [ ] Teste realizado: visitou página original → página de sucesso
- [ ] Conversão aparece no dashboard
- [ ] Dados corretos no Supabase (tabela `events`)
- [ ] Estatísticas atualizadas (tabela `variant_stats`)

---

## 🚀 EXEMPLO COMPLETO

### 1. Criar Experimento

```
Nome: "Teste Headline"
URL Original: https://loja.com/produto
Conversão URL: https://loja.com/checkout/obrigado
Valor: R$ 150
```

### 2. Adicionar Script

```html
<!-- em https://loja.com/checkout/obrigado -->
<script src="https://rotafinal.com.br/conversion-tracker.js"></script>
```

### 3. Testar Fluxo

```
1. Acesse: https://loja.com/produto
   → Variante atribuída: "Variante B"
   
2. Acesse: https://loja.com/checkout/obrigado
   → Conversão registrada automaticamente
   
3. Verifique dashboard:
   → "Variante B": 1 conversão, R$ 150
```

### 4. Resultado no Supabase

```sql
-- Tabela events
{
  "experiment_id": "exp-123",
  "visitor_id": "rf_abc_456",
  "variant_id": "var-b",
  "event_type": "conversion",
  "value": 150,
  "created_at": "2025-10-15T10:30:00Z"
}

-- Tabela variant_stats
{
  "variant_id": "var-b",
  "conversions": 1,
  "revenue": 150
}
```

---

## 📝 NOTAS IMPORTANTES

### ⚡ Performance
- Script é leve (~3KB minificado)
- Executa apenas 1 requisição HTTP
- Não impacta velocidade da página

### 🔒 Segurança
- Usa HTTPS
- Validação no servidor
- Rate limiting ativado

### 📱 Compatibilidade
- Funciona em todos navegadores modernos
- Mobile e Desktop
- SPA e sites estáticos

### 🎯 Precisão
- Rastreamento em tempo real
- Sem perda de dados
- Deduplicação automática

---

## 🆘 SUPORTE

**Problemas?** Entre em contato:
- 📧 Email: suporte@rotafinal.com.br
- 💬 Discord: [Link do servidor]
- 📚 Docs: https://docs.rotafinal.com.br

---

**✨ Com o sistema de conversões automático, você tem:**
- ✅ Rastreamento em tempo real
- ✅ Zero código adicional necessário
- ✅ Dados precisos no Supabase
- ✅ Visualização completa no dashboard
- ✅ Atribuição correta à variante

**Comece a otimizar suas conversões hoje! 🚀**

