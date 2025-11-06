# Expo OSM SDK

[![npm version](https://img.shields.io/npm/v/expo-osm-sdk.svg)](https://www.npmjs.com/package/expo-osm-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)](https://expo.dev/)

**Native OpenStreetMap SDK for Expo mobile development with zero configuration** 🗺️

**v1.1.7** - **✅ SearchBox Clear Button Fix** - Fixed clear button not working with controlled value prop, added onClear callback

**v1.1.6** - **✅ NavigationControls Icons** - Updated compass and pitch icons with white circle backgrounds and purple navigation arrows for better visual clarity

**v1.1.5** - **✅ Navigation Camera Fixes** - Fixed zoom/pitch during navigation, smoother camera transitions, cleaner UI

**v1.1.4** - **✅ Native Compass Control** - Fixed showsCompass prop not being passed to native views, added map control props support (iOS & Android)

**v1.1.3** - **✅ Thread Safety Fix** - Fixed setPitch/setBearing thread safety on Android for proper navigation camera controls

**v1.1.2** - **✅ Camera Methods & Search Fixes** - Added setBearing/setPitch/getBearing/getPitch methods, fixed SearchBox selection issues, borderless NavigationControls

**v1.1.1** - **✅ Complete Component Exports** - All UI components (LocationButton, NavigationControls) and prop types now fully exported

**v1.1.0** - **✅ Expo SDK 53 Fully Compatible** - Removed OnCreate/OnDestroy lifecycle callbacks for clean builds on Expo SDK 53

## 🚀 **NEW: 3D Navigation & Camera Controls!**
**v1.0.98** - Full pitch & bearing support with `NavigationControls` component - build navigation apps with tilted 3D camera views! 🎥🧭

## 🚀 **NEW: Full Android Feature Parity!**
**v1.0.97** - **Solution:** Simplified `setupMapView()` to use `addView(mapView)` without any 
LayoutParams specification

**v1.0.96** - 🎯 **Critical Android Layout Fix** - prevent build failure and crash! 

**v1.0.95** - 🎯 **Enhancement** - Geofencing and signature user location! 

**v1.0.94** - 🎯 **Fixed expo-doctor compatibility** - Now works with Expo SDK 52 & 53! 

**v1.0.93** - Latest version with build compatibility fixes for EAS builds 

**1.0.92** - Fixed type safety 

**v1.0.91** now includes **complete Android support for custom markers, shapes! 🗺️📱

✅ **NEW (v1.0.91)**: Custom marker icons, circles, polylines, and polygons now work on Android!  
✅ **Platform Parity**: iOS and Android now have identical feature sets!  
✅ **Complete Routing**: Full native mobile routing with polylines and cross-platform support!

```bash
# Latest stable with mobile routing
npm install expo-osm-sdk
```

✅ **Custom Marker Icons**: Use any image URL as marker icons (iOS & Android)  
✅ **Circles**: Draw circles with custom radius, fill, and stroke (iOS & Android)  
✅ **Polylines**: Draw lines for routes and paths (iOS & Android)  
✅ **Polygons**: Draw filled areas and shapes (iOS & Android)  
✅ **Native Mobile Polylines**: Real route visualization on iOS & Android  
✅ **Cross-Platform Routing**: Works seamlessly on mobile and web  
✅ **Multi-Transport Navigation**: Car 🚗, Bike 🚴, Walking 🚶  
✅ **Turn-by-Turn Instructions**: Real navigation with step-by-step directions  
✅ **OSRM Integration**: Complete routing powered by OpenStreetMap  
✅ **Route Styling**: Custom colors, widths, and styling per transport mode  
✅ **Complete Search System**: Full geocoding with SearchBox UI component

## Installation

```bash
npm install expo-osm-sdk
# or
yarn add expo-osm-sdk
```

## 🗺️ Mobile Routing & Navigation

**Version 1.0.88** introduces complete native mobile routing with cross-platform support:

### 📱 Mobile-First Routing Features
- **🏗️ Native Polylines**: Real route visualization using MapLibre native on iOS & Android
- **🎨 Custom Route Styling**: Colors, widths, and opacity for each transport mode
- **🗺️ Multi-Point Routes**: Navigate through multiple waypoints in sequence
- **🧭 Turn-by-Turn Instructions**: Real navigation with step-by-step directions
- **📏 Distance Matrix**: Calculate route distance, duration, and estimated time
- **🛣️ Route Profiles**: Support for driving, walking, and cycling routes
- **⚡ OSRM Integration**: Powered by OpenStreetMap's routing engine
- **📍 Auto-Fit Routes**: Automatically zoom to show complete routes
- **🔄 Route Switching**: Seamless switching between transport modes
- **🌐 Cross-Platform**: Works on iOS, Android, and Web with appropriate implementations

### 🚀 Mobile Navigation Examples

```tsx
import { 
  useOSRMRouting,
  calculateRoute,
  type Route,
  type OSMViewRef 
} from 'expo-osm-sdk';

// 1. Complete Mobile Navigation with Native Polylines
const routing = useOSRMRouting();
const mapRef = useRef<OSMViewRef>(null);

const startNavigation = async () => {
  const from = { latitude: 40.7128, longitude: -74.0060 }; // NYC
  const to = { latitude: 41.8781, longitude: -87.6298 };   // Chicago
  
  // Calculate and display route with native polylines on mobile
  const route = await routing.calculateAndDisplayRoute(
    from, to, mapRef,
    { 
      profile: 'driving', 
      routeStyle: { 
        color: '#007AFF',    // Custom blue for driving
        width: 5,            // Route line width
        opacity: 0.8         // Route transparency
      } 
    }
  );
  
  if (route) {
    console.log(`Route: ${routing.formatRouteDistance(route)} in ${routing.formatRouteDuration(route)}`);
    console.log('Turn-by-turn:', route.steps.map(s => s.instruction));
    
    // Auto-fit the route in view (works on both mobile and web)
    await routing.fitRouteInView(route, mapRef, 50);
  }
};

// 2. Multi-Transport Mode Navigation
const TRANSPORT_MODES = [
  { id: 'car', profile: 'driving', color: '#007AFF', icon: '🚗' },
  { id: 'bike', profile: 'cycling', color: '#34C759', icon: '🚴' },
  { id: 'walk', profile: 'walking', color: '#8E8E93', icon: '🚶' },
];

const calculateAllRoutes = async () => {
  const from = { latitude: 51.5074, longitude: -0.1278 }; // London
  const to = { latitude: 48.8566, longitude: 2.3522 };   // Paris
  
  for (const mode of TRANSPORT_MODES) {
    const route = await routing.calculateAndDisplayRoute(
      from, to, mapRef,
      { 
        profile: mode.profile,
        routeStyle: { color: mode.color, width: 5 }
      }
    );
    
    if (route) {
      console.log(`${mode.icon} ${mode.id}: ${routing.formatRouteDistance(route)} in ${routing.formatRouteDuration(route)}`);
    }
  }
};
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

### 💜 Show User Location (Signature Purple)

```tsx
import { OSMView } from 'expo-osm-sdk';

<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 37.7749, longitude: -122.4194 }}
  initialZoom={15}
  showUserLocation={true}              // Show purple location dot
  followUserLocation={true}            // Keep camera centered on user
  onUserLocationChange={(location) => {
    console.log('Location:', location.latitude, location.longitude);
  }}
