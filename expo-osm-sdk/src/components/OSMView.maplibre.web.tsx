import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { OSMViewProps, OSMViewRef } from '../types';

// Dynamic import to handle when MapLibre isn't available
let maplibregl: any = null;

const loadMapLibre = async () => {
  try {
    if (typeof window !== 'undefined') {
      maplibregl = (await import('maplibre-gl')).default;
      
      // Load CSS dynamically using DOM manipulation
      if (!document.querySelector('link[href*="maplibre-gl.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css';
        document.head.appendChild(link);
      }
    }
    return true;
  } catch (error) {
    console.warn('MapLibre GL JS not available:', error);
    return false;
  }
};

/**
 * MapLibre GL JS implementation for OSMView on web
 * 
 * Simple implementation focusing on:
 * - Base map rendering
 * - Zoom controls
 * - Basic layer switching
 */
const MapLibreOSMView = forwardRef<OSMViewRef, OSMViewProps>((props, ref) => {
  const {
    style,
    initialCenter = { latitude: 22.5726, longitude: 88.3639 }, // Default to Kolkata
    initialZoom = 10,
    onMapReady,
    onPress,
    onRegionChange,
    tileServerUrl,
    ...restProps
  } = props;

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<'osm' | 'satellite'>('osm');
  const [mapLibreReady, setMapLibreReady] = useState(false);

  // Load MapLibre on mount
  useEffect(() => {
    loadMapLibre().then(setMapLibreReady);
  }, []);

  // Initialize map when MapLibre is ready
  useEffect(() => {
    if (!mapLibreReady || !maplibregl || !mapContainer.current || map.current) return;

    console.log('🗺️ Initializing MapLibre map...');

    try {
      // Create map instance
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        center: [initialCenter.longitude, initialCenter.latitude],
        zoom: initialZoom,
        style: getMapStyle(currentLayer, tileServerUrl),
        attributionControl: true,
      });

      // Map load event
      map.current.on('load', () => {
        console.log('🗺️ MapLibre map loaded');
        setMapLoaded(true);
        onMapReady?.();
      });

      // Click events
      map.current.on('click', (e: any) => {
        if (onPress) {
          onPress({
            latitude: e.lngLat.lat,
            longitude: e.lngLat.lng,
          });
        }
      });

      // Region change events
      map.current.on('moveend', () => {
        if (onRegionChange && map.current) {
          const center = map.current.getCenter();
          const zoom = map.current.getZoom();
          
          onRegionChange({
            latitude: center.lat,
            longitude: center.lng,
            latitudeDelta: 0.01, // Approximation
            longitudeDelta: 0.01, // Approximation
          });
        }
      });

    } catch (error) {
      console.error('❌ Failed to initialize MapLibre map:', error);
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapLibreReady, initialCenter, initialZoom, onMapReady, onPress, onRegionChange, tileServerUrl]);

  // Update map style when layer changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      const newStyle = getMapStyle(currentLayer, tileServerUrl);
      map.current.setStyle(newStyle);
    }
  }, [currentLayer, tileServerUrl, mapLoaded]);

  // Implement OSMViewRef methods
  useImperativeHandle(ref, () => ({
    // Zoom methods
    zoomIn: async () => {
      if (map.current) {
        map.current.zoomIn();
      }
    },
    zoomOut: async () => {
      if (map.current) {
        map.current.zoomOut();
      }
    },
    setZoom: async (zoom: number) => {
      if (map.current) {
        map.current.setZoom(zoom);
      }
    },

    // Camera methods
    animateToLocation: async (latitude: number, longitude: number, zoom?: number) => {
      if (map.current) {
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: zoom || map.current.getZoom(),
          essential: true,
        });
      }
    },
    animateToRegion: async (region: any, duration?: number) => {
      if (map.current) {
        map.current.flyTo({
          center: [region.longitude, region.latitude],
          zoom: calculateZoomFromRegion(region),
          duration: duration || 1000,
        });
      }
    },
    fitToMarkers: async () => {
      console.log('MapLibre: fitToMarkers - not implemented yet');
    },

    // Location methods - basic implementations
    getCurrentLocation: async () => {
      console.log('MapLibre: getCurrentLocation - returning center');
      if (map.current) {
        const center = map.current.getCenter();
        return { latitude: center.lat, longitude: center.lng };
      }
      return initialCenter;
    },
    startLocationTracking: async () => {
      console.log('MapLibre: startLocationTracking - not implemented yet');
    },
    stopLocationTracking: async () => {
      console.log('MapLibre: stopLocationTracking - not implemented yet');
    },
    waitForLocation: async () => {
      return initialCenter;
    },

    // Marker methods - placeholders for now
    addMarker: async () => { console.log('MapLibre: addMarker - not implemented yet'); },
    removeMarker: async () => { console.log('MapLibre: removeMarker - not implemented yet'); },
    updateMarker: async () => { console.log('MapLibre: updateMarker - not implemented yet'); },
    animateMarker: async () => { console.log('MapLibre: animateMarker - not implemented yet'); },
    showInfoWindow: async () => { console.log('MapLibre: showInfoWindow - not implemented yet'); },
    hideInfoWindow: async () => { console.log('MapLibre: hideInfoWindow - not implemented yet'); },

    // Overlay methods - implemented for route display
    addPolyline: async (polylineConfig: any) => {
      if (!map.current) return;
      
      const { id, coordinates, strokeColor = '#007AFF', strokeWidth = 5, strokeOpacity = 0.8 } = polylineConfig;
      
      // Convert coordinates to GeoJSON format
      const geojsonData = {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: coordinates.map((coord: any) => [coord.longitude, coord.latitude])
        }
      };
      
      // Add source if it doesn't exist
      if (!map.current.getSource(id)) {
        map.current.addSource(id, {
          type: 'geojson',
          data: geojsonData
        });
        
        // Add layer for the route line
        map.current.addLayer({
          id: id,
          type: 'line',
          source: id,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': strokeColor,
            'line-width': strokeWidth,
            'line-opacity': strokeOpacity
          }
        });
      } else {
        // Update existing source
        (map.current.getSource(id) as any).setData(geojsonData);
      }
      
      console.log('MapLibre: Added polyline with', coordinates.length, 'coordinates');
    },
    removePolyline: async (polylineId: string) => {
      if (!map.current) return;
      
      if (map.current.getLayer(polylineId)) {
        map.current.removeLayer(polylineId);
      }
      if (map.current.getSource(polylineId)) {
        map.current.removeSource(polylineId);
      }
      
      console.log('MapLibre: Removed polyline', polylineId);
    },
    updatePolyline: async (polylineConfig: any) => {
      if (!map.current) return;
      
      // Remove and re-add for update
      await (ref as any).current?.removePolyline(polylineConfig.id);
      await (ref as any).current?.addPolyline(polylineConfig);
    },
    addPolygon: async () => { console.log('MapLibre: addPolygon - not implemented yet'); },
    removePolygon: async () => { console.log('MapLibre: removePolygon - not implemented yet'); },
    updatePolygon: async () => { console.log('MapLibre: updatePolygon - not implemented yet'); },
    addCircle: async () => { console.log('MapLibre: addCircle - not implemented yet'); },
    removeCircle: async () => { console.log('MapLibre: removeCircle - not implemented yet'); },
    updateCircle: async () => { console.log('MapLibre: updateCircle - not implemented yet'); },
    addOverlay: async () => { console.log('MapLibre: addOverlay - not implemented yet'); },
    removeOverlay: async () => { console.log('MapLibre: removeOverlay - not implemented yet'); },
    updateOverlay: async () => { console.log('MapLibre: updateOverlay - not implemented yet'); },

    // Utility methods
    coordinateForPoint: async () => {
      return initialCenter;
    },
    pointForCoordinate: async () => {
      return { x: 0, y: 0 };
    },
    takeSnapshot: async () => {
      console.log('MapLibre: takeSnapshot - not implemented yet');
      return '';
    },
    isViewReady: async () => {
      return mapLoaded;
    },
    
    // Route display methods for OSRM integration
    displayRoute: async (coordinates: any[], options: any = {}) => {
      if (!map.current) return;
      
      const { color = '#007AFF', width = 5, opacity = 0.8 } = options;
      const routeId = 'current-route';
      
      // Use the addPolyline method we just implemented
      await (ref as any).current?.addPolyline({
        id: routeId,
        coordinates,
        strokeColor: color,
        strokeWidth: width,
        strokeOpacity: opacity
      });
      
      console.log('MapLibre: Displayed route with', coordinates.length, 'coordinates');
    },
    
    clearRoute: async () => {
      if (!map.current) return;
      
      const routeId = 'current-route';
      await (ref as any).current?.removePolyline(routeId);
      
      console.log('MapLibre: Cleared route');
    },
    
    fitRouteInView: async (coordinates: any[], padding: number = 50) => {
      if (!map.current || !coordinates.length) return;
      
      // Calculate bounds from coordinates
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend([coord.longitude, coord.latitude]);
      }, new (maplibregl as any).LngLatBounds());
      
      // Fit the map to the route bounds
      map.current.fitBounds(bounds, {
        padding: padding,
        maxZoom: 16
      });
      
      console.log('MapLibre: Fitted route in view with', coordinates.length, 'coordinates');
    },
  }), [mapLoaded, initialCenter]);

  // Toggle layer function
  const toggleLayer = () => {
    setCurrentLayer(prev => prev === 'osm' ? 'satellite' : 'osm');
  };

  // Handle zoom in
  const handleZoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
    }
  };

  // Handle zoom out
  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
    }
  };

  if (!mapLibreReady) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🗺️ Loading MapLibre...</Text>
          <Text style={styles.loadingSubtext}>
            Make sure you have installed maplibre-gl: npm install maplibre-gl
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* MapLibre container */}
      <div
        ref={mapContainer}
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Simple controls overlay */}
      <View style={styles.controls}>
        {/* Layer switcher */}
        <TouchableOpacity style={styles.layerButton} onPress={toggleLayer}>
          <Text style={styles.buttonText}>
            {currentLayer === 'osm' ? '🗺️ OSM' : '📡 Satellite'}
          </Text>
        </TouchableOpacity>
        
        {/* Zoom controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
            <Text style={styles.zoomButtonText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Status indicator */}
      {mapLoaded && (
        <View style={styles.statusIndicator}>
          <Text style={styles.statusText}>🟢 MapLibre Ready</Text>
        </View>
      )}
    </View>
  );
});

