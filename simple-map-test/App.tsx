import React, { useRef, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import {
  OSMView,
  LocationButton,
  NavigationControls,
  TILE_CONFIGS,
  useLocationTracking,
  type OSMViewRef,
  type Coordinate,
  type MarkerConfig,
  type PolylineConfig,
  type CircleConfig,
} from 'expo-osm-sdk';
import { CITIES, INDIA_CENTER } from './src/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'map' | 'shapes' | 'location';
type TileKey = 'liberty' | 'positron' | 'bright';

const TILE_OPTIONS: { key: TileKey; label: string; url: string }[] = [
  { key: 'liberty',  label: 'Liberty',  url: TILE_CONFIGS.openfreemapLiberty.styleUrl },
  { key: 'positron', label: 'Positron', url: TILE_CONFIGS.openfreemapPositron.styleUrl },
  { key: 'bright',   label: 'Bright',   url: TILE_CONFIGS.openfreemapBright.styleUrl },
];

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) {
  const tabs: { id: Screen; label: string }[] = [
    { id: 'map',      label: 'Map' },
    { id: 'shapes',   label: 'Shapes' },
    { id: 'location', label: 'Location' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, active === tab.id && styles.tabActive]}
          onPress={() => onChange(tab.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, active === tab.id && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Screen 1: Map ───────────────────────────────────────────────────────────
// Shows: OSMView, city markers, tile switcher, LocationButton, NavigationControls

function MapScreen() {
  const mapRef = useRef<OSMViewRef>(null);
  const [tileKey, setTileKey] = useState<TileKey>('liberty');

  const styleUrl = TILE_OPTIONS.find((t) => t.key === tileKey)?.url;

  const markers: MarkerConfig[] = CITIES.map((city) => ({
    id: city.id,
    coordinate: city.coordinate,
    title: city.name,
    description: `Tap to zoom to ${city.name}`,
  }));

  const handleMarkerPress = useCallback((markerId: string) => {
    const city = CITIES.find((c) => c.id === markerId);
    if (city) {
      mapRef.current?.animateToLocation(
        city.coordinate.latitude,
        city.coordinate.longitude,
        12,
      );
    }
  }, []);

  const handleLocationFound = useCallback((coord: Coordinate) => {
    mapRef.current?.animateToLocation(coord.latitude, coord.longitude, 15);
  }, []);

  return (
    <View style={styles.screen}>
      <OSMView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialCenter={INDIA_CENTER}
        initialZoom={5}
        styleUrl={styleUrl}
        markers={markers}
        showUserLocation
        onMarkerPress={handleMarkerPress}
      />

      {/* Tile style switcher */}
      <View style={styles.tileSwitcher}>
        {TILE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.tileChip, tileKey === opt.key && styles.tileChipActive]}
            onPress={() => setTileKey(opt.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tileChipText, tileKey === opt.key && styles.tileChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Zoom + compass controls */}
      <View style={styles.zoomControls}>
        <NavigationControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          size={40}
          color="#9C1AFF"
        />
      </View>

      {/* My location button */}
      <View style={styles.locationButton}>
        <LocationButton
          getCurrentLocation={() =>
            mapRef.current?.getCurrentLocation() ?? Promise.resolve(INDIA_CENTER)
          }
          onLocationFound={handleLocationFound}
          color="#9C1AFF"
          size={40}
        />
      </View>
    </View>
  );
}

// ─── Screen 2: Shapes ────────────────────────────────────────────────────────
// Shows: Polyline route, Circle overlays

function ShapesScreen() {
  const mapRef = useRef<OSMViewRef>(null);

  const polylines: PolylineConfig[] = [
    {
      id: 'mumbai-pune',
      coordinates: [
        { latitude: 19.0760, longitude: 72.8777 }, // Mumbai
        { latitude: 18.9400, longitude: 73.1300 }, // Khopoli
        { latitude: 18.5204, longitude: 73.8567 }, // Pune
      ],
      strokeColor: '#007AFF',
      strokeWidth: 4,
    },
  ];

  const circles: CircleConfig[] = [
    {
      id: 'mumbai-radius',
      center: { latitude: 19.0760, longitude: 72.8777 },
      radius: 20000,
      fillColor: 'rgba(0, 122, 255, 0.08)',
      strokeColor: '#007AFF',
      strokeWidth: 2,
    },
    {
      id: 'pune-radius',
      center: { latitude: 18.5204, longitude: 73.8567 },
      radius: 10000,
      fillColor: 'rgba(52, 199, 89, 0.1)',
      strokeColor: '#34C759',
      strokeWidth: 2,
    },
  ];

  return (
    <View style={styles.screen}>
      <OSMView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialCenter={{ latitude: 18.8, longitude: 73.4 }}
        initialZoom={8}
        styleUrl={TILE_CONFIGS.openfreemapPositron.styleUrl}
        polylines={polylines}
        circles={circles}
      />

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Mumbai → Pune  (Shapes demo)</Text>
        <Text style={styles.legendRow}>Blue line — Polyline route</Text>
        <Text style={styles.legendRow}>Blue circle — Mumbai, 20 km radius</Text>
        <Text style={styles.legendRow}>Green circle — Pune, 10 km radius</Text>
      </View>
    </View>
  );
}

// ─── Screen 3: Location tracking ─────────────────────────────────────────────
// Shows: useLocationTracking hook with live status and coordinates

function LocationScreen() {
  const mapRef = useRef<OSMViewRef>(null);

  const {
    isTracking,
    status,
    currentLocation,
    error,
    startTracking,
    stopTracking,
  } = useLocationTracking(mapRef, {
    onLocationChange: (coord) => {
      mapRef.current?.animateToLocation(coord.latitude, coord.longitude, 15);
    },
  });

  const STATUS_LABELS: Record<typeof status, string> = {
    idle:                'Stopped',
    starting:            'Starting…',
    active:              'Active',
    stopping:            'Stopping…',
    error:               'Error',
    permission_required: 'Permission required',
    gps_disabled:        'GPS disabled',
  };

  return (
    <View style={styles.screen}>
      {/* Map — top 55% */}
      <View style={styles.locationMapWrap}>
        <OSMView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialCenter={INDIA_CENTER}
          initialZoom={5}
          styleUrl={TILE_CONFIGS.openfreemapLiberty.styleUrl}
          showUserLocation={isTracking}
          followUserLocation={isTracking}
        />
      </View>

      {/* Panel — bottom 45% */}
      <View style={styles.locationPanel}>
        <Text style={styles.panelTitle}>Location Tracking</Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isTracking ? '#34C759' : '#C7C7CC' },
            ]}
          />
          <Text style={styles.statusText}>{STATUS_LABELS[status]}</Text>
        </View>

        <View style={styles.coordBox}>
          <Text style={styles.coordLabel}>Current position</Text>
          {currentLocation ? (
            <Text style={styles.coordValue}>
              {currentLocation.latitude.toFixed(6)},{'\n'}
              {currentLocation.longitude.toFixed(6)}
            </Text>
          ) : (
            <Text style={[styles.coordValue, { color: '#C7C7CC' }]}>
              No fix yet
            </Text>
          )}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error.userMessage}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.toggleBtn, isTracking && styles.toggleBtnStop]}
          onPress={isTracking ? stopTracking : startTracking}
          activeOpacity={0.8}
        >
          <Text style={styles.toggleBtnText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('map');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>expo-osm-sdk demo</Text>
      </View>

      <View style={styles.body}>
        {screen === 'map'      && <MapScreen />}
        {screen === 'shapes'   && <ShapesScreen />}
        {screen === 'location' && <LocationScreen />}
      </View>

      <TabBar active={screen} onChange={setScreen} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Root
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  body: {
    flex: 1,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: '#9C1AFF',
    marginTop: -1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabLabelActive: {
    color: '#9C1AFF',
    fontWeight: '600',
  },

  // Common
  screen: {
    flex: 1,
  },

  // Map screen
  tileSwitcher: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  tileChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  tileChipActive: {
    backgroundColor: '#9C1AFF',
  },
  tileChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  tileChipTextActive: {
    color: '#FFFFFF',
  },
  zoomControls: {
    position: 'absolute',
    right: 12,
    top: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  locationButton: {
    position: 'absolute',
    right: 12,
    top: 190,
  },

  // Shapes screen
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  legendRow: {
    fontSize: 13,
    color: '#3C3C43',
    marginBottom: 3,
  },

  // Location screen
  locationMapWrap: {
    flex: 0.55,
  },
  locationPanel: {
    flex: 0.45,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  coordBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  coordLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  toggleBtn: {
    backgroundColor: '#9C1AFF',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  toggleBtnStop: {
    backgroundColor: '#FF3B30',
  },
  toggleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
