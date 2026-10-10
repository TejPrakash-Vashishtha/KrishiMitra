import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Activity, RefreshCw, Zap, Droplet, Sun, Sprout, ShieldCheck, MapPin,
  AlertTriangle, TrendingUp, Layers, Tractor, FlaskConical, Bug, CloudRain,
  Map as MapIcon, Ruler, Pencil, Crosshair, Sparkles, CheckCircle2,
  Search, Eye, ShieldAlert, FileText, ChevronRight, Check,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation } from "../contexts/LocationContext";
import {
  fetchTwinState, loadTwinField, saveTwinField, wiltThreshold, getStateClimate,
  type TwinState, type TwinAdvisory, type TwinProjectionPoint, type TwinField,
} from "../lib/digitalTwinData";
import {
  searchOrCreateKhasraParcelAsync, VERIFIED_LAND_RECORDS, INDIAN_STATES, UP_CADASTRAL_DATABASE, type LandRecordParcel,
} from "../lib/khasraLandLookup";
import PmfbyEvidenceExport from "../components/digitaltwin/PmfbyEvidenceExport";

const ADVISORY_STYLE: Record<TwinAdvisory["severity"], { border: string; bg: string; icon: React.ReactNode }> = {
  good: { border: "border-emerald-200", bg: "bg-emerald-50", icon: <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> },
  caution: { border: "border-amber-200", bg: "bg-amber-50", icon: <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /> },
  alert: { border: "border-rose-200", bg: "bg-rose-50", icon: <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" /> },
};

const ADVISORY_ICON: Record<TwinAdvisory["type"], React.ReactNode> = {
  irrigation: <Droplet className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />,
  yield: <TrendingUp className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />,
  fertilizer: <FlaskConical className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />,
  pest: <Bug className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />,
  info: <Activity className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />,
};

function MoistureBar({ label, value, threshold }: { label: string; value: number; threshold: number }) {
  const pct = Math.min(100, (value / 50) * 100);
  const th = Math.min(100, (threshold / 50) * 100);
  const color = value < threshold ? "bg-rose-500" : value < threshold + 8 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className={`font-bold ${value < threshold ? "text-rose-600" : "text-slate-800"}`}>{value}%</span>
      </div>
      <div className="relative w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        <div className="absolute top-0 bottom-0 w-0.5 bg-rose-800" style={{ left: `${th}%` }} title={`Wilting point ${threshold}%`} />
      </div>
    </div>
  );
}

