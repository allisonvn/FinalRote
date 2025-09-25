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
      // ... outras tabelas
    }
    Enums: {
      experiment_type: "redirect" | "element" | "split_url" | "mab"
      experiment_status: "draft" | "running" | "paused" | "completed" | "archived"
      // ... outros enums
    }
  }
}