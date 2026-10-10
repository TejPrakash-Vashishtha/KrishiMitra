// ============================================================
// Government Schemes — Eligibility Rules Engine (Phases 1 & 2)
// ============================================================
// Plain TypeScript, zero runtime AI calls. Pure function of
// (farmer profile, scheme rules) -> match verdict + plain-language
// reasons/exclusions. The same eligibility_rules JSONB powers the
// /schemes matcher page AND the document-readiness checklist, so the
// checklist can never drift from the match verdict.
//
// SCHEMES below is the frontend fallback copy of migration 009's
// seed (Supabase-first, seed fallback — the established app pattern).
// eligibility_rules JSONB keys:
//   landholderRequired?     PM-KISAN / Maandhan need owned/operated land
//   excludeIncomeTaxPayers? PM-KISAN
//   requiresAadhaar?        (document checklist side)
//   requiresBankAccount?    (document checklist side)
//   requiresLandRecords?    (document checklist side)
//   minAge? / maxAge?       KCC 18+, Maandhan 18-40
//   landMaxAcres?           Maandhan: 2 ha = 4.94 acres
//   cropTypes?              PMFBY notified-crop list
//   states?                 UP-Kisan-Kalyan: ["Uttar Pradesh", "UP", "U.P."]
//   requiresSchemeId?       UP-Kisan-Kalyan requires PM-KISAN first
// ============================================================

export interface SchemeRules {
  landholderRequired?: boolean;
  excludeIncomeTaxPayers?: boolean;
  requiresAadhaar?: boolean;
  requiresBankAccount?: boolean;
  requiresLandRecords?: boolean;
  minAge?: number;
  maxAge?: number;
  landMaxAcres?: number;
  cropTypes?: string[];
  states?: string[];
  requiresSchemeId?: string;
}

export interface FarmerProfile {
  state?: string;
  district?: string;
  age?: number | null;
  land_acres?: number | null; // 1 acre = 0.4047 ha; 2 ha = 4.94 acres
  crop_type?: string | null;
  annual_income_inr?: number | null;
  aadhaar_linked?: boolean;
  bank_account_linked?: boolean;
  land_records_uploaded?: boolean;
  is_income_tax_payer?: boolean;
}

// ---------- Seed catalog (mirrors supabase/migrations/009_schemes_gap.sql) ----------
export interface Scheme {
  id: string;
  scheme_name: string;
  hindi_name: string;
  /** Short stable key used to build translation keys (scheme{Key}Name etc.) */
  key: string;
  description: string;
  benefit_summary: string;
  category: "central" | "state";
  eligibility_rules: SchemeRules;
  official_apply_url: string;
  required_documents: string[];
}

export const TWO_HA_IN_ACRES = 4.94; // 2 hectares, rounded to 2 decimals

