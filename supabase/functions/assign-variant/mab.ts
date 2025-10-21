/**
 * Multi-Armed Bandit Algorithms for Edge Functions
 * Adaptado para Deno runtime
 */

export interface VariantStats {
  id: string
  name: string
  visitors: number
  conversions: number
  revenue: number
  traffic_percentage: number
  is_control: boolean
}

export interface MABResult {
  variantId: string
  score: number
  algorithm: string
}

/**
 * Thompson Sampling (Bayesian approach)
 * Usa distribuição Beta para modelar a probabilidade de conversão
 */
export function thompsonSampling(
  variants: VariantStats[],
  options: { priorAlpha?: number; priorBeta?: number } = {}
): MABResult {
  const { priorAlpha = 1, priorBeta = 1 } = options

  let bestVariant = variants[0]
  let bestSample = 0

  for (const variant of variants) {
    const alpha = priorAlpha + variant.conversions
    const beta = priorBeta + (variant.visitors - variant.conversions)

    // Sample from Beta distribution
    const sample = sampleBeta(alpha, beta)

    if (sample > bestSample) {
      bestSample = sample
      bestVariant = variant
    }
  }

  return {
    variantId: bestVariant.id,
    score: bestSample,
    algorithm: 'thompson_sampling'
  }
}

/**
 * Upper Confidence Bound (UCB1)
 * Balanceia exploitation vs exploration
 */
export function ucb1(
  variants: VariantStats[],
  options: { confidenceLevel?: number } = {}
): MABResult {
  const { confidenceLevel = 2 } = options

  const totalVisitors = variants.reduce((sum, v) => sum + v.visitors, 0)

  let bestVariant = variants[0]
  let bestScore = -Infinity

  for (const variant of variants) {
    if (variant.visitors === 0) {
      // Explore variants with no data first
      return {
        variantId: variant.id,
        score: Infinity,
        algorithm: 'ucb1'
      }
    }

    const conversionRate = variant.conversions / variant.visitors
    const explorationBonus = Math.sqrt(
      (confidenceLevel * Math.log(totalVisitors)) / variant.visitors
    )
    const score = conversionRate + explorationBonus

    if (score > bestScore) {
      bestScore = score
      bestVariant = variant
    }
  }

  return {
    variantId: bestVariant.id,
    score: bestScore,
    algorithm: 'ucb1'
  }
}

/**
 * Epsilon-Greedy
 * 90% exploitation (best variant), 10% exploration (random)
 */
export function epsilonGreedy(
  variants: VariantStats[],
  options: { epsilon?: number } = {}
): MABResult {
  const { epsilon = 0.1 } = options

  // Exploration: random variant
  if (Math.random() < epsilon) {
    const randomIndex = Math.floor(Math.random() * variants.length)
    return {
      variantId: variants[randomIndex].id,
      score: 0,
      algorithm: 'epsilon_greedy_explore'
    }
  }

  // Exploitation: best variant
  let bestVariant = variants[0]
  let bestRate = 0

  for (const variant of variants) {
    if (variant.visitors === 0) continue

    const conversionRate = variant.conversions / variant.visitors
    if (conversionRate > bestRate) {
      bestRate = conversionRate
      bestVariant = variant
    }
  }

  return {
    variantId: bestVariant.id,
    score: bestRate,
    algorithm: 'epsilon_greedy_exploit'
  }
}

/**
 * Uniform Distribution (A/B clássico)
 * Distribui tráfego baseado em traffic_percentage
 */
export function uniformDistribution(
  variants: VariantStats[],
  visitorId: string
): MABResult {
  // Deterministic hash-based selection
  const hash = hashCode(visitorId)
  const percentage = Math.abs(hash % 100)

  let cumulative = 0
  for (const variant of variants) {
    cumulative += variant.traffic_percentage
    if (percentage < cumulative) {
      return {
        variantId: variant.id,
        score: variant.traffic_percentage,
        algorithm: 'uniform'
      }
    }
  }

  // Fallback: first variant
  return {
    variantId: variants[0].id,
    score: variants[0].traffic_percentage,
    algorithm: 'uniform_fallback'
  }
}

/**
 * Sample from Beta distribution
 * Approximation using Gamma distribution
 */
function sampleBeta(alpha: number, beta: number): number {
  const x = sampleGamma(alpha, 1)
  const y = sampleGamma(beta, 1)
  return x / (x + y)
}

/**
 * Sample from Gamma distribution
 * Using Marsaglia and Tsang method
 */
function sampleGamma(shape: number, scale: number): number {
  if (shape < 1) {
    // Use Johnk's generator
    const c = 1 / shape
    let x, y
    do {
      x = Math.pow(Math.random(), c)
      y = Math.pow(Math.random(), 1 / (1 - shape))
    } while (x + y > 1)
    return sampleGamma(1 + shape, scale) * Math.pow(x / (x + y), 1 / shape)
  }

  // Marsaglia and Tsang method
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)

  while (true) {
    let x, v
    do {
      x = randomNormal()
      v = 1 + c * x
    } while (v <= 0)

    v = v * v * v
    const u = Math.random()

    if (u < 1 - 0.0331 * x * x * x * x) {
      return scale * d * v
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return scale * d * v
    }
  }
}

/**
 * Generate random number from standard normal distribution
 * Using Box-Muller transform
 */
function randomNormal(): number {
  const u1 = Math.random()
  const u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

/**
 * Hash code from string (deterministic)
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}
