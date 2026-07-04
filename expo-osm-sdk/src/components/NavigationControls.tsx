import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { NavigationControlsProps } from '../types';
import {
  getMapControlMetrics,
  mapControlActiveTint,
  mapControlCardStyle,
  resolveMapControlSize,
  resolveMapControlTheme,
} from './mapControlStyles';

/**
 * NavigationControls - Grouped map navigation controls
 * Provides zoom, compass, and pitch controls in a vertical stack
 *
 * @example
 * <NavigationControls
 *   compact
 *   color="#007AFF"
 *   iconColor="#333"
 *   backgroundColor="#FFF"
 *   borderColor="#E0E0E0"
 *   onZoomIn={() => mapRef.current?.zoomIn()}
 *   onZoomOut={() => mapRef.current?.zoomOut()}
 * />
 */
export const NavigationControls: React.FC<NavigationControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetBearing,
  onResetPitch,
  bearing,
  pitch,
  style,
  compact,
  size,
  color,
  iconColor,
  iconMutedColor,
  backgroundColor,
  borderColor,
  activeBackgroundColor,
  theme,
  showPitchControl = true,
  showCompassControl = true,
  getBearing,
  getPitch,
}) => {
  const [currentBearing, setCurrentBearing] = useState(bearing ?? 0);
  const [currentPitch, setCurrentPitch] = useState(pitch ?? 0);
  const mountedRef = useRef(true);

  const cellSize = resolveMapControlSize(compact, size);
  const palette = resolveMapControlTheme({
    theme,
    color,
    iconColor,
    iconMutedColor,
    backgroundColor,
    borderColor,
    activeBackgroundColor,
  });
  const metrics = getMapControlMetrics(cellSize);
  const activeTint = mapControlActiveTint(palette.accent, palette.pressed);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (bearing !== undefined) {
      setCurrentBearing(bearing);
    } else if (getBearing) {
      getBearing().then((v) => { if (mountedRef.current) setCurrentBearing(v); }).catch(() => {});
    }
  }, [bearing, getBearing]);

  useEffect(() => {
    if (pitch !== undefined) {
      setCurrentPitch(pitch);
    } else if (getPitch) {
      getPitch().then((v) => { if (mountedRef.current) setCurrentPitch(v); }).catch(() => {});
    }
  }, [pitch, getPitch]);

  const handleResetBearing = async () => {
    onResetBearing?.();
    if (bearing !== undefined) {
      return;
    }
    if (getBearing) {
      setTimeout(async () => {
        try {
          const newBearing = await getBearing();
          if (mountedRef.current) setCurrentBearing(newBearing);
        } catch { /* view may be unmounted */ }
      }, 100);
      return;
    }
    setCurrentBearing(0);
  };

  const handleResetPitch = async () => {
    onResetPitch?.();
    if (pitch !== undefined) {
      return;
    }
    if (getPitch) {
      setTimeout(async () => {
        try {
          const newPitch = await getPitch();
          if (mountedRef.current) setCurrentPitch(newPitch);
        } catch { /* view may be unmounted */ }
      }, 100);
      return;
    }
    setCurrentPitch(0);
  };

  const is3DMode = (pitch ?? currentPitch) > 5;
  // Use controlled props directly so compass/pitch icons track onRegionChange without
  // waiting for a state sync effect (bearing=0 is valid and must not fall through).
  const needleBearing = bearing ?? currentBearing;
  const cellStyle = { width: cellSize, height: cellSize, minHeight: cellSize, minWidth: cellSize };
  const dividerStyle = { height: StyleSheet.hairlineWidth, backgroundColor: palette.divider };

  return (
    <View style={[mapControlCardStyle(cellSize, palette, metrics), style]}>
      <TouchableOpacity
        onPress={onZoomIn}
        style={[styles.cell, cellStyle]}
        activeOpacity={0.55}
        accessibilityRole="button"
        accessibilityLabel="Zoom in"
      >
        <View style={{ width: metrics.iconFrame, height: metrics.iconFrame, justifyContent: 'center', alignItems: 'center' }}>
          <View
            style={{
              position: 'absolute',
              width: metrics.plusBarWidth,
              height: metrics.plusBarLength,
              borderRadius: 1,
              backgroundColor: palette.icon,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: metrics.plusBarLength,
              height: metrics.plusBarWidth,
              borderRadius: 1,
              backgroundColor: palette.icon,
            }}
          />
        </View>
      </TouchableOpacity>

      <View style={dividerStyle} />

      <TouchableOpacity
        onPress={onZoomOut}
        style={[styles.cell, cellStyle]}
        activeOpacity={0.55}
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
      >
        <View style={{ width: metrics.iconFrame, height: metrics.iconFrame, justifyContent: 'center', alignItems: 'center' }}>
          <View
            style={{
              width: metrics.minusLength,
              height: metrics.plusBarWidth,
              borderRadius: 1,
              backgroundColor: palette.icon,
            }}
          />
        </View>
      </TouchableOpacity>

      {showCompassControl && (
        <>
          <View style={dividerStyle} />
          <TouchableOpacity
            onPress={handleResetBearing}
            style={[styles.cell, cellStyle]}
            activeOpacity={0.55}
            accessibilityRole="button"
            accessibilityLabel="Reset bearing to north"
          >
            <View
              style={{
                width: metrics.compassSize,
                height: metrics.compassSize,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  width: metrics.compassRingSize,
                  height: metrics.compassRingSize,
                  borderRadius: metrics.compassRingSize / 2,
                  borderWidth: metrics.compassBorderWidth,
                  borderColor: palette.icon,
                }}
              />
              {/* Needle assembly rotates opposite map bearing so north points correctly */}
              <View
                style={{
                  width: metrics.compassRingSize,
                  height: metrics.compassRingSize,
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [{ rotate: `${-needleBearing}deg` }],
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    top: 2,
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderLeftWidth: metrics.compassNeedleNorth.borderLeft,
                    borderRightWidth: metrics.compassNeedleNorth.borderRight,
                    borderTopWidth: 0,
                    borderBottomWidth: metrics.compassNeedleNorth.borderBottom,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: 'transparent',
                    borderBottomColor: palette.accent,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderLeftWidth: metrics.compassNeedleSouth.borderLeft,
                    borderRightWidth: metrics.compassNeedleSouth.borderRight,
                    borderBottomWidth: 0,
                    borderTopWidth: metrics.compassNeedleSouth.borderTop,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderBottomColor: 'transparent',
                    borderTopColor: palette.iconMuted,
                  }}
                />
                <View
                  style={{
                    width: metrics.compassCenter,
                    height: metrics.compassCenter,
                    borderRadius: metrics.compassCenter / 2,
                    backgroundColor: palette.icon,
                  }}
                />
              </View>
            </View>
          </TouchableOpacity>
        </>
      )}

      {showPitchControl && (
        <>
          <View style={dividerStyle} />
          <TouchableOpacity
            onPress={handleResetPitch}
            style={[
              styles.cell,
              cellStyle,
              is3DMode && { backgroundColor: activeTint },
            ]}
            activeOpacity={0.55}
            accessibilityRole="button"
            accessibilityLabel="Reset pitch"
          >
            <View style={{ width: metrics.iconFrame, height: metrics.iconFrame, justifyContent: 'center', alignItems: 'center' }}>
              <View
                style={{
                  position: 'absolute',
                  top: 1,
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderLeftWidth: metrics.chevronHalf,
                  borderRightWidth: metrics.chevronHalf,
                  borderTopWidth: 0,
                  borderBottomWidth: metrics.chevronHeight,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderTopColor: 'transparent',
                  borderBottomColor: palette.icon,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  bottom: 1,
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderLeftWidth: metrics.chevronHalf,
                  borderRightWidth: metrics.chevronHalf,
                  borderBottomWidth: 0,
                  borderTopWidth: metrics.chevronHeight,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: 'transparent',
                  borderTopColor: palette.icon,
                }}
              />
            </View>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
