import React, { useState, useCallback, useRef } from 'react';
import { OSMViewRef, Coordinate, LocationFix } from '../types';
import { calculateDistance } from '../utils/geofencing';
import { buildGpxTrack } from '../utils/gpx';

/**
 * Status of location tracking operations
 */
export type LocationTrackingStatus = 'idle' | 'starting' | 'active' | 'stopping' | 'error' | 'permission_required' | 'gps_disabled';

/**
 * Detailed error types for better handling
 */
export type LocationErrorType = 
  | 'permission_denied' 
  | 'permission_restricted' 
  | 'gps_disabled' 
  | 'no_signal' 
  | 'timeout' 
  | 'view_not_ready' 
  | 'unknown';

/**
 * Enhanced error information
 */
export interface LocationError {
  type: LocationErrorType;
  message: string;
  userMessage: string;
  canRetry: boolean;
  suggestedAction: string;
}

/**
 * Location tracking hook result
 */
export interface UseLocationTrackingResult {
  // Current status
  isTracking: boolean;
  status: LocationTrackingStatus;
  currentLocation: Coordinate | null;
  error: LocationError | null;
  
  // Actions
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<boolean>;
  getCurrentLocation: () => Promise<Coordinate | null>;
  waitForLocation: (timeoutSeconds?: number) => Promise<Coordinate | null>;
  retryLastOperation: () => Promise<boolean>;
  
  // Utility
  clearError: () => void;
  getHealthStatus: () => Promise<LocationHealthStatus>;

  // Track recording (only accumulates while `recordTrack` option is true
  // and tracking is active — see `ingestLocationFix`)
  /** Buffered GPS fixes recorded since the last `clearTrack()` call. */
  trackPoints: ReadonlyArray<LocationFix>;
  /** Empties the recorded track buffer. */
  clearTrack: () => void;
  /**
   * Feed a GPS fix into the track buffer. Wire this to `OSMView`'s
   * `onUserLocationChange` so every fix the map reports is considered for
   * recording:
   *
   * ```tsx
   * const tracking = useLocationTracking(mapRef, { recordTrack: true });
   * <OSMView onUserLocationChange={tracking.ingestLocationFix} ... />
   * ```
   *
   * No-ops when `recordTrack` is false or tracking is not active.
   */
  ingestLocationFix: (fix: LocationFix) => void;
  /**
   * Serializes the recorded track as a GPX 1.1 XML string (lat, lon,
   * altitude, timestamp, accuracy, bearing, speed). Returns `null` when
   * fewer than 2 points have been recorded.
   */
  exportTrackAsGpx: (options?: { trackName?: string }) => string | null;
}

/**
 * System health status
 */
export interface LocationHealthStatus {
  isSupported: boolean;
  hasPermission: boolean;
  isGpsEnabled: boolean;
  isViewReady: boolean;
  lastLocationAge: number | null;
  networkAvailable: boolean;
}

/**
 * Hook options
 */
export interface UseLocationTrackingOptions {
  // Automatically start tracking when component mounts
  autoStart?: boolean;
  // Callback when location changes
  onLocationChange?: (location: LocationFix) => void;
  // Callback when location error occurs
  onError?: (error: LocationError) => void;
  // Maximum time to wait for view to be ready (ms)
  maxWaitTime?: number;
  // Retry attempts for failed operations
  maxRetryAttempts?: number;
  // Custom fallback coordinate when all else fails
  fallbackLocation?: Coordinate;
  /** Accumulate GPS fixes (via `ingestLocationFix`) while tracking is active. Default false. */
  recordTrack?: boolean;
  /** Max buffered track points before the oldest are dropped. Default 10000. */
  maxTrackPoints?: number;
  /** Minimum distance (metres) a fix must be from the last recorded point to be kept — reduces GPS noise. Default 0 (record every fix). */
  minTrackDistanceMeters?: number;
}

