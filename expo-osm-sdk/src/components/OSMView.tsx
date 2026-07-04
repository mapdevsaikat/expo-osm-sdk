import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Import types and utilities
import type {
  OSMViewProps,
  OSMViewRef,
  MarkerConfig,
  PolylineConfig,
  PolygonConfig,
  CircleConfig,
  Coordinate,
  RouteDisplayOptions
} from '../types';
import { DEFAULT_CONFIG } from '../types';
import { isValidCoordinate, normalizeCoordinate } from '../utils/coordinate';

// __DEV__ is defined by React Native / Metro; guard for other environments (e.g. Jest)
const isDevEnvironment = (): boolean =>
  typeof __DEV__ !== 'undefined' && __DEV__ === true;

/** Log skipped overlay entries — debug in dev (less noisy), warn in production. */
const logSanitizedOverlaySkip = (
  kind: 'markers' | 'circles' | 'polylines' | 'polygons',
  index: number,
  id: string | undefined
): void => {
  const message = `OSMView: skipping invalid ${kind}[${index}] (id: ${id ?? 'missing'})`;
  if (isDevEnvironment()) {
    console.debug(message);
  } else {
    console.warn(message);
  }
};

// Internal id used by displayRoute so it never collides with user polylines
const ROUTE_POLYLINE_ID = '__expo_osm_sdk_route__';

// Get native view manager and native module.
// Lazy-loaded on first render — a static `import from 'expo-modules-core'` evaluates
// EventEmitter at module load time (`globalThis.expo.EventEmitter`) and crashes with
// "[runtime not ready]: Cannot read property 'EventEmitter' of undefined" when the
// Expo native runtime has not finished bootstrapping yet (common on dev-client cold
// start, especially on physical devices opening a debug APK without Metro).
let NativeOSMView: any = null;
let NativeOSMModule: any = null;
let isNativeModuleAvailable = false;
let nativeModuleInitAttempted = false;

function ensureNativeModuleInitialized(): void {
  if (nativeModuleInitAttempted) {
    return;
  }
  nativeModuleInitAttempted = true;

  try {
    const { requireNativeModule, requireNativeViewManager } =
      require('expo-modules-core') as typeof import('expo-modules-core');

    // Modern Expo modules pattern - get the view component directly from the module
    const ExpoOsmSdkModule = requireNativeModule('ExpoOsmSdk');
    NativeOSMModule = ExpoOsmSdkModule;

    // For modern Expo modules, the view is available as a component
    // Try to get the view component - it might be available as a property or through requireNativeViewManager
    try {
      NativeOSMView = requireNativeViewManager('ExpoOsmSdk');
    } catch {
      // If requireNativeViewManager fails, we'll use the module's view component
      // This will be handled in the component rendering
    }

    // Better Expo Go detection - check for development client vs Expo Go
    // In development builds, Constants.executionEnvironment will be different
    let isExpoGo = false;
    try {
      const Constants = require('expo-constants').default;
      // In Expo Go: executionEnvironment is 'expoGo'
      // In development builds: executionEnvironment is 'development' or similar
      isExpoGo = Constants.executionEnvironment === 'expoGo';
    } catch {
      // Fallback to old detection if Constants is not available
      isExpoGo = !!(global as any).expo;
    }

    const isWeb = Platform.OS === 'web';

    // Module is available if:
    // 1. We have the native module
    // 2. We're NOT in Expo Go
    // 3. We're NOT on web
    isNativeModuleAvailable = !!NativeOSMModule && !isExpoGo && !isWeb;
  } catch {
    // Native module not available (e.g., in Expo Go or web)
    isNativeModuleAvailable = false;
  }
}

