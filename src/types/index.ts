export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  organization_id: string
  org_id?: string // Alias para compatibilidade
  name: string
  description?: string
  status?: string
  public_key?: string
  secret_key?: string
  allowed_origins?: string[]
  created_at: string
  updated_at: string
}

export interface Experiment {
  id: string
  project_id: string
  name: string
  key?: string // Opcional - gerado automaticamente se não fornecido
  description?: string
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived'
  algorithm: 'uniform' | 'thompson_sampling' | 'ucb1' | 'epsilon_greedy'
  traffic_allocation: number
  target_url?: string
  conversion_url?: string
  conversion_type?: 'page_view' | 'click' | 'form_submit' | 'custom'
  conversion_value?: number
  duration_days?: number
  min_sample_size?: number
  created_at: string
  updated_at: string
  started_at?: string
  ended_at?: string
}

export interface Variant {
  id: string
  experiment_id: string
  name: string
  key?: string // Opcional - gerado automaticamente se não fornecido
  description?: string
  weight?: number // Obsoleto - usar traffic_percentage
  traffic_percentage: number
  is_control: boolean
  is_active: boolean
  config?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  experiment_id: string
  name: string
  key: string
  type: 'page_view' | 'click' | 'conversion' | 'custom'
  value_type: 'binary' | 'numeric'
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  experiment_id: string
  variant_id: string
  visitor_id: string
  context: Record<string, any>
  created_at: string
}

export interface Event {
  id: string
  project_id: string
  experiment_id?: string
  visitor_id: string
  event_type: string
  event_name: string
  properties: Record<string, any>
  value?: number
  created_at: string
}

export interface MetricSnapshot {
  id: string
  experiment_id: string
  variant_id: string | null
  visitors: number
  conversions: number
  conversion_rate: number
  snapshot_date: string
  created_at: string
}