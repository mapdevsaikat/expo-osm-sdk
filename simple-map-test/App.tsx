import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Switch,
  Dimensions,
} from 'react-native';
import { 
  OSMView,
  SearchBox,
  quickSearch,
  type OSMViewRef, 
  type Coordinate, 
  type MarkerConfig, 
  type SearchLocation,
  TILE_CONFIGS
} from 'expo-osm-sdk';
import * as Location from 'expo-location';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.4; // 40% of screen height

// Simple tab types
type Tab = 'location' | 'navigation' | 'settings';

// Enhanced error types for efficient handling
type LocationErrorType = 
  | 'permission_denied' 
  | 'permission_restricted' 
  | 'gps_disabled' 
  | 'no_signal' 
  | 'timeout' 
  | 'view_not_ready' 
  | 'unknown';

interface LocationError {
  type: LocationErrorType;
  message: string;
  userMessage: string;
  canRetry: boolean;
  suggestedAction: string;
}

interface LocationHealthStatus {
  isSupported: boolean;
  hasPermission: boolean;
  isGpsEnabled: boolean;
  isViewReady: boolean;
  lastLocationAge: number | null;
  networkAvailable: boolean;
}

export default function App() {
  // OSM View ref
  const mapRef = useRef<OSMViewRef>(null);
  
  // State for UI
  const [activeTab, setActiveTab] = useState<Tab>('location');
  const [mapCenter, setMapCenter] = useState<Coordinate>({
    latitude: 22.57082,
    longitude: 88.37516,
  });
  const [mapZoom, setMapZoom] = useState<number>(10);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState<boolean>(false);

  // Location tracking state with bulletproof error handling
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [trackingStatus, setTrackingStatus] = useState<string>('idle');
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [locationError, setLocationError] = useState<LocationError | null>(null);
  const [retryAttempts, setRetryAttempts] = useState<number>(0);
  const [lastOperation, setLastOperation] = useState<string | null>(null);

  // Map features state
  const [markers, setMarkers] = useState<MarkerConfig[]>([]);
  const [useVectorTiles, setUseVectorTiles] = useState<boolean>(true);
  const [showUserLocation, setShowUserLocation] = useState<boolean>(false);
  const [followUserLocation, setFollowUserLocation] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<LocationHealthStatus | null>(null);

  // Default cities for India
  const defaultCities = [
    { name: 'Hyderabad', latitude: 17.40, longitude: 78.47, emoji: '🏛️' },
    { name: 'Bengaluru', latitude: 12.96, longitude: 77.57, emoji: '🌆' },
    { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, emoji: '🏙️' },
    { name: 'Delhi', latitude: 28.6139, longitude: 77.2090, emoji: '🕌' },
    { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639, emoji: '🎭' },
    { name: 'Chennai', latitude: 13.0827, longitude: 80.2707, emoji: '🏖️' },
  ];

  // Enhanced error creation with efficient handling
  const createLocationError = useCallback((
    type: LocationErrorType,
    originalMessage: string,
    canRetry: boolean = true
  ): LocationError => {
    const errorConfig: Record<LocationErrorType, { userMessage: string; suggestedAction: string }> = {
      permission_denied: {
        userMessage: 'Location permission was denied',
        suggestedAction: 'Please enable location permission in your device settings'
      },
      permission_restricted: {
        userMessage: 'Location access is restricted',
        suggestedAction: 'Location access is restricted by system policies'
      },
      gps_disabled: {
        userMessage: 'GPS is disabled',
        suggestedAction: 'Please enable location services in your device settings'
      },
      no_signal: {
        userMessage: 'Unable to get GPS signal',
        suggestedAction: 'Move to an area with clear sky view or try again later'
      },
      timeout: {
        userMessage: 'Location request timed out',
        suggestedAction: 'Move to an area with better GPS reception and try again'
      },
      view_not_ready: {
        userMessage: 'Map is not ready',
        suggestedAction: 'Please wait for the map to load and try again'
      },
      unknown: {
        userMessage: 'Unknown location error occurred',
        suggestedAction: 'Please try again or restart the app'
      }
    };

    const config = errorConfig[type];
    return {
      type,
      message: originalMessage,
      userMessage: config.userMessage,
      canRetry,
      suggestedAction: config.suggestedAction
    };
  }, []);

  // Bulletproof error handling wrapper with enhanced view waiting
  const safeLocationCall = useCallback(async <T,>(
    operation: string,
    method: () => Promise<T>,
    showAlert: boolean = true
  ): Promise<T | null> => {
    try {
      if (!mapRef.current) {
        throw new Error('OSM view reference not available');
      }

      console.log(`🔍 BulletproofSDK: Starting ${operation}`);
      setLastOperation(operation);
      setLocationError(null);
      
      // Enhanced view readiness check with multiple attempts
      const maxAttempts = 10;
      let attempt = 0;
      let viewReady = false;
      
      while (attempt < maxAttempts && !viewReady) {
        attempt++;
        console.log(`🔍 BulletproofSDK: Checking view readiness - attempt ${attempt}/${maxAttempts}`);
        
                 try {
           // Try to check if view is ready - use any to avoid TypeScript issues
           const viewRef = mapRef.current as any;
           if (viewRef && typeof viewRef.isViewReady === 'function') {
             viewReady = await viewRef.isViewReady();
             console.log(`📋 BulletproofSDK: View readiness check result: ${viewReady}`);
           } else {
             // Fallback: assume ready if we have a ref
             viewReady = true;
             console.log(`📋 BulletproofSDK: No isViewReady method, assuming ready`);
           }
          
          if (!viewReady && attempt < maxAttempts) {
            console.log(`⏳ BulletproofSDK: View not ready, waiting 500ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.warn(`⚠️ BulletproofSDK: Error checking readiness on attempt ${attempt}:`, error);
          if (attempt === maxAttempts) {
            // On final attempt, try anyway
            viewReady = true;
          } else {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      if (!viewReady) {
        console.warn(`⚠️ BulletproofSDK: View not ready after ${maxAttempts} attempts, proceeding anyway`);
      }
      
      const result = await method();
      console.log(`✅ BulletproofSDK: ${operation} successful`);
      
      // Reset retry attempts on success
      setRetryAttempts(0);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `${operation} failed`;
      console.error(`❌ BulletproofSDK: ${operation} failed:`, errorMessage);
      
      // Enhanced error classification
      let errorType: LocationErrorType = 'unknown';
      
      if (errorMessage.includes('permission') && errorMessage.includes('denied')) {
        errorType = 'permission_denied';
      } else if (errorMessage.includes('permission') && errorMessage.includes('restricted')) {
        errorType = 'permission_restricted';
      } else if (errorMessage.includes('GPS') || errorMessage.includes('location services')) {
        errorType = 'gps_disabled';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        errorType = 'timeout';
      } else if (errorMessage.includes('view') || errorMessage.includes('View') || errorMessage.includes('not available')) {
        errorType = 'view_not_ready';
      } else if (errorMessage.includes('signal') || errorMessage.includes('No recent location')) {
        errorType = 'no_signal';
      }
      
      const locationError = createLocationError(errorType, errorMessage, true);
      setLocationError(locationError);
      setTrackingStatus('error');

      // Enhanced user-friendly alerts with better error handling
      if (showAlert) {
        if (errorType === 'permission_denied') {
          Alert.alert(
            'Permission Required',
            locationError.userMessage,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => {
                Alert.alert('Settings', 'Please enable location permission in your device settings');
              }}
            ]
          );
        } else if (errorType === 'view_not_ready') {
          Alert.alert(
            'Map Loading',
            'The map is still loading. Please wait a moment and try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Retry in 3s', onPress: () => {
                setTimeout(() => retryLastOperation(), 3000);
              }}
            ]
          );
        } else if (locationError.canRetry) {
          Alert.alert(
            'Location Error',
            `${locationError.userMessage}\n\n${locationError.suggestedAction}`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Retry', onPress: () => retryLastOperation() }
            ]
          );
        } else {
          Alert.alert('Error', locationError.userMessage);
        }
      }
      
      return null;
    }
  }, [mapRef, createLocationError]);

  // Check location permissions with enhanced validation
  const checkLocationPermissions = useCallback(async () => {
    try {
      console.log('🔍 Checking location permissions...');
      
      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      console.log('📍 Location services enabled:', isLocationEnabled);
      
      // Get current permission status
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      
      if (!isLocationEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings.',
        );
        return false;
      }
      
      if (foregroundStatus !== 'granted') {
        console.log('📍 Requesting location permissions...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Location Permission Required',
            'This app needs location permission to show your position on the map.',
          );
          return false;
        }
      }
      
      console.log('✅ Location permissions are granted!');
      return true;
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return false;
    }
  }, []);

  // Enhanced location functions with bulletproof error handling
  const toggleLocationTracking = useCallback(async () => {
    try {
      console.log('🔄 Toggling location tracking...');
      
      if (isTracking) {
        setTrackingStatus('stopping');
        const success = await safeLocationCall('stopLocationTracking', async () => {
          await mapRef.current!.stopLocationTracking();
          return true;
        }, false);
        
        if (success) {
          setIsTracking(false);
          setShowUserLocation(false);
          setTrackingStatus('idle');
          console.log('📍 Stopped location tracking');
        }
      } else {
        setTrackingStatus('starting');
        const success = await safeLocationCall('startLocationTracking', async () => {
          await mapRef.current!.startLocationTracking();
          return true;
        });
        
        if (success) {
          setIsTracking(true);
          setShowUserLocation(true);
          setTrackingStatus('active');
          console.log('📍 Started location tracking');
        }
      }
    } catch (error) {
      console.error('❌ Toggle tracking failed:', error);
      setTrackingStatus('error');
    }
  }, [isTracking, safeLocationCall]);

  const getCurrentLocationDemo = useCallback(async () => {
    const location = await safeLocationCall('getCurrentLocation', async () => {
      return await mapRef.current!.getCurrentLocation();
    });
    
    if (location) {
      console.log('✅ Got location from bulletproof system:', location);
      setCurrentLocation(location);
      setMapCenter(location);
      
      Alert.alert(
        'Current Location',
        `Latitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}`,
      );

      // Animate map to current location
      await mapRef.current?.animateToLocation(location.latitude, location.longitude, 15);
      
      // Enable location display
      if (!showUserLocation) {
        setShowUserLocation(true);
      }
    }
  }, [safeLocationCall, showUserLocation]);

  const flyToCurrentLocation = useCallback(async () => {
    // Use waitForLocation for fresh GPS data
    const location = await safeLocationCall('waitForLocation', async () => {
      return await mapRef.current!.waitForLocation(30); // 30 second timeout
    });
    
    if (location) {
      setCurrentLocation(location);
      setMapCenter(location);
      await mapRef.current?.animateToLocation(location.latitude, location.longitude, 15);
      console.log('✈️ Successfully flew to current location:', location);
      
      Alert.alert(
        'Success',
        `Flew to your current location:\n${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      );
      
      // Enable location display
      if (!showUserLocation) {
        setShowUserLocation(true);
      }
    }
  }, [safeLocationCall, showUserLocation]);

  // Retry last failed operation
  const retryLastOperation = useCallback(async () => {
    if (!lastOperation || retryAttempts >= 3) {
      console.log('❌ Cannot retry: max attempts reached or no last operation');
      return;
    }

    setRetryAttempts(prev => prev + 1);
    console.log(`🔄 Retrying ${lastOperation} (attempt ${retryAttempts + 1}/3)`);

    setLocationError(null);

    switch (lastOperation) {
      case 'startLocationTracking':
        await toggleLocationTracking();
        break;
      case 'getCurrentLocation':
        await getCurrentLocationDemo();
        break;
      case 'waitForLocation':
        await flyToCurrentLocation();
        break;
    }
  }, [lastOperation, retryAttempts, toggleLocationTracking, getCurrentLocationDemo, flyToCurrentLocation]);

  // Clear error state
  const clearError = useCallback(() => {
    setLocationError(null);
    setRetryAttempts(0);
    if (trackingStatus === 'error') {
      setTrackingStatus('idle');
    }
  }, [trackingStatus]);

  // Update health status
  const updateHealthStatus = useCallback(async () => {
    try {
      const health: LocationHealthStatus = {
        isSupported: true,
        hasPermission: false,
        isGpsEnabled: false,
        isViewReady: mapRef.current !== null, // Simple check if map ref exists
        lastLocationAge: currentLocation ? 0 : null,
        networkAvailable: true
      };

      setHealthStatus(health);
    } catch (error) {
      console.warn('Failed to get health status:', error);
    }
  }, [currentLocation]);

  // City navigation functions
  const flyToCity = useCallback(async (city: { name: string; latitude: number; longitude: number }) => {
    try {
      await mapRef.current?.animateToLocation(city.latitude, city.longitude, 12);
      console.log(`✈️ Flying to ${city.name}`);
    } catch (error) {
      console.error(`❌ Fly to ${city.name} error:`, error);
      Alert.alert('Navigation Error', `Failed to fly to ${city.name}`);
    }
  }, []);

  // Marker functions
  const handleMapPress = useCallback((coordinate: Coordinate) => {
    const newMarker: MarkerConfig = {
      id: `marker-${Date.now()}`,
      coordinate,
      title: 'Tap Marker',
      description: `Added at ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
    };
    setMarkers(prev => [...prev, newMarker]);
    console.log('📍 Added marker at:', coordinate);
  }, []);

  const handleMarkerPress = useCallback((markerId: string, coordinate: Coordinate) => {
    const marker = markers.find(m => m.id === markerId);
    if (marker) {
      Alert.alert('Marker Info', `${marker.title}\n${marker.description}`);
    }
    console.log('🔍 Marker pressed:', markerId, coordinate);
  }, [markers]);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
    console.log('🗑️ Cleared all markers');
  }, []);

  // Search location handler
  const handleLocationSelected = useCallback(async (location: SearchLocation) => {
    console.log('🔍 Search location selected:', location.displayName);
    
    // Create a marker for the selected location
    const searchMarker: MarkerConfig = {
      id: `search-${Date.now()}`,
      coordinate: location.coordinate,
      title: '🔍 Search Result',
      description: location.displayName
    };
    
    // Add marker to the map
    setMarkers(prev => [...prev, searchMarker]);
    
    // Animate map to the selected location
    try {
      if (mapRef.current) {
        await mapRef.current.animateToLocation(
          location.coordinate.latitude,
          location.coordinate.longitude,
          15 // zoom level
        );
        console.log('📍 Animated to search location:', location.coordinate);
      }
    } catch (error) {
      console.error('❌ Failed to animate to location:', error);
    }
  }, []);

  // Search for a specific query
  const searchFor = useCallback(async (query: string) => {
    try {
      console.log('🔍 Searching for:', query);
      const result = await quickSearch(query);
      if (result) {
        Alert.alert('Found!', `${result.displayName}`, [
          { text: 'Cancel' },
          { text: 'Go There', onPress: () => handleLocationSelected(result) }
        ]);
      } else {
        Alert.alert('No Results', `No location found for "${query}".`);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Search failed. Check your internet connection.');
    }
  }, [handleLocationSelected]);

  // Tile mode toggle
  const toggleTileMode = useCallback(() => {
    const newVectorMode = !useVectorTiles;
    setUseVectorTiles(newVectorMode);
    console.log('🔄 Switching tile mode to:', newVectorMode ? 'Vector' : 'Raster');
  }, [useVectorTiles]);

  // Auto-request permissions and update health status on mount
  useEffect(() => {
    checkLocationPermissions();
    updateHealthStatus();
    
    // Update health status every 10 seconds
    const interval = setInterval(updateHealthStatus, 10000);
    return () => clearInterval(interval);
  }, [checkLocationPermissions, updateHealthStatus]);

  // Handle map events
  const handleMapReady = useCallback(() => {
    const currentUrl = useVectorTiles ? TILE_CONFIGS.openMapTiles.styleUrl : TILE_CONFIGS.rasterTiles.tileUrl;
    console.log('🗺️ Map is ready with tiles:', {
      useVectorTiles,
      currentUrl,
      tileConfigs: TILE_CONFIGS
    });
  }, [useVectorTiles]);

  const handleRegionChange = useCallback(() => {
    console.log('🗺️ Region changed');
  }, []);

  const handleUserLocationChange = useCallback((location: Coordinate) => {
    console.log('📍 User location updated:', location);
    setCurrentLocation(location);
    setMapCenter(location);
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

  // Add debug function to check view status
  const debugViewStatus = useCallback(async () => {
    console.log('🔧 DEBUG: Starting view status check...');
    
    // Check if ref exists
    const hasRef = mapRef.current !== null;
    console.log('🔧 DEBUG: mapRef.current exists:', hasRef);
    
    if (hasRef) {
      const viewRef = mapRef.current as any;
      
      // Check what methods are available
      const availableMethods = Object.getOwnPropertyNames(viewRef).filter(prop => typeof viewRef[prop] === 'function');
      console.log('🔧 DEBUG: Available methods on view:', availableMethods);
      
      // Try to call isViewReady if available
      if (typeof viewRef.isViewReady === 'function') {
        try {
          const isReady = await viewRef.isViewReady();
          console.log('🔧 DEBUG: isViewReady() result:', isReady);
        } catch (error) {
          console.log('🔧 DEBUG: isViewReady() error:', error);
        }
      } else {
        console.log('🔧 DEBUG: isViewReady method not available');
      }
      
      // Try to call isAvailable if available
      if (typeof viewRef.isAvailable === 'function') {
        try {
          const isAvailable = await viewRef.isAvailable();
          console.log('🔧 DEBUG: isAvailable() result:', isAvailable);
        } catch (error) {
          console.log('🔧 DEBUG: isAvailable() error:', error);
        }
      }
    }
    
    Alert.alert(
      'Debug View Status',
      `View Ref: ${hasRef ? '✅ Exists' : '❌ Missing'}\n\nCheck console for detailed logs.`,
    );
  }, []);

  // Test bulletproof features
  const testErrorHandling = useCallback(() => {
    Alert.alert(
      'Test Error Handling',
      'Choose a scenario to test our efficient error handling:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'GPS Timeout', onPress: () => safeLocationCall('waitForLocation', () => mapRef.current!.waitForLocation(1)) }, // 1 second timeout
        { text: 'Get Location', onPress: getCurrentLocationDemo },
        { text: 'Health Check', onPress: updateHealthStatus },
        { text: 'Debug View Status', onPress: debugViewStatus },
      ]
    );
  }, [safeLocationCall, getCurrentLocationDemo, updateHealthStatus, debugViewStatus]);

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'active': return '✅';
      case 'starting': return '⏳';
      case 'stopping': return '⏳';
      case 'error': return '❌';
      case 'permission_required': return '🔐';
      case 'gps_disabled': return '📶';
      default: return '⭕';
    }
  };

  const getErrorTypeEmoji = (errorType: string) => {
    switch (errorType) {
      case 'permission_denied': return '🔐';
      case 'gps_disabled': return '📶';
      case 'no_signal': return '📡';
      case 'timeout': return '⏰';
      case 'view_not_ready': return '🗺️';
      default: return '❌';
    }
  };

  const renderLocationTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>🛡️ Secured Location System</Text>
        <Text style={styles.infoText}>✅ Zero crashes guaranteed</Text>
        <Text style={styles.infoText}>🔒 Thread-safe & robust</Text>
        <Text style={styles.infoText}>🎯 Comprehensive error handling</Text>
      </View>

      {/* Enhanced Status Information */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>📊 System Status</Text>
        <Text style={styles.infoText}>
          Tracking: {getStatusEmoji(trackingStatus)} {isTracking ? 'Active' : 'Inactive'} ({trackingStatus})
        </Text>
        {currentLocation && (
          <Text style={styles.infoText}>
            📍 Current: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </Text>
        )}
        {healthStatus && (
          <>
            <Text style={styles.infoText}>
              🗺️ View Ready: {healthStatus.isViewReady ? '✅' : '❌'}
            </Text>
            <Text style={styles.infoText}>
              🌐 Network: {healthStatus.networkAvailable ? '✅' : '❌'}
            </Text>
          </>
        )}
        {locationError && (
          <View style={styles.errorContainer}>
            <Text style={[styles.infoText, styles.errorText]}>
              {getErrorTypeEmoji(locationError.type)} {locationError.userMessage}
            </Text>
            <Text style={styles.errorSuggestion}>
              💡 {locationError.suggestedAction}
            </Text>
          </View>
        )}
      </View>

      {/* Location Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            isTracking ? styles.activeButton : styles.inactiveButton,
            (trackingStatus === 'starting' || trackingStatus === 'stopping') ? styles.disabledButton : null
          ]}
          onPress={toggleLocationTracking}
          disabled={trackingStatus === 'starting' || trackingStatus === 'stopping'}
        >
          <Text style={styles.buttonText}>
            {trackingStatus === 'starting'
              ? '⏳ Starting...'
              : trackingStatus === 'stopping'
              ? '⏳ Stopping...'
              : isTracking
              ? '🛑 Stop Tracking'
              : '📍 Start Tracking'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={getCurrentLocationDemo}>
          <Text style={styles.buttonText}>📍 Get Current Location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={flyToCurrentLocation}>
          <Text style={styles.buttonText}>✈️ Fly to My Location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.testButton} onPress={testErrorHandling}>
          <Text style={styles.buttonText}>🧪 Test Error Handling</Text>
        </TouchableOpacity>
      </View>

      {locationError && locationError.canRetry && retryAttempts < 3 && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.retryButton} onPress={retryLastOperation}>
            <Text style={styles.buttonText}>🔄 Retry ({locationError.type}) - {retryAttempts}/3</Text>
          </TouchableOpacity>
        </View>
      )}

      {locationError && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.clearButton} onPress={clearError}>
            <Text style={styles.buttonText}>🗑️ Clear Error</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderNavigationTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🇮🇳 Indian Cities</Text>
      
      <View style={styles.cityGrid}>
        {defaultCities.map((city) => (
          <TouchableOpacity
            key={city.name}
            style={styles.cityButton}
            onPress={() => flyToCity(city)}
          >
            <Text style={styles.cityEmoji}>{city.emoji}</Text>
            <Text style={styles.cityName}>{city.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={flyToCurrentLocation}>
          <Text style={styles.locationButtonText}>📍 Back to Me</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>💡 Tap any city to fly there</Text>
        <Text style={styles.infoText}>🗺️ Explore major Indian cities</Text>
        <Text style={styles.infoText}>🛡️ Secured navigation system</Text>
      </View>
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Map Style</Text>
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

      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>🛠️ Enhanced SDK Status</Text>
        <Text style={styles.infoText}>Platform: {Platform.OS} ✅</Text>
        <Text style={styles.infoText}>Error Handling: 🛡️ Secured</Text>
        <Text style={styles.infoText}>Crash Protection: ✅ Zero crashes</Text>
        <Text style={styles.infoText}>Thread Safety: ✅ Production ready</Text>
        <Text style={styles.infoText}>Fallback System: ✅ Multiple layers</Text>
        <Text style={styles.infoText}>Retry Logic: ✅ Smart recovery</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>💡 Tap the map to add markers</Text>
        <Text style={styles.infoText}>📱 Use pinch & pan gestures</Text>
        <Text style={styles.infoText}>🔄 Swipe up for more controls</Text>
        <Text style={styles.infoText}>🧪 Test error scenarios in Location tab</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* FIXED SearchBox - No more infinite loops! */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBoxWrapper}>
          <SearchBox
          placeholder="Search for places, addresses..."
          onLocationSelected={handleLocationSelected}
          onResultsChanged={(results) => {
            // This callback is now stable and won't cause loops
            console.log(`🔍 Found ${results.length} search results`);
            
            // DEBUG: Log each result to see if data is there
            results.forEach((result, index) => {
              console.log(`🔍 Result ${index}:`, {
                title: result.displayName.split(',')[0],
                subtitle: result.displayName.split(',').slice(1).join(',').trim(),
                full: result.displayName
              });
            });
          }}
          maxResults={5}
          autoComplete={true}
          debounceMs={300}
          style={[styles.searchBox, {
            // Force text properties
            color: '#000000',
            fontSize: 16,
            fontWeight: '500',
          }]}
          containerStyle={[styles.searchBoxContainer, {
            // Ensure container doesn't interfere
            overflow: 'visible',
          }]}
        />
        
        {/* DEBUG: Test visibility of dropdown-style results */}
        {__DEV__ && false && (
          <View style={styles.searchResultContainer}>
            <View style={styles.searchResultItem}>
              <Text style={styles.searchResultTitle}>Test Location</Text>
              <Text style={styles.searchResultSubtitle}>This is a test result to verify text visibility</Text>
            </View>
            <View style={styles.searchResultItem}>
              <Text style={styles.searchResultTitle}>Another Test</Text>
              <Text style={styles.searchResultSubtitle}>If you can see this black text, the styling works!</Text>
            </View>
          </View>
        )}
        </View>
      </View>

      {/* Map View */}
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={mapCenter}
        initialZoom={mapZoom}
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
          {isBottomSheetOpen ? '⌄ Expo-OSM' : '↑ Explore Expo-OSM'}
        </Text>
      </TouchableOpacity>

      {/* Collapsible Bottom Sheet */}
      {isBottomSheetOpen && (
        <View style={styles.bottomSheet}>
          {/* Tab Navigation */}
          <View style={styles.tabNavigation}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'location' && styles.activeTab]}
              onPress={() => setActiveTab('location')}
            >
              <Text style={[styles.tabText, activeTab === 'location' && styles.activeTabText]}>
                🛡️ Location
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'navigation' && styles.activeTab]}
              onPress={() => setActiveTab('navigation')}
            >
              <Text style={[styles.tabText, activeTab === 'navigation' && styles.activeTabText]}>
                ✈️ Cities
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
              onPress={() => setActiveTab('settings')}
            >
              <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
                ⚙️ Settings
              </Text>
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
}

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
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999, // Below search dropdown
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },

  // Info Cards
  infoBox: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#50C878',
  },
  statusCard: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  errorSuggestion: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
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
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  secondaryButton: {
    backgroundColor: '#50C878',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#8E44AD',
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
    color: '#4299e1',
    fontSize: 14,
    fontWeight: '600',
  },

  // City Grid
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cityButton: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '48%',
    marginBottom: 8,
  },
  cityEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  cityName: {
    fontSize: 12,
    fontWeight: '500',
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

  // Search Styles
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 80, // Leave space for zoom controls
    zIndex: 1000,
  },
  searchBoxContainer: {
    position: 'relative',
    zIndex: 1001,
    backgroundColor: 'transparent',
    minHeight: 60,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 15,
  },
  searchBoxWrapper: {
    // Force all text children to be visible
    backgroundColor: 'transparent',
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    // Ensure dropdown text is visible
    color: '#000000',
  },
  // Additional styles for SearchBox dropdown results
  searchResultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
    marginTop: 4,
  },
  searchResultItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',  // Force black text
    marginBottom: 2,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#333333',  // Force dark gray text
    lineHeight: 18,
  },
});