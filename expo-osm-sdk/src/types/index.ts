import React from 'react';
import { ViewStyle } from 'react-native';

/**
 * Geographic coordinate with latitude and longitude
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Alternative name for Coordinate (common in mapping libraries)
 */
export type LatLng = Coordinate;

/**
 * A single GPS fix, as reported by `onUserLocationChange`. Extends
 * `Coordinate` with the extra attributes needed for movement-tracking
 * use cases (e.g. building a GPX track): altitude, accuracy, bearing,
 * speed, and a timestamp. All extra fields are optional since not every
 * fix has fresh values for every attribute (e.g. `bearing` is only
 * meaningful once the device is moving).
 */
export interface LocationFix extends Coordinate {
  /** Altitude in metres above sea level, when available. */
  altitude?: number;
  /** Horizontal accuracy of the fix, in metres. */
  accuracy?: number;
  /** Course over ground in degrees (0–360), when available. */
  bearing?: number;
  /** Ground speed in metres per second. */
  speed?: number;
  /** Unix timestamp (milliseconds) the fix was recorded. */
  timestamp?: number;
}

/**
 * Map region with center and delta values
 */
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  /** Camera bearing in degrees (0–360), emitted when the map rotates */
  bearing?: number;
  /** Camera pitch/tilt in degrees (0–60), emitted when the map tilts */
  pitch?: number;
}

/**
 * Alternative name for MapRegion
 */
export type Region = MapRegion;

/**
 * Icon configuration for map markers (native iOS / Android).
 *
 * ## Images (`uri`)
 *
 * Pass a **PNG or JPEG** URL string. The native map downloads the image and scales it to a square of **`size`** pixels (default ~30).
 *
 * - **Remote:** `https://…/pin.png` — works on both platforms (remember HTTPS and CORS isn’t applicable to native).
 * - **Local file:** use a full `file://…` URI from something like `expo-file-system` or `Image.resolveAssetSource()` converted to a URI — must be readable by the OS.
 *
 * ## Built-in styles (`name`) — iOS SF Symbols; Android tinted pin
 *
 * If **`name`** is set, it takes precedence over **`uri`** (same as iOS).
 *
 * Supported **`name`** values (case-insensitive): `park`, `building`, `beach`, `star`, `pin`.
 * - **iOS:** maps to SF Symbols (e.g. `mappin.circle.fill`).
 * - **Android:** draws a **simple colored pin bitmap** with semantic colors (not the same pixels as SF Symbols, but same categories).
 *
 * Unknown names fall back to the default pin style.
 *
 * ## Optional styling
 *
 * - **`size`** — Width/height of the icon in logical pixels (square).
 * - **`color`** — Tint/highlight where supported (SF Symbol tint on iOS; pin fill on Android for named markers).
 * - **`anchor`** — Parsed on native; `{ x: 0.5, y: 1 }` is typical “tip at coordinate”. Fine-tuning may vary by platform/version.
 *
 * ## React components as markers
 *
 * MapLibre renders **bitmaps**, not arbitrary React trees. To use your own JSX you either:
 *
 * 1. Render to an image (e.g. `react-native-view-shot`) and pass its **`uri`**, or
 * 2. Overlay a **`View`** absolutely on top of the map and sync position from map coordinates (manual projection), which this SDK does not bundle as a ready-made API.
 */
export interface MarkerIcon {
  /** Remote `https://…` or local `file://…` image (PNG/JPEG). Ignored if `name` is set. */
  uri?: string;
  /** Built-in preset: `park` | `building` | `beach` | `star` | `pin`. Takes precedence over `uri`. */
  name?: string;
  /** Icon width/height in px (square). Default ~30 on native. */
  size?: number;
  /** Tint (`#RRGGBB` / `#AARRGGBB`) where supported. */
  color?: string;
  /** Anchor: `(0,0)` top-left, `(0.5,1)` bottom-center (tip). Parsed on native. */
  anchor?: { x: number; y: number };
}

