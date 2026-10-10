import React, { useState, useEffect, useRef } from "react";
import { Satellite, Trash2, Check, Sparkles } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { saveTwinField } from "../lib/digitalTwinData";

// Pure client-side geometry — replaces the old /api/gis/calculate-field call,
// which 405s on the static deploy. Same spherical math the backend used.
function computeFieldGeometry(pts: { lat: number; lng: number }[]) {
  if (pts.length < 3) {
    return { acres: 0, hectares: 0, guntha: 0, perimeterMeters: 0, centroid: null as null | { lat: number; lng: number } };
  }
  const R = 6371000;
  let area = 0;
  let perimeter = 0;
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
    // great-circle distance for perimeter
    const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
    const dLon = (p2.lng - p1.lng) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    perimeter += 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  area = Math.abs((area * R * R) / 2);
  const acres = Math.round((area / 4046.86) * 100) / 100;
  return {
    acres,
    hectares: Math.round((area / 10000) * 100) / 100,
    guntha: Math.round(acres * 40 * 10) / 10,
    perimeterMeters: Math.round(perimeter),
    centroid: {
      lat: Number((pts.reduce((s, p) => s + p.lat, 0) / pts.length).toFixed(5)),
      lng: Number((pts.reduce((s, p) => s + p.lng, 0) / pts.length).toFixed(5)),
    },
  };
}

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
  const [metrics, setMetrics] = useState<any>({ acres: 0, hectares: 0, guntha: 0, perimeterMeters: 0, centroid: null });
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

      // Client-side geometry (no backend needed — static deploy safe)
      setMetrics(computeFieldGeometry(points));
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

  const savePlotToDigitalTwin = () => {
    // Persist locally with REAL computed geometry — no network, no backend dependency
    const geom = computeFieldGeometry(points);
    if (geom.acres <= 0 || !geom.centroid) return;
    saveTwinField({
      name: fieldName || "My Farm Plot",
      areaAcres: geom.acres,
      centroid: geom.centroid,
      coordinates: points,
      savedAt: new Date().toISOString(),
    });
    setMetrics(geom);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
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
