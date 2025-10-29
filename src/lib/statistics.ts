/**
 * Biblioteca de funções estatísticas para testes A/B
 * Implementa teste de proporções com cálculo de p-value
 */

/**
 * Aproximação da CDF (Cumulative Distribution Function) da distribuição normal padrão
 * Usa método de Wichura para alta precisão
 * @param z - valor z
 * @returns P(Z <= z)
 */
export function normCDF(z: number): number {
  // Constantes para approximação
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  // Garantir que z é positivo para usar simetria
  const sign = z < 0 ? -1 : 1
  z = Math.abs(z) / Math.sqrt(2)

  // Approximação de Wichura
  const t = 1.0 / (1.0 + p * z)
  const y =
    1.0 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t *
      Math.exp(-z * z))

  return 0.5 * (1.0 + sign * y)
}

/**
 * Calcula o p-value para teste de duas proporções (teste de proporções)
 * H0: p1 = p2 (não há diferença)
 * H1: p1 ≠ p2 (há diferença) - teste bicaudal
 */
export function twoProportionsZTest(
  x1: number, // conversões do controle
  n1: number, // visitantes do controle
  x2: number, // conversões da variante
  n2: number  // visitantes da variante
): {
  zScore: number
  pValue: number
  isSignificant: (confidenceLevel: number) => boolean
  effect: number // tamanho do efeito
} {
  // Validação
  if (n1 <= 0 || n2 <= 0 || x1 < 0 || x2 < 0 || x1 > n1 || x2 > n2) {
    return {
      zScore: 0,
      pValue: 1, // máxima incerteza
      isSignificant: () => false,
      effect: 0
    }
  }

  // Proporções observadas
  const p1 = x1 / n1
  const p2 = x2 / n2
  const effect = p2 - p1 // diferença de proporção

  // Proporção combinada (sob H0: p1 = p2)
  const p_combined = (x1 + x2) / (n1 + n2)

  // Erro padrão sob H0
  const se = Math.sqrt(p_combined * (1 - p_combined) * (1 / n1 + 1 / n2))

  // Z-score
  const zScore = se === 0 ? 0 : (p2 - p1) / se

  // P-value (teste bicaudal)
  const cdfValue = normCDF(zScore)
  const pValue = 2 * (1 - Math.max(cdfValue, 1 - cdfValue))

  return {
    zScore,
    pValue,
    isSignificant: (confidenceLevel: number = 0.95): boolean => {
      // Significativo se p-value < (1 - confidenceLevel)
      // Exemplo: confidenceLevel = 0.95 → p-value < 0.05
      const alpha = 1 - confidenceLevel
      return pValue < alpha
    },
    effect
  }
}

/**
 * Calcula significância e estatísticas completas para uma comparação
 */
export function analyzeExperiment(
  controlVisitors: number,
  controlConversions: number,
  variantVisitors: number,
  variantConversions: number,
  confidenceLevel: number = 0.95
) {
  const test = twoProportionsZTest(
    controlConversions,
    controlVisitors,
    variantConversions,
    variantVisitors
  )

  const controlRate = controlVisitors > 0 ? (controlConversions / controlVisitors) * 100 : 0
  const variantRate = variantVisitors > 0 ? (variantConversions / variantVisitors) * 100 : 0
  const uplift = controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0

  return {
    // Métricas básicas
    controlRate,
    variantRate,
    uplift,
    
    // Estatísticas
    zScore: test.zScore,
    pValue: test.pValue,
    effect: test.effect,
    
    // Interpretação
    isSignificant: test.isSignificant(confidenceLevel),
    confidenceLevel,
    confidencePercent: confidenceLevel * 100,
    
    // Para exibição
    significance: test.isSignificant(confidenceLevel) 
      ? (100 * confidenceLevel) 
      : Math.max(0, 100 * (1 - test.pValue)), // significância atual se não atinge confiança
    
    interpretation: {
      winner: 
        test.isSignificant(confidenceLevel) 
          ? (variantRate > controlRate ? 'variant' : 'control')
          : 'inconclusive',
      
      message: test.isSignificant(confidenceLevel)
        ? variantRate > controlRate
          ? `Variante venceu com ${(100 * confidenceLevel).toFixed(0)}% de confiança. Uplift: ${uplift.toFixed(2)}%`
          : `Controle venceu com ${(100 * confidenceLevel).toFixed(0)}% de confiança.`
        : `Teste ainda não é significativo. Atual: ${(100 * (1 - test.pValue)).toFixed(1)}% de confiança`,
      
      recommendation:
        test.isSignificant(confidenceLevel)
          ? 'Implementar a variante vencedora'
          : `Continue o teste (p-value: ${test.pValue.toFixed(4)})`
    }
  }
}

/**
 * Calcula o tamanho de amostra necessário para atingir confiança desejada
 */
export function calculateSampleSize(
  baselineRate: number, // taxa de conversão do controle
  expectedLift: number, // uplift esperado (0.1 = 10%)
  confidenceLevel: number = 0.95,
  power: number = 0.80
): number {
  // Usando fórmula de Lehr para dois grupos
  // n = 16 * (Z_alpha/2 + Z_beta)^2 / (lift)^2
  
  const zAlpha = Math.abs(normCDF(1 - (1 - confidenceLevel) / 2) - 0.5) / normCDF(0.5)
  const zBeta = Math.abs(normCDF(power) - 0.5) / normCDF(0.5)
  
  const effect = baselineRate * expectedLift
  const commonProportion = (baselineRate + (baselineRate + effect)) / 2
  
  const n = (2 * Math.pow(zAlpha + zBeta, 2) * commonProportion * (1 - commonProportion)) / 
            Math.pow(effect, 2)
  
  return Math.ceil(n)
}
