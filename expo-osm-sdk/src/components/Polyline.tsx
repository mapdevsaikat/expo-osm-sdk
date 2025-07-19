import React from 'react';
import { PolylineConfig } from '../types';

/**
 * Polyline component for OSMView
 * 
 * Renders a polyline (sequence of connected line segments) on the map.
 * Can be used as a JSX child of OSMView or through the polylines prop.
 * 
 * @example
 * ```tsx
 * // Declarative usage
 * <OSMView>
 *   <Polyline
 *     coordinates={[
 *       { latitude: 37.7749, longitude: -122.4194 },
 *       { latitude: 37.7849, longitude: -122.4094 }
 *     ]}
 *     strokeColor="#FF0000"
 *     strokeWidth={3}
 *   />
 * </OSMView>
 * ```
 */
interface PolylineProps extends Omit<PolylineConfig, 'id'> {
  id?: string; // Optional when used as JSX child
  children?: React.ReactNode;
}

const Polyline: React.FC<PolylineProps> = ({
  coordinates,
  strokeColor = '#000000',
  strokeWidth = 2,
  strokeOpacity = 1.0,
  strokePattern = 'solid',
  lineCap = 'round',
  lineJoin = 'round',
  zIndex = 0,
  visible = true,
  children
}) => {
  // Development validation
  if (__DEV__) {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      console.warn('Polyline: coordinates must be an array with at least 2 points');
    }
    coordinates?.forEach((coord, index) => {
      if (!coord || typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
        console.warn(`Polyline: Invalid coordinate at index ${index}`, coord);
      }
    });
  }
  
  return null;
};

Polyline.displayName = 'Polyline';

export { Polyline };
export type { PolylineProps }; 