-- =====================================================
-- 006 — Merchant Experience (Phase 2A)
-- AgriNexus: merchant deals history + farmer ratings + GPS columns
-- Run this in: Supabase Dashboard → SQL Editor → paste → Run
-- Safe to re-run: uses IF NOT EXISTS.
-- =====================================================

-- =====================================================
-- 1. MERCHANT DEALS (purchase history for the merchant dashboard)
--    One row per "Request to Buy" a merchant places on farmer stock.
-- =====================================================
CREATE TABLE IF NOT EXISTS merchant_deals (
  id BIGSERIAL PRIMARY KEY,
  merchant_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  inventory_id BIGINT REFERENCES farmer_inventory(id) ON DELETE SET NULL,
  crop TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  price_per_unit NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_merchant_deals_merchant ON merchant_deals(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_deals_farmer ON merchant_deals(farmer_id);
CREATE INDEX IF NOT EXISTS idx_merchant_deals_created ON merchant_deals(created_at);

-- =====================================================
-- 2. FARMER RATINGS (Snapdeal-style star ratings from merchants)
--    Average shown on search results and farmer profile.
-- =====================================================
CREATE TABLE IF NOT EXISTS farmer_ratings (
  id BIGSERIAL PRIMARY KEY,
  merchant_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  deal_id BIGINT REFERENCES merchant_deals(id) ON DELETE SET NULL,
  stars NUMERIC NOT NULL CHECK (stars >= 1 AND stars <= 5),
  review TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_farmer_ratings_farmer ON farmer_ratings(farmer_id);

-- =====================================================
-- 3. GPS COLUMNS on farmers (optional now, used later for
--    true distance-based "near me" sorting)
-- =====================================================
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS lon NUMERIC;

-- =====================================================
-- 4. INDEX for crop search on farmer inventory
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_farmer_inventory_crop ON farmer_inventory(crop_name);

-- =====================================================
-- 5. ROW LEVEL SECURITY (allow-all, matching existing app auth style)
-- =====================================================
ALTER TABLE merchant_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_merchant_deals" ON merchant_deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_farmer_ratings" ON farmer_ratings FOR ALL USING (true) WITH CHECK (true);
