import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OSMViewProps, OSMViewRef } from '../types';

// Dynamic imports for MapLibre component
let MapLibreOSMView: any = null;

const loadMapLibreComponent = async () => {
  try {
    if (typeof window !== 'undefined') {
      // Check if MapLibre GL is available
      await import('maplibre-gl');
      // Load our MapLibre component
      const module = await import('./OSMView.maplibre.web');
      MapLibreOSMView = module.default;
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Smart Web component for OSMView.
 * 
 * Automatically detects if MapLibre GL is available:
 * - If available: Uses real interactive maps with MapLibre GL JS
 * - If not available: Uses safe fallback UI
 * 
 * This provides the best experience while maintaining safety.
 */
const OSMView = forwardRef<OSMViewRef, OSMViewProps>((props, ref) => {
  const [mapLibreAvailable, setMapLibreAvailable] = useState<boolean | null>(null);

  // Check for MapLibre availability on mount
  useEffect(() => {
    loadMapLibreComponent().then(setMapLibreAvailable).catch(() => setMapLibreAvailable(false));
  }, []);

  // While checking availability, show loading
  if (mapLibreAvailable === null) {
    return (
      <View style={[styles.container, props.style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🗺️ Initializing Map...</Text>
          <Text style={styles.loadingSubtext}>
            Checking for MapLibre GL availability
          </Text>
        </View>
      </View>
    );
  }

  // If MapLibre is available, use the real map component
  if (mapLibreAvailable && MapLibreOSMView) {
    return <MapLibreOSMView {...props} ref={ref} />;
  }

  // Otherwise, use the safe fallback component
  return <FallbackOSMView {...props} ref={ref} />;
});

/**
 * Safe fallback component when MapLibre is not available.
 * 
 * SAFETY: This component safely handles ALL OSMViewProps without breaking,
 * provides useful fallback UI, and calls event handlers appropriately.
 * It also implements the OSMViewRef interface with safe fallback methods.
 */
const FallbackOSMView = forwardRef<OSMViewRef, OSMViewProps>((props, ref) => {
  // SAFE: Destructure all props with safe defaults
  const {
    style,
    initialCenter = { latitude: 0, longitude: 0 },
    initialZoom = 10,
    markers = [],
    polylines = [],
    polygons = [],
    circles = [],
    overlays = [],
    showUserLocation = false,
    followUserLocation = false,
    showsCompass = false,
    showsScale = false,
    showsZoomControls = false,
    // Event handlers - safely extracted
    onMapReady,
    onRegionChange,
    onPress,
    onLongPress,
    onMarkerPress,
    onUserLocationChange,
    // Other props are safely ignored
    ...restProps
  } = props;

  // Safe refs for avoiding memory leaks
  const hasCalledOnMapReady = useRef(false);

  // SAFE: Call onMapReady once like the native component would
  useEffect(() => {
    if (onMapReady && !hasCalledOnMapReady.current) {
      hasCalledOnMapReady.current = true;
      // Simulate native map ready with small delay
      const timer = setTimeout(() => {
        try {
          onMapReady();
        } catch (error) {
          console.warn('OSMView.web: onMapReady handler error:', error);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    // Return undefined for code paths that don't set up cleanup
    return undefined;
  }, [onMapReady]);

  // SAFE: Count total overlay elements
  const totalOverlays = markers.length + polylines.length + polygons.length + circles.length + overlays.length;

  // SAFE: Implement ref methods that won't crash but provide useful feedback
  useImperativeHandle(ref, () => ({
    // Zoom methods - safe fallbacks
    zoomIn: async () => {
      return Promise.resolve();
    },
    zoomOut: async () => {
      return Promise.resolve();
    },
    setZoom: async (zoom: number) => {
      return Promise.resolve();
    },
    
    // Camera methods - safe fallbacks
    animateToLocation: async (latitude: number, longitude: number, zoom?: number) => {
      return Promise.resolve();
    },
    animateToRegion: async (region: any, duration?: number) => {
      return Promise.resolve();
    },
    fitToMarkers: async (markerIds?: string[], padding?: number) => {
      return Promise.resolve();
    },
    
    // Camera orientation methods - safe fallbacks
    setPitch: async (pitch: number) => {
      return Promise.resolve();
    },
    setBearing: async (bearing: number) => {
      return Promise.resolve();
    },
    getPitch: async () => {
      return Promise.resolve(0);
    },
    getBearing: async () => {
      return Promise.resolve(0);
    },
    animateCamera: async (options: any) => {
      return Promise.resolve();
    },
    
    // Location methods - safe fallbacks
    getCurrentLocation: async () => {
      return Promise.resolve(initialCenter);
    },
    startLocationTracking: async () => {
      return Promise.resolve();
    },
    stopLocationTracking: async () => {
      return Promise.resolve();
    },
    waitForLocation: async (timeoutSeconds: number = 30) => {
      return Promise.resolve(initialCenter);
    },
    
    // Marker methods - safe fallbacks
    addMarker: async (marker: any) => {
      return Promise.resolve();
    },
    removeMarker: async (markerId: string) => {
      return Promise.resolve();
    },
    updateMarker: async (markerId: string, updates: any) => {
      return Promise.resolve();
    },
    animateMarker: async (markerId: string, animation: any) => {
      return Promise.resolve();
    },
    showInfoWindow: async (markerId: string) => {
      return Promise.resolve();
    },
    hideInfoWindow: async (markerId: string) => {
      return Promise.resolve();
    },
    
    // Overlay methods - safe fallbacks
    addPolyline: async (polyline: any) => {
      return Promise.resolve();
    },
    removePolyline: async (polylineId: string) => {
      return Promise.resolve();
    },
    updatePolyline: async (polylineId: string, updates: any) => {
      return Promise.resolve();
    },
    addPolygon: async (polygon: any) => {
      return Promise.resolve();
    },
    removePolygon: async (polygonId: string) => {
      return Promise.resolve();
    },
    updatePolygon: async (polygonId: string, updates: any) => {
      return Promise.resolve();
    },
    addCircle: async (circle: any) => {
      return Promise.resolve();
    },
    removeCircle: async (circleId: string) => {
      return Promise.resolve();
    },
    updateCircle: async (circleId: string, updates: any) => {
      return Promise.resolve();
    },
    addOverlay: async (overlay: any) => {
      return Promise.resolve();
    },
    removeOverlay: async (overlayId: string) => {
      return Promise.resolve();
    },
    updateOverlay: async (overlayId: string, updates: any) => {
      return Promise.resolve();
    },
    
    // Map utilities - safe fallbacks
    coordinateForPoint: async (point: { x: number; y: number }) => {
      return Promise.resolve(initialCenter);
    },
    pointForCoordinate: async (coordinate: any) => {
      return Promise.resolve({ x: 0, y: 0 });
    },
    takeSnapshot: async (format?: 'png' | 'jpg', quality?: number) => {
      return Promise.resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    },
    
    // Helper methods
    isViewReady: async () => {
      return Promise.resolve(true); // Web fallback is always "ready"
    },
  }), [initialCenter]);
  // SAFE: Handle press events if provided
  const handlePress = () => {
    if (onPress) {
      try {
        // Simulate a press at the center of the map
        onPress(initialCenter);
      } catch (error) {
        console.warn('OSMView.web: onPress handler error:', error);
      }
    }
  };

  return (
    <View style={[styles.container, style]} onTouchStart={handlePress}>
      <View style={styles.content}>
        <Text style={styles.title}>🗺️ expo-osm-sdk</Text>
        <Text style={styles.subtitle}>Web Setup Required</Text>
        
        <Text style={styles.description}>
          To enable maps on web, install MapLibre GL JS:
        </Text>
        
        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>📦 Quick Setup</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>npm install maplibre-gl</Text>
          </View>
          <Text style={styles.setupNote}>
            Then restart your dev server. Maps will work automatically!
          </Text>
        </View>
        
        <View style={styles.configCard}>
          <Text style={styles.configTitle}>📊 Map Configuration</Text>
          <Text style={styles.configText}>
            📍 Center: {initialCenter.latitude.toFixed(4)}, {initialCenter.longitude.toFixed(4)}
          </Text>
          <Text style={styles.configText}>🔍 Zoom Level: {initialZoom}</Text>
          
          {totalOverlays > 0 && (
            <View style={styles.overlayInfo}>
              <Text style={styles.configText}>🎯 Map Elements:</Text>
              {markers.length > 0 && <Text style={styles.overlayText}>📌 {markers.length} markers</Text>}
              {polylines.length > 0 && <Text style={styles.overlayText}>📏 {polylines.length} polylines</Text>}
              {polygons.length > 0 && <Text style={styles.overlayText}>🔶 {polygons.length} polygons</Text>}
              {circles.length > 0 && <Text style={styles.overlayText}>⭕ {circles.length} circles</Text>}
              {overlays.length > 0 && <Text style={styles.overlayText}>🎨 {overlays.length} custom overlays</Text>}
            </View>
          )}
          
          {(showUserLocation || followUserLocation || showsCompass || showsScale || showsZoomControls) && (
            <View style={styles.featuresInfo}>
              <Text style={styles.configText}>⚙️ Enabled Features:</Text>
              {showUserLocation && <Text style={styles.featureText}>• User location display</Text>}
              {followUserLocation && <Text style={styles.featureText}>• Follow user location</Text>}
              {showsCompass && <Text style={styles.featureText}>• Compass control</Text>}
              {showsScale && <Text style={styles.featureText}>• Scale indicator</Text>}
              {showsZoomControls && <Text style={styles.featureText}>• Zoom controls</Text>}
            </View>
          )}
        </View>

        <Text style={styles.docLink}>
          📚 See WEB_SETUP_GUIDE.md for detailed instructions
        </Text>
        
        {onPress && (
          <Text style={styles.interactionHint}>
            👆 Tap anywhere to trigger onPress event
          </Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 20,
    minHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 500,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  setupCard: {
    backgroundColor: '#ebf8ff',
    borderColor: '#3182ce',
    borderWidth: 2,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5282',
    marginBottom: 12,
    textAlign: 'center',
  },
  codeBlock: {
    backgroundColor: '#2d3748',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  code: {
    fontSize: 14,
    color: '#48bb78',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  setupNote: {
    fontSize: 13,
    color: '#4a5568',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  configCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
    textAlign: 'center',
  },
  configText: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  overlayInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  overlayText: {
    fontSize: 13,
    color: '#718096',
    marginLeft: 8,
    marginBottom: 2,
  },
  featuresInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  featureText: {
    fontSize: 13,
    color: '#718096',
    marginLeft: 8,
    marginBottom: 2,
  },
  docLink: {
    fontSize: 12,
    color: '#3182ce',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  interactionHint: {
    fontSize: 12,
    color: '#3182ce',
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#ebf8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});

// Set display names for debugging
OSMView.displayName = 'OSMView';
FallbackOSMView.displayName = 'FallbackOSMView';

export default OSMView; 