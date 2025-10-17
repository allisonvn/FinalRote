# 🚀 Deploy Final - Servidor Próprio Next.js

## ✅ Status Atual

**Aplicação configurada e funcionando localmente!**

- ✅ Build executada com sucesso
- ✅ PM2 configurado e rodando
- ✅ Headers corretos (Content-Type: application/javascript)
- ✅ Cache configurado (max-age=31536000)
- ✅ Aplicação respondendo em localhost:3000

## 🎯 Próximos Passos para Produção

### **1. Configurar Nginx no Servidor**

#### **Copiar arquivo de configuração:**
```bash
# No seu servidor de produção
sudo cp nginx.conf /etc/nginx/sites-available/rotafinal
sudo ln -sf /etc/nginx/sites-available/rotafinal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### **Configuração Nginx (nginx.conf):**
```nginx
server {
    listen 80;
    server_name rotafinal.com.br www.rotafinal.com.br;
    
    # Configurações de MIME types para chunks JavaScript
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
    
    # Configurações para CSS
    location ~* \.css$ {
        add_header Content-Type "text/css; charset=utf-8";
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin "*";
        
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Configurações específicas para chunks do Next.js
    location ~* ^/_next/static/chunks/.*\.js$ {
        add_header Content-Type "application/javascript; charset=utf-8";
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin "*";
        
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Configurações para CSS do Next.js
    location ~* ^/_next/static/css/.*\.css$ {
        add_header Content-Type "text/css; charset=utf-8";
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin "*";
        
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy para todas as outras requisições
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **2. Deploy da Aplicação**

#### **No servidor de produção:**
```bash
# 1. Fazer upload dos arquivos
scp -r .next/ user@seu-servidor:/caminho/do/projeto/
scp package.json user@seu-servidor:/caminho/do/projeto/
scp ecosystem.config.js user@seu-servidor:/caminho/do/projeto/

# 2. No servidor, instalar dependências
cd /caminho/do/projeto
npm install --production

# 3. Instalar PM2 globalmente
npm install -g pm2

# 4. Iniciar aplicação
pm2 start ecosystem.config.js

# 5. Configurar para iniciar automaticamente
pm2 startup
pm2 save
```

### **3. Configurar Apache (Alternativa)**

Se usar Apache em vez de Nginx:

#### **Copiar .htaccess:**
```bash
# No servidor de produção
cp .htaccess /var/www/html/
```

#### **Habilitar módulos:**
```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod deflate
sudo systemctl restart apache2
```

## 🔍 Verificação da Correção

### **1. Testar Localmente (já funcionando)**
```bash
curl -I "http://localhost:3000/_next/static/chunks/webpack-fe5add3038793aee.js"

# Resultado esperado:
# HTTP/1.1 200 OK
# Content-Type: application/javascript; charset=UTF-8
# Cache-Control: public, max-age=31536000, immutable
```

### **2. Testar em Produção**
```bash
# Após configurar o servidor
curl -I "https://rotafinal.com.br/_next/static/chunks/webpack-fe5add3038793aee.js"

# Resultado esperado:
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

## 📊 Comparativo Antes vs Depois

### **ANTES (Erro)**
```
GET /_next/static/chunks/webpack-xxx.js
Status: 400 Bad Request
Content-Type: text/html
Resultado: ChunkLoadError
```

### **DEPOIS (Sucesso)**
```
GET /_next/static/chunks/webpack-xxx.js
Status: 200 OK
Content-Type: application/javascript; charset=utf-8
Cache-Control: public, max-age=31536000, immutable
Resultado: Chunk carregado com sucesso
```

## 🔧 Comandos de Gerenciamento

### **PM2 - Gerenciar Aplicação**
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

# Monitorar
pm2 monit
```

### **Nginx - Gerenciar Servidor**
```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo nginx -s reload

# Reiniciar
sudo systemctl restart nginx

# Status
sudo systemctl status nginx

# Logs
sudo tail -f /var/log/nginx/error.log
```

### **Apache - Gerenciar Servidor**
```bash
# Reiniciar
sudo systemctl restart apache2

# Status
sudo systemctl status apache2

# Logs
sudo tail -f /var/log/apache2/error.log
```

## 🎯 Checklist de Deploy

### **Pré-Deploy**
- [x] Build executada com sucesso
- [x] Chunks gerados corretamente
- [x] PM2 configurado
- [x] Aplicação rodando localmente
- [x] Headers corretos testados

### **Deploy**
- [ ] Arquivos enviados para servidor
- [ ] Dependências instaladas no servidor
- [ ] Nginx/Apache configurado
- [ ] PM2 iniciado no servidor
- [ ] Proxy reverso funcionando

### **Pós-Deploy**
- [ ] Aplicação acessível via domínio
- [ ] Chunks retornam status 200
- [ ] Content-Type correto
- [ ] Sem erros no console
- [ ] Navegação funcionando

## 🚨 Troubleshooting

### **Se ainda houver erro 400:**

#### **1. Verificar Nginx**
```bash
# Testar configuração
sudo nginx -t

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log

# Verificar se o site está habilitado
ls -la /etc/nginx/sites-enabled/
```

#### **2. Verificar PM2**
```bash
# Status da aplicação
pm2 status

# Logs da aplicação
pm2 logs rotafinal

# Reiniciar se necessário
pm2 restart rotafinal
```

#### **3. Verificar Proxy Reverso**
```bash
# Testar se o proxy está funcionando
curl -I http://localhost:3000/_next/static/chunks/webpack-*.js

# Se retornar 404, verificar configuração do proxy
```

#### **4. Verificar MIME Types**
```bash
# Forçar MIME type no Nginx
sudo nano /etc/nginx/sites-available/rotafinal

# Adicionar:
location ~* \.js$ {
    add_header Content-Type "application/javascript; charset=utf-8" always;
    proxy_pass http://localhost:3000;
}
```

## 📁 Arquivos Importantes

### **Para Deploy**
- `nginx.conf` - Configuração do Nginx
- `.htaccess` - Configuração do Apache
- `ecosystem.config.js` - Configuração do PM2
- `.next/` - Build da aplicação
- `package.json` - Dependências

### **Estrutura no Servidor**
```
/caminho/do/projeto/
├── nginx.conf              # Configuração Nginx
├── .htaccess               # Configuração Apache
├── ecosystem.config.js     # Configuração PM2
├── package.json            # Dependências
├── .next/                  # Build da aplicação
│   └── static/
│       ├── chunks/         # Chunks JavaScript
│       └── css/            # Arquivos CSS
└── logs/                   # Logs do PM2
```

## 🎉 Resultado Final

Após aplicar esta configuração:

✅ **Chunks carregam com status 200**  
✅ **MIME type correto** (application/javascript)  
✅ **CSS aplica corretamente** (text/css)  
✅ **Sem ChunkLoadError** no console  
✅ **Aplicação carrega normalmente**  
✅ **Performance otimizada** com cache de 1 ano  
✅ **Proxy reverso funcionando**  
✅ **PM2 gerenciando a aplicação**  

---

## 📞 Suporte

Se ainda houver problemas:

1. **Verificar logs do PM2**: `pm2 logs rotafinal`
2. **Verificar logs do Nginx**: `sudo tail -f /var/log/nginx/error.log`
3. **Testar proxy reverso**: `curl -I http://localhost:3000/_next/static/chunks/webpack-*.js`
4. **Verificar configuração**: `sudo nginx -t`
5. **Reiniciar serviços**: `pm2 restart rotafinal && sudo systemctl restart nginx`

---

**Status**: ✅ CONFIGURAÇÃO COMPLETA E TESTADA  
**Pronto para Deploy**: 🚀 SIM  
**Aplicação Local**: ✅ FUNCIONANDO  
**Próximo Passo**: Deploy no servidor de produção
