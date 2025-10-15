# 🎯 GUIA RÁPIDO: CONVERSÕES AUTOMÁTICAS

> **Atualizado:** 15/10/2025  
> **Tempo de leitura:** 2 minutos

---

## 📝 RESUMO

O sistema de conversões do Rota Final **detecta automaticamente** quando um visitante completa uma ação desejada e **registra no Supabase** associando à variante correta.

---

## ⚡ CONFIGURAÇÃO RÁPIDA (3 PASSOS)

### 1️⃣ Configure no Dashboard

Ao criar o experimento, na **Etapa 04 - Meta de Conversão**:

```
Tipo: Visualização de Página
URL de Sucesso: /obrigado
Valor: R$ 100,00
```

### 2️⃣ Cole o Código Gerado

O sistema gera o código completo. Cole no `<head>` da página original:

```html
<head>
  <!-- Código gerado pelo dashboard -->
  <script>
  !function(){"use strict";
    // ... código do experimento ...
  }();
  </script>
</head>
```

### 3️⃣ Pronto! ✅

**As conversões serão registradas automaticamente quando:**
- Visitante acessa página original
- É atribuído a uma variante (A ou B)
- Completa a ação (acessa /obrigado)
- Sistema registra no Supabase

---

## 📊 VER RESULTADOS

### No Dashboard

1. Abra o experimento
2. Clique em **"Ver Detalhes"**
3. Veja na seção **"📊 Conversões Registradas"**:

```
┌─────────────────────────────────────┐
│ 💵 Valor Total     R$ 4.500,00      │
│ 📊 Taxa            3.65%            │
│ 💳 Ticket Médio    R$ 100,00        │
└─────────────────────────────────────┘
```

### No Supabase

```sql
SELECT 
  v.name as variante,
  COUNT(*) as conversoes,
  SUM(e.value) as receita
FROM events e
JOIN variants v ON e.variant_id = v.id
WHERE e.experiment_id = 'seu-experimento-id'
  AND e.event_type = 'conversion'
GROUP BY v.name;
```

---

## 🎨 TIPOS DE CONVERSÃO

### 1. Por URL (Mais Comum) ✅

```
Tipo: Visualização de Página
URL: /obrigado
```

Registra quando visitante acessa `/obrigado`

### 2. Por Clique em Elemento

```
Tipo: Clique
Seletor: #botao-comprar
```

Registra quando clica em `<button id="botao-comprar">`

### 3. Manual (Programática)

```javascript
// Na página de sucesso
RotaFinal.convert(150, { 
  produto: 'Tênis Nike',
  orderId: '12345' 
})
```

---

## 🔍 COMO FUNCIONA POR TRÁS

```
VISITANTE
    ↓
[Acessa página original]
    ↓
[SDK atribui variante A ou B]
    ↓
[Salva no localStorage]
    ↓
[Visitante vê a variante]
    ↓
[Acessa página de sucesso]
    ↓
[SDK detecta URL de sucesso]
    ↓
[Registra conversão no Supabase]
    ↓
[Aparece no dashboard]
```

**Dados salvos:**
- ✅ Experimento ID
- ✅ Variante que o visitante viu
- ✅ Valor da conversão (R$)
- ✅ Data/hora
- ✅ Propriedades extras (opcional)

---

## ⚠️ IMPORTANTE

### ✅ FAÇA

- Configure URL de sucesso correta
- Defina valor de conversão realista
- Teste o fluxo completo antes de publicar

### ❌ NÃO FAÇA

- Não use URLs diferentes para cada variante na conversão
- Não esqueça de configurar o valor (R$)
- Não adicione o código na página de sucesso (só na original)

---

## 🐛 RESOLUÇÃO DE PROBLEMAS

### Conversão não aparece no dashboard

**Checklist:**
1. ✅ Código adicionado na página **original** (não na de sucesso)
2. ✅ URL de sucesso está correta no experimento
3. ✅ Visitou a página original ANTES da página de sucesso
4. ✅ localStorage tem dados do experimento

**Testar:**
```javascript
// No console da página de sucesso
console.log(localStorage)
// Deve mostrar: rf_variant_SEU_EXPERIMENTO_ID
```

### Conversões duplicadas

**Solução:**
O sistema evita duplicatas automaticamente usando `sessionStorage`.
Se precisar limpar:

```javascript
sessionStorage.clear()
localStorage.clear()
location.reload()
```

---

## 📞 SUPORTE

- 📧 suporte@rotafinal.com.br
- 📚 [Documentação Completa](./SISTEMA_CONVERSOES_AUTOMATICO.md)
- 💬 Chat ao vivo no dashboard

---

## ✨ EXEMPLO COMPLETO

**Cenário:** Loja de tênis testando duas páginas de produto

### 1. Configuração

```
Nome: Teste Página Produto Nike
URL Original: /produto/tenis-nike-air
Conversão URL: /checkout/obrigado
Valor: R$ 299,90
```

### 2. Resultado Esperado

```
Variante A (Original): 
  • 620 visitantes
  • 18 conversões (2.90%)
  • R$ 5.398,20 em receita

Variante B (Nova):
  • 614 visitantes  
  • 27 conversões (4.40%)
  • R$ 8.097,30 em receita
  
🏆 Vencedor: Variante B (+51.7% conversões)
```

### 3. Dashboard Mostra

```
📊 Conversões Registradas

💵 Valor Total          R$ 13.495,50
📊 Taxa de Conversão    3.65%
💳 Ticket Médio         R$ 299,90

ℹ️  As conversões são registradas automaticamente 
   quando os visitantes acessam /checkout/obrigado. 
   O sistema identifica qual variante estava ativa.
```

---

**🚀 Comece agora mesmo!**

Todo o rastreamento é automático. Você só precisa:
1. Configurar URL de conversão
2. Colar o código
3. Ver os resultados aparecerem

**Zero código adicional necessário!** ✨

