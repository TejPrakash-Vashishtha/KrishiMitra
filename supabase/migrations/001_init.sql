-- =====================================================
-- AgriNexus Database Schema for Supabase
-- Run this in: Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Farmers table (profiles)
CREATE TABLE IF NOT EXISTS farmers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  village TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  district TEXT DEFAULT '',
  pincode VARCHAR(10) DEFAULT '',
  address TEXT DEFAULT '',
  role TEXT DEFAULT 'FARMER' CHECK (role IN ('FARMER', 'DEALER', 'ADMIN')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. OTP verification table
CREATE TABLE IF NOT EXISTS otp_codes (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Search history table
CREATE TABLE IF NOT EXISTS search_history (
  id BIGSERIAL PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  search_type TEXT NOT NULL CHECK (search_type IN ('mandi_price', 'crop_diagnosis', 'weather', 'marketplace', 'general')),
  search_query TEXT NOT NULL,
  search_result JSONB,
  location TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Farmer activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Farmer inventory (crop stock)
CREATE TABLE IF NOT EXISTS farmer_inventory (
  id BIGSERIAL PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  grade TEXT DEFAULT 'B' CHECK (grade IN ('A', 'B', 'C')),
  storage_location TEXT DEFAULT 'home',
  harvest_date DATE,
  price_per_unit NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'listed', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Marketplace listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id BIGSERIAL PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  grade TEXT DEFAULT 'B',
  asking_price NUMERIC DEFAULT 0,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_search_history_farmer ON search_history(farmer_id);
CREATE INDEX IF NOT EXISTS idx_search_history_type ON search_history(search_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_farmer ON activity_log(farmer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_farmer ON farmer_inventory(farmer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_farmer ON marketplace_listings(farmer_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- Permissive policies for our custom OTP auth system
-- (not using Supabase Auth, so policies allow anon key access)
-- =====================================================

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Allow all operations via anon key (our app handles auth logic)
CREATE POLICY "allow_all_farmers" ON farmers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_otp" ON otp_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_search" ON search_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_activity" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_inventory" ON farmer_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_marketplace" ON marketplace_listings FOR ALL USING (true) WITH CHECK (true);
