import React from 'react';
import { OverlayConfig } from '../types';

/**
 * CustomOverlay component for OSMView
 * 
 * Note: This component is primarily a data container for custom overlays.
 * The actual rendering is handled by the OSMView component through
 * the overlays prop. This component exists to provide a consistent
 * API interface similar to other map libraries.
 */
interface CustomOverlayProps extends Omit<OverlayConfig, 'id' | 'component'> {
  children: React.ReactNode;
}

const CustomOverlay: React.FC<CustomOverlayProps> = ({
  coordinate,
  width,
  height,
  anchor,
  zIndex,
  visible,
  children
}) => {
  // This component doesn't render anything directly
  // It's used as a data structure for OSMView
  return null;
};

CustomOverlay.displayName = 'CustomOverlay';

export { CustomOverlay };
export type { CustomOverlayProps }; 