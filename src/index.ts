// Main components
export { default as OSMView } from './components/OSMView';
export { default as Marker } from './components/Marker';

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

// Constants and defaults
export {
  DEFAULT_CONFIG,
  DEFAULT_COORDINATE,
  DEFAULT_REGION
} from './types';

// Helper functions
export { createMarkerConfig } from './components/Marker';

// Version and metadata
export const VERSION = '0.1.0';
export const SDK_NAME = 'expo-osm-sdk'; 