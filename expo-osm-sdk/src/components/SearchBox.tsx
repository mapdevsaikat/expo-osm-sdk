import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SearchBoxProps, SearchLocation } from '../types';
import { useNominatimSearch } from '../hooks/useNominatimSearch';

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
}) => {
  const [query, setQuery] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);
  const { search, isLoading, error, lastResults, clearResults } = useNominatimSearch();
  
  // Debug logging for state changes
  React.useEffect(() => {
    console.log('🔍 SearchBox State:', { 
      showResults, 
      lastResultsCount: lastResults.length, 
      isLoading, 
      error,
      query: query.substring(0, 20) + (query.length > 20 ? '...' : '')
    });
    
    if (showResults && lastResults.length > 0) {
      console.log('🔍 Should show results dropdown with:', lastResults.length, 'items');
    }
  }, [showResults, lastResults, isLoading, error, query]);
  
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);
  const onResultsChangedRef = useRef(onResultsChanged);
  
  // Keep callback ref updated
  useEffect(() => {
    onResultsChangedRef.current = onResultsChanged;
  }, [onResultsChanged]);

  // Debounced search effect - FIXED: Stable dependencies only
  useEffect(() => {
    if (!autoComplete || !query.trim()) {
      clearResults();
      setShowResults(false);
      // Call onResultsChanged safely using ref
      onResultsChangedRef.current?.([]);
      return;
    }

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(async () => {
      try {
        const results = await search(query, { limit: maxResults });
        console.log('🔍 SearchBox: Search completed', { query, resultsCount: results.length, showResults: results.length > 0 });
        setShowResults(results.length > 0);
        // Call onResultsChanged safely using ref
        onResultsChangedRef.current?.(results);
      } catch (err) {
        console.error('Search error:', err);
        setShowResults(false);
        // Call onResultsChanged safely using ref
        onResultsChangedRef.current?.([]);
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, autoComplete, maxResults, debounceMs, search, clearResults]);
  // FIXED: Removed onResultsChanged from dependencies to prevent infinite loops

  const handleLocationSelect = (location: SearchLocation) => {
    setQuery(location.displayName);
    setShowResults(false);
    onLocationSelected?.(location);
    inputRef.current?.blur();
  };

  const handleSearchPress = async () => {
    if (!query.trim()) return;

    try {
      const results = await search(query, { limit: maxResults });
      setShowResults(results.length > 0);
      onResultsChanged?.(results);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowResults(false);
    clearResults();
    onResultsChanged?.([]);
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
            if (lastResults.length > 0 && autoComplete) {
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

      {showResults && lastResults.length > 0 && (
        <View style={styles.resultsContainer}>
          {lastResults.slice(0, maxResults).map((result, index) => (
            <TouchableOpacity
              key={result.placeId}
              style={[
                styles.resultItem,
                index === lastResults.length - 1 && styles.lastResultItem
              ]}
              onPress={() => handleLocationSelect(result)}
            >
              <View style={styles.resultContent}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1a1a1a',
                  marginBottom: 2,
                }} numberOfLines={1}>
                  {result.displayName.split(',')[0]}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#666666',
                  lineHeight: 18,
                }} numberOfLines={2}>
                  {result.displayName.split(',').slice(1).join(',').trim()}
                </Text>
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
    color: '#000000',  // Pure black for maximum contrast
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  lastResultItem: {
    borderBottomWidth: 0,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',  // Pure black for maximum contrast
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'left',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#333333',  // Dark gray for good readability
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'left',
  },
  resultCategory: {
    fontSize: 12,
    color: '#555555',  // Medium gray but still readable
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'left',
  },
}); 