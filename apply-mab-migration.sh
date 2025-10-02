#!/bin/bash

# Script para aplicar migração dos algoritmos MAB
# Data: 02/10/2025

echo "🚀 Aplicando Migração dos Algoritmos MAB..."
echo ""

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado!"
    echo "📦 Instale com: npm install -g supabase"
    echo ""
    echo "OU aplique manualmente:"
    echo "1. Acesse o Dashboard do Supabase"
    echo "2. Vá para SQL Editor"
    echo "3. Cole o conteúdo de: supabase/migrations/20250102000000_add_mab_algorithms.sql"
    echo "4. Execute o SQL"
    exit 1
fi

echo "✅ Supabase CLI encontrado!"
echo ""

# Verificar se está em um projeto Supabase
if [ ! -f "supabase/config.toml" ]; then
    echo "⚠️  Não parece ser um projeto Supabase inicializado"
    echo "📝 Execute: supabase init"
    echo ""
    echo "OU aplique manualmente a migração:"
    echo "Arquivo: supabase/migrations/20250102000000_add_mab_algorithms.sql"
    exit 1
fi

echo "✅ Projeto Supabase detectado!"
echo ""

# Aplicar migração
echo "📝 Aplicando migração..."
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migração aplicada com sucesso!"
    echo ""
    echo "🎯 O que foi adicionado:"
    echo "  ✓ Coluna 'algorithm' na tabela 'experiments'"
    echo "  ✓ Tabela 'variant_stats' para estatísticas"
    echo "  ✓ Função 'increment_variant_visitors()'"
    echo "  ✓ Função 'increment_variant_conversions()'"
    echo "  ✓ Função 'get_experiment_stats()'"
    echo "  ✓ View 'experiment_stats_view'"
    echo ""
    echo "🚀 Próximos passos:"
    echo "  1. Reinicie o servidor Next.js"
    echo "  2. Crie um experimento com algoritmo MAB"
    echo "  3. Teste e veja a otimização em ação!"
    echo ""
    echo "📚 Documentação completa em:"
    echo "  - ALGORITMOS_MAB_IMPLEMENTADOS.md"
    echo "  - GUIA_RAPIDO_TESTE_AB.md"
    echo ""
else
    echo ""
    echo "❌ Erro ao aplicar migração!"
    echo ""
    echo "💡 Tente aplicar manualmente:"
    echo "  1. Copie o conteúdo de: supabase/migrations/20250102000000_add_mab_algorithms.sql"
    echo "  2. Acesse: https://supabase.com/dashboard"
    echo "  3. Vá para SQL Editor"
    echo "  4. Cole e execute o SQL"
    echo ""
    exit 1
fi

