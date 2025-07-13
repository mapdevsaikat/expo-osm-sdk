import { ViewStyle } from 'react-native';

// Basic coordinate interface
export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Map region interface
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Marker configuration
export interface MarkerConfig {
  id: string;
  coordinate: Coordinate;
  title?: string;
  description?: string;
  icon?: string;
}

// Main OSM View props
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

// Marker component props
export interface MarkerProps {
  coordinate: Coordinate;
  title?: string;
  description?: string;
  icon?: string;
  onPress?: () => void;
}

// Route interfaces for future use
export interface Route {
  coordinates: Coordinate[];
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinate: Coordinate;
}

// Configuration interfaces
export interface MapConfig {
  tileServerUrl: string;
  styleUrl?: string;
  maxZoom?: number;
  minZoom?: number;
  attribution?: string;
}

// Default configuration
export const DEFAULT_CONFIG: MapConfig = {
  tileServerUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 18,
  minZoom: 1,
  attribution: '© OpenStreetMap contributors'
};

// Default coordinates (centered on world)
export const DEFAULT_COORDINATE: Coordinate = {
  latitude: 0,
  longitude: 0
};

// Default map region
export const DEFAULT_REGION: MapRegion = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 90,
  longitudeDelta: 180
}; 