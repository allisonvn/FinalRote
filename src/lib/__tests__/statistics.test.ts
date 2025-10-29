/**
 * Testes para funções estatísticas de A/B testing
 * Demonstra como o sistema calcula significância real
 */

import {
  normCDF,
  twoProportionsZTest,
  analyzeExperiment,
  calculateSampleSize,
} from '../statistics'

console.log('=== TESTES DE SIGNIFICÂNCIA ESTATÍSTICA ===\n')

// ============================================
// CENÁRIO 1: Teste com dados inconclusivos
// ============================================
console.log('📊 CENÁRIO 1: Dados inconclusivos (tamanho pequeno)')
console.log('Controle: 50 visitantes, 5 conversões (10%)')
console.log('Variante: 50 visitantes, 7 conversões (14%)')

const test1 = analyzeExperiment(50, 5, 50, 7, 0.95)
console.log(`\nResultado:`)
console.log(`  - Taxa de controle: ${test1.controlRate.toFixed(2)}%`)
console.log(`  - Taxa de variante: ${test1.variantRate.toFixed(2)}%`)
console.log(`  - Uplift: ${test1.uplift.toFixed(2)}%`)
console.log(`  - Z-score: ${test1.zScore.toFixed(4)}`)
console.log(`  - P-value: ${test1.pValue.toFixed(4)} (${(test1.pValue * 100).toFixed(2)}%)`)
console.log(`  - É significativo (95% confiança)? ${test1.isSignificant ? '✅ SIM' : '❌ NÃO'}`)
console.log(`  - Recomendação: ${test1.interpretation.recommendation}`)

// ============================================
// CENÁRIO 2: Teste com muitos dados (significativo)
// ============================================
console.log('\n\n📊 CENÁRIO 2: Dados conclusivos (tamanho grande)')
console.log('Controle: 5000 visitantes, 500 conversões (10%)')
console.log('Variante: 5000 visitantes, 600 conversões (12%)')

const test2 = analyzeExperiment(5000, 500, 5000, 600, 0.95)
console.log(`\nResultado:`)
console.log(`  - Taxa de controle: ${test2.controlRate.toFixed(2)}%`)
console.log(`  - Taxa de variante: ${test2.variantRate.toFixed(2)}%`)
console.log(`  - Uplift: ${test2.uplift.toFixed(2)}%`)
console.log(`  - Z-score: ${test2.zScore.toFixed(4)}`)
console.log(`  - P-value: ${test2.pValue.toFixed(4)} (${(test2.pValue * 100).toFixed(2)}%)`)
console.log(`  - É significativo (95% confiança)? ${test2.isSignificant ? '✅ SIM' : '❌ NÃO'}`)
console.log(`  - Vencedor: ${test2.interpretation.winner === 'variant' ? '🎉 Variante' : '🎉 Controle' || 'Inconclusivo'}`)
console.log(`  - Recomendação: ${test2.interpretation.recommendation}`)

// ============================================
// CENÁRIO 3: Teste com confiança 99%
// ============================================
console.log('\n\n📊 CENÁRIO 3: Teste com 99% de confiança')
console.log('Controle: 5000 visitantes, 500 conversões (10%)')
console.log('Variante: 5000 visitantes, 600 conversões (12%)')

const test3 = analyzeExperiment(5000, 500, 5000, 600, 0.99)
console.log(`\nResultado:`)
console.log(`  - Taxa de controle: ${test3.controlRate.toFixed(2)}%`)
console.log(`  - Taxa de variante: ${test3.variantRate.toFixed(2)}%`)
console.log(`  - Uplift: ${test3.uplift.toFixed(2)}%`)
console.log(`  - É significativo (99% confiança)? ${test3.isSignificant ? '✅ SIM' : '❌ NÃO'}`)
console.log(`  - Recomendação: ${test3.interpretation.recommendation}`)

// ============================================
// CENÁRIO 4: Calcular tamanho de amostra
// ============================================
console.log('\n\n📊 CENÁRIO 4: Tamanho de amostra necessário')
console.log('Taxa baseline: 10% (0.10)')
console.log('Uplift esperado: 15% (0.15)')
console.log('Confiança: 95%')
console.log('Power: 80%')

const sampleSize = calculateSampleSize(0.10, 0.15, 0.95, 0.80)
console.log(`\nResultado:`)
console.log(`  - Visitantes por variante: ${sampleSize.toLocaleString()}`)
console.log(`  - Total (controle + variante): ${(sampleSize * 2).toLocaleString()}`)
console.log(`  - Interpretação: Você precisa de ${sampleSize.toLocaleString()} visitantes por variante para detectar um uplift de 15%`)

// ============================================
// CENÁRIO 5: Teste estatístico básico
// ============================================
console.log('\n\n📊 CENÁRIO 5: Teste estatístico direto')
console.log('Controle: 1000 visitantes, 100 conversões')
console.log('Variante: 1000 visitantes, 120 conversões')

const directTest = twoProportionsZTest(100, 1000, 120, 1000)
console.log(`\nResultado:`)
console.log(`  - Z-score: ${directTest.zScore.toFixed(4)}`)
console.log(`  - P-value: ${directTest.pValue.toFixed(4)}`)
console.log(`  - Significativo em 95%? ${directTest.isSignificant(0.95) ? '✅ SIM' : '❌ NÃO'}`)
console.log(`  - Significativo em 90%? ${directTest.isSignificant(0.90) ? '✅ SIM' : '❌ NÃO'}`)
console.log(`  - Significativo em 99%? ${directTest.isSignificant(0.99) ? '✅ SIM' : '❌ NÃO'}`)

// ============================================
// RESUMO DE INTERPRETAÇÃO
// ============================================
console.log('\n\n=== RESUMO E INTERPRETAÇÃO ===\n')
console.log('P-value é a probabilidade de observar os dados (ou mais extremo) se não houvesse diferença.')
console.log('')
console.log('Exemplo de interpretação:')
console.log('  - P-value = 0.02 (2%): Há 2% de chance de esse resultado acontecer por acaso.')
console.log('    → Com 95% de confiança (α=0.05), É SIGNIFICATIVO ✅')
console.log('')
console.log('  - P-value = 0.08 (8%): Há 8% de chance de esse resultado acontecer por acaso.')
console.log('    → Com 95% de confiança (α=0.05), NÃO é significativo ❌')
console.log('    → Com 90% de confiança (α=0.10), É significativo ✅')
console.log('')
console.log('Regra: Se p-value < (1 - confidence_level), então é significativo.')
