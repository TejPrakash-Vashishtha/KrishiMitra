import React, { useState, useEffect } from "react";
import { Sliders, Thermometer, Droplets, Sprout, ShieldCheck } from "lucide-react";
import api from "../services/api";

export default function WhatIfSimulationPage() {
  const [tempDelta, setTempDelta] = useState<number>(3);
  const [drySpellDays, setDrySpellDays] = useState<number>(8);
  const [rainfallExcessMm, setRainfallExcessMm] = useState<number>(0);
  const [irrigationPercent, setIrrigationPercent] = useState<number>(80);
  const [nitrogenDosagePercent, setNitrogenDosagePercent] = useState<number>(10);
  const [pestPressure, setPestPressure] = useState<"Low" | "Moderate" | "High" | "Severe Outbreak">("Moderate");
  const [crop, setCrop] = useState<string>("Paddy (Swarna Sub-1)");

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.post("/simulation/run", {
        tempDeltaCelsius: tempDelta,
        drySpellDays,
        rainfallExcessMm,
        irrigationPercent,
        nitrogenDosagePercent,
        pestPressure,
        crop,
      });
      if (res.data.success) {
        setResult(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [tempDelta, drySpellDays, rainfallExcessMm, irrigationPercent, nitrogenDosagePercent, pestPressure]);

  const applyPreset = (preset: { temp: number; dry: number; rain: number; irrig: number; pest: any }) => {
    setTempDelta(preset.temp);
    setDrySpellDays(preset.dry);
    setRainfallExcessMm(preset.rain);
    setIrrigationPercent(preset.irrig);
    setPestPressure(preset.pest);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-3">
            <Sliders className="w-3.5 h-3.5" />
            <span>Biophysical Climate Perturbation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            Interactive "What-If" Predictive Crop Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Simulate climate shocks (heatwaves, dry spells, floods) or post-harvest storage conditions to forecast yield deviation, spoilage risk, and financial impact.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase mr-2">Quick Scenarios:</span>
          <button
            onClick={() => applyPreset({ temp: 4, dry: 12, rain: 0, irrig: 40, pest: "High" })}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-amber-500 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
          >
            🔥 Extreme Heatwave & Drought
          </button>
          <button
            onClick={() => applyPreset({ temp: -1, dry: 0, rain: 60, irrig: 0, pest: "Moderate" })}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
          >
            🌊 Cyclone & Excess Deluge
          </button>
          <button
            onClick={() => applyPreset({ temp: 0, dry: 2, rain: 0, irrig: 100, pest: "Low" })}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
          >
            🌱 Optimal Climate & Irrigation
          </button>
          <button
            onClick={() => applyPreset({ temp: 5, dry: 0, rain: 0, irrig: 0, pest: "Moderate" })}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-orange-500 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
          >
            📦 Post-Harvest Storage Loss
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>{tempDelta >= 4 && irrigationPercent === 0 ? "Post-Harvest Storage Parameters" : "Perturbation Parameters"}</span>
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                  <span>Temperature Deviation:</span>
                </span>
                <span className="font-extrabold text-rose-600">
                  {tempDelta >= 0 ? `+${tempDelta}` : tempDelta}&deg;C
                </span>
              </div>
              <input
                type="range"
                min="-3"
                max="6"
                step="0.5"
                value={tempDelta}
                onChange={(e) => setTempDelta(parseFloat(e.target.value))}
                className="w-full accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>-3&deg;C</span>
                <span>0&deg;C (Normal)</span>
                <span>+6&deg;C (Heatwave)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dry Spell (Zero Rain Days):</span>
                </span>
                <span className="font-extrabold text-amber-600">{drySpellDays} Days</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={drySpellDays}
                onChange={(e) => setDrySpellDays(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700">Excess Deluge Rainfall:</span>
                <span className="font-extrabold text-blue-600">+{rainfallExcessMm} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={rainfallExcessMm}
                onChange={(e) => setRainfallExcessMm(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700">Irrigation Supply:</span>
                <span className="font-extrabold text-emerald-600">{irrigationPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={irrigationPercent}
                onChange={(e) => setIrrigationPercent(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Pest Pressure Level</label>
              <div className="grid grid-cols-2 gap-2">
                {(["Low", "Moderate", "High", "Severe Outbreak"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setPestPressure(lvl)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      pestPressure === lvl
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {result ? (
              <>
                <div className={`rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                  result.predictedYieldImpactPercent < -15
                    ? "bg-gradient-to-r from-rose-600 to-red-800"
                    : result.predictedYieldImpactPercent < 0
                    ? "bg-gradient-to-r from-amber-600 to-orange-700"
                    : "bg-gradient-to-r from-emerald-600 to-teal-700"
                }`}>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">Predicted Outcome</span>
                    <h3 className="text-2xl sm:text-3xl font-black">
                      {result.predictedYieldImpactPercent > 0 ? `+${result.predictedYieldImpactPercent}%` : `${result.predictedYieldImpactPercent}%`} Yield Deviation
                    </h3>
                    <p className="text-xs text-white/90 mt-1 font-medium">
                      Financial Delta: <span className="font-bold">{result.predictedProfitDeltaInrPerAcre >= 0 ? `+?${result.predictedProfitDeltaInrPerAcre}` : `-?${Math.abs(result.predictedProfitDeltaInrPerAcre)}`} / Acre</span>
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-black/20 backdrop-blur-md text-right">
                    <span className="text-[10px] text-white/80 block">Biophysical Stress</span>
                    <span className="text-sm font-bold text-amber-300">{result.cropStressIndex}</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-emerald-600" />
                      <span>14-Day Biophysical Soil & NDVI Forecast</span>
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400">Wilting Threshold: 18%</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                          <th className="py-2 px-2.5">Timeline</th>
                          <th className="py-2 px-2.5">Air Temp</th>
                          <th className="py-2 px-2.5">10cm Soil Moisture</th>
                          <th className="py-2 px-2.5">Projected NDVI</th>
                          <th className="py-2 px-2.5">Stress Factor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {result.dailyProjections?.map((dp: any, idx: number) => {
                          const isWilted = dp.soilMoisture10cmPercent < dp.wiltingPointThresholdPercent;
                          return (
                            <tr key={idx} className={isWilted ? "bg-rose-50/50" : "hover:bg-slate-50"}>
                              <td className="py-2 px-2.5 font-semibold">{dp.dateStr}</td>
                              <td className="py-2 px-2.5">{dp.projectedTemp}&deg;C</td>
                              <td className="py-2 px-2.5 font-bold">
                                <span className={isWilted ? "text-rose-600 font-black" : "text-blue-600"}>
                                  {dp.soilMoisture10cmPercent}% {isWilted && "⚠️"}
                                </span>
                              </td>
                              <td className="py-2 px-2.5 font-bold text-emerald-600">{dp.projectedNdvi}</td>
                              <td className="py-2 px-2.5">
                                <span className="text-[11px] font-semibold text-slate-600">{dp.stressFactorPercent}%</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Pre-Emptive Climate Protection Roadmap</span>
                  </h4>
                  <div className="space-y-2">
                    {result.preventativeActionPlan?.map((plan: string, pIdx: number) => (
                      <div key={pIdx} className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2">
                        <span className="font-bold text-emerald-700">{pIdx + 1}.</span>
                        <span>{plan}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
