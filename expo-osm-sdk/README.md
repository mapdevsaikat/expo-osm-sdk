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

### 🚀 **New: JSX Children API (v1.1.0+)**

Experience a familiar, declarative API similar to react-native-maps:

```tsx
import React from 'react';
import { OSMView, Marker, Polyline, Polygon, Circle } from 'expo-osm-sdk';

export default function DeclarativeMap() {
  const routeCoordinates = [
    { latitude: 40.7128, longitude: -74.0060 },
    { latitude: 40.7589, longitude: -73.9851 },
    { latitude: 40.7831, longitude: -73.9712 }
  ];

  return (
    <OSMView
      style={{ flex: 1 }}
      initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
      initialZoom={12}
      clustering={{ enabled: true, radius: 100, maxZoom: 15 }}
    >
      {/* Markers */}
      <Marker
        coordinate={{ latitude: 40.7128, longitude: -74.0060 }}
        title="New York City"
        description="The Big Apple!"
      />
      <Marker
        coordinate={{ latitude: 40.7589, longitude: -73.9851 }}
        title="Times Square"
        description="Bright lights, big city"
      />

      {/* Route polyline */}
      <Polyline
        coordinates={routeCoordinates}
        strokeColor="#007AFF"
        strokeWidth={4}
        strokeOpacity={0.8}
      />

      {/* Area polygon */}
      <Polygon
        coordinates={[
          { latitude: 40.7500, longitude: -74.0000 },
          { latitude: 40.7600, longitude: -74.0000 },
          { latitude: 40.7600, longitude: -73.9900 },
          { latitude: 40.7500, longitude: -73.9900 }
        ]}
        fillColor="#FF000020"
        strokeColor="#FF0000"
        strokeWidth={2}
      />

      {/* Radius circle */}
      <Circle
        center={{ latitude: 40.7128, longitude: -74.0060 }}
        radius={1000}
        fillColor="#0000FF20"
        strokeColor="#0000FF"
        strokeWidth={2}
      />
    </OSMView>
  );
}
```

### 🔄 **Both APIs Work Together**

You can mix and match JSX children with props for maximum flexibility:

