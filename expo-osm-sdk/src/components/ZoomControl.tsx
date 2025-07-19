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
 * ZoomControl Component Props
 */
export interface ZoomControlProps {
  /** Reference to the OSMView map component */
  mapRef: React.RefObject<OSMViewRef>;
  
  /** Position of the control */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /** Custom style for the control container */
  style?: any;
  
  /** Whether to show the current zoom level */
  showZoomLevel?: boolean;
  
  /** Callback when zoom changes */
  onZoomChange?: (zoom: number) => void;
  
  /** Minimum zoom level (default: 1) */
  minZoom?: number;
  
  /** Maximum zoom level (default: 18) */
  maxZoom?: number;
  
  /** Zoom step increment (default: 1) */
  zoomStep?: number;
  
  /** Button size variant */
  size?: 'small' | 'medium' | 'large';
  
  /** Control theme */
  theme?: 'light' | 'dark' | 'auto';
  
  /** Whether to animate zoom transitions */
  animateZoom?: boolean;
  
  /** Custom zoom in icon/text */
  zoomInIcon?: string;
  
  /** Custom zoom out icon/text */
  zoomOutIcon?: string;
  
  /** Disable zoom in when at max zoom */
  disableAtLimits?: boolean;
}

/**
 * ZoomControl Component
 * 
 * Provides intuitive zoom in/out controls for OSMView maps.
 * Features smooth animations, customizable positioning, and optional zoom level display.
 * 
 * @example
 * ```tsx
 * <ZoomControl
 *   mapRef={mapRef}
 *   position="bottom-right"
 *   showZoomLevel={true}
 *   onZoomChange={(zoom) => console.log('Zoom level:', zoom)}
 * />
 * ```
 */
export const ZoomControl: React.FC<ZoomControlProps> = ({
  mapRef,
  position = 'bottom-right',
  style,
  showZoomLevel = false,
  onZoomChange,
  minZoom = 1,
  maxZoom = 18,
  zoomStep = 1,
  size = 'medium',
  theme = 'light',
  animateZoom = true,
  zoomInIcon = '+',
  zoomOutIcon = '−',
  disableAtLimits = true,
}) => {
  const [currentZoom, setCurrentZoom] = useState(10);
  const [isZooming, setIsZooming] = useState(false);
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

  // Handle zoom in
  const handleZoomIn = async () => {
    if (isZooming || currentZoom >= maxZoom) return;

    setIsZooming(true);
    try {
      if (mapRef.current) {
        const newZoom = Math.min(currentZoom + zoomStep, maxZoom);
        
        if (animateZoom) {
          await mapRef.current.setZoom(newZoom);
        } else {
          await mapRef.current.setZoom(newZoom);
        }
        
        setCurrentZoom(newZoom);
        onZoomChange?.(newZoom);
        console.log(`🔍 Zoom In: ${newZoom}`);
      }
    } catch (error) {
      console.error('❌ Zoom in failed:', error);
    } finally {
      setIsZooming(false);
    }
  };

  // Handle zoom out
  const handleZoomOut = async () => {
    if (isZooming || currentZoom <= minZoom) return;

    setIsZooming(true);
    try {
      if (mapRef.current) {
        const newZoom = Math.max(currentZoom - zoomStep, minZoom);
        
        if (animateZoom) {
          await mapRef.current.setZoom(newZoom);
        } else {
          await mapRef.current.setZoom(newZoom);
        }
        
        setCurrentZoom(newZoom);
        onZoomChange?.(newZoom);
        console.log(`🔍 Zoom Out: ${newZoom}`);
      }
    } catch (error) {
      console.error('❌ Zoom out failed:', error);
    } finally {
      setIsZooming(false);
    }
  };

  // Position styles based on prop
  const getPositionStyles = () => {
    const basePosition = {
      position: 'absolute' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'top-left':
        return { ...basePosition, top: 20, left: 20 };
      case 'top-right':
        return { ...basePosition, top: 20, right: 20 };
      case 'bottom-left':
        return { ...basePosition, bottom: 20, left: 20 };
      case 'bottom-right':
        return { ...basePosition, bottom: 20, right: 20 };
      default:
        return { ...basePosition, bottom: 20, right: 20 };
    }
  };

  // Button size styles
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 36, height: 36 };
      case 'medium':
        return { width: 44, height: 44 };
      case 'large':
        return { width: 52, height: 52 };
      default:
        return { width: 44, height: 44 };
    }
  };

  // Theme styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'dark':
        return {
          backgroundColor: 'rgba(50, 50, 50, 0.95)',
          buttonColor: '#374151',
          textColor: '#ffffff',
          borderColor: '#4b5563',
          disabledColor: '#6b7280',
        };
      case 'light':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          buttonColor: '#ffffff',
          textColor: '#374151',
          borderColor: '#d1d5db',
          disabledColor: '#9ca3af',
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          buttonColor: '#ffffff',
          textColor: '#374151',
          borderColor: '#d1d5db',
          disabledColor: '#9ca3af',
        };
    }
  };

  const buttonSize = getButtonSize();
  const themeStyles = getThemeStyles();

  // Check if buttons should be disabled
  const isZoomInDisabled = disableAtLimits && currentZoom >= maxZoom;
  const isZoomOutDisabled = disableAtLimits && currentZoom <= minZoom;

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyles(),
        {
          backgroundColor: themeStyles.backgroundColor,
          transform: [{ scale: animatedScale }],
        },
        style,
      ]}
    >
      {/* Zoom In Button */}
      <TouchableOpacity
        style={[
          styles.button,
          buttonSize,
          {
            backgroundColor: themeStyles.buttonColor,
            borderColor: themeStyles.borderColor,
            opacity: isZoomInDisabled ? 0.5 : 1,
          },
          styles.zoomInButton,
        ]}
        onPress={() => animateButtonPress(handleZoomIn)}
        disabled={isZooming || isZoomInDisabled}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            { 
              color: isZoomInDisabled ? themeStyles.disabledColor : themeStyles.textColor,
              fontSize: size === 'small' ? 16 : size === 'large' ? 24 : 20,
            },
          ]}
        >
          {zoomInIcon}
        </Text>
      </TouchableOpacity>

      {/* Zoom Level Display */}
      {showZoomLevel && (
        <View
          style={[
            styles.zoomLevelContainer,
            {
              backgroundColor: themeStyles.buttonColor,
              borderColor: themeStyles.borderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.zoomLevelText,
              { 
                color: themeStyles.textColor,
                fontSize: size === 'small' ? 10 : size === 'large' ? 14 : 12,
              },
            ]}
          >
            {currentZoom.toFixed(1)}
          </Text>
        </View>
      )}

      {/* Zoom Out Button */}
      <TouchableOpacity
        style={[
          styles.button,
          buttonSize,
          {
            backgroundColor: themeStyles.buttonColor,
            borderColor: themeStyles.borderColor,
            opacity: isZoomOutDisabled ? 0.5 : 1,
          },
          styles.zoomOutButton,
        ]}
        onPress={() => animateButtonPress(handleZoomOut)}
        disabled={isZooming || isZoomOutDisabled}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            { 
              color: isZoomOutDisabled ? themeStyles.disabledColor : themeStyles.textColor,
              fontSize: size === 'small' ? 16 : size === 'large' ? 24 : 20,
            },
          ]}
        >
          {zoomOutIcon}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  zoomInButton: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 0.5,
  },
  zoomOutButton: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopWidth: 0.5,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  zoomLevelContainer: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  zoomLevelText: {
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
});

export default ZoomControl; 