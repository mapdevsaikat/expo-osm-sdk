import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { OSMView } from 'expo-osm-sdk';
import type { Coordinate, OSMViewRef } from 'expo-osm-sdk';

/**
 * Search + map demo without SDK SearchBox (removed in v2.0.0).
 *
 * All colors live in `SEARCH_THEME` so you can match dark mode / brand palettes —
 * this replaces the old built-in SearchBox that hard-coded styles (GitHub #2).
 */

type NominatimHit = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
};

/** Adjust these to theme search UI from your app */
const SEARCH_THEME = {
  searchBackground: '#FFFFFF',
  resultsBackground: '#FFFFFF',
  resultsBorder: '#DDDDDD',
  errorBackground: '#FFF0F0',
  primaryText: '#333333',
  secondaryText: '#666666',
  tertiaryText: '#999999',
  rowPressed: '#F8F8F8',
  inputPlaceholder: '#999999',
};

const USER_AGENT = 'expo-osm-sdk-example/1.0 (demo; contact: repo readme)';

async function nominatimSearch(query: string): Promise<NominatimHit[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error('Search request failed');
  return res.json();
}

async function nominatimReverse(coordinate: Coordinate): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinate.latitude}&lon=${coordinate.longitude}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data?.display_name === 'string' ? data.display_name : null;
}

export default function SearchDemo() {
  const mapRef = useRef<OSMViewRef>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pressedId, setPressedId] = useState<number | null>(null);

  const runSearch = useCallback(async (text: string) => {
    setError(null);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const hits = await nominatimSearch(text);
      setResults(hits);
    } catch {
      setError('Search failed. Try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const handleSelect = (hit: NominatimHit) => {
    Keyboard.dismiss();
    setQuery(hit.display_name.split(',')[0] ?? hit.display_name);
    setResults([]);
    mapRef.current?.animateToLocation(parseFloat(hit.lat), parseFloat(hit.lon), 15);
  };

  const handleMapLongPress = async (coordinate: Coordinate) => {
    try {
      const label = await nominatimReverse(coordinate);
      Alert.alert(label ? 'Location' : 'No address', label ?? 'No address found');
    } catch {
      Alert.alert('Error', 'Reverse geocoding failed');
    }
  };

  const themed = StyleSheet.create({
    searchShell: {
      backgroundColor: SEARCH_THEME.searchBackground,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: SEARCH_THEME.resultsBorder,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      minHeight: 44,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: SEARCH_THEME.primaryText,
      paddingVertical: 8,
    },
    resultsWrap: {
      marginTop: 8,
      maxHeight: 220,
      backgroundColor: SEARCH_THEME.resultsBackground,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: SEARCH_THEME.resultsBorder,
      overflow: 'hidden',
    },
    row: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: SEARCH_THEME.resultsBorder,
    },
    rowPressed: {
      backgroundColor: SEARCH_THEME.rowPressed,
    },
    primaryLabel: {
      fontSize: 15,
      color: SEARCH_THEME.primaryText,
    },
    secondaryLabel: {
      fontSize: 12,
      color: SEARCH_THEME.secondaryText,
      marginTop: 2,
    },
    errorBox: {
      marginTop: 8,
      padding: 10,
      borderRadius: 8,
      backgroundColor: SEARCH_THEME.errorBackground,
    },
    errorText: {
      color: SEARCH_THEME.secondaryText,
      fontSize: 13,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={themed.searchShell}>
          <TextInput
            style={themed.input}
            placeholder="Search places, addresses…"
            placeholderTextColor={SEARCH_THEME.inputPlaceholder}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {loading ? <ActivityIndicator color={SEARCH_THEME.tertiaryText} /> : null}
        </View>

        {error ? (
          <View style={themed.errorBox}>
            <Text style={themed.errorText}>{error}</Text>
          </View>
        ) : null}

        {results.length > 0 ? (
          <View style={themed.resultsWrap}>
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={results}
              keyExtractor={(item) => String(item.place_id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[themed.row, pressedId === item.place_id ? themed.rowPressed : null]}
                  onPressIn={() => setPressedId(item.place_id)}
                  onPressOut={() => setPressedId(null)}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={themed.primaryLabel} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                  <Text style={themed.secondaryLabel}>
                    {item.lat}, {item.lon}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : null}
      </View>

      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={{ latitude: 40.7128, longitude: -74.006 }}
        initialZoom={13}
        showUserLocation
        onLongPress={handleMapLongPress}
        onMapReady={() => console.log('Map ready')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  map: { flex: 1 },
});