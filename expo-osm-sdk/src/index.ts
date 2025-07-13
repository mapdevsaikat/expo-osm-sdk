// Main components - provide both named and default exports
export { default as OSMView } from './components/OSMView';
export { default as Marker } from './components/Marker';
export { MapContainer } from './components/MapContainer';

// Also export as default for backward compatibility
export { default } from './components/OSMView';

// Types and interfaces
export type {
  Coordinate,
  MapRegion,
  MarkerConfig,
  OSMViewProps,
  MarkerProps,
  Route,
  RouteStep,
  MapConfig
} from './types';

// Export MapContainer types
export type { MapContainerProps } from './components/MapContainer';

// Constants and defaults
export {
  DEFAULT_CONFIG,
  DEFAULT_COORDINATE,
  DEFAULT_REGION
} from './types';

// Helper functions
export { createMarkerConfig } from './components/Marker';

// Version and metadata
export const VERSION = '1.0.1';
export const SDK_NAME = 'expo-osm-sdk';

// Re-export commonly used types for convenience
export type { Coordinate as LatLng } from './types';
export type { MapRegion as Region } from './types'; 