# Configuração de Webhooks Kiwify - Rota Final

**Domínio de Produção:** `https://rotafinal.com.br`

---

## 🌟 URL ÚNICA DO WEBHOOK (RECOMENDADO)

Configure **uma única URL** no painel do Kiwify que processa todos os eventos:

```
https://rotafinal.com.br/api/webhooks/kiwify
```

**Método:** `POST`  
**Eventos suportados:** Todos os eventos do Kiwify são processados automaticamente

### Eventos Processados:
| Evento | Ação |
|--------|------|
| `compra_aprovada` | Cria usuário + Ativa assinatura + Email boas-vindas |
| `subscription_late` | Marca como atrasado + Email cobrança |
| `subscription_canceled` | Cancela assinatura + Email cancelamento |
| `subscription_renewed` | Reativa assinatura |
| `compra_reembolsada` | Marca como reembolsado |
| `chargeback` | Bloqueia conta |
| `boleto_gerado` | Registra boleto pendente |
| `pix_gerado` | Registra PIX pendente |
| `carrinho_abandonado` | Registra abandono |
| `compra_recusada` | Registra recusa |

---

## 📌 URLs Individuais (Alternativa)

Se preferir configurar webhooks separados:

### 1. Compra Aprovada (Purchase Approved)
```
https://rotafinal.com.br/api/webhooks/kiwify/purchase-approved
```
**Evento Kiwify:** `compra_aprovada`  
**Descrição:** Acionado quando uma compra é aprovada. Cria o usuário, ativa a assinatura e envia email de boas-vindas.

---

### 2. Pagamento Atrasado (Payment Late)
```
https://rotafinal.com.br/api/webhooks/kiwify/payment-late
```
**Evento Kiwify:** `subscription_late`  
**Descrição:** Acionado quando um pagamento de assinatura está atrasado. Atualiza status da assinatura e envia email de cobrança.

---

### 3. Assinatura Cancelada (Subscription Canceled)
```
https://rotafinal.com.br/api/webhooks/kiwify/canceled
```
**Evento Kiwify:** `subscription_canceled`  
**Descrição:** Acionado quando uma assinatura é cancelada. Atualiza status da assinatura e envia email de cancelamento.

---

## 🔐 Configuração de Segurança

### Variáveis de Ambiente Necessárias

Adicione no seu `.env.production` ou painel de deploy (Vercel, etc):

```env
# Secret para validação HMAC dos webhooks
KIWIFY_WEBHOOK_SECRET=seu_secret_aqui

# API Key para operações na Kiwify (cancelamento, etc)
KIWIFY_API_KEY=sua_api_key_aqui
```

### Como obter o Webhook Secret no Kiwify:

1. Acesse o painel do Kiwify
2. Vá em **Configurações** → **Webhooks**
3. Ao criar um webhook, o Kiwify gerará um **Secret**
4. Copie esse secret e configure na variável `KIWIFY_WEBHOOK_SECRET`

---

## 📋 Tabela Resumo

| Evento Kiwify | URL do Webhook | Ação |
|---------------|----------------|------|
| `compra_aprovada` | `/api/webhooks/kiwify/purchase-approved` | Criar usuário + Ativar assinatura + Email boas-vindas |
| `subscription_late` | `/api/webhooks/kiwify/payment-late` | Marcar como atrasado + Email cobrança |
| `subscription_canceled` | `/api/webhooks/kiwify/canceled` | Cancelar assinatura + Email cancelamento |

---

## 🧪 Testando Webhooks

### Usando cURL (exemplo para compra aprovada):

```bash
curl -X POST https://rotafinal.com.br/api/webhooks/kiwify/purchase-approved \
  -H "Content-Type: application/json" \
  -H "x-kiwify-signature: SHA256_SIGNATURE_AQUI" \
  -d '{
    "event": "compra_aprovada",
    "data": {
      "customer": {
        "email": "teste@exemplo.com",
        "name": "Usuário Teste"
      },
      "product": {
        "id": "prod_123",
        "name": "Plano Pro"
      },
      "order": {
        "id": "order_123",
        "status": "paid",
        "amount": 9700
      },
      "subscription": {
        "id": "sub_123",
        "status": "active"
      }
    },
    "timestamp": "2026-01-20T10:00:00Z"
  }'
```

---

## 📧 Emails Enviados

| Webhook | Template de Email | Descrição |
|---------|-------------------|-----------|
| purchase-approved | `welcome` | Boas-vindas com link de login |
| payment-late | `payment-late` | Aviso de pagamento atrasado com link para regularizar |
| canceled | `subscription-canceled` | Confirmação de cancelamento com link para reativar |

---

## ⚠️ Troubleshooting

### Webhook retornando 401 (Unauthorized)
- Verifique se o `KIWIFY_WEBHOOK_SECRET` está configurado corretamente
- Confirme que o header `x-kiwify-signature` está sendo enviado pelo Kiwify

### Webhook retornando 400 (Bad Request)
- Verifique se o payload JSON está no formato esperado
- Confirme que todos os campos obrigatórios estão presentes

### Webhook retornando 500 (Internal Server Error)
- Verifique os logs do servidor (Vercel, etc)
- Confirme que o Supabase está acessível e as variáveis de ambiente estão corretas

---

## 🔗 Links Úteis

- [Documentação Kiwify Webhooks](https://docs.kiwify.com.br/api-reference/webhooks)
- [Painel Kiwify](https://dashboard.kiwify.com.br)

---

*Documento gerado em 2026-01-20*