```tsx
<OSMView
  markers={existingMarkers}  // Props-based markers
  polylines={routeData}      // Props-based polylines
>
  {/* JSX children are automatically merged */}
  <Marker coordinate={userLocation} title="You are here" />
  <Circle center={userLocation} radius={500} />
</OSMView>
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

## 🎮 Advanced Gesture & Interaction Features *(v1.0.55+)*

Take your map interactions to the next level with comprehensive gesture and interaction handling:

### **🔗 Long Press Detection**

Native long press detection with coordinate mapping:

```tsx
<OSMView
  style={styles.map}
  onLongPress={(coordinate) => {
    Alert.alert(
      'Long Press Detected!',
      `Location: ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
    );
  }}
/>
```

### **🖐️ Multi-Touch Gesture Recognition**

Advanced multi-finger gesture detection with pattern recognition:

```tsx
import { AdvancedGestureControl } from 'expo-osm-sdk';

<AdvancedGestureControl
  mapRef={mapRef}
  config={{
    enable3FingerGestures: true,
    enable4FingerGestures: true,
    enableSwipePatterns: true,
    gestureTimeout: 5000
  }}
  onGesture={(event) => {
    console.log(`${event.fingerCount}-finger ${event.type} gesture detected`);
    
    if (event.type === 'multi-touch' && event.fingerCount === 3) {
      // 3-finger tap detected - show map info
      showMapInformation();
    }
  }}
  onCustomGesture={(pattern, data) => {
    console.log(`${pattern} pattern detected with ${data.confidence} confidence`);
    
    switch (pattern) {
      case 'triangle':
        Alert.alert('Triangle Gesture!', 'You drew a triangle with 3 fingers!');
        break;
      case 'line':
        Alert.alert('Line Gesture!', 'Linear pattern detected!');
        break;
      case 'square':
        Alert.alert('Square Gesture!', 'Perfect square with 4 fingers!');
        break;
    }
  }}
  debugMode={true}
/>
```

### **🎯 Pitch & Bearing Controls**

Interactive map rotation and tilt with professional UI controls:

```tsx
import { PitchBearingControl } from 'expo-osm-sdk';

<PitchBearingControl
  mapRef={mapRef}
  position="top-right"
  showValues={true}
  showCompass={true}
  onPitchChange={(pitch) => {
    console.log('Map pitch changed to:', pitch);
  }}
  onBearingChange={(bearing) => {
    console.log('Map bearing changed to:', bearing);
  }}
  theme="light"
  size="medium"
  pitchStep={15}
  bearingStep={30}
  disableAtLimits={true}
/>
```

### **🎨 Custom Gesture Patterns**

The SDK can detect various geometric patterns:

| Pattern | Fingers | Description | Confidence |
|---------|---------|-------------|------------|
| **Triangle** | 3 | Three points forming a triangle shape | 80%+ |
| **Line** | 3+ | Points arranged in a straight line | 90%+ |
| **Square** | 4 | Four points forming a square pattern | 85%+ |
| **Diamond** | 4 | Four points in diamond formation | 80%+ |

### **⚙️ Programmatic Controls**

Direct access to pitch and bearing via map reference:

```tsx
const mapRef = useRef<OSMViewRef>(null);

// Set pitch and bearing programmatically
const adjustCamera = async () => {
  await mapRef.current?.setPitch(45);    // Tilt map 45 degrees
  await mapRef.current?.setBearing(90);  // Rotate to face east
};

// Get current camera state
const getCameraState = async () => {
  const pitch = await mapRef.current?.getPitch();
  const bearing = await mapRef.current?.getBearing();
  console.log(`Current: ${pitch}° pitch, ${bearing}° bearing`);
};
```

### **🎮 Complete Gesture Demo**

Check out `AdvancedGestureDemo.tsx` for a comprehensive showcase featuring:
- Real-time gesture event logging
- Multi-finger pattern detection
- Interactive gesture configuration
- Pitch and bearing controls integration
- Professional UI with state tracking

## ✨ Features

- ✅ **Advanced Gesture & Interaction** - Complete gesture system with multi-touch support *(v1.0.55+)*
- ✅ **Long Press Detection** - Native long press with coordinate mapping *(v1.0.55+)*
- ✅ **Multi-Touch Gestures** - 3+ finger gesture recognition with pattern detection *(v1.0.55+)*
- ✅ **Pitch & Bearing Controls** - Interactive map rotation and tilt with UI controls *(v1.0.55+)*
- ✅ **Custom Gesture Recognition** - Geometric pattern detection (triangle, line, square) *(v1.0.55+)*
- ✅ **Gesture Conflict Resolution** - Smart priority-based gesture management *(v1.0.55+)*
- ✅ **Vector Tile Support** - 40-60% better performance with OpenMapTiles vector rendering
- ✅ **Complete Overlay Support** - Polylines, polygons, circles with advanced styling
- ✅ **Smart Marker Clustering** - Automatic grouping for better performance
- ✅ **JSX Children API** - Declarative component usage similar to react-native-maps
- ✅ **Dual API Design** - Both JSX children and props-based usage supported
- ✅ **Nominatim Search** - Complete geocoding, reverse geocoding, and autocomplete search
- ✅ **Enhanced Location Services** - Real-time GPS tracking with follow user mode
- ✅ **Smooth Animations** - Hardware-accelerated camera transitions
- ✅ **Native Performance** - MapLibre GL Native rendering engine
- ✅ **No API Keys Required** - Uses OpenStreetMap data directly
- ✅ **Expo Compatible** - Works with Expo development builds
- ✅ **TypeScript Support** - Full TypeScript definitions included
- ✅ **Interactive Maps** - Native pan, zoom, and tap interactions
- ✅ **Custom Markers** - Advanced marker customization with animations
- ✅ **Event Handling** - Comprehensive map and overlay interaction events
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

> 💡 **Want a complete example?** Check out our [comprehensive demo project](../demo-project/) with professional UI, multiple components, and best practices!

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

## 🔍 Nominatim Search & Geocoding

The SDK includes comprehensive Nominatim integration for location search, reverse geocoding, and address lookup:

### 🎯 **SearchBox Component**

Ready-to-use search component with autocomplete:

```tsx
import { SearchBox } from 'expo-osm-sdk';

<SearchBox
  onLocationSelected={(location) => {
    console.log('Selected:', location.displayName);
    // Navigate to location on map
  }}
  placeholder="Search for places..."
  maxResults={5}
  autoComplete={true}
/>
```

### 🔍 **Direct Search Functions**

Use Nominatim functions directly for custom implementations:

```tsx
import { searchLocations, reverseGeocode, calculateDistance } from 'expo-osm-sdk';

// Search for locations
const results = await searchLocations('Central Park New York', {
  limit: 10,
  countrycodes: ['us']
});

// Reverse geocoding (coordinates to address)
const address = await reverseGeocode({
  latitude: 40.7589,
  longitude: -73.9851
});

// Calculate distance between points
const distance = calculateDistance(
  { latitude: 40.7589, longitude: -73.9851 },
  { latitude: 40.7128, longitude: -74.0060 }
);
console.log(`Distance: ${formatDistance(distance)}`);
```

### 🎣 **React Hooks**

Enhanced hooks for search state management:

```tsx
import { useNominatimSearch } from 'expo-osm-sdk';

function MySearchComponent() {
  const { search, isLoading, lastResults, error } = useNominatimSearch();
  
  const handleSearch = async (query: string) => {
    const results = await search(query, { limit: 5 });
    console.log('Found:', results.length, 'results');
  };
  
  return (
    <View>
      {isLoading && <Text>Searching...</Text>}
      {error && <Text>Error: {error}</Text>}
      {lastResults.map(result => (
        <Text key={result.placeId}>{result.displayName}</Text>
      ))}
    </View>
  );
}
```

### 🎨 **Features**

- **Autocomplete Search**: Real-time suggestions as you type
- **Reverse Geocoding**: Convert coordinates to addresses  
- **Distance Calculations**: Built-in Haversine distance formula
- **Caching**: Automatic result caching for better performance
- **Rate Limiting**: Respects Nominatim usage policies
- **TypeScript**: Full type safety for all search operations
- **Customizable**: Flexible options for search parameters
- **Error Handling**: Comprehensive error management

### 📚 **Example**

See [NominatimBasicDemo.tsx](./examples/NominatimBasicDemo.tsx) for a complete working example.

## 🎯 New Features (v1.0.34+)

### 🗺️ Vector Tiles (Better Performance)

By default, the SDK now uses OpenMapTiles vector tiles for 40-60% better performance:

```tsx
import { OSMView } from 'expo-osm-sdk';

// Vector tiles enabled by default (recommended)
<OSMView
  style={styles.map}
  initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
  initialZoom={12}
  // Vector tiles automatically used
/>

// Custom vector style
<OSMView
  style={styles.map}
        styleUrl="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
  initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
  initialZoom={12}
/>

// Switch back to raster tiles if needed
<OSMView
  style={styles.map}
  tileServerUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
  initialZoom={12}
/>
```

### 🔍 Nominatim Search & Geocoding

Complete search functionality with autocomplete and reverse geocoding:

```tsx
import { SearchBox, useNominatimSearch, searchLocations, reverseGeocode } from 'expo-osm-sdk';

// Easy-to-use SearchBox component
function MapWithSearch() {
  const handleLocationSelect = (location) => {
    console.log('Selected:', location);
    // Animate map to selected location
  };

  return (
    <View style={styles.container}>
      <SearchBox
        placeholder="Search for places..."
        onLocationSelect={handleLocationSelect}
        style={styles.searchBox}
      />
      <OSMView style={styles.map} />
    </View>
  );
}

// Advanced search hook
function AdvancedSearch() {
  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    searchLocations: search,
    clearResults
  } = useNominatimSearch();

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search locations..."
      />
      {isLoading && <Text>Searching...</Text>}
      {results.map(result => (
        <TouchableOpacity key={result.place_id} onPress={() => search(result)}>
          <Text>{result.display_name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Direct API usage
async function searchExample() {
  // Search for locations
  const results = await searchLocations('New York City');
  console.log('Found:', results);

  // Reverse geocoding
  const address = await reverseGeocode(40.7128, -74.0060);
  console.log('Address:', address);
}
```

### 📍 Current Location & Navigation

Built-in location services and smooth animations:

```tsx
import { OSMView, OSMViewRef } from 'expo-osm-sdk';

function MapWithLocation() {
  const mapRef = useRef<OSMViewRef>(null);

  const goToCurrentLocation = async () => {
    const location = await mapRef.current?.getCurrentLocation();
    if (location) {
      mapRef.current?.animateToLocation(location.latitude, location.longitude, 15);
    }
  };

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        showUserLocation={true}
        followUserLocation={false}
        onUserLocationChange={(location) => {
          console.log('User location:', location);
        }}
      />
      <Button title="Go to My Location" onPress={goToCurrentLocation} />
    </View>
  );
}
```

## 🔧 API Reference

### OSMView Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `style` | `ViewStyle` | `undefined` | Style for the map container |
| `initialCenter` | `Coordinate` | `{latitude: 0, longitude: 0}` | Initial center coordinate |
| `initialZoom` | `number` | `10` | Initial zoom level (1-18) |
| `styleUrl` | `string` | OpenMapTiles vector style | Vector tile style URL (new in v1.0.34) |
| `tileServerUrl` | `string` | `undefined` | Custom raster tile server URL |
| `showUserLocation` | `boolean` | `false` | Show user's current location |
| `followUserLocation` | `boolean` | `false` | Follow user location changes |
| `markers` | `MarkerConfig[]` | `[]` | Array of markers to display |
| `polylines` | `PolylineConfig[]` | `[]` | Array of polylines to display *(new)* |
| `polygons` | `PolygonConfig[]` | `[]` | Array of polygons to display *(new)* |
| `circles` | `CircleConfig[]` | `[]` | Array of circles to display *(new)* |
| `overlays` | `OverlayConfig[]` | `[]` | Array of custom overlays *(new)* |
| `clustering` | `ClusterConfig` | `undefined` | Marker clustering configuration *(new)* |
| `children` | `ReactNode` | `undefined` | JSX children (Marker, Polyline, etc.) *(new)* |
| `onMapReady` | `() => void` | `undefined` | Called when map is ready |
| `onRegionChange` | `(region: MapRegion) => void` | `undefined` | Called when map region changes |
| `onMarkerPress` | `(markerId: string, coordinate: Coordinate) => void` | `undefined` | Called when marker is pressed |
| `onPolylinePress` | `(polylineId: string, coordinate: Coordinate) => void` | `undefined` | Called when polyline is pressed *(new)* |
| `onPolygonPress` | `(polygonId: string, coordinate: Coordinate) => void` | `undefined` | Called when polygon is pressed *(new)* |
| `onCirclePress` | `(circleId: string, coordinate: Coordinate) => void` | `undefined` | Called when circle is pressed *(new)* |
| `onPress` | `(coordinate: Coordinate) => void` | `undefined` | Called when map is pressed |
| `onLongPress` | `(coordinate: Coordinate) => void` | `undefined` | Called when map is long pressed *(v1.0.55+)* |
| `onUserLocationChange` | `(location: Coordinate) => void` | `undefined` | Called when user location updates |
| `rotateEnabled` | `boolean` | `true` | Enable/disable map rotation gestures *(v1.0.55+)* |
| `pitchEnabled` | `boolean` | `false` | Enable/disable map tilt gestures *(v1.0.55+)* |

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
  icon?: MarkerIcon;       // Custom icon configuration
  animation?: MarkerAnimation; // Marker animation
  zIndex?: number;         // Render order
  draggable?: boolean;     // Allow dragging
  opacity?: number;        // 0.0 to 1.0
  rotation?: number;       // Rotation angle in degrees
  visible?: boolean;       // Visibility
}

// New in v1.1.0: Overlay Types
interface PolylineConfig {
  id: string;
  coordinates: Coordinate[];
  strokeColor?: string;     // Hex color
  strokeWidth?: number;     // Line width in pixels
  strokeOpacity?: number;   // 0.0 to 1.0
  strokePattern?: 'solid' | 'dashed' | 'dotted';
  lineCap?: 'round' | 'square' | 'butt';
  lineJoin?: 'round' | 'bevel' | 'miter';
  zIndex?: number;
  visible?: boolean;
}

interface PolygonConfig {
  id: string;
  coordinates: Coordinate[];
  holes?: Coordinate[][];   // Polygon holes
  fillColor?: string;       // Hex color with alpha
  fillOpacity?: number;     // 0.0 to 1.0
  strokeColor?: string;     // Border color
  strokeWidth?: number;     // Border width
  strokeOpacity?: number;   // Border opacity
  strokePattern?: 'solid' | 'dashed' | 'dotted';
  zIndex?: number;
  visible?: boolean;
}

interface CircleConfig {
  id: string;
  center: Coordinate;
  radius: number;           // Radius in meters
  fillColor?: string;       // Fill color with alpha
  fillOpacity?: number;     // 0.0 to 1.0
  strokeColor?: string;     // Border color
  strokeWidth?: number;     // Border width
  strokeOpacity?: number;   // Border opacity
  strokePattern?: 'solid' | 'dashed' | 'dotted';
  zIndex?: number;
  visible?: boolean;
}

interface ClusterConfig {
  enabled: boolean;
  radius?: number;          // Cluster radius in pixels (default: 100)
  maxZoom?: number;         // Max zoom to cluster (default: 15)
  minPoints?: number;       // Min markers to form cluster (default: 2)
  maxClusterRadius?: number; // Max cluster radius in meters
  animate?: boolean;        // Animate cluster changes
  animationDuration?: number; // Animation duration in ms
}

interface OverlayConfig {
  id: string;
  coordinate: Coordinate;
  component: React.ReactNode; // Custom React component
  width?: number;
  height?: number;
  anchor?: { x: number; y: number }; // Anchor point (0.5, 0.5 = center)
  zIndex?: number;
  visible?: boolean;
}

// Search and Geocoding Types
interface NominatimSearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
  type: string;
  importance: number;
}

interface SearchLocation {
  id: string;
  name: string;
  coordinate: Coordinate;
  address?: string;
  distance?: number;
}

interface UseNominatimSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchLocation[];
  isLoading: boolean;
  error: string | null;
  searchLocations: (query: string) => Promise<void>;
  clearResults: () => void;
}

