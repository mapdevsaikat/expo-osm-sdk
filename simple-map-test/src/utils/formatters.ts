/**
 * Format duration in seconds to human-readable string
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Format distance in meters to human-readable string
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Calculate bearing (direction) between two coordinates in degrees (0-360)
 * @param from Starting coordinate
 * @param to Destination coordinate
 * @returns Bearing in degrees (0 = North, 90 = East, 180 = South, 270 = West)
 */
export const calculateBearing = (from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): number => {
  const lat1 = from.latitude * Math.PI / 180;
  const lat2 = to.latitude * Math.PI / 180;
  const dLon = (to.longitude - from.longitude) * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return bearing;
};

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
export const calculateDistance = (from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = from.latitude * Math.PI / 180;
  const φ2 = to.latitude * Math.PI / 180;
  const Δφ = (to.latitude - from.latitude) * Math.PI / 180;
  const Δλ = (to.longitude - from.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

