import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';

export interface NavigationControlsProps {
  /**
   * Callback when zoom in button is pressed
   */
  onZoomIn?: () => void;
  
  /**
   * Callback when zoom out button is pressed
   */
  onZoomOut?: () => void;
  
  /**
   * Callback when compass/north button is pressed (resets bearing to 0)
   */
  onResetBearing?: () => void;
  
  /**
   * Callback when pitch reset button is pressed (resets pitch to 0)
   */
  onResetPitch?: () => void;
  
  /**
   * Current bearing in degrees (0-360) - used to rotate compass icon
   */
  bearing?: number;
  
  /**
   * Current pitch in degrees (0-60) - used to show 2D/3D state
   */
  pitch?: number;
  
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
  
  /**
   * Button size (default: 40)
   */
  size?: number;
  
  /**
   * Theme color (default: #9C1AFF)
   */
  color?: string;
  
  /**
   * Show pitch control (default: true)
   */
  showPitchControl?: boolean;
  
  /**
   * Function to get current bearing (for live updates)
   */
  getBearing?: () => Promise<number>;
  
  /**
   * Function to get current pitch (for live updates)
   */
  getPitch?: () => Promise<number>;
}

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
  getBearing,
  getPitch,
}) => {
  const [currentBearing, setCurrentBearing] = useState(bearing);
  const [currentPitch, setCurrentPitch] = useState(pitch);

  // Update bearing from props or fetch
  useEffect(() => {
    if (bearing !== undefined) {
      setCurrentBearing(bearing);
    } else if (getBearing) {
      getBearing().then(setCurrentBearing).catch(() => {});
    }
  }, [bearing, getBearing]);

  // Update pitch from props or fetch
  useEffect(() => {
    if (pitch !== undefined) {
      setCurrentPitch(pitch);
    } else if (getPitch) {
      getPitch().then(setCurrentPitch).catch(() => {});
    }
  }, [pitch, getPitch]);

  const handleResetBearing = async () => {
    onResetBearing?.();
    if (getBearing) {
      // Update after a short delay to show the change
      setTimeout(async () => {
        const newBearing = await getBearing();
        setCurrentBearing(newBearing);
      }, 100);
    }
  };

  const handleResetPitch = async () => {
    onResetPitch?.();
    if (getPitch) {
      setTimeout(async () => {
        const newPitch = await getPitch();
        setCurrentPitch(newPitch);
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
          { width: size, height: size, borderColor: color },
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
          { width: size, height: size, borderColor: color },
        ]}
        activeOpacity={0.7}
      >
        <View style={[styles.minusIcon, { backgroundColor: color }]}>
          <View style={[styles.minusLine, { backgroundColor: '#FFFFFF' }]} />
        </View>
      </TouchableOpacity>

      {/* Compass Button (Reset Bearing to North) */}
      <TouchableOpacity
        onPress={handleResetBearing}
        style={[
          styles.button,
          showPitchControl ? styles.middleButton : styles.bottomButton,
          { width: size, height: size, borderColor: color },
        ]}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.compassIcon,
            { transform: [{ rotate: `${-currentBearing}deg` }] },
          ]}
        >
          {/* North Arrow */}
          <View style={[styles.arrowContainer, { borderBottomColor: color }]} />
          <View style={[styles.arrowBase, { backgroundColor: color }]} />
        </View>
      </TouchableOpacity>

      {/* 2D/3D Toggle Button (Pitch Control) */}
      {showPitchControl && (
        <TouchableOpacity
          onPress={handleResetPitch}
          style={[
            styles.button,
            styles.bottomButton,
            { width: size, height: size, borderColor: color },
            is3DMode && { backgroundColor: `${color}10` },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.pitchIcon}>
            {is3DMode ? (
              // 3D icon - perspective cube
              <>
                <View style={[styles.cubeTop, { borderColor: color }]} />
                <View style={[styles.cubeFront, { borderColor: color }]} />
              </>
            ) : (
              // 2D icon - flat square
              <View style={[styles.flatSquare, { borderColor: color }]} />
            )}
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
    borderWidth: 1,
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
  // Compass icon (North arrow)
  compassIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowBase: {
    width: 4,
    height: 8,
    marginTop: -2,
  },
  // 2D/3D icon
  pitchIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatSquare: {
    width: 14,
    height: 14,
    borderWidth: 2,
  },
  cubeTop: {
    width: 14,
    height: 7,
    borderWidth: 2,
    borderBottomWidth: 0,
    transform: [{ perspective: 100 }, { rotateX: '-30deg' }],
  },
  cubeFront: {
    width: 14,
    height: 10,
    borderWidth: 2,
    borderTopWidth: 0,
  },
});

