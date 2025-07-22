# Expo OSM SDK

> 🚨 **ALPHA RELEASE:** **v1.1.0-alpha.1** - Real Interactive Maps on Web with MapLibre GL JS! 🎉  
> ✅ **Current Stable Version:** **v1.0.79** - Complete Nominatim search integration

## 🗺️ **NEW: Real Web Maps Alpha!**

**expo-osm-sdk v1.1.0-alpha.1** now supports **actual interactive maps** on web browsers!

### 🎯 **Installation Options:**

```bash
# Option 1: Basic (mobile maps + web fallback UI)
npm install expo-osm-sdk

# Option 2: WITH REAL WEB MAPS ⭐ 
npm install expo-osm-sdk@alpha maplibre-gl
```

### ✅ **What Works in Alpha:**
- **📱 Mobile**: Full native maps (unchanged, stable)
- **🌐 Web with MapLibre**: Real interactive maps!
  - ✅ Base map rendering (OpenStreetMap)
  - ✅ Layer switching (OSM ↔ Satellite)  
  - ✅ Zoom controls (+ / - buttons)
  - ✅ Pan & zoom with mouse/touch
  - ✅ Events (onPress, onRegionChange, onMapReady)
  - ✅ Custom tile servers supported
- **🌐 Web without MapLibre**: Safe fallback UI

### ⚠️ **Alpha Limitations (Web):**
- 🔄 Markers not yet implemented (coming in beta)
- 🔄 Polylines/polygons not yet implemented
- 🔄 Location tracking not yet implemented  
- ✅ **All mobile features work perfectly** (no changes)

### 🧪 **Alpha Usage:**
```tsx
// Same code works everywhere!
<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 22.57, longitude: 88.36 }}
  onPress={(coord) => console.log('Clicked:', coord)}
/>
```
- **Mobile**: Native high-performance maps
- **Web (with MapLibre)**: Real interactive maps! 🎉
- **Web (without MapLibre)**: Professional fallback UI

📖 **[Alpha Quick Start Guide →](./MAPLIBRE_QUICKSTART.md)**

### 🛣️ **Roadmap - What's Coming:**

**v1.1.0-beta (Next)** - Markers & Basic Overlays on Web
- ✅ Markers with info windows on web
- ✅ Basic polylines and polygons on web  
- ✅ Event handling for web overlays

**v1.2.0 (Stable Web)** - Full Feature Parity  
- ✅ User location tracking on web
- ✅ Complete mobile-web feature parity
- ✅ Performance optimizations

**v1.3.0+ (Advanced)** - Web-Specific Features
- ✅ Vector tile styling on web
- ✅ Clustering and advanced overlays
- ✅ Web-specific optimizations

