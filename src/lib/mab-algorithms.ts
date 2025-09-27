// Multi-Armed Bandit Algorithms para Rota Final
// Implementações otimizadas para produção

interface VariantStats {
  id: string
  key: string
  name: string
  visitors: number
  conversions: number
  revenue: number
  weight?: number
  is_control: boolean
}

interface MABResult {
  selectedVariant: VariantStats
  score: number
  algorithm: string
  confidence?: number
}

// Cache para evitar recálculos
const algorithmCache = new Map<string, { result: MABResult; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minuto

export class MABAlgorithms {

  // Thompson Sampling - Bayesian approach
  static thompsonSampling(variants: VariantStats[], options: { priorAlpha?: number; priorBeta?: number } = {}): MABResult {
    const { priorAlpha = 1, priorBeta = 1 } = options

    const cacheKey = `thompson_${JSON.stringify(variants.map(v => ({ id: v.id, visitors: v.visitors, conversions: v.conversions })))}`
    const cached = algorithmCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result
    }

    const sampledVariants = variants.map(variant => {
      const alpha = variant.conversions + priorAlpha
      const beta = variant.visitors - variant.conversions + priorBeta

      // Beta distribution sampling using Johnk's algorithm
      const sample = this.betaSample(alpha, beta)

      return {
        ...variant,
        score: sample
      }
    })

    const selected = sampledVariants.reduce((best, current) =>
      current.score > best.score ? current : best
    )

    const result: MABResult = {
      selectedVariant: selected,
      score: selected.score,
      algorithm: 'thompson_sampling'
    }

    algorithmCache.set(cacheKey, { result, timestamp: Date.now() })
    return result
  }

  // Upper Confidence Bound (UCB1)
  static ucb1(variants: VariantStats[], options: { confidenceLevel?: number } = {}): MABResult {
    const { confidenceLevel = 2 } = options

    const cacheKey = `ucb1_${JSON.stringify(variants.map(v => ({ id: v.id, visitors: v.visitors, conversions: v.conversions })))}`
    const cached = algorithmCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result
    }

    const totalVisitors = variants.reduce((sum, v) => sum + v.visitors, 0)

    // Evitar divisão por zero
    if (totalVisitors === 0) {
      const randomVariant = variants[Math.floor(Math.random() * variants.length)]
      return {
        selectedVariant: randomVariant,
        score: 0,
        algorithm: 'ucb1'
      }
    }

    const ucbVariants = variants.map(variant => {
      const visitors = Math.max(variant.visitors, 1) // Evitar log(0)
      const conversionRate = variant.visitors > 0 ? variant.conversions / variant.visitors : 0

      // UCB1 formula
      const exploration = Math.sqrt((confidenceLevel * Math.log(totalVisitors)) / visitors)
      const score = conversionRate + exploration

      return {
        ...variant,
        score
      }
    })

    const selected = ucbVariants.reduce((best, current) =>
      current.score > best.score ? current : best
    )

    const result: MABResult = {
      selectedVariant: selected,
      score: selected.score,
      algorithm: 'ucb1',
      confidence: this.calculateConfidence(selected.conversions, selected.visitors)
    }

    algorithmCache.set(cacheKey, { result, timestamp: Date.now() })
    return result
  }

  // Epsilon Greedy
  static epsilonGreedy(variants: VariantStats[], options: { epsilon?: number; decay?: boolean } = {}): MABResult {
    const { epsilon = 0.1, decay = true } = options

    const totalVisitors = variants.reduce((sum, v) => sum + v.visitors, 0)

    // Decaimento do epsilon com o tempo (menos exploração com mais dados)
    const adjustedEpsilon = decay && totalVisitors > 0
      ? epsilon * Math.pow(0.95, Math.floor(totalVisitors / 1000))
      : epsilon

    // Exploração vs Exploração
    if (Math.random() < adjustedEpsilon) {
      // Exploração: escolher variante aleatória
      const randomVariant = variants[Math.floor(Math.random() * variants.length)]
      return {
        selectedVariant: randomVariant,
        score: Math.random(),
        algorithm: 'epsilon_greedy'
      }
    } else {
      // Exploração: escolher melhor variante
      const greedyVariants = variants.map(variant => ({
        ...variant,
        score: variant.visitors > 0 ? variant.conversions / variant.visitors : 0
      }))

      const selected = greedyVariants.reduce((best, current) =>
        current.score > best.score ? current : best
      )

      return {
        selectedVariant: selected,
        score: selected.score,
        algorithm: 'epsilon_greedy'
      }
    }
  }

  // Uniform Random (A/B Testing clássico)
  static uniform(variants: VariantStats[]): MABResult {
    const weights = variants.map(v => v.weight || 1)
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)

    let random = Math.random() * totalWeight
    let selectedIndex = 0

    for (let i = 0; i < weights.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        selectedIndex = i
        break
      }
    }

    return {
      selectedVariant: variants[selectedIndex],
      score: 1 / variants.length,
      algorithm: 'uniform'
    }
  }

  // Contextual Bandit (básico)
  static contextual(variants: VariantStats[], context: { device?: string; location?: string; timeOfDay?: string } = {}): MABResult {
    // Implementação básica que considera contexto
    // Em produção, usaria machine learning mais sofisticado

    const contextWeights = {
      mobile: { boost: 1.1, penalty: 0.9 },
      desktop: { boost: 1.0, penalty: 1.0 },
      morning: { boost: 1.05, penalty: 0.95 },
      evening: { boost: 0.95, penalty: 1.05 }
    }

    const adjustedVariants = variants.map(variant => {
      let adjustment = 1.0

      // Ajustar baseado no dispositivo
      if (context.device === 'mobile' && variant.key.includes('mobile')) {
        adjustment *= contextWeights.mobile.boost
      }

      // Ajustar baseado no horário
      if (context.timeOfDay === 'morning' && variant.key.includes('morning')) {
        adjustment *= contextWeights.morning.boost
      }

      const baseScore = variant.visitors > 0 ? variant.conversions / variant.visitors : 0

      return {
        ...variant,
        score: baseScore * adjustment
      }
    })

    const selected = adjustedVariants.reduce((best, current) =>
      current.score > best.score ? current : best
    )

    return {
      selectedVariant: selected,
      score: selected.score,
      algorithm: 'contextual'
    }
  }

  // Utilidades

  // Amostragem da distribuição Beta usando algoritmo de Johnk
  private static betaSample(alpha: number, beta: number): number {
    if (alpha <= 0 || beta <= 0) return 0

    // Para casos especiais
    if (alpha === 1 && beta === 1) return Math.random()

    // Algoritmo de Johnk para amostragem Beta
    let u1, u2, x, y
    do {
      u1 = Math.random()
      u2 = Math.random()
      x = Math.pow(u1, 1 / alpha)
      y = Math.pow(u2, 1 / beta)
    } while (x + y > 1)

    return x / (x + y)
  }

  // Calcular nível de confiança estatística
  private static calculateConfidence(conversions: number, visitors: number): number {
    if (visitors === 0) return 0

    const p = conversions / visitors
    const se = Math.sqrt((p * (1 - p)) / visitors)

    // Z-score para 95% de confiança
    const zScore = 1.96
    const marginOfError = zScore * se

    // Retornar confiança como percentual
    return Math.min(95, Math.max(0, (1 - marginOfError) * 100))
  }

  // Limpar cache (útil para testes)
  static clearCache(): void {
    algorithmCache.clear()
  }

  // Obter estatísticas de cache
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: algorithmCache.size,
      entries: Array.from(algorithmCache.keys())
    }
  }
}

