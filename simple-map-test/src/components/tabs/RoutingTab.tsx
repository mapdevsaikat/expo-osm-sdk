import React from 'react';
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
  onSetMarkers,
  onAnimateToLocation,
  onSetNavigation,
}) => {
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
    
    await onAnimateToLocation(location.latitude, location.longitude, 15);
  };

  return (
    <View style={routingTabStyles.tabContent}>
      <Text style={routingTabStyles.sectionTitle}>🧭 Navigation & Routing</Text>
      
      <View style={routingTabStyles.routingContainer}>
        <View style={routingTabStyles.routingSearchRow}>
          <View style={routingTabStyles.locationDot} />
          <View style={routingTabStyles.routingSearchBox}>
            <SearchBox
              placeholder={navigation.fromLocation === 'Your Location' ? '📍 Your location' : '📍 Your starting location...'}
              value={navigation.fromLocation === 'Your Location' ? '📍 Your location' : undefined}
              onLocationSelected={onFromLocationSelected}
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
              placeholder="🎯 Choose destination..."
              onLocationSelected={onToLocationSelected}
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
            {navigation.fromLocation && (
              <Text style={routingTabStyles.selectedLocationText}>From: {navigation.fromLocation}</Text>
            )}
            {navigation.toLocation && (
              <Text style={routingTabStyles.selectedLocationText}>To: {navigation.toLocation}</Text>
            )}
            {(navigation.fromLocation || navigation.toLocation) && (
              <TouchableOpacity 
                style={routingTabStyles.clearNavButtonInline}
                onPress={onClearNavigation}
              >
                <Text style={routingTabStyles.clearNavButtonInlineText}>🗑️ Clear Navigation</Text>
              </TouchableOpacity>
            )}
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
              onPress={onClearNavigation}
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

