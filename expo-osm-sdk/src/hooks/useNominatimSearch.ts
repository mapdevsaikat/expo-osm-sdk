import { useState, useCallback, useRef, useEffect } from 'react';
import { searchLocations, reverseGeocode, getSuggestions, calculateDistance } from '../utils/nominatim';
import type { 
  SearchLocation, 
  Coordinate, 
  NominatimSearchOptions, 
  NominatimReverseOptions 
} from '../types';

/**
 * Enhanced Nominatim Search Hook with caching, debouncing, and state management
 */

interface UseNominatimSearchOptions extends NominatimSearchOptions {
  debounceMs?: number;
  enableCache?: boolean;
  cacheExpiryMs?: number;
  minQueryLength?: number;
}

interface SearchState {
  results: SearchLocation[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  query: string;
  suggestions: SearchLocation[];
  isLoadingSuggestions: boolean;
}

interface CacheEntry {
  results: SearchLocation[];
  timestamp: number;
}

// Simple in-memory cache
const searchCache = new Map<string, CacheEntry>();
const suggestionCache = new Map<string, CacheEntry>();

export const useNominatimSearch = (options: UseNominatimSearchOptions = {}) => {
  const {
    debounceMs = 300,
    enableCache = true,
    cacheExpiryMs = 5 * 60 * 1000, // 5 minutes
    minQueryLength = 3,
    ...nominatimOptions
  } = options;

  const [state, setState] = useState<SearchState>({
    results: [],
    isLoading: false,
    error: null,
    hasSearched: false,
    query: '',
    suggestions: [],
    isLoadingSuggestions: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, []);

  // Check cache
  const getCachedResults = (query: string, cache: Map<string, CacheEntry>): SearchLocation[] | null => {
    if (!enableCache) return null;
    
    const cacheKey = query.toLowerCase().trim();
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheExpiryMs) {
      console.log('📦 Using cached results for:', query);
      return cached.results;
    }
    
    return null;
  };

  // Set cache
  const setCachedResults = (query: string, results: SearchLocation[], cache: Map<string, CacheEntry>) => {
    if (!enableCache) return;
    
    const cacheKey = query.toLowerCase().trim();
    cache.set(cacheKey, {
      results,
      timestamp: Date.now(),
    });

    // Cleanup old cache entries if cache gets too large
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
  };

  // Main search function
  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState(prev => ({
        ...prev,
        results: [],
        hasSearched: false,
        query: '',
        error: null,
      }));
      return;
    }

    // Check cache first
    const cachedResults = getCachedResults(query, searchCache);
    if (cachedResults) {
      setState(prev => ({
        ...prev,
        results: cachedResults,
        isLoading: false,
        error: null,
        hasSearched: true,
        query,
      }));
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      query,
    }));

    try {
      abortControllerRef.current = new AbortController();
      
      const results = await searchLocations(query, nominatimOptions);
      
      // Cache results
      setCachedResults(query, results, searchCache);
      
      setState(prev => ({
        ...prev,
        results,
        isLoading: false,
        hasSearched: true,
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        results: [],
      }));
    }
  }, [nominatimOptions, enableCache, cacheExpiryMs]);

  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      search(query);
    }, debounceMs);
  }, [search, debounceMs]);

  // Get suggestions for autocomplete
  const getSuggestionsAsync = useCallback(async (query: string) => {
    if (!query.trim() || query.length < minQueryLength) {
      setState(prev => ({
        ...prev,
        suggestions: [],
        isLoadingSuggestions: false,
      }));
      return;
    }

    // Check cache first
    const cachedSuggestions = getCachedResults(query, suggestionCache);
    if (cachedSuggestions) {
      setState(prev => ({
        ...prev,
        suggestions: cachedSuggestions,
        isLoadingSuggestions: false,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoadingSuggestions: true,
    }));

    try {
      const suggestions = await getSuggestions(query, {
        ...nominatimOptions,
        limit: 5, // Limit suggestions
      });
      
      // Cache suggestions
      setCachedResults(query, suggestions, suggestionCache);
      
      setState(prev => ({
        ...prev,
        suggestions,
        isLoadingSuggestions: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        suggestions: [],
        isLoadingSuggestions: false,
      }));
    }
  }, [nominatimOptions, minQueryLength, enableCache, cacheExpiryMs]);

  // Debounced suggestions
  const debouncedGetSuggestions = useCallback((query: string) => {
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    suggestionsTimeoutRef.current = setTimeout(() => {
      getSuggestionsAsync(query);
    }, debounceMs);
  }, [getSuggestionsAsync, debounceMs]);

  // Clear results
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: [],
      error: null,
      hasSearched: false,
      query: '',
    }));
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      suggestions: [],
    }));
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    searchCache.clear();
    suggestionCache.clear();
    console.log('🗑️ Nominatim cache cleared');
  }, []);

  return {
    // State
    results: state.results,
    isLoading: state.isLoading,
    error: state.error,
    hasSearched: state.hasSearched,
    query: state.query,
    suggestions: state.suggestions,
    isLoadingSuggestions: state.isLoadingSuggestions,
    
    // Actions
    search,
    debouncedSearch,
    getSuggestions: debouncedGetSuggestions,
    clearResults,
    clearSuggestions,
    clearCache,
    
    // Cache info
    cacheSize: searchCache.size + suggestionCache.size,
  };
};