interface SearchBoxProps {
  placeholder?: string;
  onLocationSelect: (location: SearchLocation) => void;
  style?: ViewStyle;
  maxResults?: number;
  debounceMs?: number;
}

// Complete Map Reference Interface (v1.0.55)
interface OSMViewRef {
  // Zoom controls
  zoomIn: () => Promise<void>;
  zoomOut: () => Promise<void>;
  setZoom: (zoom: number) => Promise<void>;
  
  // Camera controls
  animateToLocation: (latitude: number, longitude: number, zoom?: number) => Promise<void>;
  animateToRegion: (region: MapRegion, duration?: number) => Promise<void>;
  fitToMarkers: (markerIds?: string[], padding?: number) => Promise<void>;
  
  // Pitch & Bearing controls (new in v1.0.55)
  setPitch: (pitch: number) => Promise<void>;        // Set map tilt (0-60°)
  setBearing: (bearing: number) => Promise<void>;    // Set map rotation (0-360°)
  getPitch: () => Promise<number>;                   // Get current tilt
  getBearing: () => Promise<number>;                 // Get current rotation
  
  // Location services
  getCurrentLocation: () => Promise<Coordinate>;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => Promise<void>;
  waitForLocation: (timeoutSeconds: number) => Promise<Coordinate>;
  
