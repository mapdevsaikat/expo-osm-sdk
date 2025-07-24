import { calculateRoute } from '../../utils/osrm';
import type { Coordinate, Route } from '../../types';

describe('OSRM Routing Integration', () => {
  const points: Coordinate[] = [
    { latitude: 40.7128, longitude: -74.0060 }, // New York
    { latitude: 41.8781, longitude: -87.6298 }, // Chicago
    { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
  ];

  it('calculates a multi-point route with distance and duration', async () => {
    const routes = await calculateRoute(points, { profile: 'driving', steps: true });
    expect(routes.length).toBeGreaterThan(0);
    const route: Route = routes[0];

    // Geometry
    expect(route.coordinates.length).toBeGreaterThan(points.length);

    // Distance (should be > 0 and plausible for NY->Chicago->LA)
    expect(route.distance).toBeGreaterThan(3000000); // > 3000km
    expect(route.distance).toBeLessThan(6000000);    // < 6000km

    // Duration (should be > 0)
    expect(route.duration).toBeGreaterThan(50000); // > 14 hours
    expect(route.duration).toBeLessThan(200000);   // < 55 hours

    // Steps (turn-by-turn)
    expect(Array.isArray(route.steps)).toBe(true);
    expect(route.steps.length).toBeGreaterThan(0);
    const step = route.steps[0];
    expect(step).toHaveProperty('distance');
    expect(step).toHaveProperty('duration');
    expect(step).toHaveProperty('instruction');
    expect(typeof step.instruction).toBe('string');
  });

  it('returns plausible turn-by-turn instructions', async () => {
    const routes = await calculateRoute(points, { profile: 'driving', steps: true });
    const route: Route = routes[0];
    const instructions = route.steps.map(s => s.instruction).join(' ');
    expect(instructions.length).toBeGreaterThan(10);
    // Should mention directions or turns
    expect(
      /left|right|continue|turn|exit|merge|keep/i.test(instructions)
    ).toBe(true);
  });

  it('handles two-point (A to B) routing', async () => {
    const abPoints = [points[0], points[1]];
    const routes = await calculateRoute(abPoints, { profile: 'driving', steps: true });
    expect(routes.length).toBeGreaterThan(0);
    const route: Route = routes[0];
    expect(route.coordinates.length).toBeGreaterThan(2);
    expect(route.distance).toBeGreaterThan(100000); // > 100km
    expect(route.steps.length).toBeGreaterThan(0);
  });

  it('throws for invalid coordinates', async () => {
    await expect(
      calculateRoute([
        { latitude: 999, longitude: 999 },
        { latitude: 0, longitude: 0 },
      ])
    ).rejects.toThrow();
  });
}); 