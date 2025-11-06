import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, InteractionManager, Platform } from 'react-native';
import * as Location from 'expo-location';
import type { OSMViewRef, Coordinate, LocationError, LocationHealthStatus } from 'expo-osm-sdk';
import { logger } from '../utils/logger';

interface UseLocationManagementProps {
  mapRef: React.RefObject<OSMViewRef | null>;
  onLocationChange?: (location: Coordinate) => void;
}

export const useLocationManagement = ({ mapRef, onLocationChange }: UseLocationManagementProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [followUserLocation, setFollowUserLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<string>('idle');
  const [locationError, setLocationError] = useState<LocationError | null>(null);
  const [healthStatus, setHealthStatus] = useState<LocationHealthStatus | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [lastOperation, setLastOperation] = useState<string | null>(null);
  const [shouldAutoShowLocation, setShouldAutoShowLocation] = useState(false);

  // Check if GPS services are available (not on web/backend)
  // This is a soft check - doesn't fail if permission might be granted soon
  const isGpsAvailable = useCallback(async (): Promise<boolean> => {
    try {
      // Check if we're on web platform (no GPS)
      if (Platform.OS === 'web') {
        logger.log('📍 GPS not available: Running on web platform');
        return false;
      }

      // Check if we're in a Node.js/backend environment
      if (typeof window === 'undefined') {
        logger.log('📍 GPS not available: Running in backend/server environment');
        return false;
      }

      // Check if native module is available (mapRef methods won't work without it)
      if (!mapRef.current) {
        logger.log('📍 GPS not available: Map ref not available');
        return false;
      }

      // Check if location services are enabled (don't fail if check fails)
      try {
        const isEnabled = await Location.hasServicesEnabledAsync();
        if (!isEnabled) {
          logger.log('📍 GPS not available: Location services are disabled');
          return false;
        }
      } catch (error) {
        logger.warn('📍 Could not check location services:', error);
        // Continue anyway - might work on some platforms
      }

      // Soft permission check - don't fail immediately, permission might be granted
      // We'll check permission more strictly when actually using GPS
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          logger.log('✅ GPS services are available (permission granted)');
          return true;
        } else if (status === 'undetermined') {
          // Permission not requested yet - allow GPS to be available
          // We'll request permission when needed
          logger.log('⚠️ GPS permission not yet requested - will request when needed');
          return true; // Allow GPS to be available, we'll request permission
        } else {
          logger.log('📍 GPS not available: Location permission denied');
          return false;
        }
      } catch (error) {
        logger.warn('📍 Could not check location permissions:', error);
        // Continue anyway - permission might be requested later
        return true; // Assume available if we can't check
      }
    } catch (error) {
      logger.warn('📍 Error checking GPS availability:', error);
      // Default to true if we can't determine (better to try than fail)
      return true;
    }
  }, [mapRef]);

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
      logger.error(`❌ ${operation} failed:`, error);
      
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
      logger.error('❌ Error checking permissions:', error);
      return false;
    }
  }, []);

  // Request location permission on app start
  const requestLocationPermissionOnStart = useCallback(async (): Promise<boolean> => {
    try {
      logger.log('📍 Requesting location permission on app start...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        logger.log('✅ Location permission granted');
        return true;
      } else {
        logger.log('❌ Location permission denied');
        return false;
      }
    } catch (error) {
      logger.error('❌ Error requesting permissions:', error);
      return false;
    }
  }, []);

  const toggleLocationTracking = useCallback(async () => {
    try {
      logger.log('🔄 Toggling location tracking...');
      
      if (isTracking) {
        setTrackingStatus('stopping');
        const success = await safeLocationCall('stopLocationTracking', async () => {
          await mapRef.current!.stopLocationTracking();
          return true;
        }, false);
        
        if (success) {
          setIsTracking(false);
          // DON'T hide user location dot when stopping tracking
          // The dot should always be visible when we have location data
          // Tracking state only controls whether we follow the user, not whether we show their location
          setTrackingStatus('idle');
          logger.log('📍 Stopped location tracking (user location dot remains visible)');
        }
      } else {
        setTrackingStatus('starting');
        // Check if tracking is already running (from GPS warm-up)
        // If so, just update UI state without starting again
        const success = await safeLocationCall('startLocationTracking', async () => {
          // Try to start - if already running from warm-up, this is fine
          try {
            await mapRef.current!.startLocationTracking();
          } catch (error: any) {
            // If already running, that's okay - GPS warm-up already started it
            if (error?.message?.includes('already') || error?.message?.includes('active')) {
              logger.log('📍 Tracking already active (from GPS warm-up) - just updating UI state');
              return true;
            }
            throw error;
          }
          return true;
        });
        
        if (success) {
          setIsTracking(true);
          // Always show user location dot when we have location data
          // The useEffect will handle this automatically, but we set it explicitly here too
          if (currentLocation) {
            setShowUserLocation(true);
          }
          setTrackingStatus('active');
          logger.log('📍 Started location tracking (or was already running from GPS warm-up)');
        }
      }
    } catch (error) {
      logger.error('❌ Toggle tracking failed:', error);
      setTrackingStatus('error');
    }
  }, [isTracking, safeLocationCall, mapRef]);

  // Track if location request is cancelled
  const locationRequestCancelledRef = useRef(false);
  
  // LocationButton handler - uses waitForLocation with shorter timeout to prevent ANR
  const getLocationForButton = useCallback(async (): Promise<{ latitude: number; longitude: number }> => {
    // Reset cancellation flag
    locationRequestCancelledRef.current = false;
    
    try {
      // Check if GPS services are available before attempting location request
      // But don't fail if permission check fails - we'll check permission when requesting
      const gpsAvailable = await isGpsAvailable();
      if (!gpsAvailable && Platform.OS !== 'web' && typeof window !== 'undefined') {
        // Only fail if it's a real platform issue, not just permission
        logger.warn('⚠️ GPS availability check failed, but will try anyway');
      }
      
      // Ensure we have permission before proceeding
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Request permission if not granted
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          throw new Error('Location permission denied. Please enable location access in app settings.');
        }
      }
      
      // Check if tracking is already running (from GPS warm-up)
      // If GPS warm-up happened, tracking should already be active
      // We don't check isTracking because warm-up doesn't set it to true
      if (mapRef.current) {
        logger.log('📍 LocationButton: Checking if GPS tracking is already active (from warm-up)...');
        try {
          // Try to start tracking - if already running from warm-up, this will fail gracefully
          await mapRef.current.startLocationTracking();
          logger.log('📍 LocationButton: Started location tracking (GPS warm-up may not have been active)');
        } catch (error: any) {
          // If already running, that's okay - GPS warm-up already started it
          if (error?.message?.includes('already') || error?.message?.includes('active')) {
            logger.log('✅ LocationButton: GPS tracking already active from warm-up - using existing tracking');
          } else {
            logger.warn('⚠️ LocationButton: Could not start tracking:', error);
          }
        }
      }
      
      // Reduced timeout to prevent ANR on real devices
      // Android has 5-second ANR limit, so we use 10 seconds max
      // For emulator, GPS can be slow, but we don't want to block the UI
      const TIMEOUT_SECONDS = 10; // Reduced from 60 to 10 seconds
      
      logger.log(`📍 LocationButton: Waiting for GPS location (timeout: ${TIMEOUT_SECONDS}s)...`);
      const startTime = Date.now();
      
      // Use InteractionManager to defer the call and avoid blocking UI
      // This prevents ANR (Application Not Responding) on Android
      const loc = await new Promise<{ latitude: number; longitude: number } | null>((resolve, reject) => {
        // Check cancellation before starting
        if (locationRequestCancelledRef.current) {
          reject(new Error('Location request was cancelled'));
          return;
        }
        
        // Defer the call to avoid blocking UI thread
        InteractionManager.runAfterInteractions(() => {
          // Use setTimeout to ensure the promise resolves correctly
          setTimeout(async () => {
            try {
              if (!mapRef.current || locationRequestCancelledRef.current) {
                reject(new Error('Location request was cancelled'));
                return;
              }
              
              const result = await mapRef.current.waitForLocation(TIMEOUT_SECONDS);
              if (locationRequestCancelledRef.current) {
                reject(new Error('Location request was cancelled'));
                return;
              }
              
              if (result) {
                resolve({ latitude: result.latitude, longitude: result.longitude });
              } else {
                reject(new Error('No location returned'));
              }
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
      });
      
      const waitTime = Date.now() - startTime;
      
      if (loc) {
        if (waitTime < 2000) {
          logger.log(`✅ LocationButton: GPS location obtained quickly (${waitTime}ms) - GPS warm-up is working!`);
        } else if (waitTime < 5000) {
          logger.log(`⚠️ LocationButton: GPS location obtained (${waitTime}ms) - acceptable delay`);
        } else {
          logger.warn(`⚠️ LocationButton: GPS location obtained slowly (${waitTime}ms) - GPS may not have been warmed up`);
        }
        return loc;
      }
      throw new Error('Unable to get location - timeout. Please ensure GPS is enabled and you have clear sky view.');
    } catch (error: any) {
      // Check if cancelled
      if (locationRequestCancelledRef.current) {
        throw new Error('Location request was cancelled');
      }
      
      const errorMessage = error?.message || 'Unknown error';
      // Provide more helpful error messages
      if (errorMessage.includes('permission')) {
        throw new Error('Location permission denied. Please enable location access in app settings.');
      } else if (errorMessage.includes('GPS') || errorMessage.includes('disabled')) {
        throw new Error('Location services are disabled. Please enable GPS in device settings.');
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        throw new Error('GPS signal not found. Please move to an area with clear sky view and try again.');
      } else if (errorMessage.includes('cancelled')) {
        throw new Error('Location request was cancelled');
      }
      throw error;
    }
  }, [mapRef, isGpsAvailable]);

  const handleLocationButtonFound = useCallback(async (location: { latitude: number; longitude: number }) => {
    logger.log('✅ LocationButton: Location found:', location);
    setCurrentLocation(location);
    
    // ALWAYS show user location when we have a valid location
    // This ensures the purple dot appears consistently
    setShowUserLocation(true);
    logger.log('📍 LocationButton: User location dot enabled');
    
    // Always animate to user's location with zoom level 18 for consistency
    if (mapRef.current) {
      try {
        await mapRef.current.animateToLocation(location.latitude, location.longitude, 18);
        logger.log('📍 LocationButton: Animated to location with zoom 18');
        
        // Call onLocationChange after animation completes to ensure zoom is set first
        onLocationChange?.(location);
      } catch (error) {
        logger.error('❌ LocationButton: Failed to animate to location:', error);
        // Still call onLocationChange even if animation fails
        onLocationChange?.(location);
      }
    } else {
      // Fallback if map ref not available
      onLocationChange?.(location);
    }
  }, [mapRef, onLocationChange]);

  const handleLocationButtonError = useCallback((error: string) => {
    logger.error('❌ LocationButton: Location error:', error);
    Alert.alert('Location Error', error);
  }, []);

  const retryLastOperation = useCallback(async () => {
    if (!lastOperation || retryAttempts >= 3) {
      logger.log('❌ Cannot retry: max attempts reached or no last operation');
      return;
    }

    setRetryAttempts(prev => prev + 1);
    logger.log(`🔄 Retrying ${lastOperation} (attempt ${retryAttempts + 1}/3)`);

    setLocationError(null);

    switch (lastOperation) {
      case 'startLocationTracking':
        await toggleLocationTracking();
        break;
      // Add other operations as needed
    }
  }, [lastOperation, retryAttempts, toggleLocationTracking]);

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
      logger.warn('Failed to get health status:', error);
    }
  }, [currentLocation, mapRef]);

  // Auto-show location on map ready
  const handleMapReady = useCallback(async (useVectorTiles: boolean) => {
    logger.log('🗺️ Map is ready');
    
    // Check if GPS services are available before attempting warm-up
    const gpsAvailable = await isGpsAvailable();
    if (!gpsAvailable) {
      logger.log('📍 Skipping GPS warm-up: GPS services not available (web/backend environment)');
      return;
    }
    
    // Check permission status again (more reliable than shouldAutoShowLocation flag)
    let hasPermission = false;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        hasPermission = true;
        setShouldAutoShowLocation(true);
        logger.log('✅ Permission granted - will auto-show location');
      } else if (status === 'undetermined') {
        // Request permission if not yet requested
        logger.log('📍 Permission not yet requested - requesting now...');
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus === 'granted') {
          hasPermission = true;
          setShouldAutoShowLocation(true);
          logger.log('✅ Permission granted after request - will auto-show location');
        } else {
          logger.log('📍 Permission not granted - user can enable manually');
        }
      } else {
        logger.log('📍 Location permission denied - user can enable manually');
      }
    } catch (error) {
      logger.warn('📍 Error checking/requesting permission:', error);
    }
    
    // Auto-show user location if we have permission
    if (hasPermission && mapRef.current) {
      logger.log('📍 Auto-showing user location on map ready...');
      
      try {
        // Show user location dot FIRST - this ensures it appears immediately
        setShowUserLocation(true);
        
        // Start location tracking in background for GPS warm-up
        // This keeps GPS running and ready, but UI state shows tracking as "off"
        // until user explicitly clicks "Start Tracking" button
        logger.log('📍 Starting location tracking in background for GPS warm-up...');
        const warmUpStartTime = Date.now();
        
        // Use InteractionManager to avoid blocking UI
        InteractionManager.runAfterInteractions(async () => {
          try {
            const warmUpSuccess = await safeLocationCall('startLocationTracking', async () => {
              await mapRef.current!.startLocationTracking();
              // Note: We DON'T set isTracking = true here - UI still shows it as off
              // This allows GPS to warm up in background while user sees tracking as disabled
              return true;
            });
            
            if (warmUpSuccess) {
              logger.log('✅ GPS warm-up: Location tracking started in background');
              
              // IMPORTANT: Set tracking state to active so location icon stays visible
              // This ensures the location dot appears and stays on the map
              setIsTracking(true);
              
              // Wait for location with shorter timeout to prevent ANR
              logger.log('📍 GPS warm-up: Waiting for first location fix (timeout: 15s to prevent ANR)...');
              const location = await safeLocationCall('waitForLocation', async () => {
                const loc = await mapRef.current!.waitForLocation(15);
                return loc;
              });
              
              const warmUpDuration = Date.now() - warmUpStartTime;
              
              if (location) {
                logger.log('✅ Auto-location obtained:', location);
                
                // Set current location
                setCurrentLocation(location);
                onLocationChange?.(location);
                
                // ALWAYS ensure user location dot is visible when we have location
                // This ensures the purple dot appears consistently
                setShowUserLocation(true);
                setIsTracking(true); // Keep tracking active
                
                // Zoom to level 16 and center on user location (reduced for performance)
                if (mapRef.current) {
                  await mapRef.current.animateToLocation(location.latitude, location.longitude, 16);
                }
                
                logger.log(`✅ GPS warm-up: Complete! Location displayed (took ${warmUpDuration}ms)`);
                logger.log('✅ Auto-location displayed: zoom 16, user dot visible, tracking active');
                logger.log('📍 User location dot enabled - purple dot should be visible');
              } else {
                logger.log('⚠️ Could not get location automatically - user can tap LocationButton');
                // Keep showUserLocation true and tracking active even if we didn't get location yet
                // This ensures the dot appears as soon as location is available
                setShowUserLocation(true);
                setIsTracking(true);
                logger.log('📍 User location dot enabled (waiting for location)');
              }
            } else {
              logger.warn('⚠️ GPS warm-up: Failed to start location tracking in background');
              // Still show location dot - it might work anyway
              setShowUserLocation(true);
            }
          } catch (error) {
            logger.log('⚠️ Could not auto-show location (non-critical):', error);
            // Still show the location dot even if there was an error
            setShowUserLocation(true);
          }
        });
      } catch (error) {
        logger.log('⚠️ Error in GPS warm-up setup:', error);
        // Still show location dot - user can tap location button
        setShowUserLocation(true);
      }
    } else {
      logger.log('📍 Location permission not granted - user can enable manually');
    }
  }, [safeLocationCall, mapRef, onLocationChange, isGpsAvailable]);

  // ALWAYS show user location dot when we have location data
  // This ensures the purple dot is visible regardless of tracking state
  // In real-world scenarios, users always want to see their location on the map
  // Tracking state only controls whether we follow the user, not whether we show their location
  useEffect(() => {
    if (currentLocation && !showUserLocation) {
      logger.log('📍 Auto-enabling user location dot - location available');
      setShowUserLocation(true);
    }
  }, [currentLocation, showUserLocation]);

  // Request location permission on app start (only once)
  useEffect(() => {
    let hasRequested = false;
    
    const requestPermission = async () => {
      if (hasRequested) {
        return; // Skip if already requested
      }
      hasRequested = true;
      
      const hasPermission = await requestLocationPermissionOnStart();
      if (hasPermission) {
        setShouldAutoShowLocation(true);
        logger.log('✅ Permission granted - will auto-show location when map is ready');
      } else {
        logger.log('ℹ️ Permission not granted - user can enable manually');
      }
    };
    
    requestPermission();
    updateHealthStatus();
    
    const interval = setInterval(updateHealthStatus, 10000);
    return () => {
      clearInterval(interval);
      hasRequested = false;
      // Cancel any pending location requests on unmount
      locationRequestCancelledRef.current = true;
    };
  }, []); // Empty dependency array - only run once on mount

  return {
    // State
    isTracking,
    showUserLocation,
    followUserLocation,
    currentLocation,
    trackingStatus,
    locationError,
    healthStatus,
    retryAttempts,
    shouldAutoShowLocation,
    
    // Actions
    setShowUserLocation,
    setFollowUserLocation,
    setCurrentLocation,
    setIsTracking,
    toggleLocationTracking,
    getLocationForButton,
    handleLocationButtonFound,
    handleLocationButtonError,
    checkLocationPermissions,
    requestLocationPermissionOnStart,
    safeLocationCall,
    retryLastOperation,
    clearError,
    updateHealthStatus,
    setShouldAutoShowLocation,
    handleMapReady,
  };
};

