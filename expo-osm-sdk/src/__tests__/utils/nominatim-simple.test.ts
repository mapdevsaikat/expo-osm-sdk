/**
 * Simplified Nominatim Tests
 * Tests core functionality without timing complications
 */

import {
  calculateDistance,
  formatDistance,
} from '../../utils/nominatim';
import type { Coordinate } from '../../types';

describe('Nominatim Core Functions', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates accurately', () => {
      const coord1: Coordinate = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco
      const coord2: Coordinate = { latitude: 40.7589, longitude: -73.9851 };  // New York

      const distance = calculateDistance(coord1, coord2);
      
      // Distance between SF and NYC is approximately 4,130 km
      expect(distance).toBeCloseTo(4130, -1); // Within 10km tolerance
    });

    it('should return 0 for same coordinates', () => {
      const coord: Coordinate = { latitude: 37.7749, longitude: -122.4194 };
      const distance = calculateDistance(coord, coord);
      
      expect(distance).toBe(0);
    });

    it('should handle coordinates at opposite sides of earth', () => {
      const coord1: Coordinate = { latitude: 0, longitude: 0 };
      const coord2: Coordinate = { latitude: 0, longitude: 180 };

      const distance = calculateDistance(coord1, coord2);
      
      // Half the earth's circumference is approximately 20,015 km
      expect(distance).toBeCloseTo(20015, -2); // Within 100km tolerance
    });

    it('should handle negative coordinates', () => {
      const coord1: Coordinate = { latitude: -33.8688, longitude: 151.2093 }; // Sydney
      const coord2: Coordinate = { latitude: 51.5074, longitude: -0.1278 };   // London

      const distance = calculateDistance(coord1, coord2);
      
      // Distance between Sydney and London is approximately 17,000 km
      expect(distance).toBeCloseTo(17000, -2); // Within 100km tolerance
    });

    it('should handle small distances accurately', () => {
      const coord1: Coordinate = { latitude: 37.7749, longitude: -122.4194 };
      const coord2: Coordinate = { latitude: 37.7750, longitude: -122.4195 }; // Very small distance

      const distance = calculateDistance(coord1, coord2);
      
      // Should be approximately 0.014 km (14 meters)
      expect(distance).toBeCloseTo(0.014, 2);
    });
  });

  describe('formatDistance', () => {
    it('should format distances in meters for values < 1km', () => {
      expect(formatDistance(0.5)).toBe('500m');
      expect(formatDistance(0.123)).toBe('123m');
      expect(formatDistance(0.999)).toBe('999m');
    });

    it('should format distances in km with decimals for values < 100km', () => {
      expect(formatDistance(1.5)).toBe('1.5km');
      expect(formatDistance(10.23)).toBe('10.2km');
      expect(formatDistance(99.9)).toBe('99.9km');
    });

    it('should format distances in rounded km for values >= 100km', () => {
      expect(formatDistance(100.5)).toBe('101km');
      expect(formatDistance(1234.56)).toBe('1235km');
    });

    it('should handle edge cases', () => {
      expect(formatDistance(0)).toBe('0m');
      expect(formatDistance(1)).toBe('1.0km');
      expect(formatDistance(100)).toBe('100km');
    });

    it('should handle very small distances', () => {
      expect(formatDistance(0.001)).toBe('1m');
      expect(formatDistance(0.0005)).toBe('1m'); // Rounds up
    });

    it('should handle very large distances', () => {
      expect(formatDistance(12345)).toBe('12345km');
      expect(formatDistance(99999)).toBe('99999km');
    });
  });

  describe('Coordinate Validation', () => {
    it('should handle extreme coordinate values', () => {
      const northPole: Coordinate = { latitude: 90, longitude: 0 };
      const southPole: Coordinate = { latitude: -90, longitude: 0 };
      
      const distance = calculateDistance(northPole, southPole);
      
      // Distance from north to south pole should be approximately 20,015 km
      expect(distance).toBeCloseTo(20015, -2);
    });

    it('should handle antimeridian crossings', () => {
      const coord1: Coordinate = { latitude: 0, longitude: 179 };
      const coord2: Coordinate = { latitude: 0, longitude: -179 };
      
      const distance = calculateDistance(coord1, coord2);
      
      // Should be approximately 222 km (2 degrees at equator)
      expect(distance).toBeCloseTo(222, 0);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle many distance calculations efficiently', () => {
      const baseCoord: Coordinate = { latitude: 37.7749, longitude: -122.4194 };
      const coords: Coordinate[] = [];
      
      // Generate 1000 random coordinates
      for (let i = 0; i < 1000; i++) {
        coords.push({
          latitude: baseCoord.latitude + (Math.random() - 0.5) * 0.1,
          longitude: baseCoord.longitude + (Math.random() - 0.5) * 0.1,
        });
      }
      
      const startTime = performance.now();
      
      // Calculate distances to all coordinates
      const distances = coords.map(coord => calculateDistance(baseCoord, coord));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(distances).toHaveLength(1000);
      expect(distances.every(d => d >= 0)).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });
  });
}); 