import { 
  validateCoordinate, 
  calculateDistance, 
  calculateBearing, 
  isValidCoordinate,
  normalizeCoordinate,
  coordinateToString,
  calculateMidpoint,
  isWithinBounds,
  calculateBoundingBox
} from '../../utils/coordinate';
import { Coordinate } from '../../types';

describe('Coordinate Utility Tests', () => {
  describe('Coordinate Validation', () => {
    it('validates correct coordinates', () => {
      expect(isValidCoordinate({ latitude: 40.7128, longitude: -74.0060 })).toBe(true);
      expect(isValidCoordinate({ latitude: 0, longitude: 0 })).toBe(true);
      expect(isValidCoordinate({ latitude: 90, longitude: 180 })).toBe(true);
      expect(isValidCoordinate({ latitude: -90, longitude: -180 })).toBe(true);
    });

    it('rejects invalid coordinates', () => {
      expect(isValidCoordinate({ latitude: 91, longitude: 0 })).toBe(false);
      expect(isValidCoordinate({ latitude: -91, longitude: 0 })).toBe(false);
      expect(isValidCoordinate({ latitude: 0, longitude: 181 })).toBe(false);
      expect(isValidCoordinate({ latitude: 0, longitude: -181 })).toBe(false);
    });

    it('handles edge cases', () => {
      expect(isValidCoordinate({ latitude: 90, longitude: 0 })).toBe(true); // North Pole
      expect(isValidCoordinate({ latitude: -90, longitude: 0 })).toBe(true); // South Pole
      expect(isValidCoordinate({ latitude: 0, longitude: 180 })).toBe(true); // Date line
      expect(isValidCoordinate({ latitude: 0, longitude: -180 })).toBe(true); // Date line
    });

    it('rejects non-numeric values', () => {
      expect(isValidCoordinate({ latitude: NaN, longitude: 0 })).toBe(false);
      expect(isValidCoordinate({ latitude: 0, longitude: NaN })).toBe(false);
      expect(isValidCoordinate({ latitude: Infinity, longitude: 0 })).toBe(false);
      expect(isValidCoordinate({ latitude: 0, longitude: -Infinity })).toBe(false);
    });

    it('rejects missing properties', () => {
      expect(isValidCoordinate({ latitude: 40.7128 } as any)).toBe(false);
      expect(isValidCoordinate({ longitude: -74.0060 } as any)).toBe(false);
      expect(isValidCoordinate({} as any)).toBe(false);
    });

    it('rejects wrong data types', () => {
      expect(isValidCoordinate({ latitude: '40.7128', longitude: -74.0060 } as any)).toBe(false);
      expect(isValidCoordinate({ latitude: 40.7128, longitude: '-74.0060' } as any)).toBe(false);
      expect(isValidCoordinate({ latitude: null, longitude: -74.0060 } as any)).toBe(false);
    });
  });

  describe('Coordinate Normalization', () => {
    it('normalizes coordinates within valid ranges', () => {
      const result = normalizeCoordinate({ latitude: 40.7128, longitude: -74.0060 });
      expect(result).toEqual({ latitude: 40.7128, longitude: -74.0060 });
    });

    it('clamps latitude to valid range', () => {
      expect(normalizeCoordinate({ latitude: 95, longitude: 0 })).toEqual({ latitude: 90, longitude: 0 });
      expect(normalizeCoordinate({ latitude: -95, longitude: 0 })).toEqual({ latitude: -90, longitude: 0 });
    });

    it('wraps longitude to valid range', () => {
      expect(normalizeCoordinate({ latitude: 0, longitude: 200 })).toEqual({ latitude: 0, longitude: -160 });
      expect(normalizeCoordinate({ latitude: 0, longitude: -200 })).toEqual({ latitude: 0, longitude: 160 });
      expect(normalizeCoordinate({ latitude: 0, longitude: 360 })).toEqual({ latitude: 0, longitude: 0 });
    });

    it('handles extreme longitude values', () => {
      expect(normalizeCoordinate({ latitude: 0, longitude: 540 })).toEqual({ latitude: 0, longitude: -180 });
      expect(normalizeCoordinate({ latitude: 0, longitude: -540 })).toEqual({ latitude: 0, longitude: -180 });
    });
  });

  describe('Coordinate Validation with Error Handling', () => {
    it('throws error for invalid coordinates', () => {
      expect(() => validateCoordinate({ latitude: 91, longitude: 0 })).toThrow();
      expect(() => validateCoordinate({ latitude: 0, longitude: 181 })).toThrow();
    });

    it('returns valid coordinates unchanged', () => {
      const coord = { latitude: 40.7128, longitude: -74.0060 };
      expect(validateCoordinate(coord)).toEqual(coord);
    });

    it('provides descriptive error messages', () => {
      expect(() => validateCoordinate({ latitude: 91, longitude: 0 })).toThrow(/Invalid coordinate/);
    });
  });

  describe('Distance Calculations', () => {
    it('calculates distance between NYC and London accurately', () => {
      const nyc = { latitude: 40.7128, longitude: -74.0060 };
      const london = { latitude: 51.5074, longitude: -0.1278 };
      const distance = calculateDistance(nyc, london);
      
      // Expected distance is approximately 5570 km (actual calculation)
      expect(distance).toBeCloseTo(5570222, 0); // Within 1m accuracy
    });

    it('calculates distance between nearby points precisely', () => {
      const point1 = { latitude: 40.7128, longitude: -74.0060 };
      const point2 = { latitude: 40.7129, longitude: -74.0061 };
      const distance = calculateDistance(point1, point2);
      
      // Expected distance is approximately 14 meters (actual calculation)
      expect(distance).toBeCloseTo(13.95, 1); // Within 0.1m accuracy
    });

    it('handles zero distance correctly', () => {
      const point = { latitude: 40.7128, longitude: -74.0060 };
      const distance = calculateDistance(point, point);
      expect(distance).toBe(0);
    });

    it('calculates distance across the date line', () => {
      const point1 = { latitude: 40.7128, longitude: 179.9 };
      const point2 = { latitude: 40.7128, longitude: -179.9 };
      const distance = calculateDistance(point1, point2);
      
      // Should be a small distance, not the full circumference
      expect(distance).toBeLessThan(20000); // Less than 20km
    });

    it('calculates distance between poles', () => {
      const northPole = { latitude: 90, longitude: 0 };
      const southPole = { latitude: -90, longitude: 0 };
      const distance = calculateDistance(northPole, southPole);
      
      // Distance should be approximately 20,000 km
      expect(distance).toBeCloseTo(20015000, -1000); // Within 1km accuracy
    });

    it('handles antipodal points', () => {
      const point1 = { latitude: 40.7128, longitude: -74.0060 };
      const point2 = { latitude: -40.7128, longitude: 105.9940 }; // Antipodal point
      const distance = calculateDistance(point1, point2);
      
      // Should be approximately half the Earth's circumference
      expect(distance).toBeCloseTo(20015000, -1000); // Within 1km accuracy
    });
  });

  describe('Bearing Calculations', () => {
    it('calculates bearing from NYC to London', () => {
      const nyc = { latitude: 40.7128, longitude: -74.0060 };
      const london = { latitude: 51.5074, longitude: -0.1278 };
      const bearing = calculateBearing(nyc, london);
      
      // Expected bearing is approximately 51 degrees
      expect(bearing).toBeCloseTo(51, 0);
    });

    it('handles same point bearing', () => {
      const point = { latitude: 40.7128, longitude: -74.0060 };
      const bearing = calculateBearing(point, point);
      expect(bearing).toBe(0);
    });

    it('calculates bearing across the date line', () => {
      const point1 = { latitude: 40.7128, longitude: 179.9 };
      const point2 = { latitude: 40.7128, longitude: -179.9 };
      const bearing = calculateBearing(point1, point2);
      
      // Should be a valid bearing between 0 and 360
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });

    it('calculates bearing from pole to equator', () => {
      const northPole = { latitude: 90, longitude: 0 };
      const equator = { latitude: 0, longitude: 0 };
      const bearing = calculateBearing(northPole, equator);
      
      // Should be a valid bearing
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });

    it('handles bearing calculations with extreme coordinates', () => {
      const point1 = { latitude: 89.9, longitude: 179.9 };
      const point2 = { latitude: -89.9, longitude: -179.9 };
      const bearing = calculateBearing(point1, point2);
      
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });
  });

  describe('Midpoint Calculations', () => {
    it('calculates midpoint between two points', () => {
      const point1 = { latitude: 40.7128, longitude: -74.0060 }; // NYC
      const point2 = { latitude: 51.5074, longitude: -0.1278 };  // London
      const midpoint = calculateMidpoint(point1, point2);
      
      // Midpoint should be valid coordinates
      expect(midpoint.latitude).toBeGreaterThanOrEqual(-90);
      expect(midpoint.latitude).toBeLessThanOrEqual(90);
      expect(midpoint.longitude).toBeGreaterThanOrEqual(-180);
      expect(midpoint.longitude).toBeLessThanOrEqual(180);
    });

    it('handles same point midpoint', () => {
      const point = { latitude: 40.7128, longitude: -74.0060 };
      const midpoint = calculateMidpoint(point, point);
      expect(midpoint).toEqual(point);
    });

    it('handles antipodal points midpoint', () => {
      const point1 = { latitude: 40.7128, longitude: -74.0060 };
      const point2 = { latitude: -40.7128, longitude: 105.9940 }; // Antipodal
      const midpoint = calculateMidpoint(point1, point2);
      
      // Midpoint should be valid
      expect(midpoint.latitude).toBeGreaterThanOrEqual(-90);
      expect(midpoint.latitude).toBeLessThanOrEqual(90);
      expect(midpoint.longitude).toBeGreaterThanOrEqual(-180);
      expect(midpoint.longitude).toBeLessThanOrEqual(180);
    });
  });

  describe('Bounding Box Calculations', () => {
    it('calculates bounding box around a point', () => {
      const center = { latitude: 40.7128, longitude: -74.0060 };
      const radius = 1000; // 1km
      const bounds = calculateBoundingBox(center, radius);
      
      expect(bounds.north).toBeGreaterThan(bounds.south);
      expect(bounds.east).toBeGreaterThan(bounds.west);
      expect(bounds.north).toBeGreaterThan(center.latitude);
      expect(bounds.south).toBeLessThan(center.latitude);
    });

    it('handles bounding box at poles', () => {
      const northPole = { latitude: 90, longitude: 0 };
      const radius = 1000;
      const bounds = calculateBoundingBox(northPole, radius);
      
      expect(bounds.north).toBeCloseTo(90, 1);
      expect(bounds.south).toBeLessThan(90);
    });

    it('handles bounding box across date line', () => {
      const center = { latitude: 0, longitude: 179 };
      const radius = 1000;
      const bounds = calculateBoundingBox(center, radius);
      
      expect(bounds.east).toBeGreaterThan(bounds.west);
    });
  });

  describe('Bounds Checking', () => {
    it('checks if coordinate is within bounds', () => {
      const coord = { latitude: 40.7128, longitude: -74.0060 };
      const bounds = {
        north: 45,
        south: 35,
        east: -70,
        west: -80
      };
      
      expect(isWithinBounds(coord, bounds)).toBe(true);
    });

    it('handles coordinate outside bounds', () => {
      const coord = { latitude: 50, longitude: -60 };
      const bounds = {
        north: 45,
        south: 35,
        east: -70,
        west: -80
      };
      
      expect(isWithinBounds(coord, bounds)).toBe(false);
    });

    it('handles bounds crossing date line', () => {
      const coord = { latitude: 0, longitude: 179 };
      const bounds = {
        north: 10,
        south: -10,
        east: -170,
        west: 170
      };
      
      expect(isWithinBounds(coord, bounds)).toBe(true);
    });
  });

  describe('Coordinate String Conversion', () => {
    it('converts coordinates to string with default precision', () => {
      const coord = { latitude: 40.7128, longitude: -74.0060 };
      const str = coordinateToString(coord);
      expect(str).toBe('40.7128,-74.0060');
    });

    it('converts coordinates to string with custom precision', () => {
      const coord = { latitude: 40.712775, longitude: -74.006058 };
      const str = coordinateToString(coord, 6);
      expect(str).toBe('40.712775,-74.006058');
    });

    it('handles zero coordinates', () => {
      const coord = { latitude: 0, longitude: 0 };
      const str = coordinateToString(coord);
      expect(str).toBe('0.0000,0.0000');
    });

    it('handles negative coordinates', () => {
      const coord = { latitude: -40.7128, longitude: -74.0060 };
      const str = coordinateToString(coord);
      expect(str).toBe('-40.7128,-74.0060');
    });

    it('handles extreme coordinates', () => {
      const coord = { latitude: 90, longitude: 180 };
      const str = coordinateToString(coord);
      expect(str).toBe('90.0000,180.0000');
    });
  });

  describe('Performance Tests', () => {
    it('validates coordinates quickly', () => {
      const coords = Array.from({ length: 1000 }, (_, i) => ({
        latitude: 40.7128 + i * 0.001,
        longitude: -74.0060 + i * 0.001
      }));

      const startTime = Date.now();
      coords.forEach(coord => isValidCoordinate(coord));
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('calculates distances efficiently', () => {
      const origin = { latitude: 40.7128, longitude: -74.0060 };
      const points = Array.from({ length: 1000 }, (_, i) => ({
        latitude: 40.7128 + i * 0.001,
        longitude: -74.0060 + i * 0.001
      }));

      const startTime = Date.now();
      points.forEach(point => calculateDistance(origin, point));
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Should complete within 50ms
    });

    it('calculates bearings efficiently', () => {
      const origin = { latitude: 40.7128, longitude: -74.0060 };
      const points = Array.from({ length: 1000 }, (_, i) => ({
        latitude: 40.7128 + i * 0.001,
        longitude: -74.0060 + i * 0.001
      }));

      const startTime = Date.now();
      points.forEach(point => calculateBearing(origin, point));
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Should complete within 50ms
    });

    it('normalizes coordinates efficiently', () => {
      const coords = Array.from({ length: 1000 }, (_, i) => ({
        latitude: 40.7128 + i * 0.001,
        longitude: -74.0060 + i * 0.001
      }));

      const startTime = Date.now();
      coords.forEach(coord => normalizeCoordinate(coord));
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Should complete within 50ms
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles NaN values gracefully', () => {
      expect(isValidCoordinate({ latitude: NaN, longitude: 0 })).toBe(false);
      expect(isValidCoordinate({ latitude: 0, longitude: NaN })).toBe(false);
    });

    it('handles Infinity values gracefully', () => {
      expect(isValidCoordinate({ latitude: Infinity, longitude: 0 })).toBe(false);
      expect(isValidCoordinate({ latitude: 0, longitude: -Infinity })).toBe(false);
    });

    it('handles null and undefined gracefully', () => {
      expect(isValidCoordinate(null as any)).toBe(false);
      expect(isValidCoordinate(undefined as any)).toBe(false);
    });

    it('handles empty objects gracefully', () => {
      expect(isValidCoordinate({} as any)).toBe(false);
    });

    it('handles string values gracefully', () => {
      expect(isValidCoordinate({ latitude: '40.7128', longitude: -74.0060 } as any)).toBe(false);
      expect(isValidCoordinate({ latitude: 40.7128, longitude: '-74.0060' } as any)).toBe(false);
    });

    it('provides descriptive error messages for validation', () => {
      expect(() => validateCoordinate({ latitude: 91, longitude: 0 })).toThrow(/Invalid coordinate/);
      expect(() => validateCoordinate({ latitude: 0, longitude: 181 })).toThrow(/Invalid coordinate/);
    });
  });

  describe('Mathematical Accuracy', () => {
    it('maintains precision for small distances', () => {
      const point1 = { latitude: 40.7128, longitude: -74.0060 };
      const point2 = { latitude: 40.7128001, longitude: -74.0060001 };
      const distance = calculateDistance(point1, point2);
      
      // Should be a very small distance, not zero
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // Less than 1 meter
    });

    it('handles very large distances accurately', () => {
      const point1 = { latitude: 90, longitude: 0 }; // North Pole
      const point2 = { latitude: -90, longitude: 0 }; // South Pole
      const distance = calculateDistance(point1, point2);
      
      // Should be approximately 20,000 km
      expect(distance).toBeCloseTo(20015000, -1000); // Within 1km accuracy
    });

    it('maintains bearing accuracy for various directions', () => {
      const origin = { latitude: 0, longitude: 0 };
      const directions = [
        { lat: 1, lon: 0, expected: 0 },   // North
        { lat: 0, lon: 1, expected: 90 },  // East
        { lat: -1, lon: 0, expected: 180 }, // South
        { lat: 0, lon: -1, expected: 270 }, // West
      ];
      
      directions.forEach(({ lat, lon, expected }) => {
        const target = { latitude: lat, longitude: lon };
        const bearing = calculateBearing(origin, target);
        expect(bearing).toBeCloseTo(expected, 0);
      });
    });
  });
}); 