import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import type { LocationButtonProps } from '../types';
import {
  getMapControlMetrics,
  mapControlCardStyle,
  resolveMapControlSize,
  resolveMapControlTheme,
} from './mapControlStyles';

/**
 * LocationButton - Button to center the map on the user's current location
 *
 * @example
 * <LocationButton
 *   compact
 *   color="#007AFF"
 *   iconColor="#333"
 *   backgroundColor="#FFF"
 *   borderColor="#E0E0E0"
 *   getCurrentLocation={async () => mapRef.current?.getCurrentLocation()}
 *   onLocationFound={(location) => {
 *     mapRef.current?.animateToLocation(location.latitude, location.longitude, 15);
 *   }}
 * />
 */
export const LocationButton: React.FC<LocationButtonProps> = ({
  onLocationFound,
  onLocationError,
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
  getCurrentLocation,
  requestPermission,
}) => {
  const [isLoading, setIsLoading] = useState(false);

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

  const handlePress = async () => {
    if (!getCurrentLocation) {
      console.warn('LocationButton: getCurrentLocation prop is required');
      onLocationError?.('Location function not provided');
      return;
    }

    setIsLoading(true);
    try {
      if (requestPermission) {
        const granted = await requestPermission();
        if (!granted) {
          onLocationError?.('Location permission denied');
          return;
        }
      }

      const location = await getCurrentLocation();
      onLocationFound?.(location);
    } catch (error) {
      console.error('LocationButton: Failed to get location', error);
      onLocationError?.(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  const cellStyle = { width: cellSize, height: cellSize, minWidth: cellSize, minHeight: cellSize };
  const iconFrameSize = Math.round(metrics.compassSize);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLoading}
      style={[
        mapControlCardStyle(cellSize, palette, metrics),
        styles.cell,
        cellStyle,
        style,
      ]}
      activeOpacity={0.55}
      accessibilityRole="button"
      accessibilityLabel="Go to my location"
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={palette.accent} />
      ) : (
        <View
          style={{
            width: iconFrameSize,
            height: iconFrameSize,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: metrics.locationRingSize,
              height: metrics.locationRingSize,
              borderRadius: metrics.locationRingSize / 2,
              borderWidth: metrics.compassBorderWidth,
              borderColor: palette.icon,
            }}
          />
          <View
            style={{
              width: metrics.locationDotSize,
              height: metrics.locationDotSize,
              borderRadius: metrics.locationDotSize / 2,
              backgroundColor: palette.accent,
            }}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
