import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  OSMView,
  OSMViewRef,
  Coordinate,
  TILE_CONFIGS,
} from 'expo-osm-sdk';

const LocationTestApp: React.FC = () => {
  const mapRef = useRef<OSMViewRef>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [lastLocationTime, setLastLocationTime] = useState<Date | null>(null);

  const handleFindLocation = async () => {
    if (isLoading || !mapRef.current) return;

    setIsLoading(true);

    try {
      console.log('🔍 Finding user location...');

      // First, start location tracking to ensure fresh data
      await mapRef.current.startLocationTracking();

      // Wait for a fresh location with 30 second timeout
      const location = await mapRef.current.waitForLocation(30);

      console.log('✅ Location found:', location);

      const coordinate: Coordinate = {
        latitude: location.latitude,
        longitude: location.longitude,
      };

      setCurrentLocation(coordinate);
      setLastLocationTime(new Date());

      // Animate to the location
      await mapRef.current.animateToLocation(
        coordinate.latitude,
        coordinate.longitude,
        15
      );

      Alert.alert(
        'Location Found! 📍',
        `Latitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Location error:', error);
      Alert.alert(
        'Location Error ❌',
        `Could not find location: ${error}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testLocationMethods = async () => {
    if (!mapRef.current) return;

    try {
      console.log('🧪 Testing all location methods...');
      
      // Test getCurrentLocation
      const current = await mapRef.current.getCurrentLocation();
      console.log('✅ getCurrentLocation:', current);
      
      // Test startLocationTracking
      await mapRef.current.startLocationTracking();
      console.log('✅ startLocationTracking: Started');
      
      // Test stopLocationTracking
      await mapRef.current.stopLocationTracking();
      console.log('✅ stopLocationTracking: Stopped');
      
      Alert.alert('Success! ✅', 'All location methods work correctly');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      Alert.alert('Test Failed ❌', `Error: ${error}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📍 Location Test App</Text>
        <Text style={styles.subtitle}>Testing Enhanced Location Services</Text>
      </View>

      {/* Map */}
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={{ latitude: 37.7749, longitude: -122.4194 }}
        initialZoom={12}
        styleUrl={TILE_CONFIGS.openMapTiles.styleUrl}
        onMapReady={() => console.log('🗺️ Map ready')}
      />

      {/* Location Controls */}
      <View style={styles.controls}>
        {/* Primary Location Button */}
        <TouchableOpacity
          style={[styles.locationButton, isLoading && styles.loadingButton]}
          onPress={handleFindLocation}
          disabled={isLoading}
        >
          <View style={styles.buttonContent}>
            {isLoading && (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={styles.loadingIcon}
              />
            )}
            <Text style={styles.locationButtonText}>
              {isLoading ? 'Finding Location...' : '📍 My Location'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Test All Methods Button */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={testLocationMethods}
          disabled={isLoading}
        >
          <Text style={styles.testButtonText}>🧪 Test All Methods</Text>
        </TouchableOpacity>

        {/* Location Info */}
        {currentLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.infoTitle}>Current Location:</Text>
            <Text style={styles.infoText}>
              Lat: {currentLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.infoText}>
              Lng: {currentLocation.longitude.toFixed(6)}
            </Text>
            {lastLocationTime && (
              <Text style={styles.infoTime}>
                Updated: {lastLocationTime.toLocaleTimeString()}
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 4,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 120,
    right: 20,
    alignItems: 'flex-end',
  },
  locationButton: {
    backgroundColor: '#8c14ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#8c14ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loadingButton: {
    opacity: 0.8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginRight: 8,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: 'rgba(140, 20, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#8c14ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 12,
  },
  testButtonText: {
    color: '#8c14ff',
    fontSize: 14,
    fontWeight: '600',
  },
  locationInfo: {
    backgroundColor: 'rgba(140, 20, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(140, 20, 255, 0.2)',
    minWidth: 180,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8c14ff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#8c14ff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoTime: {
    fontSize: 10,
    color: '#8c14ff',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default LocationTestApp; 