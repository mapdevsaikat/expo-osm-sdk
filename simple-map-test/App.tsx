import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  OSMView,
  OSMViewRef,
  Coordinate,
  TILE_CONFIGS,
  SearchBox,
  SearchLocation,
  MarkerConfig,
  PolylineConfig,
  CircleConfig,
} from 'expo-osm-sdk';
import * as Location from 'expo-location';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Demo locations around New York City
const NYC_CENTER: Coordinate = { latitude: 40.7128, longitude: -74.0060 };
const DEMO_LOCATIONS = [
  { latitude: 40.7589, longitude: -73.9851, title: 'Times Square', description: 'The heart of NYC' },
  { latitude: 40.7505, longitude: -73.9934, title: 'Empire State Building', description: 'Iconic skyscraper' },
  { latitude: 40.7061, longitude: -74.0087, title: 'One World Trade Center', description: 'Freedom Tower' },
  { latitude: 40.6892, longitude: -74.0445, title: 'Statue of Liberty', description: 'Symbol of freedom' },
];

const DEMO_ROUTE: Coordinate[] = [
  { latitude: 40.7589, longitude: -73.9851 }, // Times Square
  { latitude: 40.7505, longitude: -73.9934 }, // Empire State
  { latitude: 40.7061, longitude: -74.0087 }, // One World Trade
];

// Platform detection utilities
const isWeb = Platform.OS === 'web';
const isExpoGo = !!(global as any).expo && !(global as any).ExpoModules;
const isNative = Platform.OS !== 'web' && !isExpoGo;