export const SCHEMES: Scheme[] = [
  {
    id: "pm-kisan",
    key: "Pmkisan",
    scheme_name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    hindi_name: "किसान सम्मान निधि",
    description:
      "Income support of Rs 6,000/year paid in 3 equal installments of Rs 2,000 directly to the bank accounts of landholding farmer families.",
    benefit_summary: "Rs 6,000/year directly in your bank account",
    category: "central",
    eligibility_rules: {
      landholderRequired: true,
      excludeIncomeTaxPayers: true,
      requiresAadhaar: true,
      requiresBankAccount: true,
    },
    official_apply_url: "https://pmkisan.gov.in",
    required_documents: [
      "Aadhaar Card",
      "Bank account (passbook or cancelled cheque)",
      "Land record (Khatauni / Khasra / 7-12)",
    ],
  },
  {
    id: "pmfby",
    key: "Pmfby",
    scheme_name: "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
    hindi_name: "फसल बीमा योजना",
    description:
      "Crop insurance against natural calamities, pests and diseases. Farmer pays only 2% premium for Kharif food crops, 1.5% for Rabi food crops, 5% for annual commercial/horticultural crops — the government pays the rest.",
    benefit_summary: "Insure your crop — 2% (Kharif) / 1.5% (Rabi) premium only",
    category: "central",
    eligibility_rules: {
      cropTypes: [
        "Paddy", "Wheat", "Maize", "Bajra", "Jowar", "Barley", "Gram", "Arhar",
        "Moong", "Urad", "Mustard", "Groundnut", "Soybean", "Sugarcane",
        "Cotton", "Potato", "Onion", "Tomato",
      ],
      requiresLandRecords: true,
      requiresBankAccount: true,
    },
    official_apply_url: "https://pmfby.gov.in",
    required_documents: [
      "Aadhaar Card",
      "Bank account (passbook or cancelled cheque)",
      "Land record or tenancy agreement (Khatauni / Khasra / 7-12)",
      "Sowing certificate (Girdawari)",
    ],
  },
  {
    id: "kcc",
    key: "Kcc",
    scheme_name: "Kisan Credit Card (KCC)",
    hindi_name: "किसान क्रेडिट कार्ड",
    description:
      "Short-term crop loans up to Rs 3 lakh at a 7% interest rate with a 3% Prompt Repayment Incentive, making the effective rate as low as 4%. Covers cultivation cost, post-harvest expenses and allied activities (dairy, fishery).",
    benefit_summary: "Crop loan up to Rs 3 lakh at ~4% effective interest",
    category: "central",
    eligibility_rules: {
      minAge: 18,
      requiresLandRecords: true,
      requiresBankAccount: true,
    },
    official_apply_url: "https://www.myscheme.gov.in/schemes/kcc",
    required_documents: [
      "Identity proof (Aadhaar / Voter ID)",
      "Bank account in the lending bank",
      "Land record (Khatauni / Khasra / 7-12) or tenancy agreement",
      "Crop plan (fasal yojana)",
    ],
  },
  {
    id: "pm-kisan-maandhan",
    key: "Maandhan",
    scheme_name: "PM-KISAN Maandhan (Kisan Pension Yojana)",
    hindi_name: "किसान पेंशन योजना",
    description:
      "Voluntary contributory pension for small & marginal farmers: contribute Rs 55-200/month (50% matched by government) between ages 18-40 and receive Rs 3,000/month pension after age 60. Enrolment via Common Service Centres.",
    benefit_summary: "Rs 3,000/month pension after age 60",
    category: "central",
    eligibility_rules: {
      minAge: 18,
      maxAge: 40,
      landMaxAcres: TWO_HA_IN_ACRES,
      landholderRequired: true,
      requiresAadhaar: true,
      requiresBankAccount: true,
    },
    official_apply_url: "https://maandhan.in",
    required_documents: [
      "Aadhaar Card",
      "Savings bank account (Jan Dhan or any bank)",
      "Land record (Khatauni / Khasra / 7-12)",
    ],
  },
  {
    id: "soil-health-card",
    key: "Shc",
    scheme_name: "Soil Health Card Scheme",
    hindi_name: "मृदा स्वास्थ्य कार्ड",
    description:
      "Free soil testing every 2 years: a card reporting your field's N-P-K, pH, organic carbon and micronutrients with crop-wise fertilizer recommendations. Available to all farmers.",
    benefit_summary: "Free soil test + fertilizer recommendation every 2 years",
    category: "central",
    eligibility_rules: {},
    official_apply_url: "https://soilhealth.dac.gov.in",
    required_documents: [
      "No documents needed — apply free at your nearest soil testing lab or Krishi Vigyan Kendra",
    ],
  },
  {
    id: "up-kisan-kalyan",
    key: "Upkk",
    scheme_name: "Mukhyamantri Kisan Kalyan Yojana (Uttar Pradesh)",
    hindi_name: "मुख्यमंत्री किसान कल्याण योजना",
    description:
      "Uttar Pradesh top-up to PM-KISAN: eligible UP farmers who receive PM-KISAN get an additional Rs 1,000/year from the state government (total Rs 7,000/year).",
    benefit_summary: "Extra Rs 1,000/year on top of PM-KISAN (UP only)",
    category: "state",
    eligibility_rules: {
      states: ["Uttar Pradesh", "UP", "U.P."],
      requiresSchemeId: "pm-kisan",
    },
    official_apply_url: "https://upagripardhi.gov.in",
    required_documents: [
      "Aadhaar Card",
      "PM-KISAN beneficiary ID",
      "Land record (Khatauni / Khasra / 7-12)",
    ],
  },
];

// ---------- Eligibility rules engine (pure, deterministic) ----------
export interface I18nText {
  code: string;
  params?: Record<string, string | number>;
  en: string; // English fallback (also used by tests)
}

export interface SchemeMatch {
  scheme: Scheme;
  eligible: boolean;
  reasons: string[]; // English fallback text
  blockers: string[];
  reasonI18n: I18nText[]; // rendered via t(code) + params in the UI
  blockerI18n: I18nText[];
  missingProfileFields: string[]; // profile fields to add, e.g. ["land_acres"]
}