/**
 * Info window configuration
 */
export interface InfoWindow {
  title?: string;
  description?: string;
  customView?: React.ReactNode;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  maxWidth?: number;
}

/**
 * Camera animation configuration
 */
export interface CameraAnimationOptions {
  /** Target latitude */
  latitude?: number;
  /** Target longitude */
  longitude?: number;
  /** Target zoom level (1-20) */
  zoom?: number;
  /** Target pitch/tilt in degrees (0-60) */
  pitch?: number;
  /** Target bearing/heading in degrees (0-360) */
  bearing?: number;
  /** Animation duration in milliseconds */
  duration?: number;
}

/**
 * Marker animation configuration
 */
export interface MarkerAnimation {
  type: 'bounce' | 'pulse' | 'fade' | 'scale' | 'drop';
  duration?: number;
  delay?: number;
  repeat?: boolean;
}

/**
 * Enhanced marker configuration for displaying points on the map
 */
export interface MarkerConfig {
  id: string;
  coordinate: Coordinate;
  title?: string;
  description?: string;
  icon?: MarkerIcon;
  infoWindow?: InfoWindow;
  animation?: MarkerAnimation;
  zIndex?: number;
  draggable?: boolean;
  opacity?: number;
  rotation?: number;
  visible?: boolean;
  clustered?: boolean;
}

/**
 * Marker clustering configuration
 */
export interface ClusterConfig {
  enabled: boolean;
  radius?: number; // Cluster radius in pixels
  maxZoom?: number; // Max zoom level to cluster
  minPoints?: number; // Minimum points to form cluster
  colors?: string[]; // Colors for different cluster sizes
  textColor?: string;
  textSize?: number;
}

/**
 * Enhanced OSM View component props
 */
export interface OSMViewProps {
  style?: ViewStyle;
  initialCenter?: Coordinate;
  initialZoom?: number;
  initialPitch?: number; // Camera tilt in degrees (0-60)
  initialBearing?: number; // Camera rotation in degrees (0-360)
  tileServerUrl?: string;
  styleUrl?: string;
  markers?: MarkerConfig[];
  polylines?: PolylineConfig[];
  polygons?: PolygonConfig[];
  circles?: CircleConfig[];
  overlays?: OverlayConfig[];
  clustering?: ClusterConfig;
  showUserLocation?: boolean;
  followUserLocation?: boolean;
  userLocationIcon?: MarkerIcon;
  userLocationTintColor?: string; // Color for user location marker (default: #9C1AFF - expo-osm-sdk signature purple)
  userLocationAccuracyFillColor?: string; // Fill color for accuracy circle
  userLocationAccuracyBorderColor?: string; // Border color for accuracy circle
  showsCompass?: boolean;
  showsScale?: boolean;
  showsZoomControls?: boolean;
  rotateEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  pitchEnabled?: boolean;
  onMapReady?: () => void;
  onRegionChange?: (region: MapRegion) => void;
  onMarkerPress?: (markerId: string, coordinate: Coordinate) => void;
  onMarkerDragStart?: (markerId: string, coordinate: Coordinate) => void;
  onMarkerDrag?: (markerId: string, coordinate: Coordinate) => void;
  onMarkerDragEnd?: (markerId: string, coordinate: Coordinate) => void;
  onInfoWindowPress?: (markerId: string) => void;
  onPolylinePress?: (polylineId: string, coordinate: Coordinate) => void;
  onPolygonPress?: (polygonId: string, coordinate: Coordinate) => void;
  onCirclePress?: (circleId: string, coordinate: Coordinate) => void;
  onOverlayPress?: (overlayId: string) => void;
  onPress?: (coordinate: Coordinate) => void;
  onLongPress?: (coordinate: Coordinate) => void;
  onUserLocationChange?: (location: LocationFix) => void;
  /**
   * Called when the SDK recovers from an invalid prop or internal error
   * instead of crashing (production builds only; development builds throw).
   */
  onError?: (error: Error) => void;
}

