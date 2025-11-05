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

// Enhanced ref interface with route display functionality
interface CurrentOSMViewRef extends Pick<
  OSMViewRef,
  'zoomIn' | 'zoomOut' | 'setZoom' | 'animateToLocation' | 'getCurrentLocation' | 'waitForLocation' | 'startLocationTracking' | 'stopLocationTracking' | 'setPitch' | 'setBearing' | 'getPitch' | 'getBearing' | 'animateCamera'
> {
  // Route display methods for OSRM integration
  displayRoute?: (coordinates: any[], options?: any) => Promise<void>;
  clearRoute?: () => Promise<void>;
  fitRouteInView?: (coordinates: any[], padding?: number) => Promise<void>;
}

// Get native view manager and native module
let NativeOSMView: any = null;
let NativeOSMModule: any = null;
let isNativeModuleAvailable = false;

try {
  // Modern Expo modules pattern - get the view component directly from the module
  const ExpoOsmSdkModule = requireNativeModule('ExpoOsmSdk');
  NativeOSMModule = ExpoOsmSdkModule;
  
  // For modern Expo modules, the view is available as a component
  // Try to get the view component - it might be available as a property or through requireNativeViewManager
  try {
    NativeOSMView = requireNativeViewManager('ExpoOsmSdk');
  } catch (viewError) {
    console.log('📱 Using module-based view instead of separate view manager');
    // If requireNativeViewManager fails, we'll use the module's view component
    // This will be handled in the component rendering
  }
  
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
  // 1. We have the native module
  // 2. We're NOT in Expo Go
  // 3. We're NOT on web
  isNativeModuleAvailable = !!NativeOSMModule && !isExpoGo && !isWeb;
  
  console.log('Enhanced native module detection:', {
    hasExpoModules,
    hasNativeModule: !!NativeOSMModule,
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
  circles = [] as CircleConfig[],
  polylines = [] as PolylineConfig[],
  polygons = [] as PolygonConfig[],
  showUserLocation = false,
  followUserLocation = false,
  showsCompass = false,
  showsScale = false,
  showsZoomControls = false,
  rotateEnabled = true,
  scrollEnabled = true,
  zoomEnabled = true,
  pitchEnabled = true,
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
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        console.error('❌ Native module not available for getCurrentLocation');
        throw new Error('Native module not available');
      }
      
      console.log('📍 Calling native getCurrentLocation');
      try {
        // Wait for view to be ready before calling location methods
        const isReady = await waitForViewReady();
        if (!isReady) {
          console.error('❌ View not ready for getCurrentLocation');
          throw new Error('OSM view not ready');
        }
        
        const location = await NativeOSMModule.getCurrentLocation();
        console.log('✅ Get current location successful:', location);
        return location;
      } catch (error) {
        console.error('❌ Get location failed:', error);
        throw error;
      }
    },
    startLocationTracking: async () => {
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        console.error('❌ Native module not available for startLocationTracking');
        throw new Error('Native module not available');
      }
      
      console.log('📍 Calling native startLocationTracking');
      try {
        // Wait for view to be ready before calling location methods
        const isReady = await waitForViewReady();
        if (!isReady) {
          console.error('❌ View not ready for startLocationTracking');
          throw new Error('OSM view not ready');
        }
        
        await NativeOSMModule.startLocationTracking();
        console.log('✅ Start location tracking successful');
      } catch (error) {
        console.error('❌ Start location tracking failed:', error);
        throw error;
      }
    },
    stopLocationTracking: async () => {
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        console.error('❌ Native module not available for stopLocationTracking');
        throw new Error('Native module not available');
      }
      
      console.log('📍 Calling native stopLocationTracking');
      try {
        // Wait for view to be ready before calling location methods
        const isReady = await waitForViewReady();
        if (!isReady) {
          console.error('❌ View not ready for stopLocationTracking');
          throw new Error('OSM view not ready');
        }
        
        await NativeOSMModule.stopLocationTracking();
        console.log('✅ Stop location tracking successful');
      } catch (error) {
        console.error('❌ Stop location tracking failed:', error);
        throw error;
      }
    },
    waitForLocation: async (timeoutSeconds: number) => {
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        console.error('❌ Native module not available for waitForLocation');
        throw new Error('Native module not available');
      }
      
      console.log(`📍 Calling native waitForLocation with timeout: ${timeoutSeconds}s`);
      try {
        // Wait for view to be ready before calling location methods
        const isReady = await waitForViewReady();
        if (!isReady) {
          console.error('❌ View not ready for waitForLocation');
          throw new Error('OSM view not ready');
        }
        
        const location = await NativeOSMModule.waitForLocation(timeoutSeconds);
        console.log('✅ Wait for location successful:', location);
        return location;
      } catch (error) {
        console.error('❌ Wait for location failed:', error);
        throw error;
      }
    },
    
    // Route display methods for OSRM integration
    displayRoute: async (coordinates: any[], options: any = {}) => {
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        console.error('❌ Native module not available for displayRoute');
        throw new Error('Native module not available');
      }
      
      console.log(`🛣️ Calling native displayRoute with ${coordinates.length} coordinates`);
      try {
        // Wait for view to be ready
        const isReady = await waitForViewReady();
        if (!isReady) {
          console.error('❌ View not ready for displayRoute');
          throw new Error('OSM view not ready');
        }
        
        await NativeOSMModule.displayRoute(coordinates, options);
        console.log('✅ Display route successful');
      } catch (error) {
        console.error('❌ Display route failed:', error);
        throw error;
      }
    },
    
    clearRoute: async () => {
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        console.error('❌ Native module not available for clearRoute');
        throw new Error('Native module not available');
      }
      
      console.log('🗑️ Calling native clearRoute');
      try {
        // Wait for view to be ready
        const isReady = await waitForViewReady();
        if (!isReady) {
          console.error('❌ View not ready for clearRoute');
          throw new Error('OSM view not ready');
        }
        
        await NativeOSMModule.clearRoute();
        console.log('✅ Clear route successful');
      } catch (error) {
        console.error('❌ Clear route failed:', error);
        throw error;
      }
    },
    
    fitRouteInView: async (coordinates: any[], padding: number = 50) => {
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        console.error('❌ Native module not available for fitRouteInView');
        throw new Error('Native module not available');
      }
      
      console.log(`📍 Calling native fitRouteInView with ${coordinates.length} coordinates`);
      try {
        // Wait for view to be ready
        const isReady = await waitForViewReady();
        if (!isReady) {
          console.error('❌ View not ready for fitRouteInView');
          throw new Error('OSM view not ready');
        }
        
        await NativeOSMModule.fitRouteInView(coordinates, padding);
        console.log('✅ Fit route in view successful');
      } catch (error) {
        console.error('❌ Fit route in view failed:', error);
        throw error;
      }
    },
    
    // Camera orientation methods
    setPitch: async (pitch: number) => {
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        console.error('❌ Native module not available for setPitch');
        throw new Error('Native module not available');
      }
      
      console.log(`📐 Calling native setPitch: ${pitch}`);
      try {
        const isReady = await waitForViewReady();
        if (!isReady) {
          console.error('❌ View not ready for setPitch');
          throw new Error('OSM view not ready');
        }
        
        await NativeOSMModule.setPitch(pitch);
        console.log('✅ Set pitch successful');
      } catch (error) {
        console.error('❌ Set pitch failed:', error);
        throw error;
      }
    },
    
    setBearing: async (bearing: number) => {
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        console.error('❌ Native module not available for setBearing');
        throw new Error('Native module not available');
      }
      
      console.log(`🧭 Calling native setBearing: ${bearing}`);
      try {
        const isReady = await waitForViewReady();
        if (!isReady) {
          console.error('❌ View not ready for setBearing');
          throw new Error('OSM view not ready');
        }
        
        await NativeOSMModule.setBearing(bearing);
        console.log('✅ Set bearing successful');
      } catch (error) {
        console.error('❌ Set bearing failed:', error);
        throw error;
      }
    },
    
    getPitch: async () => {
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        console.error('❌ Native module not available for getPitch');
        throw new Error('Native module not available');
      }
      
      console.log('📐 Calling native getPitch');
      try {
        const isReady = await waitForViewReady();
        if (!isReady) {
          console.error('❌ View not ready for getPitch');
          throw new Error('OSM view not ready');
        }
        
        const pitch = await NativeOSMModule.getPitch();
        console.log('✅ Get pitch successful:', pitch);
        return pitch;
      } catch (error) {
        console.error('❌ Get pitch failed:', error);
        throw error;
      }
    },
    
    getBearing: async () => {
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        console.error('❌ Native module not available for getBearing');
        throw new Error('Native module not available');
      }
      
      console.log('🧭 Calling native getBearing');
      try {
        const isReady = await waitForViewReady();
        if (!isReady) {
          console.error('❌ View not ready for getBearing');
          throw new Error('OSM view not ready');
        }
        
        const bearing = await NativeOSMModule.getBearing();
        console.log('✅ Get bearing successful:', bearing);
        return bearing;
      } catch (error) {
        console.error('❌ Get bearing failed:', error);
        throw error;
      }
    },
    
    animateCamera: async (options: any) => {
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        console.error('❌ Native module not available for animateCamera');
        throw new Error('Native module not available');
      }
      
      console.log('🎥 Calling native animateCamera:', options);
      try {
        const isReady = await waitForViewReady();
        if (!isReady) {
          console.error('❌ View not ready for animateCamera');
          throw new Error('OSM view not ready');
        }
        
        await NativeOSMModule.animateCamera(options);
        console.log('✅ Animate camera successful');
      } catch (error) {
        console.error('❌ Animate camera failed:', error);
        throw error;
      }
    },
  }), [initialZoom, isNativeModuleAvailable]);
  
  // Helper function to wait for view to be ready
  const waitForViewReady = async (maxWaitTime = 10000): Promise<boolean> => {
    if (!isNativeModuleAvailable || !NativeOSMModule) {
      return false;
    }
    
    console.log('⏳ Waiting for OSM view to be ready...');
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const isReady = await NativeOSMModule.isViewReady();
        if (isReady) {
          console.log('✅ OSM view is ready');
          return true;
        }
        
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn('⚠️ Error checking view readiness:', error);
        // If isViewReady is not available, assume view is ready if module is available
        return isNativeModuleAvailable;
      }
    }
    
    console.warn('⚠️ Timeout waiting for OSM view to be ready');
    return false;
  };

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

    // Validate circles coordinates
    try {
      if (circles && Array.isArray(circles)) {
        circles.forEach((circle, index) => {
          try {
            validateCoordinate(circle.center);
          } catch (error) {
            console.error(`OSMView validation error: circles[${index}].center: ${error instanceof Error ? error.message : error}`);
          }
        });
      }
    } catch (error) {
      console.error('OSMView circles validation error:', error);
    }

    // Validate polylines coordinates
    try {
      if (polylines && Array.isArray(polylines)) {
        polylines.forEach((polyline, polylineIndex) => {
          if (polyline.coordinates && Array.isArray(polyline.coordinates)) {
            polyline.coordinates.forEach((coordinate, coordIndex) => {
              try {
                validateCoordinate(coordinate);
              } catch (error) {
                console.error(`OSMView validation error: polylines[${polylineIndex}].coordinates[${coordIndex}]: ${error instanceof Error ? error.message : error}`);
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('OSMView polylines validation error:', error);
    }

    // Validate polygons coordinates
    try {
      if (polygons && Array.isArray(polygons)) {
        polygons.forEach((polygon, polygonIndex) => {
          if (polygon.coordinates && Array.isArray(polygon.coordinates)) {
            polygon.coordinates.forEach((coordinate, coordIndex) => {
              try {
                validateCoordinate(coordinate);
              } catch (error) {
                console.error(`OSMView validation error: polygons[${polygonIndex}].coordinates[${coordIndex}]: ${error instanceof Error ? error.message : error}`);
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('OSMView polygons validation error:', error);
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

  // If we don't have a native view manager but have the module, try to create the view directly
  if (!NativeOSMView && NativeOSMModule) {
    console.warn('⚠️ NativeOSMView not available, but module exists. This might indicate a module definition issue.');
    console.log('🔧 Available module methods:', Object.getOwnPropertyNames(NativeOSMModule));
    
    return (
      <View style={[styles.container, style]} testID="osm-view-debug">
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>🔧 Debug Mode</Text>
          <Text style={styles.fallbackText}>
            Native module loaded but view component not available.
          </Text>
          <Text style={styles.fallbackSubtext}>
            This indicates the View definition in the native module may not be working correctly.
          </Text>
          <View style={styles.coordinateInfo}>
            <Text style={styles.coordinateText}>
              Module: {NativeOSMModule ? '✅ Available' : '❌ Missing'}
            </Text>
            <Text style={styles.coordinateText}>
              View: {NativeOSMView ? '✅ Available' : '❌ Missing'}
            </Text>
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
        circles={circles}
        polylines={polylines}
        polygons={polygons}
        onMapReady={handleMapReady}
        onRegionChange={handleRegionChange}
        onMarkerPress={handleMarkerPress}
        onPress={handlePress}
        showUserLocation={showUserLocation}
        followUserLocation={followUserLocation}
        showsCompass={showsCompass}
        showsScale={showsScale}
        showsZoomControls={showsZoomControls}
        rotateEnabled={rotateEnabled}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        pitchEnabled={pitchEnabled}
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