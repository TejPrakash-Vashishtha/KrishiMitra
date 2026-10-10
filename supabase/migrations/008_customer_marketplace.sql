-- ============================================================
-- Migration 008 — customer marketplace storage (Phases 3–6)
--
-- Run this ONCE in the Supabase SQL Editor (same steps as 001–007):
--   supabase.com/dashboard → SQL Editor → New query → paste → Run
--
-- What it adds:
--   1. farmers.role can now be 'CUSTOMER' (if 007 wasn't run yet)
--   2. farmer_inventory.product_type  → 'fresh' | 'processed'
--      (lets farmers list pickles, honey, flour next to fresh crops)
--   3. farmer_inventory.image_emoji   → quick product icon/emoji
--   4. customer_orders                → customer cart checkouts
--      (separate from merchant 'orders' so both flows stay clean)
--   5. chat_messages                  → real Contact Farmer chat,
--      stored in DB so it works even without the socket backend
--
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS guards.
-- ============================================================

-- 1. Allow CUSTOMER role (covers users who skipped migration 007)
ALTER TABLE public.farmers
  DROP CONSTRAINT IF EXISTS farmers_role_check;
ALTER TABLE public.farmers
  ADD CONSTRAINT farmers_role_check
  CHECK (role IN ('FARMER', 'DEALER', 'ADMIN', 'CUSTOMER'));

-- 2 + 3. Product type & emoji on farmer inventory
ALTER TABLE public.farmer_inventory
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'fresh';
ALTER TABLE public.farmer_inventory
  ADD COLUMN IF NOT EXISTS image_emoji TEXT NOT NULL DEFAULT '🌱';

-- 4. Customer orders (user → farmer purchases)
CREATE TABLE IF NOT EXISTS public.customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  total_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PLACED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Real chat messages (customer/merchant ↔ farmer)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_key TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv
  ON public.chat_messages (conversation_key, created_at);

-- ------------------------------------------------------------
-- Row Level Security: the app uses the anon key, so keep the
-- same open policy style as the existing demo tables.
-- ------------------------------------------------------------
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_customer_orders" ON public.customer_orders;
CREATE POLICY "allow_all_customer_orders" ON public.customer_orders
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_chat_messages" ON public.chat_messages;
CREATE POLICY "allow_all_chat_messages" ON public.chat_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Realtime for live chat + live marketplace updates
-- (Realtime replication itself must be enabled per-table in the
--  Supabase Dashboard → Database → Replication, like migration 003.)
