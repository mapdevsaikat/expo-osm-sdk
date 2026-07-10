# 🗺️ MapLibre Web Integration - Quick Start

## 🚀 Real Maps on Web - Alpha Release!

**expo-osm-sdk v1.1.0-alpha.1** now supports **real interactive maps** on web browsers using MapLibre GL JS!

## ⚡ Quick Setup

### Option 1: Basic Setup (Safe Fallback)
```bash
npm install expo-osm-sdk
```
- ✅ Works everywhere
- ❌ Shows fallback UI on web

### Option 2: With Real Web Maps ⭐ **RECOMMENDED**
```bash
npm install expo-osm-sdk maplibre-gl
```
- ✅ Works everywhere  
- ✅ **Real interactive maps on web!** 🎉

## 📱 Usage - Same Code, Works Everywhere!

```tsx
{% raw %}
import React from 'react';
import { OSMView } from 'expo-osm-sdk';

export default function App() {
  return (
    <OSMView
      style={{ flex: 1 }}
      initialCenter={{ latitude: 22.5726, longitude: 88.3639 }} // Kolkata
      initialZoom={12}
      onPress={(coordinate) => {
        console.log('Map clicked:', coordinate);
      }}
      onMapReady={() => {
        console.log('Map is ready!');
      }}
    />
  );
}
{% endraw %}
```

**Results:**
- **📱 Mobile (iOS/Android)**: Native high-performance maps
- **🌐 Web (with MapLibre)**: Real interactive MapLibre GL maps
- **🌐 Web (without MapLibre)**: Safe fallback UI

## 🎮 Available Features on Web

### ✅ Working (Alpha)
- **Base Map**: OpenStreetMap rendering
- **Layer Switch**: Toggle OSM ↔ Satellite
- **Zoom Controls**: Zoom in/out buttons  
- **Pan & Zoom**: Mouse/touch navigation
- **Map Events**: onPress, onRegionChange
- **Custom Tiles**: Your own tile server URLs

### ⚠️ Coming Soon (Beta)
- Markers and Info Windows
- Polylines and Polygons  
- User Location Tracking
- Clustering
- Advanced Styling

## 🎯 Web Controls

When MapLibre is available, you'll see:

**Top Right Corner:**
- 🗺️ **Layer Button**: "OSM" or "Satellite"
- **Zoom Controls**: + and - buttons

**Bottom Left:**
- 🟢 **Status**: "MapLibre Ready"

## 📋 Development Tips

### Check if MapLibre is Working
```tsx
const handleMapReady = () => {
  console.log('🗺️ Map loaded successfully!');
  // This fires on both mobile and web
};

<OSMView onMapReady={handleMapReady} />
```

### Test Both Modes
```bash
# Test without MapLibre (fallback)
npm uninstall maplibre-gl
npm start

# Test with MapLibre (real maps)
npm install maplibre-gl  
npm start
```

### Layer Switching
```tsx
<OSMView
  tileServerUrl="https://your-custom-tiles/{z}/{x}/{y}.png"
  // Will use your custom tiles on web
/>
```

## 🐛 Troubleshooting

### "Loading MapLibre..." Stuck?
```bash
# Make sure MapLibre is installed
npm install maplibre-gl

# Check if it's in your dependencies
npm list maplibre-gl
```

### CSS Styling Issues?
The CSS is loaded automatically, but you can include it manually:
```html
<link href="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css" rel="stylesheet">
```

### Web Controls Not Appearing?
- Make sure your OSMView has enough space (minimum 200px height)
- Check browser console for any MapLibre errors

## 🔮 Roadmap

### v1.1.0-beta (Next)
- ✅ Markers on web
- ✅ Basic overlays (polylines, polygons)

### v1.2.0 (Stable)
- ✅ User location on web
- ✅ Feature parity with mobile
- ✅ Performance optimizations

### v1.3.0 (Advanced)
- ✅ Clustering on web
- ✅ Vector tile styles
- ✅ Advanced web-specific features

## 🤝 Feedback

This is an **alpha release** - we'd love your feedback!

- 🐛 **Issues**: [GitHub Issues](https://github.com/mapdevsaikat/expo-osm-sdk/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/mapdevsaikat/expo-osm-sdk/discussions)
- ⭐ **Star us**: If you like it, give us a star!

## 🎯 Example Projects

### Basic Web Map
```tsx
{% raw %}
<OSMView
  initialCenter={{ latitude: 40.7827, longitude: -73.9653 }} // Central Park
  initialZoom={15}
  onPress={handleMapClick}
/>
{% endraw %}
```

### Custom Tiles
```tsx
{% raw %}
<OSMView
  tileServerUrl="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  initialCenter={{ latitude: 22.57, longitude: 88.36 }}
/>
{% endraw %}
```

### Event Handling
```tsx
<OSMView
  onMapReady={() => console.log('Map ready!')}
  onPress={(coord) => console.log('Clicked:', coord)}
  onRegionChange={(region) => console.log('Region:', region)}
/>
```

---

**🎉 Welcome to the future of cross-platform mapping!**

Your **expo-osm-sdk** now works natively on mobile and interactively on web with the same codebase! 🌍✨ 