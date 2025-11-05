import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
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
          setShowUserLocation(false);
          setTrackingStatus('idle');
          logger.log('📍 Stopped location tracking');
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
          setShowUserLocation(true);
          setTrackingStatus('active');
          logger.log('📍 Started location tracking (or was already running from GPS warm-up)');
        }
      }
    } catch (error) {
      logger.error('❌ Toggle tracking failed:', error);
      setTrackingStatus('error');
    }
  }, [isTracking, safeLocationCall, mapRef]);

  // LocationButton handler - uses waitForLocation to get a fresh GPS fix
  const getLocationForButton = useCallback(async (): Promise<{ latitude: number; longitude: number }> => {
    try {
      // Ensure location tracking is started first
      if (!isTracking && mapRef.current) {
        logger.log('📍 Starting location tracking before getting location...');
        try {
          await mapRef.current.startLocationTracking();
        } catch (error) {
          logger.warn('⚠️ Could not start tracking (may already be active):', error);
        }
      }
      
      // Wait up to 60 seconds for GPS fix (longer for cold starts)
      const loc = await mapRef.current?.waitForLocation(60);
      if (loc) {
        return { latitude: loc.latitude, longitude: loc.longitude };
      }
      throw new Error('Unable to get location - timeout. Please ensure GPS is enabled and you have clear sky view.');
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      // Provide more helpful error messages
      if (errorMessage.includes('permission')) {
        throw new Error('Location permission denied. Please enable location access in app settings.');
      } else if (errorMessage.includes('GPS') || errorMessage.includes('disabled')) {
        throw new Error('Location services are disabled. Please enable GPS in device settings.');
      } else if (errorMessage.includes('timeout')) {
        throw new Error('GPS signal not found. Please move to an area with clear sky view and try again.');
      }
      throw error;
    }
  }, [isTracking, mapRef]);

  const handleLocationButtonFound = useCallback(async (location: { latitude: number; longitude: number }) => {
    logger.log('✅ LocationButton: Location found:', location);
    setCurrentLocation(location);
    onLocationChange?.(location);
    
    // Animate map to user's location with zoom level 19 (same as auto-show)
    await mapRef.current?.animateToLocation(location.latitude, location.longitude, 19);
    
    // Show user location if not already visible
    if (!showUserLocation) {
      setShowUserLocation(true);
    }
  }, [showUserLocation, mapRef, onLocationChange]);

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
    
    // If permission was granted on app start, auto-show user location
    if (shouldAutoShowLocation && mapRef.current) {
      logger.log('📍 Auto-showing user location on map ready...');
      
      try {
        // Show user location dot FIRST - this ensures it appears immediately
        setShowUserLocation(true);
        
        // Start location tracking in background for GPS warm-up
        // This keeps GPS running and ready, but UI state shows tracking as "off"
        // until user explicitly clicks "Start Tracking" button
        logger.log('📍 Starting location tracking in background for GPS warm-up...');
        await safeLocationCall('startLocationTracking', async () => {
          await mapRef.current!.startLocationTracking();
          // Note: We DON'T set isTracking = true here - UI still shows it as off
          // This allows GPS to warm up in background while user sees tracking as disabled
          return true;
        });
        
        // Wait for location with timeout (GPS warm-up happens during this)
        const location = await safeLocationCall('waitForLocation', async () => {
          const loc = await mapRef.current!.waitForLocation(60);
          return loc;
        });
        
        // IMPORTANT: Keep tracking running in background for GPS warm-up
        // Don't stop it - this ensures GPS stays warm and ready
        // When user clicks "Start Tracking", tracking is already active, so it's instant
        
        if (location) {
          logger.log('✅ Auto-location obtained:', location);
          
          // Set current location
          setCurrentLocation(location);
          onLocationChange?.(location);
          
          // Show user location dot
          setShowUserLocation(true);
          
          // Zoom to level 19 and center on user location
          await mapRef.current.animateToLocation(location.latitude, location.longitude, 19);
          
          logger.log('✅ Auto-location displayed: zoom 19, user dot visible');
          logger.log('📍 GPS warm-up: Tracking running in background (UI shows as off until user clicks "Start Tracking")');
        } else {
          logger.log('⚠️ Could not get location automatically - user can tap LocationButton or Start Tracking');
          // Keep showUserLocation true even if we didn't get location yet
          setShowUserLocation(true);
          // GPS tracking is still running in background for warm-up
        }
      } catch (error) {
        logger.log('⚠️ Could not auto-show location (non-critical):', error);
        // Still show the location dot even if there was an error
        setShowUserLocation(true);
        // Try to keep tracking running for GPS warm-up even if there was an error
      }
    } else {
      logger.log('📍 Location permission not granted - user can enable manually');
    }
  }, [shouldAutoShowLocation, safeLocationCall, mapRef, onLocationChange]);

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

