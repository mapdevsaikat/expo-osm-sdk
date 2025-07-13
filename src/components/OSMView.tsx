import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { requireNativeViewManager } from 'expo-modules-core';
import { OSMViewProps, Coordinate, MapRegion, DEFAULT_CONFIG, DEFAULT_COORDINATE } from '../types';

// Native view manager
const NativeOSMView = requireNativeViewManager('ExpoOsmSdk');

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
});

export default OSMView; 