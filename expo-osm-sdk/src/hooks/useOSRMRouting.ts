import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Coordinate, Route, OSMViewRef } from '../types';
import { 
  calculateRoute as calculateOSRMRoute, 
  OSRMProfile, 
  OSRMRouteOptions,
  formatDuration,
  formatDistance
} from '../utils/osrm';

/**
 * OSRM Routing Hook State
 */
export interface OSRMRoutingState {
  isCalculating: boolean;
  error: string | null;
  currentRoute: Route | null;
  routeDisplayed: boolean;
}

/**
 * OSRM Routing Hook Return Type
 */
export interface UseOSRMRoutingReturn {
  // State
  state: OSRMRoutingState;
  
  // Actions
  calculateRoute: (
    from: Coordinate,
    to: Coordinate,
    options?: OSRMRouteOptions
  ) => Promise<Route | null>;
  
  calculateAndDisplayRoute: (
    from: Coordinate,
    to: Coordinate,
    mapRef: React.RefObject<OSMViewRef>,
    options?: OSRMRouteOptions & { routeStyle?: RouteDisplayOptions }
  ) => Promise<Route | null>;
  
  displayRoute: (
    route: Route,
    mapRef: React.RefObject<OSMViewRef>,
    options?: RouteDisplayOptions
  ) => Promise<void>;
  
  clearRoute: (mapRef: React.RefObject<OSMViewRef>) => Promise<void>;
  
  fitRouteInView: (
    route: Route,
    mapRef: React.RefObject<OSMViewRef>,
    padding?: number
  ) => Promise<void>;
  
  // Utilities
  formatRouteDuration: (route: Route) => string;
  formatRouteDistance: (route: Route) => string;
  getRouteEstimate: (route: Route) => {
    duration: string;
    distance: string;
    estimatedTime: string;
  };
  
  // Reset
  reset: () => void;
}

/**
 * Route Display Options
 */
export interface RouteDisplayOptions {
  color?: string;
  width?: number;
  opacity?: number;
}

/**
 * OSRM Routing Hook
 * 
 * Provides comprehensive routing functionality with state management.
 * Handles route calculation via OSRM API, route display on native maps,
 * and error handling.
 * 
 * @example
 * ```tsx
 * const routing = useOSRMRouting();
 * const mapRef = useRef<OSMViewRef>(null);
 * 
 * const handleCalculateRoute = async () => {
 *   const route = await routing.calculateAndDisplayRoute(
 *     { latitude: 40.7128, longitude: -74.0060 }, // NYC
 *     { latitude: 34.0522, longitude: -118.2437 }, // LA
 *     mapRef,
 *     { profile: 'driving' }
 *   );
 *   
 *   if (route) {
 *     console.log('Route calculated:', routing.formatRouteDistance(route));
 *   }
 * };
 * ```
 */