export const TILE_CONFIGS = {
  raster: {
    name: 'OpenStreetMap Raster',
    type: 'Raster' as const,
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  vector: {
    name: 'Carto',
    type: 'Vector' as const,
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    // Backup URL in case the primary fails
    backupUrl: 'https://maps.tilehosting.com/styles/basic/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
  }
} as const;

// Estimate a zoom level that fits a lat/lng span (rough heuristic, good enough
// for fitting routes/markers without native bounds support)
const zoomForDelta = (delta: number): number => {
  if (delta > 40) return 2;
  if (delta > 20) return 3;
  if (delta > 10) return 4;
  if (delta > 5) return 5;
  if (delta > 2) return 7;
  if (delta > 1) return 9;
  if (delta > 0.5) return 10;
  if (delta > 0.25) return 11;
  if (delta > 0.1) return 12;
  if (delta > 0.05) return 13;
  if (delta > 0.01) return 15;
  return 16;
};

// Compute center + zoom that roughly fits a set of coordinates
const cameraForCoordinates = (
  coordinates: Coordinate[]
): { latitude: number; longitude: number; zoom: number } | null => {
  const valid = coordinates.filter(isValidCoordinate);
  if (valid.length === 0) return null;

  let minLat = valid[0]!.latitude;
  let maxLat = valid[0]!.latitude;
  let minLng = valid[0]!.longitude;
  let maxLng = valid[0]!.longitude;

  for (const coord of valid) {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  }

  // 1.2 factor leaves a margin around the fitted bounds
  const delta = Math.max(maxLat - minLat, maxLng - minLng) * 1.2;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    zoom: zoomForDelta(delta),
  };
};

