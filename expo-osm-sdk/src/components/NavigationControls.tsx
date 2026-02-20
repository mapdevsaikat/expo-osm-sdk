import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import type { NavigationControlsProps } from '../types';

/**
 * NavigationControls - Clean map navigation controls
 * Provides zoom, compass, and pitch controls in a vertical stack
 * 
 * @example
 * <NavigationControls
 *   onZoomIn={() => mapRef.current?.zoomIn()}
 *   onZoomOut={() => mapRef.current?.zoomOut()}
 *   onResetBearing={() => mapRef.current?.setBearing(0)}
 *   onResetPitch={() => mapRef.current?.setPitch(0)}
 *   bearing={bearing}
 *   pitch={pitch}
 * />
 */
export const NavigationControls: React.FC<NavigationControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetBearing,
  onResetPitch,
  bearing = 0,
  pitch = 0,
  style,
  size = 40,
  color = '#9C1AFF',
  showPitchControl = true,
  showCompassControl = true,
  getBearing,
  getPitch,
}) => {
  const [currentBearing, setCurrentBearing] = useState(bearing);
  const [currentPitch, setCurrentPitch] = useState(pitch);
  const mountedRef = useRef(true);

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
    if (getBearing) {
      setTimeout(async () => {
        try {
          const newBearing = await getBearing();
          if (mountedRef.current) setCurrentBearing(newBearing);
        } catch { /* view may be unmounted */ }
      }, 100);
    }
  };

  const handleResetPitch = async () => {
    onResetPitch?.();
    if (getPitch) {
      setTimeout(async () => {
        try {
          const newPitch = await getPitch();
          if (mountedRef.current) setCurrentPitch(newPitch);
        } catch { /* view may be unmounted */ }
      }, 100);
    }
  };

  const is3DMode = currentPitch > 5; // Consider 3D if pitch > 5 degrees

  return (
    <View style={[styles.container, { width: size }, style]}>
      {/* Zoom In Button */}
      <TouchableOpacity
        onPress={onZoomIn}
        style={[
          styles.button,
          styles.topButton,
          { width: size, height: size },
        ]}
        activeOpacity={0.7}
      >
        <View style={[styles.plusIcon, { backgroundColor: color }]}>
          <View style={[styles.plusVertical, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.plusHorizontal, { backgroundColor: '#FFFFFF' }]} />
        </View>
      </TouchableOpacity>

      {/* Zoom Out Button */}
      <TouchableOpacity
        onPress={onZoomOut}
        style={[
          styles.button,
          styles.middleButton,
          { width: size, height: size },
        ]}
        activeOpacity={0.7}
      >
        <View style={[styles.minusIcon, { backgroundColor: color }]}>
          <View style={[styles.minusLine, { backgroundColor: '#FFFFFF' }]} />
        </View>
      </TouchableOpacity>

      {/* Compass Button (Reset Bearing to North) */}
      {showCompassControl && (
        <TouchableOpacity
          onPress={handleResetBearing}
          style={[
            styles.button,
            showPitchControl ? styles.middleButton : styles.bottomButton,
            { width: size, height: size },
          ]}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.compassIcon,
              { transform: [{ rotate: `${-currentBearing}deg` }] },
            ]}
          >
            {/* White Circle Outline */}
            <View style={styles.compassCircle} />
            {/* Compass Needle - North Arrow (Purple) */}
            <View style={[styles.compassNeedleNorth, { borderBottomColor: color }]} />
            {/* Compass Needle - South Arrow (Lighter) */}
            <View style={[styles.compassNeedleSouth, { borderTopColor: `${color}80` }]} />
            {/* Center Dot */}
            <View style={[styles.compassCenter, { backgroundColor: color }]} />
          </View>
        </TouchableOpacity>
      )}

      {/* 2D/3D Toggle Button (Pitch Control) */}
      {showPitchControl && (
        <TouchableOpacity
          onPress={handleResetPitch}
          style={[
            styles.button,
            styles.bottomButton,
            { width: size, height: size },
            is3DMode && { backgroundColor: `${color}10` },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.pitchIcon}>
            {/* White Circle Background */}
            <View style={styles.pitchCircle} />
            {/* Up Chevron Arrow */}
            <View style={[styles.chevronUp, { borderBottomColor: color }]} />
            {/* Down Chevron Arrow */}
            <View style={[styles.chevronDown, { borderTopColor: color }]} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 1,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0, // Borderless as requested
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  topButton: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  middleButton: {
    borderRadius: 0,
  },
  bottomButton: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  // Plus icon (Zoom In)
  plusIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusVertical: {
    position: 'absolute',
    width: 2,
    height: 10,
  },
  plusHorizontal: {
    position: 'absolute',
    width: 10,
    height: 2,
  },
  // Minus icon (Zoom Out)
  minusIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minusLine: {
    width: 10,
    height: 2,
  },
  // Compass icon (Compass needle with circle)
  compassIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compassCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
  },
  compassNeedleNorth: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    position: 'absolute',
    top: 4,
    left: 9,
  },
  compassNeedleSouth: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 0,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
    top: 10,
    left: 9,
  },
  compassCenter: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    position: 'absolute',
    top: 10.5,
    left: 10.5,
  },
  // Pitch icon (Two chevron arrows with white circle background)
  pitchIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pitchCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
  },
  chevronUp: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 0,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    position: 'absolute',
    top: 3,
    left: 8,
  },
  chevronDown: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 0,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
    top: 13,
    left: 8,
  },
});

