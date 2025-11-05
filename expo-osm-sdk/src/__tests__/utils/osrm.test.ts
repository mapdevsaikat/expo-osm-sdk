import { calculateRoute, OSRMProfile } from '../../utils/osrm';
import { Coordinate } from '../../types';

// Test coordinates (NYC to Brooklyn)
const testCoordinates: [Coordinate, Coordinate] = [
  { latitude: 40.7128, longitude: -74.0060 }, // NYC
  { latitude: 40.6782, longitude: -73.9442 }  // Brooklyn
];

describe('OSRM Routing Tests', () => {
  // Increase timeout for API calls
  jest.setTimeout(30000);

  const profiles: OSRMProfile[] = ['driving', 'walking', 'cycling'];

  profiles.forEach(profile => {
    test(`should calculate ${profile} route successfully`, async () => {
      try {
        const routes = await calculateRoute(testCoordinates, { profile });
        
        expect(routes).toBeDefined();
        expect(routes.length).toBeGreaterThan(0);
        
        const route = routes[0];
        expect(route).toBeDefined();
        expect(route.coordinates).toBeDefined();
        expect(route.coordinates.length).toBeGreaterThan(0);
        expect(route.distance).toBeGreaterThan(0);
        expect(route.duration).toBeGreaterThan(0);
        expect(route.steps).toBeDefined();
        expect(route.steps.length).toBeGreaterThan(0);
        
        // Check coordinate validity
        route.coordinates.forEach(coord => {
          expect(coord.latitude).toBeGreaterThanOrEqual(-90);
          expect(coord.latitude).toBeLessThanOrEqual(90);
          expect(coord.longitude).toBeGreaterThanOrEqual(-180);
          expect(coord.longitude).toBeLessThanOrEqual(180);
        });
        
        
        console.log(`✅ ${profile} route: ${route.distance}m in ${route.duration}s with ${route.steps.length} steps`);
        
      } catch (error) {
        console.error(`❌ ${profile} routing failed:`, error);
        throw error;
      }
    });
  });

  test('should handle invalid coordinates', async () => {
    const invalidCoords: [Coordinate, Coordinate] = [
      { latitude: 91, longitude: -74.0060 }, // Invalid latitude
      { latitude: 40.6782, longitude: -73.9442 }
    ];

    await expect(calculateRoute(invalidCoords, { profile: 'driving' }))
      .rejects
      .toThrow();
  });

  test('should handle empty waypoints', async () => {
    await expect(calculateRoute([], { profile: 'driving' }))
      .rejects
      .toThrow('At least 2 waypoints are required');
  });

  test('should handle single waypoint', async () => {
    await expect(calculateRoute([testCoordinates[0]], { profile: 'driving' }))
      .rejects
      .toThrow('At least 2 waypoints are required');
  });

  test('should return different routes for different profiles', async () => {
    const drivingRoutes = await calculateRoute(testCoordinates, { profile: 'driving' });
    const walkingRoutes = await calculateRoute(testCoordinates, { profile: 'walking' });
    
    expect(drivingRoutes.length).toBeGreaterThan(0);
    expect(walkingRoutes.length).toBeGreaterThan(0);
    
    // Driving should generally be faster than walking
    expect(drivingRoutes[0].duration).toBeLessThan(walkingRoutes[0].duration);
    
    // Routes might have different paths
    expect(drivingRoutes[0].coordinates).not.toEqual(walkingRoutes[0].coordinates);
  });

  test('should handle alternatives option', async () => {
    const routesWithAlternatives = await calculateRoute(testCoordinates, { 
      profile: 'driving',
      alternatives: true 
    });
    
    expect(routesWithAlternatives).toBeDefined();
    expect(routesWithAlternatives.length).toBeGreaterThan(0);
    
    // May or may not have alternatives depending on the route
    console.log(`Found ${routesWithAlternatives.length} route alternatives`);
  });
}); 