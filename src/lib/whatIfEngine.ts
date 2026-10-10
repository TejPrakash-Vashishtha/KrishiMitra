// ============================================================
// What-If scenario engine — 100% client-side, driven entirely by
// the Digital Twin state (fetchTwinState) — no backend involved.
//
// How it works:
//  1. Takes the twin's real soil profile (root-zone moisture, soil class,
//     wilting point), real 7-day Open-Meteo forecast (rain, ET0) and the
//     state's 24-year climatology (embedded in digitalTwinData).
//  2. Extends the forecast to 30 days with a deterministic, climate-anchored
//     synthetic sequence (same rain pattern for baseline AND scenario, so the
//     ONLY difference between the two runs is the stressors the user applies).
//  3. Runs the FAO-56 daily water balance twice — baseline vs scenario — and
//     diffs them: days below the wilting point, irrigation need, flood days.
//  4. Crop impact uses the FAO AgroMet/Teixeira temperature-response function
//     (linear decline between cardinal temperatures) — the same published
//     curve used in FAO irrigation guidance — with a 45% cap and 10% recovery
//     credit for irrigation, so no single factor exaggerates.
//  5. Produces plain-language, prioritized recommendations per growth phase.
// ============================================================

import {
  wiltThreshold,
  getStateClimate,
  getStateSoil,
  type TwinState,
} from "./digitalTwinData";

export interface ScenarioParams {
  tempDeltaC: number; // −3 … +6 °C deviation applied to every day
  drySpellDays: number; // 0 … 20 — consecutive zero-rain days starting today
  delugeMm: number; // 0 … 250 mm extra rain dropped on day 7 (cloudburst/cyclone)
  irrigationPct: number; // 0 … 200% of the standard 25 mm dose, auto-applied when moisture < wilting
  pestPressure: "Low" | "Moderate" | "High" | "Severe";
  cropPhase: "sowing" | "vegetative" | "flowering";
}

export interface ScenarioPoint {
  day: number; // 1-based
  label: string; // "3 Sep"
  moisture: number; // scenario root-zone VWC %
  baseline: number; // baseline root-zone VWC %
  rainMm: number;
  et0Mm: number;
  tempMaxC: number;
  irrigatedMm: number; // water applied this day in the scenario
  status: "ok" | "dry" | "flood"; // relative to wilting point / deluge
}

export interface ScenarioRecommendation {
  type: "irrigation" | "sowing" | "nutrient" | "pest" | "drainage" | "insurance";
  title: string;
  body: string;
  severity: "good" | "caution" | "alert";
}

export interface ScenarioVerdict {
  headline: string;
  tone: "good" | "caution" | "alert";
  summary: string;
}

export interface ScenarioResult {
  params: ScenarioParams;
  points: ScenarioPoint[];
  scenarioYieldPct: number;
  baselineYieldPct: number;
  dryDaysBelowWilt: number;
  baselineDryDays: number;
  extraIrrigationMm: number; // total water the farmer must supply vs baseline
  floodDays: number;
  peakTempC: number;
  verdict: ScenarioVerdict;
  recommendations: ScenarioRecommendation[];
}

const HORIZON = 30;
const STD_IRRIGATION_MM = 25; // one standard dose ≈ 1 inch — FAO irrigation norm for field crops
const DELUGE_DAY = 7; // cloudburst lands a week in

