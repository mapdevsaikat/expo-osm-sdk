/**
 * Reliability and error-path tests.
 *
 * These tests run in an environment where the native module is NOT available
 * (Expo Go / web-like), which is exactly the environment where the SDK must
 * degrade gracefully instead of crashing the host app.
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import OSMView from '../../components/OSMView';
import { MapContainer } from '../../components/MapContainer';
import { OSMErrorBoundary } from '../../components/OSMErrorBoundary';
import type { OSMViewRef, Coordinate } from '../../types';

const globalAny = global as any;

const validCenter: Coordinate = { latitude: 40.7128, longitude: -74.006 };

const renderWithRef = (props: any = {}) => {
  const ref = React.createRef<OSMViewRef>();
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      React.createElement(OSMView as any, { ref, initialCenter: validCenter, initialZoom: 10, ...props })
    );
  });
  return { ref, renderer };
};

describe('OSMView reliability', () => {
  beforeEach(() => {
    globalAny.__DEV__ = true;
  });

  afterEach(() => {
    globalAny.__DEV__ = true;
  });

  describe('ref contract (OSMViewRef)', () => {
    // Every method promised by the OSMViewRef type MUST exist on the ref so
    // apps can never hit "undefined is not a function".
    const REQUIRED_REF_METHODS: (keyof OSMViewRef)[] = [
      'zoomIn', 'zoomOut', 'setZoom',
      'animateToLocation', 'animateToRegion', 'fitToMarkers',
      'setPitch', 'setBearing', 'getPitch', 'getBearing', 'animateCamera',
      'requestLocationPermission', 'getCurrentLocation', 'startLocationTracking', 'stopLocationTracking', 'waitForLocation',
      'isViewReady',
      'displayRoute', 'clearRoute', 'fitRouteInView',
      'addMarker', 'removeMarker', 'updateMarker', 'animateMarker', 'showInfoWindow', 'hideInfoWindow',
      'addPolyline', 'removePolyline', 'updatePolyline',
      'addPolygon', 'removePolygon', 'updatePolygon',
      'addCircle', 'removeCircle', 'updateCircle',
      'addOverlay', 'removeOverlay', 'updateOverlay',
      'coordinateForPoint', 'pointForCoordinate', 'takeSnapshot',
    ];

    it('implements every method declared on OSMViewRef', () => {
      const { ref, renderer } = renderWithRef();
      expect(ref.current).not.toBeNull();
      for (const method of REQUIRED_REF_METHODS) {
        expect(typeof (ref.current as any)[method]).toBe('function');
      }
      renderer.unmount();
    });

    it('rejects unsupported methods with a descriptive error (never crashes)', async () => {
      const { ref, renderer } = renderWithRef();
      await expect(ref.current!.addMarker({} as any)).rejects.toThrow(/not supported/i);
      await expect(ref.current!.coordinateForPoint({ x: 0, y: 0 })).rejects.toThrow(/not implemented|not supported/i);
      await expect(ref.current!.pointForCoordinate(validCenter)).rejects.toThrow(/not implemented|not supported/i);
      renderer.unmount();
    });

    it('rejects native-backed methods with a clear message when native module is missing', async () => {
      const { ref, renderer } = renderWithRef();
      // These used to silently no-op, hiding failures from callers
      await expect(ref.current!.zoomIn()).rejects.toThrow(/native module not available/i);
      await expect(ref.current!.setZoom(12)).rejects.toThrow(/native module not available/i);
      await expect(ref.current!.animateToLocation(1, 2)).rejects.toThrow(/native module not available/i);
      await expect(ref.current!.getCurrentLocation()).rejects.toThrow(/native module not available/i);
      await expect(ref.current!.requestLocationPermission()).rejects.toThrow(/native module not available/i);
      await expect(ref.current!.takeSnapshot()).rejects.toThrow(/native module not available/i);
      renderer.unmount();
    });

    it('isViewReady resolves false instead of rejecting when native module is missing', async () => {
      const { ref, renderer } = renderWithRef();
      await expect(ref.current!.isViewReady()).resolves.toBe(false);
      renderer.unmount();
    });
  });

  describe('fallback rendering without native module', () => {
    it('renders the fallback UI instead of crashing', () => {
      const { renderer } = renderWithRef();
      const fallback = renderer.root.findAll(
        node => node.props?.testID === 'osm-view-fallback'
      );
      expect(fallback.length).toBe(1);
      renderer.unmount();
    });
  });

  describe('prop validation: development vs production', () => {
    const invalidCenter = { latitude: 999, longitude: 999 } as Coordinate;

    it('throws on invalid initialCenter in development', () => {
      globalAny.__DEV__ = true;
      expect(() => {
        act(() => {
          TestRenderer.create(
            React.createElement(OSMView as any, { initialCenter: invalidCenter })
          );
        });
      }).toThrow(/initialCenter/i);
    });

    it('recovers from invalid initialCenter in production (clamps + onError)', () => {
      globalAny.__DEV__ = false;
      const onError = jest.fn();
      let renderer!: TestRenderer.ReactTestRenderer;
      expect(() => {
        act(() => {
          renderer = TestRenderer.create(
            React.createElement(OSMView as any, { initialCenter: invalidCenter, onError })
          );
        });
      }).not.toThrow();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(onError.mock.calls[0][0].message).toMatch(/initialCenter/i);
      renderer.unmount();
    });

    it('throws on invalid initialZoom in development', () => {
      globalAny.__DEV__ = true;
      expect(() => {
        act(() => {
          TestRenderer.create(
            React.createElement(OSMView as any, { initialCenter: validCenter, initialZoom: 99 })
          );
        });
      }).toThrow(/initialZoom/i);
    });

    it('clamps invalid initialZoom in production instead of crashing', () => {
      globalAny.__DEV__ = false;
      const onError = jest.fn();
      let renderer!: TestRenderer.ReactTestRenderer;
      expect(() => {
        act(() => {
          renderer = TestRenderer.create(
            React.createElement(OSMView as any, {
              initialCenter: validCenter,
              initialZoom: 99,
              onError,
            })
          );
        });
      }).not.toThrow();
      expect(onError).toHaveBeenCalled();
      renderer.unmount();
    });

    it('accepts zoom levels up to 20 (range unified with MapContainer)', () => {
      globalAny.__DEV__ = true;
      expect(() => {
        act(() => {
          TestRenderer.create(
            React.createElement(OSMView as any, { initialCenter: validCenter, initialZoom: 20 })
          );
        });
      }).not.toThrow();
    });
  });

  describe('overlay sanitization (always on)', () => {
    it('skips invalid markers with a dev debug log instead of passing them through', () => {
      const markers = [
        { id: 'good', coordinate: validCenter },
        { id: 'bad', coordinate: { latitude: 999, longitude: 0 } },
        { coordinate: validCenter }, // missing id
        null,
      ];
      expect(() => {
        const { renderer } = renderWithRef({ markers });
        renderer.unmount();
      }).not.toThrow();
      expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('markers[1]'));
      expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('markers[2]'));
      expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('markers[3]'));
    });

    it('skips invalid circles, polylines and polygons', () => {
      const props = {
        circles: [
          { id: 'ok', center: validCenter, radius: 100 },
          { id: 'bad-radius', center: validCenter, radius: -5 },
        ],
        polylines: [
          { id: 'ok', coordinates: [validCenter, { latitude: 41, longitude: -74 }] },
          { id: 'too-short', coordinates: [validCenter] },
        ],
        polygons: [
          { id: 'ok', coordinates: [validCenter, { latitude: 41, longitude: -74 }, { latitude: 41, longitude: -73 }] },
          { id: 'bad-coord', coordinates: [validCenter, { latitude: 999, longitude: 0 }, validCenter] },
        ],
      };
      expect(() => {
        const { renderer } = renderWithRef(props);
        renderer.unmount();
      }).not.toThrow();
      expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('circles[1]'));
      expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('polylines[1]'));
      expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('polygons[1]'));
    });

    it('tolerates non-array overlay props', () => {
      expect(() => {
        const { renderer } = renderWithRef({
          markers: 'nonsense',
          circles: 42,
          polylines: null,
          polygons: {},
        });
        renderer.unmount();
      }).not.toThrow();
    });
  });

  describe('route display helpers', () => {
    it('displayRoute validates its input', async () => {
      const { ref, renderer } = renderWithRef();
      await expect(ref.current!.displayRoute([] as any)).rejects.toThrow(/at least 2 coordinates/i);
      await expect(
        ref.current!.displayRoute([
          { latitude: 999, longitude: 0 },
          { latitude: 999, longitude: 1 },
        ] as any)
      ).rejects.toThrow(/invalid coordinates/i);
      renderer.unmount();
    });

    it('displayRoute and clearRoute work without the native module (state only)', async () => {
      const { ref, renderer } = renderWithRef();
      await act(async () => {
        await expect(
          ref.current!.displayRoute([validCenter, { latitude: 41, longitude: -74 }])
        ).resolves.toBeUndefined();
      });
      await act(async () => {
        await expect(ref.current!.clearRoute()).resolves.toBeUndefined();
      });
      renderer.unmount();
    });

    it('fitRouteInView rejects clearly when native module is missing', async () => {
      const { ref, renderer } = renderWithRef();
      await expect(
        ref.current!.fitRouteInView([validCenter, { latitude: 41, longitude: -74 }])
      ).rejects.toThrow(/native module not available/i);
      renderer.unmount();
    });
  });
});

describe('OSMErrorBoundary', () => {
  const Boom: React.FC = () => {
    throw new Error('map exploded');
  };

  it('catches child errors and renders the default fallback', () => {
    const onError = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(OSMErrorBoundary, { onError }, React.createElement(Boom))
      );
    });
    const fallback = renderer.root.findAll(
      node => node.props?.testID === 'osm-error-boundary-fallback'
    );
    expect(fallback.length).toBe(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toBe('map exploded');
    renderer.unmount();
  });

  it('renders a custom fallback when provided', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(
          OSMErrorBoundary,
          {
            fallback: (error: Error) =>
              React.createElement('Text', { testID: 'custom-fallback' }, error.message),
          },
          React.createElement(Boom)
        )
      );
    });
    const fallback = renderer.root.findAll(node => node.props?.testID === 'custom-fallback');
    expect(fallback.length).toBe(1);
    renderer.unmount();
  });

  it('renders children normally when nothing throws', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(
          OSMErrorBoundary,
          null,
          React.createElement('Text', { testID: 'happy-child' }, 'ok')
        )
      );
    });
    expect(renderer.root.findAll(node => node.props?.testID === 'happy-child').length).toBe(1);
    renderer.unmount();
  });
});

describe('MapContainer', () => {
  beforeEach(() => {
    globalAny.__DEV__ = true;
  });

  it('accepts initialZoom up to 20 (previously rejected above 18)', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(MapContainer as any, {
          initialCenter: validCenter,
          initialZoom: 20,
        })
      );
    });
    // No validation error state -> the OSMView fallback (no native module) renders
    const fallback = renderer.root.findAll(node => node.props?.testID === 'osm-view-fallback');
    expect(fallback.length).toBe(1);
    renderer.unmount();
  });

  it('reports invalid props through onError and renders its fallback', () => {
    const onError = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(MapContainer as any, {
          initialCenter: { latitude: 200, longitude: 0 },
          onError,
        })
      );
    });
    expect(onError).toHaveBeenCalled();
    renderer.unmount();
  });
});
