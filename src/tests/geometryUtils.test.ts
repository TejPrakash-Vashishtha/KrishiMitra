import { describe, it, expect } from 'vitest';
import { 
  toGeoJSONCoords, 
  toLeafletCoords, 
  getLocalLandUnit, 
  validatePolygon, 
  calculateMetrics 
} from '../lib/geometryUtils';

describe('Geometry Utils', () => {
  it('correctly converts Leaflet coordinates {lat, lng} to GeoJSON [lng, lat]', () => {
    const leafletCoords = [{ lat: 21.0, lng: 79.0 }, { lat: 22.0, lng: 80.0 }];
    const geoJsonCoords = toGeoJSONCoords(leafletCoords);
    expect(geoJsonCoords).toEqual([[79.0, 21.0], [80.0, 22.0]]);
  });

  it('correctly converts GeoJSON [lng, lat] to Leaflet coordinates {lat, lng}', () => {
    const geoJsonCoords = [[79.0, 21.0], [80.0, 22.0]];
    const leafletCoords = toLeafletCoords(geoJsonCoords);
    expect(leafletCoords).toEqual([{ lat: 21.0, lng: 79.0 }, { lat: 22.0, lng: 80.0 }]);
  });

  it('calculates local land units based on state name', () => {
    expect(getLocalLandUnit(1.0, 'Maharashtra')).toBe('40.0 Gunthas');
    expect(getLocalLandUnit(1.0, 'Rajasthan')).toBe('2.5 Bighas');
    expect(getLocalLandUnit(1.0, 'Uttar Pradesh')).toBe('1.6 Bighas');
    expect(getLocalLandUnit(1.0, 'Kerala')).toBe('100.0 Cents');
    expect(getLocalLandUnit(1.0, 'Unknown')).toBe('1.00 Acres (Local Standard)');
  });

  it('validates a correct polygon (square)', () => {
    // 1 degree is roughly 111km, so this is a huge area (>1000 acres), it should fail the size check
    const hugeSquare = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 1, lng: 1 },
      { lat: 1, lng: 0 }
    ];
    expect(validatePolygon(hugeSquare)).toBe('Plot is too large (> 1000 acres).');
  });
  
  it('validates self-intersecting polygon (bowtie)', () => {
    const bowtie = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 0, lng: 1 },
      { lat: 1, lng: 0 }
    ];
    expect(validatePolygon(bowtie)).toBe('Invalid shape: Self-intersection detected.');
  });
});