/**
 * Styling options for displayRoute()
 */
export interface RouteDisplayOptions {
  color?: string;
  width?: number;
  opacity?: number;
  /** Fit the camera to the route after drawing it (default: false) */
  fitRoute?: boolean;
  /** Padding in pixels used when fitting the route (default: 50) */
  padding?: number;
}

/**
 * Enhanced ref methods available on OSMView component.
 *
 * All methods are guaranteed to exist on the ref on every platform.
 * Methods that are not supported on a given platform reject with a
 * descriptive Error instead of crashing (never `undefined is not a function`).
 */
export interface OSMViewRef {
  // Zoom controls
  zoomIn: () => Promise<void>;
  zoomOut: () => Promise<void>;
  setZoom: (zoom: number) => Promise<void>;
  
  // Camera controls
  animateToLocation: (latitude: number, longitude: number, zoom?: number) => Promise<void>;
  animateToRegion: (region: MapRegion, duration?: number) => Promise<void>;
  fitToMarkers: (markerIds?: string[], padding?: number) => Promise<void>;
  
  // Camera orientation controls
  setPitch: (pitch: number) => Promise<void>;
  setBearing: (bearing: number) => Promise<void>;
  getPitch: () => Promise<number>;
  getBearing: () => Promise<number>;
  animateCamera: (options: CameraAnimationOptions) => Promise<void>;
  
  // Location services
  /**
   * Requests the device's runtime location permission (ACCESS_FINE_LOCATION /
   * ACCESS_COARSE_LOCATION on Android, "when in use" authorization on iOS),
   * triggering the native system permission dialog if the user hasn't been
   * asked yet.
   *
   * On Android, a manifest declaration alone is NOT enough on API 23+ — the
   * app must call this (or otherwise request the runtime permission) before
   * `getCurrentLocation`, `startLocationTracking`, `waitForLocation`, or the
   * `showUserLocation`/`followUserLocation` props can succeed. Call this
   * once, ideally before the user first taps a location-related control.
   *
   * Resolves `true` if permission is already granted or the user just
   * granted it, `false` if denied/restricted. Never rejects for a normal
   * denial — only rejects if the native module itself is unavailable.
   */
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<Coordinate>;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => Promise<void>;
  waitForLocation: (timeoutSeconds: number) => Promise<Coordinate>;
  
  // View readiness
  isViewReady: () => Promise<boolean>;
  
  // Route display helpers (JS-side, built on polylines + camera)
  displayRoute: (coordinates: Coordinate[], options?: RouteDisplayOptions) => Promise<void>;
  clearRoute: () => Promise<void>;
  fitRouteInView: (coordinates: Coordinate[], padding?: number) => Promise<void>;
  
  // Marker controls
  // Native platforms are prop-driven: these reject with a descriptive error
  // directing you to the `markers` prop. Supported on web (MapLibre).
  addMarker: (marker: MarkerConfig) => Promise<void>;
  removeMarker: (markerId: string) => Promise<void>;
  updateMarker: (markerId: string, updates: Partial<MarkerConfig>) => Promise<void>;
  animateMarker: (markerId: string, animation: MarkerAnimation) => Promise<void>;
  showInfoWindow: (markerId: string) => Promise<void>;
  hideInfoWindow: (markerId: string) => Promise<void>;
  
  // Overlay controls
  // Native platforms are prop-driven: these reject with a descriptive error
  // directing you to the corresponding prop. Supported on web (MapLibre).
  addPolyline: (polyline: PolylineConfig) => Promise<void>;
  removePolyline: (polylineId: string) => Promise<void>;
  updatePolyline: (polylineId: string, updates: Partial<PolylineConfig>) => Promise<void>;
  addPolygon: (polygon: PolygonConfig) => Promise<void>;
  removePolygon: (polygonId: string) => Promise<void>;
  updatePolygon: (polygonId: string, updates: Partial<PolygonConfig>) => Promise<void>;
  addCircle: (circle: CircleConfig) => Promise<void>;
  removeCircle: (circleId: string) => Promise<void>;
  updateCircle: (circleId: string, updates: Partial<CircleConfig>) => Promise<void>;
  addOverlay: (overlay: OverlayConfig) => Promise<void>;
  removeOverlay: (overlayId: string) => Promise<void>;
  updateOverlay: (overlayId: string, updates: Partial<OverlayConfig>) => Promise<void>;
  
