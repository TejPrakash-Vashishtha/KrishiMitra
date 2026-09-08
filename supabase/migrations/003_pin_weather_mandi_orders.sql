-- =====================================================
-- AgriNexus: PIN Login + Weather History + Mandi Price History + Orders
-- Run this in: Supabase Dashboard → SQL Editor → paste → Run
-- =====================================================

-- =====================================================
-- 1. PIN LOGIN: add hash column to farmers
--    The PIN is stored as a SHA-256 hash, never as plain text.
-- =====================================================
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS pin_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone);

-- =====================================================
-- 2. CROP STOCK: add optional notes column to farmer_inventory
--    (matches the Crop Stock UI so "Add Harvest" stores every field)
-- =====================================================
ALTER TABLE farmer_inventory ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- =====================================================
-- 3. WEATHER HISTORY (rolling 10 days)
--    One row per city per date. The app upserts today's row and
--    deletes rows older than 10 days after each fetch.
-- =====================================================
CREATE TABLE IF NOT EXISTS weather_history (
  id BIGSERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  district TEXT DEFAULT '',
  state TEXT DEFAULT '',
  weather_date DATE NOT NULL,
  temperature NUMERIC,
  humidity NUMERIC,
  wind_speed NUMERIC,
  rainfall_chance NUMERIC,
  condition TEXT DEFAULT '',
  forecast_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(city, weather_date)
);

-- =====================================================
-- 4. MANDI PRICE HISTORY (rolling 14 days)
--    One row per mandi + crop + date. The app upserts the daily
--    snapshot and prunes rows older than 14 days.
-- =====================================================
CREATE TABLE IF NOT EXISTS mandi_price_history (
  id BIGSERIAL PRIMARY KEY,
  mandi TEXT NOT NULL,
  district TEXT DEFAULT '',
  state TEXT DEFAULT '',
  crop TEXT NOT NULL,
  price NUMERIC NOT NULL,
  unit TEXT DEFAULT 'quintal',
  price_date DATE NOT NULL,
  change NUMERIC DEFAULT 0,
  change_percent NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(mandi, crop, price_date)
);

-- =====================================================
-- 5. ORDERS (permanent order history & records)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  crop TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Order line-items (records per product inside an order)
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  crop TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  price_per_unit NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_weather_city_date ON weather_history(city, weather_date);
CREATE INDEX IF NOT EXISTS idx_mandi_price ON mandi_price_history(mandi, crop, price_date);
CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =====================================================
-- ROW LEVEL SECURITY (allow-all, matching existing app auth style)
-- =====================================================
ALTER TABLE weather_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandi_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_weather_history" ON weather_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_mandi_history" ON mandi_price_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);