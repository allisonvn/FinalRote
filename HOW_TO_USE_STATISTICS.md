# Como Usar a Biblioteca de Estatísticas no Seu Sistema

## 🎯 Uso Rápido

### 1. Analisar um Teste A/B
```typescript
import { analyzeExperiment } from '@/lib/statistics'

// Dados do seu teste
const analysis = analyzeExperiment(
  5000,  // visitantes_controle
  500,   // conversoes_controle
  5000,  // visitantes_variante
  600,   // conversoes_variante
  0.95   // confidence_level (95%)
)

// Resultado
console.log(analysis)
// {
//   controlRate: 10,
//   variantRate: 12,
//   uplift: 20,
//   zScore: 2.8284,
//   pValue: 0.0047,
//   isSignificant: true,
//   significance: 95,
//   interpretation: {
//     winner: 'variant',
//     message: 'Variante venceu com 95% de confiança. Uplift: 20.00%',
//     recommendation: 'Implementar a variante vencedora'
//   }
// }
```

### 2. Decidir Baseado em Dados
```typescript
if (analysis.isSignificant) {
  // ✅ Teste concluído
  implementWinner(analysis.interpretation.winner)
} else {
  // ⏳ Continue o teste
  console.log(analysis.interpretation.recommendation)
  // Output: "Continue o teste (p-value: 0.1234)"
}
```

## 📊 Exemplos Práticos

### Exemplo 1: Checkout Otimizado
```typescript
// Seu e-commerce
const checkout = analyzeExperiment(
  10000,  // visitantes vendo checkout original
  1500,   // fizeram compra (15%)
  10000,  // visitantes vendo checkout novo
  1800,   // fizeram compra (18%)
  0.95
)

// Resultado: Uplift de 20%, significativo ✅
// → Implementar novo checkout
```

### Exemplo 2: Mudança de Cor
```typescript
// Teste inconclusivo
const buttonColor = analyzeExperiment(
  500,   // visitantes vendo botão original
  50,    // clicaram (10%)
  500,   // visitantes vendo botão novo
  56,    // clicaram (11.2%)
  0.95
)

// Resultado: P-value = 0.34, NÃO significativo
// → Continue o teste, precisa de mais dados
```

### Exemplo 3: Precisão Maior
```typescript
// Você quer 99% de confiança
const highConfidence = analyzeExperiment(
  5000,  // visitantes
  500,   // conversoes
  5000,  // visitantes
  600,   // conversoes
  0.99   // 99% confiança, não 95%
)

// Mesmo resultado? Depende do p-value
// Se p-value = 0.0047:
//   ✅ Significativo em 99% também
// Se p-value = 0.008:
//   ❌ NÃO significativo em 99%
```

## 🔢 Cálculos Específicos

### Teste Direto (sem interpretação)
```typescript
import { twoProportionsZTest } from '@/lib/statistics'

const test = twoProportionsZTest(500, 5000, 600, 5000)
// {
//   zScore: 2.8284,
//   pValue: 0.0047,
//   effect: 0.02,
//   isSignificant: (confidence) => boolean
// }

// Testar manualmente
if (test.isSignificant(0.95)) {
  console.log('Significativo em 95%')
}
if (test.isSignificant(0.99)) {
  console.log('Significativo em 99%')
}
```

### Calcular Tamanho de Amostra
```typescript
import { calculateSampleSize } from '@/lib/statistics'

// Quanto dados você precisa?
const n = calculateSampleSize(
  0.10,   // Taxa atual: 10%
  0.15,   // Espera melhorar 15%
  0.95,   // Com 95% confiança
  0.80    // E 80% poder
)

console.log(`Precisa ${n} visitantes por variante`)
// Output: Precisa 2102 visitantes por variante
// Total: 4204 visitantes (controle + variante)
```

### Função CDF Normal
```typescript
import { normCDF } from '@/lib/statistics'

// Probabilidade de Z < 1.96
const prob = normCDF(1.96)
console.log(prob)  // 0.975 (97.5%)

// Isso é usado internamente para calcular p-value
```

