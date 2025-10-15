#!/bin/bash

# Script de teste para verificar conversões

echo "🔍 Testando conversões do experimento..."
echo ""

# Obter o ID do experimento (substitua pelo ID real)
EXPERIMENT_ID="${1:-}"

if [ -z "$EXPERIMENT_ID" ]; then
  echo "❌ Erro: Forneça o ID do experimento como argumento"
  echo "Uso: ./test-conversions.sh <experiment_id>"
  exit 1
fi

BASE_URL="http://localhost:3000"
VISITOR_ID="test_visitor_$(date +%s)"

echo "📝 Dados do teste:"
echo "   Experiment ID: $EXPERIMENT_ID"
echo "   Visitor ID: $VISITOR_ID"
echo "   Base URL: $BASE_URL"
echo ""

# Teste 1: Assignment
echo "1️⃣ Testando Assignment..."
ASSIGNMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/experiments/$EXPERIMENT_ID/assign" \
  -H "Content-Type: application/json" \
  -d "{
    \"visitor_id\": \"$VISITOR_ID\",
    \"user_agent\": \"Test Script\",
    \"url\": \"https://example.com/test\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }")

echo "$ASSIGNMENT_RESPONSE"

# Extrair variant_id
VARIANT_ID=$(echo "$ASSIGNMENT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""
echo "✅ Variant ID: $VARIANT_ID"
echo ""

# Teste 2: Conversão
echo "2️⃣ Testando Conversão..."
CONVERSION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/track" \
  -H "Content-Type: application/json" \
  -d "{
    \"experiment_id\": \"$EXPERIMENT_ID\",
    \"visitor_id\": \"$VISITOR_ID\",
    \"variant_id\": \"$VARIANT_ID\",
    \"event_type\": \"conversion\",
    \"value\": 100,
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }")

echo "$CONVERSION_RESPONSE"
echo ""

echo "✅ Teste concluído! Verifique o console do servidor para ver os logs."
