import { buildGpxTrack } from '../../utils/gpx';
import { LocationFix } from '../../types';

describe('GPX Track Builder', () => {
  const points: LocationFix[] = [
    {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 10,
      accuracy: 5,
      bearing: 90,
      speed: 1.5,
      timestamp: 1700000000000
    },
    {
      latitude: 40.7130,
      longitude: -74.0062,
      altitude: 12,
      accuracy: 6,
      bearing: 95,
      speed: 1.6,
      timestamp: 1700000010000
    }
  ];

  it('produces a valid GPX 1.1 document', () => {
    const gpx = buildGpxTrack(points);
    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx).toContain('xmlns="http://www.topografix.com/GPX/1/1"');
    expect(gpx).toContain('<trk>');
    expect(gpx).toContain('<trkseg>');
  });

  it('emits a trkpt per point with lat/lon attributes', () => {
    const gpx = buildGpxTrack(points);
    expect(gpx).toContain('<trkpt lat="40.7128" lon="-74.006">');
    expect(gpx).toContain('<trkpt lat="40.713" lon="-74.0062">');
  });

  it('maps altitude, timestamp, accuracy, bearing, and speed', () => {
    const gpx = buildGpxTrack(points);
    expect(gpx).toContain('<ele>10</ele>');
    expect(gpx).toContain(`<time>${new Date(1700000000000).toISOString()}</time>`);
    expect(gpx).toContain('<accuracy>5</accuracy>');
    expect(gpx).toContain('<bearing>90</bearing>');
    expect(gpx).toContain('<speed>1.5</speed>');
  });

  it('uses the provided track name and creator, escaping XML-sensitive characters', () => {
    const gpx = buildGpxTrack(points, { trackName: 'Tom & Jerry\'s Walk', creator: 'my-app' });
    expect(gpx).toContain('<name>Tom &amp; Jerry&apos;s Walk</name>');
    expect(gpx).toContain('creator="my-app"');
  });

  it('falls back to default name and creator when not provided', () => {
    const gpx = buildGpxTrack(points);
    expect(gpx).toContain('<name>Track</name>');
    expect(gpx).toContain('creator="expo-osm-sdk"');
  });

  it('skips points with invalid coordinates', () => {
    const withInvalid: LocationFix[] = [
      ...points,
      { latitude: NaN, longitude: -74 } as LocationFix
    ];
    const gpx = buildGpxTrack(withInvalid);
    const trkptCount = (gpx.match(/<trkpt /g) || []).length;
    expect(trkptCount).toBe(2);
  });

  it('omits <ele>, <time>, and <extensions> when fields are absent', () => {
    const minimal: LocationFix[] = [
      { latitude: 1, longitude: 2 },
      { latitude: 3, longitude: 4 }
    ];
    const gpx = buildGpxTrack(minimal);
    expect(gpx).not.toContain('<ele>');
    expect(gpx).not.toContain('<time>');
    expect(gpx).not.toContain('<extensions>');
  });

  it('handles an empty points array', () => {
    const gpx = buildGpxTrack([]);
    expect(gpx).toContain('<trkseg>');
    expect(gpx).not.toContain('<trkpt');
  });
});
