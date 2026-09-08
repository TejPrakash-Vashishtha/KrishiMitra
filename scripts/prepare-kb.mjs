// ============================================================
// prepare-kb.mjs — turns the CSV datasets in /datasets into
// compact, embeddable knowledge chunks (RAG pipeline step 1).
//
//   bun run kb:prepare
//
// Output:
//   data/kbChunks.json        → chunks for the ingest script
//   src/data/cropCentroids.ts → per-crop growing-condition centroids
//                               (for the future crop recommender)
// ============================================================
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { mkdirSync as mkdir } from "node:fs";

// ---------- tiny CSV parser (handles quoted fields) ----------
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length && r.some((f) => f.trim() !== ""));
}

function loadTable(path) {
  const rows = parseCSV(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });
}

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const sdOf = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const r2 = (n) => Math.round(n * 100) / 100;
const big = (n) => Math.round(n).toLocaleString("en-IN");
const n2 = (n) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

// ---------- collect chunks ----------
const chunks = [];
const add = (source, title, content) => chunks.push({ source, title, content });

// ============ 1. crop_yield.csv — yields by crop × state × year ============
{
  const rows = loadTable("datasets/crop_yield.csv").map((r) => ({
    crop: r.crop, year: parseInt(r.year), season: r.season, state: r.state,
    area: num(r.area), production: num(r.production), fertilizer: num(r.fertilizer),
    pesticide: num(r.pesticide), yield: num(r.yield),
  })).filter((r) => r.crop && r.state && r.yield !== null);

  const byStateCrop = new Map();
  for (const r of rows) {
    const k = `${r.state}|${r.crop}`;
    if (!byStateCrop.has(k)) byStateCrop.set(k, []);
    byStateCrop.get(k).push(r);
  }

  for (const [k, rs] of byStateCrop) {
    const [state, crop] = k.split("|");
    const seasons = [...new Set(rs.map((r) => r.season))].filter(Boolean);
    const years = [...new Set(rs.map((r) => r.year))].sort((a, b) => b - a);
    const recent = rs.filter((r) => years.slice(0, 5).includes(r.year));
    const fertPerHa = mean(rs.map((r) => r.fertilizer && r.area ? r.fertilizer / r.area : 0).filter(Boolean));
    const pestPerHa = mean(rs.map((r) => r.pesticide && r.area ? r.pesticide / r.area : 0).filter(Boolean));
    add("crop_yield", `Yield — ${crop} — ${state}`,
      `In ${state}, ${crop} is grown mainly in ${seasons.join(" and ") || "multiple seasons"}. ` +
      `Over ${Math.min(...rs.map(r => r.year))}–${Math.max(...rs.map(r => r.year))}, the average yield of ${crop} in ${state} was ${n2(mean(rs.map(r => r.yield)))} tonnes per hectare, ` +
      `and the most recent 5 years averaged ${n2(mean(recent.map(r => r.yield)))} tonnes per hectare. ` +
      `About ${big(rs.reduce((s, r) => s + (r.production || 0), 0))} tonnes were produced in total on roughly ${big(rs.reduce((s, r) => s + (r.area || 0), 0))} hectares harvested. ` +
      `Average fertilizer use was about ${big(fertPerHa)} kg per hectare and pesticide use about ${n2(pestPerHa)} kg per hectare.`);
  }

  // national per-crop summaries (for "which state produces most X")
  const byCrop = new Map();
  for (const r of rows) {
    if (!byCrop.has(r.crop)) byCrop.set(r.crop, []);
    byCrop.get(r.crop).push(r);
  }
  for (const [crop, rs] of byCrop) {
    const prodByState = new Map();
    for (const r of rs) prodByState.set(r.state, (prodByState.get(r.state) || 0) + (r.production || 0));
    const top = [...prodByState.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    add("crop_yield", `Yield — ${crop} — India (all states)`,
      `Across India (1997–2020), ${crop} production totalled about ${big(rs.reduce((s, r) => s + (r.production || 0), 0))} tonnes over roughly ${big(rs.reduce((s, r) => s + (r.area || 0), 0))} hectares, ` +
      `with an average yield of ${n2(mean(rs.map(r => r.yield)))} tonnes per hectare. ` +
      `Top producing states: ${top.map(([s, p]) => `${s} (${big(p)} tonnes)`).join(", ")}.`);
  }

  // per-state top crops (for "what grows best in my state")
  const byState = new Map();
  for (const r of rows) {
    if (!byState.has(r.state)) byState.set(r.state, []);
    byState.get(r.state).push(r);
  }
  for (const [state, rs] of byState) {
    const prodByCrop = new Map();
    for (const r of rs) prodByCrop.set(r.crop, (prodByCrop.get(r.crop) || 0) + (r.production || 0));
    const top = [...prodByCrop.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    add("crop_yield", `Yield — Top crops — ${state}`,
      `The major crops of ${state} by total production (1997–2020) are: ` +
      `${top.map(([c, p]) => `${c} (${big(p)} tonnes)`).join(", ")}.`);
  }
}

// ============ 2. farmer_advisor_dataset.csv — farm condition profiles ============
{
  const rows = loadTable("datasets/farmer_advisor_dataset.csv");
  const byCrop = new Map();
  for (const r of rows) {
    if (!byCrop.has(r.Crop_Type)) byCrop.set(r.Crop_Type, []);
    byCrop.get(r.Crop_Type).push(r);
  }
  const stat = (arr) => ({ m: mean(arr), lo: Math.min(...arr), hi: Math.max(...arr) });
  for (const [crop, rs] of byCrop) {
    const g = (f) => rs.map(r => num(r[f])).filter(v => v !== null);
    const ph = stat(g("Soil_pH")), moist = stat(g("Soil_Moisture")), temp = stat(g("Temperature_C"));
    const rain = stat(g("Rainfall_mm")), fert = stat(g("Fertilizer_Usage_kg")), pest = stat(g("Pesticide_Usage_kg"));
    const yld = stat(g("Crop_Yield_ton")), sus = stat(g("Sustainability_Score"));
    add("farmer_advisor", `Farm profile — ${crop}`,
      `Farm advisory records for ${crop} (${rs.length} farms): soil pH averages ${n2(ph.m)} (range ${n2(ph.lo)}–${n2(ph.hi)}), ` +
      `soil moisture around ${n2(moist.m)}%, air temperature ${n2(temp.m)} °C and rainfall ${n2(rain.m)} mm. ` +
      `Typical fertilizer usage is ${n2(fert.m)} kg and pesticide usage ${n2(pest.m)} kg per farm, ` +
      `yielding on average ${n2(yld.m)} tonnes of crop with a sustainability score of ${n2(sus.m)} out of 100.`);
  }
}

// ============ 3. market_researcher_dataset.csv — market snapshots ============
{
  const rows = loadTable("datasets/market_researcher_dataset.csv");
  const byProduct = new Map();
  for (const r of rows) {
    if (!byProduct.has(r.Product)) byProduct.set(r.Product, []);
    byProduct.get(r.Product).push(r);
  }
  for (const [product, rs] of byProduct) {
    const g = (f) => rs.map(r => num(r[f])).filter(v => v !== null);
    const mp = mean(g("Market_Price_per_ton")), cp = mean(g("Competitor_Price_per_ton"));
    const demand = mean(g("Demand_Index")), supply = mean(g("Supply_Index"));
    const trend = mean(g("Consumer_Trend_Index")), weather = mean(g("Weather_Impact_Score"));
    const seasonCount = {};
    for (const r of rs) if (r.Seasonal_Factor) seasonCount[r.Seasonal_Factor] = (seasonCount[r.Seasonal_Factor] || 0) + 1;
    const mode = Object.entries(seasonCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "mixed";
    add("market_researcher", `Market — ${product}`,
      `Market snapshot for ${product} (${rs.length} market records): average market price ${n2(mp)} per ton against an average competitor price of ${n2(cp)} per ton. ` +
      `Average demand index ${n2(demand)}, supply index ${n2(supply)}, consumer trend index ${n2(trend)}, and weather impact score ${n2(weather)} out of 100. ` +
      `The most common seasonal factor level is "${mode}" (High: ${seasonCount.High || 0}, Medium: ${seasonCount.Medium || 0}, Low: ${seasonCount.Low || 0} records).`);
  }
}

// ============ 4. standardized_crops.csv — ideal growing conditions ============
const centroids = [];
{
  const rows = loadTable("datasets/standardized_crops.csv");
  const byLabel = new Map();
  for (const r of rows) {
    if (!byLabel.has(r.label)) byLabel.set(r.label, []);
    byLabel.get(r.label).push(r);
  }
  const FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"];
  for (const [crop, rs] of byLabel) {
    const c = { crop, count: rs.length };
    for (const f of FEATURES) {
      const vals = rs.map(r => num(r[f])).filter(v => v !== null);
      c[f] = r2(mean(vals));
      c[`${f}_sd`] = r2(sdOf(vals));
    }
    centroids.push(c);
    add("standardized_crops", `Growing conditions — ${crop}`,
      `Ideal growing conditions for ${crop}, based on ${rs.length} samples: nitrogen level ${n2(c.N)}, phosphorus ${n2(c.P)}, potassium ${n2(c.K)}, ` +
      `temperature around ${n2(c.temperature)} °C, humidity about ${n2(c.humidity)}%, soil pH ${n2(c.ph)}, and rainfall near ${n2(c.rainfall)} mm. ` +
      `A field close to these conditions suits ${crop} well.`);
  }
}

// ============ 5. state_soil_data.csv — soil per state ============
{
  const rows = loadTable("datasets/state_soil_data.csv");
  for (const r of rows) {
    add("state_soil_data", `Soil — ${r.state}`,
      `Soil profile of ${r.state}: average nitrogen ${r.N}, phosphorus ${r.P} and potassium ${r.K} (N-P-K nutrient levels) with a soil pH of about ${r.pH}.`);
  }
}

// ============ 6. state_weather_data_1997_2020.csv — climate per state ============
{
  const rows = loadTable("datasets/state_weather_data_1997_2020.csv").map((r) => ({
    state: r.state, year: parseInt(r.year),
    temp: num(r.avg_temp_c), rain: num(r.total_rainfall_mm), hum: num(r.avg_humidity_percent),
  })).filter((r) => r.state && r.temp !== null);

  const byState = new Map();
  for (const r of rows) {
    if (!byState.has(r.state)) byState.set(r.state, []);
    byState.get(r.state).push(r);
  }
  for (const [state, rs] of byState) {
    const wettest = rs.reduce((a, b) => (b.rain > a.rain ? b : a));
    const driest = rs.reduce((a, b) => (b.rain < a.rain ? b : a));
    const temps = rs.map(r => r.temp);
    add("state_weather_data", `Climate — ${state}`,
      `Climate of ${state} (1997–2020): average annual temperature ${n2(mean(temps))} °C (ranging ${n2(Math.min(...temps))}–${n2(Math.max(...temps))} °C), ` +
      `average annual rainfall about ${n2(mean(rs.map(r => r.rain)))} mm and average humidity around ${n2(mean(rs.map(r => r.hum)))}%. ` +
      `The wettest year was ${wettest.year} with ${n2(wettest.rain)} mm and the driest ${driest.year} with ${n2(driest.rain)} mm of rainfall.`);
  }
}

// ---------- write outputs ----------
mkdirSync("data", { recursive: true });
mkdir("src/data", { recursive: true });

const summary = {};
for (const c of chunks) summary[c.source] = (summary[c.source] || 0) + 1;

writeFileSync("data/kbChunks.json", JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalChunks: chunks.length,
  sources: summary,
  chunks,
}, null, 1));

const centroidLines = centroids.map((c) =>
  `  { crop: "${c.crop}", count: ${c.count}, n: ${c.N}, p: ${c.P}, k: ${c.K}, temperature: ${c.temperature}, humidity: ${c.humidity}, ph: ${c.ph}, rainfall: ${c.rainfall} },`
).join("\n");

writeFileSync("src/data/cropCentroids.ts",
`// Auto-generated by scripts/prepare-kb.mjs from datasets/standardized_crops.csv.
// Mean growing conditions per crop — used by the crop recommender.
export interface CropCentroid {
  crop: string;
  count: number;
  n: number;
  p: number;
  k: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export const CROP_CENTROIDS: CropCentroid[] = [
${centroidLines}
];
`);

console.log(`✅ Prepared ${chunks.length} knowledge chunks:`);
for (const [s, n] of Object.entries(summary)) console.log(`   ${s}: ${n}`);
console.log(`✅ ${centroids.length} crop centroids → src/data/cropCentroids.ts`);
