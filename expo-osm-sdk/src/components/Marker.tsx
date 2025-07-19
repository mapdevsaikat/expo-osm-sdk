import React from 'react';
import { MarkerConfig } from '../types';

/**
 * Marker component for OSMView
 * 
 * This component can be used in two ways:
 * 1. As a direct JSX child of OSMView (declarative approach)
 * 2. As a data structure through the markers prop of OSMView
 * 
 * @example
 * ```tsx
 * // Declarative usage (recommended)
 * <OSMView>
 *   <Marker 
 *     coordinate={{ latitude: 37.78825, longitude: -122.4324 }}
 *     title="San Francisco"
 *     description="A great city!"
 *   />
 * </OSMView>
 * 
 * // Props usage
 * <OSMView 
 *   markers={[{
 *     id: 'marker1',
 *     coordinate: { latitude: 37.78825, longitude: -122.4324 },
 *     title: 'San Francisco'
 *   }]}
 * />
 * ```
 */

export interface MarkerProps extends Omit<MarkerConfig, 'id'> {
  id?: string; // Optional when used as JSX child (auto-generated)
  children?: React.ReactNode; // For custom info window content
}

const Marker: React.FC<MarkerProps> = ({
  coordinate,
  title,
  description,
  icon,
  infoWindow,
  animation,
  zIndex,
  draggable,
  opacity,
  rotation,
  visible = true,
  children,
  ...props
}) => {
  // When used as JSX child, this component doesn't render anything directly
  // The OSMView parent component extracts the props during React.Children processing
  
  // Development warning if coordinate is invalid
  if (__DEV__) {
    if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') {
      console.warn('Marker: Invalid coordinate provided', coordinate);
    }
    if (coordinate.latitude < -90 || coordinate.latitude > 90) {
      console.warn('Marker: latitude must be between -90 and 90', coordinate.latitude);
    }
    if (coordinate.longitude < -180 || coordinate.longitude > 180) {
      console.warn('Marker: longitude must be between -180 and 180', coordinate.longitude);
    }
  }
  
  return null;
};

Marker.displayName = 'Marker';

export { Marker }; 