export interface MatchResult {
  matched: SchemeMatch[];
  excluded: SchemeMatch[];
}

const ACRES_PER_HECTARE = 2.47105;

const STATE_ALIASES: Record<string, string> = {
  up: "uttar pradesh",
  "uttar pradesh": "uttar pradesh",
  mp: "madhya pradesh",
  "madhya pradesh": "madhya pradesh",
  tn: "tamil nadu",
  "tamil nadu": "tamil nadu",
  jk: "jammu and kashmir",
  "jammu and kashmir": "jammu and kashmir",
};

function normalizeState(s: string): string {
  const k = s
    .toLowerCase()
    .replace(/[^a-z& ]/g, " ") // strips dots from "u.p."
    .replace(/\s+/g, " ")
    .trim();
  return STATE_ALIASES[k] || k;
}

function normalizeCrop(c: string): string {
  return c.trim().toLowerCase().replace(/\s+/g, " ");
}

function fmtAcres(n: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(2);
}

export function matchSchemes(p: FarmerProfile, schemes: Scheme[] = SCHEMES): MatchResult {
  // Pass 1: verdict per scheme (without dependency checks)
  const verdicts = new Map<string, { reasons: I18nText[]; blockers: I18nText[]; missing: string[] }>();
  for (const scheme of schemes) {
    const r = scheme.eligibility_rules || {};
    const reasons: I18nText[] = [];
    const blockers: I18nText[] = [];
    const missing: string[] = [];
    const pushMissing = (field: string) => {
      if (!missing.includes(field)) missing.push(field);
    };
    const addReason = (code: string, en: string, params?: Record<string, string | number>) => {
      reasons.push({ code, params, en });
    };
    const addBlocker = (code: string, en: string, params?: Record<string, string | number>) => {
      blockers.push({ code, params, en });
    };

    // ---- Profile completeness (soft-fail: "excluded" with an actionable hint) ----
    if (r.landholderRequired && (p.land_acres == null || p.land_acres <= 0)) {
      pushMissing("land_acres");
      addBlocker("blockerAddLand", "Add your land holding in your profile to confirm land-based eligibility");
    }
    if (r.minAge != null && (p.age == null || p.age <= 0)) {
      pushMissing("age");
      addBlocker("blockerAddAge", `Add your age in your profile — minimum age is ${r.minAge}`, { min: r.minAge });
    }
    if (r.cropTypes && (!p.crop_type || p.crop_type.trim() === "")) {
      pushMissing("crop_type");
      addBlocker("blockerAddCrop", "Add your main crop in your profile to check the notified crop list");
    }
    if (r.states && !p.state) {
      pushMissing("state");
      addBlocker("blockerAddState", "Add your state in your profile to check state-scheme eligibility");
    }

    // ---- Hard rules ----
    if (r.excludeIncomeTaxPayers && p.is_income_tax_payer === true) {
      addBlocker("blockerTaxPayer", "Income-tax payers are excluded from PM-KISAN");
    }
    if (r.landMaxAcres != null && p.land_acres != null && p.land_acres > r.landMaxAcres + 1e-9) {
      addBlocker(
        "blockerLandMax",
        `Land holding (${fmtAcres(p.land_acres)} acres ≈ ${(p.land_acres / ACRES_PER_HECTARE).toFixed(2)} ha) exceeds the ${r.landMaxAcres}-acre (2 ha) small & marginal farmer limit`,
        { acres: fmtAcres(p.land_acres), ha: (p.land_acres! / ACRES_PER_HECTARE).toFixed(2), max: r.landMaxAcres }
      );
    }
    if (r.minAge != null && p.age != null && p.age > 0 && p.age < r.minAge) {
      addBlocker("blockerAgeMin", `Minimum age is ${r.minAge} years (you reported ${p.age})`, { min: r.minAge, age: p.age! });
    }
    if (r.maxAge != null && p.age != null && p.age > r.maxAge) {
      addBlocker("blockerAgeMax", `Maximum age is ${r.maxAge} years (you reported ${p.age})`, { max: r.maxAge, age: p.age! });
    }
    if (r.cropTypes && p.crop_type && !r.cropTypes.map(normalizeCrop).includes(normalizeCrop(p.crop_type))) {
      addBlocker("blockerCropNotListed", `Your crop (${p.crop_type}) is not on the notified insurance crop list for this season`, { crop: p.crop_type! });
    }
    if (r.states && p.state && !r.states.map(normalizeState).includes(normalizeState(p.state))) {
      addBlocker("blockerStateOnly", `Only farmers in ${r.states[0]} are eligible — this is a state scheme`, { state: r.states![0] });
    }

    buildReasons(p, r, addReason);
    verdicts.set(scheme.id, { reasons, blockers, missing });
  }

  // Pass 2: resolve cross-scheme dependencies (e.g. UP top-up needs PM-KISAN)
  const matched: SchemeMatch[] = [];
  const excluded: SchemeMatch[] = [];
  for (const scheme of schemes) {
    const v = verdicts.get(scheme.id)!;
    const dep = scheme.eligibility_rules?.requiresSchemeId;
    // Dependency rule: block only when the required scheme is itself blocked
    // (if the farmer qualifies for PM-KISAN, they can enrol and get the top-up)
    if (dep && (verdicts.get(dep)?.blockers.length ?? 1) > 0) {
      v.blockers.push({ code: "blockerNeedPmkisan", en: "Requires you to be enrolled in PM-KISAN first" });
    }
    const eligible = v.blockers.length === 0;
    const match: SchemeMatch = {
      scheme,
      eligible,
      reasons: eligible ? v.reasons.map((x) => x.en) : [],
      blockers: v.blockers.map((x) => x.en),
      reasonI18n: eligible ? v.reasons : [],
      blockerI18n: v.blockers,
      missingProfileFields: v.missing,
    };
    (eligible ? matched : excluded).push(match);
  }
  return { matched, excluded };
}