  // Map utilities
  // Not supported on native platforms yet: these reject with a descriptive error.
  coordinateForPoint: (point: { x: number; y: number }) => Promise<Coordinate>;
  pointForCoordinate: (coordinate: Coordinate) => Promise<{ x: number; y: number }>;
  /** Capture the map as a base64 data URI (`data:image/png;base64,...`). */
  takeSnapshot: (format?: 'png' | 'jpg', quality?: number) => Promise<string>;
}

/**
 * Enhanced marker component props
 */
export interface MarkerProps {
  coordinate: Coordinate;
  title?: string;
  description?: string;
  icon?: MarkerIcon;
  infoWindow?: InfoWindow;
  animation?: MarkerAnimation;
  zIndex?: number;
  draggable?: boolean;
  opacity?: number;
  rotation?: number;
  visible?: boolean;
  onPress?: () => void;
  onDragStart?: (coordinate: Coordinate) => void;
  onDrag?: (coordinate: Coordinate) => void;
  onDragEnd?: (coordinate: Coordinate) => void;
  onInfoWindowPress?: () => void;
}

/**
 * Polyline configuration for drawing lines on the map
 */
export interface PolylineConfig {
  id: string;
  coordinates: Coordinate[];
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokePattern?: 'solid' | 'dashed' | 'dotted';
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  zIndex?: number;
  visible?: boolean;
}

/**
 * Polygon configuration for drawing areas on the map
 */
export interface PolygonConfig {
  id: string;
  coordinates: Coordinate[];
  holes?: Coordinate[][]; // Array of coordinate arrays for holes
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokePattern?: 'solid' | 'dashed' | 'dotted';
  zIndex?: number;
  visible?: boolean;
}

/**
 * Circle configuration for drawing circles on the map
 */
export interface CircleConfig {
  id: string;
  center: Coordinate;
  radius: number; // Radius in meters
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokePattern?: 'solid' | 'dashed' | 'dotted';
  zIndex?: number;
  visible?: boolean;
}

/**
 * Custom overlay configuration
 */
export interface OverlayConfig {
  id: string;
  coordinate: Coordinate;
  width: number;
  height: number;
  component: React.ReactNode;
  anchor?: { x: number; y: number };
  zIndex?: number;
  visible?: boolean;
}

/**
 * Map configuration options
 */
export interface MapConfig {
  tileServerUrl?: string;
  styleUrl?: string;
  maxZoom?: number;
  minZoom?: number;
  attribution?: string;
  isVectorTiles?: boolean;
  initialCenter?: Coordinate;
  initialZoom?: number;
}

/**
 * Individual tile configuration interface
 */
export interface TileConfig {
  name: string;
  description: string;
  isVector: boolean;
  styleUrl?: string;  // For vector tiles
  tileUrl?: string;   // For raster tiles
  attribution?: string;
}

