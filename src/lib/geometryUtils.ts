import * as turf from "@turf/turf";

export type Coordinate = { lat: number; lng: number };
export type FieldMetrics = { acres: number; hectares: number; perimeterMeters: number; centroid: Coordinate | null; accuracyPct: string; areaSqm: number; };

export const toGeoJSONCoords = (points: Coordinate[]): number[][] => {
  return points.map(p => [p.lng, p.lat]);
};

export const toLeafletCoords = (geoJsonCoords: number[][]): Coordinate[] => {
  return geoJsonCoords.map(p => ({ lat: p[1], lng: p[0] }));
};

export const getLocalLandUnit = (acres: number, stateName: string): string => {
  const state = (stateName || "").toLowerCase();
  if (state.includes("maharashtra") || state.includes("karnataka") || state.includes("telangana")) {
    return `${(acres * 40).toFixed(1)} Gunthas`;
  }
  if (state.includes("gujarat") || state.includes("rajasthan")) {
    return `${(acres * 2.5).toFixed(1)} Bighas`;
  }
  if (state.includes("uttar pradesh") || state.includes("punjab") || state.includes("haryana")) {
    return `${(acres * 1.6).toFixed(1)} Bighas`;
  }
  if (state.includes("madhya pradesh")) {
    return `${(acres * 3.63).toFixed(1)} Bighas`;
  }
  if (state.includes("kerala") || state.includes("tamil nadu")) {
    return `${(acres * 100).toFixed(1)} Cents`;
  }
  return `${acres.toFixed(2)} Acres (Local Standard)`;
};

export const validatePolygon = (points: Coordinate[]): string | null => {
  if (points.length < 3) return null;
  try {
    const coords = toGeoJSONCoords(points);
    coords.push(coords[0]); // close poly
    const poly = turf.polygon([coords]);
    
    if (turf.kinks(poly).features.length > 0) return "Invalid shape: Self-intersection detected.";
    
    const acres = turf.area(poly) / 4046.86;
    if (acres < 0.01) return "Plot is too small (< 0.01 acres).";
    if (acres > 1000) return "Plot is too large (> 1000 acres).";
    
    return null;
  } catch (e) {
    return "Invalid geometry drawn.";
  }
};

export const calculateMetrics = (points: Coordinate[], accuracySamples: number[]): FieldMetrics => {
  if (points.length < 3) return { acres: 0, hectares: 0, perimeterMeters: 0, centroid: null, accuracyPct: "0", areaSqm: 0 };
  try {
    const coords = toGeoJSONCoords(points);
    coords.push(coords[0]);
    const poly = turf.polygon([coords]);
    const areaSqm = turf.area(poly);
    const centroid = turf.centroid(poly).geometry.coordinates; 
    
    let avgAcc = accuracySamples.length > 0 ? accuracySamples.reduce((a,b)=>a+b,0) / accuracySamples.length : 0;
    const perimeter = turf.length(poly, {units: 'meters'});
    const areaErrPct = avgAcc > 0 && areaSqm > 0 ? Math.min(15, (avgAcc * perimeter / areaSqm) * 100) : 0;
    
    return {
      acres: Math.round((areaSqm / 4046.86) * 100) / 100,
      hectares: Math.round((areaSqm / 10000) * 100) / 100,
      perimeterMeters: Math.round(perimeter),
      centroid: { lat: Number(centroid[1].toFixed(5)), lng: Number(centroid[0].toFixed(5)) },
      accuracyPct: areaErrPct.toFixed(1),
      areaSqm
    };
  } catch(e) {
    return { acres: 0, hectares: 0, perimeterMeters: 0, centroid: null, accuracyPct: "0", areaSqm: 0 };
  }
};
