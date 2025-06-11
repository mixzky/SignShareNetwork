export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          display_name: string
          role: 'user' | 'moderator' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          role?: 'user' | 'moderator' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          role?: 'user' | 'moderator' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      sign_videos: {
        Row: {
          id: string
          user_id: string
          video_url: string
          title: string
          description: string
          language: string
          region: string
          tags: string[]
          status: 'pending' | 'verified' | 'flagged'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_url: string
          title: string
          description: string
          language: string
          region: string
          tags?: string[]
          status?: 'pending' | 'verified' | 'flagged'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_url?: string
          title?: string
          description?: string
          language?: string
          region?: string
          tags?: string[]
          status?: 'pending' | 'verified' | 'flagged'
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          video_id: string
          user_id: string
          comment: string
          rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          video_id: string
          user_id: string
          comment: string
          rating: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          user_id?: string
          comment?: string
          rating?: number
          created_at?: string
          updated_at?: string
        }
      }
      flags: {
        Row: {
          id: string
          video_id: string
          flagged_by: string
          reason: string
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          flagged_by: string
          reason: string
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          flagged_by?: string
          reason?: string
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 