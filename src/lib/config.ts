// Configurações de produção para rotafinal.com.br

export const config = {
  // URLs base
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://rotafinal.com.br'
    : 'http://localhost:3000',

  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.rotafinal.com.br'
    : 'http://localhost:3000/api',

  // URLs de assets (sem CDN externa)
  assetsUrl: process.env.NODE_ENV === 'production'
    ? 'https://rotafinal.com.br/assets'
    : '/assets',

  // Configurações de domínio
  domain: process.env.NODE_ENV === 'production'
    ? 'rotafinal.com.br'
    : 'localhost',

  // URLs da aplicação
  app: {
    dashboard: '/dashboard',
    experiments: '/dashboard/experiments',
    newExperiment: '/dashboard/experiments/new',
    settings: '/dashboard/settings',
    analytics: '/dashboard/analytics',
  },

  // Configurações de autenticação
  auth: {
    loginUrl: '/auth/login',
    signupUrl: '/auth/signup',
    callbackUrl: '/auth/callback',
    redirectAfterLogin: '/dashboard',
  },

  // Configurações de SEO
  seo: {
    title: 'Rota Final - Plataforma de Testes A/B',
    description: 'Otimize suas conversões com testes A/B inteligentes e algoritmos Multi-Armed Bandit',
    keywords: 'teste ab, conversão, otimização, multi-armed bandit, analytics',
    ogImage: '/images/og-image.png',
  },

  // Configurações de analytics (internos, sem Google Analytics)
  analytics: {
    trackingEnabled: process.env.NODE_ENV === 'production',
    events: {
      experimentCreated: 'experiment_created',
      experimentStarted: 'experiment_started',
      experimentCompleted: 'experiment_completed',
      conversionTracked: 'conversion_tracked',
    }
  },

  // Limites da aplicação
  limits: {
    maxExperimentsPerUser: 50,
    maxVariantsPerExperiment: 10,
    maxEventsPerDay: 100000,
    maxFileUploadSize: 5 * 1024 * 1024, // 5MB
  },

  // Configurações de email (para notificações internas)
  email: {
    fromAddress: 'noreply@rotafinal.com.br',
    supportAddress: 'suporte@rotafinal.com.br',
  },

  // Configurações de pagamento (se aplicável)
  billing: {
    currency: 'BRL',
    plans: {
      free: { experiments: 3, events: 10000 },
      pro: { experiments: 25, events: 100000 },
      enterprise: { experiments: -1, events: -1 }, // ilimitado
    }
  },

  // Configurações de cache
  cache: {
    experimentMetrics: 300, // 5 minutos
    userStats: 600, // 10 minutos
    staticAssets: 86400, // 1 dia
  },

  // Configurações de backup e segurança
  security: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireMFA: false, // Pode ser habilitado no futuro
  }
}

// Função helper para construir URLs
export const buildUrl = (path: string, params?: Record<string, string>) => {
  const url = new URL(path, config.baseUrl)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  return url.toString()
}

// Função para verificar se estamos em produção
export const isProduction = () => process.env.NODE_ENV === 'production'

// Função para logs seguros (não loga dados sensíveis em produção)
export const safeLog = (message: string, data?: any) => {
  if (!isProduction()) {
    console.log(message, data)
  }
}

// Validação de URLs para experimentos
export const validateExperimentUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    // Em produção, só aceita URLs do próprio domínio
    if (isProduction()) {
      return urlObj.hostname === config.domain || urlObj.hostname.endsWith(`.${config.domain}`)
    }
    // Em desenvolvimento, aceita localhost
    return true
  } catch {
    return false
  }
}

export default config