const App: React.FC = () => {
  const mapRef = useRef<OSMViewRef>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedTileLayer, setSelectedTileLayer] = useState<'openMapTiles' | 'rasterTiles'>('openMapTiles');
  const [showDemoFeatures, setShowDemoFeatures] = useState(true);

  // Request location permissions on app start (not needed on web)
  useEffect(() => {
    if (!isWeb) {
      requestLocationPermission();
    }
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to show your current location on the map.'
        );
      }
    } catch (error) {
      console.warn('Error requesting location permission:', error);
    }
  };

  const handleGetCurrentLocation = async () => {
    if (isLoadingLocation || !mapRef.current) return;

    setIsLoadingLocation(true);
    try {
      if (isWeb && navigator.geolocation) {
        // Use browser geolocation API for web
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          });
        });
        
        const coordinate: Coordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        
        setCurrentLocation(coordinate);
        await mapRef.current.animateToLocation(
          coordinate.latitude,
          coordinate.longitude,
          15
        );
        
        Alert.alert('Success', 'Found your location!');
      } else if (isNative) {
        // Use native location services
        await mapRef.current.startLocationTracking();
        const location = await mapRef.current.waitForLocation(15);
        
        const coordinate: Coordinate = {
          latitude: location.latitude,
          longitude: location.longitude,
        };

        setCurrentLocation(coordinate);
        await mapRef.current.animateToLocation(
          coordinate.latitude,
          coordinate.longitude,
          15
        );

        Alert.alert('Success', 'Found your location!');
      } else {
        // Expo Go fallback - simulate location
        const mockLocation: Coordinate = {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
        };
        
        setCurrentLocation(mockLocation);
        Alert.alert('Demo Mode', 'Showing simulated location in Expo Go');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error', 
        isWeb 
          ? 'Could not get your location. Please allow location access in your browser.'
          : 'Could not get your current location. Make sure location services are enabled.'
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleLocationSelected = async (location: SearchLocation) => {
    if (location && mapRef.current) {
      await mapRef.current.animateToLocation(
        location.coordinate.latitude,
        location.coordinate.longitude,
        15
      );
    }
  };

  const cycleTileLayer = () => {
    setSelectedTileLayer(prev => 
      prev === 'openMapTiles' ? 'rasterTiles' : 'openMapTiles'
    );
  };

  const getTileLayerName = () => {
    return selectedTileLayer === 'openMapTiles' ? 'Vector Map' : 'Raster Map';
  };

  const showNYCTour = async () => {
    if (!mapRef.current) return;

    // Animate to NYC overview
    await mapRef.current.animateToLocation(40.7128, -74.0060, 11);

    Alert.alert(
      'NYC Tour',
      'Explore the demo markers and route showcasing iconic NYC locations!'
    );
  };

  const getCurrentTileConfig = () => {
    return TILE_CONFIGS[selectedTileLayer];
  };

  const getDemoMarkers = (): MarkerConfig[] => {
    if (!showDemoFeatures) return [];
    
    return DEMO_LOCATIONS.map((location, index) => ({
      id: `demo-marker-${index}`,
      coordinate: location,
      title: location.title,
      description: location.description,
      icon: {
        color: '#8c14ff',
        size: 30
      }
    }));
  };

  const getDemoPolylines = (): PolylineConfig[] => {
    if (!showDemoFeatures) return [];
    
    return [{
      id: 'demo-route',
      coordinates: DEMO_ROUTE,
      strokeColor: '#8c14ff',
      strokeWidth: 4,
      strokeOpacity: 0.8
    }];
  };

  const getCurrentLocationCircles = (): CircleConfig[] => {
    if (!currentLocation) return [];
    
    return [{
      id: 'current-location-circle',
      center: currentLocation,
      radius: 100,
      fillColor: 'rgba(140, 20, 255, 0.2)',
      strokeColor: '#8c14ff',
      strokeWidth: 2
    }];
  };

  // Platform-specific header subtitle
  const getSubtitle = () => {
    if (isWeb) return 'First OpenStreetMap SDK for Expo • Web Version';
    if (isExpoGo) return 'First OpenStreetMap SDK for Expo • Expo Go Demo';
    return 'First OpenStreetMap SDK for Expo';
  };

  // Platform-specific disclaimer
  const renderPlatformInfo = () => {
    if (isWeb) {
      return (
        <View style={styles.platformInfo}>
          <Text style={styles.platformInfoText}>
            🌐 Running on Web with MapLibre GL JS
          </Text>
        </View>
      );
    }
    
    if (isExpoGo) {
      return (
        <View style={[styles.platformInfo, styles.expoGoInfo]}>
          <Text style={styles.platformInfoText}>
            📱 Expo Go Demo Mode - Limited functionality
          </Text>
          <Text style={styles.platformInfoSubtext}>
            For full native features, use a development build
          </Text>
        </View>
      );
    }
    
    return null;
  };

  // Custom Expo Go fallback that looks beautiful
  const renderExpoGoMap = () => {
    return (
      <View style={styles.expoGoMap}>
        <View style={styles.expoGoMapHeader}>
          <Text style={styles.expoGoMapTitle}>🗺️ Interactive Demo</Text>
          <Text style={styles.expoGoMapSubtitle}>
            NYC Landmarks Showcase
          </Text>
        </View>
        
        <View style={styles.landmarksList}>
          {DEMO_LOCATIONS.map((location, index) => (
            <TouchableOpacity
              key={index}
              style={styles.landmarkItem}
              onPress={() => {
                Alert.alert(
                  location.title,
                  `${location.description}\n\nCoordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                );
              }}
            >
              <View style={styles.landmarkMarker}>
                <Text style={styles.landmarkMarkerText}>📍</Text>
              </View>
              <View style={styles.landmarkInfo}>
                <Text style={styles.landmarkTitle}>{location.title}</Text>
                <Text style={styles.landmarkDescription}>{location.description}</Text>
                <Text style={styles.landmarkCoords}>
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.expoGoMapFooter}>
          <Text style={styles.expoGoMapFooterText}>
            ℹ️ This is a demo version running in Expo Go
          </Text>
          <Text style={styles.expoGoMapFooterSubtext}>
            Use a development build for the full interactive map experience
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Expo OSM SDK</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>
      </View>

      {/* Platform Information */}
      {renderPlatformInfo()}

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {isExpoGo ? (
          renderExpoGoMap()
        ) : (
          <OSMView
            ref={mapRef}
            style={styles.map}
            initialCenter={NYC_CENTER}
            initialZoom={12}
            styleUrl={getCurrentTileConfig().isVector ? (getCurrentTileConfig() as any).styleUrl : undefined}
            tileServerUrl={!getCurrentTileConfig().isVector ? (getCurrentTileConfig() as any).tileUrl : undefined}
            showUserLocation={true}
            followUserLocation={false}
            showsZoomControls={true}
            clustering={{ 
              enabled: true, 
              radius: 50, 
              maxZoom: 16,
              colors: ['#8c14ff'],
              textColor: '#ffffff'
            }}
            markers={getDemoMarkers()}
            polylines={getDemoPolylines()}
            circles={getCurrentLocationCircles()}
          />
        )}

        {/* Search Box - Only show on native and web, not in Expo Go */}
        {!isExpoGo && (
          <View style={styles.searchContainer}>
            <SearchBox
              placeholder="Search places..."
              onLocationSelected={handleLocationSelected}
              style={styles.searchBox}
              maxResults={5}
              autoComplete={true}
            />
          </View>
        )}

        {/* Location Button - Only show when not in Expo Go or when map is rendered */}
        {!isExpoGo && (
          <TouchableOpacity 
            style={[styles.locationButton, isLoadingLocation && styles.locationButtonLoading]}
            onPress={handleGetCurrentLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.locationButtonText}>📍 My Location</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Control Panel - Only show when not in Expo Go */}
        {!isExpoGo && (
          <View style={[styles.controlPanel, isWeb && styles.controlPanelWeb]}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={cycleTileLayer}
            >
              <Text style={styles.controlButtonText}>
                🗂️ {getTileLayerName()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => setShowDemoFeatures(!showDemoFeatures)}
            >
              <Text style={styles.controlButtonText}>
                {showDemoFeatures ? '🔲' : '☑️'} Demo Features
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlButton, styles.primaryButton]}
              onPress={showNYCTour}
            >
              <Text style={[styles.controlButtonText, styles.primaryButtonText]}>
                🗽 NYC Tour
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Location Loading Indicator */}
        {isLoadingLocation && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8c14ff" />
              <Text style={styles.loadingText}>
                {isWeb ? 'Getting your location...' : 'Finding your location...'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🚀 OpenStreetMap • Search • Location • Overlays
          {isWeb && ' • Powered by MapLibre GL JS'}
          {isExpoGo && ' • Demo Mode'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  title: {
    fontSize: isWeb ? 28 : 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: isWeb ? 16 : 14,
    color: '#8c14ff',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  platformInfo: {
    backgroundColor: '#f0f8ff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  expoGoInfo: {
    backgroundColor: '#fff3cd',
  },
  platformInfoText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '600',
  },
  platformInfoSubtext: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  searchBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  locationButton: {
    position: 'absolute',
    top: isExpoGo ? 20 : 80,
    right: 20,
    backgroundColor: '#8c14ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#8c14ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtonLoading: {
    opacity: 0.8,
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  controlPanel: {
    position: 'absolute',
    bottom: isWeb ? 80 : 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  controlPanelWeb: {
    maxWidth: 400,
    alignSelf: 'center',
    left: 'auto',
    right: 'auto',
  },
  controlButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#8c14ff',
    marginBottom: 0,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  // Expo Go custom map styles
  expoGoMap: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  expoGoMapHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expoGoMapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  expoGoMapSubtitle: {
    fontSize: 16,
    color: '#8c14ff',
    fontWeight: '600',
  },
  landmarksList: {
    flex: 1,
  },
  landmarkItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  landmarkMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8c14ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  landmarkMarkerText: {
    fontSize: 20,
  },
  landmarkInfo: {
    flex: 1,
  },
  landmarkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  landmarkDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  landmarkCoords: {
    fontSize: 12,
    color: '#8c14ff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  expoGoMapFooter: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  expoGoMapFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  expoGoMapFooterSubtext: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
});

export default App; 