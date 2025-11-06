import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, InteractionManager, Image } from 'react-native';
import { useOSRMRouting } from 'expo-osm-sdk';
import type { OSMViewRef, Coordinate, SearchLocation, MarkerConfig, Route, RouteStep } from 'expo-osm-sdk';
import type { NavigationState } from '../types';
import { TRANSPORT_MODES } from '../constants';
import { logger } from '../utils/logger';
import { calculateBearing, calculateDistance } from '../utils/formatters';

// Debounce utility for location updates
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface UseNavigationManagementProps {
  mapRef: React.RefObject<OSMViewRef | null>;
  onRouteCalculated?: (routes: { [key: string]: Route | null }) => void;
  onMarkersUpdate?: React.Dispatch<React.SetStateAction<MarkerConfig[]>>;
}

export const useNavigationManagement = ({ mapRef, onRouteCalculated, onMarkersUpdate }: UseNavigationManagementProps) => {
  const routing = useOSRMRouting();
  const routingRef = useRef(routing);
  const isMountedRef = useRef(true);
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());
  const fitRouteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigationCameraSetupRef = useRef(false); // Track if navigation camera setup is in progress

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clear all timeouts on unmount
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
      // Clear fit route timeout
      if (fitRouteTimeoutRef.current) {
        clearTimeout(fitRouteTimeoutRef.current);
        fitRouteTimeoutRef.current = null;
      }
    };
  }, []);

  // Update routing ref when routing changes
  useEffect(() => {
    routingRef.current = routing;
  }, [routing]);

  // Safe setTimeout wrapper that tracks and cleans up
  const safeSetTimeout = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const timeout = setTimeout(() => {
      timeoutRefs.current.delete(timeout);
      if (isMountedRef.current) {
        callback();
      }
    }, delay);
    timeoutRefs.current.add(timeout);
    return timeout;
  }, []);

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
    if (isMountedRef.current && onMarkersUpdate) {
      const fromMarker: MarkerConfig = {
        id: 'from-location',
        coordinate: location.coordinate,
        title: '🏁 Start',
        description: location.displayName,
      };
      
      onMarkersUpdate((prev) => {
        if (!isMountedRef.current) return prev;
        return [
          ...prev.filter((m: MarkerConfig) => m.id !== 'from-location'),
          fromMarker
        ];
      });
    }
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
    if (isMountedRef.current && onMarkersUpdate) {
      const toMarker: MarkerConfig = {
        id: 'to-location',
        coordinate: location.coordinate,
        title: '🏁 Destination',
        description: location.displayName,
      };
      
      onMarkersUpdate((prev) => {
        if (!isMountedRef.current) return prev;
        return [
          ...prev.filter((m: MarkerConfig) => m.id !== 'to-location'),
          toMarker
        ];
      });
    }
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
          // Performance optimization: Use simplified overview for low-end devices
          // This reduces route calculation complexity and memory usage
          const route = await routingRef.current.calculateRoute(
            fromCoord,
            toCoord,
            { profile: mode.profile, steps: true, overview: 'simplified' } // Use simplified overview for better performance
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
      // Cancel any pending fit route operations when navigation starts
      if (fitRouteTimeoutRef.current) {
        clearTimeout(fitRouteTimeoutRef.current);
        fitRouteTimeoutRef.current = null;
      }
      
      // Mark that navigation camera setup is starting
      navigationCameraSetupRef.current = true;
      
      setNavigation(prev => ({ ...prev, navigationStarted: true }));
      
      // Remove from-location marker when navigation starts (keep only destination marker)
      // Keep the to-location (destination) marker, remove from-location marker
      if (isMountedRef.current && onMarkersUpdate) {
        onMarkersUpdate((prev) => {
          if (!isMountedRef.current) return prev;
          return prev.filter((m: MarkerConfig) => 
            m.id !== 'from-location' && 
            m.id !== 'navigation-start'
          );
        });
      }
      
      logger.log('🚗 Navigation started for route:', navigation.currentRoute);
      
      return true; // Return true to indicate navigation was started
    }
    return false;
  }, [navigation.currentRoute, navigation.fromCoordinate, mapRef, onMarkersUpdate]);

  const stopNavigation = useCallback(() => {
    // Reset camera setup flag
    navigationCameraSetupRef.current = false;
    
    setNavigation(prev => {
      // Preserve the route by restoring it from routes object
      // This allows user to see "Start Navigation" button again without regenerating route
      const preservedRoute = prev.routes[prev.selectedMode] || prev.currentRoute;
      
      return { 
        ...prev, 
        navigationStarted: false,
        // Restore currentRoute from routes so user can start navigation again
        currentRoute: preservedRoute
      };
    });
    
    // Remove navigation markers (navigation arrow, but keep route markers)
    if (isMountedRef.current && onMarkersUpdate) {
      onMarkersUpdate((prev) => {
        if (!isMountedRef.current) return prev;
        return prev.filter((m: MarkerConfig) => 
          m.id !== 'navigation-start' && m.id !== 'navigation-arrow'
        );
      });
    }
    
    logger.log('⏹️ Navigation stopped - route preserved, ready to start again');
    return true; // Return true to indicate navigation was stopped
  }, [onMarkersUpdate]);

  /**
   * Update navigation arrow marker position and rotation based on current location
   * This should be called whenever user location updates during active navigation
   */
  const updateNavigationArrowInternal = useCallback((currentLocation: Coordinate) => {
    if (!isMountedRef.current) return;
    
    // Check navigation state - if navigation just started, the state might not have updated yet
    // So we check both the current state and if we have a currentRoute (which indicates navigation should be active)
    if (!navigation.navigationStarted && !navigation.currentRoute) {
      return;
    }
    
    if (!navigation.currentRoute) {
      return;
    }

    // Find the next step along the route to determine bearing
    let bearing = 0;
    let nextStep: RouteStep | null = null;

    if (navigation.currentRoute.steps && navigation.currentRoute.steps.length > 0) {
      // Performance: Sample steps for low-end devices (check every 3rd step)
      let closestStepIndex = 0;
      let minDistance = Infinity;
      const SAMPLE_RATE = 3;

      // First pass: sample steps
      for (let i = 0; i < navigation.currentRoute.steps.length; i += SAMPLE_RATE) {
        const step = navigation.currentRoute.steps[i];
        if (step.coordinate) {
          const distance = calculateDistance(currentLocation, step.coordinate);
          if (distance < minDistance) {
            minDistance = distance;
            closestStepIndex = i;
          }
        }
      }

      // Second pass: check nearby steps for accuracy
      const startCheck = Math.max(0, closestStepIndex - SAMPLE_RATE);
      const endCheck = Math.min(navigation.currentRoute.steps.length, closestStepIndex + SAMPLE_RATE);
      for (let i = startCheck; i < endCheck; i++) {
        const step = navigation.currentRoute.steps[i];
        if (step.coordinate) {
          const distance = calculateDistance(currentLocation, step.coordinate);
          if (distance < minDistance) {
            minDistance = distance;
            closestStepIndex = i;
          }
        }
      }

      // Get next step for bearing calculation
      nextStep = navigation.currentRoute.steps[Math.min(closestStepIndex + 1, navigation.currentRoute.steps.length - 1)];
      
      if (nextStep && nextStep.coordinate) {
        bearing = calculateBearing(currentLocation, nextStep.coordinate);
      } else if (navigation.toCoordinate) {
        // Fallback to destination if no next step
        bearing = calculateBearing(currentLocation, navigation.toCoordinate);
      }
    } else if (navigation.toCoordinate) {
      // If no steps, use direct bearing to destination
      bearing = calculateBearing(currentLocation, navigation.toCoordinate);
    }

    // Resolve asset URI for navigation arrow icon
    try {
      const navIconSource = Image.resolveAssetSource(require('../../assets/images/nav.png'));
      
      if (!navIconSource || !navIconSource.uri) {
        logger.error('❌ Navigation arrow: Failed to resolve icon URI');
        logger.error('❌ Navigation arrow: navIconSource:', navIconSource);
        return;
      }

      // Log URI for debugging (useful for release builds)
      logger.log('🧭 Navigation arrow icon URI resolved:', navIconSource.uri);
      
      // In release builds, URI format is different (file:///android_asset/... or asset://...)
      // Image.resolveAssetSource should handle this automatically
      
      // Create or update navigation arrow marker
      const navigationArrow: MarkerConfig = {
        id: 'navigation-arrow',
        coordinate: currentLocation,
        icon: {
          uri: navIconSource.uri,
          size: 52,
          anchor: { x: 0.5, y: 0.5 }, // Center anchor for rotation
        },
        rotation: bearing,
        zIndex: 1000, // High z-index to appear above other markers
        visible: true,
      };

      if (isMountedRef.current && onMarkersUpdate) {
        onMarkersUpdate((prev) => {
          if (!isMountedRef.current) return prev;
          const filtered = prev.filter((m: MarkerConfig) => m.id !== 'navigation-arrow');
          const updated = [...filtered, navigationArrow];
          return updated;
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        logger.error('❌ Navigation arrow: Error creating marker:', error);
      }
    }
  }, [navigation.navigationStarted, navigation.currentRoute, navigation.toCoordinate, onMarkersUpdate]);

  // Debounced arrow update ref - increased debounce for low-end devices
  const debouncedUpdateArrowRef = useRef<ReturnType<typeof debounce> | null>(null);
  
  // Initialize debounced function - increased from 200ms to 500ms for better performance
  useEffect(() => {
    const debouncedFn = debounce((location: Coordinate) => {
      if (!isMountedRef.current) return;
      updateNavigationArrowInternal(location);
    }, 500); // Increased from 200ms to 500ms for low-end devices
    debouncedUpdateArrowRef.current = debouncedFn;
    
    return () => {
      // Cleanup on unmount
      debouncedUpdateArrowRef.current = null;
    };
  }, [updateNavigationArrowInternal]);

  // Public method that uses debouncing
  const updateNavigationArrow = useCallback((currentLocation: Coordinate) => {
    if (!isMountedRef.current || !debouncedUpdateArrowRef.current) return;
    debouncedUpdateArrowRef.current(currentLocation);
  }, []);

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
    if (isMountedRef.current && onMarkersUpdate) {
      onMarkersUpdate((prev) => {
        if (!isMountedRef.current) return prev;
        return prev.filter((m: MarkerConfig) => 
          m.id !== 'from-location' && 
          m.id !== 'to-location' && 
          m.id !== 'current-location' &&
          m.id !== 'navigation-start' &&
          m.id !== 'navigation-arrow'
        );
      });
    }
    
    logger.log('🗑️ Navigation cleared');
  }, [mapRef, onMarkersUpdate]);

  // Manual route calculation - triggered by "Get Direction" button
  // Removed automatic route calculation - routes now only generate when button is clicked

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
        // Only fit route in view when NOT in navigation mode (i.e., when "Get Direction" is clicked)
        // When navigation starts, we'll switch to navigation view instead
        if (navigation.currentRoute && !navigation.navigationStarted && isMountedRef.current && mapRef.current) {
          // Clear any pending fit route operations
          if (fitRouteTimeoutRef.current) {
            clearTimeout(fitRouteTimeoutRef.current);
            fitRouteTimeoutRef.current = null;
          }
          
          const currentRoute = navigation.currentRoute;
          const currentMapRef = mapRef.current;
          
          // Fit route in view after a short delay to ensure route is displayed
          fitRouteTimeoutRef.current = setTimeout(() => {
            fitRouteTimeoutRef.current = null;
            // Double-check navigation hasn't started during the delay
            if (isMountedRef.current && currentMapRef && !navigation.navigationStarted && navigation.currentRoute === currentRoute) {
              routingRef.current.fitRouteInView(currentRoute, { current: currentMapRef }, 80).catch(error => {
                if (isMountedRef.current) {
                  logger.error('Failed to fit route in view:', error);
                }
              });
            }
          }, 500);
        }
      }).catch(error => {
        if (isMountedRef.current) {
          logger.error('Failed to display route:', error);
        }
      });
    }
  }, [navigation.currentRoute, navigation.selectedMode, navigation.navigationStarted, mapRef, safeSetTimeout]);

  // Animate camera to start point when navigation starts - using sequential calls for thread safety
  useEffect(() => {
    if (navigation.navigationStarted && navigation.fromCoordinate && mapRef.current && isMountedRef.current) {
      const startCoord = navigation.fromCoordinate;
      const toCoord = navigation.toCoordinate;
      const currentMapRef = mapRef.current;
      let isCancelled = false;
      
      logger.log('🎥 Starting navigation camera setup...');
      
      // Use InteractionManager to ensure UI thread execution
      InteractionManager.runAfterInteractions(() => {
        // Increased delay to ensure route is displayed and map is ready
        safeSetTimeout(async () => {
          if (!isMountedRef.current || !currentMapRef || isCancelled) {
            navigationCameraSetupRef.current = false;
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
            
            logger.log('🎥 Step 1: Animating to location...');
            // Step 1: Animate to location first (this is thread-safe)
            if (!isMountedRef.current || !currentMapRef || isCancelled) {
              navigationCameraSetupRef.current = false;
              return;
            }
            await currentMapRef.animateToLocation(
              startCoord.latitude,
              startCoord.longitude,
              19
            );
            logger.log('✅ Step 1: Location animation complete');
            
            // Small delay before pitch to ensure location animation is complete
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Step 2: Set pitch after location animation completes (on UI thread)
            logger.log('🎥 Step 2: Setting pitch to 30...');
            if (!isMountedRef.current || !currentMapRef || isCancelled) {
              navigationCameraSetupRef.current = false; // Reset flag on cancellation
              return;
            }
            await currentMapRef.setPitch(30);
            logger.log('✅ Step 2: Pitch set to 30');
            
            // Small delay before bearing to ensure pitch is applied
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Step 3: Set bearing after pitch is set (on UI thread)
            logger.log(`🎥 Step 3: Setting bearing to ${bearing.toFixed(1)}...`);
            if (!isMountedRef.current || !currentMapRef || isCancelled) {
              navigationCameraSetupRef.current = false; // Reset flag on cancellation
              return;
            }
            await currentMapRef.setBearing(bearing);
            
            if (isMountedRef.current) {
              // Mark camera setup as complete - now location updates can control camera
              navigationCameraSetupRef.current = false;
              
              logger.log('✅ Step 3: Bearing set - Camera setup complete!');
              logger.log('🎥 Camera animated to navigation view:', {
                lat: startCoord.latitude,
                lng: startCoord.longitude,
                zoom: 19,
                pitch: 30,
                bearing: bearing,
              });
            }

          } catch (error) {
            if (isMountedRef.current) {
              logger.error('❌ Failed to animate camera to navigation view:', error);
              navigationCameraSetupRef.current = false; // Reset flag on error
            }
          }
        }, 300); // Increased delay to ensure route is displayed and map is ready
      });

      return () => {
        isCancelled = true;
        // Reset camera setup flag if cancelled
        navigationCameraSetupRef.current = false;
      };
    }
  }, [navigation.navigationStarted, navigation.fromCoordinate, navigation.toCoordinate, mapRef, safeSetTimeout]);

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
    updateNavigationArrow,
    
    // Refs
    routingRef,
    navigationCameraSetupRef, // Export flag to check if camera setup is in progress
  };
};