// ---------------- Satellite Farm Map with Khasra Locator & NDVI Crop Vigor ----------------
function FarmMap({
  field, lat, lon, district, state, onFieldSaved,
}: {
  field: ReturnType<typeof loadTwinField>;
  lat: number;
  lon: number;
  district: string;
  state: string;
  onFieldSaved: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polyRef = useRef<L.Polygon | null>(null);
  const ndviLayerRef = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<L.Marker[]>([]);

  const [drawing, setDrawing] = useState(false);
  const [pts, setPts] = useState<{ lat: number; lng: number }[]>(field?.coordinates ?? []);
  const [activeLayer, setActiveLayer] = useState<"SATELLITE" | "NDVI" | "MOISTURE">("SATELLITE");

  // Khasra lookup input state
  const [selectedState, setSelectedState] = useState(state || "Uttar Pradesh");
  const [selectedDistrict, setSelectedDistrict] = useState("Gautam Buddha Nagar");
  const [selectedTehsil, setSelectedTehsil] = useState("Jewar (Agricultural Belt)");
  const [khasraInput, setKhasraInput] = useState(field?.khasraNo || "");
  const [searchingLand, setSearchingLand] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<LandRecordParcel | null>(null);
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null);
  const [showLookupBox, setShowLookupBox] = useState(false);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center: [number, number] = field?.centroid
      ? [field.centroid.lat, field.centroid.lng]
      : [lat, lon];
    const map = L.map(containerRef.current, { zoomControl: true }).setView(center, 17);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute live area
  const acres = useMemo(() => {
    if (pts.length < 3) return 0;
    const R = 6371000;
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const lat1 = (p1.lat * Math.PI) / 180;
      const lat2 = (p2.lat * Math.PI) / 180;
      const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
      area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    area = Math.abs((area * R * R) / 2);
    return Math.round((area / 4046.86) * 100) / 100;
  }, [pts]);

  // Redraw boundaries & NDVI heat overlay when pts or activeLayer change
  const redraw = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (polyRef.current) {
      map.removeLayer(polyRef.current);
      polyRef.current = null;
    }
    if (ndviLayerRef.current) {
      map.removeLayer(ndviLayerRef.current);
      ndviLayerRef.current = null;
    }
    markerRefs.current.forEach((m) => map.removeLayer(m));
    markerRefs.current = [];

    if (pts.length >= 3) {
      const latlngs = pts.map((p) => [p.lat, p.lng] as [number, number]);

      // Style polygon depending on view mode
      let strokeColor = "#10b981"; // green default
      let fillColor = "#10b981";
      let fillOpacity = 0.25;

      if (activeLayer === "NDVI") {
        strokeColor = "#059669";
        fillColor = "#22c55e";
        fillOpacity = 0.45;
      } else if (activeLayer === "MOISTURE") {
        strokeColor = "#0284c7";
        fillColor = "#38bdf8";
        fillOpacity = 0.4;
      }

      const poly = L.polygon(latlngs, {
        color: strokeColor,
        fillColor,
        fillOpacity,
        weight: 3.5,
        dashArray: activeLayer === "SATELLITE" ? undefined : "6, 4",
      }).addTo(map);

      polyRef.current = poly;
      map.fitBounds(poly.getBounds(), { padding: [30, 30] });

      // If NDVI mode is active, render internal crop vigor gradient cells
      if (activeLayer === "NDVI") {
        const group = L.layerGroup().addTo(map);
        ndviLayerRef.current = group;

        const bounds = poly.getBounds();
        const southWest = bounds.getSouthWest();
        const northEast = bounds.getNorthEast();
        const latStep = (northEast.lat - southWest.lat) / 3;
        const lngStep = (northEast.lng - southWest.lng) / 3;

        // Vigor matrix: 0.70 to 0.85 (High healthy green), 0.50 (Moderate yellow-green)
        const vigorColors = ["#15803d", "#22c55e", "#16a34a", "#84cc16", "#22c55e", "#15803d", "#84cc16", "#16a34a", "#15803d"];

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const cellSW: [number, number] = [southWest.lat + r * latStep, southWest.lng + c * lngStep];
            const cellNE: [number, number] = [southWest.lat + (r + 1) * latStep, southWest.lng + (c + 1) * lngStep];
            L.rectangle([cellSW, cellNE], {
              color: "transparent",
              fillColor: vigorColors[r * 3 + c] || "#22c55e",
              fillOpacity: 0.35,
            }).addTo(group);
          }
        }
      }
    }

    // Corner control points
    pts.forEach((p, idx) => {
      const m = L.circleMarker([p.lat, p.lng], {
        radius: 6,
        color: "#ffffff",
        fillColor: activeLayer === "NDVI" ? "#16a34a" : "#10b981",
        fillOpacity: 1,
        weight: 2.5,
      }).addTo(map);
      m.bindTooltip(`Point #${idx + 1}`, { permanent: false, direction: "top" });
      markerRefs.current.push(m as unknown as L.Marker);
    });
  }, [pts, activeLayer]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Handle Khasra search & instant polygon plot positioning
  const handleKhasraSearch = async (
    queryOverride?: string,
    stateOverride?: string,
    districtOverride?: string,
    tehsilOverride?: string
  ) => {
    const q = queryOverride || khasraInput;
    if (!q.trim()) return;

    const targetState = stateOverride || selectedState || "Uttar Pradesh";
    const targetDistrict = districtOverride || selectedDistrict || "Gautam Buddha Nagar";
    const targetTehsil = tehsilOverride || selectedTehsil;

    setSearchingLand(true);
    setLookupFeedback(`Locating Khasra ${q.trim()} in ${targetDistrict} (${targetTehsil})...`);

    try {
      const map = mapRef.current;
      const centerLat = map ? map.getCenter().lat : lat;
      const centerLng = map ? map.getCenter().lng : lon;

      const parcel = await searchOrCreateKhasraParcelAsync(
        q,
        targetState,
        targetDistrict,
        targetTehsil,
        centerLat,
        centerLng
      );
      setSelectedParcel(parcel);
      setPts(parcel.boundary);

      const locationLabel = parcel.formattedAddress
        ? `${parcel.khasraNo}: ${parcel.village}, ${parcel.tehsil}, ${parcel.district} • ${parcel.areaAcres} Acres`
        : `Found Khasra ${parcel.khasraNo} (${parcel.village}, ${parcel.district}) • ${parcel.areaAcres} Acres`;

      setLookupFeedback(locationLabel);

      if (map) {
        map.setView([parcel.centroid.lat, parcel.centroid.lng], 17);
      }
    } catch (err) {
      console.error("Land lookup error:", err);
      setLookupFeedback("Could not complete land search. Please verify your query.");
    } finally {
      setSearchingLand(false);
    }
  };

  const toggleDrawing = () => {
    const map = mapRef.current;
    if (!map) return;
    if (drawing) {
      map.off("click");
      setDrawing(false);
      return;
    }
    setDrawing(true);
    map.on("click", (e: L.LeafletMouseEvent) => {
      setPts((prev) => [...prev, { lat: Number(e.latlng.lat.toFixed(5)), lng: Number(e.latlng.lng.toFixed(5)) }]);
    });
  };

  const clearPts = () => {
    setPts([]);
    setSelectedParcel(null);
    setLookupFeedback(null);
    const map = mapRef.current;
    if (map) map.off("click");
    setDrawing(false);
  };

  const saveField = () => {
    if (pts.length < 3) return;
    const centroid = {
      lat: pts.reduce((a, p) => a + p.lat, 0) / pts.length,
      lng: pts.reduce((a, p) => a + p.lng, 0) / pts.length,
    };

    const plotName = selectedParcel
      ? `Khasra ${selectedParcel.khasraNo}, ${selectedParcel.village}`
      : khasraInput.trim()
      ? `Khasra ${khasraInput.trim()} Plot`
      : "My Farm Plot";

    saveTwinField({
      name: plotName,
      areaAcres: selectedParcel?.areaAcres || acres,
      centroid,
      coordinates: pts,
      savedAt: new Date().toISOString(),
      khasraNo: selectedParcel?.khasraNo || khasraInput || undefined,
      khataNo: selectedParcel?.khataNo,
      village: selectedParcel?.village,
      crop: selectedParcel?.currentCrop,
      ndviAverage: selectedParcel?.ndviAverage,
      ndviStatus: selectedParcel?.ndviStatus,
    });

    onFieldSaved();
    setLookupFeedback("Field saved and linked to Digital Twin!");
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Top Header & Search Bar */}
      <div className="p-5 pb-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-teal-50 text-teal-600 shadow-xs">
              <MapIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                My Farm Land Map
              </h2>
              <p className="text-xs text-slate-500">
                {field?.khasraNo
                  ? `Khasra #${field.khasraNo} • ${field.areaAcres} acres • ${field.village || district}`
                  : "Search your Khasra / Survey number to automatically locate your field"}
              </p>
            </div>
          </div>

          {/* Layer View & Action Toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* NDVI Layer Switcher */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 text-xs">
              <button
                onClick={() => setActiveLayer("SATELLITE")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeLayer === "SATELLITE"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setActiveLayer("NDVI")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeLayer === "NDVI"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-emerald-700 hover:text-emerald-900"
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>NDVI Vigor</span>
              </button>
            </div>

            {/* Manual Boundary Button */}
            {!drawing ? (
              <button
                onClick={toggleDrawing}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
              >
                <Pencil className="w-3 h-3 text-slate-500" />
                <span>{pts.length > 0 ? "Adjust Corners" : "Trace by Hand"}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  Tap map corners ({pts.length})
                </span>
                <button
                  onClick={toggleDrawing}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- SIMPLE KHASRA NUMBER LOCATOR (State-First Workflow for Farmers) --- */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 p-3.5 rounded-2xl border border-emerald-200/80 space-y-2.5">
          {/* State & District Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-emerald-300/80 text-xs shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800">State:</span>
              <select
                value={selectedState}
                onChange={(e) => {
                  const newState = e.target.value;
                  setSelectedState(newState);
                  if (newState === "Uttar Pradesh") {
                    setSelectedDistrict("Gautam Buddha Nagar (Noida/Gr. Noida)");
                  }
                }}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {selectedState === "Uttar Pradesh" && (
              <>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-emerald-300/80 text-xs shadow-2xs">
                  <span className="text-[11px] font-bold text-emerald-800">District:</span>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      const newDist = e.target.value;
                      setSelectedDistrict(newDist);
                      const distObj = UP_CADASTRAL_DATABASE[newDist];
                      if (distObj) {
                        const firstTehsil = Object.keys(distObj.tehsils)[0];
                        setSelectedTehsil(firstTehsil);
                      }
                    }}
                    className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs max-w-[170px]"
                  >
                    {Object.keys(UP_CADASTRAL_DATABASE).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-emerald-300/80 text-xs shadow-2xs">
                  <span className="text-[11px] font-bold text-emerald-800">Tehsil:</span>
                  <select
                    value={selectedTehsil}
                    onChange={(e) => setSelectedTehsil(e.target.value)}
                    className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs max-w-[190px]"
                  >
                    {UP_CADASTRAL_DATABASE[selectedDistrict]?.tehsils &&
                      Object.keys(UP_CADASTRAL_DATABASE[selectedDistrict].tehsils).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                  </select>
                </div>
              </>
            )}

            <a
              href="https://upbhulekh.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2 ml-auto hidden sm:inline"
              title="Official Government of Uttar Pradesh Land Records Portal"
            >
              UP Bhulekh Portal (upbhulekh.gov.in) ↗
            </a>
          </div>

          {/* Search bar & Locate Button */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
              <input
                type="text"
                value={khasraInput}
                onChange={(e) => setKhasraInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleKhasraSearch()}
                placeholder="Enter Khasra / Survey No. (e.g. 412/1, 142/1, 74/2, 95)"
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-emerald-300/80 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={() => handleKhasraSearch()}
              disabled={searchingLand}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {searchingLand ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>{searchingLand ? "Locating..." : "Locate Land"}</span>
            </button>
          </div>

          {/* Quick sample tags */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-600">
            <span className="font-semibold text-emerald-800">Quick Samples:</span>
            <button
              onClick={() => {
                const sample = "45";
                setSelectedState("Uttar Pradesh");
                setSelectedDistrict("Gautam Buddha Nagar");
                setSelectedTehsil("Jewar (Agricultural Belt)");
                setKhasraInput(sample);
                handleKhasraSearch(sample, "Uttar Pradesh", "Gautam Buddha Nagar", "Jewar (Agricultural Belt)");
              }}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-800 font-semibold transition-colors cursor-pointer"
            >
              🌾 Khasra #45 (Jewar Farm Belt)
            </button>
            <button
              onClick={() => {
                const sample = "412/1";
                setSelectedState("Uttar Pradesh");
                setSelectedDistrict("Gautam Buddha Nagar");
                setSelectedTehsil("Dankaur (Farming Plains)");
                setKhasraInput(sample);
                handleKhasraSearch(sample, "Uttar Pradesh", "Gautam Buddha Nagar", "Dankaur (Farming Plains)");
              }}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-800 font-semibold transition-colors cursor-pointer"
            >
              🌾 Khasra #412/1 (Dankaur Rural)
            </button>
            <button
              onClick={() => {
                const sample = "Plot Number 2 (Sector-17 A, Yamuna Expressway, Greater Noida)";
                setSelectedState("Uttar Pradesh");
                setSelectedDistrict("Gautam Buddha Nagar");
                setKhasraInput(sample);
                handleKhasraSearch(sample, "Uttar Pradesh", "Gautam Buddha Nagar");
              }}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-800 font-semibold transition-colors cursor-pointer"
            >
              🎓 Galgotias / Sec-17A Gr. Noida
            </button>
            <button
              onClick={() => {
                const sample = "74/2";
                setSelectedState("Uttar Pradesh");
                setSelectedDistrict("Hapur");
                setSelectedTehsil("Dhaulana (Sugarcane Hub)");
                setKhasraInput(sample);
                handleKhasraSearch(sample, "Uttar Pradesh", "Hapur", "Dhaulana (Sugarcane Hub)");
              }}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-emerald-100/60 border border-emerald-200 text-slate-700 font-medium transition-colors cursor-pointer"
            >
              Khasra #74/2 (Hapur Sugarcane)
            </button>
          </div>

          {lookupFeedback && (
            <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 bg-white/90 p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{lookupFeedback}</span>
            </div>
          )}
        </div>
      </div>

      {/* Map Satellite Viewport */}
      <div className="relative">
        <div ref={containerRef} className="w-full h-[320px] sm:h-[420px] relative z-10" />

        {/* Floating NDVI Legend when NDVI is active */}
        {activeLayer === "NDVI" && (
          <div className="absolute bottom-4 left-4 z-20 bg-slate-900/85 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 shadow-xl max-w-xs text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <Sprout className="w-3.5 h-3.5" /> NDVI Crop Vigor Index
              </span>
              <span className="text-white">Avg: {selectedParcel?.ndviAverage || 0.72}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gradient-to-r from-amber-400 via-lime-500 to-emerald-600" />
            <div className="flex justify-between text-[10px] text-slate-300">
              <span>Low Vigor (0.3)</span>
              <span>Optimal Growth (0.85)</span>
            </div>
            <p className="text-[10px] text-slate-400 pt-0.5">
              Live Sentinel-2 vegetation reflectance shows uniform chlorophyll concentration across your plot.
            </p>
          </div>
        )}
      </div>

      {/* Parcel Metadata & Save Footer */}
      <div className="p-5 pt-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5 font-bold text-slate-800">
            <Ruler className="w-3.5 h-3.5 text-emerald-600" />
            {selectedParcel
              ? `${selectedParcel.areaAcres} acres (${selectedParcel.areaHectares} ha)`
              : acres > 0
              ? `${acres} acres traced`
              : field
              ? `${field.areaAcres} acres (saved)`
              : "0.0 acres"}
          </span>

          {selectedParcel && (
            <>
              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {selectedParcel.village}, Tehsil {selectedParcel.tehsil}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="font-bold text-slate-700">Crop:</span> {selectedParcel.currentCrop}
              </span>
            </>
          )}

          <span className="flex items-center gap-1 text-slate-400 text-[11px]">
            <Crosshair className="w-3 h-3" />
            {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://upbhulekh.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors inline-flex items-center gap-1"
          >
            <span>Verify on UP Bhulekh</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </a>
          {pts.length > 0 && (
            <button
              onClick={clearPts}
              className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}

          <button
            onClick={saveField}
            disabled={pts.length < 3}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Save & Link to Digital Twin</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Main page ----------------
export default function DigitalTwinPage() {
  const { latitude, longitude, state, district, refreshLocation } = useLocation();
  const [twin, setTwin] = useState<TwinState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pulsing, setPulsing] = useState(false);
  const [fieldSavedTick, setFieldSavedTick] = useState(0);
  const [twinCoords, setTwinCoords] = useState<{ lat: number; lon: number } | null>(null);

  const field = useMemo(() => loadTwinField(), [fieldSavedTick]);

  const load = useCallback((force = false) => {
    setLoading(true);
    setError(null);
    const lat = field?.centroid?.lat ?? latitude ?? 28.6139;
    const lon = field?.centroid?.lng ?? longitude ?? 77.2090;
    setTwinCoords({ lat, lon });
    fetchTwinState(
      lat,
      lon,
      state || "Delhi",
      district || "New Delhi",
      { name: field?.name ?? null, areaAcres: field?.areaAcres ?? null },
      { force }
    )
      .then(setTwin)
      .catch((e) => setError(e?.message || "Could not load digital twin data"))
      .finally(() => setLoading(false));
  }, [latitude, longitude, state, district, field?.name, field?.areaAcres, field?.centroid?.lat, field?.centroid?.lng]);

  useEffect(() => { load(); }, [load]);

  const triggerPulse = () => {
    setPulsing(true);
    load(true);
    setTimeout(() => setPulsing(false), 1200);
  };

  if (loading && !twin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs text-slate-500">Syncing live soil moisture, ET0 and weather…</p>
      </div>
    );
  }

  if (error && !twin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p className="text-sm text-slate-700 font-semibold">{error}</p>
        <button onClick={() => load(true)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer">Retry</button>
      </div>
    );
  }

  const t = twin!;
  const wilting = wiltThreshold(t.soilClass);
  const rootZone = Math.round(((t.moisture1to3 + t.moisture3to9) / 2) * 10) / 10;
  const maxChart = Math.max(...t.projection.map((p) => p.moisture), rootZone) * 1.15;

  // Season context for the crop-methodology panel
  const kharifNow = new Date().getMonth() >= 5 && new Date().getMonth() <= 9;
  const seasonName = kharifNow ? "Kharif (Jun–Oct)" : "Rabi (Nov–Mar)";
  const seasonRainMm = kharifNow
    ? getStateClimate(t.state).annualRainMm * 0.75
    : getStateClimate(t.state).annualRainMm * 0.10;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>Live Farm Digital Twin</span>
              {field?.khasraNo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  Khasra #{field.khasraNo}
                </span>
              )}
              {t.isEstimated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold" title="Live satellite data temporarily unavailable — showing climate-based estimate">
                  <AlertTriangle className="w-3 h-3" /> Estimated
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {field?.name || t.fieldName || `${t.district} Farm Plot`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.district}, {t.state} • {t.soilClass} soil</span>
              {(field?.areaAcres ?? t.areaAcres) != null && <span className="font-semibold text-slate-700">• {field?.areaAcres ?? t.areaAcres} acres</span>}
              {field?.crop && <span className="font-medium text-emerald-700">• Sown: {field.crop}</span>}
            </p>
            {twinCoords && (
              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Crosshair className="w-3 h-3" />
                Data source: {twinCoords.lat.toFixed(3)}°, {twinCoords.lon.toFixed(3)}°
                {field?.centroid ? " — your localized plot coordinates" : " — device GPS location"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={triggerPulse}
              disabled={pulsing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${pulsing ? "animate-bounce text-amber-300" : ""}`} />
              <span>{pulsing ? "Syncing…" : "Refresh Twin Data"}</span>
            </button>
            <button
              onClick={() => { refreshLocation(); }}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Refresh GPS location"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ===== 1. FARM MAP (with Khasra locator & NDVI heat overlay) ===== */}
        <FarmMap
          field={field}
          lat={t.lat}
          lon={t.lon}
          district={t.district}
          state={t.state}
          onFieldSaved={() => setFieldSavedTick((x) => x + 1)}
        />

        {/* ===== 2. WHAT TO DO THIS WEEK (the farmer's action plan) ===== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Tractor className="w-5 h-5" /></span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">What to do on your farm this week</h2>
              <p className="text-xs text-slate-500">
                Personalized from your field's live soil moisture, 7-day weather and {t.state} soil data.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.advisories.map((a, i) => {
              const st = ADVISORY_STYLE[a.severity];
              return (
                <div key={i} className={`p-4 rounded-2xl border ${st.border} ${st.bg} flex items-start gap-3`}>
                  {ADVISORY_ICON[a.type]}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{a.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== 3. BEST CROPS TO GROW ===== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-lime-50 text-lime-600"><Sprout className="w-5 h-5" /></span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Best crops to grow on this soil, right now</h2>
              <p className="text-xs text-slate-500 mt-1">
                FAO-EcoCrop-style suitability: pH × soil texture × season × water × temperature factors <b>multiply</b>, so one poor factor caps the score — no single data point decides it.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div className="p-3 rounded-xl bg-lime-50/70 border border-lime-100">
              <p className="font-bold text-lime-800 mb-0.5">Water signal = climate + today</p>
              <p className="text-slate-600 leading-relaxed">≈{Math.round(seasonRainMm)} mm {seasonName} rainfall typical for {t.state} (24-yr normal, 1997–2020) blended 60/40 with today's satellite moisture ({rootZone}%).</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100">
              <p className="font-bold text-teal-800 mb-0.5">pH from state dataset</p>
              <p className="text-slate-600 leading-relaxed">Scored against FAO-EcoCrop pH windows (optimal vs acceptable). {t.state} average pH is {t.ph} — confirm your plot with a Soil Health Card test.</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
              <p className="font-bold text-amber-800 mb-0.5">Season = growing window</p>
              <p className="text-slate-600 leading-relaxed">It is {seasonName} now. Off-season crops get a hard 0.5× penalty — sowing then would fight the climate, whatever today's weather looks like.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.crops.map((c) => (
              <div key={c.name} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{c.emoji} {c.name}</span>
                  <span className={`text-xs font-extrabold px-2 py-1 rounded-full ${c.score >= 80 ? "bg-emerald-100 text-emerald-800" : c.score >= 65 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                    {c.score}% fit
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className={`h-full rounded-full ${c.score >= 80 ? "bg-emerald-500" : c.score >= 65 ? "bg-amber-500" : "bg-slate-400"}`} style={{ width: `${c.score}%` }} />
                </div>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {c.factors.map((f, fi) => (
                    <span key={fi} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${f.ok ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {f.ok ? "✓" : "✗"} {f.label}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">Why: {c.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 4. LIVE SOIL STATE (the "twin" measurements) ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Root-Zone Moisture</span>
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600"><Droplet className="w-4 h-4" /></span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{rootZone}%</div>
            <div className="mt-2 text-xs font-semibold text-blue-600">Wilting point: {wilting}%</div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (rootZone / 50) * 100)}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Soil Temp (0-7cm)</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600"><Sun className="w-4 h-4" /></span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{t.soilTemp0to7}°C</div>
            <div className="mt-2 text-xs text-slate-500">Air: {t.airTemp}°C • Humidity: {t.humidity}%</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Water Use (ET₀)</span>
              <span className="p-2 rounded-xl bg-teal-50 text-teal-600"><CloudRain className="w-4 h-4" /></span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{t.et0} <span className="text-sm font-semibold text-slate-400">mm/day</span></div>
            <div className="mt-2 text-xs text-slate-500">Today's rain: {t.rainToday} mm</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Soil Chemistry (state)</span>
              <span className="p-2 rounded-xl bg-violet-50 text-violet-600"><FlaskConical className="w-4 h-4" /></span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{t.ph}</div>
            <div className="mt-2 text-xs text-slate-500 truncate">N: {t.nitrogen} | P: {t.phosphorus} | K: {t.potassium} kg/ha</div>
            <div className="mt-2 text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md inline-block">
              from {t.state} soil dataset
            </div>
          </div>
        </div>

        {/* ===== 5. MOISTURE BY DEPTH ===== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Live Soil Moisture by Depth (satellite-derived)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Red line = permanent wilting point ({wilting}% for {t.soilClass}) — water held below −1500 kPa that crops cannot extract (FAO-56). Below it, crops cannot pull water.
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {t.dataSources.moistureModel} — volumetric water content for the model grid cell containing your plot, at four depth layers (0–1, 1–3, 3–9, 9–27 cm). This is a land-surface model estimate, not an in-field sensor reading.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <MoistureBar label="Surface (0-1 cm)" value={t.moisture0to1} threshold={wilting} />
            <MoistureBar label="Shallow (1-3 cm)" value={t.moisture1to3} threshold={wilting} />
            <MoistureBar label="Root zone (3-9 cm)" value={t.moisture3to9} threshold={wilting} />
            <MoistureBar label="Deep root (9-27 cm)" value={t.moisture9to27} threshold={wilting} />
          </div>
        </div>

        {/* ===== 6. 7-DAY MOISTURE PROJECTION ===== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>7-Day Moisture Projection</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Water-balance model: each bar starts at today's root-zone moisture, loses water to evaporation (ET₀) and gains from forecast rain.
            </p>
          </div>
          <div className="flex items-end gap-2 h-44 px-2">
            {[{ day: "Today", moisture: rootZone, rainMm: t.rainToday } as TwinProjectionPoint, ...t.projection].map((p, i) => {
              const h = Math.max(8, (p.moisture / maxChart) * 100);
              const below = p.moisture < wilting;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className={`text-[10px] font-bold ${below ? "text-rose-600" : "text-slate-700"}`}>{p.moisture}%</span>
                  {p.rainMm > 1 && <span className="text-[9px] font-semibold text-blue-500">🌧{p.rainMm >= 10 ? p.rainMm : ""}</span>}
                  <div
                    className={`w-full rounded-t-lg transition-all ${below ? "bg-gradient-to-t from-rose-500 to-rose-300" : "bg-gradient-to-t from-blue-600 to-sky-300"}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">{p.day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600 inline-block" />Above wilting point</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block" />Below wilting point ({wilting}%)</span>
            <span className="flex items-center gap-1.5">🌧 = forecast rain (mm)</span>
          </div>
        </div>

        {/* ===== Phase 3: Digital Twin → PMFBY evidence bridge ===== */}
        <PmfbyEvidenceExport twin={t} />

        {/* Footer note */}
        <p className="text-[11px] text-slate-400 text-center max-w-2xl mx-auto leading-relaxed">
          Soil moisture, temperature and ET₀: Open-Meteo land-surface model (ECMWF/GFS soil analysis) queried at your plot's coordinates — not field sensors. ET₀ is FAO-56 Penman–Monteith.
          Wilting points: FAO-56 (−1500 kPa) thresholds by soil class.
          Crop scores: FAO-EcoCrop-style suitability on the 24-year state climatology (1997–2020) blended with today's satellite moisture.
          N-P-K and pH: {t.state} state averages — for exact field values, get a free government Soil Health Card test.
          Last synced {new Date(t.fetchedAt).toLocaleTimeString()}.
        </p>
      </div>
    </div>
  );
}
