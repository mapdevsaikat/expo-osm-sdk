import { renderHook, act } from '@testing-library/react-native';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import type { OSMViewRef, LocationFix } from '../../types';

const NYC: LocationFix = { latitude: 40.7128, longitude: -74.0060, timestamp: 1000 };
const NEARBY: LocationFix = { latitude: 40.71281, longitude: -74.00601, timestamp: 2000 }; // ~1m away
const LONDON: LocationFix = { latitude: 51.5074, longitude: -0.1278, timestamp: 3000 };

function createMockRef(): React.RefObject<OSMViewRef> {
  const mock = {
    requestLocationPermission: jest.fn().mockResolvedValue(true),
    startLocationTracking: jest.fn().mockResolvedValue(undefined),
    stopLocationTracking: jest.fn().mockResolvedValue(undefined),
  } as unknown as OSMViewRef;
  return { current: mock };
}

describe('useLocationTracking — track recording', () => {
  it('does not record fixes when recordTrack is false (default)', async () => {
    const ref = createMockRef();
    const { result } = renderHook(() => useLocationTracking(ref));

    await act(async () => {
      await result.current.startTracking();
    });
    act(() => {
      result.current.ingestLocationFix(NYC);
    });

    expect(result.current.trackPoints).toEqual([]);
  });

  it('does not record fixes while tracking is inactive, even with recordTrack: true', () => {
    const ref = createMockRef();
    const { result } = renderHook(() => useLocationTracking(ref, { recordTrack: true }));

    act(() => {
      result.current.ingestLocationFix(NYC);
    });

    expect(result.current.trackPoints).toEqual([]);
  });

  it('records fixes while tracking is active and recordTrack is true', async () => {
    const ref = createMockRef();
    const { result } = renderHook(() => useLocationTracking(ref, { recordTrack: true }));

    await act(async () => {
      await result.current.startTracking();
    });
    act(() => {
      result.current.ingestLocationFix(NYC);
      result.current.ingestLocationFix(LONDON);
    });

    expect(result.current.trackPoints).toEqual([NYC, LONDON]);
  });

  it('clearTrack() empties the buffer', async () => {
    const ref = createMockRef();
    const { result } = renderHook(() => useLocationTracking(ref, { recordTrack: true }));

    await act(async () => {
      await result.current.startTracking();
    });
    act(() => {
      result.current.ingestLocationFix(NYC);
      result.current.clearTrack();
    });

    expect(result.current.trackPoints).toEqual([]);
  });

  it('filters out points closer than minTrackDistanceMeters', async () => {
    const ref = createMockRef();
    const { result } = renderHook(() =>
      useLocationTracking(ref, { recordTrack: true, minTrackDistanceMeters: 50 })
    );

    await act(async () => {
      await result.current.startTracking();
    });
    act(() => {
      result.current.ingestLocationFix(NYC);
      result.current.ingestLocationFix(NEARBY); // ~1m away — should be dropped
      result.current.ingestLocationFix(LONDON); // far away — should be kept
    });

    expect(result.current.trackPoints).toEqual([NYC, LONDON]);
  });

  it('caps the buffer at maxTrackPoints, dropping the oldest fixes', async () => {
    const ref = createMockRef();
    const { result } = renderHook(() =>
      useLocationTracking(ref, { recordTrack: true, maxTrackPoints: 2 })
    );

    await act(async () => {
      await result.current.startTracking();
    });
    act(() => {
      result.current.ingestLocationFix(NYC);
      result.current.ingestLocationFix(NEARBY);
      result.current.ingestLocationFix(LONDON);
    });

    expect(result.current.trackPoints).toEqual([NEARBY, LONDON]);
  });

  it('exportTrackAsGpx returns null with fewer than 2 points', async () => {
    const ref = createMockRef();
    const { result } = renderHook(() => useLocationTracking(ref, { recordTrack: true }));

    await act(async () => {
      await result.current.startTracking();
    });
    act(() => {
      result.current.ingestLocationFix(NYC);
    });

    expect(result.current.exportTrackAsGpx()).toBeNull();
  });

  it('exportTrackAsGpx returns a GPX document once 2+ points are recorded', async () => {
    const ref = createMockRef();
    const { result } = renderHook(() => useLocationTracking(ref, { recordTrack: true }));

    await act(async () => {
      await result.current.startTracking();
    });
    act(() => {
      result.current.ingestLocationFix(NYC);
      result.current.ingestLocationFix(LONDON);
    });

    const gpx = result.current.exportTrackAsGpx({ trackName: 'Test Track' });
    expect(gpx).toContain('<name>Test Track</name>');
    expect(gpx).toContain('<trkpt lat="40.7128" lon="-74.006">');
    expect(gpx).toContain('<trkpt lat="51.5074" lon="-0.1278">');
  });
});
