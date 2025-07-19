import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { 
  searchLocations, 
  reverseGeocode, 
  getSuggestions,
  calculateDistance,
  formatDistance,
  SearchBox
} from 'expo-osm-sdk';
import type { Coordinate, SearchLocation } from 'expo-osm-sdk';

/**
 * Basic Nominatim Demo
 * 
 * This example demonstrates the core Nominatim functionality:
 * 1. Direct search using searchLocations function
 * 2. Reverse geocoding using reverseGeocode function
 * 3. Distance calculations
 * 4. Basic SearchBox usage
 */

const DEMO_COORDINATE: Coordinate = {
  latitude: 40.7589, // Central Park, NYC
  longitude: -73.9851
};

export default function NominatimBasicDemo() {
  const [searchResults, setSearchResults] = useState<SearchLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Demo search function
  const performSearch = async () => {
    setIsLoading(true);
    try {
      const results = await searchLocations('Central Park New York', {
        limit: 5
      });
      setSearchResults(results);
      Alert.alert(
        'Search Results',
        `Found ${results.length} results for "Central Park New York"`
      );
    } catch (error) {
      Alert.alert('Error', 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo reverse geocoding
  const performReverseGeocode = async () => {
    setIsLoading(true);
    try {
      const result = await reverseGeocode(DEMO_COORDINATE);
      if (result) {
        Alert.alert(
          'Reverse Geocoding',
          `Address: ${result.displayName}`
        );
      } else {
        Alert.alert('Reverse Geocoding', 'No address found');
      }
    } catch (error) {
      Alert.alert('Error', 'Reverse geocoding failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo distance calculation
  const calculateDistances = () => {
    const cities = [
      { name: 'Times Square', lat: 40.7580, lng: -73.9855 },
      { name: 'Brooklyn Bridge', lat: 40.7061, lng: -73.9969 },
      { name: 'Statue of Liberty', lat: 40.6892, lng: -74.0445 },
    ];

    const distances = cities.map(city => {
      const cityCoord: Coordinate = { latitude: city.lat, longitude: city.lng };
      const distance = calculateDistance(DEMO_COORDINATE, cityCoord);
      return `${city.name}: ${formatDistance(distance)}`;
    });

    Alert.alert(
      'Distances from Central Park',
      distances.join('\n')
    );
  };

  // Demo suggestions
  const getSuggestionsDemo = async () => {
    setIsLoading(true);
    try {
      const suggestions = await getSuggestions('park', { limit: 3 });
      const suggestionNames = suggestions.map(s => s.displayName).join('\n');
      Alert.alert(
        'Suggestions for "park"',
        suggestionNames || 'No suggestions found'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location: SearchLocation) => {
    Alert.alert(
      'Location Selected',
      `${location.displayName}\nCoordinates: ${location.coordinate.latitude.toFixed(4)}, ${location.coordinate.longitude.toFixed(4)}`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nominatim Basic Demo</Text>
      
      {/* SearchBox Component Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SearchBox Component</Text>
        <SearchBox
          onLocationSelected={handleLocationSelect}
          placeholder="Search for places..."
          style={styles.searchBox}
        />
      </View>

      {/* Direct Function Demos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Direct Functions</Text>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={performSearch}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Search "Central Park New York"'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={performReverseGeocode}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Reverse Geocode Central Park'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={calculateDistances}
        >
          <Text style={styles.buttonText}>
            Calculate Distances to NYC Landmarks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={getSuggestionsDemo}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Get Suggestions for "park"'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Results Display */}
      {searchResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Search Results</Text>
          {searchResults.slice(0, 3).map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={styles.resultName}>{result.displayName}</Text>
              <Text style={styles.resultCoords}>
                {result.coordinate.latitude.toFixed(4)}, {result.coordinate.longitude.toFixed(4)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Demo Info */}
      <View style={styles.info}>
        <Text style={styles.infoText}>
          This demo showcases basic Nominatim functionality:
        </Text>
        <Text style={styles.infoText}>• Location search with searchLocations()</Text>
        <Text style={styles.infoText}>• Address lookup with reverseGeocode()</Text>
        <Text style={styles.infoText}>• Distance calculations</Text>
        <Text style={styles.infoText}>• SearchBox component integration</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  searchBox: {
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  resultName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  resultCoords: {
    color: '#666',
    fontSize: 12,
  },
  info: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoText: {
    color: '#555',
    marginBottom: 4,
  },
});

// Usage Example in App.tsx:
/*
import NominatimBasicDemo from './examples/NominatimBasicDemo';

export default function App() {
  return <NominatimBasicDemo />;
}
*/ 