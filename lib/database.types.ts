// Database types for Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      contractors: {
        Row: {
          id: string;
          email: string;
          company_name: string | null;
          logo_url: string | null;
          primary_color: string;
          accent_color: string;
          phone: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          company_name?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          accent_color?: string;
          phone?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          company_name?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          accent_color?: string;
          phone?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          session_id: string;
          contractor_id: string | null;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          contractor_id?: string | null;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          contractor_id?: string | null;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_contractor_id_fkey";
            columns: ["contractor_id"];
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          }
        ];
      };
      estimates: {
        Row: {
          id: string;
          conversation_id: string;
          contractor_id: string | null;
          estimate_data: Json;
          created_at: string;
          status: 'draft' | 'sent' | 'viewed' | 'accepted';
          customer_name: string | null;
          total_amount: number | null;
          location: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          contractor_id?: string | null;
          estimate_data: Json;
          created_at?: string;
          status?: 'draft' | 'sent' | 'viewed' | 'accepted';
          customer_name?: string | null;
          total_amount?: number | null;
          location?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          contractor_id?: string | null;
          estimate_data?: Json;
          created_at?: string;
          status?: 'draft' | 'sent' | 'viewed' | 'accepted';
          customer_name?: string | null;
          total_amount?: number | null;
          location?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "estimates_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estimates_contractor_id_fkey";
            columns: ["contractor_id"];
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          }
        ];
      };
      customers: {
        Row: {
          id: string;
          conversation_id: string;
          name: string;
          email: string;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          name: string;
          email: string;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          }
        ];
      };
      share_tokens: {
        Row: {
          id: string;
          estimate_id: string;
          token: string;
          expires_at: string | null;
          view_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          estimate_id: string;
          token: string;
          expires_at?: string | null;
          view_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          estimate_id?: string;
          token?: string;
          expires_at?: string | null;
          view_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "share_tokens_estimate_id_fkey";
            columns: ["estimate_id"];
            referencedRelation: "estimates";
            referencedColumns: ["id"];
          }
        ];
      };
      photos: {
        Row: {
          id: string;
          conversation_id: string | null;
          storage_path: string;
          public_url: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
          analysis_result: Json | null;
          analysis_error: string | null;
          detected_material: string | null;
          detected_condition: string | null;
          estimated_area_sqft: number | null;
          damage_detected: boolean;
          confidence_score: number | null;
          created_at: string;
          analyzed_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id?: string | null;
          storage_path: string;
          public_url: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          analysis_status?: 'pending' | 'analyzing' | 'completed' | 'failed';
          analysis_result?: Json | null;
          analysis_error?: string | null;
          detected_material?: string | null;
          detected_condition?: string | null;
          estimated_area_sqft?: number | null;
          damage_detected?: boolean;
          confidence_score?: number | null;
          created_at?: string;
          analyzed_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string | null;
          storage_path?: string;
          public_url?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          analysis_status?: 'pending' | 'analyzing' | 'completed' | 'failed';
          analysis_result?: Json | null;
          analysis_error?: string | null;
          detected_material?: string | null;
          detected_condition?: string | null;
          estimated_area_sqft?: number | null;
          damage_detected?: boolean;
          confidence_score?: number | null;
          created_at?: string;
          analyzed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "photos_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

// Convenience types
export type Contractor = Database['public']['Tables']['contractors']['Row'];
export type ContractorInsert = Database['public']['Tables']['contractors']['Insert'];
export type ContractorUpdate = Database['public']['Tables']['contractors']['Update'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type StoredEstimate = Database['public']['Tables']['estimates']['Row'];
export type StoredEstimateInsert = Database['public']['Tables']['estimates']['Insert'];
export type StoredEstimateUpdate = Database['public']['Tables']['estimates']['Update'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type ShareToken = Database['public']['Tables']['share_tokens']['Row'];
export type ShareTokenInsert = Database['public']['Tables']['share_tokens']['Insert'];
export type Photo = Database['public']['Tables']['photos']['Row'];
export type PhotoInsert = Database['public']['Tables']['photos']['Insert'];
export type PhotoUpdate = Database['public']['Tables']['photos']['Update'];

// Estimate status type
export type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'accepted';

// Photo analysis status type
export type PhotoAnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed';
