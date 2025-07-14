# Expo OSM SDK

[![npm version](https://img.shields.io/npm/v/expo-osm-sdk.svg)](https://www.npmjs.com/package/expo-osm-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Tests](https://img.shields.io/badge/Tests-125%20passed-brightgreen)](https://github.com/mapdevsaikat/expo-osm-sdk)

A powerful, easy-to-use OpenStreetMap SDK for Expo mobile app development. This SDK provides native performance map rendering without requiring API keys or complex setup.

## 🚀 Quick Start

### Installation

```bash
npm install expo-osm-sdk
```

### Configuration

Add the plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      ["expo-osm-sdk/plugin", {
        "locationPermissionText": "This app uses location for map features"
      }]
    ]
  }
}
```

### Basic Usage

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { OSMView } from 'expo-osm-sdk';

export default function App() {
  return (
    <View style={styles.container}>
      <OSMView
        style={styles.map}
        initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
        initialZoom={10}
        onMapReady={() => console.log('Map ready!')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
```

### Build and Run

**⚠️ Important**: This SDK requires Expo development builds as it uses native code. It will **not** work in Expo Go.

```bash
# Install dependencies and build
npx expo install --fix
npx expo run:ios
# or
npx expo run:android
```

## ✨ Features

- ✅ **Native Performance** - MapLibre GL Native rendering engine
- ✅ **No API Keys Required** - Uses OpenStreetMap data directly
- ✅ **Expo Compatible** - Works with Expo development builds
- ✅ **TypeScript Support** - Full TypeScript definitions included
- ✅ **Interactive Maps** - Native pan, zoom, and tap interactions
- ✅ **Custom Markers** - Add and customize map markers natively
- ✅ **Event Handling** - Respond to map and marker interactions
- ✅ **GPU Accelerated** - Hardware-accelerated rendering
- ✅ **Cross-Platform** - Native iOS and Android implementations
- ✅ **Battery Optimized** - Efficient native memory management
- ✅ **Web Fallback** - Graceful fallback for web builds
- ✅ **Production Ready** - Thoroughly tested with 125+ tests

## 🎯 Platform Behavior Guide

Understanding how the SDK behaves across different platforms is crucial for development:

### 📱 **Development/Production Builds** (Recommended)
```bash
# Create development build
npx expo run:ios
npx expo run:android

# Or production build
eas build --platform ios
eas build --platform android
```

**Experience**:
- ✅ **Full Native Map**: Complete OpenStreetMap with MapLibre GL rendering
- ✅ **All Features**: Markers, zoom, pan, tap events, location services
- ✅ **Hardware Acceleration**: GPU-powered smooth performance
- ✅ **Production Ready**: Optimized for app store deployment

### 🧪 **Expo Go** (Development Testing)
```bash
npx expo start
# Scan QR code with Expo Go app
```

**Experience**:
- ⚠️ **Fallback UI**: Shows informative placeholder (not a real map)
- 💡 **Clear Messaging**: "This app requires a development build to display maps"
- 🎨 **Professional Design**: Branded fallback with current coordinates
- 📖 **Helpful Instructions**: Guides users to create development builds

**Why?** Expo Go cannot run custom native code. This is expected behavior for all native modules.

### 🌐 **Web Platform** (Limited Support)
```bash
npx expo start --web
```

**Experience**:
- ⚠️ **Fallback UI**: Shows web-specific placeholder
- 💡 **Alternative Suggestions**: Recommends web-compatible map libraries
- 🔗 **Helpful Links**: Suggests react-leaflet, react-map-gl, Google Maps
- 📱 **Responsive Design**: Works on desktop and mobile browsers

**Why?** Native mobile SDKs don't run in browsers. Web requires different map implementations.

### 📊 **Development Workflow Recommendation**

1. **Quick Testing**: Use Expo Go for UI/layout testing (map shows placeholder)
2. **Map Testing**: Use development builds for full map functionality
3. **Production**: Deploy with EAS Build for app stores

### 🎨 **Fallback UI Examples**

The SDK provides beautiful, informative fallbacks:

#### Expo Go Fallback:
```
📍 OpenStreetMap View
    Development Build Required

This app requires a development build to display maps.
Expo Go does not support custom native modules.

Try running: npx expo run:ios or npx expo run:android

📍 Center: 40.7128, -74.0060
🔍 Zoom: 13
```

#### Web Fallback:
```
🗺️ OpenStreetMap View
     Web Platform

This component requires a native implementation 
and is not available on web.

For web support, consider using:
• react-leaflet for OpenStreetMap
• react-map-gl for Mapbox GL  
• Google Maps JavaScript API
```

