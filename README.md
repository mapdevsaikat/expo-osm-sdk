# Expo OSM SDK

[![npm version](https://img.shields.io/npm/v/expo-osm-sdk.svg)](https://www.npmjs.com/package/expo-osm-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)](https://expo.dev/)

**Native OpenStreetMap SDK for Expo mobile development with zero configuration** 🗺️

## 🚀 **NEW: Complete Mobile Routing & Navigation!**

**v1.0.90** now includes **full cross-platform routing with native mobile polylines**! 🗺️📱

✅ **FIXED (v1.0.90)**: All routing calculation issues resolved for drive, bike, transit, and walk modes!

```bash
# Latest stable with mobile routing
npm install expo-osm-sdk
```

✅ **Native Mobile Polylines**: Real route visualization on iOS & Android  
✅ **Cross-Platform Routing**: Works seamlessly on mobile and web  
✅ **Multi-Point Navigation**: Route through multiple waypoints  
✅ **Turn-by-Turn Instructions**: Real navigation with step-by-step directions  
✅ **OSRM Integration**: Complete routing powered by OpenStreetMap  
✅ **Transport Modes**: Car 🚗, Bike 🚴, Walking 🚶, Transit 🚌  
✅ **Route Styling**: Custom colors, widths, and styling per transport mode

## 🚀 Quick Start

Add to your `app.json`:
```json
{
  "expo": {
    "plugins": [["expo-osm-sdk/plugin"]]
  }
}
```

Use in your app:
```tsx
import { OSMView, SearchBox } from 'expo-osm-sdk';

// Basic Map
<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
  initialZoom={13}
/>

// Map with Search
<View style={{ flex: 1 }}>
  <SearchBox
    placeholder="Search for places..."
    onLocationSelected={(location) => {
      // Animate map to selected location
      mapRef.current?.animateToLocation(
        location.coordinate.latitude,
        location.coordinate.longitude,
        15
      );
    }}
    style={{ margin: 20, marginTop: 60 }}
  />
  <OSMView
    ref={mapRef}
    style={{ flex: 1 }}
    initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
    initialZoom={13}
  />
</View>
```

## 🗺️ NEW: Complete Mobile & Web Routing

**Version 1.0.87** introduces full cross-platform routing with native mobile support:

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

// 2. Multi-Transport Mode Navigation (like Google Maps)
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

// 2. Direct Route Calculation
const calculateCustomRoute = async () => {
  const routes = await calculateRoute([
    { latitude: 51.5074, longitude: -0.1278 }, // London
    { latitude: 48.8566, longitude: 2.3522 }   // Paris
  ], { 
    profile: 'driving',
    steps: true,        // Include turn-by-turn instructions
    alternatives: true  // Get alternative routes
  });
  
  routes.forEach((route, index) => {
    console.log(`Route ${index + 1}: ${route.distance}m, ${route.duration}s`);
    route.steps.forEach(step => {
      console.log(`${step.instruction} (${step.distance}m)`);
    });
  });
};

// 3. Navigation State Management
const { state, calculateAndDisplayRoute, nextWaypoint, clearRoute } = useOSRMRouting();

// Display route progress
console.log(`Navigation: ${state.isCalculating ? 'Calculating...' : 'Ready'}`);
if (state.currentRoute) {
  console.log(`Distance: ${state.currentRoute.distance}m`);
  console.log(`Duration: ${state.currentRoute.duration}s`);
}
```

## 🔍 Complete Search Integration

**Version 1.0.79** also includes full OpenStreetMap search and geocoding capabilities:

### 🎯 Search Features
- **🔍 Location Search**: Find places, addresses, and points of interest
- **📍 Reverse Geocoding**: Get addresses from coordinates  
- **🏪 POI Discovery**: Find nearby restaurants, hotels, hospitals
- **📱 Professional UI**: Beautiful SearchBox component with autocomplete
- **⚡ Smart Search**: Handles coordinates, addresses, and place names
- **🌐 No API Keys**: Uses free OpenStreetMap Nominatim service

### 🚀 Search Examples

```tsx
import { 
  SearchBox, 
  useNominatimSearch,
  quickSearch,
  searchNearby,
  getAddressFromCoordinates 
} from 'expo-osm-sdk';

// 1. SearchBox Component (Easiest)
<SearchBox
  placeholder="Search places..."
  onLocationSelected={(location) => console.log(location.displayName)}
  maxResults={5}
  autoComplete={true}
/>

// 2. Search Hook for Custom UI
const { search, isLoading, lastResults } = useNominatimSearch();
const results = await search("Times Square");

// 3. Quick One-Line Search
const location = await quickSearch("Central Park");

// 4. Find Nearby POIs  
const restaurants = await searchNearby(
  { latitude: 40.7128, longitude: -74.0060 },
  "restaurant",
  2 // km radius
);

// 5. Reverse Geocoding
const address = await getAddressFromCoordinates({
  latitude: 40.7589, 
  longitude: -73.9851
});
// Returns: "Broadway, New York, United States"
```

## 📁 Repository Structure

This repository contains multiple related projects:

### 📦 [`expo-osm-sdk/`](./expo-osm-sdk/) - **Main SDK Package**
The core OpenStreetMap SDK for Expo applications.
- **Installation**: `npm install expo-osm-sdk`
- **Documentation**: Complete API reference and setup guide
- **Features**: Native performance, TypeScript support, zero config

### 🧪 [`simple-map-test/`](./simple-map-test/) - **Navigation Demo App** ⭐
**Complete navigation demo with mobile routing!** 
- ✅ Full OSRM routing with native polylines on mobile
- ✅ Multi-transport modes (Car, Bike, Walk, Transit)  
- ✅ Interactive search with Nominatim integration
- ✅ Custom route styling and auto-fit functionality
- ✅ Cross-platform testing (iOS/Android/Web)
- ✅ EAS Build optimized for real device testing

### 🔧 [`expo-osm-sdk/example/`](./expo-osm-sdk/example/) - **Basic Example**
Simple testing example for SDK development.
- Basic functionality testing
- Development-focused (uses relative imports)

## 🎯 For Developers

### **🚀 Want to build a navigation app?**
1. **Start here**: [`simple-map-test/`](./simple-map-test/) - Complete navigation demo with routing
2. **Read docs**: [`expo-osm-sdk/README.md`](./expo-osm-sdk/README.md) - Full documentation
3. **Install**: `npm install expo-osm-sdk`
4. **Build**: Use EAS Build for native mobile routing features

### **🔧 Want to contribute to the SDK?**
1. **Main package**: [`expo-osm-sdk/`](./expo-osm-sdk/) - SDK source code
2. **Test with**: [`simple-map-test/`](./simple-map-test/) - For testing mobile routing changes
3. **Contributing**: See [Contributing Guidelines](./expo-osm-sdk/README.md#contributing)

## ✨ Key Features

- 🗺️ **Native OpenStreetMap** - MapLibre GL powered rendering
- 🚗 **Native Mobile Routing** - Real polyline visualization on iOS & Android
- 🌐 **Cross-Platform Routing** - Seamless routing on mobile and web
- 🎨 **Custom Route Styling** - Colors, widths, and opacity per transport mode
- 🧭 **Multi-Transport Navigation** - Car, bike, walking, and transit routing
- 📏 **Auto-Fit Routes** - Intelligent camera positioning for route visibility
- 🔍 **Complete Search System** - Full geocoding with SearchBox UI component
- 📍 **Reverse Geocoding** - Get addresses from coordinates instantly
- 🏪 **POI Discovery** - Find nearby restaurants, hotels, hospitals
- 🚀 **Zero Configuration** - Works out of the box with Expo
- 📱 **Mobile-First Design** - Optimized for iOS and Android performance
- 🎯 **TypeScript First** - Full type safety and IntelliSense
- 🔧 **Development Friendly** - Hot reload, debugging support
- 🌐 **Graceful Fallbacks** - Professional UIs for Expo Go
- 📦 **No API Keys** - Uses OpenStreetMap directly
- ⚡ **GPU Accelerated** - Hardware-accelerated map rendering
- 🧪 **Fully Tested** - 142+ tests ensuring reliability

## 🎯 Platform Support

| Platform | Support | Experience |
|----------|---------|------------|
| **iOS Development Build** | ✅ Full Native | Complete OpenStreetMap with native polyline routing |
| **Android Development Build** | ✅ Full Native | Complete OpenStreetMap with native polyline routing |
| **Web** | ✅ MapLibre GL JS | Interactive maps with web-based routing visualization |
| **Expo Go** | ⚠️ Fallback UI | Professional placeholder with helpful messaging |

### 🚀 Routing Platform Features

| Feature | iOS | Android | Web | Expo Go |
|---------|-----|---------|-----|---------|
| **Route Calculation** | ✅ | ✅ | ✅ | ❌ |
| **Native Polylines** | ✅ | ✅ | ✅ (MapLibre) | ❌ |
| **Route Styling** | ✅ | ✅ | ✅ | ❌ |
| **Auto-Fit Routes** | ✅ | ✅ | ✅ | ❌ |
| **Turn-by-Turn** | ✅ | ✅ | ✅ | ❌ |
| **Transport Modes** | ✅ | ✅ | ✅ | ❌ |

## 📖 Documentation

- **📚 Complete Guide**: [expo-osm-sdk/README.md](./expo-osm-sdk/README.md)
- **🧪 Test App**: [simple-map-test/README.md](./simple-map-test/README.md)
- **📦 npm Package**: [expo-osm-sdk](https://www.npmjs.com/package/expo-osm-sdk)
- **🐛 Issues**: [Report problems](https://github.com/mapdevsaikat/expo-osm-sdk/issues)

## 🚀 Quick Examples

### Basic Map
```tsx
import { OSMView } from 'expo-osm-sdk';

<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 51.5074, longitude: -0.1278 }}
  initialZoom={10}
