#!/bin/bash

# Script de Validação para Produção - RotaFinal
# Execute antes de fazer deploy

set -e

echo "🔍 Validando ambiente para produção..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

# Função para verificar
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
  fi
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  ((WARNINGS++))
}

# 1. Verificar se o build passa
echo "📦 Verificando build..."
npm run build > /dev/null 2>&1
check "Build do Next.js passa sem erros"

# 2. Verificar arquivos TypeScript corrigidos
echo ""
echo "📝 Verificando arquivos corrigidos..."

if grep -q "visitors: number" src/types/index.ts; then
  echo -e "${GREEN}✅ Schema TypeScript atualizado (MetricSnapshot)${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Schema TypeScript não está atualizado${NC}"
  ((FAILED++))
fi

if grep -q "get_experiment_stats" src/hooks/useSupabaseExperiments.ts; then
  echo -e "${GREEN}✅ Hook useSupabaseExperiments usando RPC correto${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Hook não está usando RPC correto${NC}"
  ((FAILED++))
fi

if grep -q "refresh_experiment_metrics" src/components/analytics/ExperimentMetrics.tsx; then
  echo -e "${GREEN}✅ ExperimentMetrics usando função correta${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ ExperimentMetrics não está atualizado${NC}"
  ((FAILED++))
fi

# 3. Verificar variáveis de ambiente
echo ""
echo "🔐 Verificando variáveis de ambiente..."

if [ -f ".env.local" ]; then
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && \
     grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local && \
     grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
    echo -e "${GREEN}✅ Variáveis de ambiente locais configuradas${NC}"
    ((PASSED++))
  else
    warn "Arquivo .env.local existe mas faltam variáveis"
  fi
else
  warn "Arquivo .env.local não encontrado (OK se usando Vercel)"
fi

# 4. Verificar vercel.json
echo ""
echo "☁️  Verificando configuração Vercel..."

if [ -f "vercel.json" ]; then
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" vercel.json && \
     grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" vercel.json && \
     grep -q "SUPABASE_SERVICE_ROLE_KEY" vercel.json; then
    echo -e "${GREEN}✅ vercel.json configurado com variáveis corretas${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ vercel.json faltando variáveis de ambiente${NC}"
    ((FAILED++))
  fi
else
  echo -e "${RED}❌ vercel.json não encontrado${NC}"
  ((FAILED++))
fi

# 5. Verificar package.json
echo ""
echo "📦 Verificando dependências..."

if grep -q "@supabase/supabase-js" package.json; then
  echo -e "${GREEN}✅ Supabase JS instalado${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Supabase JS não está no package.json${NC}"
  ((FAILED++))
fi

# 6. Verificar se há arquivos de teste que devem ser ignorados
echo ""
echo "🧹 Verificando arquivos desnecessários..."

if [ -f "test-analytics-fix.html" ]; then
  warn "Arquivo de teste test-analytics-fix.html presente (pode ser removido)"
fi

# 7. Verificar Git
echo ""
echo "🔀 Verificando Git..."

if git diff --quiet HEAD; then
  echo -e "${GREEN}✅ Todas as mudanças commitadas${NC}"
  ((PASSED++))
else
  warn "Há mudanças não commitadas"
fi

# Resumo
echo ""
echo "════════════════════════════════════════"
echo "📊 RESUMO DA VALIDAÇÃO"
echo "════════════════════════════════════════"
echo -e "✅ Passou: ${GREEN}$PASSED${NC}"
echo -e "❌ Falhou: ${RED}$FAILED${NC}"
echo -e "⚠️  Avisos: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 TUDO OK! Pronto para deploy em produção!${NC}"
  echo ""
  echo "Execute para fazer deploy:"
  echo "  git push origin main"
  echo ""
  echo "Ou use Vercel CLI:"
  echo "  vercel --prod"
  exit 0
else
  echo -e "${RED}⚠️  ATENÇÃO: Há $FAILED problema(s) que devem ser corrigidos antes do deploy!${NC}"
  echo ""
  echo "Revise os erros acima e corrija antes de fazer deploy."
  exit 1
fi

