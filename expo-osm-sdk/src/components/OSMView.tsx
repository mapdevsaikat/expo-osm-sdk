import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { requireNativeViewManager } from 'expo-modules-core';
import { OSMViewProps, Coordinate, MapRegion, DEFAULT_CONFIG, DEFAULT_COORDINATE } from '../types';

// Native view manager
const NativeOSMView = requireNativeViewManager('ExpoOsmSdk');

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

const OSMView: React.FC<OSMViewProps> = ({
  style,
  initialCenter = DEFAULT_COORDINATE,
  initialZoom = 10,
  tileServerUrl = DEFAULT_CONFIG.tileServerUrl,
  markers = [],
  onMapReady,
  onRegionChange,
  onMarkerPress,
  onPress
}) => {
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

  return (
    <View style={[styles.container, style]} testID="osm-view">
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
};

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
});

export default OSMView; 