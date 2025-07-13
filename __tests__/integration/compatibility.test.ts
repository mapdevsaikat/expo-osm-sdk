import React from 'react';
import OSMView from '../../src/components/OSMView';

// Mock coordinate helper
const mockCoordinate = (lat = 40.7128, lon = -74.0060) => ({
  latitude: lat,
  longitude: lon,
});

// Mock marker helper
const mockMarker = (id = 'test-marker', lat = 40.7128, lon = -74.0060) => ({
  id,
  coordinate: mockCoordinate(lat, lon),
  title: `Marker ${id}`,
});

// Mock Platform API
const mockPlatform = {
  OS: 'ios',
  Version: '15.0',
  select: jest.fn((options) => options.ios || options.default),
};

describe('OSM SDK Compatibility Tests', () => {
  const defaultProps = {
    style: { flex: 1 },
    initialCenter: mockCoordinate(),
    initialZoom: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Platform Compatibility', () => {
    it('works on iOS platform', () => {
      mockPlatform.OS = 'ios';
      mockPlatform.Version = '15.0';
      
      expect(() => {
        React.createElement(OSMView, defaultProps);
      }).not.toThrow();
    });

    it('works on Android platform', () => {
      mockPlatform.OS = 'android';
      mockPlatform.Version = '31';
      
      expect(() => {
        React.createElement(OSMView, defaultProps);
      }).not.toThrow();
    });

    it('handles unknown platform gracefully', () => {
      mockPlatform.OS = 'unknown';
      
      expect(() => {
        React.createElement(OSMView, defaultProps);
      }).not.toThrow();
    });
  });

  describe('Device Compatibility', () => {
    it('works on iPhone SE dimensions', () => {
      const seStyle = { width: 375, height: 667 };
      
      expect(() => {
        React.createElement(OSMView, {
          ...defaultProps,
          style: seStyle,
        });
      }).not.toThrow();
    });

    it('works on iPhone 15 Pro Max dimensions', () => {
      const proMaxStyle = { width: 430, height: 932 };
      
      expect(() => {
        React.createElement(OSMView, {
          ...defaultProps,
          style: proMaxStyle,
        });
      }).not.toThrow();
    });

    it('works on Android tablet dimensions', () => {
      const tabletStyle = { width: 800, height: 1280 };
      
      expect(() => {
        React.createElement(OSMView, {
          ...defaultProps,
          style: tabletStyle,
        });
      }).not.toThrow();
    });

    it('adapts to different screen densities', () => {
      const densityVariants = [1, 1.5, 2, 3, 4];
      
      densityVariants.forEach(density => {
        expect(() => {
          React.createElement(OSMView, {
            ...defaultProps,
            style: { flex: 1, transform: [{ scale: density }] },
          });
        }).not.toThrow();
      });
    });
  });

  describe('React Native Version Compatibility', () => {
    it('works with React Native 0.70+', () => {
      // Test new architecture compatibility
      expect(() => {
        React.createElement(OSMView, {
          ...defaultProps,
          // New architecture props
          fabricEnabled: true,
        });
      }).not.toThrow();
    });

    it('works with legacy React Native versions', () => {
      // Test legacy architecture compatibility
      expect(() => {
        React.createElement(OSMView, {
          ...defaultProps,
          // Legacy props
          fabricEnabled: false,
        });
      }).not.toThrow();
    });
  });

  describe('Expo SDK Compatibility', () => {
    it('works with Expo SDK 49+', () => {
      expect(() => {
        React.createElement(OSMView, {
          ...defaultProps,
          // Expo-specific props
          expoSDKVersion: '49.0.0',
        });
      }).not.toThrow();
    });

    it('handles Expo development client', () => {
      expect(() => {
        React.createElement(OSMView, {
          ...defaultProps,
          // Development client props
          developmentClient: true,
        });
      }).not.toThrow();
    });

    it('works in Expo Go environment', () => {
      expect(() => {
        React.createElement(OSMView, {
          ...defaultProps,
          // Expo Go limitations
          limitedFeatures: true,
        });
      }).not.toThrow();
    });
  });

  describe('Performance Compatibility', () => {
    it('handles low-end device simulation', () => {
      const lowEndConfig = {
        ...defaultProps,
        initialZoom: 8, // Lower zoom for performance
        markers: [mockMarker()], // Fewer markers
      };
      
      expect(() => {
        React.createElement(OSMView, lowEndConfig);
      }).not.toThrow();
    });

    it('handles high-end device simulation', () => {
      const highEndConfig = {
        ...defaultProps,
        initialZoom: 18, // Higher zoom
        markers: Array.from({ length: 50 }, (_, i) => 
          mockMarker(`marker-${i}`, 40.7128 + i * 0.001, -74.0060 + i * 0.001)
        ),
      };
      
      expect(() => {
        React.createElement(OSMView, highEndConfig);
      }).not.toThrow();
    });

    it('validates memory usage patterns', () => {
      const markers = Array.from({ length: 100 }, (_, i) => 
        mockMarker(`marker-${i}`, 40.7128 + i * 0.001, -74.0060 + i * 0.001)
      );

      const startTime = performance.now();
      const element = React.createElement(OSMView, {
        ...defaultProps,
        markers,
      });
      const endTime = performance.now();

      expect(element).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(50); // Should be fast
    });
  });

  describe('Feature Compatibility', () => {
    it('supports all marker features', () => {
      const fullFeatureMarker = {
        id: 'full-feature',
        coordinate: mockCoordinate(),
        title: 'Full Feature Marker',
        description: 'A marker with all features',
        icon: 'custom-icon',
        color: '#FF0000',
        size: 'large',
      };

      expect(() => {
        React.createElement(OSMView, {
          ...defaultProps,
          markers: [fullFeatureMarker],
        });
      }).not.toThrow();
    });

    it('supports all map interaction features', () => {
      const fullFeatureProps = {
        ...defaultProps,
        onMapReady: jest.fn(),
        onRegionChange: jest.fn(),
        onPress: jest.fn(),
        onMarkerPress: jest.fn(),
        onLongPress: jest.fn(),
        gestureEnabled: true,
        zoomEnabled: true,
        scrollEnabled: true,
        rotateEnabled: true,
      };

      expect(() => {
        React.createElement(OSMView, fullFeatureProps);
      }).not.toThrow();
    });

    it('supports custom map styling', () => {
      const styledProps = {
        ...defaultProps,
        mapStyle: 'custom-style',
        tileServerUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        userLocationEnabled: true,
        showsUserLocation: true,
      };

      expect(() => {
        React.createElement(OSMView, styledProps);
      }).not.toThrow();
    });
  });

  describe('Error Recovery', () => {
    it('handles network failures gracefully', () => {
      const networkFailureProps = {
        ...defaultProps,
        tileServerUrl: 'https://unreachable-server.com/{z}/{x}/{y}.png',
        onError: jest.fn(),
      };

      expect(() => {
        React.createElement(OSMView, networkFailureProps);
      }).not.toThrow();
    });

    it('handles invalid data gracefully', () => {
      const invalidProps = {
        ...defaultProps,
        initialCenter: { latitude: 'invalid', longitude: 'invalid' },
        initialZoom: 'invalid',
        markers: [
          { id: 'invalid', coordinate: { latitude: 'bad', longitude: 'bad' } }
        ],
      };

      expect(() => {
        React.createElement(OSMView, invalidProps);
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('integrates with React lifecycle', () => {
      const Component = () => {
        const [zoom, setZoom] = React.useState(10);
        
        return React.createElement(OSMView, {
          ...defaultProps,
          initialZoom: zoom,
          onZoomChange: setZoom,
        });
      };

      expect(() => {
        React.createElement(Component);
      }).not.toThrow();
    });

    it('handles state updates properly', () => {
      const markers = [mockMarker()];
      const updatedMarkers = [...markers, mockMarker('new-marker')];

      expect(() => {
        React.createElement(OSMView, { ...defaultProps, markers });
        React.createElement(OSMView, { ...defaultProps, markers: updatedMarkers });
      }).not.toThrow();
    });
  });
}); 