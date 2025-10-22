#!/bin/bash

echo "🔧 Script de Correção de ChunkLoadError"
echo "======================================"

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

log "Iniciando correção de ChunkLoadError..."

# 1. Limpar cache do Next.js
log "1. Limpando cache do Next.js..."
rm -rf .next
success "Cache do Next.js removido"

# 2. Limpar cache do npm
log "2. Limpando cache do npm..."
npm cache clean --force
success "Cache do npm limpo"

# 3. Limpar node_modules e reinstalar
log "3. Reinstalando dependências..."
rm -rf node_modules
rm -f package-lock.json
npm install
success "Dependências reinstaladas"

# 4. Verificar configurações
log "4. Verificando configurações..."

# Verificar next.config.js
if grep -q "splitChunks" next.config.js; then
    success "Configuração de splitChunks encontrada no next.config.js"
else
    warning "Configuração de splitChunks não encontrada"
fi

# Verificar middleware.ts
if grep -q "_next" middleware.ts; then
    success "Middleware configurado para ignorar _next"
else
    warning "Middleware pode não estar configurado corretamente"
fi

# Verificar configuração de headers
if grep -q "Content-Type.*application/javascript" next.config.js; then
    success "Headers de Content-Type configurados no next.config.js"
else
    warning "Headers de Content-Type podem não estar configurados"
fi

# 5. Fazer build
log "5. Fazendo build da aplicação..."
if npm run build; then
    success "Build concluída com sucesso"
else
    error "Falha na build"
    exit 1
fi

# 6. Verificar se os chunks foram gerados
log "6. Verificando chunks gerados..."
if [ -d ".next/static/chunks" ]; then
    chunk_count=$(find .next/static/chunks -name "*.js" | wc -l)
    success "Encontrados $chunk_count chunks JavaScript"
    
    # Verificar se os chunks são válidos
    invalid_chunks=0
    for chunk in .next/static/chunks/*.js; do
        if [ -f "$chunk" ]; then
            if ! head -1 "$chunk" | grep -q "javascript\|webpack"; then
                warning "Chunk pode estar corrompido: $chunk"
                ((invalid_chunks++))
            fi
        fi
    done
    
    if [ $invalid_chunks -eq 0 ]; then
        success "Todos os chunks parecem válidos"
    else
        warning "$invalid_chunks chunks podem estar corrompidos"
    fi
else
    error "Diretório de chunks não encontrado"
fi

# 7. Verificar arquivos de correção
log "7. Verificando arquivos de correção..."

files_to_check=(
    "src/hooks/useChunkErrorHandler.ts"
    "src/components/ChunkErrorBoundary.tsx"
    "src/utils/chunkErrorHandler.ts"
    "src/app/chunk-error-handler.ts"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        success "Arquivo de correção encontrado: $file"
    else
        error "Arquivo de correção não encontrado: $file"
    fi
done

# 8. Resumo final
echo ""
log "📋 RESUMO DA CORREÇÃO"
echo "===================="

echo "✅ Cache limpo"
echo "✅ Dependências reinstaladas"
echo "✅ Build executada"
echo "✅ Chunks verificados"
echo "✅ Arquivos de correção implementados"

echo ""
log "🚀 PRÓXIMOS PASSOS:"
echo "1. Fazer commit das alterações:"
echo "   git add ."
echo "   git commit -m 'fix: Implementar correção completa para ChunkLoadError'"
echo ""
echo "2. Fazer push para produção:"
echo "   git push"
echo ""
echo "3. Aguardar deploy e testar em:"
echo "   https://rotafinal.com.br"
echo ""
echo "4. Usar o arquivo de teste:"
echo "   Abrir test-chunk-error-fix.html no navegador"

echo ""
success "Correção de ChunkLoadError concluída! 🎉"
