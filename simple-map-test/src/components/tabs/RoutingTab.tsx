import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SearchBox, LocationButton } from 'expo-osm-sdk';
import type { OSMViewRef, SearchLocation, MarkerConfig } from 'expo-osm-sdk';
import { TRANSPORT_MODES } from '../../constants';
import { formatDuration, formatDistance } from '../../utils/formatters';
import type { NavigationState } from '../../types';
import { routingTabStyles } from '../../styles/tabs';
import { logger } from '../../utils/logger';

interface RoutingTabProps {
  navigation: NavigationState;
  isTracking: boolean;
  mapRef: React.RefObject<OSMViewRef | null>;
  markers: MarkerConfig[];
  onFromLocationSelected: (location: SearchLocation) => void;
  onToLocationSelected: (location: SearchLocation) => void;
  onSelectTransportMode: (modeId: string) => void;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
  onClearNavigation: () => void;
  onGetDirection: () => void;
  onSetMarkers: React.Dispatch<React.SetStateAction<MarkerConfig[]>>;
  onAnimateToLocation: (lat: number, lng: number, zoom: number) => Promise<void>;
  onSetNavigation: React.Dispatch<React.SetStateAction<NavigationState>>;
}

export const RoutingTab: React.FC<RoutingTabProps> = ({
  navigation,
  isTracking,
  mapRef,
  markers,
  onFromLocationSelected,
  onToLocationSelected,
  onSelectTransportMode,
  onStartNavigation,
  onStopNavigation,
  onClearNavigation,
  onGetDirection,
  onSetMarkers,
  onAnimateToLocation,
  onSetNavigation,
}) => {
  // Use state to track search box reset key - changing this forces SearchBox to re-mount
  const [searchBoxResetKey, setSearchBoxResetKey] = useState(0);
  
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
  
  // Wrap onClearNavigation to also reset SearchBox components
  const handleClearNavigation = useCallback(() => {
    onClearNavigation();
    // Increment reset key to force SearchBox components to re-mount with empty values
    setSearchBoxResetKey(prev => prev + 1);
    logger.log('🗑️ Cleared navigation and reset search boxes');
  }, [onClearNavigation]);

  // Handle clearing the "From" search box
  const handleClearFrom = useCallback(() => {
    onSetNavigation(prev => ({
      ...prev,
      fromLocation: '',
      fromCoordinate: null,
    }));
    logger.log('🗑️ Cleared From location');
  }, [onSetNavigation]);

  // Handle clearing the "To" search box
  const handleClearTo = useCallback(() => {
    onSetNavigation(prev => ({
      ...prev,
      toLocation: '',
      toCoordinate: null,
    }));
    logger.log('🗑️ Cleared To location');
  }, [onSetNavigation]);
  
  const handleLocationButtonPress = async () => {
    if (!isTracking && mapRef.current) {
      try {
        await mapRef.current.startLocationTracking();
      } catch (error) {
        logger.warn('⚠️ Could not start tracking:', error);
      }
    }
    
    const loc = await mapRef.current?.waitForLocation(60);
    if (loc) {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
    throw new Error('Unable to get location - timeout. Please ensure GPS is enabled.');
  };

  const handleLocationFound = async (location: { latitude: number; longitude: number }) => {
    logger.log('📍 Current location obtained for routing:', location);
    
    onSetNavigation(prev => ({
      ...prev,
      fromLocation: 'Your Location',
      fromCoordinate: location,
      routes: {},
      currentRoute: null,
      navigationStarted: false,
    }));
    
    // Remove any existing markers for current location or from-location
    // since we're using the user's current location (shown as location dot)
    onSetMarkers(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return prevArray.filter((m: MarkerConfig) => 
        m.id !== 'current-location' && m.id !== 'from-location'
      );
    });
    
    await onAnimateToLocation(location.latitude, location.longitude, 18);
  };

  return (
    <View style={routingTabStyles.tabContent}>
      <Text style={routingTabStyles.sectionTitle}>🧭 Navigation & Routing</Text>
      
      <View style={routingTabStyles.routingContainer}>
        <View style={routingTabStyles.routingSearchRow}>
          <View style={routingTabStyles.locationDot} />
          <View style={routingTabStyles.routingSearchBox}>
            <SearchBox
              key={`from-${searchBoxResetKey}`}
              placeholder={navigation.fromLocation === 'Your Location' ? '📍 Your location' : '📍 Your starting location...'}
              placeholderTextColor="#999999"
              value={
                navigation.fromLocation === 'Your Location' 
                  ? '📍 Your location' 
                  : navigation.fromLocation 
                    ? getShortAddress(navigation.fromLocation) 
                    : undefined
              }
              onLocationSelected={onFromLocationSelected}
              onClear={handleClearFrom}
              onResultsChanged={() => {}}
              maxResults={5}
              autoComplete={true}
              debounceMs={300}
              style={routingTabStyles.inlineSearchInput}
              containerStyle={routingTabStyles.inlineSearchContainer}
              editable={navigation.fromLocation !== 'Your Location'}
            />
          </View>
          <View style={routingTabStyles.currentLocationButtonContainer}>
            <LocationButton
              getCurrentLocation={handleLocationButtonPress}
              onLocationFound={handleLocationFound}
              onLocationError={(error) => {
                logger.error('❌ LocationButton error:', error);
                Alert.alert('Location Error', error);
              }}
              color="#9C1AFF"
              size={42}
            />
          </View>
        </View>
        
        <View style={routingTabStyles.routingSeparator} />
        
        <View style={routingTabStyles.routingSearchRow}>
          <View style={[routingTabStyles.locationDot, { backgroundColor: '#FF3B30' }]} />
          <View style={routingTabStyles.routingSearchBox}>
            <SearchBox
              key={`to-${searchBoxResetKey}`}
              placeholder="🎯 Choose destination..."
              placeholderTextColor="#999999"
              value={navigation.toLocation ? getShortAddress(navigation.toLocation) : undefined}
              onLocationSelected={onToLocationSelected}
              onClear={handleClearTo}
              onResultsChanged={() => {}}
              maxResults={5}
              autoComplete={true}
              debounceMs={300}
              style={routingTabStyles.inlineSearchInput}
              containerStyle={routingTabStyles.inlineSearchContainer}
            />
          </View>
        </View>
        
        {(navigation.fromLocation || navigation.toLocation) && (
          <View style={routingTabStyles.selectedLocations}>
            <TouchableOpacity 
              style={[
                routingTabStyles.getDirectionButton,
                (!navigation.fromCoordinate || !navigation.toCoordinate || navigation.isCalculating) && routingTabStyles.getDirectionButtonDisabled
              ]}
              onPress={onGetDirection}
              disabled={!navigation.fromCoordinate || !navigation.toCoordinate || navigation.isCalculating}
            >
              {navigation.isCalculating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={routingTabStyles.getDirectionButtonText}>＞ Get Direction</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {navigation.fromCoordinate && navigation.toCoordinate && (
        <View style={routingTabStyles.transportContainer}>
          <Text style={routingTabStyles.transportTitle}>Choose Transport</Text>
          <View style={routingTabStyles.transportModes}>
            {TRANSPORT_MODES.map((mode) => {
              const route = navigation.routes[mode.id];
              const isSelected = navigation.selectedMode === mode.id;
              const isCalculating = navigation.isCalculating;
              
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    routingTabStyles.transportMode,
                    isSelected && routingTabStyles.selectedTransportMode,
                  ]}
                  onPress={() => onSelectTransportMode(mode.id)}
                >
                  <Text style={[routingTabStyles.transportIcon, isSelected && routingTabStyles.selectedTransportIcon]}>
                    {mode.icon}
                  </Text>
                  <Text style={[routingTabStyles.transportName, isSelected && routingTabStyles.selectedTransportName]}>
                    {mode.name}
                  </Text>
                  {isCalculating ? (
                    <ActivityIndicator size="small" color={mode.color} />
                  ) : route ? (
                    <>
                      <Text style={[routingTabStyles.transportTime, { color: isSelected ? '#FFFFFF' : mode.color }]}>
                        {formatDuration(route.duration)}
                      </Text>
                      <Text style={[routingTabStyles.transportDistance, isSelected && routingTabStyles.selectedTransportDistance]}>
                        {formatDistance(route.distance)}
                      </Text>
                    </>
                  ) : (
                    <Text style={[routingTabStyles.transportTime, isSelected && { color: '#FFFFFF' }]}>--</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {navigation.currentRoute && (
        <View style={routingTabStyles.routeInfo}>
          <Text style={routingTabStyles.routeTime}>
            {formatDuration(navigation.currentRoute.duration)} ({formatDistance(navigation.currentRoute.distance)})
          </Text>
          <Text style={routingTabStyles.routeDescription}>
            via {TRANSPORT_MODES.find(m => m.id === navigation.selectedMode)?.name}
          </Text>
          
          <View style={routingTabStyles.actionButtons}>
            {!navigation.navigationStarted ? (
              <TouchableOpacity 
                style={[routingTabStyles.actionButton, routingTabStyles.startButton]}
                onPress={onStartNavigation}
              >
                <Text style={routingTabStyles.startButtonText}>▶ Start Navigation</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[routingTabStyles.actionButton, routingTabStyles.stopButton]}
                onPress={onStopNavigation}
              >
                <Text style={routingTabStyles.stopButtonText}>⏹ Stop Navigation</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[routingTabStyles.actionButton, routingTabStyles.clearNavButton]}
              onPress={handleClearNavigation}
            >
              <Text style={routingTabStyles.clearNavButtonText}>🗑️ Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {navigation.navigationStarted && (
        <View style={routingTabStyles.navigationActive}>
          <Text style={routingTabStyles.navigationText}>
            🧭 Navigation Active - {TRANSPORT_MODES.find(m => m.id === navigation.selectedMode)?.name}
          </Text>
          <Text style={routingTabStyles.navigationSubText}>
            📍 Follow the route on the map
          </Text>
          <Text style={routingTabStyles.navigationSubText}>
            🎯 Destination: {navigation.toLocation}
          </Text>
        </View>
      )}

      <View style={routingTabStyles.infoBox}>
        <Text style={routingTabStyles.infoText}>💡 Set start and destination points</Text>
        <Text style={routingTabStyles.infoText}>🚗 Choose your preferred transport mode</Text>
        <Text style={routingTabStyles.infoText}>🗺️ Route displayed on map with directions</Text>
      </View>
    </View>
  );
};

