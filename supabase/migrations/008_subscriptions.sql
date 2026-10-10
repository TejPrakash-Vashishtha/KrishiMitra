-- =====================================================
-- 008 — Farmer Subscriptions (KrishiMitra Pro — ₹999/year)
-- Full physical soil/moisture sensor kit + installation + land data
-- + unlimited AI features.
-- Run in: Supabase Dashboard → SQL Editor → paste → Run
-- Safe to re-run: uses IF NOT EXISTS.
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'pro_annual',
  amount_inr NUMERIC NOT NULL DEFAULT 999,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_payment', 'cancelled', 'expired')),
  payment_ref TEXT DEFAULT '',               -- Razorpay payment/link id (optional)
  sensor_install_status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (sensor_install_status IN ('scheduled', 'installing', 'installed')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(farmer_id, plan)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_farmer ON subscriptions(farmer_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_subscriptions" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
