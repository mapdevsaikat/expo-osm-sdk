import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { requireNativeViewManager, requireNativeModule } from 'expo-modules-core';

// Import types and utilities
import type { 
  OSMViewProps, 
  OSMViewRef,
  MarkerConfig,
  PolylineConfig,
  PolygonConfig,
  CircleConfig,
  OverlayConfig,
  Coordinate,
  MapRegion,
  MarkerAnimation
} from '../types';
import { DEFAULT_CONFIG, isVectorTileUrl } from '../types';
import { validateCoordinate, validateMarkerConfig } from '../utils/coordinate';
import { ExpoGoFallback } from './ExpoGoFallback';

// Use the complete OSMViewRef interface
type CurrentOSMViewRef = OSMViewRef;

// Get native view manager and native module
let NativeOSMView: any = null;
let NativeOSMModule: any = null;
let isNativeModuleAvailable = false;

try {
  NativeOSMView = requireNativeViewManager('ExpoOsmSdk');
  NativeOSMModule = requireNativeModule('ExpoOsmSdk');
  
  // More robust native module detection
  // Check if we're in a proper native environment
  const hasExpoModules = !!(global as any).ExpoModules;
  
  // Better Expo Go detection - check for development client vs Expo Go
  // In development builds, Constants.executionEnvironment will be different
  let isExpoGo = false;
  try {
    const Constants = require('expo-constants').default;
    // In Expo Go: executionEnvironment is 'expoGo'
    // In development builds: executionEnvironment is 'development' or similar
    isExpoGo = Constants.executionEnvironment === 'expoGo';
  } catch {
    // Fallback to old detection if Constants is not available
    isExpoGo = !!(global as any).expo;
  }
  
  const isWeb = Platform.OS === 'web';
  
  // Module is available if:
  // 1. We have ExpoModules OR we have the native view
  // 2. We're NOT in Expo Go
  // 3. We're NOT on web
  isNativeModuleAvailable = (hasExpoModules || !!NativeOSMView) && !isExpoGo && !isWeb;
  
  console.log('Native module detection:', {
    hasExpoModules,
    hasNativeView: !!NativeOSMView,
    isExpoGo,
    isNativeModuleAvailable,
    isWeb,
    platform: Platform.OS
  });

} catch (error) {
  // Native module not available (e.g., in Expo Go or web)
  console.warn('ExpoOsmSdk native module not available:', error);
  isNativeModuleAvailable = false;
}

// Using imported validateCoordinate from utils

