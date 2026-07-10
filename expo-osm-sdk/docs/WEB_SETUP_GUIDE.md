# 🌐 Web Support Setup Guide - expo-osm-sdk

## 🎯 **Current Web Status**

**⚠️ Web support requires additional setup!**

Unlike iOS and Android (which work out-of-the-box), **web requires you to manually install MapLibre GL JS**.

---

## ✅ **Quick Setup (2 minutes)**

### **Step 1: Install MapLibre GL JS**

```bash
# NPM
npm install maplibre-gl

# Yarn
yarn add maplibre-gl

# PNPM
pnpm add maplibre-gl
```

### **Step 2: That's it!**

Your web app will now render maps automatically using MapLibre GL JS.

```tsx
{% raw %}
import { OSMView } from 'expo-osm-sdk';

// Works on iOS, Android, AND Web now!
<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
  initialZoom={13}
/>
{% endraw %}
```

---

## 🔍 **Why This Extra Step?**

### **Mobile (iOS/Android)**
- ✅ Uses **native** MapLibre GL Native (C++ library)
- ✅ Bundled in the native modules
- ✅ **Zero setup required**

### **Web**
- ⚠️ Uses **MapLibre GL JS** (JavaScript library)
- ⚠️ NOT bundled by default (keeps package size small)
- ⚠️ **Manual install required**

**Why separate?**
- MapLibre GL JS adds ~500KB to web bundle
- Not needed for mobile-only apps
- Keeps the package lightweight for most users

---

## 📦 **Package Size Impact**

| Platform | With MapLibre | Without MapLibre |
|----------|--------------|------------------|
| iOS | ~12 MB (native) | ~12 MB (native) |
| Android | ~15 MB (native) | ~15 MB (native) |
| **Web** | **~550 KB** | **~50 KB** |

For web-only or web+mobile apps, the 550KB is worth it!

---

## 🎨 **Web-Specific Configuration**

### **Custom Tile Servers**

```tsx
<OSMView
  // Standard OSM tiles (default)
  tileServerUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  
  // Or use vector tiles
  styleUrl="https://demotiles.maplibre.org/style.json"
/>
```

### **Available Features on Web**

| Feature | iOS/Android | Web | Notes |
|---------|-------------|-----|-------|
| Map Display | ✅ | ✅ | Full support |
| Zoom/Pan | ✅ | ✅ | Full support |
| Markers | ✅ | ✅ | Basic markers |
| Polylines | ✅ | ✅ | Route visualization |
| Polygons | ✅ | ✅ | Areas |
| Circles | ✅ | ✅ | Radius circles |
| User Location | ✅ | ⚠️ | Browser API only |
| GPS Tracking | ✅ | ⚠️ | Limited accuracy |
| Clustering | ✅ | ⚠️ | Not implemented yet |
| Custom Icons | ✅ | ⚠️ | Basic only |

---

## ⚠️ **What Happens Without MapLibre?**

If you don't install `maplibre-gl`, the web will show a **fallback UI**:

```
🗺️ expo-osm-sdk
Web Fallback

Native map component not available on web platform.

📊 Map Configuration
📍 Center: 40.7128, -74.0060
🔍 Zoom Level: 13

💡 For web maps, consider: react-leaflet, mapbox-gl, or Google Maps
```

**This fallback:**
- ✅ Won't crash your app
- ✅ Shows map configuration
- ✅ Displays markers/overlays count
- ❌ But no actual interactive map

---

## 🚀 **Recommended Web Setup**

### **For Full Cross-Platform Apps**

```bash
# Install the full stack
npm install expo-osm-sdk maplibre-gl

# Add to app.json
{
  "expo": {
    "plugins": [["expo-osm-sdk/plugin"]]
  }
}
```

### **For Mobile-Only Apps**

```bash
# Just install the SDK
npm install expo-osm-sdk

# No need for maplibre-gl
# Web will show fallback UI (which is fine if you don't need web)
```

---

## 🛠️ **Advanced Web Configuration**

### **Custom MapLibre Configuration**

```tsx
{% raw %}
import { OSMView } from 'expo-osm-sdk';

// Use custom MapLibre settings
<OSMView
  styleUrl="https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY"
  initialCenter={{ latitude: 51.5074, longitude: -0.1278 }}
  initialZoom={12}
  
  // Web-specific events work
  onPress={(coordinate) => {
    console.log('Clicked:', coordinate);
  }}
  onRegionChange={(region) => {
    console.log('Region changed:', region);
  }}
/>
{% endraw %}
```

### **Loading Custom Tiles**

```tsx
// Satellite tiles
<OSMView
  tileServerUrl="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
/>

// Dark mode tiles
<OSMView
  styleUrl="https://demotiles.maplibre.org/style-dark.json"
/>

// Custom vector tiles
<OSMView
  styleUrl="https://your-server.com/custom-style.json"
/>
```

---

## 🐛 **Troubleshooting Web Issues**

### **Issue #1: "Module not found: maplibre-gl"**

**Fix:**
```bash
npm install maplibre-gl
```

### **Issue #2: Map not showing on web, just fallback UI**

**Possible causes:**
1. MapLibre GL not installed → Run `npm install maplibre-gl`
2. Import error in bundler → Check Metro/Webpack config
3. CSS not loaded → MapLibre handles this automatically

