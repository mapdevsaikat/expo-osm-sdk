import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import type { OSMViewRef, Coordinate } from '../types';

/**
 * UserLocationButton Component
 * 
 * A beautiful button component that helps users find and center on their current location.
 * Features a distinctive purple (#8c14ff) design with smooth animations and visual feedback.
 * 
 * @example
 * ```tsx
 * <UserLocationButton
 *   mapRef={mapRef}
 *   onLocationFound={(location) => console.log('Found:', location)}
 *   onLocationError={(error) => console.log('Error:', error)}
 *   style={{ position: 'absolute', top: 100, right: 20 }}
 * />
 * ```
 */

export interface UserLocationButtonProps {
  /** Reference to the OSMView map component */
  mapRef: React.RefObject<OSMViewRef>;
  /** Callback when location is successfully found */
  onLocationFound?: (location: Coordinate) => void;
  /** Callback when location finding fails */
  onLocationError?: (error: Error) => void;
  /** Custom style for the button container */
  style?: any;
  /** Custom text for the button (default: "My Location") */
  buttonText?: string;
  /** Whether to automatically animate to the location (default: true) */
  autoAnimate?: boolean;
  /** Zoom level when animating to location (default: 15) */
  zoomLevel?: number;
  /** Size of the button (default: 'medium') */
  size?: 'small' | 'medium' | 'large';
  /** Button variant (default: 'filled') */
  variant?: 'filled' | 'outlined' | 'minimal';
}

export const UserLocationButton: React.FC<UserLocationButtonProps> = ({
  mapRef,
  onLocationFound,
  onLocationError,
  style,
  buttonText = "📍 My Location",
  autoAnimate = true,
  zoomLevel = 15,
  size = 'medium',
  variant = 'filled',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastLocation, setLastLocation] = useState<Coordinate | null>(null);
  const [animatedValue] = useState(new Animated.Value(1));
  const [pulseAnimation] = useState(new Animated.Value(1));

  // Animated pulse effect for when location is found
  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnimation, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Button press animation
  const animatePress = () => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleFindLocation = async () => {
    if (isLoading || !mapRef.current) return;

    setIsLoading(true);
    animatePress();

    try {
      console.log('🔍 UserLocationButton: Finding user location...');

      // First, start location tracking to ensure fresh data
      await mapRef.current.startLocationTracking();

      // Wait for a fresh location with 30 second timeout
      const location = await mapRef.current.waitForLocation(30);
      
      console.log('✅ UserLocationButton: Location found:', location);
      
      const coordinate: Coordinate = {
        latitude: location.latitude,
        longitude: location.longitude,
      };

      setLastLocation(coordinate);
      startPulseAnimation();

      // Animate to the location if requested
      if (autoAnimate) {
        await mapRef.current.animateToLocation(
          coordinate.latitude,
          coordinate.longitude,
          zoomLevel
        );
      }

      onLocationFound?.(coordinate);
      
    } catch (error) {
      console.error('❌ UserLocationButton: Location error:', error);
      const locationError = error instanceof Error ? error : new Error(String(error));
      onLocationError?.(locationError);
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic styles based on props
  const buttonSize = {
    small: { paddingVertical: 8, paddingHorizontal: 12, minWidth: 100 },
    medium: { paddingVertical: 12, paddingHorizontal: 16, minWidth: 140 },
    large: { paddingVertical: 16, paddingHorizontal: 20, minWidth: 180 },
  }[size];

  const getButtonStyle = () => {
    const baseStyle = [styles.button, buttonSize];

    switch (variant) {
      case 'filled':
        return [...baseStyle, styles.filledButton];
      case 'outlined':
        return [...baseStyle, styles.outlinedButton];
      case 'minimal':
        return [...baseStyle, styles.minimalButton];
      default:
        return [...baseStyle, styles.filledButton];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'filled':
        return styles.filledText;
      case 'outlined':
        return styles.outlinedText;
      case 'minimal':
        return styles.minimalText;
      default:
        return styles.filledText;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          {
            transform: [
              { scale: animatedValue },
              { scale: pulseAnimation },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={getButtonStyle()}
          onPress={handleFindLocation}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            {isLoading ? (
              <ActivityIndicator 
                size="small" 
                color={variant === 'filled' ? '#FFFFFF' : '#8c14ff'} 
                style={styles.loadingIcon}
              />
            ) : null}
            
            <Text style={[getTextStyle(), isLoading && styles.loadingText]}>
              {isLoading ? 'Finding Location...' : buttonText}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Location accuracy indicator */}
      {lastLocation && !isLoading && (
        <View style={styles.accuracyIndicator}>
          <View style={styles.accuracyDot} />
          <Text style={styles.accuracyText}>Located</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#8c14ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Filled variant (default)
  filledButton: {
    backgroundColor: '#8c14ff',
  },
  filledText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Outlined variant
  outlinedButton: {
    backgroundColor: 'rgba(140, 20, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#8c14ff',
  },
  outlinedText: {
    color: '#8c14ff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Minimal variant
  minimalButton: {
    backgroundColor: 'rgba(140, 20, 255, 0.05)',
  },
  minimalText: {
    color: '#8c14ff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginRight: 8,
  },
  loadingText: {
    opacity: 0.8,
  },
  accuracyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(140, 20, 255, 0.1)',
    borderRadius: 12,
  },
  accuracyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8c14ff',
    marginRight: 6,
  },
  accuracyText: {
    fontSize: 12,
    color: '#8c14ff',
    fontWeight: '500',
  },
});

UserLocationButton.displayName = 'UserLocationButton'; 