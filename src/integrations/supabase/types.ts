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
      calibration_audit: {
        Row: {
          after_state: Json
          before_state: Json
          company_id: string | null
          confidence_delta: number | null
          created_at: string
          id: string
          input_summary: Json
          mape: number | null
          method: string
          model_parameter_id: string | null
          residual: number | null
          restoration_id: string | null
          scope_key: string | null
          scope_type: string | null
          well_id: string | null
        }
        Insert: {
          after_state?: Json
          before_state?: Json
          company_id?: string | null
          confidence_delta?: number | null
          created_at?: string
          id?: string
          input_summary?: Json
          mape?: number | null
          method?: string
          model_parameter_id?: string | null
          residual?: number | null
          restoration_id?: string | null
          scope_key?: string | null
          scope_type?: string | null
          well_id?: string | null
        }
        Update: {
          after_state?: Json
          before_state?: Json
          company_id?: string | null
          confidence_delta?: number | null
          created_at?: string
          id?: string
          input_summary?: Json
          mape?: number | null
          method?: string
          model_parameter_id?: string | null
          residual?: number | null
          restoration_id?: string | null
          scope_key?: string | null
          scope_type?: string | null
          well_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calibration_audit_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calibration_audit_model_parameter_id_fkey"
            columns: ["model_parameter_id"]
            isOneToOne: false
            referencedRelation: "model_parameters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calibration_audit_restoration_id_fkey"
            columns: ["restoration_id"]
            isOneToOne: false
            referencedRelation: "well_restorations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calibration_audit_well_id_fkey"
            columns: ["well_id"]
            isOneToOne: false
            referencedRelation: "wells"
            referencedColumns: ["id"]
          },
        ]
      }
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
      model_parameters: {
        Row: {
          arps_b: number
          arps_b_variance: number
          arps_di: number
          arps_di_variance: number
          company_id: string | null
          confidence: number
          created_at: string
          id: string
          last_calibrated_at: string | null
          model_version: string
          pressure_gradient_psi_ft: number
          pressure_gradient_variance: number
          sample_count: number
          scope_key: string
          scope_type: string
          spt_multiplier: number
          spt_multiplier_variance: number
          updated_at: string
        }
        Insert: {
          arps_b?: number
          arps_b_variance?: number
          arps_di?: number
          arps_di_variance?: number
          company_id?: string | null
          confidence?: number
          created_at?: string
          id?: string
          last_calibrated_at?: string | null
          model_version?: string
          pressure_gradient_psi_ft?: number
          pressure_gradient_variance?: number
          sample_count?: number
          scope_key: string
          scope_type: string
          spt_multiplier?: number
          spt_multiplier_variance?: number
          updated_at?: string
        }
        Update: {
          arps_b?: number
          arps_b_variance?: number
          arps_di?: number
          arps_di_variance?: number
          company_id?: string | null
          confidence?: number
          created_at?: string
          id?: string
          last_calibrated_at?: string | null
          model_version?: string
          pressure_gradient_psi_ft?: number
          pressure_gradient_variance?: number
          sample_count?: number
          scope_key?: string
          scope_type?: string
          spt_multiplier?: number
          spt_multiplier_variance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_parameters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      registry_scan_runs: {
        Row: {
          company_id: string | null
          created_at: string
          error_message: string | null
          id: string
          radius_miles: number | null
          results: Json | null
          scan_run_id: string
          seeds_count: number
          status: string
          suggestions_count: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          radius_miles?: number | null
          results?: Json | null
          scan_run_id: string
          seeds_count?: number
          status?: string
          suggestions_count?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          radius_miles?: number | null
          results?: Json | null
          scan_run_id?: string
          seeds_count?: number
          status?: string
          suggestions_count?: number
        }
        Relationships: []
      }
      registry_scan_suggestions: {
        Row: {
          api_number: string | null
          company_id: string
          county: string | null
          created_at: string
          distance_miles: number | null
          formation: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nearest_well_id: string | null
          operator: string | null
          raw_data: Json | null
          reason: string | null
          scan_run_id: string | null
          score: number | null
          source: string | null
          state: string | null
          status: string | null
          suggestion_status: string
          total_depth: number | null
          updated_at: string
          well_name: string | null
          well_type: string | null
        }
        Insert: {
          api_number?: string | null
          company_id: string
          county?: string | null
          created_at?: string
          distance_miles?: number | null
          formation?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nearest_well_id?: string | null
          operator?: string | null
          raw_data?: Json | null
          reason?: string | null
          scan_run_id?: string | null
          score?: number | null
          source?: string | null
          state?: string | null
          status?: string | null
          suggestion_status?: string
          total_depth?: number | null
          updated_at?: string
          well_name?: string | null
          well_type?: string | null
        }
        Update: {
          api_number?: string | null
          company_id?: string
          county?: string | null
          created_at?: string
          distance_miles?: number | null
          formation?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nearest_well_id?: string | null
          operator?: string | null
          raw_data?: Json | null
          reason?: string | null
          scan_run_id?: string | null
          score?: number | null
          source?: string | null
          state?: string | null
          status?: string | null
          suggestion_status?: string
          total_depth?: number | null
          updated_at?: string
          well_name?: string | null
          well_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_scan_suggestions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registry_scan_suggestions_nearest_well_id_fkey"
            columns: ["nearest_well_id"]
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
      sgom_chat_feedback: {
        Row: {
          category: string | null
          created_at: string
          id: string
          message_id: string
          rating: number
          reason: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          message_id: string
          rating: number
          reason?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          message_id?: string
          rating?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sgom_chat_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "sgom_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      sgom_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          latency_ms: number | null
          model: string | null
          role: string
          sources: Json
          thread_id: string
          tokens_completion: number | null
          tokens_prompt: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          model?: string | null
          role: string
          sources?: Json
          thread_id: string
          tokens_completion?: number | null
          tokens_prompt?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          model?: string | null
          role?: string
          sources?: Json
          thread_id?: string
          tokens_completion?: number | null
          tokens_prompt?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sgom_chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "sgom_chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      sgom_chat_threads: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          last_message_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sgom_knowledge_articles: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_published: boolean
          language: string
          search_vector: unknown
          slug: string
          source_url: string | null
          stage: number | null
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          language?: string
          search_vector?: unknown
          slug: string
          source_url?: string | null
          stage?: number | null
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          language?: string
          search_vector?: unknown
          slug?: string
          source_url?: string | null
          stage?: number | null
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
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
      well_documents: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          doc_type: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          notes: string | null
          storage_path: string
          tags: string[]
          title: string
          updated_at: string
          uploaded_by: string
          well_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          doc_type?: string
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          storage_path: string
          tags?: string[]
          title: string
          updated_at?: string
          uploaded_by: string
          well_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          doc_type?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          storage_path?: string
          tags?: string[]
          title?: string
          updated_at?: string
          uploaded_by?: string
          well_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "well_documents_well_id_fkey"
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
      well_pressures: {
        Row: {
          company_id: string
          confidence: number | null
          created_at: string
          datum_depth_ft: number | null
          depletion_pct: number | null
          estimation_date: string
          gradient_psi_ft: number | null
          id: string
          measurement_date: string | null
          method: string
          notes: string | null
          p_current_psi: number | null
          p_initial_psi: number | null
          temperature_f: number | null
          updated_at: string
          well_id: string
        }
        Insert: {
          company_id: string
          confidence?: number | null
          created_at?: string
          datum_depth_ft?: number | null
          depletion_pct?: number | null
          estimation_date?: string
          gradient_psi_ft?: number | null
          id?: string
          measurement_date?: string | null
          method?: string
          notes?: string | null
          p_current_psi?: number | null
          p_initial_psi?: number | null
          temperature_f?: number | null
          updated_at?: string
          well_id: string
        }
        Update: {
          company_id?: string
          confidence?: number | null
          created_at?: string
          datum_depth_ft?: number | null
          depletion_pct?: number | null
          estimation_date?: string
          gradient_psi_ft?: number | null
          id?: string
          measurement_date?: string | null
          method?: string
          notes?: string | null
          p_current_psi?: number | null
          p_initial_psi?: number | null
          temperature_f?: number | null
          updated_at?: string
          well_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "well_pressures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "well_pressures_well_id_fkey"
            columns: ["well_id"]
            isOneToOne: false
            referencedRelation: "wells"
            referencedColumns: ["id"]
          },
        ]
      }
      well_restorations: {
        Row: {
          actual_cum: number | null
          actual_qoil: number | null
          arps_b_used: number | null
          arps_di_used: number | null
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          oil_price: number | null
          payload: Json
          predicted_cum: number | null
          predicted_qoil: number | null
          processed: boolean
          processed_at: string | null
          restoration_date: string
          source: string
          spt_depth_ft: number | null
          spt_multiplier_used: number | null
          updated_at: string
          well_external_ref: string | null
          well_id: string | null
        }
        Insert: {
          actual_cum?: number | null
          actual_qoil?: number | null
          arps_b_used?: number | null
          arps_di_used?: number | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          oil_price?: number | null
          payload?: Json
          predicted_cum?: number | null
          predicted_qoil?: number | null
          processed?: boolean
          processed_at?: string | null
          restoration_date?: string
          source?: string
          spt_depth_ft?: number | null
          spt_multiplier_used?: number | null
          updated_at?: string
          well_external_ref?: string | null
          well_id?: string | null
        }
        Update: {
          actual_cum?: number | null
          actual_qoil?: number | null
          arps_b_used?: number | null
          arps_di_used?: number | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          oil_price?: number | null
          payload?: Json
          predicted_cum?: number | null
          predicted_qoil?: number | null
          processed?: boolean
          processed_at?: string | null
          restoration_date?: string
          source?: string
          spt_depth_ft?: number | null
          spt_multiplier_used?: number | null
          updated_at?: string
          well_external_ref?: string | null
          well_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "well_restorations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "well_restorations_well_id_fkey"
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
      search_sgom_knowledge: {
        Args: { match_count?: number; q: string }
        Returns: {
          category: string
          content: string
          id: string
          rank: number
          slug: string
          source_url: string
          stage: number
          summary: string
          tags: string[]
          title: string
        }[]
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
