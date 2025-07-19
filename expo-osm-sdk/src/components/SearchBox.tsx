import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { SearchBoxProps, SearchLocation, Coordinate } from '../types';
import { useNominatimSearch, useLocationUtils } from '../hooks/useNominatimSearch';
import { formatDistance } from '../utils/nominatim';

/**
 * SearchBox Component
 * 
 * A search input with autocomplete functionality for finding locations
 * 
 * @example
 * ```tsx
 * <SearchBox
 *   placeholder="Search for places..."
 *   onLocationSelected={(location) => {
 *     console.log('Selected:', location.displayName);
 *     mapRef.current?.animateToLocation(
 *       location.coordinate.latitude,
 *       location.coordinate.longitude,
 *       15
 *     );
 *   }}
 *   maxResults={5}
 *   autoComplete={true}
 * />
 * ```
 */
export const SearchBox: React.FC<SearchBoxProps> = ({
  onLocationSelected,
  onResultsChanged,
  placeholder = "Search for places...",
  style,
  containerStyle,
  maxResults = 5,
  showCurrentLocation = true,
  autoComplete = true,
  debounceMs = 300,
  userLocation,
}) => {
  const [query, setQuery] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);
  const { 
    results, 
    isLoading, 
    error, 
    debouncedSearch, 
    clearResults,
    suggestions,
    getSuggestions,
    isLoadingSuggestions
  } = useNominatimSearch({ 
    debounceMs, 
    limit: maxResults 
  });
  const { sortByDistance, getDistance } = useLocationUtils();
  
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Stable callback refs to prevent infinite re-renders
  const stableDebouncedSearch = useRef(debouncedSearch);
  const stableClearResults = useRef(clearResults);
  const stableSortByDistance = useRef(sortByDistance);
  const stableOnResultsChanged = useRef(onResultsChanged);

  // Update refs when functions change
  useEffect(() => {
    stableDebouncedSearch.current = debouncedSearch;
    stableClearResults.current = clearResults;
    stableSortByDistance.current = sortByDistance;
    stableOnResultsChanged.current = onResultsChanged;
  });

  // Handle search input changes
  useEffect(() => {
    if (!autoComplete || !query.trim()) {
      stableClearResults.current();
      setShowResults(false);
      stableOnResultsChanged.current?.([]);
      return;
    }

    // Use debounced search from hook
    stableDebouncedSearch.current(query);
  }, [query, autoComplete]);

  // Handle results changes
  useEffect(() => {
    const sortedResults = userLocation && results.length > 0 
      ? stableSortByDistance.current(userLocation, results)
      : results;
      
    setShowResults(sortedResults.length > 0);
    stableOnResultsChanged.current?.(sortedResults);
  }, [results, userLocation]);

  const handleLocationSelect = (location: SearchLocation) => {
    setQuery(location.displayName);
    setShowResults(false);
    onLocationSelected?.(location);
    inputRef.current?.blur();
  };

  const handleSearchPress = () => {
    if (!query.trim()) return;
    stableDebouncedSearch.current(query);
  };

  const handleClear = () => {
    setQuery('');
    setShowResults(false);
    stableClearResults.current();
    stableOnResultsChanged.current?.([]);
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.searchContainer, style]}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onFocus={() => {
            if (results.length > 0 && autoComplete) {
              setShowResults(true);
            }
          }}
          onBlur={() => {
            // Delay hiding results to allow taps on results
            setTimeout(() => setShowResults(false), 150);
          }}
          returnKeyType="search"
          onSubmitEditing={handleSearchPress}
        />
        
        <View style={styles.actionContainer}>
          {isLoading && (
            <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
          )}
          
          {query.length > 0 && !isLoading && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          
          {!autoComplete && (
            <TouchableOpacity onPress={handleSearchPress} style={styles.searchButton}>
              <Text style={styles.searchButtonText}>🔍</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          {results.slice(0, maxResults).map((result: SearchLocation, index: number) => (
            <TouchableOpacity
              key={result.placeId}
              style={[
                styles.resultItem,
                index === results.length - 1 && styles.lastResultItem
              ]}
              onPress={() => handleLocationSelect(result)}
            >
              <View style={styles.resultContent}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {result.displayName.split(',')[0]}
                  </Text>
                  {userLocation && (
                    <Text style={styles.distanceText}>
                      {formatDistance(getDistance(userLocation, result.coordinate))}
                    </Text>
                  )}
                </View>
                <Text style={styles.resultSubtitle} numberOfLines={1}>
                  {result.displayName.split(',').slice(1).join(',').trim()}
                </Text>
                {result.category && (
                  <Text style={styles.resultCategory}>
                    {getCategoryIcon(result.category)} {result.category}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Get icon for category
 */
const getCategoryIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    'amenity': '🏪',
    'shop': '🛍️',
    'tourism': '🏛️',
    'leisure': '🎯',
    'natural': '🌲',
    'place': '📍',
    'highway': '🛣️',
    'building': '🏢',
    'landuse': '🏞️',
    'waterway': '🌊',
  };
  
  return iconMap[category] || '📍';
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  loader: {
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
  searchButton: {
    padding: 4,
  },
  searchButtonText: {
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#FFE6E6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF4444',
  },
  errorText: {
    color: '#CC0000',
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 300,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastResultItem: {
    borderBottomWidth: 0,
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    color: '#8c14ff',
    fontWeight: '500',
    marginLeft: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultCategory: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
}); 