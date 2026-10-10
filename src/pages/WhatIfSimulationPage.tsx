import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Sliders, Thermometer, Droplets, CloudRain, Sprout, ShieldCheck, ShieldAlert,
  Bug, AlertTriangle, TrendingUp, RefreshCw, Waves, FlaskConical, Info,
  MapPin, Loader2, ArrowRight, CalendarClock, Activity, Umbrella,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "../contexts/LocationContext";
import {
  fetchTwinState, loadTwinField, wiltThreshold,
  type TwinState,
} from "../lib/digitalTwinData";
import {
  runScenario,
  type ScenarioParams,
  type ScenarioResult,
  type ScenarioRecommendation,
} from "../lib/whatIfEngine";

// ---------------- Styling helpers (match the Digital Twin page) ----------------
const TONE: Record<"good" | "caution" | "alert", { border: string; bg: string; text: string; icon: React.ReactNode }> = {
  good: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-800", icon: <ShieldCheck className="w-5 h-5 text-emerald-600" /> },
  caution: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-900", icon: <AlertTriangle className="w-5 h-5 text-amber-600" /> },
  alert: { border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-900", icon: <ShieldAlert className="w-5 h-5 text-rose-600" /> },
};

const REC_ICON: Record<ScenarioRecommendation["type"], React.ReactNode> = {
  irrigation: <Droplets className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />,
  sowing: <Sprout className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />,
  nutrient: <FlaskConical className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />,
  pest: <Bug className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />,
  drainage: <Waves className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />,
  insurance: <Umbrella className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />,
};

const SEV_STYLE: Record<ScenarioRecommendation["severity"], string> = {
  good: "border-emerald-200 bg-emerald-50",
  caution: "border-amber-200 bg-amber-50",
  alert: "border-rose-200 bg-rose-50",
};

// ---------------- Slider component ----------------
function ParamSlider(opts: {
  icon: React.ReactNode; label: string; value: number | string; unit: string;
  min: number; max: number; step: number; accent: string;
  leftHint: string; rightHint: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1">
          {opts.icon}
          <span>{opts.label}</span>
        </span>
        <span className={`font-extrabold ${opts.accent}`}>{opts.value} {opts.unit}</span>
      </div>
      <input
        type="range" min={opts.min} max={opts.max} step={opts.step} value={opts.value as number}
        onChange={(e) => opts.onChange(parseFloat(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: "currentColor" }}
      />
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{opts.leftHint}</span><span>{opts.rightHint}</span>
      </div>
    </div>
  );
}

// ---------------- 30-day SVG chart: baseline vs scenario + rain ----------------
function ScenarioChart({ result, wilt }: { result: ScenarioResult; wilt: number }) {
  const W = 640, H = 250, padL = 36, padR = 12, padT = 16, padB = 42;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const n = result.points.length;
  const x = (i: number) => padL + (i / (n - 1)) * innerW;
  const y = (v: number) => padT + (1 - (v - 5) / (48 - 5)) * innerH;
  const maxRain = Math.max(40, ...result.points.map((p) => p.rainMm));
  const rainH = 34;
  const barTop = (mm: number) => H - padB + 8 - (mm / maxRain) * rainH;

  const linePath = (key: "moisture" | "baseline") =>
    result.points.map((p, i) => `${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");

  const gridM = [10, 20, 30, 40];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="30-day moisture projection">
      {/* grid */}
      {gridM.map((m) => (
        <g key={m}>
          <line x1={padL} x2={W - padR} y1={y(m)} y2={y(m)} stroke="#e2e8f0" strokeWidth="1" />
          <text x={padL - 6} y={y(m) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{m}%</text>
        </g>
      ))}
      {/* rain bars */}
      {result.points.map((p, i) =>
        p.rainMm > 0 ? (
          <rect
            key={`r${i}`} x={x(i) - 3} width={6}
            y={barTop(p.rainMm)} height={H - padB + 8 - barTop(p.rainMm)}
            rx="1.5" fill={p.rainMm >= 80 ? "#4f46e5" : p.rainMm >= 20 ? "#0ea5e9" : "#7dd3fc"}
            opacity="0.75"
          />
        ) : null
      )}
      {/* wilting line */}
      <line x1={padL} x2={W - padR} y1={y(wilt)} y2={y(wilt)} stroke="#e11d48" strokeWidth="1.5" strokeDasharray="5 4" />
      <text x={W - padR} y={y(wilt) - 4} textAnchor="end" fontSize="9.5" fontWeight="700" fill="#e11d48">
        Wilting line {wilt}%
      </text>
      {/* baseline (dashed) */}
      <polyline points={linePath("baseline")} fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeDasharray="4 4" />
      {/* scenario */}
      <polyline points={linePath("moisture")} fill="none" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" />
      {/* x labels every 5 days */}
      {result.points.filter((p) => p.day % 5 === 0 || p.day === 1).map((p) => (
        <text key={p.day} x={x(p.day - 1)} y={H - 6} textAnchor="middle" fontSize="9" fill="#64748b">
          {p.label.split(" ")[0]} {p.label.split(" ")[1]}
        </text>
      ))}
      {/* legend */}
      <g fontSize="9.5" fontWeight="600">
        <line x1={padL} y1={H + 16} x2={padL + 18} y2={H + 16} stroke="#059669" strokeWidth="2.6" />
        <text x={padL + 22} y={H + 19} fill="#334155">Your scenario</text>
        <line x1={padL + 104} y1={H + 16} x2={padL + 122} y2={H + 16} stroke="#94a3b8" strokeWidth="1.8" strokeDasharray="4 4" />
        <text x={padL + 126} y={H + 19} fill="#334155">Normal 30 days</text>
        <rect x={padL + 232} y={H + 11} width={7} height={10} rx="1.5" fill="#0ea5e9" opacity="0.75" />
        <text x={padL + 243} y={H + 19} fill="#334155">Rain (mm)</text>
      </g>
    </svg>
  );
}

// ---------------- Defaults & presets ----------------
const DEFAULT_PARAMS: ScenarioParams = {
  tempDeltaC: 2, drySpellDays: 6, delugeMm: 0, irrigationPct: 100,
  pestPressure: "Moderate", cropPhase: "vegetative",
};

const PRESETS: { name: string; emoji: string; params: ScenarioParams }[] = [
  { name: "Heatwave", emoji: "🔥", params: { tempDeltaC: 5, drySpellDays: 12, delugeMm: 0, irrigationPct: 60, pestPressure: "High", cropPhase: "flowering" } },
  { name: "Cyclone deluge", emoji: "🌊", params: { tempDeltaC: 0, drySpellDays: 0, delugeMm: 180, irrigationPct: 0, pestPressure: "Moderate", cropPhase: "vegetative" } },
  { name: "Long dry spell", emoji: "🏜️", params: { tempDeltaC: 2, drySpellDays: 18, delugeMm: 0, irrigationPct: 80, pestPressure: "Moderate", cropPhase: "vegetative" } },
  { name: "Perfect season", emoji: "🌱", params: { tempDeltaC: 0, drySpellDays: 0, delugeMm: 0, irrigationPct: 100, pestPressure: "Low", cropPhase: "vegetative" } },
];

const PHASES: { key: ScenarioParams["cropPhase"]; label: string; hint: string }[] = [
  { key: "sowing", label: "Sowing", hint: "germination window" },
  { key: "vegetative", label: "Vegetative", hint: "leaf & stem growth" },
  { key: "flowering", label: "Flowering", hint: "most stress-sensitive" },
];

export default function WhatIfSimulationPage() {
  const { latitude, longitude, state, district } = useLocation();
  const [twin, setTwin] = useState<TwinState | null>(null);
  const [twinLoading, setTwinLoading] = useState(true);
  const [params, setParams] = useState<ScenarioParams>(DEFAULT_PARAMS);
  const twinReq = useRef(0);

  // Load the twin once — same source as the Digital Twin page (saved plot first, GPS fallback)
  useEffect(() => {
    const field = loadTwinField();
    const lat = field?.centroid.lat ?? latitude ?? 28.6139;
    const lon = field?.centroid.lng ?? longitude ?? 77.209;
    const req = ++twinReq.current;
    setTwinLoading(true);
    fetchTwinState(lat, lon, field ? (state || "Delhi") : (state || "Delhi"), district || "New Delhi", {
      name: field?.name ?? null, areaAcres: field?.areaAcres ?? null,
    }).then((t) => {
      if (twinReq.current === req) { setTwin(t); setTwinLoading(false); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const result: ScenarioResult | null = useMemo(
    () => (twin ? runScenario(twin, params) : null),
    [twin, params]
  );
  const wilt = twin ? wiltThreshold(twin.soilClass) : 15;

  const set = <K extends keyof ScenarioParams>(k: K, v: ScenarioParams[K]) =>
    setParams((p) => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ---------- Header ---------- */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-3">
            <Sliders className="w-3.5 h-3.5" />
            <span>Digital Twin · 30-Day Scenario Lab</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            "What-If" Farm Simulator
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Runs your actual digital-twin field (real soil moisture, soil type and forecast) 30 days into the future under
            hypothetical heat, dry spells, deluge rain and irrigation supply — then tells you what happens to the crop and what to do about it.
          </p>
        </div>

        {/* ---------- Twin context strip ---------- */}
        {twin && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {twin.fieldName ?? "Device GPS location"}
            </span>
            <span className="text-slate-500">{twin.state} · {twin.soilClass} soil</span>
            <span className="text-slate-500">
              Live root-zone moisture <b className="text-slate-800">{twin.moisture1to3}%</b>
            </span>
            <span className="text-slate-500">Wilting point <b className="text-rose-600">{wilt}%</b></span>
            <span className="text-slate-400 ml-auto">
              Data: {twin.lat.toFixed(3)}°, {twin.lon.toFixed(3)}° {twin.isEstimated && <b className="text-amber-600">· Estimated</b>}
            </span>
            <Link to="/digital-twin" className="flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800">
              Open Digital Twin <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* ---------- Presets ---------- */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase mr-1">Quick scenarios:</span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setParams(p.params)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer transition-colors"
            >
              {p.emoji} {p.name}
            </button>
          ))}
          <button
            onClick={() => setParams(DEFAULT_PARAMS)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 cursor-pointer transition-colors"
          >
            ↺ Reset
          </button>
        </div>

        {twinLoading || !twin || !result ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Loading your digital-twin field data…</p>
            <p className="text-xs text-slate-400">Soil moisture, soil type and forecast for your plot</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ================= CONTROLS ================= */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                Hypothetical conditions
              </h3>

              <ParamSlider
                icon={<Thermometer className="w-3.5 h-3.5 text-rose-500" />}
                label="Temperature deviation" value={params.tempDeltaC >= 0 ? `+${params.tempDeltaC}` : params.tempDeltaC}
                unit="°C" min={-3} max={6} step={0.5} accent="text-rose-600"
                leftHint="−3°C (cool spell)" rightHint="+6°C (heatwave)"
                onChange={(v) => set("tempDeltaC", v)}
              />
              <ParamSlider
                icon={<Sunish />}
                label="Dry spell" value={params.drySpellDays} unit="zero-rain days"
                min={0} max={20} step={1} accent="text-amber-600"
                leftHint="normal rain" rightHint="3-week drought"
                onChange={(v) => set("drySpellDays", v)}
              />
              <ParamSlider
                icon={<CloudRain className="w-3.5 h-3.5 text-blue-500" />}
                label="Excess deluge rainfall" value={`+${params.delugeMm}`} unit="mm on day 7"
                min={0} max={250} step={10} accent="text-blue-600"
                leftHint="none" rightHint="cyclone cloudburst"
                onChange={(v) => set("delugeMm", v)}
              />
              <ParamSlider
                icon={<Droplets className="w-3.5 h-3.5 text-emerald-500" />}
                label="Irrigation supply" value={params.irrigationPct} unit="% of 25mm dose"
                min={0} max={200} step={10} accent="text-emerald-600"
                leftHint="no water available" rightHint="double capacity"
                onChange={(v) => set("irrigationPct", v)}
              />

              {/* Crop stage */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-emerald-500" /> Crop stage
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PHASES.map((ph) => (
                    <button
                      key={ph.key}
                      onClick={() => set("cropPhase", ph.key)}
                      className={`px-2 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                        params.cropPhase === ph.key
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:border-emerald-400"
                      }`}
                    >
                      {ph.label}
                      <span className="block text-[9px] font-medium opacity-70">{ph.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pest pressure */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Bug className="w-3.5 h-3.5 text-amber-500" /> Pest pressure in the area
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Low", "Moderate", "High", "Severe"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => set("pestPressure", lvl)}
                      className={`px-2 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                        params.pestPressure === lvl
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:border-amber-400"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 flex gap-1.5">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                Results update instantly — the simulation re-runs on your plot's twin data with every slider move. First 7 days use the real forecast; days 8–30 use your state's 24-year climate normal, identical for baseline and scenario.
              </p>
            </div>

            {/* ================= RESULTS ================= */}
            <div className="lg:col-span-7 space-y-5">
              {/* Verdict */}
              <div className={`rounded-3xl border p-6 shadow-sm ${TONE[result.verdict.tone].border} ${TONE[result.verdict.tone].bg}`}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  {TONE[result.verdict.tone].icon}
                  <h2 className={`text-lg font-extrabold ${TONE[result.verdict.tone].text}`}>
                    {result.verdict.headline}
                  </h2>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{result.verdict.summary}</p>
              </div>

              {/* Score strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ScoreTile
                  label="Projected yield" big={`${result.scenarioYieldPct}%`} sub="of normal potential"
                  color={result.scenarioYieldPct >= 95 ? "text-emerald-600" : result.scenarioYieldPct >= 80 ? "text-amber-600" : "text-rose-600"}
                />
                <ScoreTile
                  label="Days below wilting" big={`${result.dryDaysBelowWilt}`} sub={`vs ${result.baselineDryDays} in a normal month`}
                  color={result.dryDaysBelowWilt > result.baselineDryDays ? "text-rose-600" : "text-emerald-600"}
                />
                <ScoreTile
                  label="Extra water needed" big={`${result.extraIrrigationMm} mm`} sub="beyond a normal month"
                  color="text-blue-600"
                />
                <ScoreTile
                  label="Peak temperature" big={`${result.peakTempC}°C`} sub={result.floodDays > 0 ? `${result.floodDays} waterlogged day${result.floodDays > 1 ? "s" : ""}` : "no waterlogging"}
                  color={result.peakTempC >= 40 ? "text-rose-600" : "text-slate-800"}
                />
              </div>

              {/* Chart card */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    30-day soil moisture projection
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400">root-zone %</span>
                </div>
                <ScenarioChart result={result} wilt={wilt} />
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-emerald-600" />
                  What to do in this scenario
                </h3>
                {result.recommendations.map((r, i) => (
                  <div key={i} className={`rounded-2xl border p-4 flex gap-3 ${SEV_STYLE[r.severity]}`}>
                    {REC_ICON[r.type]}
                    <div>
                      <p className="text-sm font-bold text-slate-900">{r.title}</p>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{r.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Methodology */}
              <div className="bg-slate-100/70 rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-2">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> How this simulation works
                </h3>
                <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4">
                  <li>Starts from your plot's <b>real digital-twin state</b> — satellite-derived root-zone moisture, soil class, wilting point and the 7-day forecast.</li>
                  <li>Days 8–30 extend the weather with your state's <b>24-year climate normal</b> (1997–2020 dataset) — the same weather series runs for both lines, so the gap you see is caused <i>only</i> by the sliders.</li>
                  <li>Soil water follows the <b>FAO-56 daily water balance</b> (evapotranspiration drain vs rain/irrigation recharge) — the same physics as the Digital Twin page.</li>
                  <li>Yield impact uses the <b>FAO AgroMet temperature-response curve</b> and FAO Ky water-stress norms, each individually capped so no single factor exaggerates.</li>
                  <li>This is a planning aid, not a guarantee — actual outcomes depend on your local practices and the real weather that arrives.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreTile(opts: { label: string; big: string; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-4 py-3.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{opts.label}</p>
      <p className={`text-2xl font-extrabold ${opts.color}`}>{opts.big}</p>
      <p className="text-[10px] text-slate-500">{opts.sub}</p>
    </div>
  );
}

// tiny inline icon for the dry-spell slider (sun-off feel without an extra import)
function Sunish() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
