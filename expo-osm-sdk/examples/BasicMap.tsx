/**
 * 🗺️ Basic Map Example
 * 
 * A simple example demonstrating the core features of expo-osm-sdk:
 * - Basic map rendering
 * - Adding markers
 * - Handling map events
 * - User location
 * 
 * Perfect for getting started with the SDK.
 */

import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Alert, 
  TouchableOpacity, 
  Text, 
  StatusBar 
} from 'react-native';
import { OSMView, OSMViewRef, Coordinate, MarkerConfig } from 'expo-osm-sdk';

export default function BasicMap() {
  // Map reference for programmatic control
  const mapRef = useRef<OSMViewRef>(null);
  
  // State for markers and user location
  const [markers, setMarkers] = useState<MarkerConfig[]>([
    {
      id: 'home',
      coordinate: { latitude: 40.7128, longitude: -74.0060 },
      title: 'New York City',
      description: 'The Big Apple! Tap the map to add more markers.'
    }
  ]);
  
  const [showUserLocation, setShowUserLocation] = useState(false);

  // Handle map tap - add new marker
  const handleMapPress = (coordinate: Coordinate) => {
    const newMarker: MarkerConfig = {
      id: `marker-${Date.now()}`,
      coordinate,
      title: 'New Marker',
      description: `Added at ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
    };
    
    setMarkers(prevMarkers => [...prevMarkers, newMarker]);
    console.log('Added marker at:', coordinate);
  };

  // Handle marker tap - show info
  const handleMarkerPress = (markerId: string, coordinate: Coordinate) => {
    const marker = markers.find(m => m.id === markerId);
    if (marker) {
      Alert.alert(
        marker.title || 'Marker',
        marker.description || `Location: ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
        [
          { text: 'Remove', style: 'destructive', onPress: () => removeMarker(markerId) },
          { text: 'OK', style: 'default' }
        ]
      );
    }
  };

  // Remove marker
  const removeMarker = (markerId: string) => {
    setMarkers(prevMarkers => prevMarkers.filter(m => m.id !== markerId));
  };

  // Toggle user location
  const toggleUserLocation = async () => {
    try {
      if (showUserLocation) {
        await mapRef.current?.stopLocationTracking();
        setShowUserLocation(false);
      } else {
        await mapRef.current?.startLocationTracking();
        setShowUserLocation(true);
      }
    } catch (error) {
      Alert.alert(
        'Location Error', 
        'Please enable location permissions to use this feature.'
      );
    }
  };

  // Fly to current location
  const flyToCurrentLocation = async () => {
    try {
      const location = await mapRef.current?.getCurrentLocation();
      if (location) {
        await mapRef.current?.animateToLocation(location.latitude, location.longitude, 15);
      }
    } catch (error) {
      Alert.alert(
        'Location Error', 
        'Unable to get current location. Please check your GPS settings.'
      );
    }
  };

  // Clear all markers except home
  const clearMarkers = () => {
    setMarkers(prevMarkers => prevMarkers.filter(m => m.id === 'home'));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Map */}
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
        initialZoom={12}
        markers={markers}
        showUserLocation={showUserLocation}
        onMapReady={() => console.log('Map is ready!')}
        onPress={handleMapPress}
        onMarkerPress={handleMarkerPress}
        onUserLocationChange={(location) => console.log('User location:', location)}
      />

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <Text style={styles.title}>🗺️ Basic Map Demo</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, showUserLocation ? styles.activeButton : styles.inactiveButton]}
            onPress={toggleUserLocation}
          >
            <Text style={styles.buttonText}>
              {showUserLocation ? '📍 Stop Tracking' : '📍 Track Location'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={flyToCurrentLocation}>
            <Text style={styles.buttonText}>🎯 Fly to Me</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={clearMarkers}>
          <Text style={styles.buttonText}>🗑️ Clear Markers ({markers.length - 1})</Text>
        </TouchableOpacity>

        <Text style={styles.instructions}>
          💡 Tap the map to add markers • Tap markers to see options
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  map: {
    flex: 1,
  },
  controlPanel: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#FF6B6B',
  },
  inactiveButton: {
    backgroundColor: '#4A90E2',
  },
  clearButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 