/**
 * Enhanced location tracking hook with bulletproof error handling
 * 
 * This hook provides comprehensive error handling for all GPS and permission scenarios:
 * - Permission denied/revoked scenarios
 * - GPS disabled/unavailable
 * - No signal (indoor/underground)
 * - Timeout situations
 * - View lifecycle issues
 * - Network problems
 * - Hardware failures
 * 
 * @param osmViewRef - Reference to the OSM view component
 * @param options - Hook configuration options
 * @returns Location tracking state and methods with comprehensive error handling
 * 
 * @example
 * ```tsx
 * function MyMapComponent() {
 *   const mapRef = useRef<OSMViewRef>(null);
 *   const {
 *     isTracking,
 *     currentLocation,
 *     error,
 *     startTracking,
 *     stopTracking,
 *     getCurrentLocation,
 *     retryLastOperation,
 *     getHealthStatus
 *   } = useLocationTracking(mapRef, {
 *     maxRetryAttempts: 3,
 *     fallbackLocation: { latitude: 0, longitude: 0 },
 *     onError: (error) => {
 *       console.error('Location error:', error.userMessage);
 *       // Show user-friendly error message
 *       if (error.canRetry) {
 *         // Show retry button
 *       }
 *     }
 *   });
 * 
 *   return (
 *     <View>
 *       <OSMView ref={mapRef} />
 *       {error && (
 *         <View>
 *           <Text>{error.userMessage}</Text>
 *           <Text>{error.suggestedAction}</Text>
 *           {error.canRetry && (
 *             <Button title="Retry" onPress={retryLastOperation} />
 *           )}
 *         </View>
 *       )}
 *     </View>
 *   );
 * }
 * ```
 */
