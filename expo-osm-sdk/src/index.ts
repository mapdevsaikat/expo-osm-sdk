// Core components
export { OSMView, MapContainer } from './components';
export { default as OSMViewDefault } from './components/OSMView';

// Overlay components (markers, shapes)
export { Marker } from './components/Marker';
export { CustomOverlay } from './components/CustomOverlay';
export { Polyline } from './components/Polyline';
export { Polygon } from './components/Polygon';
export { Circle } from './components/Circle';

// Search components
export { SearchBox } from './components/SearchBox';

// UI components
export { LocationButton } from './components/LocationButton';
export { NavigationControls } from './components/NavigationControls';

// Types
export type {
  OSMViewProps,
  OSMViewRef,
  Coordinate,
  MapRegion,
  MarkerConfig,
  MarkerIcon,
  PolylineConfig,
  PolygonConfig,
  CircleConfig,
  OverlayConfig,
  ClusterConfig,
  MarkerAnimation,
  InfoWindow,
  MapConfig,
  
  // Search types
  NominatimSearchResult,
  NominatimAddress,
  NominatimSearchOptions,
  NominatimReverseOptions,
  SearchLocation,
  UseNominatimSearchReturn,
  SearchBoxProps,
  SearchResultsProps,
  
  // UI component types
  LocationButtonProps,
  NavigationControlsProps,
  
  // Component prop types
  MarkerProps,
  MapContainerProps,
  PolylineProps,
  PolygonProps,
  CircleProps,
  CustomOverlayProps,
  
  // Routing types
  Route,
  RouteStep,
  
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
export { useNominatimSearch } from './hooks/useNominatimSearch';
export { 
  useOSRMRouting,
  type OSRMRoutingState,
  type UseOSRMRoutingReturn,
  type RouteDisplayOptions
} from './hooks/useOSRMRouting';
export { 
  useLocationTracking,
  type UseLocationTrackingResult,
  type UseLocationTrackingOptions,
  type LocationTrackingStatus,
  type LocationErrorType,
  type LocationError,
  type LocationHealthStatus
} from './hooks/useLocationTracking';
export {
  useGeofencing,
  useSingleGeofence,
} from './hooks/useGeofencing';
export { 
  searchLocations, 
  reverseGeocode, 
  getSuggestions,
  calculateDistance as calculateDistanceKm, // Returns kilometers (from nominatim)
  formatDistance 
} from './utils/nominatim';

// OSRM Routing exports
export {
  calculateRoute,
  calculateSimpleRoute,
  getRouteEstimate,
  formatDuration,
  formatDistance as formatRouteDistance,
  calculateStraightLineDistance,
  type OSRMProfile,
  type OSRMRouteOptions
} from './utils/osrm';

// Search convenience utilities
export {
  quickSearch,
  searchNearby,
  getAddressFromCoordinates,
  searchPOI,
  smartSearch
} from './utils/searchHelpers';

// Utility functions
export { validateCoordinate, validateMarkerConfig } from './utils/coordinate'; 

// Geofencing utilities
export {
  calculateDistance, // Returns meters (primary distance function)
  isPointInCircle,
  isPointInPolygon,
  isPointInGeofence,
  distanceToGeofence,
  validateGeofence,
  getGeofenceCenter,
  doGeofencesOverlap,
} from './utils/geofencing'; 