/**
 * Hook for reverse geocoding (coordinates to address)
 */
interface UseReverseGeocodeOptions extends NominatimReverseOptions {
  enableCache?: boolean;
  cacheExpiryMs?: number;
}

interface ReverseGeocodeState {
  result: SearchLocation | null;
  isLoading: boolean;
  error: string | null;
}

const reverseCache = new Map<string, CacheEntry>();

export const useReverseGeocode = (options: UseReverseGeocodeOptions = {}) => {
  const {
    enableCache = true,
    cacheExpiryMs = 10 * 60 * 1000, // 10 minutes
    ...nominatimOptions
  } = options;

  const [state, setState] = useState<ReverseGeocodeState>({
    result: null,
    isLoading: false,
    error: null,
  });

  const reverse = useCallback(async (coordinate: Coordinate) => {
    const cacheKey = `${coordinate.latitude.toFixed(4)},${coordinate.longitude.toFixed(4)}`;
    
    // Check cache first
    if (enableCache) {
      const cached = reverseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheExpiryMs) {
        setState({
          result: cached.results[0] || null,
          isLoading: false,
          error: null,
        });
        return;
      }
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const result = await reverseGeocode(coordinate, nominatimOptions);
      
      // Cache result
      if (enableCache && result) {
        reverseCache.set(cacheKey, {
          results: [result],
          timestamp: Date.now(),
        });
      }
      
      setState({
        result,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Reverse geocoding failed';
      setState({
        result: null,
        isLoading: false,
        error: errorMessage,
      });
    }
  }, [nominatimOptions, enableCache, cacheExpiryMs]);

  const clearResult = useCallback(() => {
    setState({
      result: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    result: state.result,
    isLoading: state.isLoading,
    error: state.error,
    reverse,
    clearResult,
  };
};

/**
 * Hook for location utilities and distance calculations
 */
export const useLocationUtils = () => {
  const getDistance = useCallback((coord1: Coordinate, coord2: Coordinate) => {
    return calculateDistance(coord1, coord2);
  }, []);

  const findNearestLocation = useCallback((
    targetCoordinate: Coordinate,
    locations: SearchLocation[]
  ): SearchLocation | null => {
    if (locations.length === 0) return null;

    let nearest = locations[0]!;
    let minDistance = calculateDistance(targetCoordinate, nearest.coordinate);

    for (let i = 1; i < locations.length; i++) {
      const location = locations[i]!;
      const distance = calculateDistance(targetCoordinate, location.coordinate);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = location;
      }
    }

    return nearest;
  }, []);

  const sortByDistance = useCallback((
    targetCoordinate: Coordinate,
    locations: SearchLocation[]
  ): SearchLocation[] => {
    return [...locations].sort((a, b) => {
      const distanceA = calculateDistance(targetCoordinate, a.coordinate);
      const distanceB = calculateDistance(targetCoordinate, b.coordinate);
      return distanceA - distanceB;
    });
  }, []);

  return {
    getDistance,
    findNearestLocation,
    sortByDistance,
  };
}; 