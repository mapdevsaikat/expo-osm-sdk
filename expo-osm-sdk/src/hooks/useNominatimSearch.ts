import { useState, useCallback } from 'react';
import { 
  UseNominatimSearchReturn, 
  SearchLocation, 
  Coordinate, 
  NominatimSearchOptions, 
  NominatimReverseOptions 
} from '../types';
import { searchLocations, reverseGeocode } from '../utils/nominatim';

/**
 * React Hook for Nominatim Search
 * 
 * Provides search and reverse geocoding functionality with state management
 * 
 * @returns UseNominatimSearchReturn
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { search, reverseGeocode, isLoading, error, lastResults } = useNominatimSearch();
 *   
 *   const handleSearch = async () => {
 *     try {
 *       const results = await search('New York');
 *       console.log('Found locations:', results);
 *     } catch (err) {
 *       console.error('Search failed:', err);
 *     }
 *   };
 *   
 *   return (
 *     <View>
 *       <Button title="Search" onPress={handleSearch} />
 *       {isLoading && <Text>Searching...</Text>}
 *       {error && <Text>Error: {error}</Text>}
 *       {lastResults.map(result => (
 *         <Text key={result.placeId}>{result.displayName}</Text>
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export const useNominatimSearch = (): UseNominatimSearchReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<SearchLocation[]>([]);

  /**
   * Search for locations by text query
   */
  const search = useCallback(async (
    query: string, 
    options?: NominatimSearchOptions
  ): Promise<SearchLocation[]> => {
    if (!query.trim()) {
      setLastResults([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchLocations(query, options);
      setLastResults(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setLastResults([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reverse geocode coordinates to get location details
   */
  const reverseGeocodeLocation = useCallback(async (
    coordinate: Coordinate, 
    options?: NominatimReverseOptions
  ): Promise<SearchLocation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await reverseGeocode(coordinate, options);
      if (result) {
        setLastResults([result]);
      } else {
        setLastResults([]);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Reverse geocoding failed';
      setError(errorMessage);
      setLastResults([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear current results and error state
   */
  const clearResults = useCallback(() => {
    setLastResults([]);
    setError(null);
  }, []);

  return {
    search,
    reverseGeocode: reverseGeocodeLocation,
    isLoading,
    error,
    lastResults,
    clearResults,
  };
}; 