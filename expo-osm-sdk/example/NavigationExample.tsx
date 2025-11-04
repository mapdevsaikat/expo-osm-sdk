import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { OSMView, OSMViewRef } from 'expo-osm-sdk';

/**
 * NavigationExample - Demonstrates 3D navigation mode with pitch and bearing
 * Perfect for building navigation apps like Google Maps navigation
 */
export default function NavigationExample() {
  const mapRef = useRef<OSMViewRef>(null);
  const [pitch, setPitchState] = useState(0);
  const [bearing, setBearingState] = useState(0);
  const [isNavigationMode, setIsNavigationMode] = useState(false);

  // Toggle between normal and navigation (3D) mode
  const toggleNavigationMode = async () => {
    if (!mapRef.current) return;

    if (isNavigationMode) {
      // Switch to normal (2D) mode
      await mapRef.current.setPitch(0);
      await mapRef.current.setBearing(0);
      setPitchState(0);
      setBearingState(0);
      setIsNavigationMode(false);
    } else {
      // Switch to navigation (3D) mode
      await mapRef.current.setPitch(45);
      setPitchState(45);
      setIsNavigationMode(true);
    }
  };

  // Rotate camera (useful for navigation)
  const rotateBearing = async (degrees: number) => {
    if (!mapRef.current) return;

    const newBearing = (bearing + degrees + 360) % 360;
    await mapRef.current.setBearing(newBearing);
    setBearingState(newBearing);
  };

  // Adjust pitch
  const adjustPitch = async (delta: number) => {
    if (!mapRef.current) return;

    const newPitch = Math.max(0, Math.min(60, pitch + delta));
    await mapRef.current.setPitch(newPitch);
    setPitchState(newPitch);
  };

  // Simulate navigation route animation
  const simulateNavigation = async () => {
    if (!mapRef.current) return;

    // Enable navigation mode
    if (!isNavigationMode) {
      await toggleNavigationMode();
    }

    // Simulate driving along a route
    const route = [
      { lat: 22.5744, lng: 88.3629, bearing: 0 },
      { lat: 22.5754, lng: 88.3639, bearing: 45 },
      { lat: 22.5764, lng: 88.3649, bearing: 90 },
      { lat: 22.5774, lng: 88.3659, bearing: 135 },
    ];

    for (const point of route) {
      await mapRef.current.animateCamera({
        latitude: point.lat,
        longitude: point.lng,
        zoom: 17,
        pitch: 50,
        bearing: point.bearing,
        duration: 2000,
      });
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 2100));
    }
  };

  return (
    <View style={styles.container}>
      {/* Map with initial 3D setup */}
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={{ latitude: 22.5744, longitude: 88.3629 }}
        initialZoom={15}
        initialPitch={0}
        initialBearing={0}
        showUserLocation={true}
        pitchEnabled={true}
        rotateEnabled={true}
      />

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {/* Mode Toggle */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            isNavigationMode && styles.activeButton,
          ]}
          onPress={toggleNavigationMode}
        >
          <Text style={styles.buttonText}>
            {isNavigationMode ? '📐 2D Mode' : '🗺️ 3D Mode'}
          </Text>
        </TouchableOpacity>

        {/* Pitch Controls */}
        <View style={styles.controlGroup}>
          <Text style={styles.label}>Pitch: {pitch}°</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => adjustPitch(-15)}
            >
              <Text style={styles.buttonText}>-15°</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => adjustPitch(15)}
            >
              <Text style={styles.buttonText}>+15°</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bearing Controls */}
        <View style={styles.controlGroup}>
          <Text style={styles.label}>Bearing: {bearing}°</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => rotateBearing(-45)}
            >
              <Text style={styles.buttonText}>↺ 45°</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => rotateBearing(45)}
            >
              <Text style={styles.buttonText}>↻ 45°</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Simulate Navigation */}
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={simulateNavigation}
        >
          <Text style={styles.buttonText}>🚗 Simulate Navigation</Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Navigation Mode</Text>
        <Text style={styles.infoText}>
          • 3D Mode: Tilt camera for navigation view
        </Text>
        <Text style={styles.infoText}>
          • Rotate: Change camera direction
        </Text>
        <Text style={styles.infoText}>
          • Perfect for turn-by-turn navigation!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controlPanel: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  controlGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#9C1AFF',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  activeButton: {
    backgroundColor: '#7A0FCC',
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#9C1AFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9C1AFF',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
});