/>
```

### Map with Search
```tsx
import { OSMView, SearchBox } from 'expo-osm-sdk';

<View style={{ flex: 1 }}>
  <SearchBox
    placeholder="Search London..."
    onLocationSelected={(location) => {
      mapRef.current?.animateToLocation(
        location.coordinate.latitude,
        location.coordinate.longitude,
        15
      );
    }}
    style={{ margin: 20, marginTop: 60 }}
  />
  <OSMView
    ref={mapRef}
    style={{ flex: 1 }}
    initialCenter={{ latitude: 51.5074, longitude: -0.1278 }}
    initialZoom={10}
  />
</View>
```

### Quick Location Search
```tsx
import { quickSearch } from 'expo-osm-sdk';

// One-line search
const location = await quickSearch("Big Ben London");
console.log(location.displayName); // "Big Ben, Westminster, London, England"
```

### With Mobile Routing
```tsx
import { useOSRMRouting } from 'expo-osm-sdk';

const routing = useOSRMRouting();
const mapRef = useRef();

// Calculate and display route with native polylines
const showRoute = async () => {
  const route = await routing.calculateAndDisplayRoute(
    { latitude: 51.5074, longitude: -0.1278 }, // London
    { latitude: 48.8566, longitude: 2.3522 },  // Paris
    mapRef,
    { 
      profile: 'driving',
      routeStyle: { color: '#007AFF', width: 5 } 
    }
  );
  
  if (route) {
    console.log(`${routing.formatRouteDistance(route)} in ${routing.formatRouteDuration(route)}`);
  }
};

<OSMView
  ref={mapRef}
  style={{ flex: 1 }}
  initialCenter={{ latitude: 51.5074, longitude: -0.1278 }}
  initialZoom={10}
/>
```

### With Markers
```tsx
const markers = [
  {
    id: 'london',
    coordinate: { latitude: 51.5074, longitude: -0.1278 },
    title: 'London',
    description: 'Capital of England'
  }
];

<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 51.5074, longitude: -0.1278 }}
  initialZoom={10}
  markers={markers}
  onMarkerPress={(id) => console.log('Marker pressed:', id)}
/>
```

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** this repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Test** your changes thoroughly
4. **Commit** your changes (`git commit -m 'Add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

## 📄 License

MIT License - see [LICENSE](./expo-osm-sdk/LICENSE) file for details.

## 🙏 Acknowledgments

- **MapLibre GL Native** - Powerful map rendering engine
- **OpenStreetMap** - Community-driven map data
- **Expo Team** - Amazing development platform
- **Contributors** - Thank you for making this better!

---

**Made with ❤️ by [Saikat Maiti](https://github.com/mapdevsaikat)**

*Experience native OpenStreetMap in your Expo app without complexity!* 