## 📋 Requirements

- **Expo SDK**: 49+ (recommended: 53+)
- **React Native**: 0.72+
- **iOS**: 13+ 
- **Android**: API 21+
- **Node.js**: 16+
- **Development Build**: Required (does not work in Expo Go)

## 📖 Complete Setup Guide

### Step 1: Create Expo Project

```bash
# Create new Expo project
npx create-expo-app MyMapApp
cd MyMapApp
```

### Step 2: Install the SDK

```bash
npm install expo-osm-sdk
```

### Step 3: Configure App

Add the plugin to your `app.json`:

```json
{
  "expo": {
    "name": "MyMapApp",
    "slug": "my-map-app",
    "version": "1.0.0",
    "plugins": [
      ["expo-osm-sdk/plugin", {
        "locationPermissionText": "This app uses location for map features"
      }]
    ]
  }
}
```

### Step 4: Create Map Component

Replace your `App.tsx` with:

```tsx
import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { OSMView, MarkerConfig, Coordinate } from 'expo-osm-sdk';

export default function App() {
  const [markers, setMarkers] = useState<MarkerConfig[]>([
    {
      id: 'home',
      coordinate: { latitude: 40.7128, longitude: -74.0060 },
      title: 'New York City',
      description: 'Welcome to NYC!'
    }
  ]);

  const handleMapPress = (coordinate: Coordinate) => {
    const newMarker: MarkerConfig = {
      id: `marker-${Date.now()}`,
      coordinate,
      title: 'New Marker',
      description: `Added at ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
    };
    setMarkers([...markers, newMarker]);
  };

  const handleMarkerPress = (markerId: string) => {
    const marker = markers.find(m => m.id === markerId);
    if (marker) {
      Alert.alert('Marker Info', `${marker.title}\n${marker.description}`);
    }
  };

  return (
    <View style={styles.container}>
      <OSMView
        style={styles.map}
        initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
        initialZoom={12}
        markers={markers}
        onMapReady={() => console.log('Map is ready!')}
        onPress={handleMapPress}
        onMarkerPress={handleMarkerPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
```

### Step 5: Build and Run

```bash
# Install dependencies
npx expo install --fix

# Build for iOS
npx expo run:ios

# Build for Android
npx expo run:android
```

## 🔧 API Reference

### OSMView Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `style` | `ViewStyle` | `undefined` | Style for the map container |
| `initialCenter` | `Coordinate` | `{latitude: 0, longitude: 0}` | Initial center coordinate |
| `initialZoom` | `number` | `10` | Initial zoom level (1-18) |
| `tileServerUrl` | `string` | OpenStreetMap tiles | Custom tile server URL |
| `markers` | `MarkerConfig[]` | `[]` | Array of markers to display |
| `onMapReady` | `() => void` | `undefined` | Called when map is ready |
| `onRegionChange` | `(region: MapRegion) => void` | `undefined` | Called when map region changes |
| `onMarkerPress` | `(markerId: string) => void` | `undefined` | Called when marker is pressed |
| `onPress` | `(coordinate: Coordinate) => void` | `undefined` | Called when map is pressed |

### TypeScript Types

```typescript
interface Coordinate {
  latitude: number;   // -90 to 90
  longitude: number;  // -180 to 180
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MarkerConfig {
  id: string;              // Unique identifier
  coordinate: Coordinate;  // Marker position
  title?: string;          // Marker title
  description?: string;    // Marker description
  icon?: string;           // Custom icon (future feature)
}
```

## 🎯 Advanced Examples

### Custom Tile Server

```tsx
<OSMView
  style={styles.map}
  tileServerUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  initialCenter={{ latitude: 51.5074, longitude: -0.1278 }}
  initialZoom={12}
/>
```

### Dynamic Marker Management

```tsx
const [markers, setMarkers] = useState<MarkerConfig[]>([]);

const addMarker = (coordinate: Coordinate) => {
  const newMarker: MarkerConfig = {
    id: `marker-${Date.now()}`,
    coordinate,
    title: 'New Marker',
    description: 'Added by user'
  };
  setMarkers(prev => [...prev, newMarker]);
};

const removeMarker = (markerId: string) => {
  setMarkers(prev => prev.filter(marker => marker.id !== markerId));
};

const clearMarkers = () => {
  setMarkers([]);
};
```

### Region Change Handling

```tsx
const handleRegionChange = (region: MapRegion) => {
  console.log('Map region changed:', region);
  // Update state or perform actions based on region change
};

<OSMView
  style={styles.map}
  onRegionChange={handleRegionChange}
/>
```

## 🔍 Troubleshooting

### ⚠️ **Important: Expected Behaviors (Not Bugs)**

Before troubleshooting, understand these are **normal** behaviors:

#### ✅ **Expo Go Shows Fallback UI**
- **Expected**: Fallback UI with "Development Build Required" message
- **Not a Bug**: Expo Go cannot run native modules
- **Solution**: Create development build with `npx expo run:ios` or `npx expo run:android`

#### ✅ **Web Shows Fallback UI**  
- **Expected**: Fallback UI with web alternative suggestions
- **Not a Bug**: Native mobile SDKs don't run in browsers
- **Solution**: Use web-compatible map libraries for web platform

### Common Issues and Solutions

#### 1. "Package does not contain a valid config plugin"

**Solution**: Make sure you're using the correct plugin configuration:

```json
{
  "expo": {
    "plugins": [
      ["expo-osm-sdk/plugin", {
        "locationPermissionText": "This app uses location for map features"
      }]
    ]
  }
}
```

#### 2. "Cannot use import statement outside a module"

**Solution**: This usually happens with incorrect package versions. Ensure you're using:
- Latest version of expo-osm-sdk
- Expo SDK 49+
- React Native 0.72+

#### 3. "OSMView is not defined" or Component Undefined

**Solutions**:
- Ensure you're using a development build (not Expo Go)
- Run `npx expo install --fix`
- Verify the plugin is configured in `app.json`
- Import correctly: `import { OSMView } from 'expo-osm-sdk';`

#### 4. Map Not Rendering

**Solutions**:
- Check that you're using a development build
- Verify the plugin is in your `app.json`
- Ensure you have proper location permissions
- Check console for error messages

#### 5. Build Errors

**Solutions**:
```bash
# Clean and rebuild
npx expo run:ios --clear
# or
npx expo run:android --clear

# If still having issues, try:
rm -rf node_modules package-lock.json
npm install
npx expo install --fix
```

### Development Tips

1. **Always Use Development Builds**: This SDK requires native code and won't work in Expo Go
2. **TypeScript**: The SDK includes full TypeScript definitions for better development experience
3. **Validation**: The SDK includes runtime validation in development mode
4. **Console Logging**: Check console for validation warnings and errors
5. **Physical Device Testing**: Always test on physical devices for best performance

## 📱 Platform Support

### iOS (Full Native Support)
- ✅ **iOS 13+** - iPhone and iPad
- ✅ **Native MapLibre GL** - Hardware-accelerated rendering
- ✅ **Development Builds** - Full map functionality
- ✅ **Production Ready** - App Store compatible
- ⚠️ **Expo Go** - Shows fallback UI (expected behavior)

### Android (Full Native Support)  
- ✅ **Android API 21+** - ARMv7 and ARM64 support
- ✅ **Native MapLibre GL** - Hardware-accelerated rendering
- ✅ **Development Builds** - Full map functionality
- ✅ **Production Ready** - Google Play compatible
- ⚠️ **Expo Go** - Shows fallback UI (expected behavior)

### Web (Fallback Only)
- ✅ **Responsive Fallback** - Professional placeholder UI
- ✅ **Developer Guidance** - Suggests web-compatible alternatives
- ⚠️ **No Native Map** - Use react-leaflet or similar for web
- 📝 **Recommendation** - Build separate web experience

## 🧪 Testing

The SDK includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:performance
```

### Test Coverage (125+ Tests)

- ✅ **Unit Tests**: Component instantiation, prop validation, coordinate utilities
- ✅ **Integration Tests**: Component lifecycle, event handling, marker management
- ✅ **Performance Tests**: Large datasets, rapid updates, memory efficiency
- ✅ **Compatibility Tests**: Platform compatibility, device support
- ✅ **Accuracy Tests**: Coordinate calculations, distance measurements

## 🔗 Resources

- **npm Package**: [expo-osm-sdk](https://www.npmjs.com/package/expo-osm-sdk)
- **GitHub Repository**: [mapdevsaikat/expo-osm-sdk](https://github.com/mapdevsaikat/expo-osm-sdk)
- **Example App**: See `example/` directory
- **Issues**: [Report bugs or request features](https://github.com/mapdevsaikat/expo-osm-sdk/issues)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

**Made with ❤️ by [Saikat Maiti](https://github.com/mapdevsaikat)**

*Experience native OpenStreetMap in your Expo app without complexity!* 