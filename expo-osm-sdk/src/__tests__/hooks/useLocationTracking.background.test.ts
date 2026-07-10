import { AppState } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import type { OSMViewRef, LocationFix } from '../../types';

const NYC: LocationFix = { latitude: 40.7128, longitude: -74.0060, timestamp: 1000 };
const NEARBY: LocationFix = { latitude: 40.71281, longitude: -74.00601, timestamp: 2000 }; // ~1m from NYC
const LONDON: LocationFix = { latitude: 51.5074, longitude: -0.1278, timestamp: 3000 };

function createMockRef(bufferedBatches: LocationFix[][] = []): {
  ref: React.RefObject<OSMViewRef>;
  mocks: {
    startLocationTracking: jest.Mock;
    stopLocationTracking: jest.Mock;
    getBufferedLocationFixes: jest.Mock;
  };
} {
  const getBufferedLocationFixes = jest.fn().mockResolvedValue([]);
  for (const batch of bufferedBatches) {
    getBufferedLocationFixes.mockResolvedValueOnce(batch);
  }
  const mocks = {
    requestLocationPermission: jest.fn().mockResolvedValue(true),
    startLocationTracking: jest.fn().mockResolvedValue(undefined),
    stopLocationTracking: jest.fn().mockResolvedValue(undefined),
    getBufferedLocationFixes,
  };
  return {
    ref: { current: mocks as unknown as OSMViewRef },
    mocks: mocks as any,
  };
}

describe('useLocationTracking — background tracking', () => {
  let appStateHandler: ((state: string) => void) | null;
  let removeSubscription: jest.Mock;

  beforeEach(() => {
    appStateHandler = null;
    removeSubscription = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _event: string,
      handler: (state: string) => void
    ) => {
      appStateHandler = handler;
      return { remove: removeSubscription } as any;
    }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes background/accuracy/notification options through to startLocationTracking', async () => {
    const { ref, mocks } = createMockRef();
    const { result } = renderHook(() =>
      useLocationTracking(ref, {
        background: true,
        accuracy: 'balanced',
        notification: { title: 'Recording', text: 'Run in progress' },
      })
    );

    await act(async () => {
      await result.current.startTracking();
    });

    expect(mocks.startLocationTracking).toHaveBeenCalledWith({
      background: true,
      accuracy: 'balanced',
      notification: { title: 'Recording', text: 'Run in progress' },
    });
  });

  it('calls startLocationTracking with no options when none are configured (backward compat)', async () => {
    const { ref, mocks } = createMockRef();
    const { result } = renderHook(() => useLocationTracking(ref));

    await act(async () => {
      await result.current.startTracking();
    });

    expect(mocks.startLocationTracking).toHaveBeenCalledWith(undefined);
  });

  it('does not listen to AppState when background is disabled', () => {
    const { ref } = createMockRef();
    renderHook(() => useLocationTracking(ref, { recordTrack: true }));

    expect(appStateHandler).toBeNull();
  });

  it('drains the native buffer into trackPoints when the app becomes active', async () => {
    const { ref, mocks } = createMockRef([[NYC, LONDON]]);
    const { result } = renderHook(() =>
      useLocationTracking(ref, { background: true, recordTrack: true })
    );

    await act(async () => {
      await result.current.startTracking();
    });

    expect(appStateHandler).not.toBeNull();
    await act(async () => {
      appStateHandler!('active');
    });

    expect(mocks.getBufferedLocationFixes).toHaveBeenCalledTimes(1);
    expect(result.current.trackPoints).toEqual([NYC, LONDON]);
    expect(result.current.currentLocation).toEqual({
      latitude: LONDON.latitude,
      longitude: LONDON.longitude,
    });
  });

  it('does not drain while tracking is inactive', async () => {
    const { ref, mocks } = createMockRef([[NYC]]);
    renderHook(() => useLocationTracking(ref, { background: true, recordTrack: true }));

    expect(appStateHandler).not.toBeNull();
    await act(async () => {
      appStateHandler!('active');
    });

    expect(mocks.getBufferedLocationFixes).not.toHaveBeenCalled();
  });

  it('applies minTrackDistanceMeters filtering to drained fixes', async () => {
    const { ref } = createMockRef([[NYC, NEARBY, LONDON]]);
    const { result } = renderHook(() =>
      useLocationTracking(ref, {
        background: true,
        recordTrack: true,
        minTrackDistanceMeters: 50,
      })
    );

    await act(async () => {
      await result.current.startTracking();
    });
    await act(async () => {
      appStateHandler!('active');
    });

    // NEARBY is ~1m from NYC — dropped; LONDON kept
    expect(result.current.trackPoints).toEqual([NYC, LONDON]);
  });

  it('caps drained fixes at maxTrackPoints, dropping the oldest', async () => {
    const { ref } = createMockRef([[NYC, NEARBY, LONDON]]);
    const { result } = renderHook(() =>
      useLocationTracking(ref, { background: true, recordTrack: true, maxTrackPoints: 2 })
    );

    await act(async () => {
      await result.current.startTracking();
    });
    await act(async () => {
      appStateHandler!('active');
    });

    expect(result.current.trackPoints).toEqual([NEARBY, LONDON]);
  });

  it('drains any remaining buffered fixes when tracking stops', async () => {
    const { ref, mocks } = createMockRef([[NYC, LONDON]]);
    const { result } = renderHook(() =>
      useLocationTracking(ref, { background: true, recordTrack: true })
    );

    await act(async () => {
      await result.current.startTracking();
    });
    await act(async () => {
      await result.current.stopTracking();
    });

    expect(mocks.stopLocationTracking).toHaveBeenCalledTimes(1);
    expect(mocks.getBufferedLocationFixes).toHaveBeenCalledTimes(1);
    expect(result.current.trackPoints).toEqual([NYC, LONDON]);
  });

  it('survives a native build without getBufferedLocationFixes', async () => {
    const mock = {
      requestLocationPermission: jest.fn().mockResolvedValue(true),
      startLocationTracking: jest.fn().mockResolvedValue(undefined),
      stopLocationTracking: jest.fn().mockResolvedValue(undefined),
      // no getBufferedLocationFixes — simulates an older native module
    } as unknown as OSMViewRef;
    const ref = { current: mock };

    const { result } = renderHook(() =>
      useLocationTracking(ref, { background: true, recordTrack: true })
    );

    await act(async () => {
      await result.current.startTracking();
    });
    await act(async () => {
      appStateHandler!('active');
    });
    await act(async () => {
      await result.current.stopTracking();
    });

    expect(result.current.trackPoints).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('removes the AppState listener on unmount', async () => {
    const { ref } = createMockRef();
    const { unmount } = renderHook(() =>
      useLocationTracking(ref, { background: true, recordTrack: true })
    );

    unmount();

    expect(removeSubscription).toHaveBeenCalled();
  });
});
