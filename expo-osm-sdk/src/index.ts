// Core components
export { OSMView, MapContainer } from './components';
export { default as OSMViewDefault } from './components/OSMView';

// Search components
export { SearchBox } from './components/SearchBox';

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
  
  // Routing types
  Route,
  RouteStep,
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
  searchLocations, 
  reverseGeocode, 
  getSuggestions,
  calculateDistance,
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