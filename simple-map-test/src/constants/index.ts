// Transport modes for routing
export interface TransportMode {
  id: string;
  name: string;
  icon: string;
  profile: 'driving' | 'walking' | 'cycling';
  color: string;
}

export const TRANSPORT_MODES: TransportMode[] = [
  { id: 'car', name: 'Car', icon: '🚗', profile: 'driving', color: '#007AFF' },
  { id: 'bike', name: 'Bike', icon: '🚴', profile: 'cycling', color: '#34C759' },
  { id: 'walk', name: 'Walk', icon: '🚶', profile: 'walking', color: '#8E8E93' },
];

// Default cities for navigation
export interface City {
  name: string;
  latitude: number;
  longitude: number;
  emoji: string;
}

export const DEFAULT_CITIES: City[] = [
  { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, emoji: '🏙️' },
  { name: 'Delhi', latitude: 28.6139, longitude: 77.2090, emoji: '🏛️' },
  { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946, emoji: '🌳' },
  { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639, emoji: '🎭' },
  { name: 'Chennai', latitude: 13.0827, longitude: 80.2707, emoji: '🏖️' },
  { name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867, emoji: '💎' },
];

// Layout constants
export const SEARCH_TOP_PADDING = 60; // Platform-specific values handled in App
export const ZOOM_CONTROLS_TOP = 60;

