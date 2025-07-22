import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OSMViewProps, OSMViewRef } from '../types';

/**
 * Web fallback component for OSMView.
 *
 * This component is automatically used on the web platform by the bundler
 * to prevent crashes, since the native view is not available.
 * 
 * SAFETY: This component safely handles ALL OSMViewProps without breaking,
 * provides useful fallback UI, and calls event handlers appropriately.
 * It also implements the OSMViewRef interface with safe fallback methods.
 */
const OSMView = forwardRef<OSMViewRef, OSMViewProps>((props, ref) => {
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
      console.log('OSMView.web: zoomIn() called - not available on web');
      return Promise.resolve();
    },
    zoomOut: async () => {
      console.log('OSMView.web: zoomOut() called - not available on web');
      return Promise.resolve();
    },
    setZoom: async (zoom: number) => {
      console.log(`OSMView.web: setZoom(${zoom}) called - not available on web`);
      return Promise.resolve();
    },
    
    // Camera methods - safe fallbacks
    animateToLocation: async (latitude: number, longitude: number, zoom?: number) => {
      console.log(`OSMView.web: animateToLocation(${latitude}, ${longitude}, ${zoom}) called - not available on web`);
      return Promise.resolve();
    },
    animateToRegion: async (region: any, duration?: number) => {
      console.log('OSMView.web: animateToRegion() called - not available on web');
      return Promise.resolve();
    },
    fitToMarkers: async (markerIds?: string[], padding?: number) => {
      console.log('OSMView.web: fitToMarkers() called - not available on web');
      return Promise.resolve();
    },
    
    // Location methods - safe fallbacks
    getCurrentLocation: async () => {
      console.log('OSMView.web: getCurrentLocation() called - not available on web');
      return Promise.resolve(initialCenter);
    },
    startLocationTracking: async () => {
      console.log('OSMView.web: startLocationTracking() called - not available on web');
      return Promise.resolve();
    },
    stopLocationTracking: async () => {
      console.log('OSMView.web: stopLocationTracking() called - not available on web');
      return Promise.resolve();
    },
    waitForLocation: async (timeoutSeconds: number = 30) => {
      console.log(`OSMView.web: waitForLocation(${timeoutSeconds}) called - not available on web`);
      return Promise.resolve(initialCenter);
    },
    
    // Marker methods - safe fallbacks
    addMarker: async (marker: any) => {
      console.log('OSMView.web: addMarker() called - not available on web');
      return Promise.resolve();
    },
    removeMarker: async (markerId: string) => {
      console.log(`OSMView.web: removeMarker(${markerId}) called - not available on web`);
      return Promise.resolve();
    },
    updateMarker: async (markerId: string, updates: any) => {
      console.log(`OSMView.web: updateMarker(${markerId}) called - not available on web`);
      return Promise.resolve();
    },
    animateMarker: async (markerId: string, animation: any) => {
      console.log(`OSMView.web: animateMarker(${markerId}) called - not available on web`);
      return Promise.resolve();
    },
    showInfoWindow: async (markerId: string) => {
      console.log(`OSMView.web: showInfoWindow(${markerId}) called - not available on web`);
      return Promise.resolve();
    },
    hideInfoWindow: async (markerId: string) => {
      console.log(`OSMView.web: hideInfoWindow(${markerId}) called - not available on web`);
      return Promise.resolve();
    },
    
    // Overlay methods - safe fallbacks
    addPolyline: async (polyline: any) => {
      console.log('OSMView.web: addPolyline() called - not available on web');
      return Promise.resolve();
    },
    removePolyline: async (polylineId: string) => {
      console.log(`OSMView.web: removePolyline(${polylineId}) called - not available on web`);
      return Promise.resolve();
    },
    updatePolyline: async (polylineId: string, updates: any) => {
      console.log(`OSMView.web: updatePolyline(${polylineId}) called - not available on web`);
      return Promise.resolve();
    },
    addPolygon: async (polygon: any) => {
      console.log('OSMView.web: addPolygon() called - not available on web');
      return Promise.resolve();
    },
    removePolygon: async (polygonId: string) => {
      console.log(`OSMView.web: removePolygon(${polygonId}) called - not available on web`);
      return Promise.resolve();
    },
    updatePolygon: async (polygonId: string, updates: any) => {
      console.log(`OSMView.web: updatePolygon(${polygonId}) called - not available on web`);
      return Promise.resolve();
    },
    addCircle: async (circle: any) => {
      console.log('OSMView.web: addCircle() called - not available on web');
      return Promise.resolve();
    },
    removeCircle: async (circleId: string) => {
      console.log(`OSMView.web: removeCircle(${circleId}) called - not available on web`);
      return Promise.resolve();
    },
    updateCircle: async (circleId: string, updates: any) => {
      console.log(`OSMView.web: updateCircle(${circleId}) called - not available on web`);
      return Promise.resolve();
    },
    addOverlay: async (overlay: any) => {
      console.log('OSMView.web: addOverlay() called - not available on web');
      return Promise.resolve();
    },
    removeOverlay: async (overlayId: string) => {
      console.log(`OSMView.web: removeOverlay(${overlayId}) called - not available on web`);
      return Promise.resolve();
    },
    updateOverlay: async (overlayId: string, updates: any) => {
      console.log(`OSMView.web: updateOverlay(${overlayId}) called - not available on web`);
      return Promise.resolve();
    },
    
    // Map utilities - safe fallbacks
    coordinateForPoint: async (point: { x: number; y: number }) => {
      console.log(`OSMView.web: coordinateForPoint(${point.x}, ${point.y}) called - not available on web`);
      return Promise.resolve(initialCenter);
    },
    pointForCoordinate: async (coordinate: any) => {
      console.log('OSMView.web: pointForCoordinate() called - not available on web');
      return Promise.resolve({ x: 0, y: 0 });
    },
    takeSnapshot: async (format?: 'png' | 'jpg', quality?: number) => {
      console.log(`OSMView.web: takeSnapshot(${format}, ${quality}) called - not available on web`);
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
        <Text style={styles.subtitle}>Web Fallback</Text>
        
        <Text style={styles.description}>
          Native map component not available on web platform.
        </Text>
        
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

        <Text style={styles.suggestion}>
          💡 For web maps, consider: react-leaflet, mapbox-gl, or Google Maps
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
  suggestion: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
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

// Set display name for debugging
OSMView.displayName = 'OSMView';

export default OSMView; 