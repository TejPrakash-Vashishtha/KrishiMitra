-- ============================================================
-- Migration 008 — CUSTOMER role support
-- Adds "CUSTOMER" to the farmers.role CHECK constraint so
-- customers can register and login to the customer dashboard.
--
-- Run AFTER migrations 001-007. Safe to re-run.
-- ============================================================

-- 1. Find the existing role constraint (name varies by how 001 was applied)
do $$
declare
  conname text;
begin
  select c.conname into conname
  from pg_constraint c
  join pg_class t on c.conrelid = t.oid
  where t.relname = 'farmers'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%role%';

  if conname is not null then
    execute format('alter table farmers drop constraint %I', conname);
  end if;
end $$;

-- 2. Recreate it with CUSTOMER included
alter table farmers
  drop constraint if exists farmers_role_check;

alter table farmers
  add constraint farmers_role_check
  check (role in ('FARMER', 'DEALER', 'ADMIN', 'CUSTOMER'));

-- 3. Make sure the role column itself exists (no-op if already there)
alter table farmers
  add column if not exists role text not null default 'FARMER';
