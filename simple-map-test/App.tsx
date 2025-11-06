import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StatusBar,
  InteractionManager,
  SafeAreaView,
  Alert,
  StyleSheet,
} from 'react-native';
import { 
  SearchBox,
  LocationButton,
  NavigationControls,
  type OSMViewRef, 
  type Coordinate, 
  type MarkerConfig,
  type SearchLocation,
} from 'expo-osm-sdk';
import SimpleNavigationUI from './src/components/SimpleNavigationUI';
import { BottomSheet } from './src/components/BottomSheet';
import { MapView } from './src/components/MapView';
import { useLocationManagement } from './src/hooks/useLocationManagement';
import { useNavigationManagement } from './src/hooks/useNavigationManagement';
import { DEFAULT_CITIES, type City } from './src/constants';
import { commonStyles } from './src/styles/common';
import type { TabType, BottomSheetState } from './src/types';
import { logger } from './src/utils/logger';
import { calculateBearing, calculateDistance } from './src/utils/formatters';
import { initializeTileProxy } from './src/services/tileProxyService';

export default function NavigationDemo() {
  // Initialize tile cache on app start
  useEffect(() => {
    const initCache = async () => {
      const result = await initializeTileProxy();
      if (result.success) {
        logger.log('✅ Tile cache initialized:', result.message);
      } else {
        logger.warn('⚠️ Tile cache not available:', result.message);
      }
    };
    initCache();
  }, []);
  const mapRef = useRef<OSMViewRef>(null);
  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Bottom sheet state
  const [bottomSheetState, setBottomSheetState] = useState<BottomSheetState>('closed');
  const [activeTab, setActiveTab] = useState<TabType>('location');

  // Map state
  const [mapCenter, setMapCenter] = useState<Coordinate>({
    latitude: 22.5726,
    longitude: 88.3639, // Kolkata as default
  });
  const [mapZoom, setMapZoom] = useState(12);
  const [markers, setMarkers] = useState<MarkerConfig[]>([]);
  const [useVectorTiles, setUseVectorTiles] = useState(true);
  const [isMarkerModeEnabled, setIsMarkerModeEnabled] = useState(false);
  
  // Track search marker ID to remove it when search is cleared
  const searchMarkerIdRef = useRef<string | null>(null);
  
  // Track selected search location to display in SearchBox
  const [selectedSearchLocation, setSelectedSearchLocation] = useState<string | null>(null);
  
  // Helper function to shorten address (first 2 parts for readability)
  const getShortAddress = useCallback((fullAddress: string): string => {
    if (!fullAddress) return '';
    
    // Split by comma and take first 2 parts
    const parts = fullAddress.split(',').map(part => part.trim()).filter(part => part.length > 0);
    
    if (parts.length >= 2) {
      // Return first 2 parts: "Axis Mall, Biswa Bangla Sarani"
      return `${parts[0]}, ${parts[1]}`;
    } else if (parts.length === 1) {
      // If only one part, return it
      return parts[0];
    }
    
    return fullAddress;
  }, []);

  // Location management hook
  const locationManagement = useLocationManagement({
    mapRef,
    onLocationChange: (location) => {
      setMapCenter(location);
    },
  });

  // Navigation management hook
  const navigationManagement = useNavigationManagement({
    mapRef,
    onMarkersUpdate: setMarkers,
  });

  // Map handlers
  const handleRegionChange = useCallback(() => {
    logger.log('🗺️ Region changed');
  }, []);

  const handleUserLocationChange = useCallback(async (location: Coordinate) => {
    logger.log('📍 User location updated:', location);
    locationManagement.setCurrentLocation(location);
    
    // Note: The hook automatically ensures showUserLocation is true when we have location data
    // This fixes the inconsistent purple dot appearance
    
    // During navigation, maintain fixed zoom, pitch, and update bearing
    if (navigationManagement.navigation.navigationStarted && navigationManagement.navigation.currentRoute) {
      // Update navigation arrow position and rotation
      navigationManagement.updateNavigationArrow(location);
      
      // IMPORTANT: Don't update camera if navigation camera setup is still in progress
      // This prevents location updates from overriding the initial camera animation
      if (navigationManagement.navigationCameraSetupRef.current) {
        logger.log('⏸️ Skipping camera update - navigation camera setup in progress');
        return;
      }
      
      // Update camera to follow user location with fixed zoom (19), pitch (30), and dynamic bearing
      if (mapRef.current) {
        try {
          // Calculate bearing to next step/destination
          let bearing = 0;
          const { currentRoute, toCoordinate } = navigationManagement.navigation;
          
          if (currentRoute.steps && currentRoute.steps.length > 0) {
            // Find closest step to current location
            let closestStepIndex = 0;
            let minDistance = Infinity;
            
            currentRoute.steps.forEach((step, index) => {
              if (step.coordinate) {
                const distance = calculateDistance(location, step.coordinate);
                if (distance < minDistance) {
                  minDistance = distance;
                  closestStepIndex = index;
                }
              }
            });
            
            // Get next step for bearing calculation
            const nextStep = currentRoute.steps[Math.min(closestStepIndex + 1, currentRoute.steps.length - 1)];
            if (nextStep && nextStep.coordinate) {
              bearing = calculateBearing(location, nextStep.coordinate);
            } else if (toCoordinate) {
              bearing = calculateBearing(location, toCoordinate);
            }
          } else if (toCoordinate) {
            bearing = calculateBearing(location, toCoordinate);
          }
          
          // Update camera with fixed zoom (19), pitch (30), and calculated bearing
          // Use InteractionManager to ensure UI thread execution
          InteractionManager.runAfterInteractions(async () => {
            if (!isMountedRef.current || !mapRef.current) return;
            try {
              const currentMapRef = mapRef.current;
              await currentMapRef.animateToLocation(location.latitude, location.longitude, 19);
              
              if (!isMountedRef.current || !mapRef.current) return;
              await currentMapRef.setPitch(30);
              
              if (!isMountedRef.current || !mapRef.current) return;
              await currentMapRef.setBearing(bearing);
            } catch (error) {
              if (isMountedRef.current) {
                logger.error('❌ Failed to update camera:', error);
              }
            }
          });
          
          logger.log('🧭 Navigation camera updated:', { 
            location, 
            zoom: 19, 
            pitch: 30, 
            bearing: bearing.toFixed(1) 
          });
        } catch (error) {
          logger.error('❌ Failed to update navigation camera:', error);
        }
      }
      
      logger.log('🧭 Navigation active at:', location);
    } else if (locationManagement.followUserLocation) {
      // Normal location following (not navigation)
      setMapCenter(location);
    }
  }, [locationManagement, navigationManagement]);

  // Map handlers - these will be passed to MapView component
  const handleMapPressCallback = useCallback((coordinate: Coordinate) => {
    // Marker adding logic is handled in MapView component
    logger.log('📍 Map pressed at:', coordinate);
  }, []);

  const handleMarkerPressCallback = useCallback((markerId: string, coordinate: Coordinate) => {
    // Marker press logic is handled in MapView component
    logger.log('🔍 Marker pressed:', markerId, coordinate);
  }, []);

  const handleLocationSelected = useCallback(async (location: SearchLocation) => {
    logger.log('🔍 Search location selected:', location.displayName);
    
    // Store selected location to display in SearchBox (shortened)
    setSelectedSearchLocation(location.displayName);
    
    // Remove previous search marker if exists
    if (searchMarkerIdRef.current) {
      setMarkers(prev => prev.filter(m => m.id !== searchMarkerIdRef.current));
    }
    
    const searchMarker: MarkerConfig = {
      id: `search-${Date.now()}`,
      coordinate: location.coordinate,
      title: '🔍 Search Result',
      description: location.displayName
    };
    
    // Track the search marker ID
    searchMarkerIdRef.current = searchMarker.id;
    
    setMarkers(prev => [...prev, searchMarker]);
    
    try {
      if (mapRef.current) {
        await mapRef.current.animateToLocation(
          location.coordinate.latitude,
          location.coordinate.longitude,
          15
        );
        logger.log('📍 Animated to search location:', location.coordinate);
      }
    } catch (error) {
      logger.error('❌ Failed to animate to location:', error);
    }
  }, []);
  
  // Handle search results change - clear marker when search is cleared
  const handleSearchResultsChanged = useCallback((results: SearchLocation[]) => {
    logger.log(`🔍 Found ${results.length} search results`);
    
    // If results are empty (search was cleared), remove the search marker and clear selected location
    if (results.length === 0 && searchMarkerIdRef.current) {
      logger.log('🗑️ Clearing search marker as search was cleared');
      setMarkers(prev => prev.filter(m => m.id !== searchMarkerIdRef.current));
      searchMarkerIdRef.current = null;
      setSelectedSearchLocation(null); // Clear the selected location display
    }
  }, []);

  // Map operations
  const zoomIn = useCallback(async () => {
    try {
      await mapRef.current?.zoomIn();
      logger.log('🔍 Zoomed in');
    } catch (error) {
      logger.error('❌ Zoom in error:', error);
    }
  }, []);

  const zoomOut = useCallback(async () => {
    try {
      await mapRef.current?.zoomOut();
      logger.log('🔍 Zoomed out');
    } catch (error) {
      logger.error('❌ Zoom out error:', error);
    }
  }, []);

  const resetBearing = useCallback(async () => {
    try {
      await mapRef.current?.setBearing(0);
      logger.log('🧭 Reset bearing to north');
    } catch (error) {
      logger.error('❌ Reset bearing error:', error);
    }
  }, []);

  // Settings handlers
  const toggleTileMode = useCallback(() => {
    const newVectorMode = !useVectorTiles;
    setUseVectorTiles(newVectorMode);
    logger.log('🔄 Switching tile mode to:', newVectorMode ? 'Vector' : 'Raster');
  }, [useVectorTiles]);

  const toggleMarkerMode = useCallback(() => {
    setIsMarkerModeEnabled(prev => {
      const newValue = !prev;
      logger.log(newValue ? '✅ Marker mode enabled' : '❌ Marker mode disabled');
      return newValue;
    });
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
    logger.log('🗑️ Cleared all markers');
  }, []);

  // City handlers
  const flyToCity = useCallback(async (city: City) => {
    try {
      await mapRef.current?.animateToLocation(city.latitude, city.longitude, 12);
      logger.log(`✈️ Flying to ${city.name}`);
    } catch (error) {
      logger.error(`❌ Fly to ${city.name} error:`, error);
      Alert.alert('Navigation Error', `Failed to fly to ${city.name}`);
    }
  }, []);

  // Navigation handlers
  const handleStartNavigation = useCallback(() => {
    const started = navigationManagement.startNavigation();
    if (started) {
      // Disable followUserLocation during navigation - we manually control camera with fixed zoom/pitch
      locationManagement.setFollowUserLocation(false);
      // Auto-close bottom sheet when navigation starts
      setBottomSheetState('closed');
      
      // Initialize navigation arrow if we have current location
      if (locationManagement.currentLocation) {
        navigationManagement.updateNavigationArrow(locationManagement.currentLocation);
      }
    }
  }, [navigationManagement, locationManagement]);

  const handleStopNavigation = useCallback(() => {
    navigationManagement.stopNavigation();
    locationManagement.setFollowUserLocation(false);
  }, [navigationManagement, locationManagement]);

  const handleGetDirection = useCallback(() => {
    const { fromCoordinate, toCoordinate } = navigationManagement.navigation;
    if (fromCoordinate && toCoordinate) {
      navigationManagement.calculateAllRoutes(fromCoordinate, toCoordinate);
    }
  }, [navigationManagement]);

  // Bottom sheet handlers - simplified to toggle between closed and open (50%)
  const handleToggleBottomSheet = useCallback(() => {
    setBottomSheetState(prev => prev === 'closed' ? 'half' : 'closed');
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    setBottomSheetState('closed');
  }, []);

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Search Box */}
      <View style={commonStyles.searchContainer}>
        <SearchBox
          placeholder="🔍 Search places, addresses..."
          value={selectedSearchLocation ? getShortAddress(selectedSearchLocation) : undefined}
          onLocationSelected={handleLocationSelected}
          onResultsChanged={handleSearchResultsChanged}
          maxResults={5}
          autoComplete={true}
          debounceMs={300}
          style={commonStyles.searchBox}
          containerStyle={commonStyles.searchBoxContainer}
        />
      </View>

      {/* Map View */}
      <MapView
        mapRef={mapRef}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        markers={markers}
        useVectorTiles={useVectorTiles}
        bottomSheetState={bottomSheetState}
        showUserLocation={locationManagement.showUserLocation && !navigationManagement.navigation.navigationStarted}
        followUserLocation={locationManagement.followUserLocation}
        isMarkerModeEnabled={isMarkerModeEnabled}
        onMapReady={locationManagement.handleMapReady}
        onRegionChange={handleRegionChange}
        onUserLocationChange={handleUserLocationChange}
        onMapPress={handleMapPressCallback}
        onMarkerPress={handleMarkerPressCallback}
        onMarkersUpdate={setMarkers}
      />

      {/* Enhanced Navigation UI */}
      <SimpleNavigationUI
        isNavigating={navigationManagement.navigation.navigationStarted}
        currentRoute={navigationManagement.navigation.currentRoute}
        currentLocation={locationManagement.currentLocation}
        destination={navigationManagement.navigation.toLocation}
        onExitNavigation={handleStopNavigation}
        transportMode={navigationManagement.navigation.selectedMode}
      />

      {/* NavigationControls - Hide during navigation */}
      {!navigationManagement.navigation.navigationStarted && (
        <View style={commonStyles.navigationControlsContainer}>
          <NavigationControls
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            size={42}
            color="#9C1AFF"
            showPitchControl={false}
            showCompassControl={false}
          />
        </View>
      )}

      {/* LocationButton */}
      <View style={commonStyles.locationButtonContainer}>
        <LocationButton
          getCurrentLocation={locationManagement.getLocationForButton}
          onLocationFound={locationManagement.handleLocationButtonFound}
          onLocationError={locationManagement.handleLocationButtonError}
          color="#9C1AFF"
          size={42}
        />
      </View>

      {/* Compass Button - Below LocationButton */}
      {!navigationManagement.navigation.navigationStarted && (
        <View style={commonStyles.compassButtonContainer}>
          <TouchableOpacity
            onPress={resetBearing}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
            }}
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 24,
                height: 24,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* North Arrow */}
              <View
                style={{
                  width: 0,
                  height: 0,
                  backgroundColor: 'transparent',
                  borderStyle: 'solid',
                  borderLeftWidth: 6,
                  borderRightWidth: 6,
                  borderBottomWidth: 12,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: '#9C1AFF',
                }}
              />
              <View
                style={{
                  width: 4,
                  height: 8,
                  backgroundColor: '#9C1AFF',
                  marginTop: -2,
                }}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        bottomSheetState={bottomSheetState}
        activeTab={activeTab}
        onToggleBottomSheet={handleToggleBottomSheet}
        onCloseBottomSheet={handleCloseBottomSheet}
        onTabChange={setActiveTab}
        isTracking={locationManagement.isTracking}
        trackingStatus={locationManagement.trackingStatus}
        healthStatus={locationManagement.healthStatus}
        locationError={locationManagement.locationError}
        retryAttempts={locationManagement.retryAttempts}
        currentLocation={locationManagement.currentLocation}
        onToggleTracking={locationManagement.toggleLocationTracking}
        onRetry={locationManagement.retryLastOperation}
        onClearError={locationManagement.clearError}
        onCityPress={flyToCity}
        useVectorTiles={useVectorTiles}
        markersCount={markers.length}
        isMarkerModeEnabled={isMarkerModeEnabled}
        onToggleTileMode={toggleTileMode}
        onToggleMarkerMode={toggleMarkerMode}
        onClearMarkers={clearMarkers}
        navigation={navigationManagement.navigation}
        mapRef={mapRef}
        markers={markers}
        onFromLocationSelected={navigationManagement.handleFromLocationSelected}
        onToLocationSelected={navigationManagement.handleToLocationSelected}
        onSelectTransportMode={navigationManagement.selectTransportMode}
        onStartNavigation={handleStartNavigation}
        onStopNavigation={handleStopNavigation}
        onClearNavigation={navigationManagement.clearNavigation}
        onGetDirection={handleGetDirection}
        onSetMarkers={setMarkers}
        onAnimateToLocation={async (lat, lng, zoom) => {
          await mapRef.current?.animateToLocation(lat, lng, zoom);
        }}
        onSetNavigation={navigationManagement.setNavigation}
      />
    </SafeAreaView>
  );
}