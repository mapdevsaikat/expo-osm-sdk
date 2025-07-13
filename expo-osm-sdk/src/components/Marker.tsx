import React from 'react';
import { MarkerProps } from '../types';

/**
 * Marker component for OSMView
 * 
 * Note: This component is primarily a data container for markers.
 * The actual rendering is handled by the OSMView component through
 * the markers prop. This component exists to provide a consistent
 * API interface similar to other map libraries.
 */
const Marker: React.FC<MarkerProps> = ({
  coordinate,
  title,
  description,
  icon,
  onPress
}) => {
  // This component doesn't render anything directly
  // It's used as a data structure for OSMView
  return null;
};

// Helper function to create marker configuration from props
export const createMarkerConfig = (props: MarkerProps & { id: string }) => {
  return {
    id: props.id,
    coordinate: props.coordinate,
    title: props.title,
    description: props.description,
    icon: props.icon,
  };
};

export default Marker; 