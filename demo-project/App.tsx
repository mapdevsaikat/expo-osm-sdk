import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { OSMView } from 'expo-osm-sdk';
import React from 'react';

export default function App() {
  console.log('App rendering, OSMView:', OSMView);
  
  if (!OSMView) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>OSMView component not found</Text>
        <Text style={styles.debugText}>Check if expo-osm-sdk is properly installed</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OSMView
        style={styles.map}
        initialCenter={{ latitude: 40.7128, longitude: -74.0060 }} // New York City
        initialZoom={13}
        onMapReady={() => console.log('Map is ready!')}
        onPress={(coordinate) => console.log('Map pressed at:', coordinate)}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    margin: 20,
  },
  debugText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    margin: 10,
  },
}); 