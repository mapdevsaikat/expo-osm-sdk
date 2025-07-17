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
} from './types';

// Default configuration and tile configs
export { 
  DEFAULT_CONFIG, 
  TILE_CONFIGS,
  isVectorTileUrl,
  validateStyleUrl,
  getDefaultTileConfig
} from './types';

// Search functionality
export { useNominatimSearch } from './hooks/useNominatimSearch';
export { 
  searchLocations, 
  reverseGeocode, 
  getSuggestions,
  calculateDistance,
  formatDistance 
} from './utils/nominatim';

// Utility functions
export { validateCoordinate, validateMarkerConfig } from './utils/coordinate'; 