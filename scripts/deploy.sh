#!/bin/bash

# Script de deploy com limpeza de cache

echo "🔧 Limpando cache local..."
rm -rf .next
rm -rf node_modules/.cache

echo "🏗️ Compilando aplicação..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build realizado com sucesso!"
  echo "🚀 Pronto para deploy!"
  echo ""
  echo "Próximos passos:"
  echo "  1. git add ."
  echo "  2. git commit -m 'Deploy: Correção de chunk loading'"
  echo "  3. git push"
  echo ""
  echo "⏳ O Vercel/Netlify iniciará o deploy automaticamente"
else
  echo "❌ Erro durante o build!"
  exit 1
fi