/**
 * Built-in tile and style presets.
 *
 * ## Choosing a basemap
 *
 * Prefer vector styles (`isVector: true`) in all production apps — they render
 * sharply at every resolution, support hardware acceleration via MapLibre GL,
 * and consume far less bandwidth than raster tiles.
 *
 * ### Recommended presets (vector — production-ready)
 *
 * ```tsx
 * import { OSMView, TILE_CONFIGS } from 'expo-osm-sdk';
 *
 * // Carto Voyager — default, polished, globally recognised
 * <OSMView styleUrl={TILE_CONFIGS.openMapTiles.styleUrl} />
 *
 * // OpenFreeMap Liberty — colorful, OSM-flavored, fully open-source
 * <OSMView styleUrl={TILE_CONFIGS.openfreemapLiberty.styleUrl} />
 *
 * // OpenFreeMap Positron — minimal light, great for data overlays
 * <OSMView styleUrl={TILE_CONFIGS.openfreemapPositron.styleUrl} />
 *
 * // OpenFreeMap Bright — vibrant, high contrast
 * <OSMView styleUrl={TILE_CONFIGS.openfreemapBright.styleUrl} />
 *
 * // OpenFreeMap Dark — dark vector basemap (system dark mode / night UI)
 * <OSMView styleUrl={TILE_CONFIGS.openfreemapDark.styleUrl} />
 * ```
 *
 * ### Layer switcher pattern
 *
 * ```tsx
 * import { useState } from 'react';
 * import { View, Pressable, Text } from 'react-native';
 * import { OSMView, TILE_CONFIGS } from 'expo-osm-sdk';
 *
 * type LayerKey = 'openMapTiles' | 'openfreemapLiberty' | 'openfreemapPositron' | 'openfreemapBright' | 'openfreemapDark';
 *
 * const LAYERS: Record<LayerKey, string> = {
 *   openMapTiles:        'Voyager',
 *   openfreemapLiberty:  'Liberty',
 *   openfreemapPositron: 'Positron',
 *   openfreemapBright:   'Bright',
 *   openfreemapDark:     'Dark',
 * };
 *
 * export default function MapWithLayerSwitcher() {
 *   const [active, setActive] = useState<LayerKey>('openfreemapLiberty');
 *   const config = TILE_CONFIGS[active];
 *
 *   return (
 *     <View style={{ flex: 1 }}>
 *       <OSMView
 *         style={{ flex: 1 }}
 *         styleUrl={config.styleUrl}
 *         initialCenter={{ latitude: 20.5937, longitude: 78.9629 }}
 *         initialZoom={5}
 *       />
 *
 *       // Layer switcher buttons
 *       <View style={{ flexDirection: 'row', padding: 8, gap: 8 }}>
 *         {(Object.keys(LAYERS) as LayerKey[]).map((key) => (
 *           <Pressable
 *             key={key}
 *             onPress={() => setActive(key)}
 *             style={{
 *               paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
 *               backgroundColor: active === key ? '#0ea5e9' : '#e2e8f0',
 *             }}
 *           >
 *             <Text style={{ color: active === key ? 'white' : '#1e293b' }}>
 *               {LAYERS[key]}
 *             </Text>
 *           </Pressable>
 *         ))}
 *       </View>
 *
 *       // Always display attribution as required by each provider's terms
 *       <Text style={{ fontSize: 10, color: '#64748b', padding: 4, textAlign: 'right' }}>
 *         {config.attribution}
 *       </Text>
 *     </View>
 *   );
 * }
 * ```
 */
