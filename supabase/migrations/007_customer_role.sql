-- ============================================================
-- Migration 007 — allow the CUSTOMER role (customer marketplace)
--
-- Run this ONCE in the Supabase SQL Editor (same steps as 001–006):
--   supabase.com/dashboard → SQL Editor → New query → paste → Run
--
-- Why: the farmers.role column has a CHECK constraint that only
-- accepts FARMER / DEALER / ADMIN, so CUSTOMER registrations fail
-- with:  new row for relation "farmers" violates check constraint
-- "farmers_role_check".
--
-- Safe to re-run: drops and recreates the constraint if it exists.
-- ============================================================

-- Remove the old constraint (no-op if it was already removed)
ALTER TABLE public.farmers
  DROP CONSTRAINT IF EXISTS farmers_role_check;

-- Recreate it allowing all four roles
ALTER TABLE public.farmers
  ADD CONSTRAINT farmers_role_check
  CHECK (role IN ('FARMER', 'DEALER', 'ADMIN', 'CUSTOMER'));
