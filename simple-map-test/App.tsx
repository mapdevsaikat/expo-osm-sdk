import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StatusBar,
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

export default function NavigationDemo() {
  const mapRef = useRef<OSMViewRef>(null);

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

  const handleUserLocationChange = useCallback((location: Coordinate) => {
    logger.log('📍 User location updated:', location);
    locationManagement.setCurrentLocation(location);
    
    // Only update map center during active navigation or if following user location
    if (navigationManagement.navigation.navigationStarted || locationManagement.followUserLocation) {
      setMapCenter(location);
      
      // During navigation, check if we're close to the next instruction
      if (navigationManagement.navigation.navigationStarted && navigationManagement.navigation.currentRoute) {
        // TODO: Add logic to check proximity to next turn and provide guidance
        logger.log('🧭 Checking navigation progress at:', location);
      }
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
        logger.log('📍 Animated to search location:', location.coordinate);
      }
    } catch (error) {
      logger.error('❌ Failed to animate to location:', error);
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
      locationManagement.setFollowUserLocation(true);
      // Auto-close bottom sheet when navigation starts
      setBottomSheetState('closed');
    }
  }, [navigationManagement, locationManagement]);

  const handleStopNavigation = useCallback(() => {
    navigationManagement.stopNavigation();
    locationManagement.setFollowUserLocation(false);
  }, [navigationManagement, locationManagement]);

  // Bottom sheet handlers
  const handleToggleBottomSheet = useCallback(() => {
    if (bottomSheetState === 'closed') {
      setBottomSheetState('half');
    } else if (bottomSheetState === 'half') {
      setBottomSheetState('full');
    } else {
      setBottomSheetState('closed');
    }
  }, [bottomSheetState]);

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
          onLocationSelected={handleLocationSelected}
          onResultsChanged={(results) => {
            logger.log(`🔍 Found ${results.length} search results`);
          }}
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
        showUserLocation={locationManagement.showUserLocation}
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
        onSetMarkers={setMarkers}
        onAnimateToLocation={async (lat, lng, zoom) => {
          await mapRef.current?.animateToLocation(lat, lng, zoom);
        }}
        onSetNavigation={navigationManagement.setNavigation}
      />
    </SafeAreaView>
  );
}