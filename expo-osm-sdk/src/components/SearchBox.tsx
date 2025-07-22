import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Pressable, // NEW: Import Pressable for better interaction styling
} from 'react-native';
import { SearchBoxProps, SearchLocation } from '../types';
import { useNominatimSearch } from '../hooks/useNominatimSearch';

/**
 * SearchBox Component
 * A search input with autocomplete functionality for finding locations
 * @example
 * ```
 * <SearchBox
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
  const [query, setQuery] = useState('');
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

  // Keep callback ref updated
  useEffect(() => {
    onResultsChangedRef.current = onResultsChanged;
  }, [onResultsChanged]);

  // Debounced search effect
  useEffect(() => {
    if (!autoComplete || !query.trim()) {
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
  }, [query, autoComplete, maxResults, debounceMs, search, clearResults]);

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
      <View style={styles.searchContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.textInput, style]}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          onFocus={() => {
            if (lastResults.length > 0 && autoComplete) {
              setShowResults(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setShowResults(false), 150);
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

      {/* MODIFIED: Rewritten result list rendering */}
      {showResults && lastResults.length > 0 && (
        <View style={styles.resultsContainer}>
          {lastResults.slice(0, maxResults).map((result, index) => {
            // Split display name for styling
            const displayNameParts = result.displayName.split(',');
            const title = displayNameParts[0];
            const subtitle = displayNameParts.slice(1).join(',').trim();

            return (
              <Pressable
                key={result.placeId || index}
                onPress={() => handleLocationSelect(result)}
                style={({ pressed }) => [
                  styles.resultItem,
                  { backgroundColor: pressed ? '#F5F5F5' : '#FFFFFF' }, // Hover/press effect
                  index === lastResults.slice(0, maxResults).length - 1 && styles.lastResultItem,
                ]}
              >
                {/* NEW: Icon display */}
                <Text style={styles.resultIcon}>{getCategoryIcon(result.category || '')}</Text>
                
                {/* NEW: Container for text content */}
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultText} numberOfLines={1}>
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

/**
 * Get icon for category
 */
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
    color: '#000000',
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
    overflow: 'hidden', // NEW: Ensures border radius is respected by children
  },
  // --- MODIFIED & NEW STYLES FOR RESULT ITEMS ---
  resultItem: {
    flexDirection: 'row', // MODIFIED: Align icon and text horizontally
    alignItems: 'center', // MODIFIED: Center items vertically
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
    // MODIFIED: Background color moved to Pressable style prop
  },
  lastResultItem: {
    borderBottomWidth: 0,
  },
  resultIcon: { // NEW: Style for the location icon
    fontSize: 20,
    marginRight: 16,
    color: '#555555',
  },
  resultTextContainer: { // NEW: Wrapper for text to allow it to fill space
    flex: 1,
  },
  resultText: { // NEW: Base style for the result text line
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'left',
  },
  resultTextBold: { // NEW: Style for the main part of the location name
    fontWeight: '600',
    color: '#000000',
  },
  resultTextRegular: { // NEW: Style for the secondary address details
    fontWeight: '400',
    color: '#555555',
  },
  // --- REMOVED STYLES (Replaced by the above) ---
  // - resultContent
  // - resultTitle
  // - resultSubtitle
  // - resultCategory
});