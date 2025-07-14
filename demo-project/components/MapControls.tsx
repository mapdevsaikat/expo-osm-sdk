import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  ZoomIn,
  ZoomOut,
  Navigation,
  RotateCcw,
} from 'lucide-react-native';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onGetLocation: () => void;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onGetLocation,
}: MapControlsProps) {
  return (
    <View style={styles.container}>
      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.zoomButton]}
          onPress={onZoomIn}
          activeOpacity={0.7}
        >
          <ZoomIn size={20} color="#2563EB" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.zoomButton]}
          onPress={onZoomOut}
          activeOpacity={0.7}
        >
          <ZoomOut size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Action Controls */}
      <View style={styles.actionControls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.actionButton]}
          onPress={onGetLocation}
          activeOpacity={0.7}
        >
          <Navigation size={20} color="#059669" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.actionButton]}
          onPress={onResetView}
          activeOpacity={0.7}
        >
          <RotateCcw size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  zoomControls: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  actionControls: {
    flexDirection: 'column',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  zoomButton: {
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});