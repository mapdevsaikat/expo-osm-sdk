import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { NavigationControls } from '../../components/NavigationControls';

describe('NavigationControls bearing/pitch', () => {
  it('uses getBearing when bearing prop is omitted', async () => {
    const getBearing = jest.fn().mockResolvedValue(90);

    await act(async () => {
      TestRenderer.create(
        React.createElement(NavigationControls, {
          onZoomIn: () => {},
          onZoomOut: () => {},
          getBearing,
        })
      );
      await Promise.resolve();
    });

    expect(getBearing).toHaveBeenCalled();
  });

  it('does not poll getBearing when bearing prop is controlled', async () => {
    const getBearing = jest.fn().mockResolvedValue(90);

    await act(async () => {
      TestRenderer.create(
        React.createElement(NavigationControls, {
          bearing: 15,
          onZoomIn: () => {},
          onZoomOut: () => {},
          getBearing,
        })
      );
      await Promise.resolve();
    });

    expect(getBearing).not.toHaveBeenCalled();
  });

  it('invokes onResetBearing callback when compass is pressed', () => {
    const onResetBearing = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        React.createElement(NavigationControls, {
          onZoomIn: () => {},
          onZoomOut: () => {},
          onResetBearing,
        })
      );
    });

    const compass = renderer.root.find(
      (node) => node.props.accessibilityLabel === 'Reset bearing to north'
    );
    act(() => {
      compass.props.onPress();
    });

    expect(onResetBearing).toHaveBeenCalledTimes(1);
    renderer.unmount();
  });

  it('rotates compass needle opposite controlled bearing', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        React.createElement(NavigationControls, {
          bearing: 90,
          onZoomIn: () => {},
          onZoomOut: () => {},
        })
      );
    });

    const needleViews = renderer.root.findAll(
      (node) =>
        Array.isArray(node.props.style?.transform) &&
        node.props.style.transform.some(
          (entry: { rotate?: string }) => entry.rotate === '-90deg'
        )
    );
    expect(needleViews.length).toBeGreaterThan(0);
    renderer.unmount();
  });

  it('updates compass rotation when bearing prop changes', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        React.createElement(NavigationControls, {
          bearing: 0,
          onZoomIn: () => {},
          onZoomOut: () => {},
        })
      );
    });

    act(() => {
      renderer.update(
        React.createElement(NavigationControls, {
          bearing: 45,
          onZoomIn: () => {},
          onZoomOut: () => {},
        })
      );
    });

    const needleViews = renderer.root.findAll(
      (node) =>
        Array.isArray(node.props.style?.transform) &&
        node.props.style.transform.some(
          (entry: { rotate?: string }) => entry.rotate === '-45deg'
        )
    );
    expect(needleViews.length).toBeGreaterThan(0);
    renderer.unmount();
  });
});