export const TILE_CONFIGS = {
  openMapTiles: {
    name: 'Carto Voyager',
    description: 'High-quality production vector tiles with professional styling and global coverage. Uses MapLibre GL for hardware acceleration.',
    isVector: true,
    styleUrl: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    attribution: '© OpenStreetMap contributors, © CARTO'
  },

  /**
   * @deprecated **Do not use in production.**
   *
   * The OpenStreetMap tile servers at `tile.openstreetmap.org` are a shared
   * community resource intended for **development and low-traffic personal
   * projects only**. The OSM tile usage policy explicitly prohibits:
   *
   * - Heavy or bulk use
   * - Use in commercial or high-traffic applications
   * - Automated/scripted access at scale
   *
   * Violating this policy risks your IP being blocked and harms the OSM
   * community infrastructure.
   *
   * **Use a vector style instead** — they look better, load faster, and have
   * no usage restrictions:
   * - `TILE_CONFIGS.openMapTiles` — Carto Voyager (default)
   * - `TILE_CONFIGS.openfreemapLiberty` — OpenFreeMap Liberty
   * - `TILE_CONFIGS.openfreemapPositron` — OpenFreeMap Positron
   * - `TILE_CONFIGS.openfreemapBright` — OpenFreeMap Bright
   * - `TILE_CONFIGS.openfreemapDark` — OpenFreeMap Dark
   *
   * If you specifically need raster tiles (e.g. offline caching pipelines),
   * run your own tile server or use a commercial raster tile provider.
   *
   * @see https://operations.osmfoundation.org/policies/tiles/
   */
  openStreetMap: {
    name: 'OpenStreetMap Raster',
    description: 'Standard OpenStreetMap raster tiles - reliable and free.',
    isVector: false,
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  
  openTopoMap: {
    name: 'OpenTopoMap',
    description: 'Topographic map based on OpenStreetMap data with contour lines and elevation.',
    isVector: false,
    tileUrl: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, SRTM | Style: © OpenTopoMap'
  },
  
  humanitarian: {
    name: 'Humanitarian',
    description: 'Humanitarian OpenStreetMap style optimized for crisis response.',
    isVector: false,
    tileUrl: 'https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, Tiles courtesy of Humanitarian OpenStreetMap Team'
  },

  /**
   * OpenFreeMap — free, open-source vector tile hosting. No API key required.
   * Public instance: https://openfreemap.org
   * Self-hosting docs: https://github.com/hyperknot/openfreemap
   *
   * Attribution required: © OpenStreetMap contributors © OpenMapTiles · OpenFreeMap
   * If using the public instance in production, consider sponsoring:
   * https://github.com/sponsors/hyperknot
   */
  openfreemapLiberty: {
    name: 'OpenFreeMap Liberty',
    description: 'Colorful OSM-flavored vector style from OpenFreeMap. Free and open-source, no API key required.',
    isVector: true,
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    attribution: '© OpenStreetMap contributors © OpenMapTiles · OpenFreeMap'
  },

  openfreemapPositron: {
    name: 'OpenFreeMap Positron',
    description: 'Clean, minimal light vector style from OpenFreeMap. Free and open-source, no API key required.',
    isVector: true,
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    attribution: '© OpenStreetMap contributors © OpenMapTiles · OpenFreeMap'
  },

  openfreemapBright: {
    name: 'OpenFreeMap Bright',
    description: 'Vibrant high-contrast vector style from OpenFreeMap. Free and open-source, no API key required.',
    isVector: true,
    styleUrl: 'https://tiles.openfreemap.org/styles/bright',
    attribution: '© OpenStreetMap contributors © OpenMapTiles · OpenFreeMap'
  },

  openfreemapDark: {
    name: 'OpenFreeMap Dark',
    description: 'Dark vector basemap from OpenFreeMap. Free and open-source, no API key required.',
    isVector: true,
    styleUrl: 'https://tiles.openfreemap.org/styles/dark',
    attribution: '© OpenStreetMap contributors © OpenMapTiles · OpenFreeMap'
  }
} as const;

/**
 * Utility function to detect if a URL is a vector tile style URL
 */
export function isVectorTileUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Check for common vector style URL patterns
  return (
    url.includes('.json') ||
    url.includes('style.json') ||
    url.includes('/styles/') ||
    (url.includes('api.') && url.includes('style'))
  );
}

/**
 * Validates a vector tile style URL
 */
export function validateStyleUrl(url: string): void {
  if (!url) {
    throw new Error('Style URL cannot be empty');
  }
  
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') {
      throw new Error('Style URL must use HTTPS');
    }
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

/**
 * Gets a default tile configuration by name
 */
export function getDefaultTileConfig(configName?: keyof typeof TILE_CONFIGS): TileConfig {
  if (configName && TILE_CONFIGS[configName]) {
    return TILE_CONFIGS[configName];
  }
  return TILE_CONFIGS.openStreetMap;
}

