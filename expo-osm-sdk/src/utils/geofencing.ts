/**
 * Geofencing Utility Functions
 * 
 * Core algorithms for geofence detection:
 * - Distance calculations (Haversine formula)
 * - Point-in-polygon detection (Ray casting algorithm)
 * - Circle boundary checks
 */

import type { Coordinate, Geofence, CircleGeofence, PolygonGeofence } from '../types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param point1 First coordinate
 * @param point2 Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(point1: Coordinate, point2: Coordinate): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if a point is inside a circle geofence
 * @param point Point to check
 * @param geofence Circle geofence
 * @returns true if point is inside the circle
 */
export function isPointInCircle(
  point: Coordinate,
  geofence: CircleGeofence
): boolean {
  const distance = calculateDistance(point, geofence.center);
  return distance <= geofence.radius;
}

/**
 * Check if a point is inside a polygon geofence using ray casting algorithm
 * @param point Point to check
 * @param geofence Polygon geofence
 * @returns true if point is inside the polygon
 */
export function isPointInPolygon(
  point: Coordinate,
  geofence: PolygonGeofence
): boolean {
  const coordinates = geofence.coordinates;
  
  // Need at least 3 points for a polygon
  if (coordinates.length < 3) {
    console.warn(`Polygon geofence ${geofence.id} has less than 3 points`);
    return false;
  }

  let inside = false;
  const x = point.longitude;
  const y = point.latitude;

  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const coordI = coordinates[i];
    const coordJ = coordinates[j];
    if (!coordI || !coordJ) continue;
    
    const xi = coordI.longitude;
    const yi = coordI.latitude;
    const xj = coordJ.longitude;
    const yj = coordJ.latitude;

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Check if a point is inside any geofence
 * @param point Point to check
 * @param geofence Geofence (circle or polygon)
 * @returns true if point is inside the geofence
 */
export function isPointInGeofence(
  point: Coordinate,
  geofence: Geofence
): boolean {
  if (geofence.type === 'circle') {
    return isPointInCircle(point, geofence);
  } else if (geofence.type === 'polygon') {
    return isPointInPolygon(point, geofence);
  }
  return false;
}

/**
 * Calculate distance from point to geofence boundary
 * @param point Point to check
 * @param geofence Geofence
 * @returns Distance in meters (positive if outside, negative if inside)
 */
export function distanceToGeofence(
  point: Coordinate,
  geofence: Geofence
): number {
  if (geofence.type === 'circle') {
    const distance = calculateDistance(point, geofence.center);
    return distance - geofence.radius;
  } else if (geofence.type === 'polygon') {
    // For polygon, calculate minimum distance to any edge
    return distanceToPolygonEdge(point, geofence.coordinates);
  }
  return 0;
}

/**
 * Calculate minimum distance from point to polygon edge
 * @param point Point to check
 * @param coordinates Polygon coordinates
 * @returns Minimum distance in meters
 */
function distanceToPolygonEdge(
  point: Coordinate,
  coordinates: Coordinate[]
): number {
  let minDistance = Infinity;

  for (let i = 0; i < coordinates.length; i++) {
    const start = coordinates[i];
    const end = coordinates[(i + 1) % coordinates.length];
    if (!start || !end) continue;
    const distance = distanceToLineSegment(point, start, end);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

/**
 * Calculate distance from point to line segment
 * @param point Point to check
 * @param lineStart Start of line segment
 * @param lineEnd End of line segment
 * @returns Distance in meters
 */
function distanceToLineSegment(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate
): number {
  // Convert coordinates to approximate Cartesian (good enough for small distances)
  const A = point.latitude - lineStart.latitude;
  const B = point.longitude - lineStart.longitude;
  const C = lineEnd.latitude - lineStart.latitude;
  const D = lineEnd.longitude - lineStart.longitude;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) {
    // Line segment is actually a point
    return calculateDistance(point, lineStart);
  }

  const param = dot / lenSq;

  let closestPoint: Coordinate;

  if (param < 0) {
    closestPoint = lineStart;
  } else if (param > 1) {
    closestPoint = lineEnd;
  } else {
    closestPoint = {
      latitude: lineStart.latitude + param * C,
      longitude: lineStart.longitude + param * D,
    };
  }

  return calculateDistance(point, closestPoint);
}

/**
 * Validate geofence configuration
 * @param geofence Geofence to validate
 * @returns true if valid, false otherwise
 */
export function validateGeofence(geofence: Geofence): boolean {
  // Check ID
  if (!geofence || !geofence.id || typeof geofence.id !== 'string') {
    console.warn('Geofence must have a valid ID');
    return false;
  }

  // Check type
  const geofenceType = geofence.type;
  if (geofenceType !== 'circle' && geofenceType !== 'polygon') {
    console.warn(`Invalid geofence type: ${geofenceType}`);
    return false;
  }

  // Type-specific validation
  if (geofenceType === 'circle') {
    const circleGeofence = geofence as CircleGeofence;
    if (!circleGeofence.center || typeof circleGeofence.center.latitude !== 'number' || typeof circleGeofence.center.longitude !== 'number') {
      console.warn('Circle geofence must have a valid center coordinate');
      return false;
    }
    if (typeof circleGeofence.radius !== 'number' || circleGeofence.radius <= 0) {
      console.warn('Circle geofence must have a positive radius');
      return false;
    }
  } else if (geofenceType === 'polygon') {
    const polygonGeofence = geofence as PolygonGeofence;
    if (!Array.isArray(polygonGeofence.coordinates) || polygonGeofence.coordinates.length < 3) {
      console.warn('Polygon geofence must have at least 3 coordinates');
      return false;
    }
    for (const coord of polygonGeofence.coordinates) {
      if (!coord || typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
        console.warn('All polygon coordinates must be valid');
        return false;
      }
    }
  }

  return true;
}

/**
 * Get center point of a geofence
 * @param geofence Geofence
 * @returns Center coordinate
 */
export function getGeofenceCenter(geofence: Geofence): Coordinate {
  if (geofence.type === 'circle') {
    return geofence.center;
  } else {
    // Calculate centroid of polygon
    const coords = geofence.coordinates;
    const lat = coords.reduce((sum, c) => sum + c.latitude, 0) / coords.length;
    const lng = coords.reduce((sum, c) => sum + c.longitude, 0) / coords.length;
    return { latitude: lat, longitude: lng };
  }
}

/**
 * Check if two geofences overlap
 * @param geofence1 First geofence
 * @param geofence2 Second geofence
 * @returns true if geofences overlap
 */
export function doGeofencesOverlap(
  geofence1: Geofence,
  geofence2: Geofence
): boolean {
  // Simple bounding box check first
  const center1 = getGeofenceCenter(geofence1);
  const center2 = getGeofenceCenter(geofence2);
  const distance = calculateDistance(center1, center2);

  // Get approximate radius for each geofence
  const radius1 = getApproximateRadius(geofence1);
  const radius2 = getApproximateRadius(geofence2);

  // If centers are too far apart, no overlap
  if (distance > radius1 + radius2) {
    return false;
  }

  // For more accurate check, test if any corner of one is inside the other
  if (geofence1.type === 'polygon') {
    for (const coord of geofence1.coordinates) {
      if (isPointInGeofence(coord, geofence2)) {
        return true;
      }
    }
  }

  if (geofence2.type === 'polygon') {
    for (const coord of geofence2.coordinates) {
      if (isPointInGeofence(coord, geofence1)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get approximate radius of a geofence
 * @param geofence Geofence
 * @returns Approximate radius in meters
 */
function getApproximateRadius(geofence: Geofence): number {
  if (geofence.type === 'circle') {
    return geofence.radius;
  } else {
    // For polygon, find furthest point from center
    const center = getGeofenceCenter(geofence);
    let maxDistance = 0;
    for (const coord of geofence.coordinates) {
      const distance = calculateDistance(center, coord);
      maxDistance = Math.max(maxDistance, distance);
    }
    return maxDistance;
  }
}

