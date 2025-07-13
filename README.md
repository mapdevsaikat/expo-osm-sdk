# Expo OSM SDK

[![npm version](https://img.shields.io/npm/v/expo-osm-sdk.svg)](https://www.npmjs.com/package/expo-osm-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)](https://expo.dev/)

A simple, powerful OpenStreetMap SDK for Expo mobile app development. This SDK provides a straightforward way to integrate OpenStreetMap into your Expo applications without requiring API keys or complex setup.

## Features

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

## Installation

```bash
npm install expo-osm-sdk
```

or

```bash
yarn add expo-osm-sdk
```

### Configuration

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      ["expo-osm-sdk", {
        "locationPermissionText": "This app uses location for map features"
      }]
    ]
  }
}
```

**Note**: This SDK requires Expo development builds as it uses native code. It will not work in Expo Go.

## Basic Usage

```tsx
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { OSMView, MarkerConfig } from 'expo-osm-sdk';

export default function App() {
  const [markers, setMarkers] = useState<MarkerConfig[]>([
    {
      id: 'marker-1',
      coordinate: { latitude: 40.7128, longitude: -74.0060 },
      title: 'New York City',
      description: 'The Big Apple'
    }
  ]);

  return (
    <View style={styles.container}>
      <OSMView
        style={styles.map}
        initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
        initialZoom={10}
        markers={markers}
        onMapReady={() => console.log('Map is ready!')}
        onMarkerPress={(markerId) => console.log('Marker pressed:', markerId)}
        onPress={(coordinate) => console.log('Map pressed at:', coordinate)}
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

## API Reference

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

### Types

```typescript
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MarkerConfig {
  id: string;
  coordinate: Coordinate;
  title?: string;
  description?: string;
  icon?: string;
}
```

## Advanced Usage

### Custom Tile Server

```tsx
<OSMView
  style={styles.map}
  tileServerUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  initialCenter={{ latitude: 51.5074, longitude: -0.1278 }}
  initialZoom={12}
/>
```

### Dynamic Markers

```tsx
const [markers, setMarkers] = useState<MarkerConfig[]>([]);

const addMarker = (coordinate: Coordinate) => {
  const newMarker: MarkerConfig = {
    id: `marker-${Date.now()}`,
    coordinate,
    title: 'New Marker',
    description: 'Added by user'
  };
  setMarkers([...markers, newMarker]);
};

<OSMView
  style={styles.map}
  markers={markers}
  onPress={addMarker}
/>
```

### Event Handling

```tsx
const handleRegionChange = (region: MapRegion) => {
  console.log('New region:', region);
  // Update state or perform actions based on region change
};

const handleMarkerPress = (markerId: string) => {
  const marker = markers.find(m => m.id === markerId);
  if (marker) {
    Alert.alert('Marker Info', marker.title);
  }
};

<OSMView
  style={styles.map}
  onRegionChange={handleRegionChange}
  onMarkerPress={handleMarkerPress}
/>
```

## Example App

Check out the `example/` directory for a complete example application that demonstrates all features of the SDK.

To run the example:

```bash
cd example
npm install
npm start
```

## Requirements

- Expo SDK 49+
- React Native 0.72+
- iOS 13+ / Android API 21+
- Node.js 16+

## Testing

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/mapdevsaikat/expo-osm-sdk/issues)
- **Documentation**: [Full documentation](https://github.com/mapdevsaikat/expo-osm-sdk#readme)
- **npm Package**: [expo-osm-sdk](https://www.npmjs.com/package/expo-osm-sdk)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

Made with ❤️ by [Saikat Maiti](https://github.com/mapdevsaikat) 