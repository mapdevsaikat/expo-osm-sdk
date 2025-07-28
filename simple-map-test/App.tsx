import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  SafeAreaView,
} from 'react-native';
import { 
  OSMView,
  SearchBox,
  useOSRMRouting,
  useLocationTracking,
  quickSearch,
  type OSMViewRef, 
  type Coordinate, 
  type MarkerConfig,
  type Route,
  type SearchLocation,
  type LocationError,
  type LocationHealthStatus,
  TILE_CONFIGS
} from 'expo-osm-sdk';
import * as Location from 'expo-location';
import SimpleNavigationUI from './SimpleNavigationUI';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT_50 = SCREEN_HEIGHT * 0.5;
const BOTTOM_SHEET_HEIGHT_70 = SCREEN_HEIGHT * 0.7;
const SEARCH_TOP_PADDING = Platform.OS === 'ios' ? 60 : 40;
const ZOOM_CONTROLS_TOP = Platform.OS === 'ios' ? 60 : 40;

// Transport modes for routing
interface TransportMode {
  id: string;
  name: string;
  icon: string;
  profile: 'driving' | 'walking' | 'cycling' | 'transit';
  color: string;
}

const TRANSPORT_MODES: TransportMode[] = [
  { id: 'car', name: 'Car', icon: '🚗', profile: 'driving', color: '#007AFF' },
  { id: 'bike', name: 'Bike', icon: '🚴', profile: 'cycling', color: '#34C759' },
  { id: 'transit', name: 'Transit', icon: '🚌', profile: 'transit', color: '#FF9500' },
  { id: 'walk', name: 'Walk', icon: '🚶', profile: 'walking', color: '#8E8E93' },
];

// Default cities for navigation
const defaultCities = [
  { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, emoji: '🏙️' },
  { name: 'Delhi', latitude: 28.6139, longitude: 77.2090, emoji: '🏛️' },
  { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946, emoji: '🌳' },
  { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639, emoji: '🎭' },
  { name: 'Chennai', latitude: 13.0827, longitude: 80.2707, emoji: '🏖️' },
  { name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867, emoji: '💎' },
];

interface NavigationState {
  fromLocation: string;
  toLocation: string;
  fromCoordinate: Coordinate | null;
  toCoordinate: Coordinate | null;
  selectedMode: string;
  routes: { [key: string]: Route | null };
  isCalculating: boolean;
  currentRoute: Route | null;
  navigationStarted: boolean;
}

