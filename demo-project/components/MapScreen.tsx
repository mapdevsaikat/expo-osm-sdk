import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  Navigation,
  RotateCcw,
  Info,
} from 'lucide-react-native';
import { OSMView, MarkerConfig } from 'expo-osm-sdk';
import { InfoPanel } from './InfoPanel';

export default function MapScreen() {
  const [showInfo, setShowInfo] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    zoom: 13,
  });

  const [markers, setMarkers] = useState<MarkerConfig[]>([
    {
      id: 'sf-downtown',
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      title: 'San Francisco',
      description: 'City by the Bay',
    },
    {
      id: 'north-beach',
      coordinate: { latitude: 37.7849, longitude: -122.4094 },
      title: 'North Beach',
      description: 'Italian Quarter',
    },
    {
      id: 'mission-district',
      coordinate: { latitude: 37.7649, longitude: -122.4294 },
      title: 'Mission District',
      description: 'Vibrant neighborhood',
    },
  ]);



  const handleLocationChange = (region: any) => {
    setCurrentLocation({
      latitude: region.latitude,
      longitude: region.longitude,
      zoom: Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2),
    });
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(currentLocation.zoom + 1, 18);
    setCurrentLocation(prev => ({ ...prev, zoom: newZoom }));
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentLocation.zoom - 1, 1);
    setCurrentLocation(prev => ({ ...prev, zoom: newZoom }));
  };

  const handleResetView = () => {
    setCurrentLocation({
      latitude: 37.7749,
      longitude: -122.4194,
      zoom: 13,
    });
  };

  const handleGetLocation = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Location services are optimized for mobile devices');
      return;
    }
    
    // This would integrate with expo-location in a real implementation
    Alert.alert('Location', 'Getting current location...');
  };

  const handleMapPress = (coordinate: any) => {
    const newMarker: MarkerConfig = {
      id: `marker-${Date.now()}`,
      coordinate,
      title: 'New Marker',
      description: 'Added by user',
    };
    setMarkers([...markers, newMarker]);
  };

  const handleMarkerPress = (markerId: string) => {
    const marker = markers.find(m => m.id === markerId);
    if (marker) {
      Alert.alert('Marker Info', `${marker.title}\n${marker.description}`);
    }
  };

  // Check if we're in Expo Go (no native module support)
  const isExpoGo = !(global as any).ExpoModules && Platform.OS !== 'web';

  if (isExpoGo) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MapPin size={24} color="#2563EB" />
            <Text style={styles.headerTitle}>OpenStreetMap Demo</Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowInfo(!showInfo)}
            >
              <Info size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Expo Go Message */}
        <View style={styles.expoGoContainer}>
          <Text style={styles.expoGoTitle}>Native Map Not Available</Text>
          <Text style={styles.expoGoText}>
            The native OpenStreetMap component requires a development build.
            Please run this app with a development build to see the full map experience.
          </Text>
          <Text style={styles.expoGoSubtext}>
            Try running: npx expo run:ios or npx expo run:android
          </Text>
        </View>

        {/* Info Panel */}
        {showInfo && (
          <InfoPanel onClose={() => setShowInfo(false)} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MapPin size={24} color="#2563EB" />
          <Text style={styles.headerTitle}>OpenStreetMap Demo</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowInfo(!showInfo)}
          >
            <Info size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapWrapper}>
        <OSMView
          style={styles.map}
          initialCenter={{ 
            latitude: currentLocation.latitude, 
            longitude: currentLocation.longitude 
          }}
          initialZoom={currentLocation.zoom}
          markers={markers}
          onMapReady={() => console.log('Map ready!')}
          onRegionChange={handleLocationChange}
          onMarkerPress={handleMarkerPress}
          onPress={handleMapPress}
        />
        
        {/* Map Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
            <ZoomIn size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
            <ZoomOut size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={handleResetView}>
            <RotateCcw size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={handleGetLocation}>
            <Navigation size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            Lat: {currentLocation.latitude.toFixed(4)}
          </Text>
          <Text style={styles.locationText}>
            Lng: {currentLocation.longitude.toFixed(4)}
          </Text>
          <Text style={styles.locationText}>
            Zoom: {currentLocation.zoom}
          </Text>
          <Text style={styles.locationText}>
            Markers: {markers.length}
          </Text>
        </View>
      </View>

      {/* Info Panel */}
      {showInfo && (
        <InfoPanel onClose={() => setShowInfo(false)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginLeft: 12,
  },
  infoButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationInfo: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  locationText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  expoGoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  expoGoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  expoGoText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  expoGoSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 