function buildReasons(
  p: FarmerProfile,
  r: SchemeRules,
  add: (code: string, en: string, params?: Record<string, string | number>) => void
): void {
  if (r.landholderRequired && p.land_acres != null && p.land_acres > 0) {
    add("reasonLandHold", `You qualify because you hold ${fmtAcres(p.land_acres)} acres of agricultural land`, { acres: fmtAcres(p.land_acres) });
  }
  if (
    r.landMaxAcres != null &&
    p.land_acres != null &&
    p.land_acres > 0 &&
    p.land_acres <= r.landMaxAcres
  ) {
    add(
      "reasonLandWithinLimit",
      `You qualify because your land holding (${fmtAcres(p.land_acres)} acres) is within the ${r.landMaxAcres}-acre (2 ha) small & marginal farmer limit`,
      { acres: fmtAcres(p.land_acres), max: r.landMaxAcres }
    );
  }
  if (r.excludeIncomeTaxPayers && p.is_income_tax_payer !== true) {
    add("reasonNotTaxPayer", "You qualify because you are not an income-tax payer");
  }
  if (r.minAge != null && p.age != null && p.age >= r.minAge && (r.maxAge == null || p.age <= r.maxAge)) {
    add(
      r.maxAge != null ? "reasonAgeWindow" : "reasonAgeMinOk",
      r.maxAge != null
        ? `You qualify because your age (${p.age}) is within the ${r.minAge}-${r.maxAge} enrolment window`
        : `You meet the minimum age requirement (${r.minAge}+)`,
      { age: p.age!, min: r.minAge, max: r.maxAge ?? 0 }
    );
  }
  if (r.cropTypes && p.crop_type && r.cropTypes.map(normalizeCrop).includes(normalizeCrop(p.crop_type))) {
    add("reasonCropListed", `Your crop (${p.crop_type}) is on the notified insurance crop list`, { crop: p.crop_type });
  }
  if (r.states && p.state && r.states.map(normalizeState).includes(normalizeState(p.state))) {
    add("reasonStateOk", `You qualify because you farm in ${r.states[0]}`, { state: r.states[0] });
  }
  if (r.requiresSchemeId === "pm-kisan" && p.land_acres != null && p.land_acres > 0) {
    add("reasonPmkisanBase", "You qualify because you hold agricultural land and can enrol in PM-KISAN");
  }
}

// ---------- Document ↔ profile mapping (Phase 2 checklist) ----------
export interface DocStatus {
  doc: string;
  have: boolean;
  /** Non-null when this doc maps to a specific profile page that's missing data */
  fixPath: string | null;
  fixLabel: string | null;
  /** Translation key for fixLabel (UI renders t(fixCode) when present) */
  fixCode: string | null;
}

