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