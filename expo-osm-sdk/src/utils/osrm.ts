import { Coordinate, Route, RouteStep } from '../types';

/**
 * OSRM (Open Source Routing Machine) Service
 * 
 * Provides routing and navigation using OpenStreetMap data via OSRM API.
 * Free service with reasonable usage limits for development and small apps.
 * For production use, consider hosting your own OSRM instance.
 */

// Default OSRM demo server
const OSRM_BASE_URL = 'https://router.project-osrm.org';

// Rate limiting for demo server
const REQUEST_DELAY = 300; // 300ms between requests (safer rate limit)
let lastRequestTime = 0;

/**
 * OSRM Profile types for different routing modes
 * Note: 'transit' is not a native OSRM profile but is handled separately
 */
export type OSRMProfile = 'driving' | 'walking' | 'cycling' | 'transit';

/**
 * Native OSRM profiles (excluding transit)
 */
export type NativeOSRMProfile = 'driving' | 'walking' | 'cycling';

/**
 * OSRM Route options
 */
export interface OSRMRouteOptions {
  profile?: OSRMProfile;
  alternatives?: boolean;
  steps?: boolean;
  geometries?: 'polyline' | 'polyline6' | 'geojson';
  overview?: 'full' | 'simplified' | 'false';
  continue_straight?: boolean;
}

/**
 * OSRM API Response interfaces
 */
interface OSRMResponse {
  code: string;
  message?: string;
  routes?: OSRMRoute[];
  waypoints?: OSRMWaypoint[];
}

interface OSRMRoute {
  geometry: string;
  legs: OSRMLeg[];
  distance: number;
  duration: number;
  weight_name: string;
  weight: number;
}

interface OSRMLeg {
  steps?: OSRMStep[];
  summary: string;
  weight: number;
  duration: number;
  distance: number;
}

interface OSRMStep {
  geometry: string;
  maneuver: OSRMManeuver;
  mode: string;
  driving_side: string;
  name: string;
  intersections: any[];
  weight: number;
  duration: number;
  distance: number;
}

interface OSRMManeuver {
  bearing_after: number;
  bearing_before: number;
  location: [number, number];
  modifier?: string;
  type: string;
  instruction?: string;
}

interface OSRMWaypoint {
  hint: string;
  distance: number;
  name: string;
  location: [number, number];
}

/**
 * Rate-limited fetch for OSRM demo server
 */
const rateLimitedFetch = async (url: string): Promise<Response> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_DELAY) {
    const delay = REQUEST_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'expo-osm-sdk/1.0 (https://github.com/mapdevsaikat/expo-osm-sdk)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`OSRM request failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
};

/**
 * Handle transit routing by falling back to walking + public transport estimation
 */
const calculateTransitRoute = async (
  waypoints: Coordinate[],
  options: OSRMRouteOptions = {}
): Promise<Route[]> => {
  // For transit, we fallback to walking route with adjusted timing
  // In a real implementation, you would integrate with public transit APIs
  console.log('🚌 Transit mode: Using walking route with public transport estimation');
  
  const walkingRoutes = await calculateNativeOSRMRoute(waypoints, {
    ...options,
    profile: 'walking'
  });
  
  if (walkingRoutes.length === 0) {
    throw new Error('No transit route found');
  }
  
  // Adjust timing to simulate public transport
  const baseRoute = walkingRoutes[0];
  if (!baseRoute) {
    throw new Error('No base route found for transit calculation');
  }
  
  const transitRoute: Route = {
    coordinates: baseRoute.coordinates,
    distance: baseRoute.distance,
    duration: Math.max(baseRoute.duration * 0.6, baseRoute.duration - 300), // Faster than walking
    steps: baseRoute.steps.map(step => ({
      ...step,
      instruction: step.instruction.replace(/walk/gi, 'Take public transport').replace(/continue/gi, 'Continue on transit')
    }))
  };
  
  return [transitRoute];
};

/**
 * Calculate route using native OSRM profiles
 */
