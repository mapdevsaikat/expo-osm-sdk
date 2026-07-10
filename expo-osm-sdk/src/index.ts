// Core components
export { OSMView, MapContainer, OSMErrorBoundary } from './components';
export { default as OSMViewDefault } from './components/OSMView';
export type { OSMErrorBoundaryProps } from './components/OSMErrorBoundary';
export type { RouteDisplayOptions } from './types';

// Overlay components (markers, shapes)
export { Marker } from './components/Marker';
export { CustomOverlay } from './components/CustomOverlay';
export { Polyline } from './components/Polyline';
export { Polygon } from './components/Polygon';
export { Circle } from './components/Circle';

// UI components
export { LocationButton } from './components/LocationButton';
export { NavigationControls } from './components/NavigationControls';

// Types
export type {
  OSMViewProps,
  OSMViewRef,
  Coordinate,
  LatLng,
  LocationFix,
  LocationTrackingOptions,
  LocationTrackingAccuracy,
  MapRegion,
  Region,
  MarkerConfig,
  MarkerIcon,
  PolylineConfig,
  PolygonConfig,
  CircleConfig,
  OverlayConfig,
  ClusterConfig,
  MarkerAnimation,
  InfoWindow,
  CameraAnimationOptions,
  MapConfig,
  TileConfig,

  // UI component types
  LocationButtonProps,
  NavigationControlsProps,
  MapControlTheme,
  MapControlAppearanceProps,

  // Component prop types
  MarkerProps,
  MapContainerProps,
  PolylineProps,
  PolygonProps,
  CircleProps,
  CustomOverlayProps,

  // Geofencing types
  Geofence,
  CircleGeofence,
  PolygonGeofence,
  GeofenceEvent,
  GeofenceEventType,
  GeofenceState,
  GeofenceShape,
  UseGeofencingOptions,
  UseGeofencingReturn,
} from './types';

// Default configuration and tile configs
export {
  DEFAULT_CONFIG,
  TILE_CONFIGS,
  isVectorTileUrl,
  validateStyleUrl,
  getDefaultTileConfig
} from './types';

// Hooks
export {
  useLocationTracking,
  type UseLocationTrackingResult,
  type UseLocationTrackingOptions,
  type LocationTrackingStatus,
  type LocationErrorType,
  type LocationError,
  type LocationHealthStatus
} from './hooks/useLocationTracking';

// GPX track export
export { buildGpxTrack, type BuildGpxTrackOptions } from './utils/gpx';
export {
  useGeofencing,
  useSingleGeofence,
} from './hooks/useGeofencing';

// Utility functions
export { validateCoordinate, validateMarkerConfig } from './utils/coordinate';

// Geofencing utilities
export {
  calculateDistance,
  isPointInCircle,
  isPointInPolygon,
  isPointInGeofence,
  distanceToGeofence,
  validateGeofence,
  getGeofenceCenter,
  doGeofencesOverlap,
} from './utils/geofencing';
