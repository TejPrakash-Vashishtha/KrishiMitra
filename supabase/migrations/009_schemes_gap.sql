-- ============================================================
-- Migration 009 — Government Schemes layer (Phases 1-5)
-- Additive only: new tables + new nullable columns on farmers.
-- Run once in the Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).
-- ============================================================

-- ---------- 1. schemes catalog ----------
CREATE TABLE IF NOT EXISTS schemes (
  id TEXT PRIMARY KEY,
  scheme_name TEXT NOT NULL,
  hindi_name TEXT DEFAULT '',
  description TEXT NOT NULL,
  benefit_summary TEXT NOT NULL,
  category TEXT DEFAULT 'central',
  eligibility_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  official_apply_url TEXT NOT NULL,
  required_documents TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_schemes" ON schemes;
CREATE POLICY "allow_all_schemes" ON schemes FOR ALL USING (true) WITH CHECK (true);

INSERT INTO schemes (id, scheme_name, hindi_name, description, benefit_summary, category, eligibility_rules, official_apply_url, required_documents) VALUES
(
  'pm-kisan',
  'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
  'किसान सम्मान निधि',
  'Income support of Rs 6,000/year paid in 3 equal installments of Rs 2,000 directly to the bank accounts of landholding farmer families.',
  'Rs 6,000/year directly in your bank account',
  'central',
  '{"landholderRequired": true, "excludeIncomeTaxPayers": true, "requiresAadhaar": true, "requiresBankAccount": true}'::jsonb,
  'https://pmkisan.gov.in',
  ARRAY['Aadhaar Card', 'Bank account (passbook or cancelled cheque)', 'Land record (Khatauni / Khasra / 7-12)']
),
(
  'pmfby',
  'PMFBY (Pradhan Mantri Fasal Bima Yojana)',
  'फसल बीमा योजना',
  'Crop insurance against natural calamities, pests and diseases. Farmer pays only 2% premium for Kharif food crops, 1.5% for Rabi food crops, 5% for annual commercial/horticultural crops; the rest is paid by government.',
  'Insure your crop — 2% (Kharif) / 1.5% (Rabi) premium only',
  'central',
  '{"cropTypes": ["Paddy", "Wheat", "Maize", "Bajra", "Jowar", "Barley", "Gram", "Arhar", "Moong", "Urad", "Mustard", "Groundnut", "Soybean", "Sugarcane", "Cotton", "Potato", "Onion", "Tomato"], "requiresLandRecords": true, "requiresBankAccount": true}'::jsonb,
  'https://pmfby.gov.in',
  ARRAY['Aadhaar Card', 'Bank account (passbook or cancelled cheque)', 'Land record or tenancy agreement (Khatauni / Khasra / 7-12)', 'Sowing certificate (Girdawari)']
),
(
  'kcc',
  'Kisan Credit Card (KCC)',
  'किसान क्रेडिट कार्ड',
  'Short-term crop loans up to Rs 3 lakh at a 7% interest rate with a 3% Prompt Repayment Incentive, making the effective rate as low as 4%. Covers cultivation cost, post-harvest expenses and allied activities (dairy, fishery).',
  'Crop loan up to Rs 3 lakh at ~4% effective interest',
  'central',
  '{"minAge": 18, "requiresLandRecords": true, "requiresBankAccount": true}'::jsonb,
  'https://www.myscheme.gov.in/schemes/kcc',
  ARRAY['Identity proof (Aadhaar / Voter ID)', 'Bank account in the lending bank', 'Land record (Khatauni / Khasra / 7-12) or tenancy agreement', 'Crop plan (fasal yojana)']
),
(
  'pm-kisan-maandhan',
  'PM-KISAN Maandhan (Kisan Pension Yojana)',
  'किसान पेंशन योजना',
  'Voluntary contributory pension for small & marginal farmers: contribute Rs 55-200/month (50% matched by government) between ages 18-40 and receive Rs 3,000/month pension after age 60. Enrolment via CSC.',
  'Rs 3,000/month pension after age 60',
  'central',
  '{"minAge": 18, "maxAge": 40, "landMaxAcres": 4.94, "landholderRequired": true, "requiresAadhaar": true, "requiresBankAccount": true}'::jsonb,
  'https://maandhan.in',
  ARRAY['Aadhaar Card', 'Savings bank account with JMIFR (Jan Dhan or any bank)', 'Land record (Khatauni / Khasra / 7-12)']
),
(
  'soil-health-card',
  'Soil Health Card Scheme',
  'मृदा स्वास्थ्य कार्ड',
  'Free soil testing every 2 years: a card reporting your field''s N-P-K, pH, organic carbon and micronutrients with crop-wise fertilizer recommendations. Available to all farmers.',
  'Free soil test + fertilizer recommendation every 2 years',
  'central',
  '{}'::jsonb,
  'https://soilhealth.dac.gov.in',
  ARRAY['No documents needed — apply free at your nearest soil testing lab or Krishi Vigyan Kendra']
),
(
  'up-kisan-kalyan',
  'Mukhyamantri Kisan Kalyan Yojana (Uttar Pradesh)',
  'मुख्यमंत्री किसान कल्याण योजना',
  'Uttar Pradesh top-up to PM-KISAN: eligible UP farmers who receive PM-KISAN get an additional Rs 1,000/year from the state government (total Rs 7,000/year).',
  'Extra Rs 1,000/year on top of PM-KISAN (UP only)',
  'state',
  '{"states": ["Uttar Pradesh", "UP", "U.P."], "requiresSchemeId": "pm-kisan"}'::jsonb,
  'https://upagripardhi.gov.in',
  ARRAY['Aadhaar Card', 'PM-KISAN beneficiary ID', 'Land record (Khatauni / Khasra / 7-12)']
)
ON CONFLICT (id) DO NOTHING;

-- ---------- 2. farmer scheme feedback (Phases 4-5) ----------
CREATE TABLE IF NOT EXISTS farmer_scheme_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL,
  scheme_id TEXT NOT NULL REFERENCES schemes(id),
  received_benefits BOOLEAN,
  applied_no_response BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (farmer_id, scheme_id)
);

