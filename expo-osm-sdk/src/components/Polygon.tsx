import React from 'react';
import { PolygonConfig } from '../types';

/**
 * Polygon component for OSMView
 * 
 * Note: This component is primarily a data container for polygons.
 * The actual rendering is handled by the OSMView component through
 * the polygons prop. This component exists to provide a consistent
 * API interface similar to other map libraries.
 */
interface PolygonProps extends Omit<PolygonConfig, 'id'> {
  children?: React.ReactNode;
}

const Polygon: React.FC<PolygonProps> = ({
  coordinates,
  holes,
  fillColor,
  fillOpacity,
  strokeColor,
  strokeWidth,
  strokeOpacity,
  strokePattern,
  zIndex,
  visible,
  children
}) => {
  // This component doesn't render anything directly
  // It's used as a data structure for OSMView
  return null;
};

Polygon.displayName = 'Polygon';

export { Polygon };
export type { PolygonProps }; 