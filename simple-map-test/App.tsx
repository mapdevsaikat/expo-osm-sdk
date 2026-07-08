import React, { useRef, useState, useCallback, useMemo, type RefObject } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  OSMView,
  OSMErrorBoundary,
  LocationButton,
  NavigationControls,
  TILE_CONFIGS,
  useLocationTracking,
  type OSMViewRef,
  type Coordinate,
  type LocationFix,
  type MapRegion,
  type MarkerConfig,
  type PolylineConfig,
  type CircleConfig,
} from 'expo-osm-sdk';
import { CITIES, INDIA_CENTER } from './src/constants';
import { Onboarding, hasSeenOnboarding, markOnboardingSeen } from './src/components/Onboarding';

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'map' | 'shapes' | 'route' | 'location';
type TileKey = 'voyager' | 'liberty' | 'positron' | 'bright' | 'dark';

/** Reports a crash (OSMErrorBoundary) or a recovered production error
 *  (OSMView's `onError` prop) up to the root banner. */
type MapErrorReporter = (error: Error) => void;

// Carto Voyager is the default everywhere in this demo: it's a lighter vector
// style than OpenFreeMap and loads noticeably faster on a cold cache, which
// is what most first-time testers actually hit. OpenFreeMap styles remain
// available as chips on the Map tab for comparison.
const DEFAULT_STYLE_URL = TILE_CONFIGS.openMapTiles.styleUrl;

const TILE_OPTIONS: { key: TileKey; label: string; url: string }[] = [
  { key: 'voyager',  label: 'Voyager',  url: DEFAULT_STYLE_URL },
  { key: 'liberty',  label: 'Liberty',  url: TILE_CONFIGS.openfreemapLiberty.styleUrl },
  { key: 'positron', label: 'Positron', url: TILE_CONFIGS.openfreemapPositron.styleUrl },
  { key: 'bright',   label: 'Bright',   url: TILE_CONFIGS.openfreemapBright.styleUrl },
  { key: 'dark',     label: 'Dark',     url: TILE_CONFIGS.openfreemapDark.styleUrl },
];

/** Compact map controls — Apple Maps–style mini cluster (see NavigationControls / LocationButton props). */
const MAP_CONTROLS_THEME = {
  color: '#007AFF',
  iconColor: '#333333',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderColor: '#E0E0E0',
} as const;

