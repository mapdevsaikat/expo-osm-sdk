import React from 'react';
import { CircleConfig } from '../types';

/**
 * Circle component for OSMView
 * 
 * Note: This component is primarily a data container for circles.
 * The actual rendering is handled by the OSMView component through
 * the circles prop. This component exists to provide a consistent
 * API interface similar to other map libraries.
 */
interface CircleProps extends Omit<CircleConfig, 'id'> {
  children?: React.ReactNode;
}

const Circle: React.FC<CircleProps> = ({
  center,
  radius,
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

Circle.displayName = 'Circle';

export { Circle };
export type { CircleProps }; 