  // Marker controls
  addMarker: (marker: MarkerConfig) => Promise<void>;
  removeMarker: (markerId: string) => Promise<void>;
  updateMarker: (markerId: string, updates: Partial<MarkerConfig>) => Promise<void>;
  showInfoWindow: (markerId: string) => Promise<void>;
  hideInfoWindow: (markerId: string) => Promise<void>;
  
  // Overlay controls (new in v1.1.0)
  addPolyline: (polyline: PolylineConfig) => Promise<void>;
  removePolyline: (polylineId: string) => Promise<void>;
  updatePolyline: (polylineId: string, updates: Partial<PolylineConfig>) => Promise<void>;
  addPolygon: (polygon: PolygonConfig) => Promise<void>;
  removePolygon: (polygonId: string) => Promise<void>;
  updatePolygon: (polygonId: string, updates: Partial<PolygonConfig>) => Promise<void>;
  addCircle: (circle: CircleConfig) => Promise<void>;
  removeCircle: (circleId: string) => Promise<void>;
  updateCircle: (circleId: string, updates: Partial<CircleConfig>) => Promise<void>;
  
  // Map utilities
  takeSnapshot: (format?: 'png' | 'jpg', quality?: number) => Promise<string>;
}

// Advanced Gesture Types (new in v1.0.55)
interface GestureConfig {
  enable3FingerGestures?: boolean;      // Enable 3-finger gesture detection
  enable4FingerGestures?: boolean;      // Enable 4-finger gesture detection  
  enableSwipePatterns?: boolean;        // Enable swipe pattern recognition
  gestureTimeout?: number;              // Gesture timeout in milliseconds
}

