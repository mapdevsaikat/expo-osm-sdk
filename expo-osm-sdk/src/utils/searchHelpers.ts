import { SearchLocation, Coordinate } from '../types';
import { searchLocations, reverseGeocode, calculateDistance } from './nominatim';

/**
 * Search Convenience Utilities
 * 
 * Simplified functions for common search operations
 */

/**
 * Quick search with sensible defaults
 * Perfect for simple "search and fly to" functionality
 */
export const quickSearch = async (query: string): Promise<SearchLocation | null> => {
  if (!query.trim()) return null;
  
  try {
    const results = await searchLocations(query, {
      limit: 1,
      addressdetails: true
    });
    
    return results.length > 0 ? results[0]! : null;
  } catch (error) {
    console.error('Quick search failed:', error);
    return null;
  }
};

/**
 * Search nearby places of a specific type
 * 
 * @param center - Center coordinate to search around
 * @param query - What to search for (e.g., "restaurant", "hotel", "gas station")
 * @param radiusKm - Search radius in kilometers (approximate)
 */
export const searchNearby = async (
  center: Coordinate, 
  query: string, 
  radiusKm: number = 5
): Promise<SearchLocation[]> => {
  try {
    // Create a bounding box based on radius (rough approximation)
    const latDelta = radiusKm / 111; // ~111km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos(center.latitude * Math.PI / 180));
    
    const viewbox: [number, number, number, number] = [
      center.longitude - lngDelta, // left
      center.latitude + latDelta,  // top
      center.longitude + lngDelta, // right
      center.latitude - latDelta   // bottom
    ];
    
    const results = await searchLocations(query, {
      limit: 10,
      bounded: true,
      viewbox,
      addressdetails: true
    });
    
    // Filter by actual distance and sort by proximity
    return results
      .map(result => ({
        ...result,
        distance: calculateDistance(center, result.coordinate)
      }))
      .filter(result => result.distance <= radiusKm)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
  } catch (error) {
    console.error('Nearby search failed:', error);
    return [];
  }
};

/**
 * Get a human-readable address from coordinates
 * Simplified version of reverse geocoding
 */
export const getAddressFromCoordinates = async (
  coordinate: Coordinate
): Promise<string | null> => {
  try {
    const result = await reverseGeocode(coordinate, {
      addressdetails: true
    });
    
    if (!result) return null;
    
    // Extract the most relevant address parts
    const address = result.address;
    if (!address) return result.displayName;
    
    const parts = [];
    
    // Add house number and street
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }
    
    // Add city (using available properties from NominatimAddress)
    if (address.city || address.suburb || address.neighbourhood) {
      parts.push(address.city || address.suburb || address.neighbourhood);
    }
    
    // Add country
    if (address.country) {
      parts.push(address.country);
    }
    
    return parts.length > 0 ? parts.join(', ') : result.displayName;
    
  } catch (error) {
    console.error('Address lookup failed:', error);
    return null;
  }
};

/**
 * Search for points of interest (POI) by category
 * 
 * @param center - Center coordinate
 * @param category - POI category (restaurant, hotel, hospital, etc.)
 * @param radiusKm - Search radius
 */
export const searchPOI = async (
  center: Coordinate,
  category: string,
  radiusKm: number = 2
): Promise<SearchLocation[]> => {
  // Common POI search terms
  const categoryMap = {
    restaurant: 'restaurant OR cafe OR food',
    hotel: 'hotel OR accommodation OR lodging',
    hospital: 'hospital OR medical OR clinic',
    school: 'school OR university OR education',
    bank: 'bank OR atm OR financial',
    gas: 'gas station OR fuel OR petrol',
    shopping: 'shop OR mall OR market OR store',
    park: 'park OR garden OR recreation',
    transport: 'station OR airport OR transport'
  };
  
  const searchQuery = categoryMap[category.toLowerCase() as keyof typeof categoryMap] || category;
  
  return searchNearby(center, searchQuery, radiusKm);
};

/**
 * Smart search that handles different types of queries
 * - Coordinates: "40.7128, -74.0060"
 * - Addresses: "123 Main St, New York"
 * - Places: "Times Square"
 * - POI: "restaurants near Central Park"
 */
export const smartSearch = async (query: string): Promise<SearchLocation[]> => {
  if (!query.trim()) return [];
  
  const trimmed = query.trim();
  
  // Check if it looks like coordinates
  const coordPattern = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
  if (coordPattern.test(trimmed)) {
    const coords = trimmed.split(',').map(s => parseFloat(s.trim()));
    if (coords.length === 2 && !coords.some(isNaN)) {
      const lat = coords[0]!;
      const lng = coords[1]!;
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        try {
          const result = await reverseGeocode({ latitude: lat, longitude: lng });
          return result ? [result] : [];
        } catch (error) {
          console.error('Coordinate lookup failed:', error);
          return [];
        }
      }
    }
  }
  
  // Regular search
  try {
    return await searchLocations(trimmed, {
      limit: 5,
      addressdetails: true
    });
  } catch (error) {
    console.error('Smart search failed:', error);
    return [];
  }
}; 