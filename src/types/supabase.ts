export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'editor' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          public_key: string
          secret_key: string
          allowed_origins: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          public_key: string
          secret_key: string
          allowed_origins?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          public_key?: string
          secret_key?: string
          allowed_origins?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      experiments: {
        Row: {
          id: string
          project_id: string
          name: string
          key: string
          description: string | null
          status: 'draft' | 'running' | 'paused' | 'completed'
          algorithm: 'uniform' | 'thompson_sampling' | 'ucb1' | 'epsilon_greedy'
          traffic_allocation: number
          created_at: string
          updated_at: string
          started_at: string | null
          ended_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          key: string
          description?: string | null
          status?: 'draft' | 'running' | 'paused' | 'completed'
          algorithm?: 'uniform' | 'thompson_sampling' | 'ucb1' | 'epsilon_greedy'
          traffic_allocation?: number
          created_at?: string
          updated_at?: string
          started_at?: string | null
          ended_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          key?: string
          description?: string | null
          status?: 'draft' | 'running' | 'paused' | 'completed'
          algorithm?: 'uniform' | 'thompson_sampling' | 'ucb1' | 'epsilon_greedy'
          traffic_allocation?: number
          created_at?: string
          updated_at?: string
          started_at?: string | null
          ended_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_member: {
        Args: {
          org_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}