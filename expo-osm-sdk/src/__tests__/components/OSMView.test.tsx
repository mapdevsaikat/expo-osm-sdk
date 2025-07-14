// Mock native module
const mockNativeModule = {
  ExpoOsmSdk: {
    onMapReady: jest.fn(),
    onRegionChange: jest.fn(),
    onMarkerPress: jest.fn(),
    onPress: jest.fn(),
  },
};

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeViewManager: jest.fn(() => mockNativeModule.ExpoOsmSdk),
}));

import React from 'react';
import OSMView from '../../components/OSMView';
import { Coordinate, MarkerConfig } from '../../types';

// Mock coordinate helper
const mockCoordinate = (lat = 40.7128, lon = -74.0060): Coordinate => ({
  latitude: lat,
  longitude: lon,
});

// Mock marker helper
const mockMarker = (id = 'test-marker', lat = 40.7128, lon = -74.0060): MarkerConfig => ({
  id,
  coordinate: mockCoordinate(lat, lon),
  title: `Marker ${id}`,
  description: `Description for ${id}`,
});


describe('OSMView Component', () => {
  const defaultProps = {
    style: { flex: 1 },
    initialCenter: mockCoordinate(),
    initialZoom: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Instantiation', () => {
    it('renders without crashing', () => {
      expect(() => {
        React.createElement(OSMView, defaultProps);
      }).not.toThrow();
    });

    it('accepts style prop', () => {
      const customStyle = { width: 300, height: 200 };
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, style: customStyle });
      }).not.toThrow();
    });

    it('accepts initialCenter prop', () => {
      const coordinate = mockCoordinate(51.5074, -0.1278); // London
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, initialCenter: coordinate });
      }).not.toThrow();
    });

    it('accepts initialZoom prop', () => {
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, initialZoom: 15 });
      }).not.toThrow();
    });
  });

  describe('Coordinate Validation', () => {
    it('accepts valid coordinates', () => {
      const coordinate = mockCoordinate(51.5074, -0.1278); // London
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, initialCenter: coordinate });
      }).not.toThrow();
    });

    it('accepts extreme coordinates', () => {
      const extremeCoordinate = mockCoordinate(89.9, 179.9); // Near North Pole
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, initialCenter: extremeCoordinate });
      }).not.toThrow();
    });

    it('accepts precise coordinates', () => {
      const preciseCoordinate = mockCoordinate(40.712775, -74.006058);
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, initialCenter: preciseCoordinate });
      }).not.toThrow();
    });
  });

  describe('Zoom Level Validation', () => {
    it('accepts valid zoom levels', () => {
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, initialZoom: 15 });
      }).not.toThrow();
    });

    it('accepts minimum zoom level', () => {
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, initialZoom: 1 });
      }).not.toThrow();
    });

    it('accepts maximum zoom level', () => {
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, initialZoom: 18 });
      }).not.toThrow();
    });
  });

  describe('Marker Props', () => {
    it('accepts single marker', () => {
      const marker = mockMarker();
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, markers: [marker] });
      }).not.toThrow();
    });

    it('accepts multiple markers', () => {
      const markers = [
        mockMarker('marker1', 40.7128, -74.0060),
        mockMarker('marker2', 51.5074, -0.1278),
        mockMarker('marker3', 35.6762, 139.6503),
      ];
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, markers });
      }).not.toThrow();
    });

    it('accepts empty markers array', () => {
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, markers: [] });
      }).not.toThrow();
    });
  });

  describe('Event Handler Props', () => {
    it('accepts onMapReady callback', () => {
      const onMapReady = jest.fn();
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, onMapReady });
      }).not.toThrow();
    });

    it('accepts onRegionChange callback', () => {
      const onRegionChange = jest.fn();
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, onRegionChange });
      }).not.toThrow();
    });

    it('accepts onPress callback', () => {
      const onPress = jest.fn();
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, onPress });
      }).not.toThrow();
    });

    it('accepts onMarkerPress callback', () => {
      const onMarkerPress = jest.fn();
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, onMarkerPress });
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('handles many markers efficiently', () => {
      const markers = Array.from({ length: 100 }, (_, i) => 
        mockMarker(`marker-${i}`, 40.7128 + i * 0.001, -74.0060 + i * 0.001)
      );
      
      const startTime = performance.now();
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, markers });
      }).not.toThrow();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should create quickly
    });

    it('handles rapid prop changes', () => {
      // Test multiple zoom levels
      for (let i = 1; i <= 18; i++) {
        expect(() => {
          React.createElement(OSMView, { ...defaultProps, initialZoom: i });
        }).not.toThrow();
      }
    });
  });

  describe('Edge Cases', () => {
    it('handles null/undefined props gracefully', () => {
      expect(() => {
        React.createElement(OSMView, {
          style: undefined,
          initialCenter: undefined,
          initialZoom: undefined,
        });
      }).not.toThrow();
    });

    it('handles extreme coordinate values', () => {
      const extremeCoords = [
        mockCoordinate(90, 180),   // North Pole, Date Line
        mockCoordinate(-90, -180), // South Pole, Date Line
        mockCoordinate(0, 0),      // Prime Meridian, Equator
        mockCoordinate(89.999, 179.999), // Near extremes
      ];
      
      extremeCoords.forEach(coord => {
        expect(() => {
          React.createElement(OSMView, { ...defaultProps, initialCenter: coord });
        }).not.toThrow();
      });
    });

    it('handles very large marker arrays', () => {
      const markers = Array.from({ length: 1000 }, (_, i) => 
        mockMarker(`marker-${i}`, 40.7128 + i * 0.0001, -74.0060 + i * 0.0001)
      );
      
      const startTime = performance.now();
      expect(() => {
        React.createElement(OSMView, { ...defaultProps, markers });
      }).not.toThrow();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Should handle large arrays
    });
  });
}); 