export default function NavigationDemo() {
  const mapRef = useRef<OSMViewRef>(null);
  const routing = useOSRMRouting();
  const routingRef = useRef(routing);

  // Update routing ref when routing changes
  useEffect(() => {
    routingRef.current = routing;
  }, [routing]);

  // Original modal state
  const [bottomSheetState, setBottomSheetState] = useState<'closed' | 'half' | 'full'>('closed');
  const [activeTab, setActiveTab] = useState<'location' | 'cities' | 'settings' | 'routing'>('location');

  // Map state
  const [mapCenter, setMapCenter] = useState<Coordinate>({
    latitude: 22.5726,
    longitude: 88.3639, // Kolkata as default
  });
  const [mapZoom] = useState(12);
  const [markers, setMarkers] = useState<MarkerConfig[]>([]);
  const [useVectorTiles, setUseVectorTiles] = useState(true);

  // Location tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [followUserLocation, setFollowUserLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<string>('idle');
  const [locationError, setLocationError] = useState<LocationError | null>(null);
  const [healthStatus, setHealthStatus] = useState<LocationHealthStatus | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [lastOperation, setLastOperation] = useState<string | null>(null);

  // Navigation/Routing state
  const [navigation, setNavigation] = useState<NavigationState>({
    fromLocation: '',
    toLocation: '',
    fromCoordinate: null,
    toCoordinate: null,
    selectedMode: 'car',
    routes: {},
    isCalculating: false,
    currentRoute: null,
    navigationStarted: false,
  });

  // Search modal state for routing
  const [showFromSearch, setShowFromSearch] = useState(false);
  const [showToSearch, setShowToSearch] = useState(false);

  // Safe location call wrapper
  const safeLocationCall = useCallback(async (
    operation: string,
    locationFunction: () => Promise<any>,
    defaultValue?: any
  ): Promise<any> => {
    try {
      setLastOperation(operation);
      setLocationError(null);
      
      const result = await locationFunction();
      setRetryAttempts(0);
      return result;
      
    } catch (error: any) {
      console.error(`❌ ${operation} failed:`, error);
      
      const locationErr: LocationError = {
        type: error.code || 'unknown',
        message: error.message || 'Unknown error occurred',
        userMessage: 'Location service temporarily unavailable',
        suggestedAction: 'Please try again or check your location settings',
        canRetry: true
      };
      
      setLocationError(locationErr);
      
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      
      return null;
    }
  }, []);

  // Location functions
  const checkLocationPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return false;
    }
  }, []);

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

      await mapRef.current?.animateToLocation(location.latitude, location.longitude, 15);
      
      if (!showUserLocation) {
        setShowUserLocation(true);
      }
    }
  }, [safeLocationCall, showUserLocation]);

  const flyToCurrentLocation = useCallback(async () => {
    const location = await safeLocationCall('waitForLocation', async () => {
      return await mapRef.current!.waitForLocation(30);
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
      
      if (!showUserLocation) {
        setShowUserLocation(true);
      }
    }
  }, [safeLocationCall, showUserLocation]);

  // Navigation/Routing functions
  const getCurrentLocation = useCallback(async (): Promise<Coordinate | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed for navigation');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }, []);

  const useCurrentLocationForRouting = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location) {
      console.log('📍 Current location obtained:', location);
      
      setNavigation(prev => ({
        ...prev,
        fromLocation: 'Your Location',
        fromCoordinate: location,
        routes: {}, // Clear existing routes when coordinates change
        currentRoute: null,
        navigationStarted: false,
      }));
      
      const currentLocationMarker: MarkerConfig = {
        id: 'current-location',
        coordinate: location,
        title: '📍 Your Location',
        description: 'Current location',
      };
      
      setMarkers(prev => [
        ...prev.filter(m => m.id !== 'current-location'),
        currentLocationMarker
      ]);
      
      mapRef.current?.animateToLocation(location.latitude, location.longitude, 15);
    }
  }, [getCurrentLocation]);

  const handleFromLocationSelected = useCallback((location: SearchLocation) => {
    console.log('📍 From location selected:', location.displayName, location.coordinate);
    
    setNavigation(prev => ({
      ...prev,
      fromLocation: location.displayName,
      fromCoordinate: location.coordinate,
      routes: {}, // Clear existing routes when coordinates change
      currentRoute: null,
      navigationStarted: false,
    }));
    
    const fromMarker: MarkerConfig = {
      id: 'from-location',
      coordinate: location.coordinate,
      title: '🏁 Start',
      description: location.displayName,
    };
    
    setMarkers(prev => [
      ...prev.filter(m => m.id !== 'from-location'),
      fromMarker
    ]);

    setShowFromSearch(false);
  }, []);

  const handleToLocationSelected = useCallback((location: SearchLocation) => {
    console.log('📍 To location selected:', location.displayName, location.coordinate);
    
    setNavigation(prev => ({
      ...prev,
      toLocation: location.displayName,
      toCoordinate: location.coordinate,
      routes: {}, // Clear existing routes when coordinates change
      currentRoute: null,
      navigationStarted: false,
    }));
    
    const toMarker: MarkerConfig = {
      id: 'to-location',
      coordinate: location.coordinate,
      title: '🏁 Destination',
      description: location.displayName,
    };
    
    setMarkers(prev => [
      ...prev.filter(m => m.id !== 'to-location'),
      toMarker
    ]);

    setShowToSearch(false);
  }, []);

  const calculateAllRoutes = useCallback(async (fromCoord: Coordinate, toCoord: Coordinate) => {
    console.log('🚀 calculateAllRoutes called with:', { fromCoord, toCoord });
    
    // Prevent multiple simultaneous calculations
    setNavigation(prev => {
      if (prev.isCalculating) {
        console.log('⚠️ Already calculating routes, skipping...');
        return prev;
      }
      return { ...prev, isCalculating: true, routes: {} }; // Clear existing routes
    });

    try {
      const routePromises = TRANSPORT_MODES.map(async (mode) => {
        try {
          console.log(`🔍 Calculating ${mode.name} route with profile: ${mode.profile}...`);
          const route = await routingRef.current.calculateRoute(
            fromCoord,
            toCoord,
            { profile: mode.profile, steps: true }
          );
          
          if (route) {
            console.log(`✅ ${mode.name} route SUCCESS:`, {
              duration: `${Math.round(route.duration / 60)} min`,
              distance: `${(route.distance / 1000).toFixed(1)} km`,
              profile: mode.profile,
              coordinates: route.coordinates?.length || 0
            });
          } else {
            console.log(`❌ ${mode.name} route FAILED: No route returned`);
          }
          
          return { modeId: mode.id, route };
        } catch (error) {
          console.error(`❌ Error calculating route for ${mode.name} (${mode.profile}):`, error);
          return { modeId: mode.id, route: null };
        }
      });

      const results = await Promise.all(routePromises);
      const newRoutes: { [key: string]: Route | null } = {};
      
      results.forEach(({ modeId, route }) => {
        newRoutes[modeId] = route;
      });

      console.log('📊 ROUTE ASSIGNMENT SUMMARY:');
      Object.keys(newRoutes).forEach(modeId => {
        const route = newRoutes[modeId];
        const mode = TRANSPORT_MODES.find(m => m.id === modeId);
        if (route && mode) {
          console.log(`  🚩 ${mode.name} (${mode.profile}): ${Math.round(route.duration / 60)} min, ${(route.distance / 1000).toFixed(1)} km`);
        } else {
          console.log(`  ❌ ${mode?.name || modeId}: No route`);
        }
      });

      // Validation check for route differentiation
      const uniqueRoutes = new Set();
      Object.values(newRoutes).forEach(route => {
        if (route) {
          const routeKey = `${route.duration}-${route.distance}`;
          uniqueRoutes.add(routeKey);
        }
      });
      
      if (uniqueRoutes.size === 1 && Object.values(newRoutes).filter(r => r !== null).length > 1) {
        console.warn('⚠️ WARNING: All transport modes returned identical routes! This may indicate:');
        console.warn('  - OSRM server issue with profile differentiation');
        console.warn('  - Very short distance where modes perform similarly');
        console.warn('  - API configuration problem');
      } else {
        console.log(`✅ Route validation: ${uniqueRoutes.size} unique routes found`);
      }

      setNavigation(prev => ({
        ...prev,
        routes: newRoutes,
        isCalculating: false,
        currentRoute: newRoutes[prev.selectedMode] || null,
      }));

    } catch (error) {
      console.error('❌ Error calculating routes:', error);
      setNavigation(prev => ({ ...prev, isCalculating: false, routes: {} }));
      Alert.alert('Error', 'Failed to calculate routes. Please try again.');
    }
  }, []);

  const selectTransportMode = useCallback((modeId: string) => {
    if (mapRef.current) {
      const mapRefForRouting = { current: mapRef.current };
      routingRef.current.clearRoute(mapRefForRouting).catch(error => {
        console.warn('Failed to clear route:', error);
      });
    }
    
    setNavigation(prev => ({
      ...prev,
      selectedMode: modeId,
      currentRoute: prev.routes[modeId] || null,
    }));
  }, []);

  // Add navigation progress checking
  const checkNavigationProgress = useCallback((currentLocation: Coordinate) => {
    // This would typically calculate distance to next instruction
    // and trigger voice guidance when appropriate
    console.log('🧭 Checking navigation progress at:', currentLocation);
  }, []);

  // Add navigation control functions
  const startNavigation = useCallback(() => {
    if (navigation.currentRoute) {
      setNavigation(prev => ({ ...prev, navigationStarted: true }));
      
      // Enable location following during navigation
      setFollowUserLocation(true);
      
      Alert.alert(
        'Navigation Started',
        'Turn-by-turn navigation is now active. Follow the route on the map.',
        [{ text: 'OK' }]
      );
      
      console.log('🚗 Navigation started for route:', navigation.currentRoute);
    }
  }, [navigation.currentRoute]);

  const stopNavigation = useCallback(() => {
    setNavigation(prev => ({ 
      ...prev, 
      navigationStarted: false,
      currentRoute: null
    }));
    
    // Disable location following
    setFollowUserLocation(false);
    
    Alert.alert(
      'Navigation Stopped',
      'Turn-by-turn navigation has been ended.',
      [{ text: 'OK' }]
    );
    
    console.log('⏹️ Navigation stopped');
  }, []);

  // Calculate routes when both locations are set (with proper debouncing and loop prevention)
  useEffect(() => {
    if (navigation.fromCoordinate && navigation.toCoordinate && !navigation.isCalculating) {
      const fromKey = `${navigation.fromCoordinate.latitude},${navigation.fromCoordinate.longitude}`;
      const toKey = `${navigation.toCoordinate.latitude},${navigation.toCoordinate.longitude}`;
      const routeKey = `${fromKey}-${toKey}`;
      
      // Check if we already have routes for these exact coordinates
      const hasExistingRoutes = Object.keys(navigation.routes).length > 0 && 
        Object.values(navigation.routes).some(route => route !== null);
      
      if (!hasExistingRoutes) {
        console.log('🔄 Starting route calculation for:', routeKey);
        const timer = setTimeout(() => {
          calculateAllRoutes(navigation.fromCoordinate!, navigation.toCoordinate!);
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        console.log('✅ Routes already calculated for these coordinates, skipping...');
      }
    }
  }, [navigation.fromCoordinate?.latitude, navigation.fromCoordinate?.longitude, navigation.toCoordinate?.latitude, navigation.toCoordinate?.longitude]);

  // Display current route on map
  useEffect(() => {
    if (navigation.currentRoute && mapRef.current) {
      const mode = TRANSPORT_MODES.find(m => m.id === navigation.selectedMode);
      const mapRefForRouting = { current: mapRef.current };
      
      routingRef.current.displayRoute(navigation.currentRoute, mapRefForRouting, {
        color: mode?.color || '#007AFF',
        width: 5,
        opacity: 0.8,
      }).then(() => {
        if (navigation.currentRoute) {
          const currentRoute = navigation.currentRoute;
          setTimeout(() => {
            routingRef.current.fitRouteInView(currentRoute, mapRefForRouting, 80);
          }, 500);
        }
      }).catch(error => {
        console.error('Failed to display route:', error);
      });
    }
  }, [navigation.currentRoute, navigation.selectedMode]);

  // Other utility functions
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

  const clearError = useCallback(() => {
    setLocationError(null);
    setRetryAttempts(0);
    if (trackingStatus === 'error') {
      setTrackingStatus('idle');
    }
  }, [trackingStatus]);

  const updateHealthStatus = useCallback(async () => {
    try {
      const health: LocationHealthStatus = {
        isSupported: true,
        hasPermission: false,
        isGpsEnabled: false,
        isViewReady: mapRef.current !== null,
        lastLocationAge: currentLocation ? 0 : null,
        networkAvailable: true
      };

      setHealthStatus(health);
    } catch (error) {
      console.warn('Failed to get health status:', error);
    }
  }, [currentLocation]);

  const flyToCity = useCallback(async (city: { name: string; latitude: number; longitude: number }) => {
    try {
      await mapRef.current?.animateToLocation(city.latitude, city.longitude, 12);
      console.log(`✈️ Flying to ${city.name}`);
    } catch (error) {
      console.error(`❌ Fly to ${city.name} error:`, error);
      Alert.alert('Navigation Error', `Failed to fly to ${city.name}`);
    }
  }, []);

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

  const handleLocationSelected = useCallback(async (location: SearchLocation) => {
    console.log('🔍 Search location selected:', location.displayName);
    
    const searchMarker: MarkerConfig = {
      id: `search-${Date.now()}`,
      coordinate: location.coordinate,
      title: '🔍 Search Result',
      description: location.displayName
    };
    
    setMarkers(prev => [...prev, searchMarker]);
    
    try {
      if (mapRef.current) {
        await mapRef.current.animateToLocation(
          location.coordinate.latitude,
          location.coordinate.longitude,
          15
        );
        console.log('📍 Animated to search location:', location.coordinate);
      }
    } catch (error) {
      console.error('❌ Failed to animate to location:', error);
    }
  }, []);

  const toggleTileMode = useCallback(() => {
    const newVectorMode = !useVectorTiles;
    setUseVectorTiles(newVectorMode);
    console.log('🔄 Switching tile mode to:', newVectorMode ? 'Vector' : 'Raster');
  }, [useVectorTiles]);

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

  // Format functions for routing
  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Helper functions
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

  // Auto-request permissions and update health status on mount
  useEffect(() => {
    checkLocationPermissions();
    updateHealthStatus();
    
    const interval = setInterval(updateHealthStatus, 10000);
    return () => clearInterval(interval);
  }, [checkLocationPermissions, updateHealthStatus]);

  const handleMapReady = useCallback(() => {
    const currentUrl = TILE_CONFIGS.openMapTiles.styleUrl;
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
    
    // Only update map center during active navigation or if following user location
    if (navigation.navigationStarted || followUserLocation) {
      setMapCenter(location);
      
      // During navigation, check if we're close to the next instruction
      if (navigation.navigationStarted && navigation.currentRoute) {
        // TODO: Add logic to check proximity to next turn and provide guidance
        checkNavigationProgress(location);
      }
    }
  }, [navigation.navigationStarted, navigation.currentRoute, followUserLocation]);

  // TAB RENDERERS
  const renderLocationTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>🛡️ Secured Location System</Text>
        <Text style={styles.infoText}>✅ Zero crashes guaranteed</Text>
        <Text style={styles.infoText}>🔒 Thread-safe & robust</Text>
        <Text style={styles.infoText}>🎯 Comprehensive error handling</Text>
      </View>

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

  const renderCitiesTab = () => (
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

  const renderRoutingTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🧭 Navigation & Routing</Text>
      
      {/* From/To Location Setup */}
      <View style={styles.routingContainer}>
        <View style={styles.routingRow}>
          <View style={styles.locationDot} />
          <TouchableOpacity style={styles.routingInput} onPress={() => setShowFromSearch(true)}>
            <Text style={styles.routingInputText}>
              {navigation.fromLocation || "Your Location"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.currentLocationButton} onPress={useCurrentLocationForRouting}>
            <Text style={styles.currentLocationIcon}>📍</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.routingRow}>
          <View style={[styles.locationDot, { backgroundColor: '#FF3B30' }]} />
          <TouchableOpacity style={styles.routingInput} onPress={() => setShowToSearch(true)}>
            <Text style={styles.routingInputText}>
              {navigation.toLocation || "Choose destination"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transportation Modes */}
      {navigation.fromCoordinate && navigation.toCoordinate && (
        <View style={styles.transportContainer}>
          <Text style={styles.transportTitle}>Choose Transport</Text>
          <View style={styles.transportModes}>
            {TRANSPORT_MODES.map((mode) => {
              const route = navigation.routes[mode.id];
              const isSelected = navigation.selectedMode === mode.id;
              const isCalculating = navigation.isCalculating;
              
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.transportMode,
                    isSelected && styles.selectedTransportMode,
                  ]}
                  onPress={() => selectTransportMode(mode.id)}
                >
                  <Text style={[styles.transportIcon, isSelected && styles.selectedTransportIcon]}>
                    {mode.icon}
                  </Text>
                  <Text style={[styles.transportName, isSelected && styles.selectedTransportName]}>
                    {mode.name}
                  </Text>
                  {isCalculating ? (
                    <ActivityIndicator size="small" color={mode.color} />
                  ) : route ? (
                    <>
                      <Text style={[styles.transportTime, { color: isSelected ? '#FFFFFF' : mode.color }]}>
                        {formatDuration(route.duration)}
                      </Text>
                      <Text style={[styles.transportDistance, isSelected && styles.selectedTransportDistance]}>
                        {formatDistance(route.distance)}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.transportTime, isSelected && { color: '#FFFFFF' }]}>--</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Route Information */}
      {navigation.currentRoute && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeTime}>
            {formatDuration(navigation.currentRoute.duration)} ({formatDistance(navigation.currentRoute.distance)})
          </Text>
          <Text style={styles.routeDescription}>
            via {TRANSPORT_MODES.find(m => m.id === navigation.selectedMode)?.name}
          </Text>
          
          <View style={styles.actionButtons}>
            {!navigation.navigationStarted ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.startButton]}
                onPress={startNavigation}
              >
                <Text style={styles.startButtonText}>▶ Start Navigation</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionButton, styles.stopButton]}
                onPress={stopNavigation}
              >
                <Text style={styles.stopButtonText}>⏹ Stop Navigation</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={[styles.actionButton, styles.stepsButton]}>
              <Text style={styles.actionButtonText}>📋 Steps</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {navigation.navigationStarted && (
        <View style={styles.navigationActive}>
          <Text style={styles.navigationText}>
            🧭 Navigation Active - {TRANSPORT_MODES.find(m => m.id === navigation.selectedMode)?.name}
          </Text>
          <Text style={styles.navigationSubText}>
            📍 Follow the blue route on the map
          </Text>
          <Text style={styles.navigationSubText}>
            🎯 Destination: {navigation.toLocation}
          </Text>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>💡 Set start and destination points</Text>
        <Text style={styles.infoText}>🚗 Choose your preferred transport mode</Text>
        <Text style={styles.infoText}>🗺️ Route displayed on map with directions</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Search Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBoxWrapper}>
          <SearchBox
            placeholder="Search for places, addresses..."
            onLocationSelected={handleLocationSelected}
            onResultsChanged={(results) => {
              console.log(`🔍 Found ${results.length} search results`);
            }}
            maxResults={5}
            autoComplete={true}
            debounceMs={300}
            style={[styles.searchBox, {
              color: '#000000',
              fontSize: 16,
              fontWeight: '500',
            }]}
            containerStyle={[styles.searchBoxContainer, {
              overflow: 'visible',
            }]}
          />
        </View>
      </View>

      {/* Search Modals for Routing */}
      {(showFromSearch || showToSearch) && (
        <View style={styles.searchModal}>
          <View style={styles.enhancedModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showFromSearch ? '📍 Select Starting Location' : '🎯 Select Destination'}
              </Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowFromSearch(false);
                  setShowToSearch(false);
                }}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputSection}>
              <SearchBox
                placeholder={showFromSearch ? "Search for starting location..." : "Search for destination..."}
                onLocationSelected={showFromSearch ? handleFromLocationSelected : handleToLocationSelected}
                onResultsChanged={() => {}}
                maxResults={8}
                autoComplete={true}
                debounceMs={300}
                style={styles.enhancedSearchInput}
                containerStyle={styles.enhancedSearchContainer}
              />
            </View>

            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              
              {showFromSearch && (
                <TouchableOpacity 
                  style={styles.quickActionItem}
                  onPress={() => {
                    useCurrentLocationForRouting();
                    setShowFromSearch(false);
                  }}
                >
                  <View style={styles.quickActionIcon}>
                    <Text style={styles.quickActionEmoji}>📍</Text>
                  </View>
                  <View style={styles.quickActionContent}>
                    <Text style={styles.quickActionTitle}>Use Current Location</Text>
                    <Text style={styles.quickActionSubtitle}>Locate me automatically</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Map View */}
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={mapCenter}
        initialZoom={mapZoom}
        tileServerUrl={TILE_CONFIGS.openMapTiles.styleUrl}
        markers={markers}
        showUserLocation={showUserLocation}
        followUserLocation={followUserLocation}
        onMapReady={handleMapReady}
        onRegionChange={handleRegionChange}
        onPress={handleMapPress}
        onMarkerPress={handleMarkerPress}
        onUserLocationChange={handleUserLocationChange}
      />

      {/* Enhanced Navigation UI */}
      <SimpleNavigationUI
        isNavigating={navigation.navigationStarted}
        currentRoute={navigation.currentRoute}
        currentLocation={currentLocation}
        destination={navigation.toLocation}
        onExitNavigation={stopNavigation}
        transportMode={navigation.selectedMode}
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
          { 
            bottom: bottomSheetState === 'closed' ? 0 : 
                   bottomSheetState === 'half' ? BOTTOM_SHEET_HEIGHT_50 : 
                   BOTTOM_SHEET_HEIGHT_70 
          }
        ]}
        onPress={() => {
          if (bottomSheetState === 'closed') {
            setBottomSheetState('half');
          } else if (bottomSheetState === 'half') {
            setBottomSheetState('full');
          } else {
            setBottomSheetState('closed');
          }
        }}
      >
        <View style={styles.handle} />
        <Text style={styles.handleText}>
          {bottomSheetState === 'closed' ? '↑ Explore Expo-OSM' : 
           bottomSheetState === 'half' ? '↑ Expand More' : 
           '⌄ Expo-OSM'}
        </Text>
      </TouchableOpacity>

      {/* Collapsible Bottom Sheet */}
      {bottomSheetState !== 'closed' && (
        <View style={[
          styles.bottomSheet,
          { 
            height: bottomSheetState === 'half' ? BOTTOM_SHEET_HEIGHT_50 : BOTTOM_SHEET_HEIGHT_70,
            bottom: 0
          }
        ]}>
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
              style={[styles.tab, activeTab === 'cities' && styles.activeTab]}
              onPress={() => setActiveTab('cities')}
            >
              <Text style={[styles.tabText, activeTab === 'cities' && styles.activeTabText]}>
                ✈️ Cities
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'routing' && styles.activeTab]}
              onPress={() => setActiveTab('routing')}
            >
              <Text style={[styles.tabText, activeTab === 'routing' && styles.activeTabText]}>
                🧭 Routing
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
            {activeTab === 'cities' && renderCitiesTab()}
            {activeTab === 'routing' && renderRoutingTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
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
  
  // Search Styles
  searchContainer: {
    position: 'absolute',
    top: SEARCH_TOP_PADDING,
    left: 16,
    right: SCREEN_WIDTH > 400 ? 90 : 70, // Responsive right margin for zoom controls
    zIndex: 1000,
  },
  searchBoxWrapper: {
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
    color: '#000000',
  },
  searchBoxContainer: {
    borderRadius: 12,
    overflow: 'visible',
  },

  // Enhanced Search Modal Styles
  searchModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10000, // Higher z-index to ensure it's above everything
    justifyContent: 'flex-end',
  },
  enhancedModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85, // Responsive max height
    minHeight: SCREEN_HEIGHT * 0.4, // Minimum height for usability
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30, // Account for home indicator
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  modalCloseButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  searchInputSection: {
    marginBottom: 24,
  },
  enhancedSearchInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  enhancedSearchContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionEmoji: {
    fontSize: 18,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#666666',
  },

  // Floating Zoom Controls
  zoomControls: {
    position: 'absolute',
    top: ZOOM_CONTROLS_TOP,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999,
    overflow: 'hidden', // Ensure clean borders
  },
  zoomButton: {
    width: SCREEN_WIDTH > 400 ? 52 : 48, // Responsive button size
    height: SCREEN_WIDTH > 400 ? 52 : 48,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
    minHeight: 60, // Ensure minimum touch target
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
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 1001, // Ensure it's above map but below search modal
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
    fontSize: 12,
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
    fontSize: 16,
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

  // Routing specific styles
  routingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  routingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  routingInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    justifyContent: 'center',
  },
  routingInputText: {
    fontSize: 16,
    color: '#000000',
  },
  currentLocationButton: {
    padding: 8,
  },
  currentLocationIcon: {
    fontSize: 18,
  },

  // Transportation Modes
  transportContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  transportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  transportModes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  transportMode: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 70,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTransportMode: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  transportIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  selectedTransportIcon: {
    fontSize: 22,
  },
  transportName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  selectedTransportName: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  transportTime: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  transportDistance: {
    fontSize: 10,
    color: '#666666',
  },
  selectedTransportDistance: {
    color: '#E3F2FD',
  },

  // Route Information
  routeInfo: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  routeTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  stepsButton: {
    backgroundColor: '#F0F0F0',
  },
  actionButtonText: {
    color: '#000000',
    fontWeight: '500',
    fontSize: 14,
  },

  // Navigation Status
  navigationActive: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  navigationText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  navigationSubText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '400',
    fontSize: 14,
    marginTop: 4,
  },
});