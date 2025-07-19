# 🌐 Multi-Platform Support

This showcase app demonstrates the **expo-osm-sdk** running across all platforms:

## 📱 **Native (iOS & Android)**
**Full functionality with native performance:**
- ✅ Hardware-accelerated map rendering
- ✅ Native location services with precise GPS
- ✅ Full search functionality via Nominatim
- ✅ All map overlays (markers, polylines, circles)
- 🚧 Smart marker clustering (planned)
- ✅ Vector and raster tile support
- ✅ Smooth animations and gestures

**Run with:**
```bash
npm run ios     # iOS Simulator or device
npm run android # Android emulator or device
```

## 🌐 **Web Browser**
**Cross-platform web experience powered by MapLibre GL JS:**
- ✅ Vector map rendering in WebGL
- ✅ Browser geolocation API integration
- ✅ Search functionality
- ✅ Interactive map controls
- ✅ Responsive design for different screen sizes
- ✅ Same React components as native
- ⚠️ Performance depends on browser WebGL support

**Run with:**
```bash
npm run web
```

**Supported Browsers:**
- Chrome 51+ (recommended)
- Firefox 53+
- Safari 10+
- Edge 79+

## 📱 **Expo Go**
**Demo mode with graceful fallbacks:**
- ✅ Interactive demo markers and route
- ✅ Simulated location functionality
- ✅ UI showcase of all controls
- ✅ Tile layer switching demonstration
- ⚠️ Limited to fallback UI (no native map rendering)
- ⚠️ Search functionality disabled
- ℹ️ Perfect for initial testing and UI preview

**Run with:**
```bash
npm start
# Then scan QR code with Expo Go app
```

## 🔄 **Platform Detection**

The app automatically detects the runtime environment:

```typescript
const isWeb = Platform.OS === 'web';
const isExpoGo = !!(global as any).expo && !(global as any).ExpoModules;
const isNative = Platform.OS !== 'web' && !isExpoGo;
```

## 🎨 **Platform-Specific Features**

### **Native Only:**
- GPS location tracking
- Native permission requests
- Hardware-accelerated rendering
- Full search with autocomplete

### **Web Only:**
- Browser geolocation API
- MapLibre GL JS rendering
- Web-optimized controls
- CSS-based styling enhancements

### **Expo Go Only:**
- Simulated location demo
- Educational fallback UI
- Feature preview mode
- Limited but functional showcase

## 🚀 **Development Strategy**

1. **Start with Expo Go** for rapid prototyping and UI testing
2. **Move to Web** for cross-platform development and testing
3. **Build Native** for full functionality and app store deployment

## 📊 **Performance Comparison**

| Platform | Startup Time | Map Rendering | Location Accuracy | Bundle Size |
|----------|-------------|---------------|-------------------|-------------|
| Native   | Fast        | Hardware      | GPS Precise       | Optimized   |
| Web      | Medium      | WebGL         | Browser API       | Larger      |
| Expo Go  | Fast        | Fallback UI   | Simulated         | N/A         |

This multi-platform approach showcases the true power and flexibility of **expo-osm-sdk** as the first OpenStreetMap solution built specifically for the Expo ecosystem! 🗺️✨ 