import React, { useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  Switch, 
  ScrollView, 
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { OSMView, OSMViewRef, Coordinate, MapRegion, MarkerConfig, TILE_CONFIGS } from 'expo-osm-sdk';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.4; // 40% of screen height

const App: React.FC = () => {
  const mapRef = useRef<OSMViewRef>(null);
  
  // State management
  const [markers, setMarkers] = useState<MarkerConfig[]>([]);
  const [useVectorTiles, setUseVectorTiles] = useState<boolean>(true);
  const [showUserLocation, setShowUserLocation] = useState<boolean>(false);
  const [followUserLocation, setFollowUserLocation] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'location' | 'navigation' | 'settings'>('location');

  // Map center coordinates (New York City default)
  const [mapCenter] = useState<Coordinate>({ latitude: 40.7128, longitude: -74.0060 });
  const [currentZoom] = useState<number>(13);

  const handleMapReady = () => {
    const currentUrl = useVectorTiles ? TILE_CONFIGS.openMapTiles.styleUrl : TILE_CONFIGS.rasterTiles.tileUrl;
    console.log('🗺️ Map is ready with tiles:', {
      useVectorTiles,
      currentUrl,
      tileConfigs: TILE_CONFIGS
    });
  };

  const handleRegionChange = (region: MapRegion) => {
    console.log('🌍 Region changed:', region);
  };

  const handleMapPress = (coordinate: Coordinate) => {
    const newMarker: MarkerConfig = {
      id: `marker-${Date.now()}`,
      coordinate,
      title: 'Tap Marker',
      description: `Added at ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
    };
    setMarkers(prev => [...prev, newMarker]);
    console.log('📍 Added marker at:', coordinate);
  };

  const handleMarkerPress = (markerId: string, coordinate: Coordinate) => {
    const marker = markers.find(m => m.id === markerId);
    if (marker) {
      Alert.alert('Marker Info', `${marker.title}\n${marker.description}`);
    }
    console.log('🔍 Marker pressed:', markerId, coordinate);
  };

  const handleUserLocationChange = (location: Coordinate) => {
    console.log('📍 User location updated:', location);
    setUserLocation(location);
  };

  const toggleTileMode = useCallback(() => {
    const newVectorMode = !useVectorTiles;
    setUseVectorTiles(newVectorMode);
    console.log('🔄 Switching tile mode to:', newVectorMode ? 'Vector' : 'Raster');
  }, [useVectorTiles]);

  // Location functions
  const toggleLocationTracking = useCallback(async () => {
    try {
      if (showUserLocation) {
        await mapRef.current?.stopLocationTracking();
        setShowUserLocation(false);
        console.log('📍 Stopped location tracking');
      } else {
        await mapRef.current?.startLocationTracking();
        setShowUserLocation(true);
        console.log('📍 Started location tracking');
      }
    } catch (error) {
      console.error('❌ Location tracking failed:', error);
      Alert.alert(
        'Location Permission Required', 
        'Please enable location permissions in your device settings to use this feature.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }
  }, [showUserLocation]);

  const getCurrentLocation = useCallback(async () => {
    try {
      console.log('📍 Getting current location with direct method...');
      
      // Try direct getCurrentLocation first (uses cached location)
      const location = await mapRef.current?.getCurrentLocation();
      if (location) {
        console.log('📍 Current location:', location);
        Alert.alert(
          'Current Location', 
          `Latitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}`,
          [{ text: 'OK', style: 'default' }]
        );
        
        // Enable location display after getting first fix
        if (!showUserLocation) {
          setShowUserLocation(true);
        }
      }
    } catch (error) {
      console.error('❌ Get location failed:', error);
      
      // Fallback: try waitForLocation as backup
      try {
        console.log('📍 Trying waitForLocation fallback...');
        const location = await mapRef.current?.waitForLocation(30);
        if (location) {
          console.log('📍 Fallback location success:', location);
          Alert.alert(
            'Current Location', 
            `Latitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}\n\n${location.accuracy ? `Accuracy: ${location.accuracy.toFixed(1)}m` : ''}`,
            [{ text: 'OK', style: 'default' }]
          );
          
          if (!showUserLocation) {
            setShowUserLocation(true);
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        Alert.alert(
          'Location Error', 
          'Unable to get current location. Please:\n\n1. Enable location permissions for this app\n2. Turn on location services\n3. Ensure GPS has clear view of sky\n4. Try again in a few moments',
          [{ text: 'OK', style: 'default' }]
        );
      }
    }
  }, [showUserLocation]);

  const flyToCurrentLocation = useCallback(async () => {
    try {
      console.log('✈️ Flying to current location with improved flow...');
      
      // Use the new waitForLocation function that waits for fresh GPS data
      const location = await mapRef.current?.waitForLocation(30); // 30 second timeout
      if (location) {
        await mapRef.current?.animateToLocation(location.latitude, location.longitude, 15);
        console.log('✈️ Flying to current location:', location);
        
        // Enable location display after getting first fix
        if (!showUserLocation) {
          setShowUserLocation(true);
        }
      }
    } catch (error) {
      console.error('❌ Location animation failed:', error);
      Alert.alert(
        'Navigation Error', 
        'Unable to fly to current location. Please:\n\n1. Enable location permissions for this app\n2. Turn on location services\n3. Ensure GPS has clear view of sky\n4. Try again in a few moments',
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, [showUserLocation]);

  const flyToNewYork = useCallback(async () => {
    try {
      await mapRef.current?.animateToLocation(40.7128, -74.0060, 12);
      console.log('✈️ Flying to New York City');
    } catch (error) {
      console.error('❌ Fly to NYC error:', error);
      Alert.alert('Navigation Error', 'Failed to fly to New York');
    }
  }, []);

  const flyToLondon = useCallback(async () => {
    try {
      await mapRef.current?.animateToLocation(51.5074, -0.1278, 12);
      console.log('✈️ Flying to London');
    } catch (error) {
      console.error('❌ Fly to London error:', error);
      Alert.alert('Navigation Error', 'Failed to fly to London');
    }
  }, []);

  // Zoom functions
  const zoomIn = useCallback(async () => {
    try {
      await mapRef.current?.zoomIn();
      console.log('🔍 Zoomed in');
    } catch (error) {
      console.error('❌ Zoom in error:', error);
    }
  }, []);

  const zoomOut = useCallback(async () => {
    try {
      await mapRef.current?.zoomOut();
      console.log('🔍 Zoomed out');
    } catch (error) {
      console.error('❌ Zoom out error:', error);
    }
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
    console.log('🗑️ Cleared all markers');
  }, []);

  // Tab content rendering
  const renderLocationTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>💡 First time using location?</Text>
        <Text style={styles.infoText}>1. Tap "Start Tracking" to enable location</Text>
        <Text style={styles.infoText}>2. Grant permission when prompted</Text>
        <Text style={styles.infoText}>3. Wait a few seconds for GPS fix</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.primaryButton, showUserLocation ? styles.activeButton : styles.inactiveButton]}
          onPress={toggleLocationTracking}
        >
          <Text style={styles.buttonText}>
            {showUserLocation ? "🛑 Stop Tracking" : "📍 Start Tracking"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={getCurrentLocation}>
          <Text style={styles.buttonText}>📍 Get Current Location</Text>
        </TouchableOpacity>
      </View>

      {userLocation && (
        <View style={styles.locationDisplay}>
          <Text style={styles.locationLabel}>Current Location:</Text>
          <Text style={styles.locationCoords}>
            {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderNavigationTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={flyToCurrentLocation}>
          <Text style={styles.locationButtonText}>📍 Fly to Me</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.navigationGrid}>
        <TouchableOpacity style={styles.gridButton} onPress={flyToNewYork}>
          <Text style={styles.gridButtonText}>🗽</Text>
          <Text style={styles.gridButtonLabel}>New York</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridButton} onPress={flyToLondon}>
          <Text style={styles.gridButtonText}>🏰</Text>
          <Text style={styles.gridButtonLabel}>London</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Tile Mode</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>Raster</Text>
          <Switch
            value={useVectorTiles}
            onValueChange={toggleTileMode}
            trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
            thumbColor={useVectorTiles ? '#FFFFFF' : '#FFFFFF'}
          />
          <Text style={styles.switchText}>Vector</Text>
        </View>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Markers ({markers.length})</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearMarkers}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>💡 Tap the map to add markers</Text>
        <Text style={styles.infoText}>📱 Use pinch & pan gestures</Text>
        <Text style={styles.infoText}>🔄 Swipe up for more controls</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Map View */}
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={mapCenter}
        initialZoom={currentZoom}
        tileServerUrl={useVectorTiles ? TILE_CONFIGS.openMapTiles.styleUrl : TILE_CONFIGS.rasterTiles.tileUrl}
        markers={markers}
        showUserLocation={showUserLocation}
        followUserLocation={followUserLocation}
        onMapReady={handleMapReady}
        onRegionChange={handleRegionChange}
        onPress={handleMapPress}
        onMarkerPress={handleMarkerPress}
        onUserLocationChange={handleUserLocationChange}
      />

      {/* Floating Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
          <Text style={styles.zoomButtonText}>−</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Handle */}
      <TouchableOpacity
        style={[
          styles.bottomSheetHandle,
          { bottom: isBottomSheetOpen ? BOTTOM_SHEET_HEIGHT : 0 }
        ]}
        onPress={() => setIsBottomSheetOpen(!isBottomSheetOpen)}
      >
        <View style={styles.handle} />
        <Text style={styles.handleText}>
          {isBottomSheetOpen ? '⌄ OSM SDK Demo' : 'OSM SDK Demo'}
        </Text>
      </TouchableOpacity>

      {/* Bottom Sheet */}
      {isBottomSheetOpen && (
        <View style={styles.bottomSheet}>
          {/* Tab Navigation */}
          <View style={styles.tabNavigation}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'location' && styles.activeTab]}
              onPress={() => setActiveTab('location')}
            >
              <Text style={[styles.tabText, activeTab === 'location' && styles.activeTabText]}>📍 Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'navigation' && styles.activeTab]}
              onPress={() => setActiveTab('navigation')}
            >
              <Text style={[styles.tabText, activeTab === 'navigation' && styles.activeTabText]}>✈️ Navigate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
              onPress={() => setActiveTab('settings')}
            >
              <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>⚙️ Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.tabContentContainer} showsVerticalScrollIndicator={false}>
            {activeTab === 'location' && renderLocationTab()}
            {activeTab === 'navigation' && renderNavigationTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  map: {
    flex: 1,
  },
  
  // Floating Zoom Controls
  zoomControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  zoomButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  zoomButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },

  // Bottom Sheet Handle
  bottomSheetHandle: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  handleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  // Tab Navigation
  tabNavigation: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#4A90E2',
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },

  // Tab Content
  tabContentContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },

  // Buttons
  actionRow: {
    marginBottom: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeButton: {
    backgroundColor: '#FF6B6B',
  },
  inactiveButton: {
    backgroundColor: '#4A90E2',
  },
  secondaryButton: {
    backgroundColor: '#50C878',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  locationButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },

  // Navigation Grid
  navigationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  gridButton: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 100,
  },
  gridButtonText: {
    fontSize: 32,
    marginBottom: 8,
  },
  gridButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },

  // Location Display
  locationDisplay: {
    backgroundColor: '#F0F8F0',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#50C878',
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#50C878',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#333333',
  },

  // Settings
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#666666',
    marginHorizontal: 8,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Info Box
  infoBox: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default App; 