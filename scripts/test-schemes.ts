// Phase 1+2 acceptance check — run: npx tsx scripts/test-schemes.ts
// Test farmer: 2 acres, wheat, Uttar Pradesh.
// EXPECTED: PM-KISAN, PMFBY, KCC, Soil Health Card, UP-Kisan-Kalyan matched;
// Maandhan also matches (2 acres < 4.94-acre limit). Exclusion logic is verified
// with profiles B/C/D below. Four profiles:
//   A: base farmer (2 acres, wheat, UP)  -> PM-KISAN + PMFBY must match
//   B: income-tax payer                  -> PM-KISAN must be EXCLUDED
//   C: 6 acres, age 45                   -> Maandhan EXCLUDED (land>4.94 + age>40)
//   D: missing crop                      -> PMFBY soft-excluded with actionable hint
import { matchSchemes, assessDocuments, type FarmerProfile } from "../src/lib/schemesData";

const A_BASE_PROFILE: FarmerProfile = {
  state: "Uttar Pradesh",
  age: 35,
  land_acres: 2,
  crop_type: "Wheat",
  aadhaar_linked: true,
  bank_account_linked: true,
  land_records_uploaded: true,
  is_income_tax_payer: false,
};

function ids(x: { scheme: { id: string } }[]) {
  return x.map((m) => m.scheme.id);
}

function run(label: string, p: FarmerProfile) {
  const { matched, excluded } = matchSchemes(p);
  console.log(`\n=== ${label} ===`);
  console.log("MATCHED :", ids(matched).join(", "));
  console.log("EXCLUDED:", ids(excluded).join(", "));
  for (const m of matched) console.log(`  [${m.scheme.id}] ${m.reasons[0]}`);
  for (const m of excluded) console.log(`  [${m.scheme.id}] ${m.blockers[0]}`);
  return { matched, excluded };
}

// A — the acceptance-test farmer
const A = run("A: 2 acres, wheat, UP, age 35, docs complete", A_BASE_PROFILE);

const okA =
  ids(A.matched).includes("pm-kisan") &&
  ids(A.matched).includes("pmfby") &&
  !ids(A.excluded).includes("pm-kisan") &&
  !ids(A.excluded).includes("pmfby");
console.log(`\nA acceptance (PM-KISAN + PMFBY matched): ${okA ? "PASS" : "FAIL"}`);

// Documents for A
const pmkisan = A.matched.find((m) => m.scheme.id === "pm-kisan")!;
const docs = assessDocuments(A_BASE_PROFILE, pmkisan.scheme);
console.log("\nPM-KISAN document checklist for A:");
for (const d of docs) console.log(`  ${d.have ? "HAVE" : "MISS"}  ${d.doc}`);

// B — income-tax payer must be excluded from PM-KISAN
const B = run("B: same but income-tax payer (exclusion test)", {
  ...A_BASE_PROFILE,
  is_income_tax_payer: true,
});
const okB = ids(B.excluded).includes("pm-kisan") && !ids(B.matched).includes("pm-kisan");
console.log(`\nB acceptance (tax payer excluded from PM-KISAN): ${okB ? "PASS" : "FAIL"}`);

// C — large land + over-age must be excluded from Maandhan
const C = run("C: 6 acres, age 45, UP (ceilings test)", {
  ...A_BASE_PROFILE,
  land_acres: 6,
  age: 45,
});
const okC = ids(C.excluded).includes("pm-kisan-maandhan");
console.log(`\nC acceptance (6 acres / 45yo excluded from Maandhan): ${okC ? "PASS" : "FAIL"}`);

// D — incomplete profile: PMFBY needs crop -> soft exclusion with hint, no crash
const D = run("D: missing crop (soft-fail hint test)", {
  state: "Uttar Pradesh",
  age: 35,
  land_acres: 2,
  aadhaar_linked: false,
  bank_account_linked: false,
  land_records_uploaded: false,
  is_income_tax_payer: false,
});
const dPmfby = D.excluded.find((m) => m.scheme.id === "pmfby");
const okD = !!dPmfby && dPmfby.blockers.some((b) => b.toLowerCase().includes("crop"));
console.log(`\nD acceptance (missing crop -> actionable hint): ${okD ? "PASS" : "FAIL"}`);

const all = okA && okB && okC && okD;
console.log(`\n${all ? "✅ ALL ACCEPTANCE CHECKS PASSED" : "❌ SOME CHECKS FAILED"}`);
process.exit(all ? 0 : 1);
