import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { OSMViewProps, OSMViewRef, Coordinate, MapRegion } from '../types';

// Dynamic import for MapLibre GL JS (web only)
let maplibregl: any = null;
if (Platform.OS === 'web') {
  try {
    maplibregl = require('maplibre-gl');
  } catch (error) {
    console.warn('MapLibre GL JS not available:', error);
  }
}

/**
 * Web implementation of OSMView using MapLibre GL JS
 * Simple, stable implementation focusing on basic functionality
 */
const OSMView = forwardRef<OSMViewRef, OSMViewProps>(({
  style,
  initialCenter = { latitude: 0, longitude: 0 },
  initialZoom = 10,
  styleUrl,
  tileServerUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  markers = [],
  polylines = [],
  polygons = [],
  circles = [],
  clustering,
  showUserLocation = false,
  followUserLocation = false,
  onMapReady,
  onRegionChange,
  onMarkerPress,
  onPress,
  onUserLocationChange,
  children
}, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const isInitialized = useRef(false);

  // Imperative API
  useImperativeHandle(ref, () => ({
    zoomIn: async () => {
      if (mapRef.current) {
        const currentZoom = mapRef.current.getZoom();
        mapRef.current.setZoom(currentZoom + 1);
      }
    },
    zoomOut: async () => {
      if (mapRef.current) {
        const currentZoom = mapRef.current.getZoom();
        mapRef.current.setZoom(currentZoom - 1);
      }
    },
    setZoom: async (zoom: number) => {
      if (mapRef.current) {
        mapRef.current.setZoom(zoom);
      }
    },
    animateToLocation: async (latitude: number, longitude: number, zoom?: number) => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: zoom || mapRef.current.getZoom(),
          essential: true
        });
      }
    },
    animateToRegion: async (region: any, duration = 1000) => {
      if (mapRef.current) {
        const bounds = [
          [region.longitude - region.longitudeDelta/2, region.latitude - region.latitudeDelta/2],
          [region.longitude + region.longitudeDelta/2, region.latitude + region.latitudeDelta/2]
        ];
        mapRef.current.fitBounds(bounds, { duration });
      }
    },
    getCurrentLocation: async () => {
      const center = mapRef.current?.getCenter();
      if (center) {
        return {
          latitude: center.lat,
          longitude: center.lng,
          accuracy: 0,
          timestamp: Date.now(),
          source: 'map-center'
        };
      }
      throw new Error('Map not available');
    },
    waitForLocation: async () => initialCenter,
    startLocationTracking: async () => {
      console.log('🌐 Location tracking not implemented for web');
    },
    stopLocationTracking: async () => {
      console.log('🌐 Location tracking not implemented for web');
    },
    fitToMarkers: async (markerIds?: string[], padding = 50) => {
      if (!mapRef.current || markersRef.current.length === 0 || !maplibregl) return;
      const bounds = new maplibregl.LngLatBounds();
      markersRef.current.forEach(marker => bounds.extend(marker.getLngLat()));
      mapRef.current.fitBounds(bounds, { padding });
    },
    setPitch: async (pitch: number) => {
      if (mapRef.current) {
        mapRef.current.setPitch(Math.max(0, Math.min(pitch, 60)));
      }
    },
    setBearing: async (bearing: number) => {
      if (mapRef.current) {
        mapRef.current.setBearing(bearing % 360);
      }
    },
    getPitch: async () => mapRef.current?.getPitch() || 0,
    getBearing: async () => mapRef.current?.getBearing() || 0,
    addMarker: async () => {},
    removeMarker: async () => {},
    updateMarker: async () => {},
    showInfoWindow: async () => {},
    hideInfoWindow: async () => {},
    addPolyline: async () => {},
    removePolyline: async () => {},
    updatePolyline: async () => {},
    addPolygon: async () => {},
    removePolygon: async () => {},
    updatePolygon: async () => {},
    addCircle: async () => {},
    removeCircle: async () => {},
    updateCircle: async () => {},
    addOverlay: async () => {},
    removeOverlay: async () => {},
    updateOverlay: async () => {},
    animateMarker: async () => {},
    coordinateForPoint: async () => ({ latitude: 0, longitude: 0 }),
    pointForCoordinate: async () => ({ x: 0, y: 0 }),
    takeSnapshot: async () => '',
    setBaseLayer: async () => {},
    addLayer: async () => {},
    removeLayer: async () => {},
    toggleLayer: async () => {},
    setLayerOpacity: async () => {},
    getActiveLayers: async () => [],
    getLayerInfo: async () => null
  }), []);

  // Initialize map once only - no dependencies to prevent re-initialization
  useEffect(() => {
    if (!maplibregl || !mapContainerRef.current || isInitialized.current) return;

    console.log('🗺️ Initializing web map with raster tiles...');

    // Create simple raster tile style
    const rasterStyle = {
      version: 8,
      sources: {
        'osm-raster': {
          type: 'raster',
          tiles: [tileServerUrl],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-raster-layer',
          type: 'raster',
          source: 'osm-raster',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl || rasterStyle,
      center: [initialCenter.longitude, initialCenter.latitude],
      zoom: initialZoom
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl());

    // Map events
    map.on('load', () => {
      console.log('🗺️ Web map loaded successfully');
      onMapReady?.();
    });

    map.on('moveend', () => {
      const center = map.getCenter();
      const bounds = map.getBounds();
      
      const region: MapRegion = {
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: bounds.getNorth() - bounds.getSouth(),
        longitudeDelta: bounds.getEast() - bounds.getWest()
      };
      
      onRegionChange?.(region);
    });

    map.on('click', (e: any) => {
      const coordinate: Coordinate = {
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng
      };
      onPress?.(coordinate);
    });

    mapRef.current = map;
    isInitialized.current = true;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        isInitialized.current = false;
      }
    };
  }, []); // No dependencies - run only once

  // Fallback for non-web platforms or when MapLibre is not available
  if (Platform.OS !== 'web' || !maplibregl) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.fallbackText}>
          🌐 Web Map Loading...
        </Text>
        <Text style={styles.fallbackSubtext}>
          {Platform.OS !== 'web' 
            ? 'Use native components for mobile platforms' 
            : 'MapLibre GL JS is loading...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 400
        }}
      />
    </View>
  );
});

OSMView.displayName = 'OSMView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    color: '#333'
  },
  fallbackSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    color: '#666'
  }
});

export default OSMView; 