// ─── Reliability helpers ──────────────────────────────────────────────────────
// Every ref call in this app is async and can reject (native module missing,
// unsupported method, view not ready, etc). These helpers make sure a
// rejection always surfaces as a friendly alert instead of an unhandled
// promise rejection or a red screen.

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function safeCall(promise: Promise<unknown> | undefined | null, label: string): void {
  promise?.catch((err) => {
    console.warn(`[expo-osm-sdk demo] ${label} failed:`, errorMessage(err));
    Alert.alert(label, errorMessage(err));
  });
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) {
  const tabs: { id: Screen; label: string }[] = [
    { id: 'map',      label: 'Map' },
    { id: 'shapes',   label: 'Shapes' },
    { id: 'route',    label: 'Route' },
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
// Shows: OSMView, city markers, tile switcher, LocationButton, NavigationControls,
// isViewReady() status pill, invalid-marker sanitization, and takeSnapshot() demo.

type ViewReadyState = 'checking' | 'ready' | 'unavailable';

const VIEW_READY_LABELS: Record<ViewReadyState, string> = {
  checking:    'Loading map…',
  ready:       'Map ready',
  unavailable: 'Map unavailable',
};

function MapScreen({ onMapError }: { onMapError: MapErrorReporter }) {
  const mapRef = useRef<OSMViewRef>(null) as RefObject<OSMViewRef>;
  const [tileKey, setTileKey] = useState<TileKey>('voyager');
  const [myLocation, setMyLocation] = useState<Coordinate | null>(null);
  // Once the user presses the locate button, follow their movement
  const [following, setFollowing] = useState(false);
  // isViewReady() demo — set once onMapReady fires
  const [viewReady, setViewReady] = useState<ViewReadyState>('checking');
  // Reliability demo: inject one intentionally invalid marker and confirm the
  // SDK's always-on overlay sanitization (v2.2.0+) skips it with a console
  // warning instead of crashing or forwarding bad data to the native layer.
  const [injectInvalidMarker, setInjectInvalidMarker] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [pitch, setPitch] = useState(0);

  const styleUrl = TILE_OPTIONS.find((t) => t.key === tileKey)?.url;

  const markers: MarkerConfig[] = useMemo(() => {
    const base: MarkerConfig[] = CITIES.map((city) => ({
      id: city.id,
      coordinate: city.coordinate,
      title: city.name,
      description: `Tap to zoom to ${city.name}`,
    }));
    if (injectInvalidMarker) {
      base.push({
        id: 'debug-invalid-marker',
        // Out of range on purpose (lat must be -90..90, lng -180..180).
        coordinate: { latitude: 400, longitude: 999 },
        title: 'Invalid debug marker (should never render)',
      });
    }
    return base;
  }, [injectInvalidMarker]);

  const handleMapReady = useCallback(() => {
    mapRef.current
      ?.isViewReady()
      .then((ready) => setViewReady(ready ? 'ready' : 'unavailable'))
      .catch(() => setViewReady('unavailable'));

    // Location permission is requested lazily, only when the user taps the
    // location button (see LocationButton's `requestPermission` prop below).
    // Map tiles never need it — asking for it upfront, at the same moment
    // tiles are loading, is what made testers think the two were related.
  }, []);

  const handleMarkerPress = useCallback((markerId: string) => {
    // Tapping a city marker stops following the user
    setFollowing(false);
    const city = CITIES.find((c) => c.id === markerId);
    if (city) {
      safeCall(
        mapRef.current?.animateToLocation(
          city.coordinate.latitude,
          city.coordinate.longitude,
          12,
        ),
        'Animate to city',
      );
    }
  }, []);

  // Called once by LocationButton after the first GPS fix
  const handleLocationFound = useCallback((coord: Coordinate) => {
    setMyLocation(coord);
    setFollowing(true);
    safeCall(
      mapRef.current?.animateToLocation(coord.latitude, coord.longitude, 15),
      'Animate to location',
    );
  }, []);

  const handleLocationError = useCallback((message: string) => {
    Alert.alert('Location unavailable', message);
  }, []);

  // Called by the native location component on every GPS update
  const handleUserLocationChange = useCallback((coord: Coordinate) => {
    setMyLocation(coord);
  }, []);

  const handleRegionChange = useCallback((region: MapRegion) => {
    if (region.bearing !== undefined) setBearing(region.bearing);
    if (region.pitch !== undefined) setPitch(region.pitch);
  }, []);

  const handleResetBearing = useCallback(() => {
    safeCall(mapRef.current?.setBearing(0), 'Reset bearing');
    setBearing(0);
  }, []);

  const handleResetPitch = useCallback(() => {
    safeCall(mapRef.current?.setPitch(0), 'Reset pitch');
    setPitch(0);
  }, []);

  // Snapshot demo: captures the current map view as a base64 data URI.
  const handleTakeSnapshot = useCallback(() => {
    mapRef.current
      ?.takeSnapshot()
      .then((dataUri) => {
        const format = dataUri.startsWith('data:image/')
          ? dataUri.slice(5, dataUri.indexOf(';'))
          : 'unknown';
        Alert.alert(
          'Snapshot captured',
          `${dataUri.length.toLocaleString()} character data URI (${format}).`,
        );
      })
      .catch((err) => {
        console.warn('[expo-osm-sdk demo] takeSnapshot failed:', errorMessage(err));
        Alert.alert('takeSnapshot failed', errorMessage(err));
      });
  }, []);

  return (
    <View style={styles.screen}>
      <OSMErrorBoundary onError={(error) => onMapError(error)}>
        <OSMView
          ref={mapRef}
          style={StyleSheet.absoluteFill as any}
          initialCenter={INDIA_CENTER}
          initialZoom={5}
          styleUrl={styleUrl}
          markers={markers}
          showUserLocation
          followUserLocation={following}
          rotateEnabled
          pitchEnabled
          onMarkerPress={handleMarkerPress}
          onUserLocationChange={handleUserLocationChange}
          onRegionChange={handleRegionChange}
          onMapReady={handleMapReady}
          onError={(error) => onMapError(error)}
        />
      </OSMErrorBoundary>

      {/* Loading overlay — shown until onMapReady fires (style + tiles loaded).
          Avoids the "is this broken?" impression during a cold-cache first
          launch by being explicit about what's happening. */}
      {viewReady === 'checking' && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#9C1AFF" />
          <Text style={styles.loadingOverlayText}>Loading map…</Text>
          <Text style={styles.loadingOverlaySubtext}>
            First launch may take a few seconds while tiles download.
          </Text>
        </View>
      )}

      {/* isViewReady() status pill + invalid-marker debug toggle */}
      <View style={styles.statusBar}>
        <View style={styles.statusBarLeft}>
          <View
            style={[
              styles.statusDotSmall,
              viewReady === 'ready' && styles.statusDotReady,
              viewReady === 'unavailable' && styles.statusDotError,
            ]}
          />
          <Text style={styles.statusBarText}>{VIEW_READY_LABELS[viewReady]}</Text>
        </View>
        {__DEV__ && (
          <View style={styles.statusBarRight}>
            <Text style={styles.statusBarText}>Bad marker</Text>
            <Switch
              value={injectInvalidMarker}
              onValueChange={(enabled) => {
                setInjectInvalidMarker(enabled);
                if (enabled) {
                  console.info(
                    '[expo-osm-sdk demo] Injecting debug-invalid-marker — SDK sanitization will skip it (see console.debug).',
                  );
                }
              }}
              trackColor={{ true: '#9C1AFF' }}
            />
          </View>
        )}
      </View>

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

      {/* Compact zoom + compass + location + dev tools (right edge, single column) */}
      <View style={styles.mapControlsCluster}>
        <NavigationControls
          compact
          {...MAP_CONTROLS_THEME}
          onZoomIn={() => safeCall(mapRef.current?.zoomIn(), 'Zoom in')}
          onZoomOut={() => safeCall(mapRef.current?.zoomOut(), 'Zoom out')}
          onResetBearing={handleResetBearing}
          onResetPitch={handleResetPitch}
          bearing={bearing}
          pitch={pitch}
        />
        <LocationButton
          compact
          {...MAP_CONTROLS_THEME}
          requestPermission={() =>
            mapRef.current?.requestLocationPermission() ?? Promise.resolve(false)
          }
          getCurrentLocation={() =>
            mapRef.current?.getCurrentLocation() ?? Promise.resolve(INDIA_CENTER)
          }
          onLocationFound={handleLocationFound}
          onLocationError={handleLocationError}
        />
        {__DEV__ && (
          <TouchableOpacity
            style={styles.devSnapButton}
            onPress={handleTakeSnapshot}
            activeOpacity={0.55}
            accessibilityRole="button"
            accessibilityLabel="Take map snapshot (demo)"
          >
            <Text style={styles.devSnapButtonText}>SNAP</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Live GPS coordinate card — appears after first fix, stays visible */}
      {myLocation && (
        <View style={styles.gpsCard}>
          <View style={styles.gpsCardRow}>
            <View style={[styles.gpsDot, following && styles.gpsDotActive]} />
            <Text style={styles.gpsLabel}>
              {following ? 'LIVE LOCATION' : 'MY LOCATION'}
            </Text>
          </View>
          <Text style={styles.gpsValue}>
            {myLocation.latitude.toFixed(6)},{'  '}{myLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Screen 2: Shapes ────────────────────────────────────────────────────────
// Shows: Polyline route, Circle overlays
//
// Native bug workaround — STILL REQUIRED as of SDK v2.2.0:
// addCirclesToMap()/addPolylinesToMap() on Android (and the equivalent iOS
// path) are only invoked from the prop setters, not from onMapReady. If the
// `circles`/`polylines` props are set before the native map view exists, the
// setter's `maplibreMap?.let { ... }` guard silently no-ops and the shapes
// are never retried once the map becomes ready. Verified against the current
// native source — this was not part of the v2.2.0 reliability fixes, so we
// keep the workaround: hold shapes in state as empty arrays until
// `onMapReady` fires, then populate them after a short delay for the style
// to finish loading.

const ROUTE_POLYLINES: PolylineConfig[] = [
  {
    id: 'mumbai-pune',
    coordinates: [
      { latitude: 19.0760, longitude: 72.8777 },
      { latitude: 18.9400, longitude: 73.1300 },
      { latitude: 18.5204, longitude: 73.8567 },
    ],
    strokeColor: '#007AFF',
    strokeWidth: 4,
  },
];

const ROUTE_CIRCLES: CircleConfig[] = [
  {
    id: 'mumbai-radius',
    center: { latitude: 19.0760, longitude: 72.8777 },
    radius: 20000,
    fillColor: 'rgba(0, 122, 255, 0.15)',
    strokeColor: '#007AFF',
    strokeWidth: 2,
  },
  {
    id: 'pune-radius',
    center: { latitude: 18.5204, longitude: 73.8567 },
    radius: 10000,
    fillColor: 'rgba(52, 199, 89, 0.15)',
    strokeColor: '#34C759',
    strokeWidth: 2,
  },
];

function ShapesScreen({ onMapError }: { onMapError: MapErrorReporter }) {
  const mapRef = useRef<OSMViewRef>(null) as RefObject<OSMViewRef>;
  // Start empty — native will drop shapes set before map is ready
  const [polylines, setPolylines] = useState<PolylineConfig[]>([]);
  const [circles, setCircles] = useState<CircleConfig[]>([]);

  const handleMapReady = useCallback(() => {
    // Small delay ensures the style is fully loaded before adding shapes
    setTimeout(() => {
      setPolylines(ROUTE_POLYLINES);
      setCircles(ROUTE_CIRCLES);
    }, 300);
  }, []);

  return (
    <View style={styles.screen}>
      <OSMErrorBoundary onError={(error) => onMapError(error)}>
        <OSMView
          ref={mapRef}
          style={StyleSheet.absoluteFill as any}
          initialCenter={{ latitude: 18.8, longitude: 73.4 }}
          initialZoom={8}
          styleUrl={DEFAULT_STYLE_URL}
          polylines={polylines}
          circles={circles}
          onMapReady={handleMapReady}
          onError={(error) => onMapError(error)}
        />
      </OSMErrorBoundary>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Mumbai → Pune  (Shapes demo)</Text>
        <Text style={styles.legendRow}>Blue line — Polyline route</Text>
        <Text style={styles.legendRow}>Blue circle — Mumbai, 20 km radius</Text>
        <Text style={styles.legendRow}>Green circle — Pune, 10 km radius</Text>
      </View>
    </View>
  );
}

// ─── Screen 3: Route ─────────────────────────────────────────────────────────
// Exercises the ref's displayRoute() / clearRoute() / fitRouteInView() —
// previously broken (rejected with a cryptic native error on every
// platform), now implemented in JS on top of polylines + camera primitives.

const ROUTE_STOP_IDS = ['kolkata', 'delhi', 'mumbai', 'bangalore'];
const ROUTE_STOPS = ROUTE_STOP_IDS
  .map((id) => CITIES.find((c) => c.id === id))
  .filter((c): c is (typeof CITIES)[number] => c !== undefined);
const ROUTE_COORDINATES: Coordinate[] = ROUTE_STOPS.map((c) => c.coordinate);

type RouteBusyState = 'draw' | 'clear' | 'fit' | null;

function RouteScreen({ onMapError }: { onMapError: MapErrorReporter }) {
  const mapRef = useRef<OSMViewRef>(null) as RefObject<OSMViewRef>;
  const [routeVisible, setRouteVisible] = useState(false);
  const [busy, setBusy] = useState<RouteBusyState>(null);

  const handleDrawRoute = useCallback(async () => {
    setBusy('draw');
    try {
      await mapRef.current?.displayRoute(ROUTE_COORDINATES, {
        color: '#9C1AFF',
        width: 5,
        opacity: 0.9,
        fitRoute: true,
        padding: 60,
      });
      setRouteVisible(true);
    } catch (err) {
      Alert.alert('Draw route failed', errorMessage(err));
    } finally {
      setBusy(null);
    }
  }, []);

  const handleClearRoute = useCallback(async () => {
    setBusy('clear');
    try {
      await mapRef.current?.clearRoute();
      setRouteVisible(false);
    } catch (err) {
      Alert.alert('Clear route failed', errorMessage(err));
    } finally {
      setBusy(null);
    }
  }, []);

  const handleFitRoute = useCallback(async () => {
    setBusy('fit');
    try {
      await mapRef.current?.fitRouteInView(ROUTE_COORDINATES, 60);
    } catch (err) {
      Alert.alert('Fit route failed', errorMessage(err));
    } finally {
      setBusy(null);
    }
  }, []);

  return (
    <View style={styles.screen}>
      <OSMErrorBoundary onError={(error) => onMapError(error)}>
        <OSMView
          ref={mapRef}
          style={StyleSheet.absoluteFill as any}
          initialCenter={INDIA_CENTER}
          initialZoom={4}
          styleUrl={DEFAULT_STYLE_URL}
          onError={(error) => onMapError(error)}
        />
      </OSMErrorBoundary>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Route demo</Text>
        <Text style={styles.legendRow}>{ROUTE_STOPS.map((c) => c.name).join(' → ')}</Text>
        <Text style={[styles.legendRow, styles.legendStatus]}>
          {routeVisible ? 'Route displayed — try Fit route or Clear route.' : 'No route drawn yet.'}
        </Text>

        <View style={styles.routeButtonRow}>
          <TouchableOpacity
            style={[styles.routeButton, styles.routeButtonPrimary]}
            onPress={handleDrawRoute}
            disabled={busy !== null}
            activeOpacity={0.8}
          >
            <Text style={styles.routeButtonTextPrimary}>
              {busy === 'draw' ? 'Drawing…' : 'Draw route'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.routeButton}
            onPress={handleFitRoute}
            disabled={busy !== null || !routeVisible}
            activeOpacity={0.8}
          >
            <Text style={styles.routeButtonText}>
              {busy === 'fit' ? 'Fitting…' : 'Fit route'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.routeButton, styles.routeButtonDanger]}
            onPress={handleClearRoute}
            disabled={busy !== null || !routeVisible}
            activeOpacity={0.8}
          >
            <Text style={styles.routeButtonTextDanger}>
              {busy === 'clear' ? 'Clearing…' : 'Clear route'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Screen 4: Location tracking ─────────────────────────────────────────────
// Shows: useLocationTracking hook with live status and coordinates

function LocationScreen({ onMapError }: { onMapError: MapErrorReporter }) {
  const mapRef = useRef<OSMViewRef>(null) as RefObject<OSMViewRef>;
  // Live GPS fix fed by onUserLocationChange — updates on every fix, now with
  // altitude/accuracy/bearing when the platform reports them.
  const [liveFix, setLiveFix] = useState<LocationFix | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const {
    isTracking,
    status,
    error,
    startTracking,
    stopTracking,
    trackPoints,
    ingestLocationFix,
    clearTrack,
    exportTrackAsGpx,
  } = useLocationTracking(mapRef, {
    recordTrack: true,
    // Filters out GPS jitter while stationary; keeps genuine movement.
    minTrackDistanceMeters: 3,
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

  const handleUserLocation = useCallback((fix: LocationFix) => {
    setLiveFix(fix);
    ingestLocationFix(fix);
    if (isTracking) {
      safeCall(
        mapRef.current?.animateToLocation(fix.latitude, fix.longitude, 15),
        'Animate to location',
      );
    }
  }, [isTracking, ingestLocationFix]);

  const handleToggleTracking = useCallback(() => {
    if (isTracking) {
      setLiveFix(null);
      stopTracking().catch((err) => {
        console.warn('[expo-osm-sdk demo] toggle tracking failed:', errorMessage(err));
        Alert.alert('Location tracking', errorMessage(err));
      });
      return;
    }

    // Clear any previous fix so stale coordinates are not shown as live
    setLiveFix(null);
    startTracking().catch((err) => {
      console.warn('[expo-osm-sdk demo] toggle tracking failed:', errorMessage(err));
      Alert.alert('Location tracking', errorMessage(err));
    });
  }, [isTracking, startTracking, stopTracking]);

  // Builds the recorded track as GPX, writes it to cache, and opens the
  // share sheet so the user can save it to Files / Drive / etc. This is
  // what the demo app's storage permission (see enableTrackExport in
  // app.json) is actually used for — map tiles never touch storage.
  const handleDownloadTrack = useCallback(async () => {
    const gpx = exportTrackAsGpx({ trackName: 'Expo OSM Demo Track' });
    if (!gpx) {
      Alert.alert('Download Track', 'Record at least 2 GPS points before exporting.');
      return;
    }

    setIsExporting(true);
    try {
      const file = new FileSystem.File(FileSystem.Paths.cache, `expo-osm-track-${Date.now()}.gpx`);
      file.write(gpx);

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Download Track', `Track saved to:\n${file.uri}`);
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/gpx+xml',
        UTI: 'com.topografix.gpx',
        dialogTitle: 'Save GPX track',
      });
    } catch (err) {
      console.warn('[expo-osm-sdk demo] download track failed:', errorMessage(err));
      Alert.alert('Download Track failed', errorMessage(err));
    } finally {
      setIsExporting(false);
    }
  }, [exportTrackAsGpx]);

  return (
    <View style={styles.screen}>
      {/* Map — top 55% */}
      <View style={styles.locationMapWrap}>
        <OSMErrorBoundary onError={(error) => onMapError(error)}>
          <OSMView
            ref={mapRef}
            style={StyleSheet.absoluteFill as any}
            initialCenter={INDIA_CENTER}
            initialZoom={5}
            styleUrl={DEFAULT_STYLE_URL}
            showUserLocation={isTracking}
            followUserLocation={isTracking}
            onUserLocationChange={handleUserLocation}
            onError={(error) => onMapError(error)}
          />
        </OSMErrorBoundary>
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
          {liveFix ? (
            <>
              <Text style={styles.coordValue}>
                {liveFix.latitude.toFixed(6)},{'\n'}
                {liveFix.longitude.toFixed(6)}
              </Text>
              <Text style={styles.coordAccLabel}>Live GPS fix</Text>
              <View style={styles.gpsStatsRow}>
                {typeof liveFix.altitude === 'number' && (
                  <Text style={styles.gpsStatItem}>Alt {liveFix.altitude.toFixed(0)} m</Text>
                )}
                {typeof liveFix.accuracy === 'number' && (
                  <Text style={styles.gpsStatItem}>±{liveFix.accuracy.toFixed(0)} m</Text>
                )}
                {typeof liveFix.bearing === 'number' && (
                  <Text style={styles.gpsStatItem}>{liveFix.bearing.toFixed(0)}°</Text>
                )}
              </View>
            </>
          ) : (
            <Text style={[styles.coordValue, { color: '#C7C7CC' }]}>
              {isTracking ? 'Waiting for GPS fix…' : 'Start tracking to see position'}
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
          onPress={handleToggleTracking}
          activeOpacity={0.8}
        >
          <Text style={styles.toggleBtnText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>

        {/* GPX track export — explore movement tracking on this device */}
        <View style={styles.trackSection}>
          <Text style={styles.trackCountText}>
            {trackPoints.length} point{trackPoints.length === 1 ? '' : 's'} recorded
          </Text>
          <View style={styles.trackButtonRow}>
            <TouchableOpacity
              style={[styles.trackButton, styles.trackButtonSecondary]}
              onPress={clearTrack}
              disabled={trackPoints.length === 0}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.trackButtonSecondaryText,
                  trackPoints.length === 0 && styles.trackButtonTextDisabled,
                ]}
              >
                Clear Track
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.trackButton, styles.trackButtonPrimary]}
              onPress={handleDownloadTrack}
              disabled={trackPoints.length < 2 || isExporting}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.trackButtonPrimaryText,
                  (trackPoints.length < 2 || isExporting) && styles.trackButtonTextDisabled,
                ]}
              >
                {isExporting ? 'Preparing…' : 'Download Track (GPX)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('map');
  // Global crash/error banner — fed by every screen's OSMErrorBoundary and
  // OSMView onError prop, so a map failure on any tab is visible immediately
  // instead of silently failing or taking down the app.
  const [mapError, setMapError] = useState<string | null>(null);
  // One-time intro tour — lazy-init so the file check runs once, synchronously,
  // before first paint (no loading flicker). Persisted via Onboarding.tsx so
  // it never reappears after the tester dismisses it.
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());

  const handleMapError = useCallback<MapErrorReporter>((error) => {
    console.error('[expo-osm-sdk demo] map error:', error.message);
    setMapError(error.message);
  }, []);

  const handleDismissOnboarding = useCallback(() => {
    markOnboardingSeen();
    setShowOnboarding(false);
  }, []);

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Onboarding visible={showOnboarding} onDismiss={handleDismissOnboarding} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expo OSM Demo</Text>
      </View>

      {mapError && (
        <View style={styles.crashBanner}>
          <Text style={styles.crashBannerText} numberOfLines={2}>
            ⚠️ Map reported an error: {mapError}
          </Text>
          <TouchableOpacity onPress={() => setMapError(null)} hitSlop={8}>
            <Text style={styles.crashBannerDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.body}>
        {screen === 'map'      && <MapScreen onMapError={handleMapError} />}
        {screen === 'shapes'   && <ShapesScreen onMapError={handleMapError} />}
        {screen === 'route'    && <RouteScreen onMapError={handleMapError} />}
        {screen === 'location' && <LocationScreen onMapError={handleMapError} />}
      </View>

      <TabBar active={screen} onChange={setScreen} />
    </SafeAreaView>
    </SafeAreaProvider>
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

  // Crash / error banner
  crashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF3CD',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#FFE69C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  crashBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
  },
  crashBannerDismiss: {
    fontSize: 12,
    fontWeight: '700',
    color: '#856404',
    textDecorationLine: 'underline',
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

  // Map screen — loading overlay (shown until onMapReady)
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    gap: 6,
  },
  loadingOverlayText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 8,
  },
  loadingOverlaySubtext: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Map screen — status bar (isViewReady + invalid marker toggle)
  statusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  statusBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3C3C43',
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C7C7CC',
  },
  statusDotReady: {
    backgroundColor: '#34C759',
  },
  statusDotError: {
    backgroundColor: '#FF3B30',
  },

  // Map screen
  tileSwitcher: {
    position: 'absolute',
    top: 46,
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
  mapControlsCluster: {
    position: 'absolute',
    right: 12,
    top: 104,
    alignItems: 'center',
    gap: 8,
  },
  devSnapButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: MAP_CONTROLS_THEME.backgroundColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MAP_CONTROLS_THEME.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  devSnapButtonText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#9C1AFF',
    letterSpacing: 0.3,
  },

  // GPS coordinate card (Map screen)
  gpsCard: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  gpsCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 6,
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C7C7CC',
  },
  gpsDotActive: {
    backgroundColor: '#34C759',
  },
  gpsLabel: {
    fontSize: 10,
    color: '#8E8E93',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  gpsValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500',
  },

  // Shapes / Route screens
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
  legendStatus: {
    marginTop: 4,
    fontStyle: 'italic',
    color: '#8E8E93',
  },

  // Route screen buttons
  routeButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  routeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  routeButtonPrimary: {
    backgroundColor: '#9C1AFF',
  },
  routeButtonDanger: {
    backgroundColor: '#FFF0F0',
  },
  routeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  routeButtonTextPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  routeButtonTextDanger: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
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
  coordAccLabel: {
    fontSize: 10,
    color: '#34C759',
    marginTop: 4,
    fontWeight: '500',
  },
  gpsStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  gpsStatItem: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3C3C43',
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

  // GPX track export (Location screen)
  trackSection: {
    marginTop: 14,
  },
  trackCountText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    textAlign: 'center',
  },
  trackButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trackButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  trackButtonPrimary: {
    backgroundColor: '#34C759',
  },
  trackButtonSecondary: {
    backgroundColor: '#F2F2F7',
  },
  trackButtonPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trackButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  trackButtonTextDisabled: {
    opacity: 0.5,
  },
});