/>
```

**Customize Colors:**
```tsx
<OSMView
  showUserLocation={true}
  userLocationTintColor="#9C1AFF"                      // Main marker color (signature purple)
  userLocationAccuracyFillColor="rgba(156, 26, 255, 0.2)"  // Accuracy circle fill
  userLocationAccuracyBorderColor="#9C1AFF"            // Accuracy circle border
/>
```

**Features:**
- 💜 Animated purple dot with signature #9C1AFF color
- 📍 Accuracy circle showing GPS precision
- 🧭 Compass/bearing indicator
- ⚡ Smooth animations
- 🔋 Battery optimized

### 🎨 New: Custom Markers, Shapes & Drawing (v1.0.91)

Full support for custom marker icons, circles, polylines, and polygons on both iOS and Android:

```tsx
import { OSMView } from 'expo-osm-sdk';

<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
  initialZoom={13}
  
  // Custom marker icons
  markers={[{
    id: '1',
    coordinate: { latitude: 40.7128, longitude: -74.0060 },
    title: 'Custom Icon',
    icon: { 
      uri: 'https://maps.google.com/mapfiles/ms/micons/blue.png',
      size: 40
    }
  }]}
  
  // Draw circles
  circles={[{
    id: 'c1',
    center: { latitude: 40.7128, longitude: -74.0060 },
    radius: 500, // meters
    fillColor: '#0000FF',
    fillOpacity: 0.2,
    strokeColor: '#0000FF',
    strokeWidth: 2
  }]}
  
  // Draw lines
  polylines={[{
    id: 'route',
    coordinates: [
      { latitude: 40.7128, longitude: -74.0060 },
      { latitude: 40.7138, longitude: -74.0070 }
    ],
    strokeColor: '#FF0000',
    strokeWidth: 3
  }]}
  
  // Draw areas
  polygons={[{
    id: 'area',
    coordinates: [
      { latitude: 40.712, longitude: -74.006 },
      { latitude: 40.713, longitude: -74.006 },
      { latitude: 40.713, longitude: -74.007 }
    ],
    fillColor: '#00FF00',
    fillOpacity: 0.3
  }]}
