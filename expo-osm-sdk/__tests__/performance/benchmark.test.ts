import { performance } from 'perf_hooks';
import { calculateDistance, calculateBearing, isValidCoordinate } from '../../src/utils/coordinate';
import { mockCoordinate, mockMarker } from '../setup';

describe('Performance Benchmark Tests', () => {
  const NYC = mockCoordinate(40.7128, -74.0060);
  const LONDON = mockCoordinate(51.5074, -0.1278);
  const TOKYO = mockCoordinate(35.6762, 139.6503);

  describe('Coordinate Operations Performance', () => {
    it('validates 10,000 coordinates within 100ms', () => {
      const coordinates = Array.from({ length: 10000 }, (_, i) => 
        mockCoordinate(40.7128 + i * 0.0001, -74.0060 + i * 0.0001)
      );

      const startTime = performance.now();
      coordinates.forEach(coord => isValidCoordinate(coord));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('calculates 1,000 distances within 50ms', () => {
      const coordinates = Array.from({ length: 1000 }, (_, i) => 
        mockCoordinate(40.7128 + i * 0.001, -74.0060 + i * 0.001)
      );

      const startTime = performance.now();
      coordinates.forEach(coord => calculateDistance(NYC, coord));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
    });

    it('calculates 1,000 bearings within 50ms', () => {
      const coordinates = Array.from({ length: 1000 }, (_, i) => 
        mockCoordinate(40.7128 + i * 0.001, -74.0060 + i * 0.001)
      );

      const startTime = performance.now();
      coordinates.forEach(coord => calculateBearing(NYC, coord));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Marker Rendering Performance', () => {
    it('handles 100 markers efficiently', () => {
      const markers = Array.from({ length: 100 }, (_, i) => 
        mockMarker(`marker-${i}`, 40.7128 + i * 0.001, -74.0060 + i * 0.001)
      );

      const startTime = performance.now();
      // Simulate marker processing
      markers.forEach(marker => {
        isValidCoordinate(marker.coordinate);
        calculateDistance(NYC, marker.coordinate);
      });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('handles 1,000 markers within acceptable limits', () => {
      const markers = Array.from({ length: 1000 }, (_, i) => 
        mockMarker(`marker-${i}`, 40.7128 + i * 0.0001, -74.0060 + i * 0.0001)
      );

      const startTime = performance.now();
      // Simulate marker processing
      markers.forEach(marker => {
        isValidCoordinate(marker.coordinate);
      });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // 500ms for 1000 markers
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('maintains stable memory usage during coordinate operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform intensive coordinate operations
      for (let i = 0; i < 1000; i++) {
        const coord = mockCoordinate(40.7128 + i * 0.001, -74.0060 + i * 0.001);
        isValidCoordinate(coord);
        calculateDistance(NYC, coord);
        calculateBearing(NYC, coord);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Real-World Performance Scenarios', () => {
    it('handles rapid coordinate updates efficiently', () => {
      const startTime = performance.now();
      
      // Simulate rapid coordinate updates (like user panning)
      for (let i = 0; i < 100; i++) {
        const coord = mockCoordinate(40.7128 + i * 0.01, -74.0060 + i * 0.01);
        isValidCoordinate(coord);
        
        // Calculate distances to multiple reference points
        [NYC, LONDON, TOKYO].forEach(ref => {
          calculateDistance(ref, coord);
          calculateBearing(ref, coord);
        });
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('handles map region calculations efficiently', () => {
      const startTime = performance.now();
      
      // Simulate map region bounds calculations
      for (let i = 0; i < 50; i++) {
        const center = mockCoordinate(40.7128 + i * 0.1, -74.0060 + i * 0.1);
        const radius = 1000 + i * 100; // varying radius
        
        // Calculate bounding box (simulate map bounds)
        const bounds = {
          north: center.latitude + radius / 111320,
          south: center.latitude - radius / 111320,
          east: center.longitude + radius / (111320 * Math.cos(center.latitude * Math.PI / 180)),
          west: center.longitude - radius / (111320 * Math.cos(center.latitude * Math.PI / 180)),
        };
        
        // Validate bounds
        expect(bounds.north).toBeGreaterThan(bounds.south);
        expect(bounds.east).toBeGreaterThan(bounds.west);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(200); // Allow more time for complex calculations
    });
  });

  describe('Stress Testing', () => {
    it('maintains performance under concurrent operations', async () => {
      const operations = [];
      
      // Create multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        const operation = new Promise(resolve => {
          const coordinates = Array.from({ length: 100 }, (_, j) => 
            mockCoordinate(40.7128 + j * 0.001, -74.0060 + j * 0.001)
          );
          
          const startTime = performance.now();
          coordinates.forEach(coord => {
            isValidCoordinate(coord);
            calculateDistance(NYC, coord);
          });
          const endTime = performance.now();
          
          resolve(endTime - startTime);
        });
        
        operations.push(operation);
      }
      
      const results = await Promise.all(operations);
      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      
      // Average operation time should be reasonable even under load
      expect(avgTime).toBeLessThan(100);
    });
  });

  describe('Performance Regression Detection', () => {
    const PERFORMANCE_BASELINES = {
      coordinate_validation: 0.01, // ms per coordinate
      distance_calculation: 0.05, // ms per calculation
      bearing_calculation: 0.05, // ms per calculation
    };

    it('coordinate validation performance within baseline', () => {
      const coords = Array.from({ length: 1000 }, (_, i) => 
        mockCoordinate(40.7128 + i * 0.001, -74.0060 + i * 0.001)
      );

      const startTime = performance.now();
      coords.forEach(coord => isValidCoordinate(coord));
      const endTime = performance.now();

      const avgTime = (endTime - startTime) / coords.length;
      expect(avgTime).toBeLessThan(PERFORMANCE_BASELINES.coordinate_validation);
    });

    it('distance calculation performance within baseline', () => {
      const coords = Array.from({ length: 1000 }, (_, i) => 
        mockCoordinate(40.7128 + i * 0.001, -74.0060 + i * 0.001)
      );

      const startTime = performance.now();
      coords.forEach(coord => calculateDistance(NYC, coord));
      const endTime = performance.now();

      const avgTime = (endTime - startTime) / coords.length;
      expect(avgTime).toBeLessThan(PERFORMANCE_BASELINES.distance_calculation);
    });

    it('bearing calculation performance within baseline', () => {
      const coords = Array.from({ length: 1000 }, (_, i) => 
        mockCoordinate(40.7128 + i * 0.001, -74.0060 + i * 0.001)
      );

      const startTime = performance.now();
      coords.forEach(coord => calculateBearing(NYC, coord));
      const endTime = performance.now();

      const avgTime = (endTime - startTime) / coords.length;
      expect(avgTime).toBeLessThan(PERFORMANCE_BASELINES.bearing_calculation);
    });
  });
}); 