const calculateNativeOSRMRoute = async (
  waypoints: Coordinate[],
  options: OSRMRouteOptions = {}
): Promise<Route[]> => {
  if (waypoints.length < 2) {
    throw new Error('At least 2 waypoints are required for routing');
  }

  // Validate coordinates
  waypoints.forEach((coord, index) => {
    console.log(`🔍 Validating waypoint ${index}:`, coord);
    if (!isValidCoordinate(coord)) {
      console.error(`❌ Invalid coordinate at waypoint ${index}:`, coord);
      throw new Error(`Invalid coordinate at waypoint ${index}: ${JSON.stringify(coord)}`);
    }
  });

  const {
    profile = 'driving',
    alternatives = false,
    steps = true,
    geometries = 'polyline',
    overview = 'full',
    continue_straight = false
  } = options;

  // Ensure we have a native OSRM profile
  const nativeProfile = profile as NativeOSRMProfile;

  // Build coordinate string (longitude,latitude format for OSRM)
  const coordsString = waypoints
    .map(coord => `${coord.longitude},${coord.latitude}`)
    .join(';');

  const params = new URLSearchParams({
    alternatives: alternatives.toString(),
    steps: steps.toString(),
    geometries,
    overview,
    continue_straight: continue_straight.toString()
  });

  try {
    const url = `${OSRM_BASE_URL}/route/v1/${nativeProfile}/${coordsString}?${params.toString()}`;
    console.log('🚗 OSRM route request:', nativeProfile, waypoints.length, 'waypoints');
    console.log('📍 OSRM coordinates:', coordsString);
    console.log('🔗 OSRM URL:', url);
    
    const response = await rateLimitedFetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OSRM HTTP Error:', response.status, response.statusText);
      console.error('❌ OSRM Error Response:', errorText);
      throw new Error(`OSRM request failed: ${response.status} ${response.statusText}`);
    }
    
    const data: OSRMResponse = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error(`OSRM error: ${data.message || data.code}`);
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    console.log('📍 Found', data.routes.length, 'route(s) for profile:', nativeProfile);
    
    // Convert OSRM routes to our Route interface
    return data.routes.map(osrmRoute => convertOSRMRoute(osrmRoute, geometries));
  } catch (error) {
    console.error('❌ OSRM routing failed:', error);
    throw new Error(`Routing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Calculate route between multiple waypoints
 * 
 * @param waypoints - Array of coordinates (minimum 2 points)
 * @param options - Routing options
 * @returns Promise<Route[]>
 */
export const calculateRoute = async (
  waypoints: Coordinate[],
  options: OSRMRouteOptions = {}
): Promise<Route[]> => {
  const { profile = 'driving' } = options;
  
  // Handle transit mode separately
  if (profile === 'transit') {
    return calculateTransitRoute(waypoints, options);
  }
  
  // Handle native OSRM profiles
  return calculateNativeOSRMRoute(waypoints, options);
};

/**
 * Calculate simple point-to-point route
 * 
 * @param from - Start coordinate
 * @param to - End coordinate  
 * @param profile - Routing profile
 * @returns Promise<Route>
 */
export const calculateSimpleRoute = async (
  from: Coordinate,
  to: Coordinate,
  profile: OSRMProfile = 'driving'
): Promise<Route> => {
  const routes = await calculateRoute([from, to], { profile, alternatives: false });
  if (routes.length === 0) {
    throw new Error('No route found');
  }
  return routes[0]!;
};

/**
 * Get route duration estimate (without full route calculation)
 * 
 * @param from - Start coordinate
 * @param to - End coordinate
 * @param profile - Routing profile  
 * @returns Promise<{distance: number, duration: number}>
 */
export const getRouteEstimate = async (
  from: Coordinate,
  to: Coordinate,
  profile: OSRMProfile = 'driving'
): Promise<{distance: number, duration: number}> => {
  const route = await calculateSimpleRoute(from, to, profile);
  return {
    distance: route.distance,
    duration: route.duration
  };
};

/**
 * Convert OSRM route to our Route interface
 */
function convertOSRMRoute(osrmRoute: OSRMRoute, geometryType: string = 'polyline'): Route {
  // Decode geometry based on type
  let coordinates: Coordinate[];
  
  if (geometryType === 'geojson') {
    // GeoJSON geometry
    coordinates = (osrmRoute.geometry as any).coordinates.map((coord: [number, number]) => ({
      latitude: coord[1],
      longitude: coord[0]
    }));
  } else {
    // Polyline encoded geometry (default for OSRM)
    if (typeof osrmRoute.geometry === 'string') {
      coordinates = decodePolyline(osrmRoute.geometry);
    } else {
      console.warn('⚠️ Unexpected geometry format, falling back to waypoints');
      // Fallback: extract coordinates from waypoints/steps
      coordinates = [];
      osrmRoute.legs.forEach(leg => {
        if (leg.steps) {
          leg.steps.forEach(step => {
            coordinates.push({
              latitude: step.maneuver.location[1],
              longitude: step.maneuver.location[0]
            });
          });
        }
      });
    }
  }

  // Convert steps from all legs
  const steps: RouteStep[] = [];
  osrmRoute.legs.forEach(leg => {
    if (leg.steps) {
      leg.steps.forEach(osrmStep => {
        steps.push({
          instruction: generateInstruction(osrmStep.maneuver),
          distance: osrmStep.distance,
          duration: osrmStep.duration,
          coordinate: {
            latitude: osrmStep.maneuver.location[1],
            longitude: osrmStep.maneuver.location[0]
          }
        });
      });
    }
  });

  return {
    coordinates,
    distance: osrmRoute.distance,
    duration: osrmRoute.duration,
    steps
  };
}

/**
 * Generate human-readable instruction from OSRM maneuver
 */
function generateInstruction(maneuver: OSRMManeuver): string {
  const { type, modifier } = maneuver;
  
  const instructions: { [key: string]: string } = {
    'depart': 'Head out',
    'turn': modifier ? `Turn ${modifier}` : 'Turn',
    'new name': 'Continue',
    'continue': 'Continue',
    'merge': 'Merge',
    'on ramp': 'Take the ramp',
    'off ramp': 'Take the exit',
    'fork': 'Keep to the fork',
    'end of road': modifier ? `Turn ${modifier} at the end of the road` : 'Continue at the end of the road',
    'use lane': 'Use the lane',
    'roundabout': 'Enter the roundabout',
    'roundabout turn': 'Take the roundabout',
    'exit roundabout': 'Exit the roundabout',
    'arrive': 'You have arrived at your destination'
  };

  return instructions[type] || `${type} ${modifier || ''}`.trim();
}

/**
 * Improved polyline decoder with better error handling
 */
function decodePolyline(encoded: string): Coordinate[] {
  if (!encoded || typeof encoded !== 'string') {
    console.warn('⚠️ Invalid polyline string:', encoded);
    return [];
  }

  const coordinates: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  try {
    while (index < encoded.length) {
      let byte = 0;
      let shift = 0;
      let result = 0;

      do {
        if (index >= encoded.length) break;
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1F) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        if (index >= encoded.length) break;
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1F) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }
  } catch (error) {
    console.error('❌ Polyline decoding error:', error);
    return [];
  }

  return coordinates;
}

/**
 * Validate coordinate values
 */
function isValidCoordinate(coord: Coordinate): boolean {
  return (
    coord &&
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number' &&
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  );
}

/**
 * Format duration in human-readable format
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

/**
 * Format distance in human-readable format
 */
export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    const km = (meters / 1000).toFixed(1);
    return `${km} km`;
  } else {
    return `${Math.round(meters)} m`;
  }
};

/**
 * Calculate straight-line distance between two coordinates (fallback)
 */
export const calculateStraightLineDistance = (from: Coordinate, to: Coordinate): number => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = toRadians(from.latitude);
  const φ2 = toRadians(to.latitude);
  const Δφ = toRadians(to.latitude - from.latitude);
  const Δλ = toRadians(to.longitude - from.longitude);

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
} 