export const useLocationTracking = (
  osmViewRef: React.RefObject<OSMViewRef>,
  options: UseLocationTrackingOptions = {}
): UseLocationTrackingResult => {
  const {
    autoStart = false,
    onLocationChange,
    onError,
    maxWaitTime = 10000,
    maxRetryAttempts = 3,
    fallbackLocation,
    recordTrack = false,
    maxTrackPoints = 10000,
    minTrackDistanceMeters = 0
  } = options;

  // State
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [status, setStatus] = useState<LocationTrackingStatus>('idle');
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [trackPoints, setTrackPoints] = useState<LocationFix[]>([]);
  
  // Internal state for retry logic
  const lastOperation = useRef<string | null>(null);
  const retryAttempts = useRef<number>(0);
  const hasAutoStarted = useRef<boolean>(false);
  // Mirrors `isTracking` for use inside the stable `ingestLocationFix`
  // callback without adding `isTracking` (and thus a new closure) to its
  // dependency array on every start/stop. Also used by the unmount-cleanup
  // effect below so it can keep an empty dependency array.
  const isTrackingRef = useRef<boolean>(false);
  isTrackingRef.current = isTracking;
  // Last recorded track point, for `minTrackDistanceMeters` filtering.
  const lastTrackPointRef = useRef<LocationFix | null>(null);
  // Always-current `stopTracking`, referenced by the unmount-cleanup effect
  // (assigned right before that effect, once `stopTracking` is defined).
  const stopTrackingRef = useRef<() => Promise<boolean>>(async () => false);

  // Create enhanced error object
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

  // Enhanced error handling wrapper
  const safeCall = useCallback(async <T>(
    operation: string,
    method: () => Promise<T>,
    canRetry: boolean = true
  ): Promise<T | null> => {
    try {
      if (!osmViewRef.current) {
        throw new Error('OSM view reference not available');
      }

      lastOperation.current = operation;
      
      const result = await method();
      
      // Reset retry attempts on success
      retryAttempts.current = 0;
      setError(null);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `${operation} failed`;
      
      // Determine error type from error message
      let errorType: LocationErrorType = 'unknown';
      
      if (errorMessage.includes('permission') && errorMessage.includes('denied')) {
        errorType = 'permission_denied';
      } else if (errorMessage.includes('permission') && errorMessage.includes('restricted')) {
        errorType = 'permission_restricted';
      } else if (errorMessage.includes('GPS') || errorMessage.includes('location services')) {
        errorType = 'gps_disabled';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        errorType = 'timeout';
      } else if (errorMessage.includes('view') || errorMessage.includes('View')) {
        errorType = 'view_not_ready';
      } else if (errorMessage.includes('signal') || errorMessage.includes('No recent location')) {
        errorType = 'no_signal';
      }
      
      const locationError = createLocationError(errorType, errorMessage, canRetry);
      setError(locationError);
      setStatus('error');
      onError?.(locationError);
      
      return null;
    }
  }, [osmViewRef, onError, createLocationError]);

  // System health check
  const getHealthStatus = useCallback(async (): Promise<LocationHealthStatus> => {
    const health: LocationHealthStatus = {
      isSupported: true, // Assume supported
      hasPermission: false,
      isGpsEnabled: false,
      isViewReady: false,
      lastLocationAge: null,
      networkAvailable: true // Assume available
    };

    try {
      // Check view readiness
      if (osmViewRef.current?.isViewReady) {
        health.isViewReady = await osmViewRef.current.isViewReady();
      }

      // Check last location age
      if (currentLocation) {
        // Estimate age (we don't have timestamp, so approximate)
        health.lastLocationAge = 0; // Would need timestamp from location data
      }

      // Note: GPS and permission checks would need platform-specific APIs
      // This is a basic implementation
      
    } catch {
      // Health check failed — non-critical, return defaults
    }

    return health;
  }, [osmViewRef, currentLocation]);

  // Requests the runtime location permission before any GPS operation.
  // Resolves `true` when it's safe to proceed, or reports a permission_denied
  // error and resolves `false` otherwise. Missing the ref method entirely
  // (e.g. an older native build) is treated as "proceed" so the underlying
  // call can still surface its own, more specific error.
  const ensurePermission = useCallback(async (): Promise<boolean> => {
    const request = osmViewRef.current?.requestLocationPermission;
    if (!request) {
      return true;
    }
    try {
      const granted = await request();
      if (!granted) {
        const locationError = createLocationError(
          'permission_denied',
          'Location permission was not granted',
          true
        );
        setError(locationError);
        setStatus('permission_required');
        onError?.(locationError);
      }
      return granted;
    } catch {
      // Native module unavailable or similar — let the underlying call
      // surface the real error instead of masking it here.
      return true;
    }
  }, [osmViewRef, onError, createLocationError]);

  // Start location tracking with comprehensive error handling
  const startTracking = useCallback(async (): Promise<boolean> => {
    if (isTracking || status === 'starting') {
      return true; // Already tracking or starting
    }

    setStatus('starting');
    setError(null);

    if (!(await ensurePermission())) {
      return false;
    }

    const success = await safeCall('startLocationTracking', async () => {
      await osmViewRef.current?.startLocationTracking();
      return true;
    });

    if (success) {
      setIsTracking(true);
      setStatus('active');
      return true;
    } else {
      setStatus('error');
      setIsTracking(false);
      return false;
    }
  }, [isTracking, status, safeCall, osmViewRef, ensurePermission]);

  // Stop location tracking with error handling
  const stopTracking = useCallback(async (): Promise<boolean> => {
    if (!isTracking || status === 'stopping') {
      return true; // Already stopped or stopping
    }

    setStatus('stopping');
    setError(null);

    const success = await safeCall('stopLocationTracking', async () => {
      await osmViewRef.current?.stopLocationTracking();
      return true;
    }, false); // Don't retry stop operations

    setIsTracking(false);
    setStatus(success ? 'idle' : 'error');
    
    if (success) {
      return true;
    } else {
      return false;
    }
  }, [isTracking, status, safeCall, osmViewRef]);

  // Get current location with fallback mechanisms
  const getCurrentLocationSafe = useCallback(async (): Promise<Coordinate | null> => {
    if (!(await ensurePermission())) {
      return fallbackLocation ?? currentLocation ?? null;
    }

    const result = await safeCall('getCurrentLocation', async () => {
      return await osmViewRef.current?.getCurrentLocation() ?? null;
    });

    if (result) {
      setCurrentLocation(result);
      onLocationChange?.(result);
      return result;
    }

    // Fallback: try to get any recent location
    if (currentLocation) {
      return currentLocation;
    }

    // Final fallback: use provided fallback location
    if (fallbackLocation) {
      setCurrentLocation(fallbackLocation);
      onLocationChange?.(fallbackLocation);
      return fallbackLocation;
    }

    return null;
  }, [safeCall, osmViewRef, onLocationChange, currentLocation, fallbackLocation, ensurePermission]);

  // Wait for fresh location with enhanced timeout handling
  const waitForLocation = useCallback(async (timeoutSeconds = 30): Promise<Coordinate | null> => {
    if (!(await ensurePermission())) {
      return await getCurrentLocationSafe();
    }

    const result = await safeCall('waitForLocation', async () => {
      return await osmViewRef.current?.waitForLocation(timeoutSeconds) ?? null;
    });

    if (result) {
      setCurrentLocation(result);
      onLocationChange?.(result);
      return result;
    }

    // If wait failed, try getCurrentLocation as fallback
    return await getCurrentLocationSafe();
  }, [safeCall, osmViewRef, onLocationChange, getCurrentLocationSafe, ensurePermission]);

  // Retry last failed operation
  const retryLastOperation = useCallback(async (): Promise<boolean> => {
    if (!lastOperation.current || retryAttempts.current >= maxRetryAttempts) {
      return false;
    }

    retryAttempts.current++;

    setError(null);

    switch (lastOperation.current) {
      case 'startLocationTracking':
        return await startTracking();
      case 'getCurrentLocation': {
        const location = await getCurrentLocationSafe();
        return location !== null;
      }
      case 'waitForLocation': {
        const waitResult = await waitForLocation();
        return waitResult !== null;
      }
      default:
        return false;
    }
  }, [lastOperation, retryAttempts, maxRetryAttempts, startTracking, getCurrentLocationSafe, waitForLocation]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  // Empties the recorded track buffer.
  const clearTrack = useCallback(() => {
    lastTrackPointRef.current = null;
    setTrackPoints([]);
  }, []);

  // Feeds a GPS fix into the track buffer — see the JSDoc on
  // UseLocationTrackingResult.ingestLocationFix for wiring instructions.
  const ingestLocationFix = useCallback((fix: LocationFix) => {
    if (!recordTrack || !isTrackingRef.current) {
      return;
    }

    const previous = lastTrackPointRef.current;
    if (previous && minTrackDistanceMeters > 0) {
      const distance = calculateDistance(previous, fix);
      if (distance < minTrackDistanceMeters) {
        return;
      }
    }

    lastTrackPointRef.current = fix;
    setTrackPoints((points) => {
      const next = [...points, fix];
      return next.length > maxTrackPoints
        ? next.slice(next.length - maxTrackPoints)
        : next;
    });
  }, [recordTrack, minTrackDistanceMeters, maxTrackPoints]);

  // Serializes the recorded track as GPX, or null if there's nothing
  // meaningful to export yet.
  const exportTrackAsGpx = useCallback((exportOptions?: { trackName?: string }): string | null => {
    if (trackPoints.length < 2) {
      return null;
    }
    return buildGpxTrack(trackPoints, exportOptions);
  }, [trackPoints]);

  // Auto-start with error handling
  React.useEffect(() => {
    if (autoStart && !hasAutoStarted.current && !isTracking && status === 'idle') {
      hasAutoStarted.current = true;
      startTracking().catch(() => {});
    }
  }, [autoStart, isTracking, status, startTracking]);

  // Cleanup on unmount. Reads the latest `isTracking`/`stopTracking` via refs
  // (updated every render) so the effect can keep an empty dependency array
  // and its cleanup genuinely only runs once, on unmount — not on every
  // isTracking/status transition, which would call stopTracking() mid-session.
  stopTrackingRef.current = stopTracking;
  React.useEffect(() => {
    return () => {
      if (isTrackingRef.current) {
        stopTrackingRef.current().catch(() => {});
      }
    };
  }, []);

  return {
    // State
    isTracking,
    status,
    currentLocation,
    error,
    
    // Actions
    startTracking,
    stopTracking,
    getCurrentLocation: getCurrentLocationSafe,
    waitForLocation,
    retryLastOperation,
    
    // Utility
    clearError,
    getHealthStatus,

    // Track recording
    trackPoints,
    clearTrack,
    ingestLocationFix,
    exportTrackAsGpx,
  };
}; 