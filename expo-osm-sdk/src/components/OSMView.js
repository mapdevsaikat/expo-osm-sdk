import { Platform } from 'react-native';

// Platform-specific component resolution
let OSMView;

if (Platform.OS === 'web') {
  // For web platform, use the MapLibre GL JS implementation
  OSMView = require('./OSMView.web').default;
} else {
  // For native platforms (iOS/Android) and Expo Go, use the native implementation
  OSMView = require('./OSMView').default;
}

export { OSMView };
export default OSMView; 