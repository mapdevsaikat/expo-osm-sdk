/**
 * Jest Testing Setup for Expo OSM SDK
 * Minimal setup for coordinate testing with React Native component support
 */

const React = require('react');

// Configure React Native Testing Library
try {
  const { configure } = require('@testing-library/react-native');
  configure({
    asyncUtilTimeout: 5000,
    autoCleanup: true,
  });
} catch (error) {
  // Testing library not available, skip configuration
}

// Mock native modules for React Native components
jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {},
  requireNativeViewManager: jest.fn(() => {
    const React = require('react');
    const MockNativeView = (props) => {
      return React.createElement('View', props);
    };
    MockNativeView.displayName = 'MockNativeView';
    return MockNativeView;
  }),
}));

// Mock React Native components
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  ActivityIndicator: 'ActivityIndicator',
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

// Mock performance measurements
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Custom matchers for coordinate testing
expect.extend({
  toBeCloseToCoordinate(received, expected, precision = 0.001) {
    const latDiff = Math.abs(received.latitude - expected.latitude);
    const lonDiff = Math.abs(received.longitude - expected.longitude);
    
    const pass = latDiff <= precision && lonDiff <= precision;
    
    if (pass) {
      return {
        message: () => 
          `Expected coordinate ${JSON.stringify(received)} not to be close to ${JSON.stringify(expected)}`,
        pass: true,
      };
    } else {
      return {
        message: () => 
          `Expected coordinate ${JSON.stringify(received)} to be close to ${JSON.stringify(expected)} within ${precision}`,
        pass: false,
      };
    }
  },
});

// Export test utilities
module.exports.mockCoordinate = (lat = 40.7128, lon = -74.0060) => ({
  latitude: lat,
  longitude: lon,
});

module.exports.mockMapRegion = (lat = 40.7128, lon = -74.0060, latDelta = 0.1, lonDelta = 0.1) => ({
  latitude: lat,
  longitude: lon,
  latitudeDelta: latDelta,
  longitudeDelta: lonDelta,
});

module.exports.mockMarker = (id = 'test-marker', lat = 40.7128, lon = -74.0060) => ({
  id,
  coordinate: { latitude: lat, longitude: lon },
  title: 'Test Marker',
  description: 'Test Description',
});

module.exports.waitForMapReady = () => new Promise(resolve => setTimeout(resolve, 100)); 