/>
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

### 💜 **NEW: Signature Purple User Location (v1.0.95)**
- ✅ **Animated Purple Dot** - Beautiful signature #9C1AFF purple location marker
- ✅ **Accuracy Circle** - Semi-transparent purple accuracy visualization
- ✅ **Pulse Animation** - Smooth animated pulse effect (Android)
- ✅ **Compass/Bearing** - Direction indicator shows which way you're facing
- ✅ **Customizable Colors** - Change tint, accuracy fill, and border colors
- ✅ **iOS & Android Parity** - Identical visual appearance on both platforms
- ✅ **Battery Optimized** - Efficient native rendering
- ✅ **Smooth Animations** - Fluid transitions when moving

### 🎯 **Geofencing (v1.0.95)**
- ✅ **Circle & Polygon Geofences** - Define boundaries with circles or custom shapes
- ✅ **Enter/Exit/Dwell Events** - Trigger actions when users enter, exit, or stay in areas
- ✅ **Multiple Geofence Monitoring** - Track many locations simultaneously
- ✅ **High-Precision Detection** - Haversine distance + ray casting algorithms
- ✅ **Battery Optimized** - Configurable intervals for performance vs battery life
- ✅ **useGeofencing Hook** - Easy React integration with TypeScript support
- ✅ **Zero Setup** - Pure JavaScript, no native modules needed
- 📖 [Complete Geofencing Guide](./expo-osm-sdk/docs/GEOFENCING_GUIDE.md)

### 📍 **Custom Markers & Overlays**
- ✅ **Custom Marker Icons** - Use any image URL or local asset as marker icon
- ✅ **Circles** - Draw radius-based areas (delivery zones, geofences)
- ✅ **Polylines** - Draw routes and paths with custom styling
- ✅ **Polygons** - Define complex area boundaries
- ✅ **Custom Overlays** - Render any React component on the map
- ✅ **Full Styling Control** - Colors, widths, opacity, z-index
- ✅ **Interactive** - onPress callbacks for markers
- ✅ **iOS & Android Support** - Native rendering on both platforms
- 📖 [Custom Markers Guide](./expo-osm-sdk/docs/CUSTOM_MARKERS_GUIDE.md)

### 🔍 **Complete Search System (v1.0.79)**
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

### 🌐 **Web Platform**
```bash
npx expo start --web
```

**Experience**:
- ✅ **Cross-Platform Routing**: OSRM routing calculations work on web
- ✅ **MapLibre GL JS Support**: Route visualization with web-based polylines  
- ✅ **Professional Fallback**: Informative UI when MapLibre not available
- 📱 **Responsive Design**: Works on all browsers with appropriate fallbacks

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

#### Web Platform:
```
🗺️ Cross-Platform Routing

OSRM routing and search features:
• Route calculation across all platforms
• Web-compatible polyline display
• Professional fallback UI
• Responsive design for all browsers
```

## 📋 Requirements

- **Expo SDK**: 49+ ✅ **Fully Compatible with SDK 52 & 53**
- **React**: 18.x or 19.x
- **React Native**: 0.72+ (supports 0.76.x & 0.77.x)
- **iOS**: 13+ 
- **Android**: API 21+
- **Node.js**: 16+
- **Development Build**: Required (does not work in Expo Go)

### 🎯 Expo SDK Compatibility

| Expo SDK | React Native | expo-modules-core | Status |
|----------|--------------|-------------------|---------|
| SDK 49   | 0.73.x       | 2.4.x             | ✅ Supported |
| SDK 52   | 0.76.x       | 2.5.x             | ✅ Fully Supported |
| SDK 53   | 0.77.x       | 2.6.x             | ✅ Fully Supported |

**Note**: `expo-modules-core` is automatically provided by the `expo` package - you don't need to install it separately!

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

See [CHANGELOG.md](./CHANGELOG.md) for a detailed history of changes.



**Made with ❤️ by [Saikat Maiti](https://github.com/mapdevsaikat)**

*Experience native OpenStreetMap in your Expo app without complexity!* 