export interface MediaItem {
    id: number;
    name: string;
    media_type: string;
    type?: string; // Add this for Supabase compatibility
    file_type?: string;
    file_url?: string;
    file_size?: number;
    tags?: string[];
    user_id?: string | number;
    retired?: boolean;
    enable_stat?: boolean;
    released?: boolean;
    created_at?: string;
    updated_at?: string;
}