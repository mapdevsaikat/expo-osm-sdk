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
 * Map region with center and delta values
 */
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Alternative name for MapRegion
 */
export type Region = MapRegion;

/**
 * Icon configuration for markers
 */
export interface MarkerIcon {
  uri?: string;
  name?: string; // Built-in icon name
  size?: number;
  color?: string;
  anchor?: { x: number; y: number }; // Anchor point (0,0 = top-left, 0.5,1 = bottom-center)
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
  onUserLocationChange?: (coordinate: Coordinate) => void;
}

/**
 * Enhanced ref methods available on OSMView component
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
  getCurrentLocation: () => Promise<Coordinate>;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => Promise<void>;
  waitForLocation: (timeoutSeconds: number) => Promise<Coordinate>;
  
  // View readiness
  isViewReady?: () => Promise<boolean>;
  
  // Marker controls
  addMarker: (marker: MarkerConfig) => Promise<void>;
  removeMarker: (markerId: string) => Promise<void>;
  updateMarker: (markerId: string, updates: Partial<MarkerConfig>) => Promise<void>;
  animateMarker: (markerId: string, animation: MarkerAnimation) => Promise<void>;
  showInfoWindow: (markerId: string) => Promise<void>;
  hideInfoWindow: (markerId: string) => Promise<void>;
  
  // Overlay controls
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
  coordinateForPoint: (point: { x: number; y: number }) => Promise<Coordinate>;
  pointForCoordinate: (coordinate: Coordinate) => Promise<{ x: number; y: number }>;
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
 * ```
 *
 * ### Layer switcher pattern
 *
 * ```tsx
 * import { useState } from 'react';
 * import { View, Pressable, Text } from 'react-native';
 * import { OSMView, TILE_CONFIGS } from 'expo-osm-sdk';
 *
 * type LayerKey = 'openMapTiles' | 'openfreemapLiberty' | 'openfreemapPositron' | 'openfreemapBright';
 *
 * const LAYERS: Record<LayerKey, string> = {
 *   openMapTiles:        'Voyager',
 *   openfreemapLiberty:  'Liberty',
 *   openfreemapPositron: 'Positron',
 *   openfreemapBright:   'Bright',
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

/**
 * LocationButton UI component props
 */
export interface LocationButtonProps {
  onLocationFound?: (location: { latitude: number; longitude: number }) => void;
  onLocationError?: (error: string) => void;
  style?: any;
  size?: number;
  color?: string;
  getCurrentLocation?: () => Promise<{ latitude: number; longitude: number }>;
}

/**
 * NavigationControls UI component props
 */
export interface NavigationControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetBearing?: () => void;
  onResetPitch?: () => void;
  bearing?: number;
  pitch?: number;
  style?: any;
  size?: number;
  color?: string;
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