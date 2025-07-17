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
  MapRegion
} from '../types';
import { DEFAULT_CONFIG, isVectorTileUrl } from '../types';
import { validateCoordinate, validateMarkerConfig } from '../utils/coordinate';

// Simplified ref interface using our complete OSMViewRef for location functionality
interface CurrentOSMViewRef extends Pick<
  OSMViewRef,
  'zoomIn' | 'zoomOut' | 'setZoom' | 'animateToLocation' | 'getCurrentLocation' | 'waitForLocation' | 'startLocationTracking' | 'stopLocationTracking'
> {}

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
  showUserLocation = false,
  followUserLocation = false,
  onMapReady,
  onRegionChange,
  onMarkerPress,
  onPress,
  onUserLocationChange,
}, ref) => {
  const nativeViewRef = React.useRef<any>(null);

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
    return (
      <View style={[styles.container, style]} testID="osm-view-fallback">
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>📍 OpenStreetMap View</Text>
          <Text style={styles.fallbackText}>
            {Platform.OS === 'web' 
              ? 'Web platform requires a different map implementation' 
              : 'This app requires a development build to display maps'}
          </Text>
          <Text style={styles.fallbackSubtext}>
            {Platform.OS === 'web'
              ? 'Consider using react-native-web compatible map libraries for web support'
              : 'Expo Go does not support custom native modules. Please create a development build.'}
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
        markers={markers}
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