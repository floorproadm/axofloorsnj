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
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          duration_hours: number | null
          id: string
          location: string | null
          notes: string | null
          project_id: string | null
          reminder_sent: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          duration_hours?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          project_id?: string | null
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          duration_hours?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          project_id?: string | null
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          access_timestamp: string | null
          created_at: string | null
          data_classification: string | null
          id: string
          operation_type: string
          table_accessed: string
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          access_timestamp?: string | null
          created_at?: string | null
          data_classification?: string | null
          id?: string
          operation_type: string
          table_accessed: string
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          access_timestamp?: string | null
          created_at?: string | null
          data_classification?: string | null
          id?: string
          operation_type?: string
          table_accessed?: string
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_name: string
          created_at: string
          default_labor_rate: number
          default_margin_min_percent: number
          id: string
          labor_pricing_model: Database["public"]["Enums"]["labor_pricing_model"]
          singleton_key: boolean
          updated_at: string
        }
        Insert: {
          company_name?: string
          created_at?: string
          default_labor_rate?: number
          default_margin_min_percent?: number
          id?: string
          labor_pricing_model?: Database["public"]["Enums"]["labor_pricing_model"]
          singleton_key?: boolean
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          default_labor_rate?: number
          default_margin_min_percent?: number
          id?: string
          labor_pricing_model?: Database["public"]["Enums"]["labor_pricing_model"]
          singleton_key?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      gallery_folders: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_projects: {
        Row: {
          category: string
          created_at: string
          description: string
          display_order: number | null
          folder_name: string | null
          id: string
          image_url: string
          is_featured: boolean | null
          location: string
          parent_folder_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          display_order?: number | null
          folder_name?: string | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          location: string
          parent_folder_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          display_order?: number | null
          folder_name?: string | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          location?: string
          parent_folder_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_projects_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "gallery_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      job_costs: {
        Row: {
          additional_costs: number
          created_at: string
          estimated_revenue: number
          id: string
          labor_cost: number
          margin_percent: number | null
          material_cost: number
          profit_amount: number | null
          project_id: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          additional_costs?: number
          created_at?: string
          estimated_revenue?: number
          id?: string
          labor_cost?: number
          margin_percent?: number | null
          material_cost?: number
          profit_amount?: number | null
          project_id: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          additional_costs?: number
          created_at?: string
          estimated_revenue?: number
          id?: string
          labor_cost?: number
          margin_percent?: number | null
          material_cost?: number
          profit_amount?: number | null
          project_id?: string
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      job_proof: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          created_at: string
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_proof_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          budget: number | null
          city: string | null
          converted_to_project_id: string | null
          created_at: string
          customer_id: string | null
          email: string | null
          follow_up_actions: Json | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          last_contacted_at: string | null
          lead_source: string
          location: string | null
          message: string | null
          name: string
          next_action_date: string | null
          notes: string | null
          phone: string
          priority: string
          room_size: string | null
          services: Json | null
          status: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          budget?: number | null
          city?: string | null
          converted_to_project_id?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          follow_up_actions?: Json | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          last_contacted_at?: string | null
          lead_source?: string
          location?: string | null
          message?: string | null
          name: string
          next_action_date?: string | null
          notes?: string | null
          phone: string
          priority?: string
          room_size?: string | null
          services?: Json | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          budget?: number | null
          city?: string | null
          converted_to_project_id?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          follow_up_actions?: Json | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          last_contacted_at?: string | null
          lead_source?: string
          location?: string | null
          message?: string | null
          name?: string
          next_action_date?: string | null
          notes?: string | null
          phone?: string
          priority?: string
          room_size?: string | null
          services?: Json | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_areas: {
        Row: {
          area_sqft: number
          area_type: string
          created_at: string
          dimensions: string | null
          display_order: number
          id: string
          linear_ft: number
          measurement_id: string
          notes: string | null
          room_name: string
        }
        Insert: {
          area_sqft?: number
          area_type?: string
          created_at?: string
          dimensions?: string | null
          display_order?: number
          id?: string
          linear_ft?: number
          measurement_id: string
          notes?: string | null
          room_name: string
        }
        Update: {
          area_sqft?: number
          area_type?: string
          created_at?: string
          dimensions?: string | null
          display_order?: number
          id?: string
          linear_ft?: number
          measurement_id?: string
          notes?: string | null
          room_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_areas_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "project_measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          category: string | null
          created_at: string
          file_name: string
          file_type: string
          file_url: string
          folder: string
          id: string
          project_id: string
          source: string
          updated_at: string
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name: string
          file_type?: string
          file_url: string
          folder?: string
          id?: string
          project_id: string
          source?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string
          file_type?: string
          file_url?: string
          folder?: string
          id?: string
          project_id?: string
          source?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_measurements: {
        Row: {
          created_at: string
          finish_type: string | null
          id: string
          material: string | null
          measured_by: string | null
          measurement_date: string | null
          notes: string | null
          project_id: string
          service_type: string | null
          status: string
          total_linear_ft: number
          total_sqft: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          finish_type?: string | null
          id?: string
          material?: string | null
          measured_by?: string | null
          measurement_date?: string | null
          notes?: string | null
          project_id: string
          service_type?: string | null
          status?: string
          total_linear_ft?: number
          total_sqft?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          finish_type?: string | null
          id?: string
          material?: string | null
          measured_by?: string | null
          measurement_date?: string | null
          notes?: string | null
          project_id?: string
          service_type?: string | null
          status?: string
          total_linear_ft?: number
          total_sqft?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_measurements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_cost: number | null
          address: string | null
          city: string | null
          completion_date: string | null
          created_at: string
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          estimated_cost: number | null
          id: string
          notes: string | null
          project_status: string
          project_type: string
          square_footage: number | null
          start_date: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          actual_cost?: number | null
          address?: string | null
          city?: string | null
          completion_date?: string | null
          created_at?: string
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          project_status?: string
          project_type: string
          square_footage?: number | null
          start_date?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          actual_cost?: number | null
          address?: string | null
          city?: string | null
          completion_date?: string | null
          created_at?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          project_status?: string
          project_type?: string
          square_footage?: number | null
          start_date?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          accepted_at: string | null
          best_price: number
          better_price: number
          created_at: string
          customer_id: string
          good_price: number
          id: string
          margin_best: number
          margin_better: number
          margin_good: number
          pdf_document_id: string | null
          project_id: string
          proposal_number: string
          selected_tier: string | null
          sent_at: string | null
          status: string
          updated_at: string
          valid_until: string
        }
        Insert: {
          accepted_at?: string | null
          best_price: number
          better_price: number
          created_at?: string
          customer_id: string
          good_price: number
          id?: string
          margin_best: number
          margin_better: number
          margin_good: number
          pdf_document_id?: string | null
          project_id: string
          proposal_number: string
          selected_tier?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          valid_until: string
        }
        Update: {
          accepted_at?: string | null
          best_price?: number
          better_price?: number
          created_at?: string
          customer_id?: string
          good_price?: number
          id?: string
          margin_best?: number
          margin_better?: number
          margin_good?: number
          pdf_document_id?: string | null
          project_id?: string
          proposal_number?: string
          selected_tier?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_pdf_document_id_fkey"
            columns: ["pdf_document_id"]
            isOneToOne: false
            referencedRelation: "project_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          budget: number
          city: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          room_size: string
          services: Json | null
          source: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          budget: number
          city?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          room_size: string
          services?: Json | null
          source?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          budget?: number
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          room_size?: string
          services?: Json | null
          source?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_job_margin: {
        Args: { p_project_id: string }
        Returns: {
          additional_costs: number
          estimated_revenue: number
          labor_cost: number
          margin_percent: number
          margin_status: string
          material_cost: number
          profit_amount: number
          project_id: string
          total_cost: number
        }[]
      }
      convert_lead_to_project: {
        Args: { p_lead_id: string; p_project_type: string }
        Returns: string
      }
      get_lead_nra: { Args: { p_lead_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      transition_lead_status: {
        Args: { p_lead_id: string; p_new_status: string }
        Returns: Json
      }
      validate_lead_transition: {
        Args: { p_lead_id: string; p_new_status: string }
        Returns: {
          can_transition: boolean
          current_status: string
          error_message: string
          required_status: string
        }[]
      }
      validate_project_completion: {
        Args: { p_project_id: string }
        Returns: {
          can_complete: boolean
          error_message: string
          has_after_image: boolean
          has_before_image: boolean
        }[]
      }
      validate_proposal_acceptance: {
        Args: { p_proposal_id: string }
        Returns: Json
      }
      validate_proposal_margin: {
        Args: { p_project_id: string }
        Returns: {
          can_send: boolean
          current_margin: number
          error_message: string
          min_margin: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      labor_pricing_model: "sqft" | "daily"
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
      app_role: ["admin", "moderator", "user"],
      labor_pricing_model: ["sqft", "daily"],
    },
  },
} as const
