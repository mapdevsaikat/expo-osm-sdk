/**
 * Custom Markers & Overlays Example - expo-osm-sdk v1.0.95+
 * 
 * Demonstrates all custom marker and overlay capabilities
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  OSMView,
  Marker,
  CustomOverlay,
  Polyline,
  Polygon,
  Circle,
  type OSMViewRef,
  type Coordinate,
  type MarkerConfig,
} from 'expo-osm-sdk';

// =============================================================================
// Example 1: Basic Markers with Icons
// =============================================================================

export function BasicMarkersExample() {
  const mapRef = useRef<OSMViewRef>(null);
  
  const markers: MarkerConfig[] = [
    {
      id: 'home',
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      title: 'Home',
      description: 'My house',
      icon: {
        uri: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
        width: 40,
        height: 40,
      },
    },
    {
      id: 'office',
      coordinate: { latitude: 37.7849, longitude: -122.4094 },
      title: 'Office',
      description: 'Where I work',
      icon: {
        uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        width: 40,
        height: 40,
      },
    },
    {
      id: 'restaurant',
      coordinate: { latitude: 37.7649, longitude: -122.4294 },
      title: 'Favorite Restaurant',
      description: 'Best pizza in town',
      icon: {
        uri: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
        width: 40,
        height: 40,
      },
    },
  ];

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        markers={markers}
        onMarkerPress={(marker) => {
          Alert.alert(marker.title || 'Marker', marker.description || '');
        }}
      />
      
      <View style={styles.controls}>
        <Text style={styles.title}>Basic Markers</Text>
        <Text style={styles.subtitle}>
          {markers.length} markers with custom icons
        </Text>
      </View>
    </View>
  );
}

// =============================================================================
// Example 2: Interactive Markers
// =============================================================================

export function InteractiveMarkersExample() {
  const mapRef = useRef<OSMViewRef>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [markerCount, setMarkerCount] = useState(3);

  const markers: MarkerConfig[] = Array.from({ length: markerCount }, (_, i) => ({
    id: `marker-${i}`,
    coordinate: {
      latitude: 37.7749 + (Math.random() - 0.5) * 0.02,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.02,
    },
    title: `Location ${i + 1}`,
    description: `Marker #${i + 1}`,
    icon: {
      uri: selectedMarker === `marker-${i}`
        ? 'https://cdn-icons-png.flaticon.com/512/447/447031.png' // Selected (red)
        : 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Default (blue)
      width: selectedMarker === `marker-${i}` ? 50 : 40,
      height: selectedMarker === `marker-${i}` ? 50 : 40,
    },
  }));

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        markers={markers}
        onMarkerPress={(marker) => {
          setSelectedMarker(marker.id);
          Alert.alert('Selected', marker.title || 'Marker');
        }}
      />
      
      <View style={styles.controls}>
        <Text style={styles.title}>Interactive Markers</Text>
        <Text style={styles.subtitle}>
          Selected: {selectedMarker || 'None'}
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setMarkerCount(prev => Math.min(prev + 1, 10))}
          >
            <Text style={styles.buttonText}>Add Marker</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => setMarkerCount(prev => Math.max(prev - 1, 0))}
          >
            <Text style={styles.buttonText}>Remove Marker</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// Example 3: Shapes - Circles
// =============================================================================

export function CircleExample() {
  const mapRef = useRef<OSMViewRef>(null);
  const [radius, setRadius] = useState(500);

  const circles = [
    {
      id: 'delivery-zone',
      center: { latitude: 37.7749, longitude: -122.4194 },
      radius: radius,
      fillColor: 'rgba(0, 122, 255, 0.2)',
      strokeColor: '#007AFF',
      strokeWidth: 2,
    },
  ];

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        circles={circles}
        markers={[
          {
            id: 'center',
            coordinate: { latitude: 37.7749, longitude: -122.4194 },
            title: 'Delivery Center',
            icon: {
              uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
              width: 40,
              height: 40,
            },
          },
        ]}
      />
      
      <View style={styles.controls}>
        <Text style={styles.title}>Delivery Zone</Text>
        <Text style={styles.subtitle}>Radius: {radius}m</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setRadius(prev => Math.min(prev + 100, 2000))}
          >
            <Text style={styles.buttonText}>Increase</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => setRadius(prev => Math.max(prev - 100, 100))}
          >
            <Text style={styles.buttonText}>Decrease</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// Example 4: Shapes - Polygons
// =============================================================================

export function PolygonExample() {
  const mapRef = useRef<OSMViewRef>(null);

  const zones = [
    {
      id: 'zone-a',
      coordinates: [
        { latitude: 37.7769, longitude: -122.4214 },
        { latitude: 37.7769, longitude: -122.4174 },
        { latitude: 37.7729, longitude: -122.4174 },
        { latitude: 37.7729, longitude: -122.4214 },
      ],
      fillColor: 'rgba(76, 175, 80, 0.3)',
      strokeColor: '#4CAF50',
      strokeWidth: 2,
    },
    {
      id: 'zone-b',
      coordinates: [
        { latitude: 37.7769, longitude: -122.4174 },
        { latitude: 37.7769, longitude: -122.4134 },
        { latitude: 37.7729, longitude: -122.4134 },
        { latitude: 37.7729, longitude: -122.4174 },
      ],
      fillColor: 'rgba(244, 67, 54, 0.3)',
      strokeColor: '#F44336',
      strokeWidth: 2,
    },
  ];

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4174,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        polygons={zones}
      />
      
      <View style={styles.controls}>
        <Text style={styles.title}>Delivery Zones</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Zone A (Available)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>Zone B (Busy)</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// Example 5: Routes - Polylines
// =============================================================================

export function PolylineExample() {
  const mapRef = useRef<OSMViewRef>(null);

  const routes = [
    {
      id: 'route-1',
      coordinates: [
        { latitude: 37.7749, longitude: -122.4194 },
        { latitude: 37.7779, longitude: -122.4164 },
        { latitude: 37.7809, longitude: -122.4134 },
        { latitude: 37.7839, longitude: -122.4104 },
      ],
      strokeColor: '#2196F3',
      strokeWidth: 4,
    },
    {
      id: 'route-2',
      coordinates: [
        { latitude: 37.7749, longitude: -122.4194 },
        { latitude: 37.7719, longitude: -122.4224 },
        { latitude: 37.7689, longitude: -122.4254 },
      ],
      strokeColor: '#4CAF50',
      strokeWidth: 4,
    },
  ];

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.7764,
          longitude: -122.4224,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        polylines={routes}
        markers={[
          {
            id: 'start',
            coordinate: { latitude: 37.7749, longitude: -122.4194 },
            title: 'Start',
            icon: {
              uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
              width: 40,
              height: 40,
            },
          },
        ]}
      />
      
      <View style={styles.controls}>
        <Text style={styles.title}>Route Options</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>Route 1 (15 min)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Route 2 (12 min)</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// Example 6: Combined - All Features
// =============================================================================

export function CombinedExample() {
  const mapRef = useRef<OSMViewRef>(null);

  const markers: MarkerConfig[] = [
    {
      id: 'restaurant',
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      title: 'Restaurant',
      icon: {
        uri: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
        width: 40,
        height: 40,
      },
    },
    {
      id: 'customer',
      coordinate: { latitude: 37.7819, longitude: -122.4124 },
      title: 'Customer',
      icon: {
        uri: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
        width: 40,
        height: 40,
      },
    },
  ];

  const deliveryZone = {
    id: 'zone',
    center: { latitude: 37.7749, longitude: -122.4194 },
    radius: 1000,
    fillColor: 'rgba(76, 175, 80, 0.1)',
    strokeColor: '#4CAF50',
    strokeWidth: 2,
  };

  const route = {
    id: 'delivery-route',
    coordinates: [
      { latitude: 37.7749, longitude: -122.4194 },
      { latitude: 37.7779, longitude: -122.4164 },
      { latitude: 37.7809, longitude: -122.4134 },
      { latitude: 37.7819, longitude: -122.4124 },
    ],
    strokeColor: '#2196F3',
    strokeWidth: 4,
  };

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.7784,
          longitude: -122.4159,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        markers={markers}
        circles={[deliveryZone]}
        polylines={[route]}
      />
      
      <View style={styles.controls}>
        <Text style={styles.title}>Delivery Tracking</Text>
        <Text style={styles.subtitle}>Restaurant → Customer</Text>
        
        <View style={styles.stats}>
          <Text style={styles.statText}>🕒 Est. Time: 12 min</Text>
          <Text style={styles.statText}>📍 Distance: 1.2 km</Text>
          <Text style={styles.statText}>🚗 In delivery zone</Text>
        </View>
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
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  legend: {
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
  stats: {
    marginTop: 10,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
});

