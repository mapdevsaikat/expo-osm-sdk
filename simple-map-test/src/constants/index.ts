import type { Coordinate } from 'expo-osm-sdk';

export interface City {
  id: string;
  name: string;
  coordinate: Coordinate;
}

export const CITIES: City[] = [
  { id: 'kolkata',   name: 'Kolkata',   coordinate: { latitude: 22.5726, longitude: 88.3639 } },
  { id: 'mumbai',    name: 'Mumbai',    coordinate: { latitude: 19.0760, longitude: 72.8777 } },
  { id: 'delhi',     name: 'Delhi',     coordinate: { latitude: 28.6139, longitude: 77.2090 } },
  { id: 'bangalore', name: 'Bangalore', coordinate: { latitude: 12.9716, longitude: 77.5946 } },
  { id: 'chennai',   name: 'Chennai',   coordinate: { latitude: 13.0827, longitude: 80.2707 } },
  { id: 'hyderabad', name: 'Hyderabad', coordinate: { latitude: 17.3850, longitude: 78.4867 } },
];

export const INDIA_CENTER: Coordinate = { latitude: 20.5937, longitude: 78.9629 };