export function assessDocuments(p: FarmerProfile, scheme: Scheme): DocStatus[] {
  return scheme.required_documents.map((doc) => {
    const d = doc.toLowerCase();
    // Aadhaar / identity proof
    if (d.includes("aadhaar") || d.includes("identity proof")) {
      return {
        doc,
        have: !!p.aadhaar_linked,
        fixPath: "/profile",
        fixLabel: "Link your Aadhaar in your Profile",
        fixCode: "docAadhaarFix",
      };
    }
    // Bank
    if (d.includes("bank")) {
      return {
        doc,
        have: !!p.bank_account_linked,
        fixPath: "/profile",
        fixLabel: "Add your bank account in your Profile",
        fixCode: "docBankFix",
      };
    }
    // Land records / tenancy
    if (d.includes("land record") || d.includes("khatauni") || d.includes("7-12") || d.includes("tenancy")) {
      return {
        doc,
        have: !!p.land_records_uploaded,
        fixPath: "/profile",
        fixLabel: "Mark your land records as uploaded in your Profile",
        fixCode: "docLandFix",
      };
    }
    // Sowing certificate — no profile field; point at the Lekhpal/Patwari
    if (d.includes("sowing") || d.includes("girdawari")) {
      return {
        doc,
        have: false,
        fixPath: null,
        fixLabel: "Get a sowing certificate (girdawari) from your Lekhpal/Patwari",
        fixCode: "docSowingFix",
      };
    }
    // PM-KISAN beneficiary ID — must apply on the official portal first
    if (d.includes("pm-kisan beneficiary id")) {
      return {
        doc,
        have: false,
        fixPath: null,
        fixLabel: "Apply on pmkisan.gov.in first to get your beneficiary ID",
        fixCode: "docPmkisanIdFix",
      };
    }
    // Crop plan — satisfied by having a crop in the profile
    if (d.includes("crop plan")) {
      return {
        doc,
        have: !!p.crop_type,
        fixPath: "/profile",
        fixLabel: "Add your main crop in your Profile",
        fixCode: "docCropPlanFix",
      };
    }
    // "No documents needed" → satisfied
    if (d.includes("no documents")) {
      return { doc, have: true, fixPath: null, fixLabel: null, fixCode: null };
    }
    return { doc, have: false, fixPath: null, fixLabel: "Prepare this document before applying", fixCode: "docPrepareFix" };
  });
}

// ============================================================
// Data layer — Supabase first, localStorage fallback (app pattern)
// ============================================================
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const LS_SCHEMES = "agn_schemes_cache_v1";
const feedbackKey = (farmerId: string) => `agn_scheme_feedback_${farmerId}`;

export function isDbConfigured(): boolean {
  return isSupabaseConfigured() && !!supabase;
}

export async function loadSchemes(): Promise<Scheme[]> {
  if (isDbConfigured()) {
    try {
      const { data, error } = await supabase!.from("schemes").select("*");
      if (!error && data && data.length > 0) {
        const parsed = (data as any[]).map((row) => ({
          ...row,
          eligibility_rules:
            typeof row.eligibility_rules === "string"
              ? JSON.parse(row.eligibility_rules)
              : row.eligibility_rules || {},
          required_documents: row.required_documents || [],
        })) as Scheme[];
        try {
          localStorage.setItem(LS_SCHEMES, JSON.stringify(parsed));
        } catch {
          /* ignore */
        }
        return parsed;
      }
    } catch {
      /* fall through */
    }
  }
  try {
    const cached = JSON.parse(localStorage.getItem(LS_SCHEMES) || "null");
    if (Array.isArray(cached) && cached.length > 0) return cached as Scheme[];
  } catch {
    /* ignore */
  }
  return SCHEMES;
}

// ---------- Scheme benefits feedback (Phases 4-5) ----------
export interface SchemeFeedback {
  received_benefits: boolean | null;
  applied_no_response: boolean;
}

export async function loadFeedback(farmerId: string): Promise<Record<string, SchemeFeedback>> {
  if (isDbConfigured()) {
    try {
      const { data, error } = await supabase!
        .from("farmer_scheme_feedback")
        .select("*")
        .eq("farmer_id", farmerId);
      if (!error && data) {
        const map: Record<string, SchemeFeedback> = {};
        for (const row of data as any[]) {
          map[row.scheme_id] = {
            received_benefits: row.received_benefits,
            applied_no_response: !!row.applied_no_response,
          };
        }
        return map;
      }
    } catch {
      /* fall through */
    }
  }
  try {
    return JSON.parse(localStorage.getItem(feedbackKey(farmerId)) || "{}");
  } catch {
    return {};
  }
}