interface GestureEvent {
  type: 'tap' | 'long-press' | 'swipe' | 'multi-touch' | 'custom';
  fingerCount: number;                  // Number of fingers involved
  coordinates: Array<{ x: number; y: number }>; // Touch coordinates
  velocity?: { x: number; y: number };  // Swipe velocity
  duration?: number;                    // Gesture duration
  pattern?: string;                     // Detected pattern name
}

interface AdvancedGestureControlProps {
  mapRef: React.RefObject<OSMViewRef>;  // Reference to OSMView
  config?: GestureConfig;               // Gesture configuration
  onGesture?: (event: GestureEvent) => void; // Gesture event callback
  onCustomGesture?: (pattern: string, data: any) => void; // Pattern callback
  debugMode?: boolean;                  // Enable debug logging
}

interface PitchBearingControlProps {
  mapRef: React.RefObject<OSMViewRef>;  // Reference to OSMView
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showValues?: boolean;                 // Show current pitch/bearing values
  showCompass?: boolean;                // Show compass needle
  onPitchChange?: (pitch: number) => void; // Pitch change callback
  onBearingChange?: (bearing: number) => void; // Bearing change callback
  theme?: 'light' | 'dark';            // Control theme
  size?: 'small' | 'medium' | 'large'; // Control size
  pitchStep?: number;                   // Pitch increment per button press
  bearingStep?: number;                 // Bearing increment per button press
  disableAtLimits?: boolean;            // Disable buttons at min/max values
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
- **📱 Demo App**: See `demo-project/` directory - Complete example with modern UI
- **🧪 Basic Example**: See `example/` directory - Simple testing example
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