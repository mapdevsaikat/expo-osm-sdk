import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { OSMView, NavigationControls, OSMViewRef } from 'expo-osm-sdk';

/**
 * NavigationControlsExample - Clean map with navigation controls
 * Shows how to use the NavigationControls component for zoom, compass, and pitch
 */
export default function NavigationControlsExample() {
  const mapRef = useRef<OSMViewRef>(null);
  const [bearing, setBearing] = useState(0);
  const [pitch, setPitch] = useState(0);

  // Update bearing and pitch when they change
  const updateCameraState = async () => {
    if (mapRef.current) {
      try {
        const currentBearing = await mapRef.current.getBearing();
        const currentPitch = await mapRef.current.getPitch();
        setBearing(currentBearing);
        setPitch(currentPitch);
      } catch (error) {
        console.log('Could not get camera state:', error);
      }
    }
  };

  // Update camera state periodically (optional - for live updates)
  useEffect(() => {
    const interval = setInterval(updateCameraState, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleZoomIn = async () => {
    await mapRef.current?.zoomIn();
  };

  const handleZoomOut = async () => {
    await mapRef.current?.zoomOut();
  };

  const handleResetBearing = async () => {
    await mapRef.current?.setBearing(0);
    setBearing(0);
  };

  const handleResetPitch = async () => {
    await mapRef.current?.setPitch(0);
    setPitch(0);
  };

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={{ latitude: 22.5744, longitude: 88.3629 }}
        initialZoom={13}
        initialPitch={0}
        initialBearing={0}
        showUserLocation={true}
        pitchEnabled={true}
        rotateEnabled={true}
      />

      {/* Navigation Controls - positioned at top right */}
      <View style={styles.controlsContainer}>
        <NavigationControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetBearing={handleResetBearing}
          onResetPitch={handleResetPitch}
          bearing={bearing}
          pitch={pitch}
          size={40}
          color="#9C1AFF"
          showPitchControl={true}
        />
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
  controlsContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
});