const OSMView = forwardRef<OSMViewRef, OSMViewProps>(({
  style,
  initialCenter = { latitude: 0, longitude: 0 },
  initialZoom = 10,
  tileServerUrl = DEFAULT_CONFIG.tileServerUrl, // Use vector tiles by default
  styleUrl = DEFAULT_CONFIG.styleUrl, // Add styleUrl support
  markers = [],
  circles = [] as CircleConfig[],
  polylines = [] as PolylineConfig[],
  polygons = [] as PolygonConfig[],
  showUserLocation = false,
  followUserLocation = false,
  showsCompass = false,
  showsScale = false,
  showsZoomControls = false,
  rotateEnabled = true,
  scrollEnabled = true,
  zoomEnabled = true,
  pitchEnabled = true,
  onMapReady,
  onRegionChange,
  onMarkerPress,
  onPress,
  onUserLocationChange,
  onError,
}, ref) => {
  ensureNativeModuleInitialized();

  const nativeViewRef = React.useRef<any>(null);
  // Track container size so the native map receives explicit dimensions after rotation.
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
  const handleContainerLayout = React.useCallback((event: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  }, []);
  const mapSizeStyle =
    containerSize.width > 0 && containerSize.height > 0
      ? { width: containerSize.width, height: containerSize.height }
      : null;

  // Route drawn via displayRoute(); merged into the polylines passed to native
  const [routePolyline, setRoutePolyline] = React.useState<PolylineConfig | null>(null);

  // Errors recovered from during render; reported via onError after commit
  const recoveredErrorsRef = React.useRef<Error[]>([]);
  const reportRecoveredError = (error: Error) => {
    console.error(`OSMView: ${error.message}`);
    recoveredErrorsRef.current.push(error);
  };

  // --- Prop validation -------------------------------------------------
  // Development: throw with a clear message so mistakes are caught early.
  // Production: never crash the host app - clamp/fall back and emit onError.

  const safeInitialCenter = React.useMemo<Coordinate>(() => {
    if (isValidCoordinate(initialCenter)) {
      return initialCenter;
    }
    const error = new Error(
      `Invalid initialCenter ${JSON.stringify(initialCenter)}: latitude must be -90..90 and longitude -180..180`
    );
    if (isDevEnvironment()) {
      throw error;
    }
    reportRecoveredError(error);
    if (
      initialCenter &&
      typeof initialCenter.latitude === 'number' &&
      typeof initialCenter.longitude === 'number' &&
      !isNaN(initialCenter.latitude) &&
      !isNaN(initialCenter.longitude)
    ) {
      return normalizeCoordinate(initialCenter);
    }
    return { latitude: 0, longitude: 0 };
  }, [initialCenter]);

  const safeInitialZoom = React.useMemo<number>(() => {
    if (typeof initialZoom === 'number' && !isNaN(initialZoom) && initialZoom >= 1 && initialZoom <= 20) {
      return initialZoom;
    }
    const error = new Error(`initialZoom must be a number between 1 and 20, got ${JSON.stringify(initialZoom)}`);
    if (isDevEnvironment()) {
      throw error;
    }
    reportRecoveredError(error);
    if (typeof initialZoom === 'number' && !isNaN(initialZoom)) {
      return Math.max(1, Math.min(20, initialZoom));
    }
    return 10;
  }, [initialZoom]);

  // --- Overlay sanitization (always on, dev AND production) -------------
  // Invalid overlay data is skipped instead of being passed to the native
  // layer where behavior is undefined. Dev logs use console.debug; production
  // uses console.warn so real bad data is still visible in release builds.

  const safeMarkers = React.useMemo<MarkerConfig[]>(() => {
    if (!Array.isArray(markers)) return [];
    return markers.filter((marker, index) => {
      if (marker && typeof marker.id === 'string' && isValidCoordinate(marker.coordinate)) {
        return true;
      }
      logSanitizedOverlaySkip('markers', index, marker?.id);
      return false;
    });
  }, [markers]);

  const safeCircles = React.useMemo<CircleConfig[]>(() => {
    if (!Array.isArray(circles)) return [];
    return circles.filter((circle, index) => {
      if (
        circle &&
        typeof circle.id === 'string' &&
        isValidCoordinate(circle.center) &&
        typeof circle.radius === 'number' &&
        circle.radius > 0
      ) {
        return true;
      }
      logSanitizedOverlaySkip('circles', index, circle?.id);
      return false;
    });
  }, [circles]);

  const safePolylines = React.useMemo<PolylineConfig[]>(() => {
    if (!Array.isArray(polylines)) return [];
    return polylines.filter((polyline, index) => {
      if (
        polyline &&
        typeof polyline.id === 'string' &&
        Array.isArray(polyline.coordinates) &&
        polyline.coordinates.length >= 2 &&
        polyline.coordinates.every(isValidCoordinate)
      ) {
        return true;
      }
      logSanitizedOverlaySkip('polylines', index, polyline?.id);
      return false;
    });
  }, [polylines]);

  const safePolygons = React.useMemo<PolygonConfig[]>(() => {
    if (!Array.isArray(polygons)) return [];
    return polygons.filter((polygon, index) => {
      if (
        polygon &&
        typeof polygon.id === 'string' &&
        Array.isArray(polygon.coordinates) &&
        polygon.coordinates.length >= 3 &&
        polygon.coordinates.every(isValidCoordinate)
      ) {
        return true;
      }
      logSanitizedOverlaySkip('polygons', index, polygon?.id);
      return false;
    });
  }, [polygons]);

  // Merge the displayRoute polyline into the polylines sent to native
  const nativePolylines = React.useMemo<PolylineConfig[]>(() => {
    return routePolyline ? [...safePolylines, routePolyline] : safePolylines;
  }, [safePolylines, routePolyline]);

  // Report recovered errors after commit (never during render)
  const onErrorRef = React.useRef(onError);
  onErrorRef.current = onError;
  React.useEffect(() => {
    if (recoveredErrorsRef.current.length > 0) {
      const errors = recoveredErrorsRef.current;
      recoveredErrorsRef.current = [];
      for (const error of errors) {
        try {
          onErrorRef.current?.(error);
        } catch {
          // user onError handler threw; nothing more we can do
        }
      }
    }
  });

  // Latest sanitized markers for imperative methods (avoids stale closures)
  const safeMarkersRef = React.useRef(safeMarkers);
  safeMarkersRef.current = safeMarkers;
  const safeInitialZoomRef = React.useRef(safeInitialZoom);
  safeInitialZoomRef.current = safeInitialZoom;

  // Helper function to wait for view to be ready
  const waitForViewReady = async (maxWaitTime = 10000): Promise<boolean> => {
    if (!isNativeModuleAvailable || !NativeOSMModule) {
      return false;
    }

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const isReady = await NativeOSMModule.isViewReady();
        if (isReady) {
          return true;
        }

        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        // If isViewReady is not available, assume view is ready if module is available
        return isNativeModuleAvailable;
      }
    }

    return false;
  };

  const requireNative = (): void => {
    if (!isNativeModuleAvailable || !NativeOSMModule) {
      throw new Error(
        'expo-osm-sdk: native module not available. Maps require a development build (not Expo Go); on web install maplibre-gl.'
      );
    }
  };

  const requireReadyNative = async (): Promise<void> => {
    requireNative();
    const isReady = await waitForViewReady();
    if (!isReady) {
      throw new Error('expo-osm-sdk: OSM view not ready');
    }
  };

  // Prop-driven APIs have no imperative native counterpart; reject with
  // a clear, documented error instead of `undefined is not a function`.
  const unsupported = (method: string, hint: string) =>
    async (..._args: any[]): Promise<never> => {
      throw new Error(`expo-osm-sdk: ${method}() is not supported on this platform. ${hint}`);
    };

  // Expose imperative methods via ref
  useImperativeHandle(ref, (): OSMViewRef => ({
    zoomIn: async () => {
      requireNative();
      await NativeOSMModule.zoomIn();
    },
    zoomOut: async () => {
      requireNative();
      await NativeOSMModule.zoomOut();
    },
    setZoom: async (zoom: number) => {
      requireNative();
      await NativeOSMModule.setZoom(zoom);
    },
    animateToLocation: async (latitude: number, longitude: number, zoom?: number) => {
      requireNative();
      await NativeOSMModule.animateToLocation(latitude, longitude, zoom ?? safeInitialZoomRef.current);
    },
    animateToRegion: async (region, duration = 1000) => {
      requireNative();
      const delta = Math.max(region.latitudeDelta, region.longitudeDelta);
      await NativeOSMModule.animateCamera({
        latitude: region.latitude,
        longitude: region.longitude,
        zoom: zoomForDelta(delta),
        duration,
      });
    },
    fitToMarkers: async (markerIds?: string[], _padding?: number) => {
      requireNative();
      const allMarkers = safeMarkersRef.current;
      const targets = markerIds && markerIds.length > 0
        ? allMarkers.filter(m => markerIds.includes(m.id))
        : allMarkers;
      const camera = cameraForCoordinates(targets.map(m => m.coordinate));
      if (!camera) {
        throw new Error('expo-osm-sdk: fitToMarkers() found no valid markers to fit');
      }
      await NativeOSMModule.animateCamera({ ...camera, duration: 800 });
    },
    requestLocationPermission: async () => {
      await requireReadyNative();
      return !!(await NativeOSMModule.requestLocationPermission());
    },
    getCurrentLocation: async () => {
      await requireReadyNative();
      return NativeOSMModule.getCurrentLocation();
    },
    startLocationTracking: async () => {
      await requireReadyNative();
      await NativeOSMModule.startLocationTracking();
    },
    stopLocationTracking: async () => {
      await requireReadyNative();
      await NativeOSMModule.stopLocationTracking();
    },
    waitForLocation: async (timeoutSeconds: number) => {
      await requireReadyNative();
      return NativeOSMModule.waitForLocation(timeoutSeconds);
    },
    isViewReady: async () => {
      if (!isNativeModuleAvailable || !NativeOSMModule) {
        return false;
      }
      try {
        return !!(await NativeOSMModule.isViewReady());
      } catch {
        return false;
      }
    },

    // Route display helpers - implemented in JS on top of the polylines
    // prop and camera primitives, so they work on every platform.
    displayRoute: async (coordinates: Coordinate[], options: RouteDisplayOptions = {}) => {
      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        throw new Error('expo-osm-sdk: displayRoute() requires at least 2 coordinates');
      }
      const valid = coordinates.filter(isValidCoordinate);
      if (valid.length < 2) {
        throw new Error('expo-osm-sdk: displayRoute() received invalid coordinates');
      }

      setRoutePolyline({
        id: ROUTE_POLYLINE_ID,
        coordinates: valid,
        strokeColor: options.color ?? '#007AFF',
        strokeWidth: options.width ?? 5,
        strokeOpacity: options.opacity ?? 0.8,
      });

      if (options.fitRoute) {
        const camera = cameraForCoordinates(valid);
        if (camera && isNativeModuleAvailable && NativeOSMModule) {
          await NativeOSMModule.animateCamera({ ...camera, duration: 800 });
        }
      }
    },
    clearRoute: async () => {
      setRoutePolyline(null);
    },
    fitRouteInView: async (coordinates: Coordinate[], _padding: number = 50) => {
      requireNative();
      const camera = cameraForCoordinates(coordinates ?? []);
      if (!camera) {
        throw new Error('expo-osm-sdk: fitRouteInView() received no valid coordinates');
      }
      await NativeOSMModule.animateCamera({ ...camera, duration: 800 });
    },

    // Camera orientation methods
    setPitch: async (pitch: number) => {
      await requireReadyNative();
      await NativeOSMModule.setPitch(pitch);
    },
    setBearing: async (bearing: number) => {
      await requireReadyNative();
      await NativeOSMModule.setBearing(bearing);
    },
    getPitch: async () => {
      await requireReadyNative();
      return NativeOSMModule.getPitch();
    },
    getBearing: async () => {
      await requireReadyNative();
      return NativeOSMModule.getBearing();
    },
    animateCamera: async (options) => {
      await requireReadyNative();
      await NativeOSMModule.animateCamera(options);
    },

    // Prop-driven data APIs - not imperative on native platforms
    addMarker: unsupported('addMarker', 'Use the `markers` prop instead.'),
    removeMarker: unsupported('removeMarker', 'Use the `markers` prop instead.'),
    updateMarker: unsupported('updateMarker', 'Use the `markers` prop instead.'),
    animateMarker: unsupported('animateMarker', 'Use the `markers` prop instead.'),
    showInfoWindow: unsupported('showInfoWindow', 'Info windows open on marker tap.'),
    hideInfoWindow: unsupported('hideInfoWindow', 'Info windows close on map tap.'),
    addPolyline: unsupported('addPolyline', 'Use the `polylines` prop instead.'),
    removePolyline: unsupported('removePolyline', 'Use the `polylines` prop instead.'),
    updatePolyline: unsupported('updatePolyline', 'Use the `polylines` prop instead.'),
    addPolygon: unsupported('addPolygon', 'Use the `polygons` prop instead.'),
    removePolygon: unsupported('removePolygon', 'Use the `polygons` prop instead.'),
    updatePolygon: unsupported('updatePolygon', 'Use the `polygons` prop instead.'),
    addCircle: unsupported('addCircle', 'Use the `circles` prop instead.'),
    removeCircle: unsupported('removeCircle', 'Use the `circles` prop instead.'),
    updateCircle: unsupported('updateCircle', 'Use the `circles` prop instead.'),
    addOverlay: unsupported('addOverlay', 'Use the `overlays` prop instead.'),
    removeOverlay: unsupported('removeOverlay', 'Use the `overlays` prop instead.'),
    updateOverlay: unsupported('updateOverlay', 'Use the `overlays` prop instead.'),

    // Utilities not yet backed by native implementations
    coordinateForPoint: unsupported('coordinateForPoint', 'Not implemented on this platform yet.'),
    pointForCoordinate: unsupported('pointForCoordinate', 'Not implemented on this platform yet.'),
    takeSnapshot: async (format?: 'png' | 'jpg', quality?: number) => {
      await requireReadyNative();
      return NativeOSMModule.takeSnapshot(format ?? 'png', quality ?? 1);
    },
  }), []);

  // Event handlers for native view
  const handleMapReady = () => {
    onMapReady?.();
  };

  const handleRegionChange = (event: any) => {
    const region = event?.nativeEvent ?? event;
    if (region && typeof region.latitude === 'number') {
      onRegionChange?.(region);
    }
  };

  const handleMarkerPress = (event: any) => {
    const data = event?.nativeEvent;
    if (!data?.markerId) return;

    // Prefer the coordinate reported by native; otherwise resolve it from
    // the markers prop so we never report a bogus (0, 0) location.
    let coordinate: Coordinate | undefined =
      data.coordinate && isValidCoordinate(data.coordinate) ? data.coordinate : undefined;
    if (!coordinate) {
      coordinate = safeMarkersRef.current.find(m => m.id === data.markerId)?.coordinate;
    }
    if (!coordinate) {
      console.warn(`OSMView: marker press for unknown marker "${data.markerId}" ignored`);
      return;
    }
    onMarkerPress?.(data.markerId, coordinate);
  };

  const handlePress = (event: any) => {
    const data = event?.nativeEvent;
    if (!data?.coordinate) return;
    onPress?.(data.coordinate);
  };

  const handleUserLocationChange = (event: any) => {
    const data = event?.nativeEvent;
    if (data?.latitude == null || data?.longitude == null) return;
    onUserLocationChange?.({
      latitude: data.latitude,
      longitude: data.longitude
    });
  };

  // Check if native module is available
  if (!isNativeModuleAvailable) {
    return (
      <View style={[styles.container, style]} testID="osm-view-fallback">
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>📍 OpenStreetMap View</Text>
          <Text style={styles.fallbackText}>
            {Platform.OS === 'web'
              ? 'Web platform requires a different map implementation'
              : 'This app requires a development build to display maps'}
          </Text>
          <Text style={styles.fallbackSubtext}>
            {Platform.OS === 'web'
              ? 'Consider using react-native-web compatible map libraries for web support'
              : 'Expo Go does not support custom native modules. Please create a development build.'}
          </Text>
          <View style={styles.coordinateInfo}>
            <Text style={styles.coordinateText}>
              📍 Center: {safeInitialCenter.latitude.toFixed(4)}, {safeInitialCenter.longitude.toFixed(4)}
            </Text>
            <Text style={styles.coordinateText}>🔍 Zoom: {safeInitialZoom}</Text>
          </View>
        </View>
      </View>
    );
  }

  // If we don't have a native view manager but have the module, try to create the view directly
  if (!NativeOSMView && NativeOSMModule) {

    return (
      <View style={[styles.container, style]} testID="osm-view-debug">
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>🔧 Debug Mode</Text>
          <Text style={styles.fallbackText}>
            Native module loaded but view component not available.
          </Text>
          <Text style={styles.fallbackSubtext}>
            This indicates the View definition in the native module may not be working correctly.
          </Text>
          <View style={styles.coordinateInfo}>
            <Text style={styles.coordinateText}>
              Module: {NativeOSMModule ? '✅ Available' : '❌ Missing'}
            </Text>
            <Text style={styles.coordinateText}>
              View: {NativeOSMView ? '✅ Available' : '❌ Missing'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, style]}
      onLayout={handleContainerLayout}
      testID="osm-view"
    >
      <NativeOSMView
        ref={nativeViewRef}
        style={mapSizeStyle ? [styles.map, mapSizeStyle] : styles.map}
        initialCenter={safeInitialCenter}
        initialZoom={safeInitialZoom}
        tileServerUrl={tileServerUrl}
        styleUrl={styleUrl}
        markers={safeMarkers}
        circles={safeCircles}
        polylines={nativePolylines}
        polygons={safePolygons}
        onMapReady={handleMapReady}
        onRegionChange={handleRegionChange}
        onMarkerPress={handleMarkerPress}
        onPress={handlePress}
        showUserLocation={showUserLocation}
        followUserLocation={followUserLocation}
        showsCompass={showsCompass}
        showsScale={showsScale}
        showsZoomControls={showsZoomControls}
        rotateEnabled={rotateEnabled}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        pitchEnabled={pitchEnabled}
        onUserLocationChange={handleUserLocationChange}
      />
    </View>
  );
});

OSMView.displayName = 'OSMView';

export { OSMView };
export default OSMView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
    fontSize: 14,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderColor: '#b3d9ff',
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    margin: 10,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 16,
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  coordinateInfo: {
    backgroundColor: '#edf2f7',
    padding: 12,
    borderRadius: 8,
    minWidth: 200,
  },
  coordinateText: {
    fontSize: 14,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
