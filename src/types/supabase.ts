import { DisplayDB } from "./display";

export type DatabaseDisplay = {
  id?: string;
  name: string;
  location: string;
  group_name?: string;
  description?: string;
  status: 'online' | 'offline' | 'warning';
  created_at?: string;
  updated_at?: string;
  last_connected?: string | null;
  current_layout?: string | null;
  resolution?: string;
  cms_key?: string;
  connection_url?: string;
  client_version?: string;
  client_ip?: string;
  hardware_key?: string;
};

export const mapToDatabaseDisplay = (display: Partial<DisplayDB>): DatabaseDisplay => {
  const now = new Date().toISOString();
  return {
    name: display.name || '',
    location: display.location || '',
    group_name: display.group_name || 'default',
    description: display.description || '',
    status: display.status || 'offline',
    resolution: display.resolution || '1920x1080',
    created_at: display.created_at || now,
    updated_at: display.updated_at || now,
    current_layout: display.current_layout || null,
    last_connected: display.last_connected || null,
    client_version: display.client_version || '1.0.0'
  };
};