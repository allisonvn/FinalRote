# Correção do Erro "Numeric Field Overflow"

## Problema Identificado

O erro `"numeric field overflow"` estava ocorrendo ao criar experimentos devido a:

1. **Campo inexistente**: O código tentava inserir um campo `weight` na tabela `variants`, mas o campo correto é `traffic_percentage`
2. **Precisão numérica inadequada**: Valores numéricos não estavam sendo formatados com a precisão adequada para os campos do banco
3. **Estrutura de dados desatualizada**: O código não estava alinhado com o schema atual do banco

## Problemas Corrigidos

### 1. Campo `weight` → `traffic_percentage`
```javascript
// ANTES (incorreto)
weight: Math.floor(100 / Math.max(1, experimentForm.variants.length)),

// DEPOIS (correto)
traffic_percentage: trafficPerVariant,
```

### 2. Precisão Numérica
```javascript
// ANTES (sem controle de precisão)
traffic_allocation: traffic,

// DEPOIS (com precisão controlada)
traffic_allocation: parseFloat(traffic.toFixed(2)), // Garantir precisão (5,2)
```

### 3. Cálculo de Traffic Percentage
```javascript
// ANTES (cálculo simples)
Math.floor(100 / Math.max(1, experimentForm.variants.length))

// DEPOIS (cálculo com precisão)
const variantsCount = experimentForm.variants.length || 1
const trafficPerVariant = parseFloat((100 / variantsCount).toFixed(2))
```

### 4. Campos do Schema Experiments
Adicionados campos obrigatórios que estavam faltando:
```javascript
const insertData: any = {
  name: experimentForm.name.trim(),
  description: experimentForm.description || null,
  traffic_allocation: parseFloat(traffic.toFixed(2)),
  type: 'redirect',      // Adicionado
  status: 'draft'        // Adicionado
}
```

### 5. Melhor Tratamento de Erros
```javascript
// Mensagens de erro mais informativas
toast.error(`Erro ao salvar experimento: ${expError.message || 'Erro desconhecido'}`)
```

## Estrutura do Banco

### Tabela `experiments`
- `traffic_allocation`: NUMERIC(5,2) - valores de 0.00 a 100.00
- `type`: ENUM('redirect', 'element', 'split_url', 'mab')
- `status`: ENUM('draft', 'running', 'paused', 'completed', 'archived')

### Tabela `variants`
- `traffic_percentage`: NUMERIC(5,2) - valores de 0.00 a 100.00
- `conversion_rate`: NUMERIC(10,6) - valores até 9999.999999%

## Como Testar

1. Acesse o dashboard
2. Clique em "Criar Experimento"
3. Preencha os dados básicos
4. Adicione pelo menos 2 variantes
5. Complete o wizard
6. Verifique se não há mais erros de "numeric field overflow"

## Prevenção Futura

- Sempre usar `parseFloat(value.toFixed(precision))` para campos numéricos
- Verificar o schema do banco antes de inserir dados
- Manter os tipos TypeScript atualizados com o schema real
- Adicionar validação de dados antes de enviar ao banco
