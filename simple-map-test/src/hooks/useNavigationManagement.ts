import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, InteractionManager } from 'react-native';
import { useOSRMRouting } from 'expo-osm-sdk';
import type { OSMViewRef, Coordinate, SearchLocation, MarkerConfig, Route } from 'expo-osm-sdk';
import type { NavigationState } from '../types';
import { TRANSPORT_MODES } from '../constants';
import { logger } from '../utils/logger';

interface UseNavigationManagementProps {
  mapRef: React.RefObject<OSMViewRef | null>;
  onRouteCalculated?: (routes: { [key: string]: Route | null }) => void;
  onMarkersUpdate?: React.Dispatch<React.SetStateAction<MarkerConfig[]>>;
}

export const useNavigationManagement = ({ mapRef, onRouteCalculated, onMarkersUpdate }: UseNavigationManagementProps) => {
  const routing = useOSRMRouting();
  const routingRef = useRef(routing);

  // Update routing ref when routing changes
  useEffect(() => {
    routingRef.current = routing;
  }, [routing]);

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

  const handleFromLocationSelected = useCallback((location: SearchLocation) => {
    logger.log('📍 From location selected:', location.displayName, location.coordinate);
    
    setNavigation(prev => ({
      ...prev,
      fromLocation: location.displayName,
      fromCoordinate: location.coordinate,
      routes: {},
      currentRoute: null,
      navigationStarted: false,
    }));
    
    // Add marker for from location
    const fromMarker: MarkerConfig = {
      id: 'from-location',
      coordinate: location.coordinate,
      title: '🏁 Start',
      description: location.displayName,
    };
    
    onMarkersUpdate?.(prev => [
      ...prev.filter((m: MarkerConfig) => m.id !== 'from-location'),
      fromMarker
    ]);
  }, [onMarkersUpdate]);

  const handleToLocationSelected = useCallback((location: SearchLocation) => {
    logger.log('📍 To location selected:', location.displayName, location.coordinate);
    
    setNavigation(prev => ({
      ...prev,
      toLocation: location.displayName,
      toCoordinate: location.coordinate,
      routes: {},
      currentRoute: null,
      navigationStarted: false,
    }));
    
    // Add marker for to location
    const toMarker: MarkerConfig = {
      id: 'to-location',
      coordinate: location.coordinate,
      title: '🏁 Destination',
      description: location.displayName,
    };
    
    onMarkersUpdate?.(prev => [
      ...prev.filter((m: MarkerConfig) => m.id !== 'to-location'),
      toMarker
    ]);
  }, [onMarkersUpdate]);

  const calculateAllRoutes = useCallback(async (fromCoord: Coordinate, toCoord: Coordinate) => {
    logger.log('🚀 calculateAllRoutes called with:', { fromCoord, toCoord });
    
    // Prevent multiple simultaneous calculations
    setNavigation(prev => {
      if (prev.isCalculating) {
        logger.log('⚠️ Already calculating routes, skipping...');
        return prev;
      }
      return { ...prev, isCalculating: true, routes: {} };
    });

    try {
      const routePromises = TRANSPORT_MODES.map(async (mode) => {
        try {
          logger.log(`🔍 Calculating ${mode.name} route with profile: ${mode.profile}...`);
          const route = await routingRef.current.calculateRoute(
            fromCoord,
            toCoord,
            { profile: mode.profile, steps: true }
          );
          
          if (route) {
            logger.log(`✅ ${mode.name} route SUCCESS:`, {
              duration: `${Math.round(route.duration / 60)} min`,
              distance: `${(route.distance / 1000).toFixed(1)} km`,
              profile: mode.profile,
              coordinates: route.coordinates?.length || 0
            });
          } else {
            logger.log(`❌ ${mode.name} route FAILED: No route returned`);
          }
          
          return { modeId: mode.id, route };
        } catch (error) {
          logger.error(`❌ Error calculating route for ${mode.name} (${mode.profile}):`, error);
          return { modeId: mode.id, route: null };
        }
      });

      const results = await Promise.all(routePromises);
      const newRoutes: { [key: string]: Route | null } = {};
      
      results.forEach(({ modeId, route }) => {
        newRoutes[modeId] = route;
      });

      logger.log('📊 ROUTE ASSIGNMENT SUMMARY:');
      Object.keys(newRoutes).forEach(modeId => {
        const route = newRoutes[modeId];
        const mode = TRANSPORT_MODES.find(m => m.id === modeId);
        if (route && mode) {
          logger.log(`  🚩 ${mode.name} (${mode.profile}): ${Math.round(route.duration / 60)} min, ${(route.distance / 1000).toFixed(1)} km`);
        } else {
          logger.log(`  ❌ ${mode?.name || modeId}: No route`);
        }
      });

      setNavigation(prev => ({
        ...prev,
        routes: newRoutes,
        isCalculating: false,
        currentRoute: newRoutes[prev.selectedMode] || null,
      }));

      onRouteCalculated?.(newRoutes);

    } catch (error) {
      logger.error('❌ Error calculating routes:', error);
      setNavigation(prev => ({ ...prev, isCalculating: false, routes: {} }));
      Alert.alert('Error', 'Failed to calculate routes. Please try again.');
    }
  }, [onRouteCalculated]);

  const selectTransportMode = useCallback((modeId: string) => {
    if (mapRef.current) {
      const mapRefForRouting = { current: mapRef.current };
      routingRef.current.clearRoute(mapRefForRouting).catch(error => {
        logger.warn('Failed to clear route:', error);
      });
    }
    
    setNavigation(prev => ({
      ...prev,
      selectedMode: modeId,
      currentRoute: prev.routes[modeId] || null,
    }));
  }, [mapRef]);

  const startNavigation = useCallback(() => {
    if (navigation.currentRoute && navigation.fromCoordinate && mapRef.current) {
      setNavigation(prev => ({ ...prev, navigationStarted: true }));
      
      // Add navigation marker at start point with purple theme color
      const navigationMarker: MarkerConfig = {
        id: 'navigation-start',
        coordinate: navigation.fromCoordinate,
        title: '🧭 Navigation Start',
        description: 'Starting navigation from here',
      };
      
      onMarkersUpdate?.(prev => [
        ...prev.filter((m: MarkerConfig) => m.id !== 'navigation-start'),
        navigationMarker,
      ]);
      
      logger.log('🚗 Navigation started for route:', navigation.currentRoute);
      return true; // Return true to indicate navigation was started
    }
    return false;
  }, [navigation.currentRoute, navigation.fromCoordinate, mapRef, onMarkersUpdate]);

  const stopNavigation = useCallback(() => {
    setNavigation(prev => ({ 
      ...prev, 
      navigationStarted: false,
      currentRoute: null
    }));
    
    // Remove navigation marker
    onMarkersUpdate?.(prev => prev.filter((m: MarkerConfig) => m.id !== 'navigation-start'));
    
    
      logger.log('⏹️ Navigation stopped');
    return true; // Return true to indicate navigation was stopped
  }, [onMarkersUpdate]);

  const clearNavigation = useCallback(() => {
    // Clear route from map
    if (mapRef.current) {
      const mapRefForRouting = { current: mapRef.current };
      routingRef.current.clearRoute(mapRefForRouting).catch(error => {
        logger.warn('Failed to clear route:', error);
      });
    }
    
    // Reset navigation state
    setNavigation({
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
    
    // Remove navigation-related markers
    onMarkersUpdate?.(prev => prev.filter((m: MarkerConfig) => 
      m.id !== 'from-location' && 
      m.id !== 'to-location' && 
      m.id !== 'current-location' &&
      m.id !== 'navigation-start'
    ));
    
    logger.log('🗑️ Navigation cleared');
  }, [mapRef, onMarkersUpdate]);

  // Calculate routes when both locations are set
  useEffect(() => {
    if (navigation.fromCoordinate && navigation.toCoordinate && !navigation.isCalculating) {
      const fromKey = `${navigation.fromCoordinate.latitude},${navigation.fromCoordinate.longitude}`;
      const toKey = `${navigation.toCoordinate.latitude},${navigation.toCoordinate.longitude}`;
      const routeKey = `${fromKey}-${toKey}`;
      
      // Check if we already have routes for these exact coordinates
      const hasExistingRoutes = Object.keys(navigation.routes).length > 0 && 
        Object.values(navigation.routes).some(route => route !== null);
      
      if (!hasExistingRoutes) {
        logger.log('🔄 Starting route calculation for:', routeKey);
        const timer = setTimeout(() => {
          calculateAllRoutes(navigation.fromCoordinate!, navigation.toCoordinate!);
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        logger.log('✅ Routes already calculated for these coordinates, skipping...');
      }
    }
  }, [navigation.fromCoordinate?.latitude, navigation.fromCoordinate?.longitude, navigation.toCoordinate?.latitude, navigation.toCoordinate?.longitude, navigation.isCalculating, navigation.routes, calculateAllRoutes]);

  // Display current route on map
  useEffect(() => {
    if (navigation.currentRoute && mapRef.current) {
      const mode = TRANSPORT_MODES.find(m => m.id === navigation.selectedMode);
      const mapRefForRouting = { current: mapRef.current };
      
      // Use signature purple (#9C1AFF) during active navigation, otherwise use transport mode color
      const routeColor = navigation.navigationStarted ? '#9C1AFF' : (mode?.color || '#007AFF');
      
      routingRef.current.displayRoute(navigation.currentRoute, mapRefForRouting, {
        color: routeColor,
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
        logger.error('Failed to display route:', error);
      });
    }
  }, [navigation.currentRoute, navigation.selectedMode, navigation.navigationStarted, mapRef]);

  // Animate camera to start point when navigation starts (runs on UI thread via useEffect)
  useEffect(() => {
    if (navigation.navigationStarted && navigation.fromCoordinate && mapRef.current) {
      const startCoord = navigation.fromCoordinate;
      const toCoord = navigation.toCoordinate;
      const currentMapRef = mapRef.current;
      
      // Use InteractionManager to ensure UI thread execution
      InteractionManager.runAfterInteractions(() => {
        // Small delay to ensure UI is ready
        setTimeout(async () => {
          if (!currentMapRef) {
            logger.error('❌ Map ref not available for camera animation');
            return;
          }
          
          try {
            // Calculate bearing to destination (if available)
            let bearing = 0;
            if (toCoord) {
              const lat1 = startCoord.latitude * Math.PI / 180;
              const lat2 = toCoord.latitude * Math.PI / 180;
              const dLon = (toCoord.longitude - startCoord.longitude) * Math.PI / 180;
              
              const y = Math.sin(dLon) * Math.cos(lat2);
              const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
              bearing = Math.atan2(y, x) * 180 / Math.PI;
              bearing = (bearing + 360) % 360; // Normalize to 0-360
            }
            
            // Step 1: Animate to location first
            await currentMapRef.animateToLocation(
              startCoord.latitude,
              startCoord.longitude,
              19
            );
            
            // Wait for location animation to complete
            await new Promise(resolve => setTimeout(resolve, 600));
            
            // Step 2: Set pitch (30 degrees for navigation perspective)
            // SDK now handles thread safety, so we can call directly
            await currentMapRef.setPitch(30);
            
            // Small delay between operations
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Step 3: Set bearing to face destination
            await currentMapRef.setBearing(bearing);
            
            logger.log('🎥 Camera animated to navigation view:', {
              lat: startCoord.latitude,
              lng: startCoord.longitude,
              zoom: 19,
              pitch: 30,
              bearing: bearing,
            });
            
          } catch (error) {
            logger.error('❌ Failed to animate camera to navigation view:', error);
          }
        }, 100); // Small delay to ensure UI is ready
      });
    }
  }, [navigation.navigationStarted, navigation.fromCoordinate, navigation.toCoordinate, mapRef]);

  return {
    // State
    navigation,
    
    // Actions
    setNavigation,
    handleFromLocationSelected,
    handleToLocationSelected,
    selectTransportMode,
    startNavigation,
    stopNavigation,
    clearNavigation,
    calculateAllRoutes,
    
    // Refs
    routingRef,
  };
};

