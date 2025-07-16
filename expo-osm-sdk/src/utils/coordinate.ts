import { Coordinate, MarkerConfig, MarkerIcon, MarkerAnimation } from '../types';

/**
 * Validates if a coordinate is within valid geographic bounds
 */
export const isValidCoordinate = (coordinate: Coordinate | null | undefined): boolean => {
  if (!coordinate || typeof coordinate !== 'object') {
    return false;
  }
  
  const { latitude, longitude } = coordinate;
  
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  
  return (
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  );
};

/**
 * Validates and normalizes a coordinate
 */
export const validateCoordinate = (coordinate: Coordinate): Coordinate => {
  if (!isValidCoordinate(coordinate)) {
    throw new Error(`Invalid coordinate: ${JSON.stringify(coordinate)}`);
  }
  
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
  };
};

/**
 * Normalizes a coordinate to valid ranges
 */
export const normalizeCoordinate = (coordinate: Coordinate): Coordinate => {
  let { latitude, longitude } = coordinate;
  
  // Clamp latitude to valid range
  latitude = Math.max(-90, Math.min(90, latitude));
  
  // Wrap longitude to valid range
  longitude = ((longitude + 180) % 360) - 180;
  if (longitude < -180) longitude += 360;
  
  return { latitude, longitude };
};

/**
 * Converts coordinate to string representation
 */
export const coordinateToString = (coordinate: Coordinate, precision: number = 4): string => {
  const { latitude, longitude } = coordinate;
  return `${latitude.toFixed(precision)},${longitude.toFixed(precision)}`;
};

/**
 * Calculates the distance between two coordinates using the Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (from: Coordinate, to: Coordinate): number => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = toRadians(from.latitude);
  const φ2 = toRadians(to.latitude);
  const Δφ = toRadians(to.latitude - from.latitude);
  const Δλ = toRadians(to.longitude - from.longitude);

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

/**
 * Calculates the bearing (direction) from one coordinate to another
 * Returns bearing in degrees (0-360)
 */
export const calculateBearing = (from: Coordinate, to: Coordinate): number => {
  const φ1 = toRadians(from.latitude);
  const φ2 = toRadians(to.latitude);
  const Δλ = toRadians(to.longitude - from.longitude);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
};

/**
 * Converts degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Converts radians to degrees
 */
const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

/**
 * Calculates the midpoint between two coordinates
 */
export const calculateMidpoint = (from: Coordinate, to: Coordinate): Coordinate => {
  const φ1 = toRadians(from.latitude);
  const φ2 = toRadians(to.latitude);
  const Δλ = toRadians(to.longitude - from.longitude);

  const Bx = Math.cos(φ2) * Math.cos(Δλ);
  const By = Math.cos(φ2) * Math.sin(Δλ);

  const φ3 = Math.atan2(Math.sin(φ1) + Math.sin(φ2), 
                       Math.sqrt((Math.cos(φ1) + Bx) * (Math.cos(φ1) + Bx) + By * By));
  const λ3 = toRadians(from.longitude) + Math.atan2(By, Math.cos(φ1) + Bx);

  return {
    latitude: toDegrees(φ3),
    longitude: toDegrees(λ3),
  };
};

/**
 * Checks if a coordinate is within a bounding box
 */
export const isWithinBounds = (
  coordinate: Coordinate,
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }
): boolean => {
  const { latitude, longitude } = coordinate;
  const { north, south, east, west } = bounds;
  
  // Handle bounds crossing the date line
  if (west > east) {
    // Bounds cross the date line
    return (
      latitude >= south &&
      latitude <= north &&
      (longitude >= west || longitude <= east)
    );
  }
  
  return (
    latitude >= south &&
    latitude <= north &&
    longitude >= west &&
    longitude <= east
  );
};

/**
 * Calculates a bounding box around a coordinate with given radius
 */
