import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { OSMView, LocationButton, OSMViewRef } from 'expo-osm-sdk';

/**
 * LocationButton Example
 * Demonstrates how to use the LocationButton component with OSMView
 */
export default function LocationButtonExample() {
  const mapRef = useRef<OSMViewRef>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleLocationFound = (coords: { latitude: number; longitude: number }) => {
    console.log('📍 Location found:', coords);
    setLocation(coords);
    
    // Animate map to user's location
    mapRef.current?.animateToLocation(coords.latitude, coords.longitude, 15);
  };

  const handleLocationError = (error: string) => {
    console.error('❌ Location error:', error);
    Alert.alert('Location Error', error);
  };

  const getLocation = async () => {
    try {
      const loc = await mapRef.current?.getCurrentLocation();
      if (loc) {
        return { latitude: loc.latitude, longitude: loc.longitude };
      }
      throw new Error('Unable to get location');
    } catch (error) {
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={{ latitude: 22.5744, longitude: 88.3629 }} // Kolkata
        initialZoom={12}
        showUserLocation={true}
        followUserLocation={false}
      />

      {/* Location Button - Positioned at bottom right */}
      <View style={styles.buttonContainer}>
        <LocationButton
          getCurrentLocation={getLocation}
          onLocationFound={handleLocationFound}
          onLocationError={handleLocationError}
        />
      </View>

      {/* Display current location */}
      {location && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
        </View>
      )}
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
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  locationInfo: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  locationText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
  },
});

