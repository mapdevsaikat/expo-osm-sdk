import React, { forwardRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';

// Note: This is a placeholder component for the actual expo-osm-sdk implementation
// In a real implementation, you would import and use the actual SDK components

interface MapContainerProps {
  location: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  onLocationChange: (location: any) => void;
}

const { width, height } = Dimensions.get('window');

export const MapContainer = forwardRef<any, MapContainerProps>(
  ({ location, onLocationChange }, ref) => {
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
      // Simulate map initialization
      const timer = setTimeout(() => {
        setMapReady(true);
      }, 1000);

      return () => clearTimeout(timer);
    }, []);

    // Sample markers for demonstration
    const sampleMarkers = [
      {
        id: '1',
        latitude: 37.7749,
        longitude: -122.4194,
        title: 'San Francisco',
        description: 'City by the Bay',
      },
      {
        id: '2',
        latitude: 37.7849,
        longitude: -122.4094,
        title: 'North Beach',
        description: 'Italian Quarter',
      },
      {
        id: '3',
        latitude: 37.7649,
        longitude: -122.4294,
        title: 'Mission District',
        description: 'Vibrant neighborhood',
      },
    ];

    if (!mapReady) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading OpenStreetMap...</Text>
          <Text style={styles.loadingSubtext}>
            Initializing expo-osm-sdk
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {/* Placeholder for actual OSM map component */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapTitle}>OpenStreetMap</Text>
          <Text style={styles.mapSubtitle}>
            Powered by expo-osm-sdk
          </Text>
          
          <View style={styles.coordinatesDisplay}>
            <Text style={styles.coordinatesTitle}>Current View:</Text>
            <Text style={styles.coordinatesText}>
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
            <Text style={styles.zoomText}>Zoom Level: {location.zoom}</Text>
          </View>

          {/* Sample markers visualization */}
          <View style={styles.markersContainer}>
            <Text style={styles.markersTitle}>Sample Markers:</Text>
            {sampleMarkers.map((marker) => (
              <View key={marker.id} style={styles.markerItem}>
                <View style={styles.markerDot} />
                <View style={styles.markerInfo}>
                  <Text style={styles.markerTitle}>{marker.title}</Text>
                  <Text style={styles.markerDescription}>
                    {marker.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.note}>
            {Platform.OS === 'web' 
              ? 'Run on iOS/Android for full native experience'
              : 'Native OpenStreetMap integration active'
            }
          </Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  mapSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
  },
  coordinatesDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  coordinatesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  coordinatesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  zoomText: {
    fontSize: 14,
    color: '#6b7280',
  },
  markersContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
  },
  markersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  markerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
    marginRight: 12,
  },
  markerInfo: {
    flex: 1,
  },
  markerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  markerDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  note: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
});