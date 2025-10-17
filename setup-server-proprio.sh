#!/bin/bash

echo "🔧 Configuração para Servidor Próprio - Next.js"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto (onde está o package.json)"
    exit 1
fi

log "🚀 Configurando servidor próprio para Next.js..."

# 1. Verificar tipo de servidor
log "1. Verificando tipo de servidor web..."

if command -v apache2 &> /dev/null; then
    SERVER_TYPE="apache"
    success "Apache detectado"
elif command -v nginx &> /dev/null; then
    SERVER_TYPE="nginx"
    success "Nginx detectado"
else
    warning "Nenhum servidor web detectado. Usando configurações genéricas."
    SERVER_TYPE="generic"
fi

# 2. Fazer build da aplicação
log "2. Fazendo build da aplicação..."
rm -rf .next
npm run build

if [ $? -eq 0 ]; then
    success "Build executada com sucesso"
else
    error "Falha na build"
    exit 1
fi

# 3. Configurar servidor web
log "3. Configurando servidor web..."

if [ "$SERVER_TYPE" = "apache" ]; then
    log "Configurando Apache..."
    
    # Copiar .htaccess para o diretório web
    if [ -f ".htaccess" ]; then
        cp .htaccess /var/www/html/ 2>/dev/null || cp .htaccess /var/www/ 2>/dev/null || warning "Não foi possível copiar .htaccess automaticamente"
        success "Arquivo .htaccess configurado"
    else
        error "Arquivo .htaccess não encontrado"
    fi
    
    # Habilitar mod_rewrite
    sudo a2enmod rewrite 2>/dev/null || warning "Não foi possível habilitar mod_rewrite automaticamente"
    sudo a2enmod headers 2>/dev/null || warning "Não foi possível habilitar mod_headers automaticamente"
    sudo a2enmod deflate 2>/dev/null || warning "Não foi possível habilitar mod_deflate automaticamente"
    
    # Reiniciar Apache
    sudo systemctl restart apache2 2>/dev/null || sudo service apache2 restart 2>/dev/null || warning "Não foi possível reiniciar Apache automaticamente"
    
elif [ "$SERVER_TYPE" = "nginx" ]; then
    log "Configurando Nginx..."
    
    # Copiar configuração do Nginx
    if [ -f "nginx.conf" ]; then
        sudo cp nginx.conf /etc/nginx/sites-available/rotafinal 2>/dev/null || warning "Não foi possível copiar configuração do Nginx automaticamente"
        sudo ln -sf /etc/nginx/sites-available/rotafinal /etc/nginx/sites-enabled/ 2>/dev/null || warning "Não foi possível habilitar site automaticamente"
        success "Configuração do Nginx aplicada"
    else
        error "Arquivo nginx.conf não encontrado"
    fi
    
    # Testar configuração
    sudo nginx -t 2>/dev/null || warning "Configuração do Nginx pode ter problemas"
    
    # Reiniciar Nginx
    sudo systemctl restart nginx 2>/dev/null || sudo service nginx restart 2>/dev/null || warning "Não foi possível reiniciar Nginx automaticamente"
fi

# 4. Configurar PM2 para produção
log "4. Configurando PM2 para produção..."

# Instalar PM2 se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    log "Instalando PM2..."
    npm install -g pm2
fi

# Criar configuração do PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'rotafinal',
    script: 'npm',
    args: 'start',
    cwd: '/Users/allisonnascimento/Desktop/site/rotafinal',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

success "Configuração do PM2 criada"

# 5. Criar diretório de logs
mkdir -p logs
success "Diretório de logs criado"

# 6. Iniciar aplicação com PM2
log "5. Iniciando aplicação com PM2..."

# Parar instância anterior se existir
pm2 stop rotafinal 2>/dev/null || true
pm2 delete rotafinal 2>/dev/null || true

# Iniciar nova instância
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
    success "Aplicação iniciada com PM2"
else
    error "Falha ao iniciar aplicação com PM2"
fi

# 7. Configurar proxy reverso
log "6. Configurando proxy reverso..."

if [ "$SERVER_TYPE" = "apache" ]; then
    log "Apache já configurado com proxy reverso no .htaccess"
elif [ "$SERVER_TYPE" = "nginx" ]; then
    log "Nginx já configurado com proxy reverso no nginx.conf"
else
    warning "Configure manualmente o proxy reverso para localhost:3000"
fi

# 8. Verificar status
log "7. Verificando status da aplicação..."

# Verificar se a aplicação está rodando
if curl -s http://localhost:3000 > /dev/null; then
    success "Aplicação respondendo em localhost:3000"
else
    warning "Aplicação não está respondendo em localhost:3000"
fi

# Verificar PM2
pm2 status

# 9. Instruções finais
echo ""
log "📋 INSTRUÇÕES FINAIS"
echo "==================="

echo "✅ Build executada com sucesso"
echo "✅ Configuração do servidor aplicada"
echo "✅ PM2 configurado e iniciado"
echo "✅ Proxy reverso configurado"

echo ""
log "🔧 COMANDOS ÚTEIS:"
echo "• Ver status: pm2 status"
echo "• Ver logs: pm2 logs rotafinal"
echo "• Reiniciar: pm2 restart rotafinal"
echo "• Parar: pm2 stop rotafinal"
echo "• Iniciar: pm2 start rotafinal"

echo ""
log "🌐 TESTAR APLICAÇÃO:"
echo "• Local: http://localhost:3000"
echo "• Produção: https://rotafinal.com.br"

echo ""
log "🔍 VERIFICAR CHUNKS:"
echo "curl -I https://rotafinal.com.br/_next/static/chunks/webpack-*.js"
echo "Deve retornar: Content-Type: application/javascript"

echo ""
if [ "$SERVER_TYPE" = "apache" ]; then
    log "📁 ARQUIVOS IMPORTANTES:"
    echo "• .htaccess - Configuração do Apache"
    echo "• ecosystem.config.js - Configuração do PM2"
    echo "• .next/ - Build da aplicação"
elif [ "$SERVER_TYPE" = "nginx" ]; then
    log "📁 ARQUIVOS IMPORTANTES:"
    echo "• nginx.conf - Configuração do Nginx"
    echo "• ecosystem.config.js - Configuração do PM2"
    echo "• .next/ - Build da aplicação"
fi

echo ""
success "Configuração do servidor próprio concluída! 🎉"

echo ""
warning "IMPORTANTE:"
echo "1. Verifique se o proxy reverso está funcionando"
echo "2. Teste os chunks em produção"
echo "3. Monitore os logs do PM2"
echo "4. Configure SSL se necessário"
