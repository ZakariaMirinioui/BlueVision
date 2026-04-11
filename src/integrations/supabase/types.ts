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
          id: number
          username: string
          password: string
          role: string
          created_at: string
          auth_uid: string
        }
        Insert: {
          id?: number
          username: string
          password?: string
          role?: string
          created_at?: string
          auth_uid: string
        }
        Update: {
          id?: number
          username?: string
          password?: string
          role?: string
          created_at?: string
          auth_uid?: string
        }
      }
      schedules: {
        Row: {
          id: number
          display_group_ids: number[] | null
          campaign_id: number | null
          command_id: number | null
          day_part_id: number | null
          user_id: string
          from_dt: string
          to_dt: string
          is_priority: boolean | null
          display_order: number | null
          recurrence_type: string | null
          recurrence_detail: string | null
          recurrence_range: string | null
          display_groups: string[] | null
          campaign: string | null
          day_part: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          display_group_ids?: number[] | null
          campaign_id?: number | null
          command_id?: number | null
          day_part_id?: number | null
          user_id: string
          from_dt: string
          to_dt: string
          is_priority?: boolean | null
          display_order?: number | null
          recurrence_type?: string | null
          recurrence_detail?: string | null
          recurrence_range?: string | null
          display_groups?: string[] | null
          campaign?: string | null
          day_part?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          display_group_ids?: number[] | null
          campaign_id?: number | null
          command_id?: number | null
          day_part_id?: number | null
          user_id?: string
          from_dt?: string
          to_dt?: string
          is_priority?: boolean | null
          display_order?: number | null
          recurrence_type?: string | null
          recurrence_detail?: string | null
          recurrence_range?: string | null
          display_groups?: string[] | null
          campaign?: string | null
          day_part?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      media: {
        Row: {
          id: number
          name: string
          type: string
          file_size: number | null
          created_at: string
          updated_at: string
          file_url: string | null
          user_id: string
        }
        Insert: {
          id?: number
          name: string
          type: string
          file_size?: number | null
          created_at?: string
          updated_at?: string
          file_url?: string | null
          user_id: string
        }
        Update: {
          id?: number
          name?: string
          type?: string
          file_size?: number | null
          created_at?: string
          updated_at?: string
          file_url?: string | null
          user_id?: string
        }
      }
      layouts: {
        Row: {
          id: number
          name: string
          description: string | null
          duration: number | null
          status: string | null
          resolution: string | null
          creator: string | null
          category: string | null
          thumbnail_url: string | null
          in_use: boolean | null
          times_used: number | null
          created_at: string
          updated_at: string
          grid_template_id: string | null
          user_id: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          duration?: number | null
          status?: string | null
          resolution?: string | null
          creator?: string | null
          category?: string | null
          thumbnail_url?: string | null
          in_use?: boolean | null
          times_used?: number | null
          created_at?: string
          updated_at?: string
          grid_template_id?: string | null
          user_id: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          duration?: number | null
          status?: string | null
          resolution?: string | null
          creator?: string | null
          category?: string | null
          thumbnail_url?: string | null
          in_use?: boolean | null
          times_used?: number | null
          created_at?: string
          updated_at?: string
          grid_template_id?: string | null
          user_id?: string
        }
      }
      displays: {
        Row: {
          id: string
          name: string | null
          location: string | null
          group_name: string | null
          status: string | null
          last_ping: string | null
          current_layout: string | null
          storage_usage: number | null
          storage_total: number | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id: string
          name?: string | null
          location?: string | null
          group_name?: string | null
          status?: string | null
          last_ping?: string | null
          current_layout?: string | null
          storage_usage?: number | null
          storage_total?: number | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string | null
          location?: string | null
          group_name?: string | null
          status?: string | null
          last_ping?: string | null
          current_layout?: string | null
          storage_usage?: number | null
          storage_total?: number | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
    }
  }
}
