import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import type { OSMViewRef } from '../types';

/**
 * PitchBearingControl Component Props
 */
export interface PitchBearingControlProps {
  /** Reference to the OSMView map component */
  mapRef: React.RefObject<OSMViewRef>;
  
  /** Position of the control */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /** Custom style for the control container */
  style?: any;
  
  /** Whether to show the current pitch and bearing values */
  showValues?: boolean;
  
  /** Callback when pitch changes */
  onPitchChange?: (pitch: number) => void;
  
  /** Callback when bearing changes */
  onBearingChange?: (bearing: number) => void;
  
  /** Minimum pitch (default: 0) */
  minPitch?: number;
  
  /** Maximum pitch (default: 60) */
  maxPitch?: number;
  
  /** Pitch step increment (default: 15) */
  pitchStep?: number;
  
  /** Bearing step increment (default: 45) */
  bearingStep?: number;
  
  /** Button size variant */
  size?: 'small' | 'medium' | 'large';
  
  /** Control theme */
  theme?: 'light' | 'dark' | 'auto';
  
  /** Whether to animate transitions */
  animateTransitions?: boolean;
  
  /** Custom pitch up icon/text */
  pitchUpIcon?: string;
  
  /** Custom pitch down icon/text */
  pitchDownIcon?: string;
  
  /** Custom rotate left icon/text */
  rotateLeftIcon?: string;
  
  /** Custom rotate right icon/text */
  rotateRightIcon?: string;
  
  /** Disable controls when at limits */
  disableAtLimits?: boolean;
  
  /** Show compass needle */
  showCompass?: boolean;
}

/**
 * PitchBearingControl Component
 * 
 * Provides intuitive pitch (tilt) and bearing (rotation) controls for OSMView maps.
 * Features smooth animations, customizable positioning, and optional value display.
 * 
 * @example
 * ```tsx
 * <PitchBearingControl
 *   mapRef={mapRef}
 *   position="top-right"
 *   showValues={true}
 *   showCompass={true}
 *   onPitchChange={(pitch) => console.log('Pitch:', pitch)}
 *   onBearingChange={(bearing) => console.log('Bearing:', bearing)}
 * />
 * ```
 */
