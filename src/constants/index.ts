export const APP_NAME = 'Rota Final'
export const APP_DESCRIPTION = 'Plataforma profissional de teste A/B com Multi-Armed Bandit'

export const ROLES = {
  OWNER: 'owner' as const,
  ADMIN: 'admin' as const,
  EDITOR: 'editor' as const,
  VIEWER: 'viewer' as const,
}

export const EXPERIMENT_STATUS = {
  DRAFT: 'draft' as const,
  RUNNING: 'running' as const,
  PAUSED: 'paused' as const,
  COMPLETED: 'completed' as const,
}

export const ALGORITHMS = {
  UNIFORM: 'uniform' as const,
  THOMPSON_SAMPLING: 'thompson_sampling' as const,
  UCB1: 'ucb1' as const,
  EPSILON_GREEDY: 'epsilon_greedy' as const,
}

export const EVENT_TYPES = {
  PAGE_VIEW: 'page_view' as const,
  CLICK: 'click' as const,
  CONVERSION: 'conversion' as const,
  CUSTOM: 'custom' as const,
}

export const MAB_CONFIG = {
  COLD_START_VISITORS: 2000,
  MIN_CONVERSIONS_PER_VARIANT: 1000,
  CONFIDENCE_THRESHOLD: 0.95,
  EXPLORATION_FLOOR: 0.1,
  MAX_EXPERIMENT_DAYS: 30,
}