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
 * Marker configuration for displaying points on the map
 */
export interface MarkerConfig {
  id: string;
  coordinate: Coordinate;
  title?: string;
  description?: string;
  icon?: string;
}

/**
 * Main OSM View component props
 */
export interface OSMViewProps {
  style?: ViewStyle;
  initialCenter?: Coordinate;
  initialZoom?: number;
  tileServerUrl?: string;
  styleUrl?: string;
  markers?: MarkerConfig[];
  onMapReady?: () => void;
  onRegionChange?: (region: MapRegion) => void;
  onMarkerPress?: (markerId: string) => void;
  onPress?: (coordinate: Coordinate) => void;
}

/**
 * Ref methods available on OSMView component
 */
export interface OSMViewRef {
  zoomIn: () => Promise<void>;
  zoomOut: () => Promise<void>;
  setZoom: (zoom: number) => Promise<void>;
  animateToLocation: (latitude: number, longitude: number, zoom?: number) => Promise<void>;
  getCurrentLocation: () => Promise<void>;
}

/**
 * Marker component props
 */
export interface MarkerProps {
  coordinate: Coordinate;
  title?: string;
  description?: string;
  icon?: string;
  onPress?: () => void;
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
  tileServerUrl: string;
  styleUrl?: string;
  maxZoom?: number;
  minZoom?: number;
  attribution?: string;
}

/**
 * Default configuration for the map
 */
export const DEFAULT_CONFIG: MapConfig = {
  tileServerUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 18,
  minZoom: 1,
  attribution: '© OpenStreetMap contributors'
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