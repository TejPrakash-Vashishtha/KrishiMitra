-- ============================================================
-- Migration 007 — Customer Dashboard / Farmer-Pooling Model
-- Collection points (FPO-style), pooled inventory, farmer
-- contribution records, escrow-style customer pre-orders,
-- and seasonal produce-box subscriptions.
--
-- Run AFTER migrations 001-006.
-- Safe to re-run (IF NOT EXISTS everywhere).
-- ============================================================

-- 1. COLLECTION POINTS ---------------------------------------
create table if not exists collection_points (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null default '',
  address text not null default '',
  village text not null default '',
  district text not null default '',
  state text not null default '',
  coordinator_id uuid references farmers(id) on delete set null,
  coordinator_name text not null default '',
  coordinator_phone text not null default '',
  photo_url text not null default '',
  verified boolean not null default false,
  rating numeric(2,1) not null default 4.5,
  contributing_farmer_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. COLLECTION POINT INVENTORY -------------------------------
-- The pooled stock customers actually browse and order from.
create table if not exists collection_point_inventory (
  id uuid primary key default gen_random_uuid(),
  collection_point_id uuid not null references collection_points(id) on delete cascade,
  crop_name text not null,
  quantity_kg numeric not null default 0,          -- always stored in kg
  reserved_kg numeric not null default 0,          -- held by open pre-orders
  grade text not null default 'A',
  season text not null default '',                 -- e.g. Kharif 2026
  harvest_date date,
  ready_from_date date,                            -- earliest pickup/fulfilment date
  price_per_kg numeric not null default 0,
  status text not null default 'available',        -- available | depleted
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. FARMER CONTRIBUTION RECORDS -------------------------------
-- Trace every pooled batch back to the farmer(s) who supplied it.
create table if not exists farmer_contributions (
  id uuid primary key default gen_random_uuid(),
  collection_point_id uuid not null references collection_points(id) on delete cascade,
  inventory_id uuid references collection_point_inventory(id) on delete cascade,
  farmer_id uuid not null references farmers(id) on delete cascade,
  farmer_name text not null default '',
  crop_name text not null,
  quantity_kg numeric not null default 0,
  source_inventory_id uuid references farmer_inventory(id) on delete set null, -- the farmer's own harvest record
  channel text not null default 'customer_pool', -- customer_pool | merchant (informational)
  payout_share numeric not null default 0,       -- farmer's share of pool proceeds (kg-weighted)
  payout_amount numeric not null default 0,      -- released when the order is confirmed
  payout_status text not null default 'pending', -- pending | released
  created_at timestamptz not null default now()
);

-- 4. CUSTOMER PRE-ORDERS (escrow-style) ------------------------
create table if not exists customer_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_id text not null default '',            -- loose ref; customers may be unregistered demo users
  collection_point_id uuid not null references collection_points(id) on delete cascade,
  inventory_id uuid references collection_point_inventory(id) on delete set null,
  crop_name text not null,
  quantity_kg numeric not null default 0,
  price_per_kg numeric not null default 0,
  total_amount numeric not null default 0,
  payment_status text not null default 'held_in_escrow', -- held_in_escrow | released | refunded
  escrow_released_at timestamptz,
  fulfilment_mode text not null default 'pickup',  -- pickup | scheduled_slot
  pickup_point text not null default '',
  slot_date date,
  slot_label text not null default '',             -- e.g. "Sat 9-11 AM"
  ready_date date,
  pooled_batch_id text not null default '',        -- community pooling group
  status text not null default 'pending',          -- pending | confirmed | in_transit | ready | delivered | cancelled
  items jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. PRODUCE BOX SUBSCRIPTIONS ---------------------------------
create table if not exists customer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_id text not null default '',
  collection_point_id uuid not null references collection_points(id) on delete cascade,
  frequency text not null default 'weekly',        -- weekly | fortnightly
  box_size_kg numeric not null default 5,
  next_delivery_date date,
  status text not null default 'active',           -- active | paused | cancelled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. HARVEST CHANNEL SPLIT on the farmer's own stock -----------
-- One harvest record feeds both channels; the split stays visible.
alter table farmer_inventory
  add column if not exists allocated_merchant_kg numeric not null default 0,
  add column if not exists allocated_pool_kg numeric not null default 0,
  add column if not exists allocation_note text not null default '';

-- 7. RLS: demo-mode open policies (same model as migrations 001-006)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'collection_points') then
    create policy "allow_all_collection_points" on collection_points for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'collection_point_inventory') then
    create policy "allow_all_cp_inventory" on collection_point_inventory for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'farmer_contributions') then
    create policy "allow_all_contributions" on farmer_contributions for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'customer_orders') then
    create policy "allow_all_customer_orders" on customer_orders for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'customer_subscriptions') then
    create policy "allow_all_subscriptions" on customer_subscriptions for all using (true) with check (true);
  end if;
end $$;

-- 8. Realtime (optional but matches existing tables' behaviour)
alter publication supabase_realtime add table collection_point_inventory;
alter publication supabase_realtime add table customer_orders;
