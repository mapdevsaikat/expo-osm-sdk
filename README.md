# Expo OSM SDK

[![npm version](https://img.shields.io/npm/v/expo-osm-sdk.svg)](https://www.npmjs.com/package/expo-osm-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)](https://expo.dev/)

**Native OpenStreetMap SDK for Expo mobile development with zero configuration** 🗺️

## 🚀 Quick Start

```bash
npm install expo-osm-sdk
```

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

## 🔍 NEW: Complete Search Integration

**Version 1.0.79** introduces full OpenStreetMap search and geocoding capabilities:

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

### 🧪 [`simple-map-test/`](./simple-map-test/) - **Minimal Test App** ⭐
**Perfect for testing and validation!** 
- ✅ Minimal test app for cloud builds (no local SDK required)
- ✅ Interactive OpenStreetMap with tap interactions
- ✅ Real-time logging and coordinate display
- ✅ Cross-platform testing (iOS/Android)
- ✅ EAS Build optimized (~20MB APK vs 100MB full demo)

### 🔧 [`expo-osm-sdk/example/`](./expo-osm-sdk/example/) - **Basic Example**
Simple testing example for SDK development.
- Basic functionality testing
- Development-focused (uses relative imports)

## 🎯 For Developers

### **🚀 Want to build a map app?**
1. **Start here**: [`simple-map-test/`](./simple-map-test/) - Minimal testing app you can extend
2. **Read docs**: [`expo-osm-sdk/README.md`](./expo-osm-sdk/README.md) - Full documentation
3. **Install**: `npm install expo-osm-sdk`

### **🔧 Want to contribute to the SDK?**
1. **Main package**: [`expo-osm-sdk/`](./expo-osm-sdk/) - SDK source code
2. **Test with**: [`simple-map-test/`](./simple-map-test/) - For testing changes
3. **Contributing**: See [Contributing Guidelines](./expo-osm-sdk/README.md#contributing)

## ✨ Key Features

- 🗺️ **Native OpenStreetMap** - MapLibre GL powered rendering
- 🔍 **Complete Search System** - Full geocoding with SearchBox UI component
- 📍 **Reverse Geocoding** - Get addresses from coordinates instantly
- 🏪 **POI Discovery** - Find nearby restaurants, hotels, hospitals
- 🚀 **Zero Configuration** - Works out of the box with Expo
- 📱 **Cross Platform** - iOS and Android native performance
- 🎯 **TypeScript First** - Full type safety and IntelliSense
- 🔧 **Development Friendly** - Hot reload, debugging support
- 🌐 **Graceful Fallbacks** - Professional UIs for Expo Go and Web
- 📦 **No API Keys** - Uses OpenStreetMap directly
- ⚡ **GPU Accelerated** - Hardware-accelerated map rendering
- 🧪 **Fully Tested** - 125+ tests ensuring reliability

## 🎯 Platform Support

| Platform | Support | Experience |
|----------|---------|------------|
| **iOS Development Build** | ✅ Full Native | Complete OpenStreetMap with all features |
| **Android Development Build** | ✅ Full Native | Complete OpenStreetMap with all features |
| **Expo Go** | ⚠️ Fallback UI | Professional placeholder with helpful messaging |
| **Web** | ⚠️ Fallback UI | Informative screen with web alternatives |

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