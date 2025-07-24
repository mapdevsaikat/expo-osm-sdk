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
const REQUEST_DELAY = 200; // 200ms between requests
let lastRequestTime = 0;

/**
 * OSRM Profile types for different routing modes
 */
export type OSRMProfile = 'driving' | 'walking' | 'cycling';

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
    geometries = 'geojson',
    overview = 'full',
    continue_straight = false
  } = options;

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
    const url = `${OSRM_BASE_URL}/route/v1/${profile}/${coordsString}?${params.toString()}`;
    console.log('🚗 OSRM route request:', profile, waypoints.length, 'waypoints');
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

    console.log('📍 Found', data.routes.length, 'route(s)');
    
    // Convert OSRM routes to our Route interface
    return data.routes.map(osrmRoute => convertOSRMRoute(osrmRoute));
  } catch (error) {
    console.error('❌ OSRM routing failed:', error);
    throw new Error(`Routing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
function convertOSRMRoute(osrmRoute: OSRMRoute): Route {
  // Decode geometry based on type
  let coordinates: Coordinate[];
  
  if (typeof osrmRoute.geometry === 'string') {
    // Polyline encoded geometry - decode it
    coordinates = decodePolyline(osrmRoute.geometry);
  } else {
    // GeoJSON geometry
    coordinates = (osrmRoute.geometry as any).coordinates.map((coord: [number, number]) => ({
      latitude: coord[1],
      longitude: coord[0]
    }));
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
 * Simple polyline decoder (for OSRM polyline geometry)
 */
function decodePolyline(encoded: string): Coordinate[] {
  const coordinates: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let byte = 0;
    let shift = 0;
    let result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1F) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
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