// Factory function para facilitar uso
export function selectVariant(
  variants: VariantStats[],
  algorithm: string = 'thompson_sampling',
  options: any = {},
  context: any = {}
): MABResult {
  switch (algorithm) {
    case 'thompson_sampling':
      return MABAlgorithms.thompsonSampling(variants, options)

    case 'ucb1':
      return MABAlgorithms.ucb1(variants, options)

    case 'epsilon_greedy':
      return MABAlgorithms.epsilonGreedy(variants, options)

    case 'contextual':
      return MABAlgorithms.contextual(variants, context)

    case 'uniform':
    default:
      return MABAlgorithms.uniform(variants)
  }
}

// Função para análise de performance dos algoritmos
export function analyzeAlgorithmPerformance(variants: VariantStats[]) {
  const results = {
    thompson_sampling: MABAlgorithms.thompsonSampling(variants),
    ucb1: MABAlgorithms.ucb1(variants),
    epsilon_greedy: MABAlgorithms.epsilonGreedy(variants),
    uniform: MABAlgorithms.uniform(variants)
  }

  return {
    results,
    recommendations: {
      best_for_exploration: 'epsilon_greedy',
      best_for_exploitation: 'ucb1',
      best_overall: 'thompson_sampling',
      safest: 'uniform'
    }
  }
}

export default MABAlgorithms