# 🔧 Correção de Erros 400 em Produção - rotafinal.com.br

## ❌ Problema

Todos os arquivos estáticos do Next.js retornam **400 Bad Request**:
```
GET https://rotafinal.com.br/_next/static/chunks/common-e2933f1fd35f0787.js - 400
GET https://rotafinal.com.br/_next/static/css/7e7d96b1e6991756.css - 400
GET https://rotafinal.com.br/_next/static/chunks/webpack-54d97ceab7ed6d40.js - 400
```

## 🔍 Causa Raiz

A configuração do **Nginx** estava adicionando headers duplicados e conflitantes para arquivos estáticos, causando:
1. Conflitos de `Content-Type` (nginx vs Next.js)
2. Headers duplicados que o Next.js rejeita
3. Regras `location` sobrepostas causando comportamento inesperado

## ✅ Soluções Aplicadas

### 1. **Configuração Nginx Simplificada** (`nginx.conf`)

**ANTES:** Múltiplas regras `location` com headers duplicados
**DEPOIS:** Configuração simplificada que deixa o Next.js servir arquivos estáticos diretamente

```nginx
# Arquivos estáticos - deixar Next.js definir headers
location /_next/static/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    # SEM headers adicionais - Next.js faz isso
}
```

### 2. **Headers no Next.js** (`next.config.js`)

Headers corretos já configurados no `next.config.js`:
- `Content-Type: text/css; charset=utf-8` para CSS
- `Content-Type: application/javascript; charset=utf-8` para JS
- `Cache-Control: public, max-age=31536000, immutable`

### 3. **Middleware Correto** (`middleware.ts`)

O middleware já está fazendo bypass correto para `/_next/static/`:
```typescript
if (pathname.startsWith('/_next/')) {
  return NextResponse.next() // Bypass completo
}
```

## 📋 Passos para Aplicar no Servidor

### **1. Fazer backup:**
```bash
sudo cp /etc/nginx/sites-available/rotafinal /etc/nginx/sites-available/rotafinal.backup.$(date +%Y%m%d)
```

### **2. Copiar nova configuração:**
```bash
# No servidor de produção (/var/www/rotafinal.com.br)
sudo cp nginx.conf /etc/nginx/sites-available/rotafinal
```

### **3. Testar configuração:**
```bash
sudo nginx -t
```

**Saída esperada:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### **4. Recarregar Nginx:**
```bash
sudo systemctl reload nginx
```

### **5. Verificar Next.js:**
```bash
# Verificar se está rodando
pm2 list

# Verificar porta
netstat -tlnp | grep node

# Se não estiver rodando:
cd /var/www/rotafinal.com.br
pm2 start ecosystem.config.js

# Ver logs:
pm2 logs rotafinal --lines 50
```

### **6. Verificar Build:**
```bash
cd /var/www/rotafinal.com.br

# Verificar se arquivos existem
ls -la .next/static/css/ | head -5
ls -la .next/static/chunks/ | head -5

# Se não existirem, fazer build:
npm run build
pm2 restart rotafinal
```

### **7. Testar no Terminal:**
```bash
# Testar arquivo CSS
curl -I https://rotafinal.com.br/_next/static/css/7e7d96b1e6991756.css

# Resposta esperada:
# HTTP/1.1 200 OK
# Content-Type: text/css; charset=utf-8
# Cache-Control: public, max-age=31536000, immutable

# Testar chunk JS
curl -I https://rotafinal.com.br/_next/static/chunks/webpack-54d97ceab7ed6d40.js

# Resposta esperada:
# HTTP/1.1 200 OK
# Content-Type: application/javascript; charset=utf-8
# Cache-Control: public, max-age=31536000, immutable
```

### **8. Limpar Cache do Navegador:**
1. Abrir DevTools (F12)
2. Application → Storage → Clear site data
3. Recarregar página (Ctrl+Shift+R ou Cmd+Shift+R)

## 🔍 Troubleshooting

### Se ainda houver erros 400:

#### **1. Verificar logs do Nginx:**
```bash
sudo tail -f /var/log/nginx/error.log
```

#### **2. Verificar logs do Next.js:**
```bash
pm2 logs rotafinal --lines 100
```

#### **3. Verificar porta do Next.js:**
```bash
# Verificar ecosystem.config.js
cat /var/www/rotafinal.com.br/ecosystem.config.js | grep PORT

# Verificar processo em execução
netstat -tlnp | grep node
```

**IMPORTANTE:** O `nginx.conf` deve apontar para a mesma porta do `ecosystem.config.js`:
- Se `ecosystem.config.js` tem `PORT: 3000` → nginx usa `localhost:3000`
- Se `ecosystem.config.js` tem `PORT: 3001` → nginx usa `localhost:3001`

#### **4. Verificar se Next.js está respondendo:**
```bash
# Testar diretamente (sem nginx)
curl -I http://localhost:3000/_next/static/css/7e7d96b1e6991756.css

# Se funcionar direto mas não via nginx, problema é no nginx
# Se não funcionar direto, problema é no Next.js
```

#### **5. Verificar permissões:**
```bash
# Verificar se o Next.js tem acesso aos arquivos
ls -la /var/www/rotafinal.com.br/.next/static/

# Verificar usuário do PM2
pm2 info rotafinal | grep user
```

## ✅ Checklist Final

Após aplicar as correções, verificar:

- [ ] Nginx configurado com nova configuração simplificada
- [ ] Nginx testado (`nginx -t`) sem erros
- [ ] Nginx recarregado (`systemctl reload nginx`)
- [ ] Next.js rodando via PM2 (`pm2 list`)
- [ ] Arquivos estáticos existem em `.next/static/`
- [ ] Porta do nginx corresponde à porta do Next.js
- [ ] `curl -I` retorna 200 OK para arquivos estáticos
- [ ] Console do navegador sem erros 400
- [ ] Site carrega completamente

## 📝 Notas Importantes

1. **A nova configuração do nginx NÃO adiciona headers** para `/_next/static/` - deixa o Next.js fazer isso via `next.config.js`

2. **Isso evita conflitos** porque:
   - Nginx não interfere com Content-Type
   - Next.js define headers corretamente
   - Sem headers duplicados

3. **O middleware já está correto** - faz bypass para `/_next/static/`

4. **Se mudar a porta do Next.js**, atualizar `nginx.conf` também

## 🚀 Próximos Passos

Após aplicar as correções:
1. Monitorar logs por alguns minutos
2. Testar em diferentes navegadores
3. Verificar se não há mais erros 400 no console
4. Confirmar que o site carrega completamente

