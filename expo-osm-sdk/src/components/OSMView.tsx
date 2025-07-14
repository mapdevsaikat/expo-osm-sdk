import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { requireNativeViewManager } from 'expo-modules-core';
import { OSMViewProps, Coordinate, MapRegion, DEFAULT_CONFIG, DEFAULT_COORDINATE } from '../types';

// Try to get the native view manager, with fallback for unsupported environments
let NativeOSMView: any = null;
let isNativeModuleAvailable = false;

try {
  NativeOSMView = requireNativeViewManager('ExpoOsmSdk');
  // Additional check: verify the component is actually functional
  // In Expo Go, the component exists but isn't functional
  isNativeModuleAvailable = !!(global as any).ExpoModules?.ExpoOsmSdk && Platform.OS !== 'web';
} catch (error) {
  // Native module not available (e.g., in Expo Go or web)
  console.warn('ExpoOsmSdk native module not available:', error);
  isNativeModuleAvailable = false;
}

// Validation helper
const validateCoordinate = (coord: Coordinate, propName: string): void => {
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

const validateZoom = (zoom: number, propName: string): void => {
  if (typeof zoom !== 'number' || zoom < 1 || zoom > 18) {
    throw new Error(`${propName} must be a number between 1 and 18`);
  }
};

const OSMView = React.forwardRef<View, OSMViewProps>(({
  style,
  initialCenter = DEFAULT_COORDINATE,
  initialZoom = 10,
  tileServerUrl = DEFAULT_CONFIG.tileServerUrl,
  markers = [],
  onMapReady,
  onRegionChange,
  onMarkerPress,
  onPress
}, ref) => {
  // Validate props in development
  if (__DEV__) {
    try {
      validateCoordinate(initialCenter, 'initialCenter');
      validateZoom(initialZoom, 'initialZoom');
      
      if (markers && Array.isArray(markers)) {
        markers.forEach((marker, index) => {
          if (!marker.id) {
            console.warn(`Marker at index ${index} is missing an 'id' property`);
          }
          validateCoordinate(marker.coordinate, `markers[${index}].coordinate`);
        });
      }
    } catch (error) {
      console.error('OSMView validation error:', error);
      // In development, we might want to show a fallback UI
      return (
        <View style={[styles.container, style]} testID="osm-view-error">
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Map Error: {error instanceof Error ? error.message : String(error)}</Text>
          </View>
        </View>
      );
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
      <View ref={ref} style={[styles.container, style]} testID="osm-view-fallback">
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
    <View ref={ref} style={[styles.container, style]} testID="osm-view">
      <NativeOSMView
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

export default OSMView; 