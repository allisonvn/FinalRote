# 🌐 Lista Completa de Domínios para Propagação UTM

## 📋 Domínios Pré-Configurados no Sistema

### 🇧🇷 **Afiliados Brasileiros**

#### Hotmart
- `pay.hotmart.com`
- `payment.hotmart.com`
- `pagamento.hotmart.com`
- `go.hotmart.com`
- `app-vlc.hotmart.com/checkout`

#### Eduzz
- `sun.eduzz.com`
- `pay.eduzz.com`
- `checkout.sun.eduzz.com`

#### Kiwify
- `pay.kiwify.com.br`
- `pay.kiwify.app`

#### Ticto
- `payment.ticto.app`
- `checkout.ticto.app`
- `pay.ticto.com.br`

#### Monetizze
- `checkout.monetizze.com.br`
- `app.monetizze.com.br/checkout`

#### Braip
- `checkout.braip.com`
- `app.braip.com/checkout`
- `checkout.braip.dev`
- `checkout.braip.app`

---

### 💳 **Gateways de Pagamento BR**

#### PagSeguro
- `pagseguro.uol.com.br/checkout`

#### MercadoPago
- `mpago.la`
- `checkout.mercadopago.com.br`

#### Pagar.me
- `checkout.pagar.me`
- `checkout.pagar.me/pay`

#### Outros Pagamentos BR
- `pag.ae` (PagSeguro)
- `checkout.iugu.com`
- `checkout.vindi.com.br`
- `pagamento.asaas.com`
- `checkout.asaas.com`
- `link.efi.com.br`
- `pagamento.efi.com.br`
- `cielo.com.br/ecommerce/checkout`
- `checkout.pagbrasil.com`
- `checkout.yapay.com.br`
- `checkout.picpay.com`
- `checkout.pagarme.com.br`
- `checkout.pagbank.com.br`
- `checkout.getnet.com.br`
- `checkout.stone.com.br`

---

### 🇧🇷 **Afiliados Adicionais BR**

#### PerfectPay
- `pay.perfectpay.com.br`
- `checkout.perfectpay.com.br`
- `checkout.perfectpay.com`

#### HeroSpark
- `pay.herospark.com`
- `checkout.herospark.com`
- `checkout.herospark.com.br`

#### CartPanda
- `checkout.cartpanda.com`
- `pay.cartpanda.com`
- `checkout.cartpanda.com.br`

#### CartX
- `checkout.cartx.io`
- `checkout.cartx.com.br`

#### Yampi
- `checkout.yampi.com.br`
- `checkout.yampi.app`

---

### 🇧🇷 **E-commerce Brasileiros**

- `checkout.nuvemshop.com.br`
- `checkout.tray.com.br`
- `checkout.lojaintegrada.com.br`
- `checkout.magazinevoce.com.br`
- `checkout.hubsales.com.br`

---

### 🌍 **Afiliados Internacionais**

#### ClickBank
- `checkout.clickbank.net`

#### ThriveCart
- `checkout.thrivecart.com`

#### SamCart
- `checkout.samcart.com`

#### PayKickStart
- `checkout.paykickstart.com`

#### Educacionais
- `checkout.kajabi.com`
- `checkout.teachable.com`
- `checkout.learnworlds.com`

#### Outros
- `checkout.kartra.com`
- `checkout.systeme.io`
- `checkout.podia.com`
- `gumroad.com/checkout`
- `pay.gumroad.com`
- `checkout.payhip.com`

---

### 💳 **Gateways Internacionais**

#### Stripe
- `checkout.stripe.com`
- `buy.stripe.com`

#### PayPal
- `www.paypal.com/checkoutnow`

#### Braintree
- `checkout.braintreepayments.com`

#### Outros
- `checkoutshopper-live.adyen.com`
- `checkout.wepay.com`
- `checkout.2checkout.com`
- `checkout.paddle.com`
- `checkout.chargebee.com`
- `checkout.recurry.com`
- `checkout.fast.co`
- `checkout.fastspring.com`
- `checkout.authorize.net`
- `checkout.payoneer.com`
- `checkout.ebanx.com`

---

### 🛒 **E-commerce Global**

- `checkout.squarespace.com`
- `checkout.bigcommerce.com`
- `checkout.wix.com`
- `checkout.shop.app`
- `checkout.shopify.com`
- `store.myshopify.com/checkout`

---

### 🔤 **Prefixos Genéricos**

Para cobrir casos não listados acima, o sistema também aceita:

- Qualquer domínio que comece com `checkout.`
- Qualquer domínio que comece com `pay.`
- Qualquer domínio que comece com `pagamento.`

---

## 📊 **Resumo**

### **Total de Domínios Pré-Configurados: 100+**

- 🇧🇷 Afiliados BR: ~40 domínios
- 💳 Gateways BR: ~20 domínios
- 🌍 Afiliados Global: ~15 domínios
- 💳 Gateways Global: ~15 domínios
- 🛒 E-commerce: ~10 domínios
- 🔤 Prefixos genéricos: 3 prefixos

---

## ⚙️ **Como Funciona**

O sistema verifica se o link aponta para um dos domínios na lista acima. Se sim, automaticamente:

1. ✅ Extrai os UTMs do localStorage
2. ✅ Adiciona os UTMs ao link como parâmetros de URL
3. ✅ Preserva os parâmetros existentes no link
4. ✅ Funciona dinamicamente para todos os links `<a>` na página

---

## 📝 **Exemplo de Uso**

**Link Original:**
```html
<a href="https://pay.hotmart.com/checkout">Comprar Agora</a>
```

**Link Modificado Automaticamente:**
```html
<a href="https://pay.hotmart.com/checkout?utm_source=meta_ads&utm_medium=novas_facetas&utm_campaign=outubro_rosa&utm_term=conv&utm_content=ad001">Comprar Agora</a>
```

---

## ✅ **Benefícios**

- ✅ Cobertura abrangente de gateways e afiliados
- ✅ Zero configuração necessária
- ✅ Funciona automaticamente
- ✅ Rastreamento completo da jornada
- ✅ Atribuição correta de conversões por campanha
