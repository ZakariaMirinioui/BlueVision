-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  media_type VARCHAR(50) NOT NULL,
  file_type VARCHAR(100),
  file_url TEXT,
  file_size BIGINT,
  tags TEXT[],
  owner VARCHAR(100),
  retired BOOLEAN DEFAULT false,
  enable_stat BOOLEAN DEFAULT true,
  released BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create layouts table
CREATE TABLE IF NOT EXISTS layouts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  resolution VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  creator VARCHAR(100),
  thumbnail_url TEXT,
  in_use BOOLEAN DEFAULT false,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create layout_media junction table
CREATE TABLE IF NOT EXISTS layout_media (
  layout_id INTEGER REFERENCES layouts(id) ON DELETE CASCADE,
  media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  PRIMARY KEY (layout_id, media_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
CREATE INDEX IF NOT EXISTS idx_layout_status ON layouts(status);
CREATE INDEX IF NOT EXISTS idx_layout_media_layout_id ON layout_media(layout_id);
CREATE INDEX IF NOT EXISTS idx_layout_media_media_id ON layout_media(media_id);