import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { SearchBoxProps, SearchLocation } from '../types';
import { useNominatimSearch } from '../hooks/useNominatimSearch';

/**
 * SearchBox Component - Simple, clean search with autocomplete
 * 
 * @example
 * <SearchBox
 *   onLocationSelected={(location) => {
 *     mapRef.current?.animateToLocation(
 *       location.coordinate.latitude,
 *       location.coordinate.longitude,
 *       15
 *     );
 *   }}
 *   maxResults={5}
 *   autoComplete={true}
 * />
 */
export const SearchBox: React.FC<SearchBoxProps> = ({
  onLocationSelected,
  onResultsChanged,
  placeholder = "Search for places...",
  value,
  editable = true,
  style,
  containerStyle,
  maxResults = 5,
  showCurrentLocation = true,
  autoComplete = true,
  debounceMs = 300,
}) => {
  const [query, setQuery] = useState(value || '');
  const [showResults, setShowResults] = useState(false);
  const { search, isLoading, error, lastResults, clearResults } = useNominatimSearch();

  // Debug logging for state changes
  React.useEffect(() => {
    console.log('🔍 SearchBox State:', {
      showResults,
      lastResultsCount: lastResults.length,
      isLoading,
      error,
      query: query.substring(0, 20) + (query.length > 20 ? '...' : ''),
    });
    if (showResults && lastResults.length > 0) {
      console.log('🔍 Should show results dropdown with:', lastResults.length, 'items');
    }
  }, [showResults, lastResults, isLoading, error, query]);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput | null>(null);
  const onResultsChangedRef = useRef(onResultsChanged);
  const isSelectingRef = useRef(false); // Track if we're handling a selection

  // Keep callback ref updated
  useEffect(() => {
    onResultsChangedRef.current = onResultsChanged;
  }, [onResultsChanged]);

  // Update query when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  // Debounced search effect
  useEffect(() => {
    // Skip search if we're handling a selection to prevent duplicate events
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    if (!autoComplete || !query.trim() || !editable) {
      clearResults();
      setShowResults(false);
      onResultsChangedRef.current?.([]);
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        const results = await search(query, { limit: maxResults });
        console.log('🔍 SearchBox: Search completed', { query, resultsCount: results.length, showResults: results.length > 0 });
        setShowResults(results.length > 0);
        onResultsChangedRef.current?.(results);
      } catch (err) {
        console.error('Search error:', err);
        setShowResults(false);
        onResultsChangedRef.current?.([]);
      }
    }, debounceMs);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, autoComplete, maxResults, debounceMs, search, clearResults, editable]);

  const handleLocationSelect = (location: SearchLocation) => {
    // Set flag to prevent useEffect from triggering a new search
    isSelectingRef.current = true;
    
    // Clear any pending search
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
      debounceTimeout.current = null;
    }
    
    // Set query first to show selected location
    setQuery(location.displayName);
    
    // Clear results and close dropdown
    clearResults();
    setShowResults(false);
    onResultsChangedRef.current?.([]);
    
    // Trigger selection callback
    onLocationSelected?.(location);
    
    // Blur input after a short delay to ensure selection callback fires
    setTimeout(() => {
      inputRef.current?.blur();
      // Reset flag after blur
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 100);
    }, 100);
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
      <View style={styles.searchContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.textInput, style]}
          placeholder={placeholder}
          value={value !== undefined ? value : query}
          onChangeText={editable ? setQuery : undefined}
          editable={editable}
          onFocus={() => {
            if (lastResults.length > 0 && autoComplete) {
              setShowResults(true);
            }
          }}
          onBlur={() => {
            // Delay closing to allow time for result selection
            // Check if we're selecting to prevent premature closing
            setTimeout(() => {
              if (!isSelectingRef.current) {
                setShowResults(false);
              }
            }, 200);
          }}
          returnKeyType="search"
          onSubmitEditing={handleSearchPress}
        />
        <View style={styles.actionContainer}>
          {isLoading && <ActivityIndicator style={styles.loader} />}
          {query.length > 0 && !isLoading && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          {!autoComplete && (
            <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
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
          {lastResults.slice(0, maxResults).map((result, index) => {
            const displayNameParts = result.displayName.split(',');
            const title = displayNameParts[0];
            const subtitle = displayNameParts.slice(1).join(',').trim();

            return (
              <Pressable
                key={result.placeId || index}
                onPress={() => {
                  // Prevent blur from closing dropdown during selection
                  isSelectingRef.current = true;
                  handleLocationSelect(result);
                }}
                onPressIn={() => {
                  // Prevent input blur during press
                  isSelectingRef.current = true;
                }}
                style={({ pressed }) => [
                  styles.resultItem,
                  { backgroundColor: pressed ? '#F8F8F8' : '#FFFFFF' },
                  index === lastResults.slice(0, maxResults).length - 1 && styles.lastResultItem,
                ]}
              >
                <Text style={styles.resultIcon}>{getCategoryIcon(result.category || '')}</Text>
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultText} numberOfLines={2}>
                    <Text style={styles.resultTextBold}>{title}</Text>
                    {subtitle ? <Text style={styles.resultTextRegular}> {subtitle}</Text> : null}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

const getCategoryIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    'amenity': '🏪', 'shop': '🛍️', 'tourism': '🏛️', 'leisure': '🎯',
    'natural': '🌲', 'place': '📍', 'highway': '🛣️', 'building': '🏢',
    'landuse': '🏞️', 'waterway': '🌊',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    paddingVertical: 0,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  loader: {
    marginRight: 4,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999999',
  },
  searchButton: {
    padding: 4,
    marginLeft: 4,
  },
  searchButtonText: {
    fontSize: 18,
  },
  errorContainer: {
    backgroundColor: '#FFF0F0',
    borderRadius: 6,
    padding: 10,
    marginTop: 6,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    maxHeight: 280,
    overflow: 'hidden',
    zIndex: 10000, // Ensure results are above other elements
    elevation: 10, // Android elevation
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastResultItem: {
    borderBottomWidth: 0,
  },
  resultIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultText: {
    fontSize: 14,
    color: '#333333',
  },
  resultTextBold: {
    fontWeight: '600',
    color: '#000000',
  },
  resultTextRegular: {
    fontWeight: '400',
    color: '#666666',
  },
});