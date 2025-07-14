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
import { OSMView } from 'expo-osm-sdk';

<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
  initialZoom={13}
/>
```

## 📁 Repository Structure

This repository contains multiple related projects:

### 📦 [`expo-osm-sdk/`](./expo-osm-sdk/) - **Main SDK Package**
The core OpenStreetMap SDK for Expo applications.
- **Installation**: `npm install expo-osm-sdk`
- **Documentation**: Complete API reference and setup guide
- **Features**: Native performance, TypeScript support, zero config

### 📱 [`demo-project/`](./demo-project/) - **Comprehensive Demo App** ⭐
**Perfect starting point for developers!** 
- ✅ Complete Expo app showcasing all SDK features
- ✅ Professional UI with modern components
- ✅ Interactive controls, markers, and event handling
- ✅ Best practices and TypeScript examples
- ✅ Platform behavior demonstrations (iOS/Android/Web/Expo Go)

### 🧪 [`expo-osm-sdk/example/`](./expo-osm-sdk/example/) - **Basic Example**
Simple testing example for SDK development.
- Basic functionality testing
- Development-focused (uses relative imports)

## 🎯 For Developers

### **🚀 Want to build a map app?**
1. **Start here**: [`demo-project/`](./demo-project/) - Copy and customize the comprehensive demo
2. **Read docs**: [`expo-osm-sdk/README.md`](./expo-osm-sdk/README.md) - Full documentation
3. **Install**: `npm install expo-osm-sdk`

### **🔧 Want to contribute to the SDK?**
1. **Main package**: [`expo-osm-sdk/`](./expo-osm-sdk/) - SDK source code
2. **Basic example**: [`expo-osm-sdk/example/`](./expo-osm-sdk/example/) - For testing changes
3. **Contributing**: See [Contributing Guidelines](./expo-osm-sdk/README.md#contributing)

## ✨ Key Features

- 🗺️ **Native OpenStreetMap** - MapLibre GL powered rendering
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
- **📱 Demo App**: [demo-project/README.md](./demo-project/README.md)
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