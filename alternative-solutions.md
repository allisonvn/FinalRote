# Soluções Alternativas para traffic_allocation

## ✅ Solução 1: Constraint Corrigido (IMPLEMENTADA)
- **Alteração**: Constraint alterado de `<= 99.99` para `<= 100.00`
- **Vantagem**: Mantém a precisão decimal e permite valor 100%
- **Status**: ✅ Implementada e funcionando

## 🔄 Opção 2: Usar INTEGER (0-100)
```sql
-- Migração para alterar tipo
ALTER TABLE experiments 
ALTER COLUMN traffic_allocation TYPE INTEGER 
USING ROUND(traffic_allocation);

-- Novo constraint
ALTER TABLE experiments 
ADD CONSTRAINT experiments_traffic_allocation_check 
CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100);
```

```typescript
// Nova função em numeric-utils.ts
export function safeTrafficAllocationInt(value: any, defaultValue: number = 100): number {
  const num = parseInt(value) || defaultValue;
  return Math.min(Math.max(num, 1), 100);
}
```

**Vantagens:**
- Sem problemas de precisão decimal
- Mais simples para o usuário (1-100%)
- Menor uso de espaço

**Desvantagens:**
- Perde precisão decimal (99.5% vira 100%)

## 🔄 Opção 3: Usar REAL/FLOAT
```sql
-- Migração para alterar tipo
ALTER TABLE experiments 
ALTER COLUMN traffic_allocation TYPE REAL;

-- Constraint mais simples
ALTER TABLE experiments 
ADD CONSTRAINT experiments_traffic_allocation_check 
CHECK (traffic_allocation >= 0.0 AND traffic_allocation <= 100.0);
```

```typescript
// Nova função
export function safeTrafficAllocationFloat(value: any, defaultValue: number = 100.0): number {
  const num = parseFloat(value) || defaultValue;
  return Math.min(Math.max(num, 1.0), 100.0);
}
```

**Vantagens:**
- Maior flexibilidade
- Sem problemas de overflow
- Suporte a decimais

**Desvantagens:**
- Possíveis problemas de arredondamento
- Menos preciso que NUMERIC

## 🔄 Opção 4: Usar VARCHAR com Validação
```sql
-- Migração para alterar tipo
ALTER TABLE experiments 
ALTER COLUMN traffic_allocation TYPE VARCHAR(6);

-- Constraint com regex
ALTER TABLE experiments 
ADD CONSTRAINT experiments_traffic_allocation_check 
CHECK (traffic_allocation ~ '^(100\.00|[1-9]?\d(\.\d{1,2})?)$');
```

```typescript
// Nova função com validação de string
export function safeTrafficAllocationString(value: any, defaultValue: string = "100.00"): string {
  const str = String(value);
  const num = parseFloat(str);
  
  if (isNaN(num) || num < 1 || num > 100) {
    return defaultValue;
  }
  
  return num.toFixed(2);
}
```

**Vantagens:**
- Controle total sobre formato
- Flexibilidade máxima
- Sem problemas numéricos

**Desvantagens:**
- Mais complexo
- Precisa conversão para cálculos

## 🎯 Recomendação

A **Solução 1** (constraint corrigido) é a melhor porque:
1. ✅ Resolve o problema imediatamente
2. ✅ Mantém a estrutura existente
3. ✅ Preserva a precisão decimal
4. ✅ Compatível com o valor padrão do banco (100.00)
5. ✅ Menor impacto no código existente

## 🧪 Como Testar Outras Soluções

Se quiser implementar uma das alternativas:

1. **Para Integer**: Faça backup → Aplique migração → Atualize funções
2. **Para Float**: Menos mudanças, apenas tipo e constraint
3. **Para String**: Maior refatoração, mas máxima flexibilidade

Todas as soluções resolvem o problema, mas diferem em complexidade e compatibilidade.