ALTER TABLE farmer_scheme_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_scheme_feedback" ON farmer_scheme_feedback;
CREATE POLICY "allow_all_scheme_feedback" ON farmer_scheme_feedback FOR ALL USING (true) WITH CHECK (true);

-- ---------- 3. profile fields the matcher reads (additive, nullable) ----------
ALTER TABLE farmers
  ADD COLUMN IF NOT EXISTS land_acres NUMERIC,
  ADD COLUMN IF NOT EXISTS crop_type TEXT,
  ADD COLUMN IF NOT EXISTS annual_income_inr NUMERIC,
  ADD COLUMN IF NOT EXISTS bank_account_linked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS aadhaar_linked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS land_records_uploaded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_income_tax_payer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS age INTEGER;

-- ---------- 4. static beneficiary snapshot (Phase 4 — open dataset, NOT a live API) ----------
CREATE TABLE IF NOT EXISTS scheme_beneficiary_stats (
  id TEXT PRIMARY KEY,
  scheme_id TEXT NOT NULL REFERENCES schemes(id),
  scope TEXT NOT NULL,                    -- 'India' or 'Uttar Pradesh'
  beneficiaries BIGINT,
  as_of TEXT NOT NULL,                    -- snapshot label, shown honestly in UI
  source TEXT NOT NULL
);

ALTER TABLE scheme_beneficiary_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_beneficiary_stats" ON scheme_beneficiary_stats;
CREATE POLICY "allow_all_beneficiary_stats" ON scheme_beneficiary_stats FOR ALL USING (true) WITH CHECK (true);

INSERT INTO scheme_beneficiary_stats (id, scheme_id, scope, beneficiaries, as_of, source) VALUES
('pmkisan-india', 'pm-kisan', 'India', 110000000, '2024 snapshot', 'PM-KISAN beneficiary dashboard (pmkisan.gov.in) / data.gov.in — static snapshot'),
('pmkisan-up', 'pm-kisan', 'Uttar Pradesh', 29000000, '2024 snapshot', 'PM-KISAN beneficiary dashboard (pmkisan.gov.in) / data.gov.in — static snapshot'),
('pmfby-india', 'pmfby', 'India', 40000000, 'FY 2023-24 snapshot', 'PMFBY annual enrolment (pmfby.gov.in) / data.gov.in — static snapshot')
ON CONFLICT (id) DO NOTHING;
