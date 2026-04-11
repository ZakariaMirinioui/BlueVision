export type LayoutStatus = "online" | "warning" | "offline" | "draft";

export interface Layout {
    id: number;
    name: string;
    category?: string;
    description?: string;
    resolution?: string;
    status: LayoutStatus;
    creator?: string;
    thumbnail_url?: string;
    in_use: boolean;
    times_used?: number;
    created_at?: string;
    updated_at?: string;
}

export interface LayoutMedia {
    media_id: number;
    layout_id: number;
    name: string;
    media_type: string;
    file_type?: string;
    file_url?: string;
    file_size?: number;
    position?: number;
}