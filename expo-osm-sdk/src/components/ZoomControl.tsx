import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

// Optional react-native-vector-icons import with fallback
let Icon: any = null;
try {
  Icon = require('react-native-vector-icons/MaterialIcons').default;
} catch (error) {
  // Fallback to null if react-native-vector-icons is not installed
  console.warn('react-native-vector-icons not found, using fallback icons');
}

export interface ZoomControlProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  style?: object;
  buttonStyle?: object;
  iconColor?: string;
  iconSize?: number;
  disabled?: boolean;
  showLabels?: boolean;
}

export default function ZoomControl({
  onZoomIn,
  onZoomOut,
  position = 'top-right',
  style,
  buttonStyle,
  iconColor = '#333',
  iconSize = 24,
  disabled = false,
  showLabels = false
}: ZoomControlProps) {
  const positionStyles = {
    'top-left': { top: 60, left: 10 },
    'top-right': { top: 60, right: 10 },
    'bottom-left': { bottom: 60, left: 10 },
    'bottom-right': { bottom: 60, right: 10 },
  };

  const renderIcon = (name: string, fallbackText: string) => {
    if (Icon) {
      return (
        <Icon 
          name={name} 
          size={iconSize} 
          color={disabled ? '#ccc' : iconColor} 
        />
      );
    }
    // Fallback to text/emoji if vector icons not available
    return (
      <Text style={[
        styles.fallbackIcon, 
        { 
          color: disabled ? '#ccc' : iconColor,
          fontSize: iconSize 
        }
      ]}>
        {fallbackText}
      </Text>
    );
  };

  return (
    <View style={[styles.container, positionStyles[position], style]}>
      <TouchableOpacity
        style={[styles.button, styles.topButton, buttonStyle]}
        onPress={onZoomIn}
        disabled={disabled}
        accessibilityLabel="Zoom in"
        accessibilityRole="button"
      >
        {renderIcon('add', '+')}
        {showLabels && (
          <Text style={[styles.label, { color: disabled ? '#ccc' : iconColor }]}>
            Zoom In
          </Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.separator} />
      
      <TouchableOpacity
        style={[styles.button, styles.bottomButton, buttonStyle]}
        onPress={onZoomOut}
        disabled={disabled}
        accessibilityLabel="Zoom out"
        accessibilityRole="button"
      >
        {renderIcon('remove', '−')}
        {showLabels && (
          <Text style={[styles.label, { color: disabled ? '#ccc' : iconColor }]}>
            Zoom Out
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  topButton: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  bottomButton: {
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  fallbackIcon: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
}); 