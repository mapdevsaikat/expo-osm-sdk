import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
  ViewStyle,
} from 'react-native';

export interface LocationButtonProps {
  /**
   * Callback when location is found
   */
  onLocationFound?: (location: { latitude: number; longitude: number }) => void;
  
  /**
   * Callback when location fetch fails
   */
  onLocationError?: (error: string) => void;
  
  /**
   * Custom style for the button
   */
  style?: ViewStyle;
  
  /**
   * Button size (default: 44)
   */
  size?: number;
  
  /**
   * Theme color (default: #9C1AFF)
   */
  color?: string;
  
  /**
   * Function to get current location (should be provided by parent)
   */
  getCurrentLocation?: () => Promise<{ latitude: number; longitude: number }>;
}

/**
 * LocationButton - A clean button to get user's current location
 * 
 * @example
 * <LocationButton
 *   getCurrentLocation={async () => {
 *     const loc = await mapRef.current?.getCurrentLocation();
 *     return loc;
 *   }}
 *   onLocationFound={(location) => {
 *     mapRef.current?.animateToLocation(
 *       location.latitude,
 *       location.longitude,
 *       15
 *     );
 *   }}
 * />
 */
export const LocationButton: React.FC<LocationButtonProps> = ({
  onLocationFound,
  onLocationError,
  style,
  size = 44,
  color = '#9C1AFF',
  getCurrentLocation,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    if (!getCurrentLocation) {
      console.warn('LocationButton: getCurrentLocation prop is required');
      onLocationError?.('Location function not provided');
      return;
    }

    setIsLoading(true);
    try {
      const location = await getCurrentLocation();
      onLocationFound?.(location);
    } catch (error) {
      console.error('LocationButton: Failed to get location', error);
      onLocationError?.(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLoading}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
        },
        style,
      ]}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <View style={styles.iconContainer}>
          {/* Crosshair/Target Icon */}
          <View style={[styles.outerCircle, { borderColor: color }]} />
          <View style={[styles.innerDot, { backgroundColor: color }]} />
          
          {/* Crosshair lines */}
          <View style={[styles.lineVertical, { backgroundColor: color }]} />
          <View style={[styles.lineHorizontal, { backgroundColor: color }]} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
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
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerCircle: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  innerDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lineVertical: {
    position: 'absolute',
    width: 2,
    height: 24,
    top: 0,
  },
  lineHorizontal: {
    position: 'absolute',
    height: 2,
    width: 24,
    left: 0,
  },
});

