import React, { useState } from 'react';
import { StyleSheet, View, Text, Button, Alert } from 'react-native';
import { OSMView, Coordinate, MapRegion, MarkerConfig } from '../src';

const App: React.FC = () => {
  const [markers, setMarkers] = useState<MarkerConfig[]>([
    {
      id: 'marker-1',
      coordinate: { latitude: 40.7128, longitude: -74.0060 },
      title: 'New York City',
      description: 'The Big Apple'
    },
    {
      id: 'marker-2',
      coordinate: { latitude: 51.5074, longitude: -0.1278 },
      title: 'London',
      description: 'Capital of England'
    }
  ]);

  const [currentRegion, setCurrentRegion] = useState<MapRegion | null>(null);

  const handleMapReady = () => {
    console.log('Map is ready!');
    Alert.alert('Map Ready', 'The OpenStreetMap is now ready to use!');
  };

  const handleRegionChange = (region: MapRegion) => {
    console.log('Region changed:', region);
    setCurrentRegion(region);
  };

  const handleMarkerPress = (markerId: string) => {
    console.log('Marker pressed:', markerId);
    const marker = markers.find(m => m.id === markerId);
    if (marker) {
      Alert.alert('Marker Pressed', `You pressed: ${marker.title}`);
    }
  };

  const handleMapPress = (coordinate: Coordinate) => {
    console.log('Map pressed at:', coordinate);
    Alert.alert(
      'Map Pressed',
      `Latitude: ${coordinate.latitude.toFixed(4)}\nLongitude: ${coordinate.longitude.toFixed(4)}`
    );
  };

  const addRandomMarker = () => {
    const randomLat = (Math.random() - 0.5) * 180;
    const randomLng = (Math.random() - 0.5) * 360;
    const newMarker: MarkerConfig = {
      id: `marker-${Date.now()}`,
      coordinate: { latitude: randomLat, longitude: randomLng },
      title: `Random Marker ${markers.length + 1}`,
      description: 'A randomly placed marker'
    };
    setMarkers([...markers, newMarker]);
  };

  const clearMarkers = () => {
    setMarkers([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expo OSM SDK Demo</Text>
      
      <View style={styles.mapContainer}>
        <OSMView
          style={styles.map}
          initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
          initialZoom={10}
          markers={markers}
          onMapReady={handleMapReady}
          onRegionChange={handleRegionChange}
          onMarkerPress={handleMarkerPress}
          onPress={handleMapPress}
        />
      </View>

      <View style={styles.controls}>
        <Button title="Add Random Marker" onPress={addRandomMarker} />
        <Button title="Clear Markers" onPress={clearMarkers} />
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          Markers: {markers.length}
        </Text>
        {currentRegion && (
          <Text style={styles.infoText}>
            Current Region: {currentRegion.latitude.toFixed(4)}, {currentRegion.longitude.toFixed(4)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  mapContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  map: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
  },
  info: {
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
  },
});

export default App; 