import { 
  validateCoordinate, 
  calculateDistance, 
  calculateBearing, 
  isValidCoordinate,
  normalizeCoordinate,
  coordinateToString
} from '../../utils/coordinate';

describe('Coordinate Accuracy Tests', () => {
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
  });
}); 