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
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          budget: number | null
          city: string | null
          converted_to_project_id: string | null
          created_at: string
          email: string | null
          follow_up_date: string | null
          id: string
          last_contacted_at: string | null
          lead_source: string
          location: string | null
          message: string | null
          name: string
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
          email?: string | null
          follow_up_date?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_source?: string
          location?: string | null
          message?: string | null
          name: string
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
          email?: string | null
          follow_up_date?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_source?: string
          location?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string
          priority?: string
          room_size?: string | null
          services?: Json | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
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
      projects: {
        Row: {
          actual_cost: number | null
          address: string | null
          city: string | null
          completion_date: string | null
          created_at: string
          customer_email: string
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
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
