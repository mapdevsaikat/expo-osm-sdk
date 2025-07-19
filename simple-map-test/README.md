# 🗺️ Expo OSM SDK - Showcase Demo

A beautiful showcase application demonstrating the power of **expo-osm-sdk** - the first-ever OpenStreetMap SDK designed specifically for Expo.

## ✨ Features Demonstrated

### 🗺️ **Map Functionality**
- **Vector & Raster Tiles**: Switch between high-quality vector maps and traditional raster tiles
- **Interactive Navigation**: Zoom, pan, and explore with smooth animations
- **NYC Tour**: Pre-configured demo showcasing iconic New York City landmarks

### 📍 **Location Services**
- **Current Location**: Find and display your precise location with a single tap
- **Location Tracking**: Real-time location updates with visual indicators
- **Permission Handling**: Graceful permission requests and error handling

### 🔍 **Search & Geocoding**
- **Place Search**: Powered by Nominatim for worldwide location search
- **Autocomplete**: Smart suggestions as you type
- **Search Results**: Direct navigation to found locations

### 🎯 **Map Overlays**
- **Markers**: Custom-styled location markers with popups
- **Routes**: Polyline visualization connecting multiple points
- **Circles**: Visual proximity indicators around locations
- **Smart Clustering**: 🚧 Planned for future release

### 🎮 **Interactive Controls**
- **Tile Layer Switching**: Toggle between different map styles
- **Feature Toggles**: Show/hide demo features
- **Zoom Controls**: Built-in zoom in/out functionality
- **Loading States**: Professional loading indicators

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Choose Your Platform:**

   **📱 Native Development (Full Features)**
   ```bash
   npm run ios     # iOS Simulator/Device
   npm run android # Android Emulator/Device
   ```

   **🌐 Web Browser (Cross-Platform)**
   ```bash
   npm run web     # Opens in your default browser
   ```

   **📱 Expo Go (Demo Mode)**
   ```bash
   npm start       # Scan QR code with Expo Go app
   ```

## 🏗️ Built With

- **expo-osm-sdk v1.0.55** - OpenStreetMap integration
- **Expo 53** - React Native framework
- **Nominatim** - Geocoding and search services
- **OpenStreetMap** - Community-driven map data

## 📱 Demo Features

### 🗽 NYC Tour
Explore pre-configured markers showing:
- Times Square - The heart of NYC
- Empire State Building - Iconic skyscraper
- One World Trade Center - Freedom Tower
- Statue of Liberty - Symbol of freedom

### 🎛️ Interactive Controls
- **Map Styles**: Vector maps vs. traditional raster tiles
- **Location Services**: Find your current position
- **Search**: Find any place worldwide
- **Demo Toggle**: Show/hide example features

## 🌟 Why expo-osm-sdk?

This is the **first-ever OpenStreetMap SDK** built specifically for Expo, offering:

- ✅ **Universal**: Works on iOS, Android, Web, and Expo Go
- ✅ **Native Performance**: Hardware-accelerated rendering
- ✅ **Web Compatible**: MapLibre GL JS integration  
- ✅ **Rich Features**: Markers, overlays, search (clustering planned)
- ✅ **TypeScript**: Full type safety and IntelliSense
- ✅ **Production Ready**: Battle-tested and optimized

## 🌐 Platform Support

| Platform | Status | Features |
|----------|--------|----------|
| **iOS Native** | ✅ Full | Hardware acceleration, GPS, all features |
| **Android Native** | ✅ Full | Hardware acceleration, GPS, all features |
| **Web Browser** | ✅ Full | WebGL rendering, browser geolocation |
| **Expo Go** | ✅ Demo | Interactive preview, simulated features |

📖 **Detailed platform information**: [PLATFORMS.md](./PLATFORMS.md)

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details.

## 🤝 Contributing

Issues and pull requests are welcome on the main repository! 