export const calculateBoundingBox = (
  center: Coordinate,
  radiusMeters: number
): {
  north: number;
  south: number;
  east: number;
  west: number;
} => {
  const R = 6371000; // Earth's radius in meters
  const φ = toRadians(center.latitude);
  const λ = toRadians(center.longitude);
  
  const δφ = radiusMeters / R;
  const δλ = radiusMeters / (R * Math.cos(φ));
  
  const north = Math.min(90, toDegrees(φ + δφ));
  const south = Math.max(-90, toDegrees(φ - δφ));
  const east = toDegrees(λ + δλ);
  const west = toDegrees(λ - δλ);
  
  return {
    north,
    south,
    east,
    west,
  };
};

/**
 * Validates a marker icon configuration
 */
export const validateMarkerIcon = (icon: MarkerIcon | undefined): boolean => {
  if (!icon) return true;
  
  if (typeof icon !== 'object') return false;
  
  // Validate size
  if (icon.size !== undefined && (typeof icon.size !== 'number' || icon.size <= 0)) {
    return false;
  }
  
  // Validate color
  if (icon.color !== undefined && typeof icon.color !== 'string') {
    return false;
  }
  
  // Validate anchor
  if (icon.anchor !== undefined) {
    if (typeof icon.anchor !== 'object' || 
        typeof icon.anchor.x !== 'number' || 
        typeof icon.anchor.y !== 'number' ||
        icon.anchor.x < 0 || icon.anchor.x > 1 ||
        icon.anchor.y < 0 || icon.anchor.y > 1) {
      return false;
    }
  }
  
  return true;
};

/**
 * Validates a marker animation configuration
 */
export const validateMarkerAnimation = (animation: MarkerAnimation | undefined): boolean => {
  if (!animation) return true;
  
  if (typeof animation !== 'object') return false;
  
  const validTypes = ['bounce', 'pulse', 'fade', 'scale', 'drop'];
  if (!validTypes.includes(animation.type)) {
    return false;
  }
  
  if (animation.duration !== undefined && (typeof animation.duration !== 'number' || animation.duration <= 0)) {
    return false;
  }
  
  if (animation.delay !== undefined && (typeof animation.delay !== 'number' || animation.delay < 0)) {
    return false;
  }
  
  if (animation.repeat !== undefined && typeof animation.repeat !== 'boolean') {
    return false;
  }
  
  return true;
};

/**
 * Validates a complete marker configuration
 */
export const validateMarkerConfig = (marker: MarkerConfig, propName: string = 'marker'): void => {
  if (!marker || typeof marker !== 'object') {
    throw new Error(`${propName} must be an object`);
  }
  
  if (!marker.id || typeof marker.id !== 'string') {
    throw new Error(`${propName}.id must be a non-empty string`);
  }
  
  // Validate coordinate
  validateCoordinate(marker.coordinate);
  
  // Validate icon
  if (!validateMarkerIcon(marker.icon)) {
    throw new Error(`${propName}.icon configuration is invalid`);
  }
  
  // Validate animation
  if (!validateMarkerAnimation(marker.animation)) {
    throw new Error(`${propName}.animation configuration is invalid`);
  }
  
  // Validate numeric properties
  if (marker.zIndex !== undefined && typeof marker.zIndex !== 'number') {
    throw new Error(`${propName}.zIndex must be a number`);
  }
  
  if (marker.opacity !== undefined && (typeof marker.opacity !== 'number' || marker.opacity < 0 || marker.opacity > 1)) {
    throw new Error(`${propName}.opacity must be a number between 0 and 1`);
  }
  
  if (marker.rotation !== undefined && typeof marker.rotation !== 'number') {
    throw new Error(`${propName}.rotation must be a number`);
  }
  
  // Validate boolean properties
  if (marker.draggable !== undefined && typeof marker.draggable !== 'boolean') {
    throw new Error(`${propName}.draggable must be a boolean`);
  }
  
  if (marker.visible !== undefined && typeof marker.visible !== 'boolean') {
    throw new Error(`${propName}.visible must be a boolean`);
  }
  
  if (marker.clustered !== undefined && typeof marker.clustered !== 'boolean') {
    throw new Error(`${propName}.clustered must be a boolean`);
  }
}; 