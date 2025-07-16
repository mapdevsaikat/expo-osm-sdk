import React from 'react';
import { PolylineConfig } from '../types';

/**
 * Polyline component for OSMView
 * 
 * Note: This component is primarily a data container for polylines.
 * The actual rendering is handled by the OSMView component through
 * the polylines prop. This component exists to provide a consistent
 * API interface similar to other map libraries.
 */
interface PolylineProps extends Omit<PolylineConfig, 'id'> {
  children?: React.ReactNode;
}

const Polyline: React.FC<PolylineProps> = ({
  coordinates,
  strokeColor,
  strokeWidth,
  strokeOpacity,
  strokePattern,
  lineCap,
  lineJoin,
  zIndex,
  visible,
  children
}) => {
  // This component doesn't render anything directly
  // It's used as a data structure for OSMView
  return null;
};

Polyline.displayName = 'Polyline';

export { Polyline };
export type { PolylineProps }; 