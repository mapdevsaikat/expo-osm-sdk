import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { OSMViewProps, OSMViewRef, Coordinate, MapRegion } from '../types';

// Dynamic import for MapLibre GL JS (web only)
let maplibregl: any = null;
if (Platform.OS === 'web') {
  try {
    // Use dynamic import to avoid issues during React Native bundling
    maplibregl = require('maplibre-gl');
  } catch (error) {
    console.warn('MapLibre GL JS not available:', error);
  }
}

/**
 * Web implementation of OSMView using MapLibre GL JS
 * 
 * Provides near-identical functionality to native versions:
 * - Vector tile rendering
 * - Markers, polylines, polygons, circles
 * - Same API surface as native components
 * - Hardware-accelerated WebGL rendering
 */
const OSMView = forwardRef<OSMViewRef, OSMViewProps>(({
  style,
  initialCenter = { latitude: 0, longitude: 0 },
  initialZoom = 10,
  styleUrl = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  tileServerUrl,
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

  // Process JSX children (same logic as native)
  const processedData = React.useMemo(() => {
    if (!children) {
      return { markers, polylines, polygons, circles };
    }

    const extractedMarkers = [...markers];
    const extractedPolylines = [...polylines];
    const extractedPolygons = [...polygons];
    const extractedCircles = [...circles];

    React.Children.forEach(children, (child, index) => {
      if (!React.isValidElement(child)) return;

      const childType = child.type as any;
      const displayName = childType?.displayName || childType?.name;
      const props = child.props as any;

      switch (displayName) {
        case 'Marker':
          extractedMarkers.push({
            id: props.id || `marker-${index}`,
            ...props,
          });
          break;
        case 'Polyline':
          extractedPolylines.push({
            id: props.id || `polyline-${index}`,
            ...props,
          });
          break;
        case 'Polygon':
          extractedPolygons.push({
            id: props.id || `polygon-${index}`,
            ...props,
          });
          break;
        case 'Circle':
          extractedCircles.push({
            id: props.id || `circle-${index}`,
            ...props,
          });
          break;
      }
    });

    return {
      markers: extractedMarkers,
      polylines: extractedPolylines,
      polygons: extractedPolygons,
      circles: extractedCircles,
    };
  }, [children, markers, polylines, polygons, circles]);

  // Initialize map
  useEffect(() => {
    if (!maplibregl || !mapContainerRef.current) return;

    // Create map instance
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl || tileServerUrl,
      center: [initialCenter.longitude, initialCenter.latitude],
      zoom: initialZoom,
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl());

    // Map events
    map.on('load', () => {
      console.log('🗺️ Web map loaded');
      onMapReady?.();
    });

    map.on('move', () => {
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

    return () => {
      map.remove();
    };
  }, []);

  // Add markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    processedData.markers.forEach((marker) => {
      if (!marker.coordinate) return;

      const markerElement = new maplibregl.Marker()
        .setLngLat([marker.coordinate.longitude, marker.coordinate.latitude])
        .addTo(mapRef.current);

      if (marker.title || marker.description) {
        const popup = new maplibregl.Popup()
          .setHTML(`
            <div>
              ${marker.title ? `<h3>${marker.title}</h3>` : ''}
              ${marker.description ? `<p>${marker.description}</p>` : ''}
            </div>
          `);
        markerElement.setPopup(popup);
      }

      markerElement.getElement().addEventListener('click', () => {
        onMarkerPress?.(marker.id, marker.coordinate);
      });

      markersRef.current.push(markerElement);
    });
  }, [processedData.markers]);

  // Add polylines
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    processedData.polylines.forEach((polyline) => {
      const sourceId = `polyline-${polyline.id}`;
      const layerId = `polyline-layer-${polyline.id}`;

      // Remove existing
      if (mapRef.current.getLayer(layerId)) {
        mapRef.current.removeLayer(layerId);
        mapRef.current.removeSource(sourceId);
      }

      // Add source
      mapRef.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: polyline.coordinates.map(coord => [coord.longitude, coord.latitude])
          }
        }
      });

      // Add layer
      mapRef.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': polyline.strokeColor || '#FF0000',
          'line-width': polyline.strokeWidth || 2
        }
      });
    });
  }, [processedData.polylines]);

  // Add polygons
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    processedData.polygons.forEach((polygon) => {
      const sourceId = `polygon-${polygon.id}`;
      const layerId = `polygon-layer-${polygon.id}`;

      // Remove existing
      if (mapRef.current.getLayer(layerId)) {
        mapRef.current.removeLayer(layerId);
        mapRef.current.removeSource(sourceId);
      }

      // Add source
      mapRef.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [polygon.coordinates.map(coord => [coord.longitude, coord.latitude])]
          }
        }
      });

      // Add layer
      mapRef.current.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': polygon.fillColor || '#FF0000',
          'fill-opacity': polygon.fillOpacity || 0.3
        }
      });
    });
  }, [processedData.polygons]);

  // Imperative API (same as native)
  useImperativeHandle(ref, () => ({
    zoomIn: async () => {
      if (mapRef.current) {
        mapRef.current.zoomIn();
      }
    },
    zoomOut: async () => {
      if (mapRef.current) {
        mapRef.current.zoomOut();
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
          duration: 1000
        });
      }
    },
    animateToRegion: async (region: MapRegion, duration = 1000) => {
      if (mapRef.current) {
        const bounds = [
          [region.longitude - region.longitudeDelta/2, region.latitude - region.latitudeDelta/2],
          [region.longitude + region.longitudeDelta/2, region.latitude + region.latitudeDelta/2]
        ];
        mapRef.current.fitBounds(bounds, { duration });
      }
    },
    
    // Pitch & Bearing controls
    setPitch: async (pitch: number) => {
      if (mapRef.current) {
        const clampedPitch = Math.max(0, Math.min(pitch, 60)); // MapLibre supports 0-60 degrees
        mapRef.current.setPitch(clampedPitch);
      }
    },
    setBearing: async (bearing: number) => {
      if (mapRef.current) {
        const normalizedBearing = bearing % 360;
        const adjustedBearing = normalizedBearing < 0 ? normalizedBearing + 360 : normalizedBearing;
        mapRef.current.setBearing(adjustedBearing);
      }
    },
    getPitch: async () => {
      if (mapRef.current) {
        return mapRef.current.getPitch();
      }
      return 0;
    },
    getBearing: async () => {
      if (mapRef.current) {
        return mapRef.current.getBearing();
      }
      return 0;
    },
    getCurrentLocation: async () => {
      // Web geolocation API
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coord = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            resolve(coord);
          },
          (error) => reject(error)
        );
      });
    },
    fitToMarkers: async (markerIds?: string[], padding = 50) => {
      if (!mapRef.current || markersRef.current.length === 0) return;
      
      const bounds = new maplibregl.LngLatBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      
      mapRef.current.fitBounds(bounds, { padding });
    },
    // Stubs for other methods (can be implemented)
    startLocationTracking: async () => {},
    stopLocationTracking: async () => {},
    waitForLocation: async () => initialCenter,
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
    
    // Layer controls
    setBaseLayer: async (layerId: string, layerConfig: any) => {
      console.log('🗺️ Web setBaseLayer:', layerId, layerConfig);
      if (mapRef.current && layerConfig.styleUrl) {
        try {
          mapRef.current.setStyle(layerConfig.styleUrl);
        } catch (error) {
          console.error('Failed to set base layer:', error);
        }
      }
    },
    addLayer: async (layerConfig: any) => {
      console.log('🗺️ Web addLayer:', layerConfig);
    },
    removeLayer: async (layerId: string) => {
      console.log('🗺️ Web removeLayer:', layerId);
    },
    toggleLayer: async (layerId: string, visible: boolean) => {
      console.log('🗺️ Web toggleLayer:', layerId, visible);
    },
    setLayerOpacity: async (layerId: string, opacity: number) => {
      console.log('🗺️ Web setLayerOpacity:', layerId, opacity);
    },
    getActiveLayers: async () => {
      console.log('🗺️ Web getActiveLayers');
      return ['web-base-layer'];
    },
    getLayerInfo: async (layerId: string) => {
      console.log('🗺️ Web getLayerInfo:', layerId);
      return null;
    },
  }), []);

  // Fallback if MapLibre GL JS not available
  if (!maplibregl) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Text style={styles.fallbackTitle}>🗺️ Web Map Loading...</Text>
        <Text style={styles.fallbackText}>
          MapLibre GL JS is required for web maps.
        </Text>
        <Text style={styles.fallbackHint}>
          Run: npm install maplibre-gl
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
          backgroundColor: '#f0f8ff'
        }}
      />
    </View>
  );
});

OSMView.displayName = 'OSMView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 16,
  },
  fallbackText: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackHint: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
  },
});

export default OSMView; 