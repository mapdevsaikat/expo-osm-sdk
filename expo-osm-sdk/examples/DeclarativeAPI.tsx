/**
 * 🎯 Declarative API Example
 * 
 * Demonstrates the new JSX children API introduced in v1.1.0:
 * - Declarative Marker components
 * - Polyline for routes
 * - Polygon for areas
 * - Circle for radius visualization
 * - Mixed with props API
 * 
 * This approach feels familiar to react-native-maps users!
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch } from 'react-native';
import { 
  OSMView, 
  Marker, 
  Polyline, 
  Polygon, 
  Circle, 
  Coordinate 
} from 'expo-osm-sdk';

export default function DeclarativeAPI() {
  // Toggle different overlays
  const [showRoute, setShowRoute] = useState(true);
  const [showArea, setShowArea] = useState(true);
  const [showRadius, setShowRadius] = useState(true);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);

  // Sample data
  const tourRoute = [
    { latitude: 40.7614, longitude: -73.9776 }, // Times Square
    { latitude: 40.7484, longitude: -73.9857 }, // Empire State Building  
    { latitude: 40.7505, longitude: -73.9934 }, // Herald Square
    { latitude: 40.7580, longitude: -73.9855 }, // Bryant Park
  ];

  const centralPark = [
    { latitude: 40.7829, longitude: -73.9654 },
    { latitude: 40.7829, longitude: -73.9489 },
    { latitude: 40.7644, longitude: -73.9489 },
    { latitude: 40.7644, longitude: -73.9654 },
  ];

  return (
    <View style={styles.container}>
      {/* Map with Declarative Components */}
      <OSMView
        style={styles.map}
        initialCenter={{ latitude: 40.7614, longitude: -73.9776 }}
        initialZoom={13}
        clustering={{ enabled: true, radius: 50 }}
        onUserLocationChange={setUserLocation}
      >
        {/* Static Markers - Always visible */}
        <Marker
          coordinate={{ latitude: 40.7614, longitude: -73.9776 }}
          title="Times Square"
          description="The crossroads of the world! 🌟"
        />
        
        <Marker
          coordinate={{ latitude: 40.7484, longitude: -73.9857 }}
          title="Empire State Building"
          description="Iconic NYC skyscraper 🏢"
        />
        
        <Marker
          coordinate={{ latitude: 40.7505, longitude: -73.9934 }}
          title="Herald Square"
          description="Shopping district with Macy's 🛍️"
        />
        
        <Marker
          coordinate={{ latitude: 40.7580, longitude: -73.9855 }}
          title="Bryant Park"
          description="Beautiful green space in Midtown 🌳"
        />

        {/* User Location Marker - Conditional */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You Are Here"
            description="Your current location 📍"
          />
        )}

        {/* Tour Route - Toggleable */}
        {showRoute && (
          <Polyline
            coordinates={tourRoute}
            strokeColor="#FF6B6B"
            strokeWidth={4}
            strokeOpacity={0.8}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Central Park Area - Toggleable */}
        {showArea && (
          <Polygon
            coordinates={centralPark}
            fillColor="#4CAF5040"
            fillOpacity={0.3}
            strokeColor="#4CAF50"
            strokeWidth={2}
            strokeOpacity={0.8}
          />
        )}

        {/* Times Square Radius - Toggleable */}
        {showRadius && (
          <Circle
            center={{ latitude: 40.7614, longitude: -73.9776 }}
            radius={500}
            fillColor="#2196F330"
            fillOpacity={0.2}
            strokeColor="#2196F3"
            strokeWidth={2}
            strokeOpacity={0.6}
          />
        )}
      </OSMView>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <Text style={styles.title}>🎯 Declarative API Demo</Text>
        
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Tour Route</Text>
          <Switch
            value={showRoute}
            onValueChange={setShowRoute}
            trackColor={{ false: '#E0E0E0', true: '#FF6B6B' }}
          />
        </View>
        
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Central Park</Text>
          <Switch
            value={showArea}
            onValueChange={setShowArea}
            trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
          />
        </View>
        
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Times Sq Radius</Text>
          <Switch
            value={showRadius}
            onValueChange={setShowRadius}
            trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
          />
        </View>

        <Text style={styles.info}>
          💡 This demo uses JSX children API - components are declared as JSX elements instead of props arrays!
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
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  info: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
}); 