**Feedback Welcome!** This is an alpha - help us prioritize: [GitHub Issues](https://github.com/mapdevsaikat/expo-osm-sdk/issues)

---

## Installation

```bash
npm install expo-osm-sdk
# or
yarn add expo-osm-sdk
```

## Quick Start

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

## 🔍 Search and Geocoding

### SearchBox Component

Add instant search to your map with the professional SearchBox component:

```tsx
import React, { useRef } from 'react';
import { View } from 'react-native';
import { OSMView, SearchBox } from 'expo-osm-sdk';
import type { OSMViewRef } from 'expo-osm-sdk';

export default function MapWithSearch() {
  const mapRef = useRef<OSMViewRef>(null);

  return (
    <View style={{ flex: 1 }}>
      <SearchBox
        placeholder="Search for places, addresses..."
        onLocationSelected={(location) => {
          // Animate map to selected location
          mapRef.current?.animateToLocation(
            location.coordinate.latitude,
            location.coordinate.longitude,
            15
          );
        }}
        onResultsChanged={(results) => {
          console.log(`Found ${results.length} results`);
        }}
        maxResults={5}
        autoComplete={true}
        style={{ margin: 20, marginTop: 60 }}
      />
      <OSMView
        ref={mapRef}
        style={{ flex: 1 }}
        initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
        initialZoom={13}
      />
    </View>
  );
}
```

### Search Functions

#### Quick Search (One-liner)
```tsx
import { quickSearch } from 'expo-osm-sdk';

const location = await quickSearch("Times Square");
if (location) {
  console.log(location.displayName); // "Times Square, New York, NY, USA"
  console.log(location.coordinate);  // { latitude: 40.758, longitude: -73.985 }
}
```

#### Find Nearby Places
```tsx
import { searchNearby } from 'expo-osm-sdk';

// Find restaurants within 2km of a location
const restaurants = await searchNearby(
  { latitude: 40.7128, longitude: -74.0060 }, // NYC center
  "restaurant",
  2 // radius in km
);

console.log(`Found ${restaurants.length} restaurants`);
restaurants.forEach(restaurant => {
  console.log(`${restaurant.displayName} - ${restaurant.distance}km away`);
});
```

#### Reverse Geocoding
```tsx
import { getAddressFromCoordinates } from 'expo-osm-sdk';

// Get address from coordinates (e.g., from map long press)
const address = await getAddressFromCoordinates({
  latitude: 40.7589, 
  longitude: -73.9851
});

console.log(address); // "Broadway, New York, United States"
```

#### Smart Search (Handles Everything)
```tsx
import { smartSearch } from 'expo-osm-sdk';

// Works with coordinates
const results1 = await smartSearch("40.7128, -74.0060");

// Works with addresses  
const results2 = await smartSearch("123 Main St, New York");

// Works with place names
const results3 = await smartSearch("Central Park");

// All return SearchLocation[] with .coordinate and .displayName
```

#### POI Discovery by Category
```tsx
import { searchPOI } from 'expo-osm-sdk';

// Find hospitals near a location
const hospitals = await searchPOI(
  { latitude: 40.7128, longitude: -74.0060 },
  "hospital", // or "restaurant", "hotel", "gas", "shopping", etc.
  5 // radius in km
);
```

### useNominatimSearch Hook

For custom search UI components:

```tsx
import React, { useState } from 'react';
import { TextInput, FlatList, Text, TouchableOpacity } from 'react-native';
import { useNominatimSearch } from 'expo-osm-sdk';

export default function CustomSearch() {
  const [query, setQuery] = useState('');
  const { search, isLoading, lastResults, error } = useNominatimSearch();

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      await search(text);
    }
  };

  return (
    <>
      <TextInput
        value={query}
        onChangeText={handleSearch}
        placeholder="Search locations..."
      />
      {isLoading && <Text>Searching...</Text>}
      {error && <Text>Error: {error}</Text>}
      <FlatList
        data={lastResults}
        keyExtractor={(item) => item.placeId}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => console.log(item)}>
            <Text>{item.displayName}</Text>
          </TouchableOpacity>
        )}
      />
    </>
  );
}
```

## ✨ Features

### 🔍 **NEW: Complete Search System (v1.0.79)**
- ✅ **SearchBox Component** - Professional UI with autocomplete, debouncing, error handling
- ✅ **Location Search** - Find places, addresses, points of interest globally
- ✅ **Reverse Geocoding** - Get human-readable addresses from coordinates
- ✅ **POI Discovery** - Find nearby restaurants, hotels, hospitals by category
- ✅ **Smart Search** - Intelligent handling of coordinates, addresses, place names
- ✅ **Convenience Functions** - quickSearch, searchNearby, getAddressFromCoordinates
- ✅ **useNominatimSearch Hook** - React hook with comprehensive state management
- ✅ **Zero Setup** - No API keys required, uses OpenStreetMap Nominatim

### 🗺️ **Core Map Features**
- ✅ **Vector Tile Support** - 40-60% better performance with OpenMapTiles vector rendering
- ✅ **Current Location** - Real-time GPS tracking with follow user mode
- ✅ **Fly To Animation** - Smooth camera transitions with animateToLocation()
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

### 🌐 **Web Platform** (Alpha: Real Maps Available!)
```bash
npx expo start --web
```

**🎉 NEW: With MapLibre (v1.1.0-alpha.1)**:
- ✅ **Real Interactive Maps**: Actual OpenStreetMap rendering with MapLibre GL JS
- ✅ **Layer Switching**: Toggle between OSM and satellite layers
- ✅ **Zoom Controls**: Functional + / - buttons
- ✅ **Events**: onPress, onRegionChange work on web
- ✅ **Pan & Zoom**: Mouse/touch navigation
- ⚠️ **Alpha Limitations**: Markers, overlays not yet implemented

**Without MapLibre (Fallback)**:
- ⚠️ **Safe Fallback UI**: Professional placeholder when MapLibre not installed
- 💡 **Clear Instructions**: Guides to install MapLibre GL for real maps
- 📱 **Responsive Design**: Works on all browsers

**Setup for Web Maps**:
```bash
npm install expo-osm-sdk@alpha maplibre-gl
```

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

#### Web with MapLibre (Alpha):
```
🗺️ MapLibre Ready
   [Layer: OSM] [+] [-]

Real interactive OpenStreetMap with:
• Layer switching (OSM ↔ Satellite)
• Zoom controls and pan/zoom
• Click events and region changes
• Professional map styling
```

#### Web without MapLibre (Fallback):
```
🗺️ Loading MapLibre...

Make sure you have installed maplibre-gl:
npm install maplibre-gl

Or shows helpful fallback UI with setup instructions.
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
| `onMapReady` | `() => void` | `undefined` | Called when map is ready |
| `onRegionChange` | `(region: MapRegion) => void` | `undefined` | Called when map region changes |
| `onMarkerPress` | `(markerId: string) => void` | `undefined` | Called when marker is pressed |
| `onPress` | `(coordinate: Coordinate) => void` | `undefined` | Called when map is pressed |
| `onUserLocationChange` | `(location: Coordinate) => void` | `undefined` | Called when user location updates |

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

// New in v1.0.34: Search and Geocoding Types
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

// Map Reference Interface
interface OSMViewRef {
  animateToLocation: (latitude: number, longitude: number, zoom?: number) => void;
  getCurrentLocation: () => Promise<Coordinate | null>;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (level: number) => void;
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

## 🧪 **Alpha Testing & Feedback**

**v1.1.0-alpha.1** introduces real web maps - **your feedback shapes the future!**

### 🎯 **Try the Alpha:**
```bash
npm install expo-osm-sdk@alpha maplibre-gl
```

### 🗣️ **Share Your Experience:**
- 🐛 **Found a bug?** [Report it](https://github.com/mapdevsaikat/expo-osm-sdk/issues)
- 💡 **Feature ideas?** [Suggest them](https://github.com/mapdevsaikat/expo-osm-sdk/discussions)  
- ⭐ **Like it?** [Star us on GitHub](https://github.com/mapdevsaikat/expo-osm-sdk)
- 📱 **Built something cool?** Share it in [Discussions](https://github.com/mapdevsaikat/expo-osm-sdk/discussions)

**Your feedback helps prioritize beta features:**
- Which web features do you need most?
- Any web-specific requirements?
- Performance observations?

---

**Made with ❤️ by [Saikat Maiti](https://github.com/mapdevsaikat)**

*Experience native OpenStreetMap in your Expo app without complexity!* 