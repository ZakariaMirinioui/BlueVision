-- Add columns for display authentication and connection
ALTER TABLE IF EXISTS displays
  ADD COLUMN IF NOT EXISTS cms_key UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS connection_url TEXT,
  ADD COLUMN IF NOT EXISTS last_ping TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS client_version TEXT,
  ADD COLUMN IF NOT EXISTS client_ip TEXT,
  ADD COLUMN IF NOT EXISTS hardware_key TEXT;

-- Add indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_displays_cms_key ON displays(cms_key);
CREATE INDEX IF NOT EXISTS idx_displays_last_ping ON displays(last_ping);