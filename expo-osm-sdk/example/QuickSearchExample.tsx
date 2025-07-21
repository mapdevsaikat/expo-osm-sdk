import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { 
  quickSearch, 
  searchNearby, 
  getAddressFromCoordinates, 
  searchPOI, 
  smartSearch 
} from 'expo-osm-sdk';

/**
 * Quick Search Examples
 * 
 * Shows all the different ways to use Nominatim search
 */
export default function QuickSearchExample() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string>('');

  // Example: Quick search
  const handleQuickSearch = async () => {
    const location = await quickSearch(query);
    if (location) {
      setResult(`Found: ${location.displayName}\nCoords: ${location.coordinate.latitude}, ${location.coordinate.longitude}`);
    } else {
      setResult('No results found');
    }
  };

  // Example: Search nearby restaurants
  const handleNearbySearch = async () => {
    const center = { latitude: 40.7128, longitude: -74.0060 }; // NYC
    const restaurants = await searchNearby(center, 'restaurant', 2);
    setResult(`Found ${restaurants.length} restaurants:\n${restaurants.slice(0,3).map(r => r.displayName).join('\n')}`);
  };

  // Example: Reverse geocoding
  const handleReverseGeocode = async () => {
    const coordinate = { latitude: 40.7589, longitude: -73.9851 }; // Times Square
    const address = await getAddressFromCoordinates(coordinate);
    setResult(`Address: ${address || 'Not found'}`);
  };

  // Example: POI search
  const handlePOISearch = async () => {
    const center = { latitude: 40.7128, longitude: -74.0060 }; // NYC
    const hospitals = await searchPOI(center, 'hospital', 5);
    setResult(`Found ${hospitals.length} hospitals:\n${hospitals.slice(0,3).map(h => h.displayName).join('\n')}`);
  };

  // Example: Smart search
  const handleSmartSearch = async () => {
    const results = await smartSearch(query);
    setResult(`Smart search found ${results.length} results:\n${results.slice(0,3).map(r => r.displayName).join('\n')}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Nominatim Search Examples</Text>
      
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Enter search query (e.g., 'New York', '40.7128, -74.0060')"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleQuickSearch}>
          <Text style={styles.buttonText}>Quick Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleNearbySearch}>
          <Text style={styles.buttonText}>Nearby Restaurants (NYC)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleReverseGeocode}>
          <Text style={styles.buttonText}>Reverse Geocode (Times Square)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handlePOISearch}>
          <Text style={styles.buttonText}>Find Hospitals (NYC)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSmartSearch}>
          <Text style={styles.buttonText}>Smart Search</Text>
        </TouchableOpacity>
      </View>

      {result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 