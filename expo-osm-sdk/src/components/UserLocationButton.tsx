import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import type { OSMViewRef, Coordinate } from '../types';

// Optional react-native-vector-icons import with fallback
let Icon: any = null;
try {
  Icon = require('react-native-vector-icons/MaterialIcons').default;
} catch (error) {
  // Fallback to null if react-native-vector-icons is not installed
  console.warn('react-native-vector-icons not found, using fallback for UserLocationButton');
}

export interface UserLocationButtonProps {
  /** Reference to the OSMView map component */
  mapRef: React.RefObject<OSMViewRef>;
  /** Position of the button */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Custom style for the button container */
  style?: object;
  /** Button size */
  size?: number;
  /** Callback when location is found */
  onLocationFound?: (location: Coordinate) => void;
  /** Callback when location error occurs */
  onLocationError?: (error: Error) => void;
  /** Whether to animate to location when found */
  animateToLocation?: boolean;
  /** Zoom level when animating to location */
  zoomLevel?: number;
}

/**
 * Professional User Location Button
 * 
 * Circular location button with pulse animation matching MapLibre's professional design.
 * Features the requested active color #5d12ff and smooth animations.
 */
export default function UserLocationButton({
  mapRef,
  position = 'bottom-right',
  style,
  size = 44,
  onLocationFound,
  onLocationError,
  animateToLocation = true,
  zoomLevel = 15
}: UserLocationButtonProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [locationState, setLocationState] = useState<'inactive' | 'searching' | 'found' | 'following'>('inactive');
  
  // Animations
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  // Start pulse animation when tracking
  useEffect(() => {
    if (isTracking || locationState === 'searching') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnimation.setValue(1);
      return undefined;
    }
  }, [isTracking, locationState]);

  // Rotation animation for searching state
  useEffect(() => {
    if (locationState === 'searching') {
      const rotate = Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotate.start();
      return () => {
        rotate.stop();
        rotateAnimation.setValue(0);
      };
    }
    return undefined;
  }, [locationState]);

  const handleLocationPress = async () => {
    if (!mapRef.current) return;

    try {
      setLocationState('searching');
      setIsTracking(true);

      // Get current location
      const location = await mapRef.current.getCurrentLocation();
      
      setLocationState('found');
      onLocationFound?.(location);

      // Animate to location if requested
      if (animateToLocation) {
        await mapRef.current.animateToLocation(
          location.latitude,
          location.longitude,
          zoomLevel
        );
        setLocationState('following');
      }

      // Auto-hide tracking state after 3 seconds
      setTimeout(() => {
        setIsTracking(false);
        setLocationState('inactive');
      }, 3000);

    } catch (error) {
      console.error('Location error:', error);
      setLocationState('inactive');
      setIsTracking(false);
      onLocationError?.(error as Error);
    }
  };

  const getButtonColor = () => {
    switch (locationState) {
      case 'searching':
        return '#5d12ff'; // Active color as requested
      case 'found':
      case 'following':
        return '#5d12ff'; // Active color as requested
      default:
        return '#ffffff'; // Inactive white
    }
  };

  const getIconColor = () => {
    switch (locationState) {
      case 'searching':
      case 'found':
      case 'following':
        return '#ffffff'; // White icon on active background
      default:
        return '#666666'; // Gray icon on white background
    }
  };

  const getBorderColor = () => {
    return locationState === 'inactive' ? '#cccccc' : '#5d12ff';
  };

  const positionStyles = {
    'top-left': { top: 60, left: 16 },
    'top-right': { top: 60, right: 16 },
    'bottom-left': { bottom: 120, left: 16 },
    'bottom-right': { bottom: 120, right: 16 },
  };

  const renderIcon = () => {
    const iconName = locationState === 'searching' ? 'gps-not-fixed' : 
                     locationState === 'found' || locationState === 'following' ? 'gps-fixed' : 
                     'my-location';
    
    if (Icon) {
      return (
        <Animated.View
          style={{
            transform: [
              {
                rotate: rotateAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }
            ]
          }}
        >
          <Icon 
            name={iconName}
            size={20} 
            color={getIconColor()} 
          />
        </Animated.View>
      );
    }
    
    // Fallback emoji icon
    return (
      <Animated.View
        style={{
          transform: [
            {
              rotate: rotateAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              })
            }
          ]
        }}
      >
        {locationState === 'searching' ? (
          <span style={{ fontSize: 16, color: getIconColor() }}>📍</span>
        ) : locationState === 'found' || locationState === 'following' ? (
          <span style={{ fontSize: 16, color: getIconColor() }}>🎯</span>
        ) : (
          <span style={{ fontSize: 16, color: getIconColor() }}>📍</span>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, positionStyles[position], style]}>
      {/* Pulse ring animation for active state */}
      {(isTracking || locationState !== 'inactive') && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 16,
              height: size + 16,
              borderRadius: (size + 16) / 2,
              borderColor: '#5d12ff',
              transform: [{ scale: pulseAnimation }],
              opacity: pulseAnimation.interpolate({
                inputRange: [1, 1.2],
                outputRange: [0.6, 0]
              })
            }
          ]}
        />
      )}

      {/* Main location button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: getButtonColor(),
            borderColor: getBorderColor(),
          }
        ]}
        onPress={handleLocationPress}
        activeOpacity={0.7}
        accessibilityLabel="Get current location"
        accessibilityRole="button"
      >
        {renderIcon()}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
});