export const useOSRMRouting = (): UseOSRMRoutingReturn => {
  const [state, setState] = useState<OSRMRoutingState>({
    isCalculating: false,
    error: null,
    currentRoute: null,
    routeDisplayed: false
  });

  // Internal state update helper
  const updateState = useCallback((updates: Partial<OSRMRoutingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Calculate route using OSRM API
   */
  const calculateRoute = useCallback(async (
    from: Coordinate,
    to: Coordinate,
    options: OSRMRouteOptions = {}
  ): Promise<Route | null> => {
    try {
      updateState({ isCalculating: true, error: null });
      
      const routes = await calculateOSRMRoute([from, to], options);
      if (routes.length === 0) {
        throw new Error('No route found');
      }
      
      const route = routes[0]!;
      updateState({ 
        currentRoute: route, 
        isCalculating: false 
      });
      
      return route;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Route calculation failed';
      updateState({ 
        error: errorMessage, 
        isCalculating: false,
        currentRoute: null 
      });
      return null;
    }
  }, [updateState]);

  /**
   * Display route on map (native and web)
   */
  const displayRoute = useCallback(async (
    route: Route,
    mapRef: React.RefObject<OSMViewRef>,
    options: RouteDisplayOptions = {}
  ): Promise<void> => {
    if (!mapRef.current) {
      throw new Error('Map reference not available');
    }

    try {
      const routeOptions = {
        color: options.color || '#007AFF',
        width: options.width || 5,
        opacity: options.opacity || 0.8
      };

      // Convert coordinates for display
      const routeCoordinates = route.coordinates.map(coord => ({
        latitude: coord.latitude,
        longitude: coord.longitude
      }));

      // Use platform-appropriate display method
      if ('displayRoute' in mapRef.current && typeof mapRef.current.displayRoute === 'function') {
        await (mapRef.current as any).displayRoute(routeCoordinates, routeOptions);
        console.log(`✅ Route displayed successfully on ${Platform.OS} with ${routeCoordinates.length} coordinates`);
      } else {
        console.warn(`⚠️ displayRoute method not available on ${Platform.OS} platform`);
      }

      updateState({ routeDisplayed: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Route display failed';
      console.error(`❌ Route display failed on ${Platform.OS}:`, errorMessage);
      updateState({ error: errorMessage });
      throw error;
    }
  }, [updateState]);

  /**
   * Calculate and display route in one step
   */
  const calculateAndDisplayRoute = useCallback(async (
    from: Coordinate,
    to: Coordinate,
    mapRef: React.RefObject<OSMViewRef>,
    options: OSRMRouteOptions & { routeStyle?: RouteDisplayOptions } = {}
  ): Promise<Route | null> => {
    try {
      // Extract route style options
      const { routeStyle, ...routeOptions } = options;
      
      // Calculate route
      const route = await calculateRoute(from, to, routeOptions);
      if (!route) {
        return null;
      }

      // Display route
      await displayRoute(route, mapRef, routeStyle);
      
      return route;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Route calculation and display failed';
      updateState({ error: errorMessage });
      return null;
    }
  }, [calculateRoute, displayRoute, updateState]);

  /**
   * Clear displayed route
   */
  const clearRoute = useCallback(async (
    mapRef: React.RefObject<OSMViewRef>
  ): Promise<void> => {
    if (!mapRef.current) {
      throw new Error('Map reference not available');
    }

    try {
      // Use clearRoute method if available (both native and web)
      if ('clearRoute' in mapRef.current && typeof mapRef.current.clearRoute === 'function') {
        await (mapRef.current as any).clearRoute();
        console.log(`✅ Route cleared successfully on ${Platform.OS}`);
      }

      updateState({ 
        routeDisplayed: false,
        currentRoute: null 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Route clear failed';
      console.error(`❌ Route clear failed on ${Platform.OS}:`, errorMessage);
      updateState({ error: errorMessage });
      throw error;
    }
  }, [updateState]);

  /**
   * Fit route in map view
   */
  const fitRouteInView = useCallback(async (
    route: Route,
    mapRef: React.RefObject<OSMViewRef>,
    padding: number = 50
  ): Promise<void> => {
    if (!mapRef.current) {
      throw new Error('Map reference not available');
    }

    try {
      // Convert coordinates for display
      const routeCoordinates = route.coordinates.map(coord => ({
        latitude: coord.latitude,
        longitude: coord.longitude
      }));

      // Use fitRouteInView method if available (both native and web)
      if ('fitRouteInView' in mapRef.current && typeof mapRef.current.fitRouteInView === 'function') {
        await (mapRef.current as any).fitRouteInView(routeCoordinates, padding);
        console.log(`✅ Route fitted in view successfully on ${Platform.OS}`);
      } else {
        console.warn(`⚠️ fitRouteInView method not available on ${Platform.OS} platform`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Route fitting failed';
      console.error(`❌ Route fitting failed on ${Platform.OS}:`, errorMessage);
      updateState({ error: errorMessage });
      throw error;
    }
  }, [updateState]);

  /**
   * Format route duration in human-readable format
   */
  const formatRouteDuration = useCallback((route: Route): string => {
    return formatDuration(route.duration);
  }, []);

  /**
   * Format route distance in human-readable format
   */
  const formatRouteDistance = useCallback((route: Route): string => {
    return formatDistance(route.distance);
  }, []);

  /**
   * Get comprehensive route estimate
   */
  const getRouteEstimate = useCallback((route: Route) => {
    const duration = formatDuration(route.duration);
    const distance = formatDistance(route.distance);
    
    // Calculate estimated arrival time
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + route.duration * 1000);
    const estimatedTime = arrivalTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return {
      duration,
      distance,
      estimatedTime
    };
  }, []);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setState({
      isCalculating: false,
      error: null,
      currentRoute: null,
      routeDisplayed: false
    });
  }, []);

  return {
    state,
    calculateRoute,
    calculateAndDisplayRoute,
    displayRoute,
    clearRoute,
    fitRouteInView,
    formatRouteDuration,
    formatRouteDistance,
    getRouteEstimate,
    reset
  };
}; 