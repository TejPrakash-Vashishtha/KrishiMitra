-- 005 — Merchant (dealer) fields for the FARMER vs MERCHANT split.
-- Run this ONCE in the Supabase Dashboard → SQL Editor (like migrations 001–004).
-- Safe to re-run: uses IF NOT EXISTS.

-- Shop details shown on the merchant dashboard / dealers page
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS shop_name TEXT DEFAULT '';
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS shop_category TEXT DEFAULT '';

-- (Optional) verify:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'farmers' AND column_name LIKE 'shop_%';
