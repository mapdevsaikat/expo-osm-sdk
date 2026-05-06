import React from 'react';
import { OverlayConfig } from '../types';

/**
 * CustomOverlay — type-level helper only.
 *
 * `OSMView` does not currently forward `overlays` to native or render overlay children on the map.
 * Use `markers[].icon.uri` / `icon.name`, or absolutely positioned views above the map.
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