/**
 * Default configuration for the map - Using Carto vector tiles
 */
export const DEFAULT_CONFIG: MapConfig = {
  tileServerUrl: TILE_CONFIGS.openMapTiles.styleUrl, // For backward compatibility
  styleUrl: TILE_CONFIGS.openMapTiles.styleUrl, // Vector style  
  maxZoom: 22,
  minZoom: 1,
  attribution: TILE_CONFIGS.openMapTiles.attribution,
  isVectorTiles: true,
  initialCenter: { latitude: 0, longitude: 0 },
  initialZoom: 10
};

/**
 * Default coordinates (centered on world)
 */
export const DEFAULT_COORDINATE: Coordinate = {
  latitude: 0,
  longitude: 0
};

/**
 * Default map region
 */
export const DEFAULT_REGION: MapRegion = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 90,
  longitudeDelta: 180
}; 

/** Theme tokens for map overlay controls (`NavigationControls`, `LocationButton`). */
export interface MapControlTheme {
  /** Brand accent — compass north needle, location dot, loading spinner. */
  accent?: string;
  /** Monochrome icon stroke color. */
  icon?: string;
  /** Muted icon color (e.g. compass south needle). */
  iconMuted?: string;
  /** Card background. */
  background?: string;
  /** Row divider color. */
  divider?: string;
  /** Card border color. */
  border?: string;
  /** Pressed / active row background tint. */
  pressed?: string;
}

/** Shared appearance props for map overlay controls. */
export interface MapControlAppearanceProps {
  /** Use compact 36pt touch targets instead of the default 44pt. */
  compact?: boolean;
  /** Touch target size in points. Overrides `compact` when set (default 44). */
  size?: number;
  /** Brand accent — shorthand for `theme.accent`. */
  color?: string;
  /** Monochrome icon stroke — shorthand for `theme.icon`. */
  iconColor?: string;
  /** Muted icon color — shorthand for `theme.iconMuted`. */
  iconMutedColor?: string;
  /** Card background — shorthand for `theme.background`. */
  backgroundColor?: string;
  /** Card border and divider color — shorthand for `theme.border` / `theme.divider`. */
  borderColor?: string;
  /** Active / pressed row tint — shorthand for `theme.pressed`. */
  activeBackgroundColor?: string;
  /** Grouped theme tokens; individual props override matching keys. */
  theme?: MapControlTheme;
}

/**
 * LocationButton UI component props
 */
export interface LocationButtonProps extends MapControlAppearanceProps {
  onLocationFound?: (location: { latitude: number; longitude: number }) => void;
  onLocationError?: (error: string) => void;
  style?: any;
  getCurrentLocation?: () => Promise<{ latitude: number; longitude: number }>;
  /**
   * Optional: called before `getCurrentLocation` to request the runtime
   * location permission (e.g. `() => mapRef.current?.requestLocationPermission()`).
   * If it resolves `false`, the button reports `onLocationError` instead of
   * calling `getCurrentLocation`. Omit this prop to preserve prior behavior
   * (permission is assumed to already be handled elsewhere).
   */
  requestPermission?: () => Promise<boolean>;
}

/**
 * NavigationControls UI component props
 */
export interface NavigationControlsProps extends MapControlAppearanceProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetBearing?: () => void;
  onResetPitch?: () => void;
  bearing?: number;
  pitch?: number;
  style?: any;
  showPitchControl?: boolean;
  showCompassControl?: boolean;
  getBearing?: () => Promise<number>;
  getPitch?: () => Promise<number>;
}

/**
 * MapContainer component props
 */
