export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          assigned_at: string
          experiment_id: string
          id: string
          variant_id: string
          visitor_id: string
        }
        Insert: {
          assigned_at?: string
          experiment_id: string
          id?: string
          variant_id: string
          visitor_id: string
        }
        Update: {
          assigned_at?: string
          experiment_id?: string
          id?: string
          variant_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiment_stats"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "assignments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          bucket: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          file_name: string | null
          id: string
          metadata: Json
          mime_type: string | null
          org_id: string
          path: string
          size_bytes: number | null
        }
        Insert: {
          bucket: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          file_name?: string | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          org_id: string
          path: string
          size_bytes?: number | null
        }
        Update: {
          bucket?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          org_id?: string
          path?: string
          size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: number
          org_id: string | null
          payload: Json
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: never
          org_id?: string | null
          payload?: Json
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: never
          org_id?: string | null
          payload?: Json
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          event_type: string | null
          experiment_id: string | null
          id: string
          utm_data: Json | null
          value: number | null
          variant_id: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          event_type?: string | null
          experiment_id?: string | null
          id?: string
          utm_data?: Json | null
          value?: number | null
          variant_id?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          event_type?: string | null
          experiment_id?: string | null
          id?: string
          utm_data?: Json | null
          value?: number | null
          variant_id?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiment_stats"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "events_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          name: string
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["experiment_status"] | null
          traffic_allocation: number | null
          type: Database["public"]["Enums"]["experiment_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          name: string
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["experiment_status"] | null
          traffic_allocation?: number | null
          type?: Database["public"]["Enums"]["experiment_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          name?: string
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["experiment_status"] | null
          traffic_allocation?: number | null
          type?: Database["public"]["Enums"]["experiment_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          conversion_value: number | null
          created_at: string
          description: string | null
          event_name: string
          experiment_id: string
          id: string
          is_primary: boolean | null
          name: string
        }
        Insert: {
          conversion_value?: number | null
          created_at?: string
          description?: string | null
          event_name: string
          experiment_id: string
          id?: string
          is_primary?: boolean | null
          name: string
        }
        Update: {
          conversion_value?: number | null
          created_at?: string
          description?: string | null
          event_name?: string
          experiment_id?: string
          id?: string
          is_primary?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiment_stats"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "goals_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_snapshots: {
        Row: {
          conversion_rate: number | null
          conversions: number | null
          created_at: string
          experiment_id: string
          id: string
          snapshot_date: string
          variant_id: string | null
          visitors: number | null
        }
        Insert: {
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string
          experiment_id: string
          id?: string
          snapshot_date?: string
          variant_id?: string | null
          visitors?: number | null
        }
        Update: {
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string
          experiment_id?: string
          id?: string
          snapshot_date?: string
          variant_id?: string | null
          visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metrics_snapshots_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiment_stats"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "metrics_snapshots_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_snapshots_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          org_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          plan: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          plan?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          plan?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_statuses: {
        Row: {
          sort_order: number
          value: string
        }
        Insert: {
          sort_order: number
          value: string
        }
        Update: {
          sort_order?: number
          value?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          org_id: string
          start_date: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          org_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          org_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_status_fkey"
            columns: ["status"]
            isOneToOne: false
            referencedRelation: "project_statuses"
            referencedColumns: ["value"]
          },
          {
            foreignKeyName: "projects_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string
          name: string
        }
        Insert: {
          description: string
          name: string
        }
        Update: {
          description?: string
          name?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          org_id: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          org_id: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          org_id?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_priorities: {
        Row: {
          sort_order: number
          value: string
        }
        Insert: {
          sort_order: number
          value: string
        }
        Update: {
          sort_order?: number
          value?: string
        }
        Relationships: []
      }
      task_statuses: {
        Row: {
          sort_order: number
          value: string
        }
        Insert: {
          sort_order: number
          value: string
        }
        Update: {
          sort_order?: number
          value?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          org_id: string
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          org_id: string
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          org_id?: string
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_priority_fkey"
            columns: ["priority"]
            isOneToOne: false
            referencedRelation: "task_priorities"
            referencedColumns: ["value"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_status_fkey"
            columns: ["status"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["value"]
          },
          {
            foreignKeyName: "tasks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_org_id: string | null
          email: string
          full_name: string | null
          id: string
          metadata: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_org_id?: string | null
          email: string
          full_name?: string | null
          id: string
          metadata?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_org_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          metadata?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_default_org_fk"
            columns: ["default_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      variants: {
        Row: {
          changes: Json | null
          conversion_rate: number | null
          conversions: number | null
          created_at: string
          created_by: string | null
          css_changes: string | null
          description: string | null
          experiment_id: string
          id: string
          is_active: boolean | null
          is_control: boolean | null
          js_changes: string | null
          name: string
          redirect_url: string | null
          traffic_percentage: number | null
          updated_at: string
          visitors: number | null
        }
        Insert: {
          changes?: Json | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string
          created_by?: string | null
          css_changes?: string | null
          description?: string | null
          experiment_id: string
          id?: string
          is_active?: boolean | null
          is_control?: boolean | null
          js_changes?: string | null
          name: string
          redirect_url?: string | null
          traffic_percentage?: number | null
          updated_at?: string
          visitors?: number | null
        }
        Update: {
          changes?: Json | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string
          created_by?: string | null
          css_changes?: string | null
          description?: string | null
          experiment_id?: string
          id?: string
          is_active?: boolean | null
          is_control?: boolean | null
          js_changes?: string | null
          name?: string
          redirect_url?: string | null
          traffic_percentage?: number | null
          updated_at?: string
          visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variants_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiment_stats"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "variants_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_sessions: {
        Row: {
          browser: string | null
          country_code: string | null
          created_at: string
          device_type: string | null
          ended_at: string | null
          events_count: number | null
          id: string
          os: string | null
          session_id: string | null
          started_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          events_count?: number | null
          id?: string
          os?: string | null
          session_id?: string | null
          started_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          events_count?: number | null
          id?: string
          os?: string | null
          session_id?: string | null
          started_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      experiment_stats: {
        Row: {
          experiment_id: string | null
          experiment_name: string | null
          status: Database["public"]["Enums"]["experiment_status"] | null
          total_conversions: number | null
          total_visitors: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_user_to_org: {
        Args: { target_org: string; target_role: string; target_user: string }
        Returns: undefined
      }
      assign_variant: {
        Args: {
          p_context?: Json
          p_experiment_key: string
          p_visitor_id: string
        }
        Returns: {
          experiment_id: string
          variant_id: string
          variant_name: string
        }[]
      }
      calculate_significance: {
        Args: {
          control_conversions: number
          control_visitors: number
          variant_conversions: number
          variant_visitors: number
        }
        Returns: {
          confidence_level: number
          is_significant: boolean
          p_value: number
        }[]
      }
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      create_organization: {
        Args: { name: string; slug: string }
        Returns: string
      }
      current_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_experiment_metrics: {
        Args:
          | { exp_id: string; from_date?: string; to_date?: string }
          | { p_experiment_key: string }
        Returns: {
          conversion_rate: number
          conversions: number
          variant_name: string
          visitors: number
        }[]
      }
      get_experiment_stats: {
        Args: { experiment_uuid?: string }
        Returns: {
          experiment_id: string
          experiment_name: string
          status: string
          total_conversions: number
          total_visitors: number
        }[]
      }
      populate_visitor_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      switch_organization: {
        Args: { new_org_id: string }
        Returns: undefined
      }
      track_event: {
        Args: {
          p_event_data?: Json
          p_event_name: string
          p_experiment_key: string
          p_utm_data?: Json
          p_visitor_id: string
        }
        Returns: boolean
      }
      user_has_project_access: {
        Args: { project_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      experiment_status:
        | "draft"
        | "running"
        | "paused"
        | "completed"
        | "archived"
      experiment_type: "redirect" | "element" | "split_url" | "mab"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      experiment_status: [
        "draft",
        "running",
        "paused",
        "completed",
        "archived",
      ],
      experiment_type: ["redirect", "element", "split_url", "mab"],
    },
  },
} as const