export async function saveFeedback(
  farmerId: string,
  schemeId: string,
  patch: Partial<SchemeFeedback>
): Promise<void> {
  // Local mirror first so the UI always works
  try {
    const cur = JSON.parse(localStorage.getItem(feedbackKey(farmerId)) || "{}");
    cur[schemeId] = { ...(cur[schemeId] || { received_benefits: null, applied_no_response: false }), ...patch };
    localStorage.setItem(feedbackKey(farmerId), JSON.stringify(cur));
  } catch {
    /* ignore */
  }
  if (isDbConfigured()) {
    try {
      const next = { received_benefits: patch.received_benefits ?? null, applied_no_response: patch.applied_no_response ?? false };
      await supabase!.from("farmer_scheme_feedback").upsert(
        {
          farmer_id: farmerId,
          scheme_id: schemeId,
          received_benefits: next.received_benefits,
          applied_no_response: next.applied_no_response,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "farmer_id,scheme_id" }
      );
    } catch {
      /* offline-safe: local mirror already updated */
    }
  }
}

// ---------- Gap-insights aggregation (Phase 4) ----------
export interface SchemeGapStat {
  schemeId: string;
  eligibleFarmers: number; // denominator: matched-eligible subset ONLY
  answered: number; // eligible farmers who answered the benefits question
  received: number;
  notReceived: number;
  noResponseReports: number; // Phase 5 "applied, no response" reports
  gapPct: number | null; // null when nobody answered — honest "no data yet"
}

export async function computeGapStats(): Promise<Record<string, SchemeGapStat>> {
  // 1. Load all farmer profiles and run the Phase-1 engine on each —
  //    the eligible subset is the correct denominator.
  const profiles: { id: string; profile: FarmerProfile }[] = [];
  if (isDbConfigured()) {
    try {
      const { data, error } = await supabase!
        .from("farmers")
        .select("*")
        .eq("role", "FARMER")
        .limit(500);
      if (!error && data) {
        for (const row of data as any[]) profiles.push({ id: row.id, profile: row as FarmerProfile });
      }
    } catch {
      /* fall through to local */
    }
  }
  if (profiles.length === 0) {
    try {
      const users = JSON.parse(localStorage.getItem("agn_registered_users") || "[]");
      for (const u of users) if (u.role === "FARMER") profiles.push({ id: u.id, profile: u as FarmerProfile });
    } catch {
      /* ignore */
    }
  }

  const eligibleByScheme: Record<string, Set<string>> = {};
  for (const { id, profile } of profiles) {
    const { matched } = matchSchemes(profile);
    for (const m of matched) {
      (eligibleByScheme[m.scheme.id] ||= new Set()).add(id);
    }
  }

  // 2. Load feedback rows (Supabase first, then every local mirror)
  let fbRows: { farmer_id: string; scheme_id: string; received_benefits: boolean | null; applied_no_response: boolean }[] = [];
  if (isDbConfigured()) {
    try {
      const { data, error } = await supabase!
        .from("farmer_scheme_feedback")
        .select("farmer_id, scheme_id, received_benefits, applied_no_response");
      if (!error && data) fbRows = data as any[];
    } catch {
      /* fall through to local */
    }
  }
  if (fbRows.length === 0) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("agn_scheme_feedback_")) {
          const fid = k.replace("agn_scheme_feedback_", "");
          const fb = JSON.parse(localStorage.getItem(k) || "{}") as Record<string, SchemeFeedback>;
          for (const [sid, v] of Object.entries(fb)) {
            fbRows.push({
              farmer_id: fid,
              scheme_id: sid,
              received_benefits: v.received_benefits ?? null,
              applied_no_response: !!v.applied_no_response,
            });
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  // 3. Combine — percentages computed over the eligible subset only
  const stats: Record<string, SchemeGapStat> = {};
  for (const [schemeId, eligibleSet] of Object.entries(eligibleByScheme)) {
    const eligibleRows = fbRows.filter((r) => r.scheme_id === schemeId && eligibleSet.has(r.farmer_id));
    const answeredRows = eligibleRows.filter((r) => r.received_benefits != null);
    const received = answeredRows.filter((r) => r.received_benefits === true).length;
    const answered = answeredRows.length;
    const notReceived = answered - received;
    const noResponseReports = eligibleRows.filter((r) => r.applied_no_response).length;
    stats[schemeId] = {
      schemeId,
      eligibleFarmers: eligibleSet.size,
      answered,
      received,
      notReceived,
      noResponseReports,
      gapPct: answered === 0 ? null : Math.round((notReceived / answered) * 100),
    };
  }
  return stats;
}