export const PitchBearingControl: React.FC<PitchBearingControlProps> = ({
  mapRef,
  position = 'top-right',
  style,
  showValues = false,
  onPitchChange,
  onBearingChange,
  minPitch = 0,
  maxPitch = 60,
  pitchStep = 15,
  bearingStep = 45,
  size = 'medium',
  theme = 'light',
  animateTransitions = true,
  pitchUpIcon = '▲',
  pitchDownIcon = '▼',
  rotateLeftIcon = '◀',
  rotateRightIcon = '▶',
  disableAtLimits = true,
  showCompass = false,
}) => {
  const [currentPitch, setCurrentPitch] = useState(0);
  const [currentBearing, setCurrentBearing] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedScale] = useState(new Animated.Value(1));

  // Animation for button press feedback
  const animateButtonPress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(animatedScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  // Get current pitch and bearing from map
  const updateCurrentValues = async () => {
    try {
      if (mapRef.current) {
        const [pitch, bearing] = await Promise.all([
          mapRef.current.getPitch(),
          mapRef.current.getBearing(),
        ]);
        setCurrentPitch(pitch);
        setCurrentBearing(bearing);
      }
    } catch (error) {
      console.warn('Failed to get current pitch/bearing:', error);
    }
  };

  // Update values periodically
  useEffect(() => {
    updateCurrentValues();
    const interval = setInterval(updateCurrentValues, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle pitch up
  const handlePitchUp = async () => {
    if (isAnimating || currentPitch >= maxPitch) return;

    setIsAnimating(true);
    try {
      if (mapRef.current) {
        const newPitch = Math.min(currentPitch + pitchStep, maxPitch);
        await mapRef.current.setPitch(newPitch);
        setCurrentPitch(newPitch);
        onPitchChange?.(newPitch);
        console.log(`🎯 Pitch Up: ${newPitch}°`);
      }
    } catch (error) {
      console.error('❌ Pitch up failed:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  // Handle pitch down
  const handlePitchDown = async () => {
    if (isAnimating || currentPitch <= minPitch) return;

    setIsAnimating(true);
    try {
      if (mapRef.current) {
        const newPitch = Math.max(currentPitch - pitchStep, minPitch);
        await mapRef.current.setPitch(newPitch);
        setCurrentPitch(newPitch);
        onPitchChange?.(newPitch);
        console.log(`🎯 Pitch Down: ${newPitch}°`);
      }
    } catch (error) {
      console.error('❌ Pitch down failed:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  // Handle rotate left
  const handleRotateLeft = async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    try {
      if (mapRef.current) {
        const newBearing = (currentBearing - bearingStep + 360) % 360;
        await mapRef.current.setBearing(newBearing);
        setCurrentBearing(newBearing);
        onBearingChange?.(newBearing);
        console.log(`🧭 Rotate Left: ${newBearing}°`);
      }
    } catch (error) {
      console.error('❌ Rotate left failed:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  // Handle rotate right
  const handleRotateRight = async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    try {
      if (mapRef.current) {
        const newBearing = (currentBearing + bearingStep) % 360;
        await mapRef.current.setBearing(newBearing);
        setCurrentBearing(newBearing);
        onBearingChange?.(newBearing);
        console.log(`🧭 Rotate Right: ${newBearing}°`);
      }
    } catch (error) {
      console.error('❌ Rotate right failed:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  // Reset bearing to north
  const handleResetBearing = async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    try {
      if (mapRef.current) {
        await mapRef.current.setBearing(0);
        setCurrentBearing(0);
        onBearingChange?.(0);
        console.log(`🧭 Reset to North: 0°`);
      }
    } catch (error) {
      console.error('❌ Reset bearing failed:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  // Reset pitch to flat
  const handleResetPitch = async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    try {
      if (mapRef.current) {
        await mapRef.current.setPitch(0);
        setCurrentPitch(0);
        onPitchChange?.(0);
        console.log(`🎯 Reset to Flat: 0°`);
      }
    } catch (error) {
      console.error('❌ Reset pitch failed:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  // Calculate button styles based on props
  const getButtonStyle = () => {
    const sizeMultiplier = size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1;
    const baseSize = 44 * sizeMultiplier;
    
    return {
      ...styles.button,
      width: baseSize,
      height: baseSize,
      backgroundColor: theme === 'dark' ? '#333' : '#fff',
      borderColor: theme === 'dark' ? '#555' : '#ddd',
    };
  };

  const getTextStyle = () => ({
    ...styles.buttonText,
    color: theme === 'dark' ? '#fff' : '#333',
    fontSize: size === 'small' ? 14 : size === 'large' ? 20 : 16,
  });

  // Position styles
  const getPositionStyle = () => {
    const [vertical, horizontal] = position.split('-') as [string, string];
    const style: any = {};
    style[vertical] = 20;
    style[horizontal] = 20;
    return style;
  };

  // Check if buttons should be disabled
  const isPitchUpDisabled = disableAtLimits && currentPitch >= maxPitch;
  const isPitchDownDisabled = disableAtLimits && currentPitch <= minPitch;

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        style,
        { transform: [{ scale: animatedScale }] },
      ]}
    >
      {/* Pitch Controls */}
      <View style={styles.pitchContainer}>
        <TouchableOpacity
          style={[
            getButtonStyle(),
            isPitchUpDisabled && styles.disabledButton,
          ]}
          onPress={() => animateButtonPress(handlePitchUp)}
          disabled={isPitchUpDisabled || isAnimating}
          activeOpacity={0.7}
        >
          <Text style={[getTextStyle(), isPitchUpDisabled && styles.disabledText]}>
            {pitchUpIcon}
          </Text>
        </TouchableOpacity>

        {showValues && (
          <TouchableOpacity
            style={[styles.valueDisplay, { backgroundColor: theme === 'dark' ? '#333' : '#fff' }]}
            onPress={() => animateButtonPress(handleResetPitch)}
          >
            <Text style={[styles.valueText, { color: theme === 'dark' ? '#fff' : '#333' }]}>
              {Math.round(currentPitch)}°
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            getButtonStyle(),
            isPitchDownDisabled && styles.disabledButton,
          ]}
          onPress={() => animateButtonPress(handlePitchDown)}
          disabled={isPitchDownDisabled || isAnimating}
          activeOpacity={0.7}
        >
          <Text style={[getTextStyle(), isPitchDownDisabled && styles.disabledText]}>
            {pitchDownIcon}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bearing Controls */}
      <View style={styles.bearingContainer}>
        <TouchableOpacity
          style={getButtonStyle()}
          onPress={() => animateButtonPress(handleRotateLeft)}
          disabled={isAnimating}
          activeOpacity={0.7}
        >
          <Text style={getTextStyle()}>{rotateLeftIcon}</Text>
        </TouchableOpacity>

        {showCompass && (
          <TouchableOpacity
            style={[styles.compass, { backgroundColor: theme === 'dark' ? '#333' : '#fff' }]}
            onPress={() => animateButtonPress(handleResetBearing)}
          >
            <View
              style={[
                styles.compassNeedle,
                {
                  transform: [{ rotate: `${currentBearing}deg` }],
                  borderTopColor: theme === 'dark' ? '#ff4444' : '#ff0000',
                },
              ]}
            />
            {showValues && (
              <Text style={[styles.bearingText, { color: theme === 'dark' ? '#fff' : '#333' }]}>
                {Math.round(currentBearing)}°
              </Text>
            )}
          </TouchableOpacity>
        )}

        {!showCompass && showValues && (
          <TouchableOpacity
            style={[styles.valueDisplay, { backgroundColor: theme === 'dark' ? '#333' : '#fff' }]}
            onPress={() => animateButtonPress(handleResetBearing)}
          >
            <Text style={[styles.valueText, { color: theme === 'dark' ? '#fff' : '#333' }]}>
              {Math.round(currentBearing)}°
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={getButtonStyle()}
          onPress={() => animateButtonPress(handleRotateRight)}
          disabled={isAnimating}
          activeOpacity={0.7}
        >
          <Text style={getTextStyle()}>{rotateRightIcon}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 8,
    zIndex: 1000,
  },
  pitchContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  bearingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  valueDisplay: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 50,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
  },
  compass: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  compassNeedle: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopWidth: 20,
    top: 5,
  },
  bearingText: {
    fontSize: 10,
    fontWeight: '600',
    position: 'absolute',
    bottom: 8,
  },
}); 