export const TILE_CONFIGS = {
  raster: {
    name: 'OpenStreetMap Raster',
    type: 'Raster' as const,
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  vector: {
    name: 'Carto',
    type: 'Vector' as const,
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    // Backup URL in case the primary fails
    backupUrl: 'https://maps.tilehosting.com/styles/basic/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
  }
} as const;

const OSMView = forwardRef<CurrentOSMViewRef, OSMViewProps>(({
  style,
  initialCenter = { latitude: 0, longitude: 0 },
  initialZoom = 10,
  tileServerUrl = DEFAULT_CONFIG.tileServerUrl, // Use vector tiles by default
  styleUrl = DEFAULT_CONFIG.styleUrl, // Add styleUrl support
  markers = [],
  polylines = [],
  polygons = [],
  circles = [],
  overlays = [],
  clustering,
  showUserLocation = false,
  followUserLocation = false,
  onMapReady,
  onRegionChange,
  onMarkerPress,
  onPress,
  onUserLocationChange,
  children,
}, ref) => {
  const nativeViewRef = React.useRef<any>(null);

  // Process children to extract component data
  const processedData = React.useMemo(() => {
    if (!children) {
      return { markers, polylines, polygons, circles, overlays };
    }

    const extractedMarkers: MarkerConfig[] = [...markers];
    const extractedPolylines: PolylineConfig[] = [...polylines];
    const extractedPolygons: PolygonConfig[] = [...polygons];
    const extractedCircles: CircleConfig[] = [...circles];
    const extractedOverlays: OverlayConfig[] = [...overlays];

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
          } as MarkerConfig);
          break;
        case 'Polyline':
          extractedPolylines.push({
            id: props.id || `polyline-${index}`,
            ...props,
          } as PolylineConfig);
          break;
        case 'Polygon':
          extractedPolygons.push({
            id: props.id || `polygon-${index}`,
            ...props,
          } as PolygonConfig);
          break;
        case 'Circle':
          extractedCircles.push({
            id: props.id || `circle-${index}`,
            ...props,
          } as CircleConfig);
          break;
        case 'CustomOverlay':
          extractedOverlays.push({
            id: props.id || `overlay-${index}`,
            component: props.children,
            ...props,
          } as OverlayConfig);
          break;
      }
    });

    return {
      markers: extractedMarkers,
      polylines: extractedPolylines,
      polygons: extractedPolygons,
      circles: extractedCircles,
      overlays: extractedOverlays,
    };
  }, [children]);

  // Add debugging for tile URL changes
  React.useEffect(() => {
    console.log('🔧 OSMView: tileServerUrl prop changed:', {
      tileServerUrl,
      isVector: tileServerUrl ? isVectorTileUrl(tileServerUrl) : false,
      timestamp: new Date().toISOString()
    });
    
    // Check if we're actually passing this to native
    if (nativeViewRef.current) {
      console.log('📱 OSMView: Native view ref exists, should trigger native update');
    } else {
      console.log('⚠️ OSMView: Native view ref is null, native update may not happen');
    }
  }, [tileServerUrl]);

  // Add debugging for when native view is ready
  React.useEffect(() => {
    if (nativeViewRef.current) {
      console.log('✅ OSMView: Native view ref initialized');
    }
  }, []);

  // Expose imperative methods via ref
  useImperativeHandle(ref, () => ({
    // Zoom controls
    zoomIn: async () => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🔍 Calling native zoomIn');
        try {
          await NativeOSMModule.zoomIn();
          console.log('✅ Zoom In successful');
        } catch (error) {
          console.error('❌ Zoom In failed:', error);
          throw error;
        }
      }
    },
    zoomOut: async () => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🔍 Calling native zoomOut');
        try {
          await NativeOSMModule.zoomOut();
          console.log('✅ Zoom Out successful');
        } catch (error) {
          console.error('❌ Zoom Out failed:', error);
          throw error;
        }
      }
    },
    setZoom: async (zoom: number) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🔍 Calling native setZoom:', zoom);
        try {
          await NativeOSMModule.setZoom(zoom);
          console.log('✅ Set Zoom successful');
        } catch (error) {
          console.error('❌ Set Zoom failed:', error);
          throw error;
        }
      }
    },
    
    // Camera controls
    animateToLocation: async (latitude: number, longitude: number, zoom = initialZoom) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📍 Calling native animateToLocation:', latitude, longitude, zoom);
        try {
          await NativeOSMModule.animateToLocation(latitude, longitude, zoom);
          console.log('✅ Animate to location successful');
        } catch (error) {
          console.error('❌ Location animation failed:', error);
          throw error;
        }
      }
    },
    
    // Pitch & Bearing controls
    setPitch: async (pitch: number) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🎯 Calling native setPitch:', pitch);
        try {
          await NativeOSMModule.setPitch(pitch);
          console.log('✅ Set pitch successful');
        } catch (error) {
          console.error('❌ Set pitch failed:', error);
          throw error;
        }
      }
    },
    setBearing: async (bearing: number) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🧭 Calling native setBearing:', bearing);
        try {
          await NativeOSMModule.setBearing(bearing);
          console.log('✅ Set bearing successful');
        } catch (error) {
          console.error('❌ Set bearing failed:', error);
          throw error;
        }
      }
    },
    getPitch: async () => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🎯 Calling native getPitch');
        try {
          const pitch = await NativeOSMModule.getPitch();
          console.log('✅ Get pitch successful:', pitch);
          return pitch;
        } catch (error) {
          console.error('❌ Get pitch failed:', error);
          throw error;
        }
      }
      return 0;
    },
    getBearing: async () => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🧭 Calling native getBearing');
        try {
          const bearing = await NativeOSMModule.getBearing();
          console.log('✅ Get bearing successful:', bearing);
          return bearing;
        } catch (error) {
          console.error('❌ Get bearing failed:', error);
          throw error;
        }
      }
      return 0;
    },
    animateToRegion: async (region: MapRegion, duration = 1000) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📍 Calling native animateToRegion:', region, duration);
        try {
          await NativeOSMModule.animateToRegion(region, duration);
          console.log('✅ Animate to region successful');
        } catch (error) {
          console.error('❌ Region animation failed:', error);
          throw error;
        }
      }
    },
    fitToMarkers: async (markerIds?: string[], padding = 50) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📍 Calling native fitToMarkers:', markerIds, padding);
        try {
          await NativeOSMModule.fitToMarkers(markerIds, padding);
          console.log('✅ Fit to markers successful');
        } catch (error) {
          console.error('❌ Fit to markers failed:', error);
          throw error;
        }
      }
    },
    
    // Location services
    getCurrentLocation: async () => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📍 Calling native getCurrentLocation');
        try {
          const location = await NativeOSMModule.getCurrentLocation();
          console.log('✅ Get current location successful:', location);
          return location;
        } catch (error) {
          console.error('❌ Get location failed:', error);
          throw error;
        }
      }
      // Return initial center as fallback
      return initialCenter;
    },
    startLocationTracking: async () => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📍 Calling native startLocationTracking');
        try {
          await NativeOSMModule.startLocationTracking();
          console.log('✅ Start location tracking successful');
        } catch (error) {
          console.error('❌ Start location tracking failed:', error);
          throw error;
        }
      }
    },
    stopLocationTracking: async () => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📍 Calling native stopLocationTracking');
        try {
          await NativeOSMModule.stopLocationTracking();
          console.log('✅ Stop location tracking successful');
        } catch (error) {
          console.error('❌ Stop location tracking failed:', error);
          throw error;
        }
      }
    },
    waitForLocation: async (timeoutSeconds: number) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log(`📍 Calling native waitForLocation with timeout: ${timeoutSeconds}s`);
        try {
          const location = await NativeOSMModule.waitForLocation(timeoutSeconds);
          console.log('✅ Wait for location successful:', location);
          return location;
        } catch (error) {
          console.error('❌ Wait for location failed:', error);
          throw error;
        }
      }
      // Return initial center as fallback
      return initialCenter;
    },
    
    // Marker controls
    addMarker: async (marker: MarkerConfig) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📌 Calling native addMarker:', marker);
        try {
          await NativeOSMModule.addMarker(marker);
          console.log('✅ Add marker successful');
        } catch (error) {
          console.error('❌ Add marker failed:', error);
          throw error;
        }
      }
    },
    removeMarker: async (markerId: string) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📌 Calling native removeMarker:', markerId);
        try {
          await NativeOSMModule.removeMarker(markerId);
          console.log('✅ Remove marker successful');
        } catch (error) {
          console.error('❌ Remove marker failed:', error);
          throw error;
        }
      }
    },
    updateMarker: async (markerId: string, updates: Partial<MarkerConfig>) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📌 Calling native updateMarker:', markerId, updates);
        try {
          await NativeOSMModule.updateMarker(markerId, updates);
          console.log('✅ Update marker successful');
        } catch (error) {
          console.error('❌ Update marker failed:', error);
          throw error;
        }
      }
    },
    showInfoWindow: async (markerId: string) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📌 Calling native showInfoWindow:', markerId);
        try {
          await NativeOSMModule.showInfoWindow(markerId);
          console.log('✅ Show info window successful');
        } catch (error) {
          console.error('❌ Show info window failed:', error);
          throw error;
        }
      }
    },
    hideInfoWindow: async (markerId: string) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📌 Calling native hideInfoWindow:', markerId);
        try {
          await NativeOSMModule.hideInfoWindow(markerId);
          console.log('✅ Hide info window successful');
        } catch (error) {
          console.error('❌ Hide info window failed:', error);
          throw error;
        }
      }
    },
    
    // Overlay controls  
    addPolyline: async (polyline: PolylineConfig) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📐 Calling native addPolyline:', polyline);
        try {
          await NativeOSMModule.addPolyline(polyline);
          console.log('✅ Add polyline successful');
        } catch (error) {
          console.error('❌ Add polyline failed:', error);
          throw error;
        }
      }
    },
    removePolyline: async (polylineId: string) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📐 Calling native removePolyline:', polylineId);
        try {
          await NativeOSMModule.removePolyline(polylineId);
          console.log('✅ Remove polyline successful');
        } catch (error) {
          console.error('❌ Remove polyline failed:', error);
          throw error;
        }
      }
    },
    addPolygon: async (polygon: PolygonConfig) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📐 Calling native addPolygon:', polygon);
        try {
          await NativeOSMModule.addPolygon(polygon);
          console.log('✅ Add polygon successful');
        } catch (error) {
          console.error('❌ Add polygon failed:', error);
          throw error;
        }
      }
    },
    removePolygon: async (polygonId: string) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📐 Calling native removePolygon:', polygonId);
        try {
          await NativeOSMModule.removePolygon(polygonId);
          console.log('✅ Remove polygon successful');
        } catch (error) {
          console.error('❌ Remove polygon failed:', error);
          throw error;
        }
      }
    },
    addCircle: async (circle: CircleConfig) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('⭕ Calling native addCircle:', circle);
        try {
          await NativeOSMModule.addCircle(circle);
          console.log('✅ Add circle successful');
        } catch (error) {
          console.error('❌ Add circle failed:', error);
          throw error;
        }
      }
    },
    removeCircle: async (circleId: string) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('⭕ Calling native removeCircle:', circleId);
        try {
          await NativeOSMModule.removeCircle(circleId);
          console.log('✅ Remove circle successful');
        } catch (error) {
          console.error('❌ Remove circle failed:', error);
          throw error;
        }
      }
    },
    
    // Missing marker methods
    animateMarker: async (markerId: string, animation: MarkerAnimation) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🎭 Calling native animateMarker:', markerId, animation);
        try {
          await NativeOSMModule.animateMarker(markerId, animation);
          console.log('✅ Animate marker successful');
        } catch (error) {
          console.error('❌ Animate marker failed:', error);
          throw error;
        }
      }
    },
    
    // Missing overlay update methods
    updatePolyline: async (polylineId: string, updates: Partial<PolylineConfig>) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📝 Calling native updatePolyline:', polylineId, updates);
        try {
          await NativeOSMModule.updatePolyline(polylineId, updates);
          console.log('✅ Update polyline successful');
        } catch (error) {
          console.error('❌ Update polyline failed:', error);
          throw error;
        }
      }
    },
    
    updatePolygon: async (polygonId: string, updates: Partial<PolygonConfig>) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📝 Calling native updatePolygon:', polygonId, updates);
        try {
          await NativeOSMModule.updatePolygon(polygonId, updates);
          console.log('✅ Update polygon successful');
        } catch (error) {
          console.error('❌ Update polygon failed:', error);
          throw error;
        }
      }
    },
    
    updateCircle: async (circleId: string, updates: Partial<CircleConfig>) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📝 Calling native updateCircle:', circleId, updates);
        try {
          await NativeOSMModule.updateCircle(circleId, updates);
          console.log('✅ Update circle successful');
        } catch (error) {
          console.error('❌ Update circle failed:', error);
          throw error;
        }
      }
    },
    
    // Missing overlay methods
    addOverlay: async (overlay: OverlayConfig) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('➕ Calling native addOverlay:', overlay);
        try {
          await NativeOSMModule.addOverlay(overlay);
          console.log('✅ Add overlay successful');
        } catch (error) {
          console.error('❌ Add overlay failed:', error);
          throw error;
        }
      }
    },
    
    removeOverlay: async (overlayId: string) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('➖ Calling native removeOverlay:', overlayId);
        try {
          await NativeOSMModule.removeOverlay(overlayId);
          console.log('✅ Remove overlay successful');
        } catch (error) {
          console.error('❌ Remove overlay failed:', error);
          throw error;
        }
      }
    },
    
    updateOverlay: async (overlayId: string, updates: Partial<OverlayConfig>) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📝 Calling native updateOverlay:', overlayId, updates);
        try {
          await NativeOSMModule.updateOverlay(overlayId, updates);
          console.log('✅ Update overlay successful');
        } catch (error) {
          console.error('❌ Update overlay failed:', error);
          throw error;
        }
      }
    },
    
    // Missing coordinate conversion methods
    coordinateForPoint: async (point: { x: number; y: number }) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🗺️ Calling native coordinateForPoint:', point);
        try {
          const coordinate = await NativeOSMModule.coordinateForPoint(point);
          console.log('✅ Coordinate for point successful');
          return coordinate;
        } catch (error) {
          console.error('❌ Coordinate for point failed:', error);
          throw error;
        }
      }
      return { latitude: 0, longitude: 0 };
    },
    
    pointForCoordinate: async (coordinate: Coordinate) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📍 Calling native pointForCoordinate:', coordinate);
        try {
          const point = await NativeOSMModule.pointForCoordinate(coordinate);
          console.log('✅ Point for coordinate successful');
          return point;
        } catch (error) {
          console.error('❌ Point for coordinate failed:', error);
          throw error;
        }
      }
      return { x: 0, y: 0 };
    },
    
    // Map utilities
    takeSnapshot: async (format: 'png' | 'jpg' = 'png', quality = 1.0) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📷 Calling native takeSnapshot:', format, quality);
        try {
          const snapshot = await NativeOSMModule.takeSnapshot(format, quality);
          console.log('✅ Take snapshot successful');
          return snapshot;
        } catch (error) {
          console.error('❌ Take snapshot failed:', error);
          throw error;
        }
      }
      return '';
    },
    
    // Layer controls
    setBaseLayer: async (layerId: string, layerConfig: any) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🗺️ Calling native setBaseLayer:', layerId, layerConfig);
        try {
          await NativeOSMModule.setBaseLayer(layerId, layerConfig);
          console.log('✅ Set base layer successful');
        } catch (error) {
          console.error('❌ Set base layer failed:', error);
          throw error;
        }
      }
    },
    addLayer: async (layerConfig: any) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🗺️ Calling native addLayer:', layerConfig);
        try {
          await NativeOSMModule.addLayer(layerConfig);
          console.log('✅ Add layer successful');
        } catch (error) {
          console.error('❌ Add layer failed:', error);
          throw error;
        }
      }
    },
    removeLayer: async (layerId: string) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🗺️ Calling native removeLayer:', layerId);
        try {
          await NativeOSMModule.removeLayer(layerId);
          console.log('✅ Remove layer successful');
        } catch (error) {
          console.error('❌ Remove layer failed:', error);
          throw error;
        }
      }
    },
    toggleLayer: async (layerId: string, visible: boolean) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🗺️ Calling native toggleLayer:', layerId, visible);
        try {
          await NativeOSMModule.toggleLayer(layerId, visible);
          console.log('✅ Toggle layer successful');
        } catch (error) {
          console.error('❌ Toggle layer failed:', error);
          throw error;
        }
      }
    },
    setLayerOpacity: async (layerId: string, opacity: number) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🗺️ Calling native setLayerOpacity:', layerId, opacity);
        try {
          await NativeOSMModule.setLayerOpacity(layerId, opacity);
          console.log('✅ Set layer opacity successful');
        } catch (error) {
          console.error('❌ Set layer opacity failed:', error);
          throw error;
        }
      }
    },
    getActiveLayers: async () => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🗺️ Calling native getActiveLayers');
        try {
          const layers = await NativeOSMModule.getActiveLayers();
          console.log('✅ Get active layers successful:', layers);
          return layers;
        } catch (error) {
          console.error('❌ Get active layers failed:', error);
          throw error;
        }
      }
      return [];
    },
    getLayerInfo: async (layerId: string) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🗺️ Calling native getLayerInfo:', layerId);
        try {
          const layerInfo = await NativeOSMModule.getLayerInfo(layerId);
          console.log('✅ Get layer info successful:', layerInfo);
          return layerInfo;
        } catch (error) {
          console.error('❌ Get layer info failed:', error);
          throw error;
        }
      }
      return null;
    },
  }), [initialZoom, isNativeModuleAvailable]);
  
  // Validation
  try {
    validateCoordinate(initialCenter);
  } catch (error) {
    throw new Error(`initialCenter: ${error instanceof Error ? error.message : error}`);
  }
  
  const validateZoom = (zoom: number, propName: string): void => {
    if (typeof zoom !== 'number' || zoom < 1 || zoom > 20) {
      throw new Error(`${propName} must be a number between 1 and 20`);
    }
  };
  
  validateZoom(initialZoom, 'initialZoom');
  
  if (__DEV__) {
    try {
      if (markers && Array.isArray(markers)) {
        markers.forEach((marker, index) => {
          try {
            validateCoordinate(marker.coordinate);
          } catch (error) {
            throw new Error(`markers[${index}].coordinate: ${error instanceof Error ? error.message : error}`);
          }
        });
      }
    } catch (error) {
      console.error('OSMView validation error:', error);
    }
  }

  // Event handlers for native view
  const handleMapReady = () => {
    onMapReady?.();
  };

  const handleRegionChange = (event: any) => {
    const region = event.nativeEvent;
    onRegionChange?.(region);
  };

  const handleMarkerPress = (event: any) => {
    const { markerId, coordinate } = event.nativeEvent;
    onMarkerPress?.(markerId, coordinate || { latitude: 0, longitude: 0 });
  };

  const handlePress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    onPress?.(coordinate);
  };

  const handleUserLocationChange = (event: any) => {
    const { latitude, longitude } = event.nativeEvent;
    onUserLocationChange?.({ 
      latitude, 
      longitude
    });
  };

  // Check if native module is available
  if (!isNativeModuleAvailable) {
    // For Expo Go, use enhanced interactive fallback
    if (Platform.OS !== 'web') {
      return (
        <ExpoGoFallback
          ref={ref}
          style={style || {}}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          markers={processedData.markers}
          polylines={processedData.polylines}
          polygons={processedData.polygons}
          circles={processedData.circles}
          overlays={processedData.overlays}
          {...(clustering && { clustering })}
          showUserLocation={showUserLocation}
          followUserLocation={followUserLocation}
          onMapReady={onMapReady || (() => {})}
          onRegionChange={onRegionChange || (() => {})}
          onMarkerPress={onMarkerPress || (() => {})}
          onPress={onPress || (() => {})}
          onUserLocationChange={onUserLocationChange || (() => {})}
          children={children}
        />
      );
    }
    
    // For web, show simple message since web support is handled by OSMView.web.tsx
    return (
      <View style={[styles.container, style]} testID="osm-view-fallback">
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>📍 OpenStreetMap View</Text>
          <Text style={styles.fallbackText}>
            Web platform support is handled by OSMView.web.tsx
          </Text>
          <View style={styles.coordinateInfo}>
            <Text style={styles.coordinateText}>
              📍 Center: {initialCenter.latitude.toFixed(4)}, {initialCenter.longitude.toFixed(4)}
            </Text>
            <Text style={styles.coordinateText}>🔍 Zoom: {initialZoom}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} testID="osm-view">
      <NativeOSMView
        ref={nativeViewRef}
        style={styles.map}
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        tileServerUrl={tileServerUrl}
        styleUrl={styleUrl}
        markers={processedData.markers}
        polylines={processedData.polylines}
        polygons={processedData.polygons}
        circles={processedData.circles}
        overlays={processedData.overlays}
        clustering={clustering}
        onMapReady={handleMapReady}
        onRegionChange={handleRegionChange}
        onMarkerPress={handleMarkerPress}
        onPress={handlePress}
        showUserLocation={showUserLocation}
        followUserLocation={followUserLocation}
        onUserLocationChange={handleUserLocationChange}
      />
    </View>
  );
});

OSMView.displayName = 'OSMView';

export { OSMView };
export default OSMView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
    fontSize: 14,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderColor: '#b3d9ff',
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    margin: 10,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 16,
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  coordinateInfo: {
    backgroundColor: '#edf2f7',
    padding: 12,
    borderRadius: 8,
    minWidth: 200,
  },
  coordinateText: {
    fontSize: 14,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
}); 