function fmtDay(d: Date): string {
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// Deterministic pseudo-random from a seed — keeps the 30-day weather stable per plot+day
function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ------------------------------------------------------------
// 30-day weather series (climate-anchored, deterministic)
// First 7 days = the twin's REAL Open-Meteo forecast; days 8-30 are
// generated from the state's 24-year climatology (IMD monsoon share).
// ------------------------------------------------------------
function buildWeatherSeries(twin: TwinState): { rain: number[]; et0: number[]; tempMax: number[] } {
  const climate = getStateClimate(twin.state);
  const monsoonWet = climate.annualRainMm > 1100 && new Date().getMonth() + 1 >= 6 && new Date().getMonth() + 1 <= 10;
  const baseSeed = Math.floor(twin.lat * 100) + Math.floor(twin.lon * 100) + new Date().getDate();

  const rain: number[] = [];
  const et0: number[] = [];
  const tempMax: number[] = [];
  for (let i = 0; i < HORIZON; i++) {
    if (i < 7) {
      // Real forecast from the twin
      rain.push(twin.projection[i]?.rainMm ?? 0);
      et0.push(twin.projection[i]?.et0Mm ?? twin.et0);
      tempMax.push(Math.round(twin.airTemp + (seeded(baseSeed + i) - 0.5) * 4));
    } else {
      // Climate-anchored synthetic days (deterministic per plot+day)
      const r = seeded(baseSeed + i * 13);
      if (monsoonWet) rain.push(r > 0.45 ? Math.round(4 + seeded(baseSeed + i * 7) * 18) : 0);
      else rain.push(r > 0.86 ? Math.round(2 + seeded(baseSeed + i * 7) * 6) : 0);
      et0.push(Math.round((twin.et0 + (seeded(baseSeed + i * 3) - 0.5) * 0.6) * 10) / 10);
      tempMax.push(Math.round(twin.airTemp + 4 + (seeded(baseSeed + i * 11) - 0.5) * 6));
    }
  }
  return { rain, et0, tempMax };
}

// ------------------------------------------------------------
// FAO-56 daily water balance over an effective 30 cm root zone:
//   ΔVWC% = (rain + irrigation − ETc) / root-zone depth
// 1 mm of water over a 300 mm root zone ≈ 0.33% VWC. Drain and recharge use
// the SAME denominator, so the balance is internally consistent (the twin's
// 7-day chart uses gentler display rates; this horizon-30 model resolves real
// wilting events, which is the whole point of a stress simulator).
// Irrigation is applied the morning moisture would otherwise dip below the
// wilting point (standard scheduling practice), scaled by irrigationPct.
// ------------------------------------------------------------
const ROOT_ZONE_MM = 300;
const pctPerMm = 100 / ROOT_ZONE_MM; // 1 mm ≈ 0.333% VWC

function runWaterBalance(opts: {
  startMoisture: number;
  rain: number[];
  et0: number[];
  tempDeltaC: number;
  drySpellDays: number;
  delugeMm: number;
  irrigationPct: number;
  wilt: number;
}): { moisture: number[]; irrigatedMm: number[]; extraIrrigationMm: number } {
  const { startMoisture, rain, et0, tempDeltaC, drySpellDays, delugeMm, irrigationPct, wilt } = opts;

  // Higher temperature raises atmospheric demand. A common working rule: ET0
  // moves ~2.5%/°C near typical field temperatures (Penn FAO charts) — capped.
  const tempFactor = clamp(1 + tempDeltaC * 0.025, 0.85, 1.2);

  let m = startMoisture;
  let totalIrrigated = 0;
  const moisture: number[] = [];
  const irrigatedMm: number[] = [];

  for (let i = 0; i < HORIZON; i++) {
    const dryToday = i < drySpellDays;
    const delugeToday = i === DELUGE_DAY - 1;

    const effectiveRain = (dryToday ? 0 : rain[i]) + (delugeToday ? delugeMm : 0);

    // Auto-irrigation: trigger when yesterday's moisture approaches wilting
    let irrMm = 0;
    if (m < wilt + 2 && irrigationPct > 0) {
      irrMm = STD_IRRIGATION_MM * (irrigationPct / 100);
      totalIrrigated += irrMm;
    }

    // Drain (ET0 × temp demand) and recharge (rain + irrigation) over the root zone.
    // A deluge day is NOT capped — a cloudburst saturates the 30 cm profile outright.
    const drain = Math.min(6, (et0[i] * tempFactor) * pctPerMm); // cap ≈ saturation-limited ET
    const recharge = delugeToday ? effectiveRain * pctPerMm : Math.min(9, effectiveRain * pctPerMm);
    m = m - drain + recharge + irrMm * pctPerMm;
    m = clamp(m, 6, 48);

    moisture.push(Math.round(m * 10) / 10);
    irrigatedMm.push(Math.round(irrMm));
  }
  return { moisture, irrigatedMm, extraIrrigationMm: Math.round(totalIrrigated) };
}

// ------------------------------------------------------------
// FAO temperature response (Teixeira et al. / FAO AgroMet):
// relative yield loss grows linearly between Topt and Tceil, capped 45%.
// ------------------------------------------------------------
function tempYieldFactor(tempC: number, phase: ScenarioParams["cropPhase"]): number {
  const Topt = phase === "flowering" ? 27 : 30; // flowering is the most heat-sensitive stage
  const Tceil = 45;
  if (tempC <= Topt) return 1;
  return clamp(1 - ((tempC - Topt) / (Tceil - Topt)) * 0.45, 0.55, 1);
}

function phaseLabel(phase: ScenarioParams["cropPhase"]): string {
  return phase === "sowing" ? "Sowing time" : phase === "vegetative" ? "Vegetative growth" : "Flowering / grain filling";
}

// ------------------------------------------------------------
// Main entry: run baseline + scenario and diff them
// ------------------------------------------------------------
export function runScenario(twin: TwinState, params: ScenarioParams): ScenarioResult {
  const wilt = wiltThreshold(twin.soilClass);
  const series = buildWeatherSeries(twin);
  const startMoisture = twin.moisture1to3; // twin's root-zone moisture

  // Baseline: no stressors, normal irrigation
  const base = runWaterBalance({
    startMoisture,
    rain: series.rain,
    et0: series.et0,
    tempDeltaC: 0,
    drySpellDays: 0,
    delugeMm: 0,
    irrigationPct: 100,
    wilt,
  });

  // Scenario: user's stressors
  const sc = runWaterBalance({
    startMoisture,
    rain: series.rain,
    et0: series.et0,
    tempDeltaC: params.tempDeltaC,
    drySpellDays: params.drySpellDays,
    delugeMm: params.delugeMm,
    irrigationPct: params.irrigationPct,
    wilt,
  });

  const now = new Date();
  const points: ScenarioPoint[] = [];
  let dryDaysBelowWilt = 0;
  let baselineDryDays = 0;
  let floodDays = 0;

  for (let i = 0; i < HORIZON; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const delugeToday = i === DELUGE_DAY - 1 && params.delugeMm > 0;
    if (sc.moisture[i] < wilt) dryDaysBelowWilt++;
    if (base.moisture[i] < wilt) baselineDryDays++;
    if (params.delugeMm >= 100 && sc.moisture[i] > 40) floodDays++;

    points.push({
      day: i + 1,
      label: fmtDay(d),
      moisture: sc.moisture[i],
      baseline: base.moisture[i],
      rainMm: Math.round((params.drySpellDays > i ? 0 : series.rain[i]) + (delugeToday ? params.delugeMm : 0)),
      et0Mm: series.et0[i],
      tempMaxC: series.tempMax[i] + params.tempDeltaC,
      irrigatedMm: sc.irrigatedMm[i],
      status: delugeToday || (params.delugeMm >= 100 && sc.moisture[i] > 40) ? "flood" : sc.moisture[i] < wilt ? "dry" : "ok",
    });
  }

  // ---- Yield impact (published functions only, capped) ----
  // 1) Heat stress — FAO AgroMet curve on the mean daily max over the horizon
  const meanTempMax = points.reduce((a, p) => a + p.tempMaxC, 0) / HORIZON;
  const fTemp = tempYieldFactor(meanTempMax, params.cropPhase);

  // 2) Water stress — days the scenario sits below wilting vs the baseline run.
  //    Each extra stressed day costs ~2.2% (typical FAO Ky response for
  //    moisture-sensitive stages), recovered 10% when irrigation is available.
  const extraDryDays = Math.max(0, dryDaysBelowWilt - baselineDryDays);
  const fWater = clamp(1 - extraDryDays * 0.022 + (params.irrigationPct >= 100 ? 0.1 : 0), 0.55, 1);

  // 3) Waterlogging — a real deluge (>60mm) saturates the profile; each flood
  //    day ~4% (root-zone anoxia, FAO flooding-response range 3-5%).
  const fFlood = clamp(1 - floodDays * 0.04, 0.7, 1);

  // 4) Pest pressure (user-assessed, modest fixed weights)
  const pestFactor = { Low: 1, Moderate: 0.95, High: 0.87, Severe: 0.75 }[params.pestPressure];

  const scenarioYieldPct = Math.round(100 * fTemp * fWater * fFlood * pestFactor);
  const baselineYieldPct = 100;

  // ---- Verdict ----
  let verdict: ScenarioVerdict;
  if (scenarioYieldPct >= 95) {
    verdict = {
      headline: "Crop holds up in this scenario",
      tone: "good",
      summary: `Even with ${describeStress(params)}, the water balance and temperatures stay inside the safe band over the next 30 days. Keep the routine schedule and scout weekly.`,
    };
  } else if (scenarioYieldPct >= 80) {
    const noStress = params.tempDeltaC === 0 && params.drySpellDays === 0 && params.delugeMm === 0 && params.pestPressure === "Low";
    verdict = noStress
      ? {
          headline: "Normal month — this is your reference line",
          tone: "caution",
          summary: `With no stressors, the gap to 100% is purely climatic: your state's normal daily-max temperature (~${Math.round(meanTempMax)}°C) sits above the FAO optimum of 27–30°C, costing ~${100 - scenarioYieldPct}% versus an ideal-temperature season. Everything below this line on the sliders is additional, scenario-caused loss.`,
        }
      : {
          headline: "Manageable — but only with the actions below",
          tone: "caution",
          summary: `${describeStress(params)} during ${phaseLabel(params.cropPhase).toLowerCase()} would cost roughly ${100 - scenarioYieldPct}% of potential yield. The recovery plan below protects most of it if started now.`,
        };
  } else {
    verdict = {
      headline: "Serious yield risk without intervention",
      tone: "alert",
      summary: `${describeStress(params)} during ${phaseLabel(params.cropPhase).toLowerCase()} would cost about ${100 - scenarioYieldPct}% of the harvest. Act on the priority list below immediately — the first 7 days matter most.`,
    };
  }

  const recommendations = buildRecommendations(twin, params, points, {
    wilt, extraDryDays, floodDays, scenarioYieldPct, meanTempMax,
  });

  return {
    params,
    points,
    scenarioYieldPct,
    baselineYieldPct,
    dryDaysBelowWilt,
    baselineDryDays,
    extraIrrigationMm: Math.max(0, sc.extraIrrigationMm - base.extraIrrigationMm),
    floodDays,
    peakTempC: Math.round(Math.max(...points.map((p) => p.tempMaxC))),
    verdict,
    recommendations,
  };
}

function describeStress(p: ScenarioParams): string {
  const bits: string[] = [];
  if (p.tempDeltaC > 0) bits.push(`a +${p.tempDeltaC}°C heat deviation`);
  if (p.tempDeltaC < 0) bits.push(`a ${p.tempDeltaC}°C cool spell`);
  if (p.drySpellDays > 0) bits.push(`a ${p.drySpellDays}-day dry spell`);
  if (p.delugeMm > 0) bits.push(`a ${p.delugeMm} mm deluge`);
  if (p.pestPressure === "High" || p.pestPressure === "Severe") bits.push(`${p.pestPressure.toLowerCase()} pest pressure`);
  return bits.length ? bits.join(" plus ") : "no stressors (baseline check)";
}

// ------------------------------------------------------------
// Prioritized plain-language recommendations per phase
// ------------------------------------------------------------
function buildRecommendations(
  twin: TwinState,
  params: ScenarioParams,
  points: ScenarioPoint[],
  ctx: { wilt: number; extraDryDays: number; floodDays: number; scenarioYieldPct: number; meanTempMax: number }
): ScenarioRecommendation[] {
  const recs: ScenarioRecommendation[] = [];
  const { wilt, extraDryDays, floodDays, meanTempMax } = ctx;
  const doseMm = Math.round(STD_IRRIGATION_MM * (params.irrigationPct / 100));

  // Irrigation (first dry day = when to act)
  const firstDry = points.findIndex((p) => p.moisture < wilt);
  if (firstDry !== -1) {
    const when = firstDry === 0 ? "today" : `day ${firstDry + 1} (${points[firstDry].label})`;
    recs.push({
      type: "irrigation",
      title: `Irrigate ${when} — ${doseMm} mm`,
      body: `Moisture crosses the ${wilt}% wilting line on ${points[firstDry].label}. Apply ${doseMm} mm (~1 inch) per irrigation; over 30 days this scenario needs about ${Math.round(points.reduce((a, p) => a + p.irrigatedMm, 0))} mm total. On ${twin.soilClass} soil, split it into two lighter sets if the field slopes.`,
      severity: "caution",
    });
  } else {
    recs.push({
      type: "irrigation",
      title:
        params.irrigationPct > 0 && (params.drySpellDays >= 8 || params.tempDeltaC >= 3)
          ? `Your irrigation supply (${params.irrigationPct}% dose) is what saves this scenario`
          : "No irrigation needed in this scenario",
      body:
        params.irrigationPct > 0 && (params.drySpellDays >= 8 || params.tempDeltaC >= 3)
          ? `Without the ${doseMm} mm doses applied whenever moisture approached the ${wilt}% wilting line, this scenario would have spent days below wilting. Total water used over 30 days: about ${Math.round(points.reduce((a, p) => a + p.irrigatedMm, 0))} mm — plan your source (canal rotation, borewell hours, or farm pond) to cover it.`
          : `Root-zone moisture stays above the ${wilt}% wilting line for all 30 days. Rain and reserves cover the crop — save the water and the diesel.`,
      severity: "good",
    });
  }

  // Deluge → drainage
  if (params.delugeMm > 0) {
    const day = points.find((p) => p.status === "flood" && p.rainMm > 0) ?? points[DELUGE_DAY - 1];
    recs.push({
      type: "drainage",
      title: `${params.delugeMm} mm rain incoming around ${day.label} — drain first`,
      body:
        params.delugeMm >= 100
          ? `This saturates the ${twin.soilClass} profile (${floodDays} day${floodDays === 1 ? "" : "s"} of waterlogging). Clear field bunds and side drains NOW so water leaves in <24h; standing water at ${phaseLabel(params.cropPhase).toLowerCase()} rots roots. After the water recedes, earth-up the crop rows and re-apply lost nitrogen (about 10 kg urea/acre) because leached N washes below the root zone.`
          : `A moderate shower that the ${twin.soilClass} soil can absorb — just make sure bunds are intact so it soaks in rather than runs off. Skip the next irrigation if it arrives.`,
      severity: params.delugeMm >= 100 ? "alert" : "good",
    });
  }

  // Heat
  if (params.tempDeltaC >= 2) {
    const peakC = Math.round(Math.max(...points.map((p) => p.tempMaxC)));
    recs.push({
      type: "sowing",
      title: `Heat peaks to ${peakC}°C — protect the crop`,
      body:
        params.cropPhase === "sowing"
          ? `At sowing, heat hits germination. Sow 2-3 cm deeper into residual moisture, mulch with straw, and sow in the evening so the seed imbibes overnight. Prefer a short-duration or heat-tolerant variety (ask at your nearest KVK — kvk.icar.gov.in).`
          : `Heat above 32°C during ${phaseLabel(params.cropPhase).toLowerCase()} hurts pollen and grain filling. Spray water in the evening if possible, keep moisture up (the irrigation plan above is the real defence), and mulch exposed soil with straw.`,
      severity: params.tempDeltaC >= 4 ? "alert" : "caution",
    });
  } else if (params.tempDeltaC <= -2) {
    recs.push({
      type: "sowing",
      title: `Cooler spell (−${Math.abs(params.tempDeltaC)}°C) — watch for slow growth`,
      body: `Cool weather slows germination and vegetative growth. Delay sowing by a few days if nights drop near 12°C, and expect the crop to need a few extra days to each stage — the irrigation plan above already accounts for the slower water use.`,
      severity: "caution",
    });
  }

  // Dry spell
  if (params.drySpellDays >= 5 && extraDryDays > 0) {
    recs.push({
      type: "nutrient",
      title: `Dry spell stresses nutrient uptake — feed on moisture, not on schedule`,
      body: `During a ${params.drySpellDays}-day dry spell roots can't take up fertilizer even when it's in the soil. Split urea doses: apply only after rain or irrigation, never on bone-dry soil (it scorches and wastes). Top-dress the pending dose the morning the soil is moist.`,
      severity: "caution",
    });
  }

  // Pest (links the slider to the twin's own humidity rules)
  const hotDry = meanTempMax + params.tempDeltaC > 34 && twin.humidity < 55;
  const humid = twin.humidity > 80;
  if (params.pestPressure === "High" || params.pestPressure === "Severe") {
    recs.push({
      type: "pest",
      title: params.pestPressure === "Severe" ? "Severe pest pressure — spray on a threshold, not on a rumour" : "Elevated pest pressure — scout twice a week",
      body: hotDry
        ? `Hot-dry weather (current humidity ${twin.humidity}%) favors aphids, whitefly and thrips. Check leaf undersides in the morning; spray neem oil 5 ml/L in the evening to avoid leaf burn — available at KVK counters and agri-input shops.`
        : `Fungal risk rises with humidity (currently ${twin.humidity}%)${humid ? " — blight/blast weather" : ""}. Keep a preventive Trichoderma viride spray (5 g/L) ready before any rain event, and rotate chemical groups if a second spray is needed. CIBRC-registered brands are stocked at KVK agro-vet counters.`,
      severity: params.pestPressure === "Severe" ? "alert" : "caution",
    });
  }

  // Insurance / risk transfer for the worst outcomes
  if (ctx.scenarioYieldPct < 80) {
    recs.push({
      type: "insurance",
      title: "This scenario is insurable — check PMFBY before the window closes",
      body: `A ${100 - ctx.scenarioYieldPct}% projected loss is exactly what Pradhan Mantri Fasal Bima Yojana (PMFBY) covers, including prevented sowing and mid-season adversity. Enrolment runs through the CSC/PMFBY app or your bank — premium is only ~2% (food crops). Enrol before sowing; claims need you to report within 72 hours of the event.`,
      severity: "alert",
    });
  }

  // Sowing-window advice
  if (params.cropPhase === "sowing" && (params.drySpellDays >= 8 || params.delugeMm >= 100)) {
    recs.push({
      type: "sowing",
      title: params.delugeMm >= 100 ? "Delay sowing past the deluge" : "Hold sowing until the spell breaks",
      body:
        params.delugeMm >= 100
          ? `Sowing into a saturated seedbed rots seed and crusts the surface as it dries. Wait 3-4 days after the ${params.delugeMm} mm event until the top 5 cm is workable, then sow on moisture.`
          : `Sowing into a ${params.drySpellDays}-day dry spell risks uneven germination. If rain is not certain, do a dry-sow followed by a light irrigation, or wait for the first showers — pre-soaked seed + moist soil is the safe combination.`,
      severity: "caution",
    });
  }

  return recs;
}
