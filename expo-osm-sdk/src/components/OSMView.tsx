import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Platform, UIManager, findNodeHandle } from 'react-native';
import { requireNativeViewManager, requireNativeModule } from 'expo-modules-core';
import { OSMViewProps, OSMViewRef } from '../types';

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

// Validation helper
const validateCoordinate = (coord: any, propName: string): void => {
  if (!coord || typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
    throw new Error(`${propName} must be a valid coordinate object with latitude and longitude numbers`);
  }
  if (coord.latitude < -90 || coord.latitude > 90) {
    throw new Error(`${propName}.latitude must be between -90 and 90`);
  }
  if (coord.longitude < -180 || coord.longitude > 180) {
    throw new Error(`${propName}.longitude must be between -180 and 180`);
  }
};

const OSMView = forwardRef<OSMViewRef, OSMViewProps>(({
  style,
  initialCenter = { latitude: 0, longitude: 0 },
  initialZoom = 10,
  tileServerUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  markers = [],
  onMapReady,
  onRegionChange,
  onMarkerPress,
  onPress,
}, ref) => {
  const nativeViewRef = React.useRef<any>(null);

  // Expose imperative methods via ref
  useImperativeHandle(ref, () => ({
    zoomIn: async () => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🔍 Zoom In called');
        try {
          // For now, show alert since native connection is complex
          // In a full implementation, this would call native methods
          console.log('📝 Note: Zoom In - use double-tap for now');
        } catch (error) {
          console.error('❌ Zoom In failed:', error);
        }
      }
    },
    zoomOut: async () => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🔍 Zoom Out called');
        try {
          console.log('📝 Note: Zoom Out - use pinch gesture for now');
        } catch (error) {
          console.error('❌ Zoom Out failed:', error);
        }
      }
    },
    setZoom: async (zoom: number) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('🔍 Set Zoom called:', zoom);
        try {
          console.log(`📝 Note: Set Zoom to ${zoom} - use gestures for now`);
        } catch (error) {
          console.error('❌ Set Zoom failed:', error);
        }
      }
    },
    animateToLocation: async (latitude: number, longitude: number, zoom = initialZoom) => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📍 Animate to location called:', latitude, longitude, zoom);
        try {
          console.log(`📝 Note: Navigate to ${latitude}, ${longitude} - feature coming soon`);
        } catch (error) {
          console.error('❌ Location animation failed:', error);
        }
      }
    },
    getCurrentLocation: async () => {
      if (isNativeModuleAvailable && NativeOSMModule) {
        console.log('📍 Get current location called');
        try {
          console.log('📝 Note: Get current location - feature coming soon');
        } catch (error) {
          console.error('❌ Get location failed:', error);
        }
      }
    },
  }), [initialZoom, isNativeModuleAvailable]);
  
  // Validation
  validateCoordinate(initialCenter, 'initialCenter');
  
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
          validateCoordinate(marker.coordinate, `markers[${index}].coordinate`);
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
    const { markerId } = event.nativeEvent;
    onMarkerPress?.(markerId);
  };

  const handlePress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    onPress?.(coordinate);
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
        markers={markers}
        onMapReady={handleMapReady}
        onRegionChange={handleRegionChange}
        onMarkerPress={handleMarkerPress}
        onPress={handlePress}
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