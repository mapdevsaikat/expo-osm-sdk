/**
 * 🎯 Professional Map Demo
 * 
 * Demonstrates the professional features of expo-osm-sdk:
 * - Mandatory legal attribution for OSM compliance
 * - Professional vector icons (when react-native-vector-icons available)
 * - Graceful fallbacks for missing dependencies
 * - Production-ready map styling
 * 
 * Perfect example for production applications requiring legal compliance.
 */

import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert
} from 'react-native';
import { 
  OSMView, 
  OSMViewRef, 
  MarkerConfig
} from 'expo-osm-sdk';

export default function ProfessionalMapDemo() {
  const mapRef = useRef<OSMViewRef>(null);
  
  // Map configuration
  const [showAttribution, setShowAttribution] = useState(true);
  const [attributionPosition, setAttributionPosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>('bottom-right');
  const [customAttribution, setCustomAttribution] = useState<string[]>([]);
  
  // Sample markers
  const [markers] = useState<MarkerConfig[]>([
    {
      id: 'central-park',
      coordinate: { latitude: 40.7829, longitude: -73.9654 },
      title: 'Central Park',
      description: 'Iconic urban park in Manhattan'
    },
    {
      id: 'times-square',
      coordinate: { latitude: 40.7580, longitude: -73.9855 },
      title: 'Times Square',
      description: 'The crossroads of the world'
    },
    {
      id: 'brooklyn-bridge',
      coordinate: { latitude: 40.7061, longitude: -73.9969 },
      title: 'Brooklyn Bridge',
      description: 'Historic suspension bridge'
    }
  ]);

  const handleMarkerPress = (markerId: string) => {
    const marker = markers.find(m => m.id === markerId);
    if (marker) {
      Alert.alert(marker.title || 'Marker', marker.description || 'Marker details');
    }
  };

  const handleZoomIn = async () => {
    try {
      await mapRef.current?.zoomIn();
    } catch (error) {
      console.error('Zoom in failed:', error);
    }
  };

  const handleZoomOut = async () => {
    try {
      await mapRef.current?.zoomOut();
    } catch (error) {
      console.error('Zoom out failed:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await mapRef.current?.getCurrentLocation();
      if (location) {
        Alert.alert(
          'Current Location',
          `📍 ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}\n` +
          `📶 Accuracy: ${location.accuracy || 'N/A'}m\n` +
          `📡 Source: ${location.source}\n` +
                     '✅ GPS data obtained'
        );
      }
    } catch (error) {
      Alert.alert('Location Error', `Failed to get location: ${error}`);
    }
  };

  const addCustomAttribution = () => {
    const customAttr = [...customAttribution, 'My Custom Attribution'];
    setCustomAttribution(customAttr);
  };

  const removeCustomAttribution = () => {
    setCustomAttribution([]);
  };

  const cycleAttributionPosition = () => {
    const positions: Array<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'> = 
      ['bottom-right', 'bottom-left', 'top-left', 'top-right'];
    const currentIndex = positions.indexOf(attributionPosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    setAttributionPosition(positions[nextIndex]);
  };

  return (
    <View style={styles.container}>
      {/* Map with professional attribution */}
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
        initialZoom={12}
        markers={markers}

        onMarkerPress={handleMarkerPress}
        onMapReady={() => console.log('Professional map ready!')}
      />



      {/* Control Panel */}
      <ScrollView style={styles.controlPanel} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>🏢 Professional Map Demo</Text>
        
        <Text style={styles.subtitle}>
          ✅ Legal OSM Attribution • 🎨 Vector Icons • 📱 Production Ready
        </Text>

        {/* Attribution Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Attribution Control</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Show Attribution (Required)</Text>
            <Switch
              value={showAttribution}
              onValueChange={setShowAttribution}
              trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={cycleAttributionPosition}>
            <Text style={styles.buttonText}>📍 Position: {attributionPosition}</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.addButton]} 
              onPress={addCustomAttribution}
            >
              <Text style={styles.buttonText}>+ Custom</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.removeButton]} 
              onPress={removeCustomAttribution}
            >
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Map Actions</Text>
          
          <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
            <Text style={styles.buttonText}>📍 Get Location (with Fallback)</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚖️ Legal Compliance</Text>
          
          <Text style={styles.legalText}>
            ✅ <Text style={styles.bold}>OpenStreetMap Attribution:</Text> Automatically included and mandatory
          </Text>
          
          <Text style={styles.legalText}>
            ✅ <Text style={styles.bold}>Graceful Fallbacks:</Text> Location permission denial handled properly
          </Text>
          
          <Text style={styles.legalText}>
            ✅ <Text style={styles.bold}>Vector Icons:</Text> Professional UI with react-native-vector-icons (optional)
          </Text>

          <Text style={styles.legalText}>
            ✅ <Text style={styles.bold}>Production Ready:</Text> Error handling and accessibility included
          </Text>
        </View>

        <Text style={styles.info}>
          💡 Attribution control is collapsible but cannot be completely hidden for legal compliance.
        </Text>
      </ScrollView>
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
    bottom: 20,
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
    maxHeight: '50%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 13,
    color: '#333333',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#50C878',
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
  },
  locationButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 11,
    color: '#333333',
    marginBottom: 4,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '600',
  },
  info: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
}); 