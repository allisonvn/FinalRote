# 🖥️ Guia Completo - Servidor Próprio Next.js

## 🔍 Problema Identificado

Seu servidor próprio não está configurado para servir os assets estáticos do Next.js com os **MIME types corretos**, causando:

- ❌ Status 400 Bad Request
- ❌ MIME type: `text/html` (deveria ser `application/javascript`)
- ❌ Chunks não carregam
- ❌ CSS não aplica

## 🎯 Solução: Configuração de Servidor

### **Opção 1: Apache (Recomendado)**

#### 1. **Arquivo `.htaccess`** (já criado)

```apache
# Configurações de MIME types para assets do Next.js
<FilesMatch "\.(js|mjs)$">
    Header set Content-Type "application/javascript; charset=utf-8"
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

<FilesMatch "\.css$">
    Header set Content-Type "text/css; charset=utf-8"
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# Configurações específicas para chunks do Next.js
<LocationMatch "^/_next/static/chunks/.*\.js$">
    Header set Content-Type "application/javascript; charset=utf-8"
    Header set Cache-Control "public, max-age=31536000, immutable"
    Header set Access-Control-Allow-Origin "*"
</LocationMatch>
```

#### 2. **Habilitar Módulos Apache**

```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod deflate
sudo systemctl restart apache2
```

### **Opção 2: Nginx**

#### 1. **Arquivo `nginx.conf`** (já criado)

```nginx
# Configurações de MIME types
location ~* \.(js|mjs)$ {
    add_header Content-Type "application/javascript; charset=utf-8";
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header Access-Control-Allow-Origin "*";
    
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### 2. **Aplicar Configuração**

```bash
sudo cp nginx.conf /etc/nginx/sites-available/rotafinal
sudo ln -sf /etc/nginx/sites-available/rotafinal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🚀 Deploy Automático

### **Executar Script de Configuração**

```bash
cd /Users/allisonnascimento/Desktop/site/rotafinal
./setup-server-proprio.sh
```

Este script irá:
1. ✅ Detectar seu servidor web (Apache/Nginx)
2. ✅ Fazer build da aplicação
3. ✅ Configurar MIME types corretos
4. ✅ Configurar PM2 para produção
5. ✅ Configurar proxy reverso
6. ✅ Iniciar a aplicação

## 🔧 Configuração Manual

### **1. Build da Aplicação**

```bash
cd /Users/allisonnascimento/Desktop/site/rotafinal

# Limpar e fazer build
rm -rf .next
npm run build

# Verificar se os chunks foram gerados
ls -la .next/static/chunks/
```

### **2. Configurar PM2**

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start npm --name "rotafinal" -- start

# Configurar para iniciar automaticamente
pm2 startup
pm2 save
```

### **3. Configurar Proxy Reverso**

#### **Apache (.htaccess)**
```apache
# Redirecionar para Node.js
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# Assets estáticos do Next.js
RewriteCond %{REQUEST_URI} ^/_next/static/
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

#### **Nginx**
```nginx
# Proxy para Node.js
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 📊 Verificação da Correção

### **1. Testar Localmente**

```bash
# Iniciar aplicação
npm start

# Testar em outro terminal
curl -I http://localhost:3000/_next/static/chunks/webpack-*.js

# Deve retornar:
# HTTP/1.1 200 OK
# Content-Type: application/javascript; charset=utf-8
```

### **2. Testar em Produção**

```bash
# Testar chunks
curl -I https://rotafinal.com.br/_next/static/chunks/webpack-*.js

# Deve retornar:
# HTTP/2 200
# content-type: application/javascript; charset=utf-8
# cache-control: public, max-age=31536000, immutable
```

### **3. Verificar no Navegador**

1. Abrir: `https://rotafinal.com.br`
2. F12 → Network
3. Filtrar por `JS`
4. Verificar:
   - ✅ Status 200
   - ✅ Content-Type: application/javascript
   - ✅ Sem erros no console

## 🔍 Troubleshooting

### **Se ainda houver erro 400:**

#### **1. Verificar Módulos Apache**
```bash
# Verificar se os módulos estão habilitados
apache2ctl -M | grep -E "(rewrite|headers|deflate)"

# Habilitar se necessário
sudo a2enmod rewrite headers deflate
sudo systemctl restart apache2
```

#### **2. Verificar Configuração Nginx**
```bash
# Testar configuração
sudo nginx -t

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log
```

#### **3. Verificar PM2**
```bash
# Status da aplicação
pm2 status

# Logs da aplicação
pm2 logs rotafinal

# Reiniciar se necessário
pm2 restart rotafinal
```

#### **4. Verificar Proxy Reverso**
```bash
# Testar se o proxy está funcionando
curl -I https://rotafinal.com.br/_next/static/chunks/webpack-*.js

# Se retornar 404, verificar configuração do proxy
```

### **Se MIME type ainda estiver incorreto:**

#### **1. Forçar Headers no Apache**
```apache
# Adicionar no .htaccess
<FilesMatch "\.js$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
</FilesMatch>
```

#### **2. Forçar Headers no Nginx**
```nginx
# Adicionar no nginx.conf
location ~* \.js$ {
    add_header Content-Type "application/javascript; charset=utf-8" always;
    proxy_pass http://localhost:3000;
}
```

## 📁 Estrutura de Arquivos

```
rotafinal/
├── .htaccess              # Configuração Apache
├── nginx.conf             # Configuração Nginx
├── ecosystem.config.js    # Configuração PM2
├── setup-server-proprio.sh # Script de configuração
├── .next/                 # Build da aplicação
│   └── static/
│       ├── chunks/        # Chunks JavaScript
│       └── css/           # Arquivos CSS
└── logs/                  # Logs do PM2
```

## 🎯 Comandos Úteis

### **Gerenciar Aplicação**
```bash
# Status
pm2 status

# Logs
pm2 logs rotafinal

# Reiniciar
pm2 restart rotafinal

# Parar
pm2 stop rotafinal

# Iniciar
pm2 start rotafinal
```

### **Gerenciar Servidor Web**
```bash
# Apache
sudo systemctl restart apache2
sudo systemctl status apache2

# Nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

### **Verificar Logs**
```bash
# Logs do Apache
sudo tail -f /var/log/apache2/error.log

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Logs da aplicação
pm2 logs rotafinal
```

## 🎉 Resultado Esperado

Após aplicar esta configuração:

✅ **Chunks carregam com status 200**  
✅ **MIME type correto** (application/javascript)  
✅ **CSS aplica corretamente** (text/css)  
✅ **Sem ChunkLoadError** no console  
✅ **Aplicação carrega normalmente**  
✅ **Performance otimizada** com cache de 1 ano  

---

## 📞 Suporte

Se ainda houver problemas:

1. **Verificar logs do servidor web**
2. **Verificar logs do PM2**
3. **Testar proxy reverso**
4. **Verificar permissões de arquivo**
5. **Confirmar que a aplicação está rodando na porta 3000**

---

**Status**: ✅ Configuração Completa para Servidor Próprio  
**Pronto para Deploy**: 🚀 SIM  
**Suporte**: Apache + Nginx + PM2
