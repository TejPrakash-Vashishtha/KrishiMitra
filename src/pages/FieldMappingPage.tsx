import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import L from "leaflet";

import { MapToolbar } from "../components/field-mapping/MapToolbar";
import { MapCanvas } from "../components/field-mapping/MapCanvas";
import { MetricsPanel } from "../components/field-mapping/MetricsPanel";
import { Coordinate, toGeoJSONCoords, toLeafletCoords, validatePolygon, calculateMetrics, FieldMetrics } from "../lib/geometryUtils";
import { useLanguage } from "../contexts/LanguageContext";

export default function FieldMappingPage() {
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const { t } = useLanguage();

  const [points, setPoints] = useState<Coordinate[]>([]);
  const [baseMap, setBaseMap] = useState<"SATELLITE" | "STREET">("SATELLITE");
  const [metrics, setMetrics] = useState<FieldMetrics>({ acres: 0, hectares: 0, perimeterMeters: 0, centroid: null, accuracyPct: "0", areaSqm: 0 });
  const [satelliteData, setSatelliteData] = useState<any>(null);
  const [isFetchingSatellite, setIsFetchingSatellite] = useState(false);
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [fieldName, setFieldName] = useState("");
  const [crop, setCrop] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [khasraNo, setKhasraNo] = useState("");
  const [village, setVillage] = useState("");

  const [savedFields, setSavedFields] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [gpsConsent, setGpsConsent] = useState(false);

  const [isWalking, setIsWalking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const accuracySamples = useRef<number[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const fetchFields = async () => {
    try {
      const token = localStorage.getItem("km_auth_token");
      if (!token) return;
      const res = await fetch("/api/fields", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSavedFields(data.fields);
    } catch (e) {
      console.error("Failed to fetch fields", e);
    }
  };

  useEffect(() => { fetchFields(); }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && points.length > 0) {
        e.preventDefault();
        e.returnValue = "You have unsaved field changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, points]);

  const validateAndSetPoints = (newPoints: Coordinate[]) => {
    setHasUnsavedChanges(true);
    const err = validatePolygon(newPoints);
    setValidationError(err);
    setPoints(newPoints);
  };

  useEffect(() => {
    setMetrics(calculateMetrics(points, accuracySamples.current));
  }, [points]);

  const requestGpsConsent = () => {
     if (gpsConsent) return true;
     const ok = window.confirm("We need your location to trace your field boundaries accurately. Your location is strictly used for this map and saved only when you click 'Sync Plot'. Do you consent?");
     if (ok) setGpsConsent(true);
     return ok;
  };

  const locateMe = () => {
    if (!requestGpsConsent() || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => mapInstanceRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 18),
      () => alert("Could not read GPS. Ensure location permissions are granted."),
      { enableHighAccuracy: true }
    );
  };
  
  const addPointHere = () => {
    if (!requestGpsConsent() || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
       if (pos.coords.accuracy > 20) alert(`Warning: Accuracy is poor (${Math.round(pos.coords.accuracy)}m).`);
       accuracySamples.current.push(pos.coords.accuracy);
       const newPts = [...points, { lat: pos.coords.latitude, lng: pos.coords.longitude }];
       validateAndSetPoints(newPts);
       syncStateToMap(newPts);
       mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude]);
    }, () => alert("GPS read failed."), { enableHighAccuracy: true });
  };
  
  const toggleWalkBoundary = () => {
    if (isWalking) {
       if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
       setIsWalking(false);
    } else {
       if (!requestGpsConsent() || !navigator.geolocation) return;
       setIsWalking(true);
       alert("Walk boundary started! Points drop automatically when you move (accuracy < 15m).");
       watchIdRef.current = navigator.geolocation.watchPosition(pos => {
          if (pos.coords.accuracy <= 15) {
             accuracySamples.current.push(pos.coords.accuracy);
             setPoints(prev => {
                const newPts = [...prev, { lat: pos.coords.latitude, lng: pos.coords.longitude }];
                syncStateToMap(newPts);
                return newPts;
             });
          }
       }, () => { alert("GPS error."); setIsWalking(false); }, { enableHighAccuracy: true });
    }
  };

  const syncStateToMap = (pts: Coordinate[]) => {
     if (!mapInstanceRef.current) return;
     if (polygonLayerRef.current) mapInstanceRef.current.removeLayer(polygonLayerRef.current);
     if (pts.length >= 3) {
        const poly = L.polygon(pts, { color: "#10b981", fillColor: "#10b981", fillOpacity: 0.35, weight: 3 }).addTo(mapInstanceRef.current);
        polygonLayerRef.current = poly;
        poly.on('pm:edit', (e2) => validateAndSetPoints(((e2.layer as L.Polygon).getLatLngs()[0] as L.LatLng[]).map(ll => ({lat: ll.lat, lng: ll.lng}))));
     }
  };

  const clearPoints = () => {
    if (!window.confirm("Clear the current drawing?")) return;
    setPoints([]);
    setHasUnsavedChanges(false);
    setValidationError(null);
    accuracySamples.current = [];
    if (polygonLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(polygonLayerRef.current);
        polygonLayerRef.current = null;
    }
  };

  const deleteFieldData = async (id: string) => {
     if (!window.confirm("Are you sure you want to delete this field permanently?")) return;
     try {
       await fetch(`/api/fields/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("km_auth_token")}` } });
       fetchFields();
     } catch (e) { alert("Failed to delete."); }
  };

  const loadField = async (field: any) => {
     if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Discard them?")) return;
     try {
       const coords = JSON.parse(field.geoJson);
       const leafCoords = toLeafletCoords(coords);
       setPoints(leafCoords);
       setFieldName(field.name);
       setCrop(field.crop || "");
       setSowingDate(field.sowingDate || "");
       setKhasraNo(field.khasraNo || "");
       setVillage(field.village || "");
       syncStateToMap(leafCoords);
       mapInstanceRef.current?.fitBounds(L.polygon(leafCoords).getBounds());
       setHasUnsavedChanges(false);
       
       // Phase 4: Fetch real Sentinel-2 satellite data
       setIsFetchingSatellite(true);
       setSatelliteData(null);
       const token = localStorage.getItem("km_auth_token");
       const res = await fetch(`/api/gis/satellite-data/${field.id}`, {
          headers: { Authorization: `Bearer ${token}` }
       });
       const satResult = await res.json();
       if (satResult.success) setSatelliteData(satResult.data);
       setIsFetchingSatellite(false);
       
     } catch(e) { console.error(e); setIsFetchingSatellite(false); }
  };

  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchQuery.length < 3) { setSearchResults([]); return; }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in`);
        setSearchResults((await res.json()).slice(0, 4));
      } catch(e) { } 
    }, 600);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const savePlotToDB = async () => {
    if (points.length < 3 || validationError) return;
    setIsSyncing(true);
    
    const payload = {
      name: fieldName || "My Farm Plot",
      geoJson: JSON.stringify(toGeoJSONCoords(points)),
      areaSqm: metrics.areaSqm,
      crop, sowingDate, khasraNo, village
    };

    try {
      const token = localStorage.getItem("km_auth_token");
      const res = await fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "API failed");
      }
      
      setSavedSuccess(true);
      setHasUnsavedChanges(false);
      fetchFields();
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (e: any) {
      if (e.message !== "API failed" && e.message !== "Failed to fetch") {
         alert("Server rejected the save: " + e.message);
      } else {
         const queue = JSON.parse(localStorage.getItem("offline_fields_queue") || "[]");
         queue.push(payload);
         localStorage.setItem("offline_fields_queue", JSON.stringify(queue));
         alert("No internet connection! Field saved locally. It will sync when you are back online.");
      }
      setHasUnsavedChanges(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSearchResultClick = (res: any) => {
    mapInstanceRef.current?.flyTo([res.lat, res.lon], 16);
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-8 px-2 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">Interactive Farm Plot GIS Mapping</h1>
            <p className="text-xs text-slate-500 mt-1">{t("trace_by_hand") || "Trace by hand, search for a village, or walk the boundary securely."}</p>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl">
             <button onClick={() => setBaseMap("STREET")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${baseMap === "STREET" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>Street</button>
             <button onClick={() => setBaseMap("SATELLITE")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${baseMap === "SATELLITE" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>Satellite</button>
          </div>
        </div>

        {validationError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" /> {validationError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-3 sm:p-4 shadow-sm flex flex-col space-y-3">
            <MapToolbar 
              searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchResults={searchResults} onSearchResultClick={handleSearchResultClick}
              locateMe={locateMe} addPointHere={addPointHere} toggleWalkBoundary={toggleWalkBoundary} isWalking={isWalking}
            />

            <MapCanvas 
              baseMap={baseMap} points={points} setPoints={setPoints} validateAndSetPoints={validateAndSetPoints} 
              mapInstanceRef={mapInstanceRef} polygonLayerRef={polygonLayerRef}
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 flex-wrap">
              <span>Points: {points.length} (Min 3)</span>
              <span>Centroid: {metrics.centroid ? `${metrics.centroid.lat}° N, ${metrics.centroid.lng}° E` : "Not mapped"}</span>
              <button onClick={clearPoints} className="text-rose-600 font-bold hover:underline">Clear Map</button>
            </div>
          </div>

          <MetricsPanel 
             pointsLength={points.length} validationError={validationError} metrics={metrics} isSyncing={isSyncing} savedSuccess={savedSuccess}
             fieldName={fieldName} setFieldName={setFieldName} village={village} setVillage={setVillage} khasraNo={khasraNo} setKhasraNo={setKhasraNo} crop={crop} setCrop={setCrop}
             savePlotToDB={savePlotToDB} savedFields={savedFields} loadField={loadField} deleteFieldData={deleteFieldData}
             satelliteData={satelliteData} isFetchingSatellite={isFetchingSatellite}
          />
        </div>
      </div>
    </div>
  );
}
