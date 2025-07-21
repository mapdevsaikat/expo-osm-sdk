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
 * Route information for navigation
 */
export interface Route {
  coordinates: Coordinate[];
  distance: number;
  duration: number;
  steps: RouteStep[];
}

/**
 * Individual step in a route
 */
export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinate: Coordinate;
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
 * Alternative tile configurations for different use cases
 */
export const TILE_CONFIGS = {
  openMapTiles: {
    name: 'Carto Voyager',
    description: 'High-quality production vector tiles with professional styling and global coverage. Uses MapLibre GL for hardware acceleration.',
    isVector: true,
    styleUrl: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    attribution: '© OpenStreetMap contributors, © CARTO'
  },
  
  rasterTiles: {
    name: 'OpenStreetMap Raster',
    description: 'Traditional raster tile format for compatibility and fallback scenarios.',
    isVector: false,
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
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
  return TILE_CONFIGS.openMapTiles;
}

/**
 * Default configuration for the map - Updated to use OpenMapTiles vector style
 */
export const DEFAULT_CONFIG: MapConfig = {
  tileServerUrl: TILE_CONFIGS.openMapTiles.styleUrl, // For backward compatibility
  styleUrl: TILE_CONFIGS.openMapTiles.styleUrl, // OpenMapTiles vector style  
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
 * Nominatim Search Types
 */

export interface NominatimSearchResult {
  place_id: string;
  licence: string;
  osm_type: string;
  osm_id: string;
  boundingbox: [string, string, string, string]; // [minlat, maxlat, minlon, maxlon]
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address?: NominatimAddress;
}

export interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

export interface NominatimSearchOptions {
  limit?: number; // Maximum number of results (default: 5)
  countrycodes?: string; // Restrict to specific countries (e.g., 'us,gb')
  bounded?: boolean; // Restrict search to bounding box
  viewbox?: [number, number, number, number]; // [minlon, minlat, maxlon, maxlat]
  addressdetails?: boolean; // Include address breakdown (default: true)
  extratags?: boolean; // Include extra OSM tags
  namedetails?: boolean; // Include name details in other languages
}

export interface NominatimReverseOptions {
  zoom?: number; // Level of detail (3-18, default: 18)
  addressdetails?: boolean; // Include address breakdown (default: true)
  extratags?: boolean; // Include extra OSM tags
  namedetails?: boolean; // Include name details in other languages
}

export interface SearchLocation {
  coordinate: Coordinate;
  displayName: string;
  address?: NominatimAddress;
  boundingBox?: [number, number, number, number]; // [minlat, maxlat, minlon, maxlon]
  importance?: number;
  placeId: string;
  category?: string;
  type?: string;
}

/**
 * Search hook return type
 */
export interface UseNominatimSearchReturn {
  search: (query: string, options?: NominatimSearchOptions) => Promise<SearchLocation[]>;
  reverseGeocode: (coordinate: Coordinate, options?: NominatimReverseOptions) => Promise<SearchLocation | null>;
  isLoading: boolean;
  error: string | null;
  lastResults: SearchLocation[];
  clearResults: () => void;
}

/**
 * Search UI component props
 */
export interface SearchBoxProps {
  onLocationSelected?: (location: SearchLocation) => void;
  onResultsChanged?: (results: SearchLocation[]) => void;
  placeholder?: string;
  style?: any;
  containerStyle?: any;
  maxResults?: number;
  showCurrentLocation?: boolean;
  autoComplete?: boolean;
  debounceMs?: number;
}

export interface SearchResultsProps {
  results: SearchLocation[];
  onLocationSelected?: (location: SearchLocation) => void;
  style?: any;
  maxVisible?: number;
  showDistance?: boolean;
  userLocation?: Coordinate;
} 