import React, { useState, useEffect } from "react";
import { Layers, Activity, RefreshCw, Zap, TrendingUp, Droplet, Sun, Wind, Sprout, ShieldCheck, MapPin, Package, AlertTriangle } from "lucide-react";
import api from "../services/api";

export default function DigitalTwinPage() {
  const [twin, setTwin] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulsing, setPulsing] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<number>(0);

  const fetchTwin = () => {
    setLoading(true);
    api.get("/digital-twin")
      .then((res) => {
        if (res.data.success) {
          setTwin(res.data.state);
          setHistory(res.data.history || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTwin();
  }, []);

  const triggerPulse = async () => {
    setPulsing(true);
    try {
      const res = await api.post("/digital-twin/pulse");
      if (res.data.success) {
        setTwin(res.data.state);
        if (res.data.latestPoint) {
          setHistory((prev) => [...prev.slice(-14), res.data.latestPoint]);
        }
      }
    } finally {
      setPulsing(false);
    }
  };

  if (loading && !twin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const s = twin || {};
  const soil = s.soilProfile || {};
  const canopy = s.cropCanopy || {};
  const micro = s.microclimate || {};
  const layers = soil.layers || [];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>Real-Time Farm Digital Twin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {s.farmName || "AgriNexus Farm Plot #4"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{s.district}, {s.state} &bull; {s.plotSizeAcres} Acres &bull; {s.primaryCrop} &bull; {s.growthStage}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerPulse}
              disabled={pulsing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${pulsing ? "animate-bounce text-amber-300" : ""}`} />
              <span>{pulsing ? "Injecting Sensor Pulse..." : "Simulate IoT Sensor Pulse"}</span>
            </button>

            <button
              onClick={fetchTwin}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Refresh State"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* NDVI Biomass Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Biomass NDVI Index</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Sprout className="w-4 h-4" /></span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{canopy.ndviIndex}</div>
            <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>Leaf Area Index: {canopy.leafAreaIndex}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(canopy.ndviIndex || 0.7) * 100}%` }} />
            </div>
          </div>

          {/* 10cm Root-Zone Moisture Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Root-Zone Moisture</span>
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600"><Droplet className="w-4 h-4" /></span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{soil.subsoilMoisturePercent}%</div>
            <div className="mt-2 text-xs font-semibold text-blue-600">Topsoil (0-5cm): {soil.topsoilMoisturePercent}%</div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(soil.subsoilMoisturePercent || 35) * 1.8}%` }} />
            </div>
          </div>

          {/* Soil Chemistry NPK Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Soil Chemistry pH</span>
              <span className="p-2 rounded-xl bg-violet-50 text-violet-600"><ShieldCheck className="w-4 h-4" /></span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{soil.pH}</div>
            <div className="mt-2 text-xs text-slate-500 truncate">
              N: {soil.nitrogenKgHa} | P: {soil.phosphorusKgHa} | K: {soil.potassiumKgHa} kg/ha
            </div>
            <div className="mt-2 text-[11px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md inline-block">
              Optimal Slightly Acidic
            </div>
          </div>

          {/* Microclimate VPD Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Microclimate & VPD</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600"><Sun className="w-4 h-4" /></span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{micro.vaporPressureDeficitKPa} <span className="text-sm font-semibold text-slate-400">kPa</span></div>
            <div className="mt-2 text-xs font-semibold text-amber-600">ET?: {micro.dailyEvapotranspirationMm} mm/day</div>
            <div className="mt-2 text-xs text-slate-400">Canopy: {canopy.canopyTemperatureCelsius}&deg;C | Ambient: {micro.ambientTempCelsius}&deg;C</div>
          </div>
        </div>

        {/* Interactive Soil Strata / Depth Layer Viewer */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Sub-Surface Soil Profile & Strata Dynamics</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select vertical soil depth horizon to inspect live moisture retention, compaction, and organic carbon percentage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {layers.map((layer: any, idx: number) => {
              const isSelected = selectedLayer === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedLayer(idx)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-slate-800">{layer.depthRange}</span>
                    <span className="text-xs font-bold text-emerald-700">{layer.moisturePercent}% Water</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Layer Temp:</span>
                      <span className="font-semibold text-slate-800">{layer.temperatureCelsius}&deg;C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Organic Carbon:</span>
                      <span className="font-semibold text-slate-800">{layer.organicCarbonPercent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Structure:</span>
                      <span className="font-semibold text-slate-800">{layer.compactionStatus}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stored Produce Condition Tracking */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              <span>Stored Produce Condition Monitor</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Track temperature, humidity, and spoilage risk for your stored harvest</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <p className="text-[10px] text-blue-600 font-semibold uppercase">Storage Temperature</p>
              <p className="text-2xl font-extrabold text-blue-800 mt-1">26°C</p>
              <p className="text-[10px] text-blue-500 mt-1">Optimal: 15-25°C for grains</p>
              <div className="w-full h-1.5 bg-blue-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "72%" }} />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <p className="text-[10px] text-amber-600 font-semibold uppercase">Relative Humidity</p>
              <p className="text-2xl font-extrabold text-amber-800 mt-1">68%</p>
              <p className="text-[10px] text-amber-500 mt-1">Optimal: &lt;65% for stored grain</p>
              <div className="w-full h-1.5 bg-amber-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "68%" }} />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="text-[10px] text-emerald-600 font-semibold uppercase">Spoilage Risk</p>
              <p className="text-2xl font-extrabold text-emerald-800 mt-1">Low</p>
              <p className="text-[10px] text-emerald-500 mt-1">Grain moisture: 12.5%</p>
              <div className="w-full h-1.5 bg-emerald-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "25%" }} />
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-amber-800"><span className="font-bold">Advisory:</span> Humidity is slightly above optimal. Consider increasing ventilation or using a dehumidifier to bring RH below 65% to prevent fungal growth.</p>
          </div>
        </div>

        {/* Telemetry Time-Series Chart Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Historical Telemetry & Biophysical Trajectory</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Multi-day NDVI biomass index and 10cm soil moisture trends</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Live Timestamp Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">NDVI Index</th>
                  <th className="py-2.5 px-3">10cm Soil Moisture</th>
                  <th className="py-2.5 px-3">Canopy Temp</th>
                  <th className="py-2.5 px-3">ET? (mm/day)</th>
                  <th className="py-2.5 px-3">Biomass Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.slice(-8).reverse().map((pt, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{pt.timestamp}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">{pt.ndvi}</td>
                    <td className="py-2.5 px-3 font-bold text-blue-600">{pt.moisture10cm}%</td>
                    <td className="py-2.5 px-3">{pt.canopyTemp}&deg;C</td>
                    <td className="py-2.5 px-3">{pt.et0} mm</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {pt.ndvi >= 0.7 ? "Vigorous Vegetative" : "Moderate Biomass"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
