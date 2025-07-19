/**
 * 🎯 Smart Clustering Demo
 * 
 * Demonstrates the intelligent marker clustering feature:
 * - Automatic clustering for performance
 * - Dynamic cluster radius adjustment
 * - Different clustering strategies
 * - Performance with large datasets
 * 
 * Perfect for apps with many markers like store locators, delivery tracking, etc.
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Slider, 
  Switch,
  Alert 
} from 'react-native';
import { OSMView, OSMViewRef, MarkerConfig } from 'expo-osm-sdk';

export default function ClusteringDemo() {
  const mapRef = useRef<OSMViewRef>(null);
  
  // Clustering configuration
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [clusterRadius, setClusterRadius] = useState(100);
  const [maxZoom, setMaxZoom] = useState(15);
  const [minPoints, setMinPoints] = useState(2);
  
  // Sample data - NYC restaurants
  const [restaurants] = useState<MarkerConfig[]>([
    // Manhattan restaurants
    { id: 'r1', coordinate: { latitude: 40.7614, longitude: -73.9776 }, title: 'Times Square Deli', description: 'Quick bites in the heart of NYC' },
    { id: 'r2', coordinate: { latitude: 40.7505, longitude: -73.9934 }, title: 'Herald Square Bistro', description: 'European cuisine' },
    { id: 'r3', coordinate: { latitude: 40.7484, longitude: -73.9857 }, title: 'Empire Café', description: 'Coffee and pastries' },
    { id: 'r4', coordinate: { latitude: 40.7580, longitude: -73.9855 }, title: 'Bryant Park Grill', description: 'Fine dining experience' },
    { id: 'r5', coordinate: { latitude: 40.7829, longitude: -73.9654 }, title: 'Central Park Café', description: 'Outdoor dining' },
    
    // Cluster test - Close restaurants
    { id: 'r6', coordinate: { latitude: 40.7615, longitude: -73.9775 }, title: 'TS Pizza', description: 'New York style pizza' },
    { id: 'r7', coordinate: { latitude: 40.7613, longitude: -73.9778 }, title: 'TS Sushi', description: 'Fresh sushi bar' },
    { id: 'r8', coordinate: { latitude: 40.7616, longitude: -73.9774 }, title: 'TS Burger', description: 'Gourmet burgers' },
    { id: 'r9', coordinate: { latitude: 40.7612, longitude: -73.9779 }, title: 'TS Tacos', description: 'Mexican street food' },
    
    // Brooklyn restaurants
    { id: 'r10', coordinate: { latitude: 40.6892, longitude: -73.9903 }, title: 'Brooklyn Bridge Café', description: 'Views of Manhattan' },
    { id: 'r11', coordinate: { latitude: 40.6782, longitude: -73.9442 }, title: 'Williamsburg Brewery', description: 'Craft beer and food' },
    { id: 'r12', coordinate: { latitude: 40.6501, longitude: -73.9496 }, title: 'Park Slope Eatery', description: 'Farm to table dining' },
    
    // Queens restaurants
    { id: 'r13', coordinate: { latitude: 40.7282, longitude: -73.7949 }, title: 'Flushing Noodles', description: 'Authentic Asian cuisine' },
    { id: 'r14', coordinate: { latitude: 40.7614, longitude: -73.8370 }, title: 'Astoria Grill', description: 'Greek specialties' },
    
    // Bronx restaurants
    { id: 'r15', coordinate: { latitude: 40.8448, longitude: -73.8648 }, title: 'Yankee Stadium Grill', description: 'Sports bar and grill' },
    { id: 'r16', coordinate: { latitude: 40.8176, longitude: -73.8781 }, title: 'Bronx Zoo Café', description: 'Family friendly dining' },
    
    // More Manhattan for clustering test
    { id: 'r17', coordinate: { latitude: 40.7505, longitude: -73.9935 }, title: 'Herald Deli', description: 'Quick service' },
    { id: 'r18', coordinate: { latitude: 40.7506, longitude: -73.9933 }, title: 'Herald Pizza', description: 'NY style slices' },
    { id: 'r19', coordinate: { latitude: 40.7504, longitude: -73.9936 }, title: 'Herald Coffee', description: 'Artisan coffee' },
    { id: 'r20', coordinate: { latitude: 40.7507, longitude: -73.9932 }, title: 'Herald Bakery', description: 'Fresh pastries' },
  ]);

  // Add random restaurants for stress testing
  const generateRandomRestaurants = () => {
    const randomRestaurants: MarkerConfig[] = [];
    for (let i = 0; i < 50; i++) {
      randomRestaurants.push({
        id: `random-${i}`,
        coordinate: {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.2,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.2,
        },
        title: `Random Restaurant ${i + 1}`,
        description: `Generated for clustering test`,
      });
    }
    return randomRestaurants;
  };

  const [allRestaurants, setAllRestaurants] = useState(restaurants);

  const handleMarkerPress = (markerId: string) => {
    const restaurant = allRestaurants.find(r => r.id === markerId);
    if (restaurant) {
      Alert.alert(restaurant.title || 'Restaurant', restaurant.description || 'Restaurant details');
    }
  };

  const addRandomRestaurants = () => {
    const random = generateRandomRestaurants();
    setAllRestaurants([...restaurants, ...random]);
    Alert.alert('Added 50 random restaurants!', 'Watch how clustering handles the increased density.');
  };

  const resetRestaurants = () => {
    setAllRestaurants(restaurants);
  };

  const fitToAllMarkers = async () => {
    await mapRef.current?.fitToMarkers(undefined, 50);
  };

  return (
    <View style={styles.container}>
      {/* Map with clustering */}
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
        initialZoom={11}
        markers={allRestaurants}
        clustering={{
          enabled: clusteringEnabled,
          radius: clusterRadius,
          maxZoom: maxZoom,
          minPoints: minPoints,
          animate: true,
          animationDuration: 300,
        }}
        onMarkerPress={handleMarkerPress}
        onMapReady={() => console.log('Clustering map ready!')}
      />

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <Text style={styles.title}>🎯 Smart Clustering Demo</Text>
        
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            📍 {allRestaurants.length} restaurants • {clusteringEnabled ? 'Clustering ON' : 'Clustering OFF'}
          </Text>
        </View>

        {/* Clustering Toggle */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Enable Clustering</Text>
          <Switch
            value={clusteringEnabled}
            onValueChange={setClusteringEnabled}
            trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
          />
        </View>

        {/* Cluster Radius */}
        {clusteringEnabled && (
          <>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Cluster Radius: {clusterRadius}px</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={50}
              maximumValue={200}
              value={clusterRadius}
              onValueChange={setClusterRadius}
              minimumTrackTintColor="#4A90E2"
              maximumTrackTintColor="#E0E0E0"
              thumbStyle={{ backgroundColor: '#4A90E2' }}
            />

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Max Cluster Zoom: {maxZoom}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={18}
              value={maxZoom}
              onValueChange={setMaxZoom}
              step={1}
              minimumTrackTintColor="#FF6B6B"
              maximumTrackTintColor="#E0E0E0"
            />

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Min Points: {minPoints}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={2}
              maximumValue={10}
              value={minPoints}
              onValueChange={setMinPoints}
              step={1}
              minimumTrackTintColor="#50C878"
              maximumTrackTintColor="#E0E0E0"
            />
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.addButton} onPress={addRandomRestaurants}>
            <Text style={styles.buttonText}>+ 50 Random</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resetButton} onPress={resetRestaurants}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.fitButton} onPress={fitToAllMarkers}>
            <Text style={styles.buttonText}>Fit All</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.info}>
          💡 Zoom in/out to see clusters dynamically form and break apart!
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
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: '60%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 30,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  fitButton: {
    flex: 1,
    backgroundColor: '#50C878',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  info: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
  },
}); 