## 🎨 Integração no Dashboard

### No Overview (Listagem)
```typescript
// Já está implementado! Usa analyzeExperiment automaticamente
// A coluna "Significância" agora mostra:
// - Resultado de p-value real
// - ✅ Quando significativo
// - ⏳ Quando inconclusivo
```

### No Modal de Detalhes
```typescript
// Pronto para usar:
const analysis = analyzeExperiment(
  experiment.control.visitors,
  experiment.control.conversions,
  experiment.variant.visitors,
  experiment.variant.conversions,
  experiment.confidence_level || 0.95
)

// Exibir no modal:
- P-value: ${analysis.pValue.toFixed(4)}
- Z-score: ${analysis.zScore.toFixed(2)}
- Recomendação: ${analysis.interpretation.recommendation}
```

## 📈 Interpretação dos Resultados

### ✅ Significativo
```
P-value < α (onde α = 1 - confidence_level)
Exemplo: p-value = 0.03, α = 0.05
✅ 0.03 < 0.05 → SIGNIFICATIVO
```
**Ação**: Implementar variante vencedora

### ❌ NÃO Significativo
```
P-value ≥ α
Exemplo: p-value = 0.08, α = 0.05
❌ 0.08 > 0.05 → NÃO SIGNIFICATIVO
```
**Ação**: Continue o teste

### ⚠️ Marginal
```
P-value próximo a α
Exemplo: p-value = 0.055, α = 0.05
⚠️ Próximo, mas ainda > 0.05
```
**Ação**: Continue o teste ou aumente confiança

## 🎓 Guia de Decisão

```
┌─────────────────────────────────┐
│   Resultado do Teste A/B        │
└─────────────────────────────────┘
        │
        ├─→ analysis.isSignificant?
        │
        ├─ SIM ──┐
        │        └──→ Qual variante é melhor?
        │            ├─ Variante A → Implementar A
        │            └─ Variante B → Implementar B
        │
        └─ NÃO ──┐
                 └──→ Tempo para continuar?
                     ├─ Sim, continue
                     └─ Não, termine sem vencedor
```

## 💡 Dicas Importantes

1. **Sempre comece pequeno**
   - Comece com 95% de confiança
   - Se conclusivo, ótimo!
   - Se inconclusivo, continue coletando dados

2. **Tamanho de amostra importa**
   - Use `calculateSampleSize()` antes
   - Saiba quantos dados precisa
   - Evite decisões prematuras

3. **Interprete corretamente**
   - P-value não é probabilidade de ser verdadeiro
   - É probabilidade de resultado por acaso
   - Menor p-value = mais confiança

4. **Contexto é importante**
   - 20% de uplift em 100 visitantes ≠ 20% em 10.000
   - Use o tamanho de amostra
   - Verifique a duração do teste

5. **Respeite o tempo**
   - Um teste de 1 dia é diferente de 1 semana
   - Padrões semanais podem distorcer
   - Recolha dados suficientes

## 🚀 Próximas Melhorias

Implementações futuras:
- [ ] UI mostrando p-value em tempo real
- [ ] Gráfico de evolução da significância
- [ ] Alertas automáticos quando significativo
- [ ] Recomendação de parar teste
- [ ] Histórico de todos os testes

## ❓ Perguntas Frequentes

**P: Por que não usar 99% de confiança sempre?**
R: Quanto maior a confiança, mais dados você precisa. 95% é padrão na indústria.

**P: Como sei se o tamanho de amostra é suficiente?**
R: Use `calculateSampleSize()`. Se já passou, você tem dados suficientes.

**P: Posso mudar confidence_level no meio do teste?**
R: Tecnicamente sim, mas não é recomendado (problema de múltiplas comparações).

**P: O que significa Z-score = 2.8284?**
R: Significa 2.8 desvios padrão de diferença. Maior Z = mais significativo.

**P: P-value = 0.05 é bom?**
R: É o limite. Não é significativo em 95%. Recomenda-se p-value < 0.05.
