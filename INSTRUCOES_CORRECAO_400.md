# 🔧 Instruções para Corrigir Erros 400 em Produção

## Problema Identificado

Todos os arquivos estáticos do Next.js estão retornando **400 Bad Request**:
- `/_next/static/chunks/*.js` - 400
- `/_next/static/css/*.css` - 400

## Causa Raiz

A configuração do Nginx estava adicionando headers duplicados e conflitantes, causando erros 400 quando o Next.js tentava servir os arquivos.

## ✅ Solução Aplicada

### 1. Configuração Nginx Simplificada

A nova configuração (`nginx.conf`) foi simplificada para:
- **Remover headers duplicados** que causavam conflitos
- **Deixar o Next.js definir os Content-Type** corretamente
- **Proxy direto** para arquivos estáticos sem interferência

### 2. Arquivo `next.config.js` Atualizado

Headers corretos já foram adicionados no `next.config.js` para garantir Content-Type correto.

## 📋 Passos para Aplicar no Servidor

### **1. Fazer backup da configuração atual:**
```bash
sudo cp /etc/nginx/sites-available/rotafinal /etc/nginx/sites-available/rotafinal.backup
```

### **2. Copiar nova configuração:**
```bash
# No servidor de produção
sudo cp nginx.conf /etc/nginx/sites-available/rotafinal
```

### **3. Testar configuração:**
```bash
sudo nginx -t
```

### **4. Recarregar Nginx:**
```bash
sudo systemctl reload nginx
```

### **5. Verificar se o Next.js está rodando:**
```bash
# Verificar processo PM2
pm2 list

# Se não estiver rodando, iniciar:
cd /var/www/rotafinal.com.br
pm2 start ecosystem.config.js

# Verificar logs:
pm2 logs rotafinal
```

### **6. Verificar se os arquivos existem:**
```bash
# Verificar se o build foi feito
ls -la /var/www/rotafinal.com.br/.next/static/css/
ls -la /var/www/rotafinal.com.br/.next/static/chunks/

# Se não existirem, fazer build:
cd /var/www/rotafinal.com.br
npm run build
pm2 restart rotafinal
```

### **7. Testar no navegador:**
```bash
# Testar um arquivo CSS
curl -I https://rotafinal.com.br/_next/static/css/7e7d96b1e6991756.css

# Testar um chunk JS
curl -I https://rotafinal.com.br/_next/static/chunks/webpack-54d97ceab7ed6d40.js
```

**Resposta esperada:** `200 OK` com `Content-Type` correto

## 🔍 Troubleshooting

### Se ainda houver erros 400:

1. **Verificar logs do Nginx:**
```bash
sudo tail -f /var/log/nginx/error.log
```

2. **Verificar logs do Next.js:**
```bash
pm2 logs rotafinal
```

3. **Verificar se a porta está correta:**
```bash
# Verificar em qual porta o Next.js está rodando
netstat -tlnp | grep node

# Verificar ecosystem.config.js
cat /var/www/rotafinal.com.br/ecosystem.config.js
```

4. **Limpar cache do navegador:**
- Abrir DevTools (F12)
- Application → Storage → Clear site data
- Recarregar página (Ctrl+Shift+R)

## ✅ Verificação Final

Após aplicar as correções, verificar:

1. ✅ Nginx configurado corretamente
2. ✅ Next.js rodando na porta correta (3000)
3. ✅ Arquivos estáticos existem em `.next/static/`
4. ✅ Headers Content-Type corretos
5. ✅ Sem erros 400 no console do navegador

## 📝 Notas Importantes

- A nova configuração **não adiciona headers** para `/_next/static/` - deixa o Next.js fazer isso
- Isso evita conflitos e garante que os arquivos sejam servidos corretamente
- O `next.config.js` já tem os headers corretos configurados

