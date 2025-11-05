import type { Coordinate, Route } from 'expo-osm-sdk';

export interface NavigationState {
  fromLocation: string;
  toLocation: string;
  fromCoordinate: Coordinate | null;
  toCoordinate: Coordinate | null;
  selectedMode: string;
  routes: { [key: string]: Route | null };
  isCalculating: boolean;
  currentRoute: Route | null;
  navigationStarted: boolean;
}

export type TabType = 'location' | 'cities' | 'settings' | 'routing';
export type BottomSheetState = 'closed' | 'half' | 'full';

