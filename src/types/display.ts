export interface Display {
  id: string;
  name: string;
  location: string;
  group_name: string;
  description?: string;
  status: 'active' | 'online' | 'offline' | 'warning' | 'error';
  user_id?: string;
  owner?: string;
  lastSeen: string;
  currentLayout?: string;
  resolution?: string;
  cms_key?: string;
  connection_url?: string;
  clientVersion?: string;
  clientAddress?: string;
  width?: number;
  height?: number;
  updated_at?: string;
  displayId?: string;  // For compatibility with existing code
  displayGroupId?: string;  // For compatibility with existing code
}

export interface DisplayStatus {
  displayId: string;
  status: 'online' | 'warning' | 'offline';
  lastPing: string;
  currentLayout?: string;
  storage?: number;
  storageTotalSpace?: number;
  storagePercentage?: number;
  display?: string;
  defaultLayout?: string;
  defaultLayoutId?: number;
}

export interface DisplayMessage {
  success: boolean;
  message: string;
}

export interface DisplayParams {
  isAuthorized?: string;
  status?: string;
  group?: string;
  [key: string]: string | undefined;
}

export type DisplayCommand = 'reboot' | 'refresh' | 'screenshot' | 'collect-logs';

export interface DisplayDB {
  id: string;
  name: string;
  location: string;
  group_name: string;
  description?: string;
  status: 'active' | 'online' | 'offline' | 'warning' | 'error';
  created_at: string;
  updated_at: string;
  last_connected?: string | null;
  current_layout?: string | null;
  resolution?: string;
  cms_key?: string;
  connection_url?: string;
  client_version?: string;
  client_ip?: string;
  hardware_key?: string;
  user_id?: string;
}

export interface DisplayGroup {
  id: string;
  name: string;
  displays: number;
  description?: string;
}
