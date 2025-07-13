import React, { useState } from 'react';
import { StyleSheet, View, Text, Button, Alert, Switch } from 'react-native';
import { OSMView, Coordinate, MapRegion, MarkerConfig, MapContainer } from '../src';

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
  const [showDebugInfo, setShowDebugInfo] = useState(true);
  const [useMapContainer, setUseMapContainer] = useState(true);

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

  const handleError = (error: Error) => {
    console.error('Map error:', error);
    Alert.alert('Map Error', error.message);
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

  const addInvalidMarker = () => {
    const invalidMarker: MarkerConfig = {
      id: `invalid-${Date.now()}`,
      coordinate: { latitude: 200, longitude: 200 }, // Invalid coordinates
      title: 'Invalid Marker',
      description: 'This marker has invalid coordinates'
    };
    setMarkers([...markers, invalidMarker]);
  };

  const mapProps = {
    style: styles.map,
    initialCenter: { latitude: 40.7128, longitude: -74.0060 },
    initialZoom: 10,
    markers: markers,
    onMapReady: handleMapReady,
    onRegionChange: handleRegionChange,
    onMarkerPress: handleMarkerPress,
    onPress: handleMapPress,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expo OSM SDK Demo</Text>
      
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Use MapContainer:</Text>
          <Switch value={useMapContainer} onValueChange={setUseMapContainer} />
        </View>
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Show Debug Info:</Text>
          <Switch value={showDebugInfo} onValueChange={setShowDebugInfo} />
        </View>
      </View>
      
      <View style={styles.mapContainer}>
        {useMapContainer ? (
          <MapContainer
            {...mapProps}
            showDebugInfo={showDebugInfo}
            onError={handleError}
          />
        ) : (
          <OSMView {...mapProps} />
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Add Random Marker" onPress={addRandomMarker} />
        <Button title="Add Invalid Marker" onPress={addInvalidMarker} />
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
        <Text style={styles.infoText}>
          Component: {useMapContainer ? 'MapContainer' : 'OSMView'}
        </Text>
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
    marginBottom: 10,
  },
  controls: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '500',
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
  buttonContainer: {
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