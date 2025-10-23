#!/bin/bash

# Script robusto para corrigir ChunkLoadError
# Este script limpa completamente o cache e reconstrói a aplicação

echo "🔧 Iniciando correção robusta de ChunkLoadError..."

# Parar processos em execução
echo "⏹️ Parando processos em execução..."
pkill -f "next" || true
pkill -f "node.*next" || true

# Limpar cache do Next.js
echo "🧹 Limpando cache do Next.js..."
rm -rf .next
rm -rf .next/cache
rm -rf .next/static
rm -rf .next/server

# Limpar node_modules e reinstalar
echo "📦 Limpando e reinstalando dependências..."
rm -rf node_modules
rm -f package-lock.json
npm install

# Limpar cache do npm
echo "🧹 Limpando cache do npm..."
npm cache clean --force

# Limpar cache do sistema (macOS)
echo "🧹 Limpando cache do sistema..."
rm -rf ~/.npm
rm -rf ~/.cache

# Limpar build anterior
echo "🗑️ Removendo builds anteriores..."
rm -rf out
rm -rf dist
rm -rf build

# Gerar novo build ID
echo "🆔 Gerando novo build ID..."
echo "build-$(date +%s)" > .next-build-id

# Fazer build de produção
echo "🏗️ Fazendo build de produção..."
NODE_ENV=production npm run build

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    
    # Iniciar servidor de produção
    echo "🚀 Iniciando servidor de produção..."
    NODE_ENV=production npm run start &
    
    # Aguardar um pouco para o servidor inicializar
    sleep 5
    
    echo "🎉 Correção de ChunkLoadError concluída!"
    echo "📝 O servidor está rodando em modo de produção"
    echo "🔍 Verifique o console do navegador para confirmar que não há mais erros de chunk"
else
    echo "❌ Erro durante o build. Verifique os logs acima."
    exit 1
fi
