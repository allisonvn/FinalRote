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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      experiments: {
        Row: {
          audience_targeting: Json | null
          confidence_level: number | null
          conversion_goals: Json | null
          conversions_config: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          ended_at: string | null
          hypothesis: string | null
          id: string
          mab_config: Json | null
          name: string
          notes: string | null
          primary_goal: Json | null
          project_id: string
          secondary_goals: Json | null
          started_at: string | null
          statistical_significance: number | null
          status: Database["public"]["Enums"]["experiment_status"] | null
          tags: string[] | null
          total_conversions: number | null
          total_visitors: number | null
          tracking_config: Json | null
          traffic_allocation: number | null
          type: Database["public"]["Enums"]["experiment_type"]
          updated_at: string
          url_targeting: Json | null
          user_id: string | null
        }
        Insert: {
          audience_targeting?: Json | null
          confidence_level?: number | null
          conversion_goals?: Json | null
          conversions_config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          hypothesis?: string | null
          id?: string
          mab_config?: Json | null
          name: string
          notes?: string | null
          primary_goal?: Json | null
          project_id: string
          secondary_goals?: Json | null
          started_at?: string | null
          statistical_significance?: number | null
          status?: Database["public"]["Enums"]["experiment_status"] | null
          tags?: string[] | null
          total_conversions?: number | null
          total_visitors?: number | null
          tracking_config?: Json | null
          traffic_allocation?: number | null
          type?: Database["public"]["Enums"]["experiment_type"]
          updated_at?: string
          url_targeting?: Json | null
          user_id?: string | null
        }
        Update: {
          audience_targeting?: Json | null
          confidence_level?: number | null
          conversion_goals?: Json | null
          conversions_config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          hypothesis?: string | null
          id?: string
          mab_config?: Json | null
          name?: string
          notes?: string | null
          primary_goal?: Json | null
          project_id?: string
          secondary_goals?: Json | null
          started_at?: string | null
          statistical_significance?: number | null
          status?: Database["public"]["Enums"]["experiment_status"] | null
          tags?: string[] | null
          total_conversions?: number | null
          total_visitors?: number | null
          tracking_config?: Json | null
          traffic_allocation?: number | null
          type?: Database["public"]["Enums"]["experiment_type"]
          updated_at?: string
          url_targeting?: Json | null
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
          mab_stats: Json | null
          name: string
          redirect_url: string | null
          traffic_percentage: number
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
          mab_stats?: Json | null
          name: string
          redirect_url?: string | null
          traffic_percentage?: number
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
          mab_stats?: Json | null
          name?: string
          redirect_url?: string | null
          traffic_percentage?: number
          updated_at?: string
          visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variants_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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