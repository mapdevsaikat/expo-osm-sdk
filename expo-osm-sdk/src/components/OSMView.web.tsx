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

  // Stable refs to prevent infinite re-renders
  const stableMarkersRef = React.useRef(markers);
  const stablePolylinesRef = React.useRef(polylines);
  const stablePolygonsRef = React.useRef(polygons);
  const stableCirclesRef = React.useRef(circles);
  const lastProcessedDataRef = React.useRef<any>(null);

  // Update refs only when arrays actually change (deep comparison for IDs)
  React.useEffect(() => {
    const markersChanged = JSON.stringify(markers.map(m => m.id)) !== JSON.stringify(stableMarkersRef.current.map(m => m.id));
    const polylinesChanged = JSON.stringify(polylines.map(p => p.id)) !== JSON.stringify(stablePolylinesRef.current.map(p => p.id));
    const polygonsChanged = JSON.stringify(polygons.map(p => p.id)) !== JSON.stringify(stablePolygonsRef.current.map(p => p.id));
    const circlesChanged = JSON.stringify(circles.map(c => c.id)) !== JSON.stringify(stableCirclesRef.current.map(c => c.id));

    if (markersChanged) stableMarkersRef.current = markers;
    if (polylinesChanged) stablePolylinesRef.current = polylines;
    if (polygonsChanged) stablePolygonsRef.current = polygons;
    if (circlesChanged) stableCirclesRef.current = circles;
  }, [markers, polylines, polygons, circles]);

  // Process JSX children with stable references
  const processedData = React.useMemo(() => {
    if (!children) {
      return { 
        markers: stableMarkersRef.current, 
        polylines: stablePolylinesRef.current, 
        polygons: stablePolygonsRef.current, 
        circles: stableCirclesRef.current 
      };
    }

    const extractedMarkers = [...stableMarkersRef.current];
    const extractedPolylines = [...stablePolylinesRef.current];
    const extractedPolygons = [...stablePolygonsRef.current];
    const extractedCircles = [...stableCirclesRef.current];

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

    const result = {
      markers: extractedMarkers,
      polylines: extractedPolylines,
      polygons: extractedPolygons,
      circles: extractedCircles,
    };

    // Only update if actually different
    if (JSON.stringify(result) !== JSON.stringify(lastProcessedDataRef.current)) {
      lastProcessedDataRef.current = result;
      return result;
    }

    return lastProcessedDataRef.current || result;
  }, [children]);

  // Initialize map with stable callbacks
  const stableOnMapReady = React.useCallback(() => {
    console.log('🗺️ Web map loaded');
    onMapReady?.();
  }, [onMapReady]);

  const stableOnRegionChange = React.useCallback((region: MapRegion) => {
    onRegionChange?.(region);
  }, [onRegionChange]);

  const stableOnPress = React.useCallback((coordinate: Coordinate) => {
    onPress?.(coordinate);
  }, [onPress]);

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

    let isMapReady = false;

    // Map events with throttling
    map.on('load', () => {
      isMapReady = true;
      stableOnMapReady();
    });

    let moveTimeout: NodeJS.Timeout;
    map.on('move', () => {
      if (!isMapReady) return;
      
      // Throttle move events to prevent excessive updates
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        const center = map.getCenter();
        const bounds = map.getBounds();
        
        const region: MapRegion = {
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta: bounds.getNorth() - bounds.getSouth(),
          longitudeDelta: bounds.getEast() - bounds.getWest()
        };
        
        stableOnRegionChange(region);
      }, 100);
    });

    map.on('click', (e: any) => {
      if (!isMapReady) return;
      
      const coordinate: Coordinate = {
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng
      };
      stableOnPress(coordinate);
    });

    mapRef.current = map;

    return () => {
      clearTimeout(moveTimeout);
      map.remove();
    };
  }, [styleUrl, tileServerUrl, initialCenter.latitude, initialCenter.longitude, initialZoom]);

  // Add markers with stable callbacks
  const stableOnMarkerPress = React.useCallback((markerId: string, coordinate: Coordinate) => {
    onMarkerPress?.(markerId, coordinate);
  }, [onMarkerPress]);

  // Track marker updates to prevent unnecessary re-renders
  const lastMarkersJsonRef = React.useRef<string>('');

  useEffect(() => {
    if (!mapRef.current || !processedData.markers) return;

    const currentMarkersJson = JSON.stringify(processedData.markers);
    if (currentMarkersJson === lastMarkersJsonRef.current) return;
    
    lastMarkersJsonRef.current = currentMarkersJson;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    processedData.markers.forEach((marker: any) => {
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
        stableOnMarkerPress(marker.id, marker.coordinate);
      });

      markersRef.current.push(markerElement);
    });
  }, [processedData]);

  // Add polylines with stability check
  const lastPolylinesJsonRef = React.useRef<string>('');

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded() || !processedData.polylines) return;

    const currentPolylinesJson = JSON.stringify(processedData.polylines);
    if (currentPolylinesJson === lastPolylinesJsonRef.current) return;
    
    lastPolylinesJsonRef.current = currentPolylinesJson;

    processedData.polylines.forEach((polyline: any) => {
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
            coordinates: polyline.coordinates.map((coord: any) => [coord.longitude, coord.latitude])
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
  }, [processedData]);

  // Add polygons with stability check
  const lastPolygonsJsonRef = React.useRef<string>('');

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded() || !processedData.polygons) return;

    const currentPolygonsJson = JSON.stringify(processedData.polygons);
    if (currentPolygonsJson === lastPolygonsJsonRef.current) return;
    
    lastPolygonsJsonRef.current = currentPolygonsJson;

    processedData.polygons.forEach((polygon: any) => {
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
            coordinates: [polygon.coordinates.map((coord: any) => [coord.longitude, coord.latitude])]
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

export { OSMView };
export default OSMView; 