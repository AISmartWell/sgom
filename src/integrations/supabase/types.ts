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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      core_analyses: {
        Row: {
          analysis: string
          company_id: string
          created_at: string
          id: string
          image_url: string | null
          rock_type: string | null
          sample_name: string | null
          user_id: string
        }
        Insert: {
          analysis: string
          company_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          rock_type?: string | null
          sample_name?: string | null
          user_id: string
        }
        Update: {
          analysis?: string
          company_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          rock_type?: string | null
          sample_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_analyses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      core_images: {
        Row: {
          api_number: string | null
          company_id: string
          created_at: string
          depth_from: number | null
          depth_to: number | null
          description: string | null
          file_name: string
          file_path: string
          formation: string | null
          id: string
          rock_type: string | null
          source: string
          user_id: string
          well_id: string | null
        }
        Insert: {
          api_number?: string | null
          company_id: string
          created_at?: string
          depth_from?: number | null
          depth_to?: number | null
          description?: string | null
          file_name: string
          file_path: string
          formation?: string | null
          id?: string
          rock_type?: string | null
          source?: string
          user_id: string
          well_id?: string | null
        }
        Update: {
          api_number?: string | null
          company_id?: string
          created_at?: string
          depth_from?: number | null
          depth_to?: number | null
          description?: string | null
          file_name?: string
          file_path?: string
          formation?: string | null
          id?: string
          rock_type?: string | null
          source?: string
          user_id?: string
          well_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_images_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_images_well_id_fkey"
            columns: ["well_id"]
            isOneToOne: false
            referencedRelation: "wells"
            referencedColumns: ["id"]
          },
        ]
      }
      formation_codes: {
        Row: {
          basin: string | null
          code: string
          county_fips: string | null
          county_name: string | null
          created_at: string
          description: string | null
          formation: string | null
          id: string
          source: string | null
          state_code: string
          state_name: string
          well_type: string | null
        }
        Insert: {
          basin?: string | null
          code: string
          county_fips?: string | null
          county_name?: string | null
          created_at?: string
          description?: string | null
          formation?: string | null
          id?: string
          source?: string | null
          state_code: string
          state_name: string
          well_type?: string | null
        }
        Update: {
          basin?: string | null
          code?: string
          county_fips?: string | null
          county_name?: string | null
          created_at?: string
          description?: string | null
          formation?: string | null
          id?: string
          source?: string | null
          state_code?: string
          state_name?: string
          well_type?: string | null
        }
        Relationships: []
      }
      production_history: {
        Row: {
          company_id: string
          created_at: string
          days_on: number | null
          gas_mcf: number | null
          id: string
          oil_bbl: number | null
          production_month: string
          water_bbl: number | null
          well_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          days_on?: number | null
          gas_mcf?: number | null
          id?: string
          oil_bbl?: number | null
          production_month: string
          water_bbl?: number | null
          well_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          days_on?: number | null
          gas_mcf?: number | null
          id?: string
          oil_bbl?: number | null
          production_month?: string
          water_bbl?: number | null
          well_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_history_well_id_fkey"
            columns: ["well_id"]
            isOneToOne: false
            referencedRelation: "wells"
            referencedColumns: ["id"]
          },
        ]
      }
      seismic_analyses: {
        Row: {
          analysis_mode: string
          company_id: string
          created_at: string
          id: string
          model: string | null
          results: Json
          seismic_image_id: string | null
          user_id: string
          well_id: string | null
        }
        Insert: {
          analysis_mode?: string
          company_id: string
          created_at?: string
          id?: string
          model?: string | null
          results?: Json
          seismic_image_id?: string | null
          user_id: string
          well_id?: string | null
        }
        Update: {
          analysis_mode?: string
          company_id?: string
          created_at?: string
          id?: string
          model?: string | null
          results?: Json
          seismic_image_id?: string | null
          user_id?: string
          well_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seismic_analyses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seismic_analyses_seismic_image_id_fkey"
            columns: ["seismic_image_id"]
            isOneToOne: false
            referencedRelation: "seismic_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seismic_analyses_well_id_fkey"
            columns: ["well_id"]
            isOneToOne: false
            referencedRelation: "wells"
            referencedColumns: ["id"]
          },
        ]
      }
      seismic_images: {
        Row: {
          api_number: string | null
          company_id: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          formation: string | null
          id: string
          image_type: string | null
          user_id: string
          well_id: string | null
        }
        Insert: {
          api_number?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          formation?: string | null
          id?: string
          image_type?: string | null
          user_id: string
          well_id?: string | null
        }
        Update: {
          api_number?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          formation?: string | null
          id?: string
          image_type?: string | null
          user_id?: string
          well_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seismic_images_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seismic_images_well_id_fkey"
            columns: ["well_id"]
            isOneToOne: false
            referencedRelation: "wells"
            referencedColumns: ["id"]
          },
        ]
      }
      user_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      well_alerts: {
        Row: {
          alert_type: string
          company_id: string
          created_at: string
          current_value: number | null
          id: string
          is_read: boolean
          message: string
          previous_value: number | null
          severity: string
          well_id: string
        }
        Insert: {
          alert_type: string
          company_id: string
          created_at?: string
          current_value?: number | null
          id?: string
          is_read?: boolean
          message: string
          previous_value?: number | null
          severity?: string
          well_id: string
        }
        Update: {
          alert_type?: string
          company_id?: string
          created_at?: string
          current_value?: number | null
          id?: string
          is_read?: boolean
          message?: string
          previous_value?: number | null
          severity?: string
          well_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "well_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "well_alerts_well_id_fkey"
            columns: ["well_id"]
            isOneToOne: false
            referencedRelation: "wells"
            referencedColumns: ["id"]
          },
        ]
      }
      well_analyses: {
        Row: {
          batch_number: number
          company_id: string
          created_at: string
          id: string
          stage_results: Json | null
          status: string
          user_id: string
          well_id: string
        }
        Insert: {
          batch_number?: number
          company_id: string
          created_at?: string
          id?: string
          stage_results?: Json | null
          status?: string
          user_id: string
          well_id: string
        }
        Update: {
          batch_number?: number
          company_id?: string
          created_at?: string
          id?: string
          stage_results?: Json | null
          status?: string
          user_id?: string
          well_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "well_analyses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "well_analyses_well_id_fkey"
            columns: ["well_id"]
            isOneToOne: false
            referencedRelation: "wells"
            referencedColumns: ["id"]
          },
        ]
      }
      well_logs: {
        Row: {
          company_id: string
          created_at: string
          density: number | null
          gamma_ray: number | null
          id: string
          measured_depth: number
          neutron_porosity: number | null
          porosity: number | null
          resistivity: number | null
          source: string
          sp: number | null
          water_saturation: number | null
          well_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          density?: number | null
          gamma_ray?: number | null
          id?: string
          measured_depth: number
          neutron_porosity?: number | null
          porosity?: number | null
          resistivity?: number | null
          source?: string
          sp?: number | null
          water_saturation?: number | null
          well_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          density?: number | null
          gamma_ray?: number | null
          id?: string
          measured_depth?: number
          neutron_porosity?: number | null
          porosity?: number | null
          resistivity?: number | null
          source?: string
          sp?: number | null
          water_saturation?: number | null
          well_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "well_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "well_logs_well_id_fkey"
            columns: ["well_id"]
            isOneToOne: false
            referencedRelation: "wells"
            referencedColumns: ["id"]
          },
        ]
      }
      well_perforations: {
        Row: {
          company_id: string
          created_at: string
          date_perforated: string | null
          depth_from: number
          depth_to: number
          hole_diameter: number | null
          id: string
          notes: string | null
          phasing: number | null
          shots_per_foot: number | null
          status: string | null
          well_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          date_perforated?: string | null
          depth_from: number
          depth_to: number
          hole_diameter?: number | null
          id?: string
          notes?: string | null
          phasing?: number | null
          shots_per_foot?: number | null
          status?: string | null
          well_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          date_perforated?: string | null
          depth_from?: number
          depth_to?: number
          hole_diameter?: number | null
          id?: string
          notes?: string | null
          phasing?: number | null
          shots_per_foot?: number | null
          status?: string | null
          well_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "well_perforations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "well_perforations_well_id_fkey"
            columns: ["well_id"]
            isOneToOne: false
            referencedRelation: "wells"
            referencedColumns: ["id"]
          },
        ]
      }
      wells: {
        Row: {
          api_number: string | null
          company_id: string
          completion_date: string | null
          county: string | null
          created_at: string
          formation: string | null
          id: string
          latitude: number | null
          longitude: number | null
          operator: string | null
          production_gas: number | null
          production_oil: number | null
          raw_data: Json | null
          source: string | null
          spud_date: string | null
          state: string
          status: string | null
          total_depth: number | null
          updated_at: string
          water_cut: number | null
          well_name: string | null
          well_type: string | null
        }
        Insert: {
          api_number?: string | null
          company_id: string
          completion_date?: string | null
          county?: string | null
          created_at?: string
          formation?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          operator?: string | null
          production_gas?: number | null
          production_oil?: number | null
          raw_data?: Json | null
          source?: string | null
          spud_date?: string | null
          state?: string
          status?: string | null
          total_depth?: number | null
          updated_at?: string
          water_cut?: number | null
          well_name?: string | null
          well_type?: string | null
        }
        Update: {
          api_number?: string | null
          company_id?: string
          completion_date?: string | null
          county?: string | null
          created_at?: string
          formation?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          operator?: string | null
          production_gas?: number | null
          production_oil?: number | null
          raw_data?: Json | null
          source?: string | null
          spud_date?: string | null
          state?: string
          status?: string | null
          total_depth?: number | null
          updated_at?: string
          water_cut?: number | null
          well_name?: string | null
          well_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wells_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "investor"
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
      app_role: ["admin", "investor"],
    },
  },
} as const
