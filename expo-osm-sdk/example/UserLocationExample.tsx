/**
 * User Location Example - expo-osm-sdk v1.0.95+
 * 
 * Demonstrates the signature purple user location display
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  OSMView,
  type OSMViewRef,
  type Coordinate,
} from 'expo-osm-sdk';

// =============================================================================
// Example 1: Basic User Location (Signature Purple)
// =============================================================================

export function BasicUserLocationExample() {
  const mapRef = useRef<OSMViewRef>(null);
  const [showLocation, setShowLocation] = useState(true);
  const [followLocation, setFollowLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showUserLocation={showLocation}
        followUserLocation={followLocation}
        onUserLocationChange={(location) => {
          setCurrentLocation(location);
        }}
      />
      
      <View style={styles.controls}>
        <Text style={styles.title}>User Location</Text>
        <Text style={styles.signature}>Signature Purple: #9C1AFF 💜</Text>
        
        <View style={styles.control}>
          <Text style={styles.label}>Show Location</Text>
          <Switch
            value={showLocation}
            onValueChange={setShowLocation}
            trackColor={{ false: '#ccc', true: '#9C1AFF' }}
            thumbColor={showLocation ? '#fff' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.control}>
          <Text style={styles.label}>Follow Location</Text>
          <Switch
            value={followLocation}
            onValueChange={setFollowLocation}
            trackColor={{ false: '#ccc', true: '#9C1AFF' }}
            thumbColor={followLocation ? '#fff' : '#f4f3f4'}
          />
        </View>
        
        {currentLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.infoText}>
              📍 Lat: {currentLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.infoText}>
              📍 Lng: {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// Example 2: Custom Color User Location
// =============================================================================

export function CustomColorExample() {
  const mapRef = useRef<OSMViewRef>(null);
  const [color, setColor] = useState('#9C1AFF'); // Default signature purple

  const colors = [
    { name: 'Signature Purple', value: '#9C1AFF' },
    { name: 'Blue', value: '#007AFF' },
    { name: 'Green', value: '#34C759' },
    { name: 'Red', value: '#FF3B30' },
    { name: 'Orange', value: '#FF9500' },
  ];

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showUserLocation={true}
        followUserLocation={true}
        userLocationTintColor={color}
        userLocationAccuracyFillColor={`${color}33`} // 20% opacity
        userLocationAccuracyBorderColor={color}
      />
      
      <View style={styles.controls}>
        <Text style={styles.title}>Custom Colors</Text>
        
        <View style={styles.colorPicker}>
          {colors.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[
                styles.colorButton,
                { backgroundColor: c.value },
                color === c.value && styles.colorButtonSelected,
              ]}
              onPress={() => setColor(c.value)}
            >
              {color === c.value && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.selectedColor}>
          {colors.find(c => c.value === color)?.name} ({color})
        </Text>
      </View>
    </View>
  );
}

// =============================================================================
// Example 3: Location Tracking with Stats
// =============================================================================

export function LocationTrackingExample() {
  const mapRef = useRef<OSMViewRef>(null);
  const [location, setLocation] = useState<any>(null);
  const [speed, setSpeed] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  const handleLocationChange = (loc: any) => {
    setLocation(loc);
    if (loc.speed !== undefined) setSpeed(loc.speed);
    if (loc.accuracy !== undefined) setAccuracy(loc.accuracy);
  };

  const centerOnUser = async () => {
    if (mapRef.current && location) {
      await mapRef.current.animateToLocation(
        location.latitude,
        location.longitude,
        16
      );
    }
  };

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showUserLocation={true}
        onUserLocationChange={handleLocationChange}
      />
      
      <View style={styles.controls}>
        <Text style={styles.title}>Location Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Speed</Text>
            <Text style={styles.statValue}>{(speed * 3.6).toFixed(1)} km/h</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={styles.statValue}>±{accuracy.toFixed(0)}m</Text>
          </View>
        </View>
        
        {location && (
          <>
            <View style={styles.locationInfo}>
              <Text style={styles.infoText}>
                📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
              {location.altitude > 0 && (
                <Text style={styles.infoText}>
                  🏔️ Altitude: {location.altitude.toFixed(0)}m
                </Text>
              )}
            </View>
            
            <TouchableOpacity style={styles.button} onPress={centerOnUser}>
              <Text style={styles.buttonText}>📍 Center on Me</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  signature: {
    fontSize: 14,
    color: '#9C1AFF',
    marginBottom: 12,
    fontWeight: '600',
  },
  control: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  locationInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#000',
  },
  checkmark: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  selectedColor: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9C1AFF',
  },
  button: {
    backgroundColor: '#9C1AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

