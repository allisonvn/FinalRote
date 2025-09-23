# 🎯 Sistema de Captura UTM - RotaFinal

## ✅ **IMPLEMENTAÇÃO COMPLETA**

O sistema RotaFinal agora possui **captura automática e inteligente de UTMs** integrada em todos os níveis do sistema.

---

## 📋 **O que foi implementado:**

### 1. **Script UTM Tracker Standalone** (`/public/rotafinal-utm-tracker.js`)
- 🔧 **Captura automática** de UTMs da URL
- 💾 **Persistência dupla**: localStorage + cookies
- 🧹 **Limpeza automática** da URL (mantém parâmetros salvos)
- 🎯 **Integração com formulários**: campos hidden automáticos
- 🔗 **Propagação para checkouts**: anexa UTMs em links de pagamento
- 📱 **Observador dinâmico**: captura novos elementos adicionados via JS

### 2. **SDK RotaFinal Integrado** (`/src/lib/rotafinal-sdk.ts` + `/public/rotafinal-sdk.js`)
- ⚡ **Captura automática** no constructor
- 📊 **Tracking enriquecido**: todos os eventos incluem UTMs automaticamente
- 🔍 **APIs públicas**: `getUTMParams()`, `getUTMParam()`, `clearUTMParams()`
- 🛠️ **Sanitização inteligente**: limpa espaços e formata valores

### 3. **Página de Teste** (`/public/utm-test-example.html`)
- 🧪 **Interface completa** para testar captura de UTMs
- 📈 **Visualização em tempo real** dos parâmetros capturados
- 🔄 **Logs interativos** de tracking
- ✨ **Exemplos práticos** de uso

---

## 🎯 **Parâmetros Suportados:**

O sistema captura automaticamente os seguintes parâmetros:

### UTMs Padrão:
- `utm_source` - Fonte do tráfego
- `utm_medium` - Meio/canal 
- `utm_campaign` - Campanha
- `utm_term` - Termo/palavra-chave
- `utm_content` - Conteúdo do anúncio

### Parâmetros de Plataforma:
- `fbclid` - Facebook Click ID
- `gclid` - Google Click ID  
- `msclkid` - Microsoft Click ID
- `ttclid` - TikTok Click ID
- `src` - Parâmetro source customizado
- `sck` - Parâmetro tracking customizado

---

## 🚀 **Como Usar:**

### 1. **Instalação Básica**
```html
<!-- Apenas o SDK (captura automática incluída) -->
<script src="/rotafinal-sdk.js"></script>

<!-- Ou SDK + Tracker avançado (recomendado) -->
<script src="/rotafinal-sdk.js"></script>
<script src="/rotafinal-utm-tracker.js"></script>
```

### 2. **Inicialização**
```javascript
// O SDK captura UTMs automaticamente
const rf = new RotaFinal({
    apiKey: 'sua-chave-api',
    debug: true // Para ver logs de captura
});
```

### 3. **Tracking Automático**
```javascript
// UTMs são incluídos automaticamente
rf.conversion('purchase', 99.90, {
    product_id: 'abc123'
});

// Resultado enviado:
// {
//   product_id: 'abc123',
//   utm_source: 'facebook',
//   utm_campaign: 'black_friday',
//   utm_medium: 'social',
//   ...
// }
```

### 4. **APIs Disponíveis**
```javascript
// Obter todos os UTMs
const utms = rf.getUTMParams();
console.log(utms); // { utm_source: 'google', utm_campaign: 'summer', ... }

// Obter UTM específico
const source = rf.getUTMParam('utm_source');
console.log(source); // 'google'

// Limpar UTMs salvos
rf.clearUTMParams();

// Com o tracker avançado
window.RotaFinalUTM.getParams(); // Mesmo que rf.getUTMParams()
window.RotaFinalUTM.clear();     // Limpar tudo
```

---

## 📊 **Exemplo de URL Suportada:**

```
https://exemplo.com/?utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}&sck={{campaign.name}}|{{adset.name}}|{{ad.name}}|{{placement}}&fbclid=IwAR123
```

**Após captura:**
- ✅ URL limpa: `https://exemplo.com/`  
- ✅ UTMs salvos em localStorage + cookies
- ✅ Disponíveis para todos os eventos futuros
- ✅ Propagados para formulários e links de checkout

---

## 🔧 **Recursos Avançados:**

### 1. **Persistência Inteligente**
- **Duração**: 30 dias (configurável)
- **Fallback**: localStorage → cookies → null
- **Limpeza**: URL limpa automaticamente preservando parâmetros

### 2. **Sanitização de Dados**
- **Espaços**: Convertidos para underscores em UTM source/medium/campaign
- **Trim**: Espaços extras removidos
- **Preservação**: Valores originais mantidos para outros parâmetros

### 3. **Integração com Formulários**
```html
<!-- Campos hidden são criados automaticamente -->
<form>
    <input type="email" name="email">
    <!-- Os campos abaixo são adicionados automaticamente: -->
    <!-- <input type="hidden" name="utm_source" value="facebook"> -->
    <!-- <input type="hidden" name="utm_campaign" value="black_friday"> -->
    <!-- <input type="hidden" name="fbclid" value="..."> -->
</form>
```

### 4. **Propagação para Checkouts**
Links para domínios de pagamento recebem UTMs automaticamente:
- pay.hotmart.com
- payment.ticto.app  
- sun.eduzz.com
- pay.kiwify.com.br
- checkout.stripe.com
- E outros...

---

## 🧪 **Como Testar:**

1. **Acesse a página de teste:**
   ```
   http://localhost:3004/utm-test-example.html
   ```

2. **Adicione UTMs na URL:**
   ```
   http://localhost:3004/utm-test-example.html?utm_source=FB&utm_campaign=test&fbclid=123
   ```

3. **Verifique a captura:**
   - UTMs aparecem na interface
   - URL é limpa automaticamente
   - Eventos incluem UTMs automaticamente

---

## 📈 **Visualização na Aba Eventos:**

A aba "Eventos" no dashboard agora exibe:
- ✅ **UTMs capturados** nas propriedades dos eventos
- ✅ **Dados de campanha** estruturados
- ✅ **Filtros por UTM** source/medium/campaign
- ✅ **Métricas por canal** de aquisição

---

## 🎉 **Conclusão:**

O sistema RotaFinal agora possui **captura de UTMs de nível enterprise**:

- ✅ **Automático**: Zero configuração necessária
- ✅ **Inteligente**: Sanitização e persistência avançada
- ✅ **Completo**: Suporte a todos os principais parâmetros
- ✅ **Integrado**: Funciona com SDK, formulários e checkouts
- ✅ **Testável**: Interface completa para validação
- ✅ **Confiável**: Fallbacks e tratamento de erros

**O sistema está pronto para produção e vai muito além do exemplo fornecido!** 🚀
