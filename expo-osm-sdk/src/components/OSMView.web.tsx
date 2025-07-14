import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OSMViewProps } from '../types';

/**
 * Web fallback component for OSMView.
 *
 * This component is automatically used on the web platform by the bundler
 * to prevent crashes, since the native view is not available.
 */
const OSMView: React.FC<OSMViewProps> = ({ 
  style, 
  initialCenter = { latitude: 0, longitude: 0 }, 
  initialZoom = 10,
  markers = []
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Text style={styles.title}>🗺️ OpenStreetMap View</Text>
        <Text style={styles.subtitle}>Web Platform</Text>
        <Text style={styles.description}>
          This component requires a native implementation and is not available on web.
        </Text>
        <Text style={styles.suggestion}>
          For web support, consider using:
        </Text>
        <Text style={styles.suggestions}>
          • react-leaflet for OpenStreetMap
          • react-map-gl for Mapbox GL
          • Google Maps JavaScript API
        </Text>
        <View style={styles.info}>
          <Text style={styles.infoText}>
            📍 Center: {initialCenter.latitude.toFixed(4)}, {initialCenter.longitude.toFixed(4)}
          </Text>
          <Text style={styles.infoText}>🔍 Zoom: {initialZoom}</Text>
          {markers.length > 0 && (
            <Text style={styles.infoText}>📌 Markers: {markers.length}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  suggestion: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  suggestions: {
    fontSize: 14,
    color: '#4a5568',
    textAlign: 'left',
    marginBottom: 20,
    lineHeight: 20,
  },
  info: {
    backgroundColor: '#edf2f7',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default OSMView; 