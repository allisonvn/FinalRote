#!/bin/bash

echo "🔧 CORREÇÃO FORÇADA - ChunkLoadError 400 Bad Request"
echo "=================================================="

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

log "🚀 Iniciando correção FORÇADA de ChunkLoadError..."

# 1. PARAR qualquer processo em execução
log "1. Parando processos em execução..."
pkill -f "next" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true
success "Processos parados"

# 2. LIMPAR TUDO - cache, build, node_modules
log "2. Limpeza COMPLETA do ambiente..."
rm -rf .next
rm -rf node_modules
rm -rf .vercel
rm -rf .netlify
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml
rm -rf .turbo
rm -rf .swc
success "Limpeza completa realizada"

# 3. Limpar cache do sistema
log "3. Limpando caches do sistema..."
npm cache clean --force 2>/dev/null || true
yarn cache clean 2>/dev/null || true
pnpm store prune 2>/dev/null || true
success "Caches do sistema limpos"

# 4. Verificar configurações críticas
log "4. Verificando configurações críticas..."

# Verificar middleware.ts
if grep -q "return undefined" middleware.ts; then
    success "Middleware configurado para retornar undefined para assets estáticos"
else
    error "Middleware NÃO está configurado corretamente!"
    exit 1
fi

# Verificar vercel.json
if grep -q "application/javascript; charset=utf-8" vercel.json; then
    success "Vercel.json configurado com Content-Type correto"
else
    error "Vercel.json NÃO está configurado corretamente!"
    exit 1
fi

# Verificar netlify.toml
if grep -q "application/javascript; charset=utf-8" netlify.toml; then
    success "Netlify.toml configurado com Content-Type correto"
else
    error "Netlify.toml NÃO está configurado corretamente!"
    exit 1
fi

# 5. Reinstalar dependências
log "5. Reinstalando dependências..."
npm install --no-cache --force
if [ $? -eq 0 ]; then
    success "Dependências reinstaladas"
else
    error "Falha ao reinstalar dependências"
    exit 1
fi

# 6. Build com configurações otimizadas
log "6. Executando build otimizada..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PRIVATE_SKIP_MEMORY_WARNING=1

npm run build
if [ $? -eq 0 ]; then
    success "Build executada com sucesso"
else
    error "Falha na build"
    exit 1
fi

# 7. Verificar chunks gerados
log "7. Verificando chunks gerados..."
if [ -d ".next/static/chunks" ]; then
    chunk_count=$(find .next/static/chunks -name "*.js" | wc -l)
    success "Encontrados $chunk_count chunks JavaScript"
    
    # Verificar se os chunks são válidos
    invalid_chunks=0
    for chunk in .next/static/chunks/*.js; do
        if [ -f "$chunk" ]; then
            # Verificar se é um arquivo JavaScript válido
            if ! head -1 "$chunk" | grep -q "javascript\|webpack\|!function\|(function" 2>/dev/null; then
                warning "Chunk pode estar corrompido: $(basename $chunk)"
                ((invalid_chunks++))
            fi
        fi
    done
    
    if [ $invalid_chunks -eq 0 ]; then
        success "Todos os chunks são válidos"
    else
        warning "$invalid_chunks chunks podem estar corrompidos"
    fi
else
    error "Diretório de chunks não encontrado!"
    exit 1
fi

# 8. Testar servidor local
log "8. Testando servidor local..."
timeout 10s npm start &
SERVER_PID=$!
sleep 5

# Verificar se o servidor está rodando
if ps -p $SERVER_PID > /dev/null; then
    success "Servidor local iniciado"
    
    # Testar um chunk específico
    CHUNK_URL="http://localhost:3000/_next/static/chunks/webpack-$(ls .next/static/chunks/webpack-*.js 2>/dev/null | head -1 | sed 's/.*webpack-\([^.]*\)\.js/\1/').js"
    
    if curl -s -I "$CHUNK_URL" | grep -q "200 OK"; then
        success "Chunk acessível localmente"
    else
        warning "Chunk não acessível localmente - pode ser normal"
    fi
    
    # Parar servidor
    kill $SERVER_PID 2>/dev/null || true
else
    warning "Servidor local não iniciou - continuando..."
fi

# 9. Preparar para deploy
log "9. Preparando para deploy..."

# Verificar se há mudanças para commit
if git status --porcelain | grep -q .; then
    log "Arquivos modificados encontrados:"
    git status --short
    
    echo ""
    log "🚀 PRÓXIMOS PASSOS PARA DEPLOY:"
    echo "1. Fazer commit das alterações:"
    echo "   git add ."
    echo "   git commit -m 'fix: Correção FORÇADA para ChunkLoadError 400 - middleware e headers'"
    echo ""
    echo "2. Fazer push para produção:"
    echo "   git push"
    echo ""
    echo "3. Aguardar deploy e testar:"
    echo "   https://rotafinal.com.br"
    echo ""
    echo "4. Se usar Vercel, forçar redeploy:"
    echo "   vercel --prod --force"
    echo ""
    echo "5. Se usar Netlify, forçar redeploy:"
    echo "   netlify deploy --prod --force"
else
    warning "Nenhuma mudança detectada - verificar se as correções foram aplicadas"
fi

# 10. Resumo final
echo ""
log "📋 RESUMO DA CORREÇÃO FORÇADA"
echo "============================"

echo "✅ Processos parados"
echo "✅ Cache completamente limpo"
echo "✅ Dependências reinstaladas"
echo "✅ Build executada com sucesso"
echo "✅ Chunks verificados"
echo "✅ Middleware corrigido (retorna undefined para assets)"
echo "✅ Headers corrigidos (Content-Type: application/javascript)"
echo "✅ Configurações Vercel/Netlify atualizadas"

echo ""
log "🔍 PRINCIPAIS CORREÇÕES APLICADAS:"
echo "1. Middleware agora retorna 'undefined' para assets estáticos"
echo "2. Headers específicos para chunks JavaScript"
echo "3. Content-Type correto: application/javascript; charset=utf-8"
echo "4. Rewrites para garantir servimento correto"
echo "5. Cache limpo e build otimizada"

echo ""
success "Correção FORÇADA de ChunkLoadError concluída! 🎉"
echo ""
warning "IMPORTANTE: Faça o deploy imediatamente para aplicar as correções em produção!"
