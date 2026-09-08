-- =====================================================
-- AgriNexus: Crop Checkup — permanent diagnosis storage
-- Run this in: Supabase Dashboard → SQL Editor → paste → Run
-- =====================================================

CREATE TABLE IF NOT EXISTS crop_analyses (
  id BIGSERIAL PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
  crop_name TEXT NOT NULL,
  disease TEXT NOT NULL,
  severity TEXT DEFAULT 'Medium',
  confidence NUMERIC DEFAULT 80,
  image_url TEXT DEFAULT '',
  symptoms JSONB DEFAULT '[]',
  organic_treatments JSONB DEFAULT '[]',
  chemical_treatments JSONB DEFAULT '[]',
  cause TEXT DEFAULT '',
  irrigation_advice JSONB DEFAULT '[]',
  soil_advice JSONB DEFAULT '[]',
  recommended_products JSONB DEFAULT '[]',
  summary TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crop_analyses_farmer ON crop_analyses(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crop_analyses_created ON crop_analyses(created_at);

ALTER TABLE crop_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_crop_analyses" ON crop_analyses FOR ALL USING (true) WITH CHECK (true);
