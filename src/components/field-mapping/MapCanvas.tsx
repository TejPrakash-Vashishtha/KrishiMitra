import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";
import { GestureHandling } from "leaflet-gesture-handling";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "leaflet.offline";

import { Coordinate } from "../../lib/geometryUtils";
import { useLocation } from "../../contexts/LocationContext";

L.Map.addInitHook("addHandler", "gestureHandling", GestureHandling);

interface MapCanvasProps {
  baseMap: "SATELLITE" | "STREET";
  points: Coordinate[];
  setPoints: (points: Coordinate[]) => void;
  validateAndSetPoints: (points: Coordinate[]) => void;
  mapInstanceRef: React.MutableRefObject<L.Map | null>;
  polygonLayerRef: React.MutableRefObject<L.Polygon | null>;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  baseMap, points, setPoints, validateAndSetPoints, mapInstanceRef, polygonLayerRef
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const { latitude, longitude } = useLocation();
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    
    const startLat = latitude || 21.1458; 
    const startLng = longitude || 79.0882;
    const map = L.map(mapContainerRef.current, { gestureHandling: true } as L.MapOptions).setView([startLat, startLng], 16);

    // Phase 5: Mapbox is preferred, but we gracefully fallback to free OSM/Esri if no token is provided
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    
    // We use L.tileLayer.offline for Phase 5: Offline Caching
    const streetUrl = MAPBOX_TOKEN 
        ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
        
    const satelliteUrl = MAPBOX_TOKEN
        ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
        : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

    const streetLayer = (L.tileLayer as any).offline(streetUrl, { 
        maxZoom: 19,
        attribution: MAPBOX_TOKEN ? '© Mapbox' : '© OpenStreetMap'
    });

    const satelliteLayer = (L.tileLayer as any).offline(satelliteUrl, { 
        maxZoom: 19,
        attribution: MAPBOX_TOKEN ? '© Mapbox' : 'Tiles © Esri'
    });

    // Phase 5: Add loading and tile-failure states
    satelliteLayer.on('tileerror', () => {
       setMapError("Failed to load map tiles. Please check your internet connection.");
    });
    satelliteLayer.on('load', () => {
       setIsLoading(false);
       setMapError(null);
    });

    satelliteLayer.addTo(map);

    (map as any)._streetLayer = streetLayer;
    (map as any)._satelliteLayer = satelliteLayer;
    mapInstanceRef.current = map;

    map.pm.addControls({ position: 'topleft', drawMarker: false, drawCircleMarker: false, drawPolyline: false, drawRectangle: false, drawCircle: false, drawText: false });
    map.pm.setGlobalOptions({ allowSelfIntersection: false });

    map.on('pm:create', (e) => {
      if (e.shape === 'Polygon') {
         if (polygonLayerRef.current) map.removeLayer(polygonLayerRef.current);
         const layer = e.layer as L.Polygon;
         polygonLayerRef.current = layer;
         validateAndSetPoints((layer.getLatLngs()[0] as L.LatLng[]).map(ll => ({lat: ll.lat, lng: ll.lng})));
         layer.on('pm:edit', (e2) => validateAndSetPoints(((e2.layer as L.Polygon).getLatLngs()[0] as L.LatLng[]).map(ll => ({lat: ll.lat, lng: ll.lng}))));
      }
    });
    
    map.on('pm:remove', () => {
       setPoints([]);
       if (polygonLayerRef.current) polygonLayerRef.current = null;
    });

    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (baseMap === "STREET") {
        if (map.hasLayer((map as any)._satelliteLayer)) map.removeLayer((map as any)._satelliteLayer);
        if (!map.hasLayer((map as any)._streetLayer)) (map as any)._streetLayer.addTo(map);
    } else {
        if (map.hasLayer((map as any)._streetLayer)) map.removeLayer((map as any)._streetLayer);
        if (!map.hasLayer((map as any)._satelliteLayer)) (map as any)._satelliteLayer.addTo(map);
    }
  }, [baseMap]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 z-10" style={{ height: '65dvh', minHeight: '400px' }}>
      {/* Map Error Overlay */}
      {mapError && (
         <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-rose-100 border border-rose-300 text-rose-800 text-xs px-4 py-2 rounded-full shadow-lg font-bold">
            {mapError}
         </div>
      )}
      
      {/* Map Loading Overlay */}
      {isLoading && (
         <div className="absolute inset-0 z-[500] bg-slate-50/50 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-slate-600 mt-2">Loading HD Maps...</span>
         </div>
      )}

      {/* Empty State Overlay */}
      {!isLoading && points.length === 0 && (
         <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur border border-slate-200 text-slate-700 text-xs px-4 py-2 rounded-full shadow-lg pointer-events-none">
            Use the toolbar to start drawing your field.
         </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