export interface MapContainerProps extends OSMViewProps {
  fallbackComponent?: React.ComponentType<{ error: string }>;
  showDebugInfo?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Polyline component props
 */
export interface PolylineProps extends Omit<PolylineConfig, 'id'> {
  children?: React.ReactNode;
}

/**
 * Polygon component props
 */
export interface PolygonProps extends Omit<PolygonConfig, 'id'> {
  children?: React.ReactNode;
}

/**
 * Circle component props
 */
export interface CircleProps extends Omit<CircleConfig, 'id'> {
  children?: React.ReactNode;
}

/**
 * CustomOverlay component props
 */
export interface CustomOverlayProps extends Omit<OverlayConfig, 'id' | 'component'> {
  children: React.ReactNode;
}

// =============================================================================
// Geofencing Types
// =============================================================================

/**
 * Geofence shape types
 */
export type GeofenceShape = 'circle' | 'polygon';

/**
 * Geofence event types
 */
export type GeofenceEventType = 'enter' | 'exit' | 'dwell';

/**
 * Base geofence configuration
 */
export interface GeofenceBase {
  id: string;
  name?: string;
  metadata?: Record<string, any>;
}

/**
 * Circle geofence (defined by center point and radius)
 */
export interface CircleGeofence extends GeofenceBase {
  type: 'circle';
  center: Coordinate;
  radius: number; // meters
}

/**
 * Polygon geofence (defined by array of coordinates)
 */
export interface PolygonGeofence extends GeofenceBase {
  type: 'polygon';
  coordinates: Coordinate[]; // Must have at least 3 points
}

/**
 * Union type for all geofence types
 */
export type Geofence = CircleGeofence | PolygonGeofence;

/**
 * Geofence event data
 */
export interface GeofenceEvent {
  geofenceId: string;
  geofenceName?: string | undefined;
  type: GeofenceEventType;
  coordinate: Coordinate;
  timestamp: number;
  distance?: number; // Distance from geofence boundary (meters)
  metadata?: Record<string, any> | undefined;
}

/**
 * Geofence state (which geofences the user is currently inside)
 */
export interface GeofenceState {
  geofenceId: string;
  enteredAt: number; // timestamp
  lastUpdate: number; // timestamp
  dwellTime: number; // milliseconds
}

/**
 * Geofencing hook options
 */
export interface UseGeofencingOptions {
  /**
   * How often to check geofence boundaries (milliseconds)
   * @default 5000 (5 seconds)
   */
  checkInterval?: number;
  
  /**
   * How long user must be inside before triggering 'dwell' event (milliseconds)
   * @default 60000 (1 minute)
   */
  dwellThreshold?: number;
  
  /**
   * Enable high accuracy location tracking
   * @default true
   */
  enableHighAccuracy?: boolean;
  
  /**
   * Callback for geofence enter events
   */
  onEnter?: (event: GeofenceEvent) => void;
  
  /**
   * Callback for geofence exit events
   */
  onExit?: (event: GeofenceEvent) => void;
  
  /**
   * Callback for geofence dwell events (user stayed inside for dwellThreshold duration)
   */
  onDwell?: (event: GeofenceEvent) => void;
  
  /**
   * Callback for any geofence event
   */
  onEvent?: (event: GeofenceEvent) => void;
}

/**
 * Return type for useGeofencing hook
 */
export interface UseGeofencingReturn {
  /**
   * Array of geofence IDs user is currently inside
   */
  activeGeofences: string[];
  
  /**
   * Map of geofence states (entry time, dwell time, etc.)
   */
  geofenceStates: Map<string, GeofenceState>;
  
  /**
   * Check if user is inside a specific geofence
   */
  isInGeofence: (geofenceId: string) => boolean;
  
  /**
   * Get dwell time for a specific geofence (milliseconds)
   */
  getDwellTime: (geofenceId: string) => number;
  
  /**
   * Manually trigger a geofence check
   */
  checkGeofences: () => void;
  
  /**
   * Current user location
   */
  currentLocation: Coordinate | null;
  
  /**
   * Whether location tracking is active
   */
  isTracking: boolean;
  
  /**
   * Array of all geofence events that occurred
   */
  events: GeofenceEvent[];
} 