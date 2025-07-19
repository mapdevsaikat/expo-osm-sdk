import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { OSMViewProps, OSMViewRef, Coordinate, MapRegion } from '../types';
import AttributionControl from './AttributionControl';

// Dynamic import for MapLibre GL JS (web only)
let maplibregl: any = null;
if (Platform.OS === 'web') {
  try {
    maplibregl = require('maplibre-gl');
    // Import MapLibre GL CSS for proper rendering
    require('maplibre-gl/dist/maplibre-gl.css');
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
  showAttribution = true,
  attributionPosition = 'bottom-right',
  customAttribution = [],
  onMapReady,
  onRegionChange,
  onMarkerPress,
  onPress,
  onUserLocationChange,
  children
}, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
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
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported by this browser'));
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              timestamp: position.timestamp,
              source: 'gps' as const
            });
          },
          (error) => {
            let errorMessage = '';
            let shouldFallback = false;
            
            switch (error.code) {
              case 1: // PERMISSION_DENIED
                errorMessage = 'Location access denied by user. Please enable location access in browser settings.';
                shouldFallback = true;
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage = 'Location unavailable. GPS/Network location services may be disabled.';
                shouldFallback = true;
                break;
              case 3: // TIMEOUT
                errorMessage = 'Location request timed out. Please try again.';
                shouldFallback = true;
                break;
              default:
                errorMessage = `Location error: ${error.message}`;
                shouldFallback = true;
            }
            
            if (shouldFallback) {
              // Graceful fallback to map center
              const center = mapRef.current?.getCenter();
              if (center) {
                console.warn(`🌐 Web GPS: ${errorMessage} Using map center as fallback.`);
                resolve({
                  latitude: center.lat,
                  longitude: center.lng,
                  accuracy: 0,
                  timestamp: Date.now(),
                  source: 'map-center' as const,
                  error: errorMessage
                });
              } else {
                reject(new Error(`${errorMessage} Map center also unavailable.`));
              }
            } else {
              reject(new Error(errorMessage));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });
    },
    waitForLocation: async (timeoutSeconds = 10) => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        
        const timeout = setTimeout(() => {
          reject(new Error(`Location timeout after ${timeoutSeconds} seconds`));
        }, timeoutSeconds * 1000);
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeout);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              timestamp: position.timestamp,
              source: 'gps' as const
            });
          },
          (error) => {
            clearTimeout(timeout);
            
            let errorMessage = '';
            switch (error.code) {
              case 1: // PERMISSION_DENIED
                errorMessage = 'Location access denied. Please enable location permissions in browser settings.';
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage = 'Location unavailable. Check if GPS/Network location services are enabled.';
                break;
              case 3: // TIMEOUT
                errorMessage = `Location request timed out after ${timeoutSeconds} seconds.`;
                break;
              default:
                errorMessage = `GPS error: ${error.message}`;
            }
            
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: timeoutSeconds * 1000,
            maximumAge: 0 // Force fresh location
          }
        );
      });
    },
    startLocationTracking: async () => {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported by this browser');
      }
      
      // Clear any existing watch
      if ((window as any).__osmLocationWatchId) {
        navigator.geolocation.clearWatch((window as any).__osmLocationWatchId);
      }
      
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
                         accuracy: position.coords.accuracy,
             altitude: position.coords.altitude,
             timestamp: position.timestamp,
             source: 'gps' as const
           };
           
           if (onUserLocationChange) {
             onUserLocationChange(location);
           }
          
          // Show user location on map if enabled
          if (showUserLocation && mapRef.current && maplibregl) {
            // Add or update user location marker
            if (!(window as any).__osmUserLocationMarker) {
              (window as any).__osmUserLocationMarker = new maplibregl.Marker({
                color: '#4285F4'
              })
                .setLngLat([location.longitude, location.latitude])
                .addTo(mapRef.current);
            } else {
              (window as any).__osmUserLocationMarker.setLngLat([location.longitude, location.latitude]);
            }
            
            // Follow user location if enabled
            if (followUserLocation) {
              mapRef.current.easeTo({
                center: [location.longitude, location.latitude],
                duration: 1000
              });
            }
          }
        },
                 (error) => {
           let errorMessage = '';
           switch (error.code) {
             case 1: // PERMISSION_DENIED
               errorMessage = 'Location tracking denied. Please enable location permissions to track user movement.';
               break;
             case 2: // POSITION_UNAVAILABLE
               errorMessage = 'Location tracking unavailable. GPS/Network services may be disabled.';
               break;
             case 3: // TIMEOUT
               errorMessage = 'Location tracking timeout. GPS signal may be weak.';
               break;
             default:
               errorMessage = `Location tracking error: ${error.message}`;
           }
           console.error('🌐 Web Location Tracking:', errorMessage);
           
           // Optionally notify the app about tracking errors
           if (onUserLocationChange) {
             // You could emit an error event here if needed
           }
         },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 15000
        }
      );
      
      (window as any).__osmLocationWatchId = watchId;
      console.log('🌐 Web location tracking started with real GPS');
    },
    stopLocationTracking: async () => {
      if ((window as any).__osmLocationWatchId) {
        navigator.geolocation.clearWatch((window as any).__osmLocationWatchId);
        (window as any).__osmLocationWatchId = null;
      }
      
      // Remove user location marker
      if ((window as any).__osmUserLocationMarker) {
        (window as any).__osmUserLocationMarker.remove();
        (window as any).__osmUserLocationMarker = null;
      }
      
      console.log('🌐 Web location tracking stopped');
    },
    fitToMarkers: async (markerIds?: string[], padding = 50) => {
      if (!mapRef.current || markersRef.current.size === 0 || !maplibregl) return;
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
    addMarker: async (markerConfig: any) => {
      if (!mapRef.current || !maplibregl) return;
      
      try {
        const { id, coordinate, title, description, color = '#FF0000' } = markerConfig;
        
        // Create marker element
        const markerElement = document.createElement('div');
        markerElement.innerHTML = `
          <div style="
            width: 20px; 
            height: 20px; 
            border-radius: 50%; 
            background-color: ${color}; 
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          "></div>
        `;
        
        // Create MapLibre marker
        const marker = new maplibregl.Marker(markerElement)
          .setLngLat([coordinate.longitude, coordinate.latitude])
          .addTo(mapRef.current);
        
        // Add click event
        markerElement.addEventListener('click', () => {
          onMarkerPress?.(id, coordinate);
        });
        
        // Store marker reference
        markersRef.current.set(id, marker);
        
        console.log(`📍 Web marker added: ${id}`);
      } catch (error) {
        console.error('❌ Failed to add web marker:', error);
      }
    },
    removeMarker: async (markerId: string) => {
      if (!markersRef.current.has(markerId)) return;
      
      try {
        const marker = markersRef.current.get(markerId);
        marker.remove();
        markersRef.current.delete(markerId);
        console.log(`📍 Web marker removed: ${markerId}`);
      } catch (error) {
        console.error('❌ Failed to remove web marker:', error);
      }
    },
    updateMarker: async (markerId: string, updates: any) => {
      if (!markersRef.current.has(markerId)) return;
      
      try {
        const marker = markersRef.current.get(markerId);
        
        // Update position if provided
        if (updates.coordinate) {
          marker.setLngLat([updates.coordinate.longitude, updates.coordinate.latitude]);
        }
        
        // Update other properties would require recreating the marker
        // For now, we'll just update position
        console.log(`📍 Web marker updated: ${markerId}`);
      } catch (error) {
        console.error('❌ Failed to update web marker:', error);
      }
    },
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

  // Handle markers prop changes
  useEffect(() => {
    if (!mapRef.current || !maplibregl || !isInitialized.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add new markers
    markers.forEach((markerConfig: any) => {
      if (markerConfig.coordinate && markerConfig.id) {
        try {
          const { id, coordinate, title, description, color = '#FF0000' } = markerConfig;
          
          // Create marker element
          const markerElement = document.createElement('div');
          markerElement.innerHTML = `
            <div style="
              width: 20px; 
              height: 20px; 
              border-radius: 50%; 
              background-color: ${color}; 
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
            "></div>
          `;
          
          // Create MapLibre marker
          const marker = new maplibregl.Marker(markerElement)
            .setLngLat([coordinate.longitude, coordinate.latitude])
            .addTo(mapRef.current);
          
          // Add click event
          markerElement.addEventListener('click', () => {
            onMarkerPress?.(id, coordinate);
          });
          
          // Store marker reference
          markersRef.current.set(id, marker);
        } catch (error) {
          console.error('❌ Failed to create web marker:', error);
        }
      }
    });
    
    console.log(`🗺️ Web: ${markers.length} markers rendered`);
  }, [markers, onMarkerPress]);

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
      
      {/* Mandatory Attribution Control */}
      {showAttribution && (
        <AttributionControl
          position={attributionPosition}
          customAttribution={customAttribution}
          mandatory={true}
        />
      )}
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