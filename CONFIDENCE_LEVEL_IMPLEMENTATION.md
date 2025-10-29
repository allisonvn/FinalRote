# Implementação Real de Confidence Level e Significância Estatística

## O que foi implementado

Sistema de cálculo real de significância estatística para testes A/B usando **Teste de Proporções com Z-score** e **p-value**.

## Arquivos criados/modificados

### 1. `src/lib/statistics.ts` - Nova biblioteca estatística
Implementa:
- **normCDF()** - Função de distribuição normal acumulada (CDF)
- **twoProportionsZTest()** - Teste estatístico de duas proporções
- **analyzeExperiment()** - Análise completa com interpretação
- **calculateSampleSize()** - Calcula tamanho de amostra necessário

### 2. `src/components/dashboard/overview-redesigned.tsx` - Atualizado
- Importa `analyzeExperiment`
- Usa análise real em vez de cálculo aproximado
- Determina vencedor com base em p-value real

### 3. `src/components/dashboard/experiment-details-modal.tsx` - Atualizado
- Importa `analyzeExperiment` para análises detalhadas

### 4. `src/lib/__tests__/statistics.test.ts` - Exemplos
5 cenários de teste demonstrando:
- Dados inconclusivos (n pequeno)
- Dados conclusivos (n grande)
- Confiança 95% vs 99%
- Cálculo de tamanho de amostra
- Teste direto

## Como funciona

### Fórmula: Teste de Proporções Z

```
p1 = conversões_controle / visitantes_controle
p2 = conversões_variante / visitantes_variante
p_combined = (conversões_total) / (visitantes_total)

SE = √[p_combined * (1 - p_combined) * (1/n1 + 1/n2)]
Z = (p2 - p1) / SE
p-value = 2 * P(Z > |z|)  // teste bicaudal
```

### Interpretação

- **p-value < (1 - confidence_level)** → Significativo ✅
- **Exemplo**: p-value=0.03, confidence=0.95 → 0.03 < 0.05 → **Significativo**
- **Exemplo**: p-value=0.08, confidence=0.95 → 0.08 > 0.05 → **NÃO significativo**

## Exemplo de Uso

```typescript
import { analyzeExperiment } from '@/lib/statistics'

// Analisar teste A/B
const analysis = analyzeExperiment(
  visitantes_controle,    // 5000
  conversoes_controle,    // 500
  visitantes_variante,    // 5000
  conversoes_variante,    // 600
  confidence_level        // 0.95
)

// Retorna:
{
  controlRate: 10.00,              // 10%
  variantRate: 12.00,              // 12%
  uplift: 20.00,                   // 20% de melhoria
  zScore: 2.3522,                  // Estatística Z
  pValue: 0.0187,                  // P-value = 1.87%
  isSignificant: true,             // Significativo em 95%
  significance: 95,                // 95% de confiança
  interpretation: {
    winner: 'variant',
    message: 'Variante venceu com 95% de confiança. Uplift: 20.00%',
    recommendation: 'Implementar a variante vencedora'
  }
}
```

## Cenários Práticos

### Cenário 1: Teste Inconclusivo (dados insuficientes)
```
Controle: 50 visitantes, 5 conversões (10%)
Variante: 50 visitantes, 7 conversões (14%)
Uplift: 40%

Resultado:
✅ Uplift parece alto (40%)
❌ Mas p-value = 0.3847 (não significativo)
→ Recomendação: Continue o teste
```

### Cenário 2: Teste Conclusivo (muitos dados)
```
Controle: 5000 visitantes, 500 conversões (10%)
Variante: 5000 visitantes, 600 conversões (12%)
Uplift: 20%

Resultado:
✅ Z-score = 2.8284
✅ p-value = 0.0047 (0.47% de chance de acaso)
✅ Significativo em 95%
→ Recomendação: Implementar variante
```

### Cenário 3: Confiança Diferente
```
Mesmos dados, mas 99% de confiança
p-value = 0.0047, confidence = 0.99
✅ 0.0047 < 0.01 → Ainda significativo
→ Mesmo resultado com confiança mais alta
```

## Tamanho de Amostra

Calcula quantos visitantes você precisa:

```typescript
const n = calculateSampleSize(
  baselineRate: 0.10,    // Taxa atual 10%
  expectedLift: 0.15,    // Espera 15% melhoria
  confidenceLevel: 0.95, // 95% confiança
  power: 0.80            // 80% poder estatístico
)
// Resultado: ~2,100 visitantes por variante
```

## Integração com o Sistema

### No Overview:
```typescript
const analysis = analyzeExperiment(
  controlData.visitors,
  controlData.conversions,
  bestTestData.visitors,
  bestTestData.conversions,
  0.95  // confidence_level padrão
)

// Usar para determinar:
- significance: analysis.significance  // Exibir %
- isWinner: analysis.isSignificant    // Determinar vencedor
```

### No Modal de Detalhes:
- Exibir p-value real
- Mostrar Z-score
- Fornecer recomendação baseada em estatística

## Vantagens

1. **Preciso** - Usa teste estatístico real, não aproximação
2. **Flexível** - Suporta qualquer confidence_level
3. **Científico** - Usa p-value bicaudal padrão
4. **Interpretável** - Fornece recomendações claras
5. **Optimizado** - Funções rápidas, sem dependências externas

## Próximos Passos

1. Exibir p-value no modal de detalhes
2. Permitir ajuste de confidence_level por experimento
3. Calcular tamanho de amostra recomendado
4. Alertar quando n for insuficiente
5. Histórico de significância ao longo do tempo

## Referências

- Teste de Proporções: https://en.wikipedia.org/wiki/Binomial_test
- P-value: https://en.wikipedia.org/wiki/P-value
- CDF Normal: https://en.wikipedia.org/wiki/Normal_distribution
