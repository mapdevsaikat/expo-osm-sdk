/**
 * Geofencing Example - expo-osm-sdk v1.0.95+
 * 
 * Copy this file to your project and customize!
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  useGeofencing,
  useSingleGeofence,
  type Geofence,
  type GeofenceEvent,
} from 'expo-osm-sdk';

// =============================================================================
// Example 1: Single Store Geofence
// =============================================================================

export function SingleStoreExample() {
  const storeGeofence = {
    id: 'coffee-shop',
    name: 'Bean There Coffee',
    type: 'circle' as const,
    center: { latitude: 37.7749, longitude: -122.4194 },
    radius: 50, // 50 meters
    metadata: {
      address: '123 Market St, San Francisco',
      promotion: '20% off your order!',
    },
  };

  const { isInside, dwellTime, events } = useSingleGeofence(storeGeofence, {
    checkInterval: 5000, // Check every 5 seconds
    dwellThreshold: 60000, // Dwell after 1 minute
    onEnter: (event) => {
      Alert.alert(
        '☕ Welcome!',
        `You're at ${event.geofenceName}!\n\n${event.metadata?.promotion}`,
        [
          { text: 'Dismiss', style: 'cancel' },
          { text: 'View Menu', onPress: () => console.log('Open menu') },
        ]
      );
    },
    onExit: (event) => {
      Alert.alert(
        '👋 Thanks for visiting!',
        'Come back soon for more coffee!'
      );
    },
    onDwell: (event) => {
      Alert.alert(
        '🎉 Loyalty Bonus!',
        'You earned 10 points for visiting!'
      );
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Store Geofence Demo</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Store:</Text>
        <Text style={styles.value}>{storeGeofence.name}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Inside Store:</Text>
        <Text style={[styles.value, isInside && styles.active]}>
          {isInside ? '✅ Yes' : '❌ No'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Time Inside:</Text>
        <Text style={styles.value}>
          {Math.floor(dwellTime / 1000)} seconds
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Recent Events:</Text>
        {events.slice(-3).reverse().map((event, index) => (
          <Text key={index} style={styles.event}>
            • {event.type.toUpperCase()} at {new Date(event.timestamp).toLocaleTimeString()}
          </Text>
        ))}
      </View>
    </View>
  );
}

// =============================================================================
// Example 2: Multiple Stores
// =============================================================================

export function MultipleStoresExample() {
  const stores: Geofence[] = [
    {
      id: 'store-1',
      name: 'Downtown Store',
      type: 'circle',
      center: { latitude: 37.7749, longitude: -122.4194 },
      radius: 50,
      metadata: { promotion: '10% off electronics' },
    },
    {
      id: 'store-2',
      name: 'Airport Store',
      type: 'circle',
      center: { latitude: 37.6213, longitude: -122.3790 },
      radius: 75,
      metadata: { promotion: 'Free gift wrap' },
    },
    {
      id: 'store-3',
      name: 'Mall Store',
      type: 'circle',
      center: { latitude: 37.7893, longitude: -122.4079 },
      radius: 100,
      metadata: { promotion: 'Buy 2 get 1 free' },
    },
  ];

  const { activeGeofences, isInGeofence, getDwellTime } = useGeofencing(stores, {
    checkInterval: 5000,
    onEnter: (event) => {
      Alert.alert(
        `📍 ${event.geofenceName}`,
        event.metadata?.promotion || 'Welcome!'
      );
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Multiple Stores Demo</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Nearby Stores:</Text>
        <Text style={styles.value}>{activeGeofences.length}</Text>
      </View>

      <ScrollView style={styles.storeList}>
        {stores.map((store) => {
          const isNearby = isInGeofence(store.id);
          const dwell = getDwellTime(store.id);
          
          return (
            <View
              key={store.id}
              style={[styles.storeCard, isNearby && styles.storeCardActive]}
            >
              <Text style={styles.storeName}>
                {store.name}
                {isNearby && ' 📍'}
              </Text>
              <Text style={styles.storePromotion}>
                {store.metadata?.promotion}
              </Text>
              {isNearby && (
                <Text style={styles.storeDwell}>
                  Time here: {Math.floor(dwell / 1000)}s
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Example 3: Polygon Geofence (Park)
// =============================================================================

export function PolygonGeofenceExample() {
  const park: Geofence = {
    id: 'central-park',
    name: 'Central Park',
    type: 'polygon',
    coordinates: [
      { latitude: 40.7829, longitude: -73.9654 }, // Northwest
      { latitude: 40.7829, longitude: -73.9489 }, // Northeast
      { latitude: 40.7640, longitude: -73.9489 }, // Southeast
      { latitude: 40.7640, longitude: -73.9654 }, // Southwest
    ],
    metadata: {
      area: 'Manhattan',
      activities: ['Walking', 'Running', 'Picnics'],
    },
  };

  const { isInside, dwellTime } = useSingleGeofence(park, {
    onEnter: (event) => {
      Alert.alert('🌳 Welcome to Central Park!', 'Enjoy your visit!');
    },
    onDwell: (event) => {
      Alert.alert('🏃 Great exercise!', "You've been active for over a minute!");
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Polygon Geofence Demo</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Location:</Text>
        <Text style={styles.value}>{park.name}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Inside Park:</Text>
        <Text style={[styles.value, isInside && styles.active]}>
          {isInside ? '✅ Yes - Enjoy!' : '❌ No'}
        </Text>
      </View>

      {isInside && (
        <View style={styles.card}>
          <Text style={styles.label}>Time in Park:</Text>
          <Text style={styles.value}>
            {Math.floor(dwellTime / 60000)} minutes
          </Text>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// Example 4: Delivery Tracking
// =============================================================================

export function DeliveryTrackingExample() {
  const [deliveryStatus, setDeliveryStatus] = useState('En Route');
  
  const deliveryLocation = {
    latitude: 37.7749,
    longitude: -122.4194,
  };

  const geofences: Geofence[] = [
    {
      id: 'nearby',
      name: 'Nearby',
      type: 'circle',
      center: deliveryLocation,
      radius: 500, // 500m = ~5-10 min away
    },
    {
      id: 'arrived',
      name: 'Arrived',
      type: 'circle',
      center: deliveryLocation,
      radius: 50, // 50m = at location
    },
  ];

  const { activeGeofences } = useGeofencing(geofences, {
    checkInterval: 3000, // Check every 3 seconds
    onEnter: (event) => {
      if (event.geofenceId === 'nearby') {
        setDeliveryStatus('Driver is nearby! (5-10 min)');
        Alert.alert('📦 Delivery Update', 'Your driver is nearby!');
      } else if (event.geofenceId === 'arrived') {
        setDeliveryStatus('Driver has arrived!');
        Alert.alert('📦 Delivery Update', 'Your driver is here!');
      }
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Tracking Demo</Text>
      
      <View style={styles.deliveryCard}>
        <Text style={styles.deliveryStatus}>{deliveryStatus}</Text>
        
        {activeGeofences.includes('nearby') && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🚗 Driver Nearby</Text>
          </View>
        )}
        
        {activeGeofences.includes('arrived') && (
          <View style={[styles.badge, styles.badgeArrived]}>
            <Text style={styles.badgeText}>📦 Driver Arrived!</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// Example 5: Event Log
// =============================================================================

export function EventLogExample() {
  const [eventLog, setEventLog] = useState<GeofenceEvent[]>([]);

  const testGeofence: Geofence = {
    id: 'test',
    name: 'Test Area',
    type: 'circle',
    center: { latitude: 37.7749, longitude: -122.4194 },
    radius: 100,
  };

  const { events, currentLocation, isTracking } = useGeofencing(
    [testGeofence],
    {
      onEvent: (event) => {
        setEventLog(prev => [...prev, event].slice(-10)); // Keep last 10
      },
    }
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event Log Demo</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Tracking:</Text>
        <Text style={styles.value}>
          {isTracking ? '✅ Active' : '❌ Inactive'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Location:</Text>
        <Text style={styles.value}>
          {currentLocation
            ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
            : 'Unknown'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Event History ({events.length} total):</Text>
        <ScrollView style={styles.eventLog}>
          {events.slice(-5).reverse().map((event, index) => (
            <View key={index} style={styles.eventItem}>
              <Text style={styles.eventType}>
                {event.type.toUpperCase()}
              </Text>
              <Text style={styles.eventDetails}>
                {event.geofenceName} at{' '}
                {new Date(event.timestamp).toLocaleTimeString()}
              </Text>
              {event.distance !== undefined && (
                <Text style={styles.eventDistance}>
                  Distance: {Math.round(event.distance)}m
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setEventLog([])}
      >
        <Text style={styles.buttonText}>Clear Log</Text>
      </TouchableOpacity>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  active: {
    color: '#4CAF50',
  },
  event: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  storeList: {
    flex: 1,
  },
  storeCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  storeCardActive: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#f0f9f4',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  storePromotion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  storeDwell: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  deliveryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  deliveryStatus: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  badge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  badgeArrived: {
    backgroundColor: '#4CAF50',
  },
  badgeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  eventLog: {
    maxHeight: 200,
    marginTop: 10,
  },
  eventItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  eventDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  eventDistance: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