**Debug:**
```bash
# Check if maplibre-gl is installed
npm list maplibre-gl

# Should show:
# └── maplibre-gl@3.x.x
```

### **Issue #3: Map shows but has no tiles**

**Fix:** Check your `tileServerUrl` or `styleUrl`:
```tsx
// Good (default)
<OSMView /> // Uses OSM tiles

// Good (custom)
<OSMView tileServerUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

// Bad (missing placeholder)
<OSMView tileServerUrl="https://example.com/tiles" /> // ❌ Missing {z}/{x}/{y}
```

### **Issue #4: Performance issues on web**

**Optimization tips:**
```tsx
// Limit zoom levels
<OSMView
  initialZoom={12}
  minZoom={8}   // Don't allow zooming out too far
  maxZoom={18}  // Don't allow zooming in too far
/>

// Reduce marker count on web
const markers = isMobile ? allMarkers : allMarkers.slice(0, 100);
<OSMView markers={markers} />
```

---

## 📝 **Complete Example: Cross-Platform App**

v2.0.0 removed the SDK `SearchBox`. Build search UI with standard React Native views so colors and typography are fully under your control (see [issue #2](https://github.com/mapdevsaikat/expo-osm-sdk/issues/2)). Below: minimal map + `TextInput` + [Nominatim](https://nominatim.org/release-docs/latest/api/Search/) `fetch`.

```tsx
{% raw %}
// App.tsx
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { OSMView, OSMViewRef } from 'expo-osm-sdk';

const SEARCH_THEME = {
  shellBg: '#FFFFFF',
  border: '#DDDDDD',
  text: '#333333',
};

async function searchNominatim(q: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'YourApp/1.0' } });
  return res.json() as Promise<{ lat: string; lon: string }[]>;
}

export default function App() {
  const mapRef = useRef<OSMViewRef>(null);
  const [query, setQuery] = useState('');

  const goToQuery = async () => {
    const hits = await searchNominatim(query);
    const hit = hits[0];
    if (!hit) return;
    mapRef.current?.animateToLocation(parseFloat(hit.lat), parseFloat(hit.lon), 15);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchRow, { backgroundColor: SEARCH_THEME.shellBg, borderColor: SEARCH_THEME.border }]}>
        <TextInput
          style={[styles.input, { color: SEARCH_THEME.text }]}
          placeholder="Search…"
          placeholderTextColor="#999999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={goToQuery}
        />
        <TouchableOpacity onPress={goToQuery}>
          <Text style={{ color: SEARCH_THEME.text }}>Go</Text>
        </TouchableOpacity>
      </View>

      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
        initialZoom={13}
        onMapReady={() => console.log('Map ready!')}
        onPress={(coord) => console.log('Pressed:', coord)}
        markers={[
          {
            id: 'marker1',
            coordinate: { latitude: 40.7128, longitude: -74.0060 },
            title: 'New York City'
          }
        ]}
      />

      {Platform.OS === 'web' && (
        <View style={styles.webNote}>
          <Text>Web: MapLibre GL JS</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    minHeight: 44,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 8 },
  map: { flex: 1 },
  webNote: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1,
  },
});
{% endraw %}
```

---

## 🎯 **Decision Guide: Do I Need Web Support?**

### **Install maplibre-gl IF:**
- ✅ Building for web + mobile
- ✅ Need web demos/landing pages
- ✅ Admin dashboards on web
- ✅ Progressive Web App (PWA)

### **Skip maplibre-gl IF:**
- ✅ Mobile-only app (iOS/Android)
- ✅ Don't need web at all
- ✅ Web can show fallback UI
- ✅ Want minimal bundle size

---

## 📚 **Additional Resources**

- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/)
- [Expo Web Documentation](https://docs.expo.dev/guides/web/)
- [OSM Tile Servers](https://wiki.openstreetmap.org/wiki/Tile_servers)

---

## 🆘 **Still Having Issues?**

### **Quick Checklist:**
- [ ] `maplibre-gl` installed? → `npm list maplibre-gl`
- [ ] Using Expo SDK 49+? → Check `expo --version`
- [ ] Web platform enabled? → Check `app.json`
- [ ] Correct tile URL format? → Should have `{z}/{x}/{y}`

### **Get Help:**
1. Check existing issues: [GitHub Issues](https://github.com/mapdevsaikat/expo-osm-sdk/issues)
2. Create new issue with:
   - Platform (web)
   - Node version: `node --version`
   - Package versions: `npm list expo-osm-sdk maplibre-gl`
   - Error screenshot/logs

---

## ✅ **Summary**

| Scenario | Setup | Web Works? |
|----------|-------|-----------|
| Mobile-only app | `npm install expo-osm-sdk` | ⚠️ Fallback UI |
| Cross-platform app | `npm install expo-osm-sdk maplibre-gl` | ✅ Full maps |
| Web-only app | `npm install expo-osm-sdk maplibre-gl` | ✅ Full maps |

**Bottom line:** For web maps, install `maplibre-gl`. For mobile-only, you don't need it!

---

**Version:** 1.0.95  
**Last Updated:** November 3, 2025

