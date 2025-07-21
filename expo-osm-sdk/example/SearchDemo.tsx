import React, { useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { OSMView, SearchBox, useNominatimSearch } from 'expo-osm-sdk';
import type { OSMViewRef, SearchLocation } from 'expo-osm-sdk';

/**
 * Complete Demo showing SearchBox integration with OSMView
 * 
 * Features demonstrated:
 * - Location search with autocomplete
 * - Map animation to selected location
 * - Reverse geocoding on map long press
 * - Error handling
 */
export default function SearchDemo() {
  const mapRef = useRef<OSMViewRef>(null);
  const { reverseGeocode } = useNominatimSearch();

  // Handle location selection from search
  const handleLocationSelected = (location: SearchLocation) => {
    console.log('Selected location:', location.displayName);
    
    // Animate map to selected location
    mapRef.current?.animateToLocation(
      location.coordinate.latitude,
      location.coordinate.longitude,
      15 // zoom level
    );
  };

  // Handle long press on map for reverse geocoding
  const handleMapLongPress = async (event: any) => {
    const { latitude, longitude } = event.coordinate;
    
    try {
      console.log('Reverse geocoding:', latitude, longitude);
      const location = await reverseGeocode({ latitude, longitude });
      
      if (location) {
        Alert.alert(
          'Location Found',
          location.displayName,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('No Address', 'No address found for this location');
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      Alert.alert('Error', 'Failed to find address');
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Box - positioned on top of map */}
      <View style={styles.searchContainer}>
        <SearchBox
          placeholder="Search for places, addresses, POIs..."
          onLocationSelected={handleLocationSelected}
          onResultsChanged={(results) => {
            console.log('Search results updated:', results.length);
          }}
          maxResults={5}
          autoComplete={true}
          style={styles.searchBox}
        />
      </View>

      {/* Map */}
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={{ latitude: 40.7128, longitude: -74.0060 }} // New York
        initialZoom={13}
        showUserLocation={true}
        onLongPress={handleMapLongPress}
        onMapReady={() => {
          console.log('Map is ready for search!');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  searchBox: {
    backgroundColor: 'white',
  },
  map: {
    flex: 1,
  },
}); 