// Helper function to get map style
const getMapStyle = (layer: 'osm' | 'satellite', customTileUrl?: string) => {
  if (customTileUrl) {
    return {
      version: 8,
      sources: {
        'custom-tiles': {
          type: 'raster',
          tiles: [customTileUrl],
          tileSize: 256,
          attribution: 'Custom tiles',
        },
      },
      layers: [
        {
          id: 'custom-layer',
          type: 'raster',
          source: 'custom-tiles',
        },
      ],
    };
  }

  if (layer === 'satellite') {
    return {
      version: 8,
      sources: {
        'satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        },
      },
      layers: [
        {
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite',
        },
      ],
    };
  }

  // Default OSM style
  return {
    version: 8,
    sources: {
      'osm': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster',
        source: 'osm',
      },
    ],
  };
};

// Helper function to calculate zoom from region
const calculateZoomFromRegion = (region: any): number => {
  // Simple approximation - can be improved
  const latDelta = region.latitudeDelta;
  const lngDelta = region.longitudeDelta;
  const delta = Math.max(latDelta, lngDelta);
  
  if (delta > 10) return 3;
  if (delta > 5) return 5;
  if (delta > 2) return 7;
  if (delta > 1) return 9;
  if (delta > 0.5) return 11;
  if (delta > 0.1) return 13;
  return 15;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
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
  controls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
    zIndex: 1000,
  },
  layerButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  zoomControls: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  zoomButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#2d3748',
  },
});

// Set display name for debugging
MapLibreOSMView.displayName = 'MapLibreOSMView';

export default MapLibreOSMView; 