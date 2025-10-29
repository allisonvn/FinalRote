# 🔍 Guia Completo de Captura de UTMs - RotaFinal

## 📋 Resumo

Sistema completo para capturar, armazenar e exibir UTMs em campanhas de marketing.

### O que é capturado:
- `utm_source` - Origem do tráfego (google, facebook, email, etc)
- `utm_medium` - Tipo de mídia (cpc, social, email, organic, etc)
- `utm_campaign` - Nome da campanha
- `utm_term` - Termo de busca (para campanhas SEM)
- `utm_content` - Identificador de variação
- Também: `fbclid`, `gclid`, `msclkid` (ad networks)

---

## 🚀 Como Implementar

### 1️⃣ Adicionar Script no Seu Site

```html
<!-- No <head> ou antes de </body> do seu site -->
<script src="https://rotafinal.com.br/rotafinal-utm-capture.js?api_key=YOUR_API_KEY"></script>
```

### 2️⃣ Acessar com UTMs na URL

Exemplo de URL com UTMs:
```
https://seusite.com/?utm_source=google&utm_campaign=black_friday&utm_medium=cpc
```

### 3️⃣ Os UTMs Serão:
- ✅ Capturados automaticamente
- ✅ Salvos em `localStorage` por 30 dias
- ✅ Enviados com todos os eventos
- ✅ Mostrados na aba "Eventos" do dashboard

---

## 📊 Dashboard - Aba Eventos

Na aba **Eventos** do seu dashboard, você verá uma tabela com:

| Coluna | Descrição |
|--------|-----------|
| **UTM Campaign** | Nome da campanha |
| **UTM Source** | Origem do tráfego |
| **Vendas** | Total de conversões |
| **Impressões** | Total de pageviews |
| **Cliques** | Total de cliques |
| **Conversões** | Repetição de vendas |
| **Taxa Conversão** | % de conversão |
| **Receita** | Valor total gerado |
| **Visitantes Únicos** | Quantidade de visitantes |

---

## 🧪 Testar Localmente

### Opção 1: Usar Página de Teste

Acesse:
```
https://rotafinal.com.br/test-utm-capture.html?utm_source=google&utm_campaign=test
```

**Nesta página você pode:**
- Ver UTMs capturados
- Enviar eventos de teste (pageview, click, conversion)
- Testar diferentes combinações de UTMs

### Opção 2: URLs de Teste Rápido

```
# Google Ads
?utm_source=google&utm_campaign=black_friday&utm_medium=cpc

# Facebook
?utm_source=facebook&utm_campaign=summer_sale&utm_medium=social

# Email
?utm_source=email&utm_campaign=newsletter&utm_medium=email

# Instagram
?utm_source=instagram&utm_campaign=awareness&utm_medium=social
```

---

## 💻 Usar em JavaScript

```javascript
// Obter todos os UTMs salvos
const utms = window.RotaFinalUTM.getAll();
// Resultado: { utm_source: "google", utm_campaign: "test", ... }

// Obter um UTM específico
const source = window.RotaFinalUTM.get('utm_source');
// Resultado: "google"

// Enviar evento com UTMs
window.RotaFinalUTM.send('pageview', {
  page: '/produtos',
  user_id: '12345'
});
```

---

## 🔄 Fluxo Completo

```
URL com UTMs
    ↓
Script Captura UTMs
    ↓
Salva em localStorage (30 dias)
    ↓
Usuário interage (pageview, click, conversion)
    ↓
Evento enviado com UTMs para API
    ↓
Supabase armazena em event_data
    ↓
Dashboard exibe na tabela de Eventos
```

---

## 🛠️ Estrutura de Dados

### Salvo em localStorage:
```json
{
  "expires": 1700000000000,
  "params": {
    "utm_source": "google",
    "utm_campaign": "black_friday",
    "utm_medium": "cpc"
  }
}
```

### Enviado para API:
```json
{
  "event_type": "conversion",
  "visitor_id": "user_123",
  "properties": {
    "utm_source": "google",
    "utm_campaign": "black_friday",
    "utm_medium": "cpc"
  },
  "timestamp": "2025-10-29T19:00:00Z"
}
```

### Salvo no Supabase (event_data):
```json
{
  "utm_source": "google",
  "utm_campaign": "black_friday",
  "utm_medium": "cpc",
  "variant": "B",
  "page": "/checkout",
  "device": "mobile"
}
```

---

## 📈 Exemplos de Campanhas

### Black Friday
```
utm_source=facebook
utm_campaign=black_friday_2025
utm_medium=social
utm_content=carousel_ads
```

### Newsletter
```
utm_source=email
utm_campaign=weekly_newsletter
utm_medium=email
utm_term=promotion
```

### Google Ads
```
utm_source=google
utm_campaign=product_launch
utm_medium=cpc
utm_content=banner_300x250
```

---

## ✅ Checklist de Implementação

- [ ] Script adicionado ao site
- [ ] Testado com URLs contendo UTMs
- [ ] Eventos sendo enviados corretamente
- [ ] UTMs aparecendo na tabela do dashboard
- [ ] Campanha configurada no Google Analytics 4
- [ ] Links com UTMs distribuídos nas campanhas

---

## 🐛 Troubleshooting

### UTMs não aparecem no dashboard
1. ✅ Verificar se script está carregando
2. ✅ Abrir DevTools → Console
3. ✅ Digitar `window.RotaFinalUTM.getAll()`
4. ✅ Se retornar `{}`, UTMs não foram capturados

### UTMs não são salvos
1. ✅ Verificar localStorage do navegador (F12 → Application → Storage → Local Storage)
2. ✅ Confirmar que a chave `rf_utm_params` existe
3. ✅ Se não houver, acessar URL com parâmetros `?utm_source=test`

### Eventos não são enviados
1. ✅ Verificar Network tab (F12 → Network)
2. ✅ Procurar requisição para `/api/track`