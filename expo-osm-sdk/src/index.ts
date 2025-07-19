// Core components
export { OSMView, MapContainer } from './components';
export { default as OSMViewDefault } from './components/OSMView';

// JSX overlay components
export { Marker, Polyline, Polygon, Circle, CustomOverlay } from './components';

// User location components
export { UserLocationButton } from './components';

// Navigation components
export { ZoomControl, PitchBearingControl, AdvancedGestureControl } from './components';

// Search components
export { SearchBox } from './components/SearchBox';

// Layer control components
export { LayerControl, BUILT_IN_LAYERS } from './components/LayerControl';

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
  
  // Layer control types
  LayerConfig,
} from './types';

// Advanced gesture types
export type { AdvancedGestureControlProps, GestureConfig, GestureEvent } from './components';

// Component props types
export type { UserLocationButtonProps } from './components/UserLocationButton';
export type { LayerControlProps } from './components/LayerControl';
export type { ZoomControlProps } from './components/ZoomControl';
export type { PitchBearingControlProps } from './components/PitchBearingControl';

// Default configuration and tile configs
export { 
  DEFAULT_CONFIG, 
  TILE_CONFIGS,
  isVectorTileUrl,
  validateStyleUrl,
  getDefaultTileConfig
} from './types';

// Search functionality
export { useNominatimSearch, useReverseGeocode, useLocationUtils } from './hooks/useNominatimSearch';
export { 
  searchLocations, 
  reverseGeocode, 
  getSuggestions,
  calculateDistance,
  formatDistance 
} from './utils/nominatim';

// Utility functions
export { validateCoordinate, validateMarkerConfig } from './utils/coordinate'; 