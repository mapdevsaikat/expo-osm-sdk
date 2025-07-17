import { 
  NominatimSearchResult, 
  NominatimSearchOptions, 
  NominatimReverseOptions, 
  SearchLocation, 
  Coordinate 
} from '../types';

/**
 * Nominatim Search Service
 * 
 * Provides geocoding and reverse geocoding using OpenStreetMap's Nominatim service.
 * This is a free service with usage limitations - please respect the usage policy:
 * https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Rate limiting - respect Nominatim's usage policy
const REQUEST_DELAY = 1000; // 1 second between requests
let lastRequestTime = 0;

/**
 * Respect rate limiting by adding delay between requests
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
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Nominatim request failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
};

/**
 * Convert Nominatim result to SearchLocation
 */
const convertToSearchLocation = (result: NominatimSearchResult): SearchLocation => {
  const searchLocation: SearchLocation = {
    coordinate: {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    },
    displayName: result.display_name,
    boundingBox: result.boundingbox.map(parseFloat) as [number, number, number, number],
    importance: result.importance,
    placeId: result.place_id,
    category: result.class,
    type: result.type,
  };

  // Only include address if it exists
  if (result.address) {
    searchLocation.address = result.address;
  }

  return searchLocation;
};

/**
 * Search for locations using a text query
 * 
 * @param query - Search text (e.g., "New York", "Starbucks near London")
 * @param options - Search options
 * @returns Promise<SearchLocation[]>
 */
export const searchLocations = async (
  query: string, 
  options: NominatimSearchOptions = {}
): Promise<SearchLocation[]> => {
  if (!query.trim()) {
    return [];
  }

  const {
    limit = 5,
    countrycodes,
    bounded = false,
    viewbox,
    addressdetails = true,
    extratags = false,
    namedetails = false,
  } = options;

  const params = new URLSearchParams({
    q: query.trim(),
    format: 'jsonv2',
    limit: limit.toString(),
    addressdetails: addressdetails ? '1' : '0',
    extratags: extratags ? '1' : '0',
    namedetails: namedetails ? '1' : '0',
  });

  if (countrycodes) {
    params.append('countrycodes', countrycodes);
  }

  if (bounded && viewbox) {
    params.append('bounded', '1');
    params.append('viewbox', viewbox.join(','));
  }

  try {
    const url = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;
    console.log('🔍 Nominatim search:', query, url);
    
    const response = await rateLimitedFetch(url);
    const results: NominatimSearchResult[] = await response.json();
    
    console.log('📍 Search results:', results.length);
    
    return results.map(convertToSearchLocation);
  } catch (error) {
    console.error('❌ Nominatim search failed:', error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Reverse geocoding - get location details from coordinates
 * 
 * @param coordinate - Latitude and longitude
 * @param options - Reverse geocoding options
 * @returns Promise<SearchLocation | null>
 */
export const reverseGeocode = async (
  coordinate: Coordinate,
  options: NominatimReverseOptions = {}
): Promise<SearchLocation | null> => {
  const {
    zoom = 18,
    addressdetails = true,
    extratags = false,
    namedetails = false,
  } = options;

  const params = new URLSearchParams({
    lat: coordinate.latitude.toString(),
    lon: coordinate.longitude.toString(),
    format: 'jsonv2',
    zoom: zoom.toString(),
    addressdetails: addressdetails ? '1' : '0',
    extratags: extratags ? '1' : '0',
    namedetails: namedetails ? '1' : '0',
  });

  try {
    const url = `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`;
    console.log('🔄 Reverse geocoding:', coordinate, url);
    
    const response = await rateLimitedFetch(url);
    const result: NominatimSearchResult = await response.json();
    
    if (!result.place_id) {
      console.log('📍 No reverse geocoding result found');
      return null;
    }
    
    console.log('📍 Reverse geocoding result:', result.display_name);
    
    return convertToSearchLocation(result);
  } catch (error) {
    console.error('❌ Reverse geocoding failed:', error);
    throw new Error(`Reverse geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get suggestions for a partial query (for autocomplete)
 * 
 * @param query - Partial search text
 * @param options - Search options
 * @returns Promise<SearchLocation[]>
 */
export const getSuggestions = async (
  query: string,
  options: NominatimSearchOptions = {}
): Promise<SearchLocation[]> => {
  if (query.length < 3) {
    return []; // Don't search for queries shorter than 3 characters
  }

  return searchLocations(query, {
    ...options,
    limit: options.limit || 3, // Fewer results for suggestions
  });
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * 
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in kilometers
 */
export const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format distance for display
 * 
 * @param distanceKm - Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 100) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}; 