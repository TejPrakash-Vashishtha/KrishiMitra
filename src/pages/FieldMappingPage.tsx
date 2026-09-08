import React, { useState, useEffect, useRef } from "react";
import { Satellite, Trash2, Check, Sparkles } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../services/api";

export default function FieldMappingPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([
    { lat: 20.4635, lng: 85.8812 },
    { lat: 20.4652, lng: 85.8845 },
    { lat: 20.4628, lng: 85.8860 },
    { lat: 20.4611, lng: 85.8824 },
  ]);

  const [activeOverlay, setActiveOverlay] = useState<"TRUE_COLOR" | "NDVI" | "MOISTURE" | "DISEASE">("NDVI");
  const [metrics, setMetrics] = useState<any>({
    acres: 3.42,
    hectares: 1.38,
    guntha: 136.8,
    perimeterMeters: 840,
    centroid: { lat: 20.4631, lng: 85.8835 },
    spectralIndices: {
      meanNdvi: 0.78,
      soilMoisture10cmPercent: 36.5,
      vegetationUniformityPercent: 91.2,
      diseaseRiskZoneCount: 1,
    },
  });
  const [fieldName, setFieldName] = useState("Mahanadi Alluvial Plot #A");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([20.4635, 85.8835], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      map.on("click", (e: L.LeafletMouseEvent) => {
        setPoints((prev) => [...prev, { lat: Number(e.latlng.lat.toFixed(5)), lng: Number(e.latlng.lng.toFixed(5)) }]);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
    }
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (points.length >= 3) {
      const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);

      let color = "#10b981";
      if (activeOverlay === "NDVI") color = "#059669";
      if (activeOverlay === "MOISTURE") color = "#2563eb";
      if (activeOverlay === "DISEASE") color = "#e11d48";

      const poly = L.polygon(latlngs, {
        color,
        fillColor: color,
        fillOpacity: 0.35,
        weight: 3,
      }).addTo(map);

      polygonLayerRef.current = poly;
      map.fitBounds(poly.getBounds(), { padding: [40, 40] });

      points.forEach((p, idx) => {
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: 5,
          color: "#fff",
          fillColor: color,
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);
        marker.bindTooltip(`Point #${idx + 1}`);
        markersRef.current.push(marker);
      });

      api.post("/gis/calculate-field", { coordinates: points })
        .then((res) => {
          if (res.data.success) {
            setMetrics(res.data);
          }
        })
        .catch(() => {});
    }
  }, [points, activeOverlay]);

  const clearPoints = () => {
    setPoints([]);
    setMetrics({ acres: 0, hectares: 0, guntha: 0, perimeterMeters: 0 });
  };

  const loadSamplePlot = () => {
    setPoints([
      { lat: 20.4635, lng: 85.8812 },
      { lat: 20.4652, lng: 85.8845 },
      { lat: 20.4628, lng: 85.8860 },
      { lat: 20.4611, lng: 85.8824 },
    ]);
  };

  const savePlotToDigitalTwin = async () => {
    try {
      const res = await api.post("/gis/save-field", {
        fieldName,
        coordinates: points,
        farmerId: "farmer-demo-1",
      });
      if (res.data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err) {
      console.error("Failed to save field:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold mb-2">
              <Satellite className="w-3.5 h-3.5" />
              <span>GIS Geospatial Field Boundary & Spectral Satellite Overlays</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Interactive Farm Plot GIS Mapping
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Click on the map to draw field boundary vertices, calculate acreage, and inspect simulated NDVI vegetation & soil moisture bands.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSamplePlot}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
            >
              Load Demo Plot
            </button>
            <button
              onClick={clearPoints}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
              title="Clear Polygon"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm flex flex-col space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-2xl bg-slate-100 text-xs font-semibold">
              <button
                onClick={() => setActiveOverlay("NDVI")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeOverlay === "NDVI" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🟢 NDVI Biomass Spectrum
              </button>
              <button
                onClick={() => setActiveOverlay("MOISTURE")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeOverlay === "MOISTURE" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                💧 Soil Moisture Band
              </button>
              <button
                onClick={() => setActiveOverlay("DISEASE")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeOverlay === "DISEASE" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🔴 Disease Risk Zones
              </button>
              <button
                onClick={() => setActiveOverlay("TRUE_COLOR")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeOverlay === "TRUE_COLOR" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🛰️ True Color
              </button>
            </div>

            <div
              ref={mapContainerRef}
              className="w-full h-[450px] sm:h-[500px] rounded-2xl overflow-hidden border border-slate-200 relative z-10"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
              <span>Points Placed: {points.length} (Min 3 required)</span>
              <span>Coordinates Centroid: {metrics.centroid?.lat || 20.4631}&deg; N, {metrics.centroid?.lng || 85.8835}&deg; E</span>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Geospatial Land Metrics
              </h3>

              <div>
                <span className="text-xs text-slate-400 block">Total Cultivated Area</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
                  {metrics.acres} <span className="text-base font-semibold text-slate-500">Acres</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {metrics.hectares} Hectares &bull; {metrics.guntha} Gunthas (Odisha Standard)
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Perimeter</span>
                  <span className="font-bold text-slate-800">{metrics.perimeterMeters} meters</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Zonal Soil Type</span>
                  <span className="font-bold text-slate-800">Alluvial Deltaic</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Satellite Spectral Indices
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-950">
                  <span>Mean Polygon NDVI:</span>
                  <span className="font-bold">{metrics.spectralIndices?.meanNdvi || 0.78}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-blue-50 text-blue-950">
                  <span>Root-Zone Soil Moisture:</span>
                  <span className="font-bold">{metrics.spectralIndices?.soilMoisture10cmPercent || 36.5}%</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 text-slate-900">
                  <span>Canopy Uniformity:</span>
                  <span className="font-bold">{metrics.spectralIndices?.vegetationUniformityPercent || 91.2}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-slate-700">Plot Name</label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button
                onClick={savePlotToDigitalTwin}
                disabled={points.length < 3}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savedSuccess ? <Check className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4" />}
                <span>{savedSuccess ? "Synced to Digital Twin!" : "Sync Plot to Digital Twin"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
