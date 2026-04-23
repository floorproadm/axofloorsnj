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
      appointment_assignees: {
        Row: {
          appointment_id: string
          created_at: string | null
          id: string
          profile_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          id?: string
          profile_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_assignees_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_assignees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          assigned_to: string[] | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          duration_hours: number | null
          id: string
          location: string | null
          notes: string | null
          organization_id: string
          project_id: string | null
          reminder_sent: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          assigned_to?: string[] | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          duration_hours?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          organization_id: string
          project_id?: string | null
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          assigned_to?: string[] | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          duration_hours?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          organization_id?: string
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
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          table_accessed?: string
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_drips: {
        Row: {
          channel: string
          created_at: string
          delay_days: number
          delay_hours: number
          display_order: number
          id: string
          is_active: boolean
          message_template: string
          organization_id: string
          sequence_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          display_order?: number
          id?: string
          is_active?: boolean
          message_template?: string
          organization_id: string
          sequence_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          display_order?: number
          id?: string
          is_active?: boolean
          message_template?: string
          organization_id?: string
          sequence_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_drips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_drips_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "automation_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_sequences: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          organization_id: string
          pipeline_type: string
          stage_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          pipeline_type?: string
          stage_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          pipeline_type?: string
          stage_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string | null
          read: boolean
          sender_id: string
          sender_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id?: string | null
          read?: boolean
          sender_id: string
          sender_name?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          read?: boolean
          sender_id?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
        ]
      }
      company_settings: {
        Row: {
          company_name: string
          created_at: string
          default_labor_rate: number
          default_margin_min_percent: number
          id: string
          labor_pricing_model: Database["public"]["Enums"]["labor_pricing_model"]
          logo_url: string | null
          organization_id: string | null
          primary_color: string | null
          referral_commission_percent: number
          secondary_color: string | null
          singleton_key: boolean
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string
          created_at?: string
          default_labor_rate?: number
          default_margin_min_percent?: number
          id?: string
          labor_pricing_model?: Database["public"]["Enums"]["labor_pricing_model"]
          logo_url?: string | null
          organization_id?: string | null
          primary_color?: string | null
          referral_commission_percent?: number
          secondary_color?: string | null
          singleton_key?: boolean
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          default_labor_rate?: number
          default_margin_min_percent?: number
          id?: string
          labor_pricing_model?: Database["public"]["Enums"]["labor_pricing_model"]
          logo_url?: string | null
          organization_id?: string | null
          primary_color?: string | null
          referral_commission_percent?: number
          secondary_color?: string | null
          singleton_key?: boolean
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
          phone: string | null
          portal_token: string | null
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
          organization_id: string
          phone?: string | null
          portal_token?: string | null
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
          organization_id?: string
          phone?: string | null
          portal_token?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          author_name: string
          content: string
          created_at: string
          feed_post_id: string
          id: string
          organization_id: string
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string
          feed_post_id: string
          id?: string
          organization_id: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          feed_post_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_feed_post_id_fkey"
            columns: ["feed_post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_folders: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          item_count: number
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          item_count?: number
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          item_count?: number
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_post_images: {
        Row: {
          created_at: string
          display_order: number
          feed_post_id: string
          file_type: string
          file_url: string
          id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          feed_post_id: string
          file_type?: string
          file_url: string
          id?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          feed_post_id?: string
          file_type?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_post_images_feed_post_id_fkey"
            columns: ["feed_post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          author_id: string | null
          author_name: string
          category: string | null
          comments_count: number
          created_at: string
          description: string | null
          folder_id: string | null
          id: string
          likes_count: number
          location: string | null
          organization_id: string
          post_type: string
          project_id: string | null
          share_token: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string
          category?: string | null
          comments_count?: number
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          likes_count?: number
          location?: string | null
          organization_id: string
          post_type?: string
          project_id?: string | null
          share_token?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          category?: string | null
          comments_count?: number
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          likes_count?: number
          location?: string | null
          organization_id?: string
          post_type?: string
          project_id?: string | null
          share_token?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "feed_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
        ]
      }
      gallery_folders: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          parent_folder_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_projects_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "gallery_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number | null
          created_at: string
          description: string
          detail: string | null
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description: string
          detail?: string | null
          id?: string
          invoice_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string
          detail?: string | null
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payment_schedule: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          percentage: number
          phase_label: string
          phase_order: number
          timing: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          percentage?: number
          phase_label?: string
          phase_order?: number
          timing?: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          percentage?: number
          phase_label?: string
          phase_order?: number
          timing?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payment_schedule_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          deposit_amount: number
          discount_amount: number
          due_date: string
          id: string
          invoice_number: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          project_id: string
          share_token: string | null
          status: string
          tax_amount: number
          total_amount: number | null
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          deposit_amount?: number
          discount_amount?: number
          due_date: string
          id?: string
          invoice_number: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          payment_method?: string | null
          project_id: string
          share_token?: string | null
          status?: string
          tax_amount?: number
          total_amount?: number | null
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          deposit_amount?: number
          discount_amount?: number
          due_date?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_method?: string | null
          project_id?: string
          share_token?: string | null
          status?: string
          tax_amount?: number
          total_amount?: number | null
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
        ]
      }
      job_cost_items: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          id: string
          job_cost_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          job_cost_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          job_cost_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_cost_items_job_cost_id_fkey"
            columns: ["job_cost_id"]
            isOneToOne: false
            referencedRelation: "job_costs"
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
          {
            foreignKeyName: "job_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "job_proof_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
        ]
      }
      labor_entries: {
        Row: {
          created_at: string | null
          daily_rate: number
          days_worked: number
          id: string
          is_paid: boolean | null
          notes: string | null
          organization_id: string
          project_id: string
          role: string | null
          total_cost: number | null
          work_date: string | null
          worker_name: string
        }
        Insert: {
          created_at?: string | null
          daily_rate?: number
          days_worked?: number
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          organization_id: string
          project_id: string
          role?: string | null
          total_cost?: number | null
          work_date?: string | null
          worker_name: string
        }
        Update: {
          created_at?: string | null
          daily_rate?: number
          days_worked?: number
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          organization_id?: string
          project_id?: string
          role?: string | null
          total_cost?: number | null
          work_date?: string | null
          worker_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "labor_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labor_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labor_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          lead_id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          author_name?: string
          content: string
          created_at?: string
          id?: string
          lead_id: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_estimate_scheduled_stale"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_followup_overdue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "view_stage_aging"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string
          phone: string
          priority: string
          referred_by_partner_id: string | null
          room_size: string | null
          services: Json | null
          status: string
          status_changed_at: string | null
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
          organization_id: string
          phone: string
          priority?: string
          referred_by_partner_id?: string | null
          room_size?: string | null
          services?: Json | null
          status?: string
          status_changed_at?: string | null
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
          organization_id?: string
          phone?: string
          priority?: string
          referred_by_partner_id?: string | null
          room_size?: string | null
          services?: Json | null
          status?: string
          status_changed_at?: string | null
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
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_referred_by_partner_id_fkey"
            columns: ["referred_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      material_costs: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          is_paid: boolean | null
          notes: string | null
          organization_id: string
          project_id: string
          purchase_date: string | null
          receipt_url: string | null
          supplier: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          organization_id: string
          project_id: string
          purchase_date?: string | null
          receipt_url?: string | null
          supplier?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          organization_id?: string
          project_id?: string
          purchase_date?: string | null
          receipt_url?: string | null
          supplier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_costs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
        ]
      }
      material_requests: {
        Row: {
          created_at: string
          id: string
          item_name: string
          notes: string | null
          organization_id: string
          project_id: string | null
          quantity: number
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          notes?: string | null
          organization_id: string
          project_id?: string | null
          quantity?: number
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          quantity?: number
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_material_requests_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_material_requests_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "material_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
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
      media_files: {
        Row: {
          created_at: string
          display_order: number
          feed_post_id: string | null
          file_type: string
          folder_type: string
          id: string
          is_marketing_asset: boolean
          metadata: Json
          project_id: string | null
          quality_checked: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          source_type: string
          storage_path: string
          thumbnail_path: string | null
          updated_at: string
          uploaded_by: string | null
          uploaded_by_role: string
          visibility: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          feed_post_id?: string | null
          file_type?: string
          folder_type?: string
          id?: string
          is_marketing_asset?: boolean
          metadata?: Json
          project_id?: string | null
          quality_checked?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string
          storage_path: string
          thumbnail_path?: string | null
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_role?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          feed_post_id?: string | null
          file_type?: string
          folder_type?: string
          id?: string
          is_marketing_asset?: boolean
          metadata?: Json
          project_id?: string | null
          quality_checked?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string
          storage_path?: string
          thumbnail_path?: string | null
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_role?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_files_feed_post_id_fkey"
            columns: ["feed_post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          organization_id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          plan: Database["public"]["Enums"]["org_plan"] | null
          primary_color: string | null
          slug: string
          state: string | null
          trial_ends_at: string | null
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string | null
          website_enabled: boolean | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["org_plan"] | null
          primary_color?: string | null
          slug: string
          state?: string | null
          trial_ends_at?: string | null
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string | null
          website_enabled?: boolean | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["org_plan"] | null
          primary_color?: string | null
          slug?: string
          state?: string | null
          trial_ends_at?: string | null
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string | null
          website_enabled?: boolean | null
          zip_code?: string | null
        }
        Relationships: []
      }
      partner_users: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          organization_id: string
          partner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          partner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          birthday: string | null
          company_name: string
          contact_name: string
          created_at: string
          email: string | null
          id: string
          last_contacted_at: string | null
          lead_source_tag: string | null
          next_action_date: string | null
          next_action_note: string | null
          notes: string | null
          organization_id: string
          partner_type: string
          phone: string | null
          photo_url: string | null
          service_zone: string
          status: string
          total_converted: number
          total_referrals: number
          updated_at: string
        }
        Insert: {
          birthday?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_source_tag?: string | null
          next_action_date?: string | null
          next_action_note?: string | null
          notes?: string | null
          organization_id: string
          partner_type?: string
          phone?: string | null
          photo_url?: string | null
          service_zone?: string
          status?: string
          total_converted?: number
          total_referrals?: number
          updated_at?: string
        }
        Update: {
          birthday?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_source_tag?: string | null
          next_action_date?: string | null
          next_action_note?: string | null
          notes?: string | null
          organization_id?: string
          partner_type?: string
          phone?: string | null
          photo_url?: string | null
          service_zone?: string
          status?: string
          total_converted?: number
          total_referrals?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          category: string
          collaborator_id: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          organization_id: string
          payment_date: string
          payment_method: string | null
          project_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          collaborator_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_date?: string
          payment_method?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          collaborator_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_date?: string
          payment_method?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_collaborator"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthdate: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          organization_id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          organization_id: string
          project_id: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          organization_id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
        ]
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
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "project_measurements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
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
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          organization_id: string
          project_status: string
          project_type: string
          referred_by_partner_id: string | null
          requires_progress_photos: boolean
          square_footage: number | null
          start_date: string | null
          team_lead: string | null
          team_members: string[] | null
          updated_at: string
          work_schedule: string | null
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
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          organization_id: string
          project_status?: string
          project_type: string
          referred_by_partner_id?: string | null
          requires_progress_photos?: boolean
          square_footage?: number | null
          start_date?: string | null
          team_lead?: string | null
          team_members?: string[] | null
          updated_at?: string
          work_schedule?: string | null
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
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          organization_id?: string
          project_status?: string
          project_type?: string
          referred_by_partner_id?: string | null
          requires_progress_photos?: boolean
          square_footage?: number | null
          start_date?: string | null
          team_lead?: string | null
          team_members?: string[] | null
          updated_at?: string
          work_schedule?: string | null
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
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_referred_by_partner_id_fkey"
            columns: ["referred_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_change_requests: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          message: string
          organization_id: string
          proposal_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          message: string
          organization_id: string
          proposal_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          message?: string
          organization_id?: string
          proposal_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_change_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_change_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_change_requests_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_signatures: {
        Row: {
          client_note: string | null
          created_at: string
          id: string
          ip_address: unknown
          organization_id: string
          payment_method: string
          proposal_id: string
          selected_tier: string | null
          signature_url: string
          signed_at: string
          signer_email: string | null
          signer_name: string
          user_agent: string | null
        }
        Insert: {
          client_note?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          organization_id: string
          payment_method?: string
          proposal_id: string
          selected_tier?: string | null
          signature_url: string
          signed_at?: string
          signer_email?: string | null
          signer_name: string
          user_agent?: string | null
        }
        Update: {
          client_note?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          organization_id?: string
          payment_method?: string
          proposal_id?: string
          selected_tier?: string | null
          signature_url?: string
          signed_at?: string
          signer_email?: string | null
          signer_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_signatures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_signatures_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          accepted_at: string | null
          best_price: number
          better_price: number
          client_note: string | null
          created_at: string
          customer_id: string
          flat_price: number | null
          good_price: number
          id: string
          margin_best: number
          margin_better: number
          margin_good: number
          organization_id: string
          pdf_document_id: string | null
          project_id: string
          proposal_number: string
          selected_tier: string | null
          sent_at: string | null
          share_token: string | null
          status: string
          updated_at: string
          use_tiers: boolean
          valid_until: string
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          best_price: number
          better_price: number
          client_note?: string | null
          created_at?: string
          customer_id: string
          flat_price?: number | null
          good_price: number
          id?: string
          margin_best: number
          margin_better: number
          margin_good: number
          organization_id: string
          pdf_document_id?: string | null
          project_id: string
          proposal_number: string
          selected_tier?: string | null
          sent_at?: string | null
          share_token?: string | null
          status?: string
          updated_at?: string
          use_tiers?: boolean
          valid_until: string
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          best_price?: number
          better_price?: number
          client_note?: string | null
          created_at?: string
          customer_id?: string
          flat_price?: number | null
          good_price?: number
          id?: string
          margin_best?: number
          margin_better?: number
          margin_good?: number
          organization_id?: string
          pdf_document_id?: string | null
          project_id?: string
          proposal_number?: string
          selected_tier?: string | null
          sent_at?: string | null
          share_token?: string | null
          status?: string
          updated_at?: string
          use_tiers?: boolean
          valid_until?: string
          viewed_at?: string | null
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
            foreignKeyName: "proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          phone?: string
          room_size?: string
          services?: Json | null
          source?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          organization_id: string
          phone: string
          referral_code: string
          total_converted: number
          total_credits: number
          total_referrals: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          organization_id: string
          phone: string
          referral_code: string
          total_converted?: number
          total_credits?: number
          total_referrals?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          organization_id?: string
          phone?: string
          referral_code?: string
          total_converted?: number
          total_credits?: number
          total_referrals?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          referral_id: string | null
          referrer_id: string
          type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          referral_id?: string | null
          referrer_id: string
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          referral_id?: string | null
          referrer_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referral_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          credit_amount: number
          credited_at: string | null
          id: string
          lead_id: string | null
          organization_id: string
          referred_email: string | null
          referred_name: string
          referred_phone: string
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          credit_amount?: number
          credited_at?: string | null
          id?: string
          lead_id?: string | null
          organization_id: string
          referred_email?: string | null
          referred_name: string
          referred_phone: string
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          credit_amount?: number
          credited_at?: string | null
          id?: string
          lead_id?: string | null
          organization_id?: string
          referred_email?: string | null
          referred_name?: string
          referred_phone?: string
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_estimate_scheduled_stale"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_followup_overdue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "view_stage_aging"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referral_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          base_price: number
          category: string | null
          created_at: string
          default_finish: string | null
          default_material: string | null
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          item_type: string
          name: string
          price_unit: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          category?: string | null
          created_at?: string
          default_finish?: string | null
          default_material?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_type?: string
          name: string
          price_unit?: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string | null
          created_at?: string
          default_finish?: string | null
          default_material?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_type?: string
          name?: string
          price_unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      supply_connections: {
        Row: {
          connected_at: string | null
          flooring_org_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["supply_conn_status"]
          supply_org_id: string
        }
        Insert: {
          connected_at?: string | null
          flooring_org_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["supply_conn_status"]
          supply_org_id: string
        }
        Update: {
          connected_at?: string | null
          flooring_org_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["supply_conn_status"]
          supply_org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_connections_flooring_org_id_fkey"
            columns: ["flooring_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_connections_supply_org_id_fkey"
            columns: ["supply_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_node_arrows: {
        Row: {
          created_at: string
          dashed: boolean
          from_node_id: string
          id: string
          is_deleted: boolean
          organization_id: string
          tab_id: string
          to_node_id: string
        }
        Insert: {
          created_at?: string
          dashed?: boolean
          from_node_id: string
          id?: string
          is_deleted?: boolean
          organization_id: string
          tab_id: string
          to_node_id: string
        }
        Update: {
          created_at?: string
          dashed?: boolean
          from_node_id?: string
          id?: string
          is_deleted?: boolean
          organization_id?: string
          tab_id?: string
          to_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_node_arrows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_node_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          node_id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          node_id: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          node_id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_node_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_node_overrides: {
        Row: {
          color: string | null
          content: Json | null
          created_at: string
          h: number | null
          id: string
          is_custom: boolean
          is_deleted: boolean
          node_id: string
          organization_id: string
          subtitle: string | null
          tab_id: string
          tag: string | null
          title: string | null
          updated_at: string
          w: number | null
          x: number | null
          y: number | null
        }
        Insert: {
          color?: string | null
          content?: Json | null
          created_at?: string
          h?: number | null
          id?: string
          is_custom?: boolean
          is_deleted?: boolean
          node_id: string
          organization_id: string
          subtitle?: string | null
          tab_id: string
          tag?: string | null
          title?: string | null
          updated_at?: string
          w?: number | null
          x?: number | null
          y?: number | null
        }
        Update: {
          color?: string | null
          content?: Json | null
          created_at?: string
          h?: number | null
          id?: string
          is_custom?: boolean
          is_deleted?: boolean
          node_id?: string
          organization_id?: string
          subtitle?: string | null
          tab_id?: string
          tag?: string | null
          title?: string | null
          updated_at?: string
          w?: number | null
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "system_node_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          priority: string
          related_lead_id: string | null
          related_partner_id: string | null
          related_project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          priority?: string
          related_lead_id?: string | null
          related_partner_id?: string | null
          related_project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          priority?: string
          related_lead_id?: string | null
          related_partner_id?: string | null
          related_project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_lead"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_lead"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "leads_estimate_scheduled_stale"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_lead"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "leads_followup_overdue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_lead"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "view_stage_aging"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "fk_tasks_partner"
            columns: ["related_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_project"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_project"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_lead_id_fkey"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_lead_id_fkey"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "leads_estimate_scheduled_stale"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_lead_id_fkey"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "leads_followup_overdue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_lead_id_fkey"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "view_stage_aging"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "tasks_related_partner_id_fkey"
            columns: ["related_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
        ]
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
      weekly_review_projects: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          weekly_review_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          weekly_review_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          weekly_review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_review_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_review_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_missing_progress_photos"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "weekly_review_projects_weekly_review_id_fkey"
            columns: ["weekly_review_id"]
            isOneToOne: false
            referencedRelation: "weekly_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reviews: {
        Row: {
          action_items: string | null
          avg_margin: number | null
          closed_at: string | null
          created_at: string | null
          id: string
          jobs_completed: number | null
          leads_won: number | null
          notes: string | null
          organization_id: string
          status: string | null
          total_profit: number | null
          total_revenue: number | null
          week_end: string
          week_start: string
        }
        Insert: {
          action_items?: string | null
          avg_margin?: number | null
          closed_at?: string | null
          created_at?: string | null
          id?: string
          jobs_completed?: number | null
          leads_won?: number | null
          notes?: string | null
          organization_id: string
          status?: string | null
          total_profit?: number | null
          total_revenue?: number | null
          week_end: string
          week_start: string
        }
        Update: {
          action_items?: string | null
          avg_margin?: number | null
          closed_at?: string | null
          created_at?: string | null
          id?: string
          jobs_completed?: number | null
          leads_won?: number | null
          notes?: string | null
          organization_id?: string
          status?: string | null
          total_profit?: number | null
          total_revenue?: number | null
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leads_estimate_scheduled_stale: {
        Row: {
          days_stale: number | null
          id: string | null
          name: string | null
        }
        Insert: {
          days_stale?: never
          id?: string | null
          name?: string | null
        }
        Update: {
          days_stale?: never
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      leads_followup_overdue: {
        Row: {
          id: string | null
          name: string | null
          next_action_date: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          next_action_date?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          next_action_date?: string | null
        }
        Relationships: []
      }
      projects_missing_progress_photos: {
        Row: {
          customer_name: string | null
          project_id: string | null
        }
        Insert: {
          customer_name?: string | null
          project_id?: string | null
        }
        Update: {
          customer_name?: string | null
          project_id?: string | null
        }
        Relationships: []
      }
      view_financial_metrics: {
        Row: {
          active_jobs: number | null
          avg_margin_30d: number | null
          completed_jobs: number | null
          pipeline_value: number | null
          total_profit: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      view_pipeline_metrics: {
        Row: {
          avg_days_in_pipeline: number | null
          last_30d: number | null
          status: string | null
          total: number | null
        }
        Relationships: []
      }
      view_stage_aging: {
        Row: {
          action_overdue: boolean | null
          days_in_pipeline: number | null
          lead_id: string | null
          name: string | null
          next_action_date: string | null
          status: string | null
        }
        Insert: {
          action_overdue?: never
          days_in_pipeline?: never
          lead_id?: string | null
          name?: string | null
          next_action_date?: string | null
          status?: string | null
        }
        Update: {
          action_overdue?: never
          days_in_pipeline?: never
          lead_id?: string | null
          name?: string | null
          next_action_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
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
      compute_project_next_action: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      convert_lead_to_project: {
        Args: { p_lead_id: string; p_project_type: string }
        Returns: string
      }
      get_dashboard_metrics: { Args: never; Returns: Json }
      get_lead_nra: { Args: { p_lead_id: string }; Returns: Json }
      get_leads_nra_batch: { Args: { p_lead_ids: string[] }; Returns: Json }
      get_partner_id_for_user: { Args: never; Returns: string }
      get_partner_org_for_user: { Args: never; Returns: string }
      get_user_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_partner_user: {
        Args: { p_partner_id: string; p_user_id: string }
        Returns: string
      }
      run_sla_engine: { Args: never; Returns: Json }
      supply_has_access: { Args: { p_org_id: string }; Returns: boolean }
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
      org_member_role: "owner" | "admin" | "collaborator"
      org_plan: "starter" | "pro" | "enterprise"
      org_type: "flooring_owner" | "supply_partner"
      supply_conn_status: "pending" | "active" | "paused"
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
      org_member_role: ["owner", "admin", "collaborator"],
      org_plan: ["starter", "pro", "enterprise"],
      org_type: ["flooring_owner", "supply_partner"],
      supply_conn_status: ["pending", "active", "paused"],
    },
  },
} as const
