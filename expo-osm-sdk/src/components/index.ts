// Main map components
export { OSMView } from './OSMView.js';
export { MapContainer } from './MapContainer';
export { ExpoGoFallback } from './ExpoGoFallback';

// Overlay components  
export { Marker } from './Marker';
export { Polyline } from './Polyline';
export { Polygon } from './Polygon';
export { Circle } from './Circle';
export { CustomOverlay } from './CustomOverlay';

// Search components
export { SearchBox } from './SearchBox';

// Layer control components
export { LayerControl, BUILT_IN_LAYERS } from './LayerControl';
export type { LayerConfig, LayerControlProps } from './LayerControl';

// User location components
export { default as UserLocationButton } from './UserLocationButton';

// Navigation components
export { default as ZoomControl } from './ZoomControl';
export { PitchBearingControl } from './PitchBearingControl';
export type { PitchBearingControlProps } from './PitchBearingControl';

// Attribution components
export { default as AttributionControl } from './AttributionControl';
export type { AttributionControlProps } from './AttributionControl';

// Advanced gesture components
export { AdvancedGestureControl } from './AdvancedGestureControl';
export type { AdvancedGestureControlProps, GestureConfig, GestureEvent } from './AdvancedGestureControl';

// Export types - temporary simplified ref for current implementation
export type { OSMViewRef } from '../types'; 