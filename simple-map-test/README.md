# 🗺️ Simple Map Demo

A comprehensive demo application showcasing the full capabilities of **expo-osm-sdk** - an OpenStreetMap-based mapping SDK for React Native & Expo.

---

## ✨ **Features**

### **🗺️ Core Mapping**
- ✅ Vector & Raster tile support (MapLibre GL / OpenStreetMap)
- ✅ iOS, Android, **and Web** platform support
- ✅ Signature purple theme (#9C1AFF)
- ✅ User location display with custom colors
- ✅ Zoom controls and map interactions

### **🧭 Navigation**
- ✅ Multi-point route planning
- ✅ Turn-by-turn voice guidance (expo-speech)
- ✅ 4 transport modes (car, bike, walk, transit)
- ✅ Real-time ETA and distance updates
- ✅ Purple route line during navigation

### **🔍 Search & POI**
- ✅ Location search (Nominatim)
- ✅ Quick search for POIs
- ✅ City shortcuts
- ✅ Current location detection

### **🎨 UI/UX**
- ✅ Bottom sheet interface
- ✅ Tab-based navigation (Routing, Location, Cities, Settings)
- ✅ Professional navigation UI
- ✅ Responsive design

---

## 📁 **Project Structure**

```
simple-map-test/
├── src/
│   └── components/
│       └── SimpleNavigationUI.tsx    # Navigation UI component
├── docs/
│   ├── README.md                     # Documentation index
│   ├── NAVIGATION_DEMO.md            # Navigation guide
│   ├── VOICE_GUIDANCE_INTEGRATION.md # Voice guidance docs
│   ├── USER_LOCATION_FIX.md          # User location docs
│   └── TESTING_INSTRUCTIONS.md       # Testing guide
├── android/                          # Android native code
├── ios/                              # iOS native code
├── assets/                           # Images and resources
├── App.tsx                           # Main application component
├── index.js                          # Entry point
├── index.html                        # Web entry point
├── app.json                          # Expo configuration
├── package.json                      # Dependencies
├── eas.json                          # EAS Build configuration
└── README.md                         # This file
```

---

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Run on Platform**

#### **iOS** (requires Mac)
```bash  
npm run ios
```

#### **Android**
```bash
npm run android
```

#### **Web** 🌐 **NEW!**
```bash
npm run web
```

### **3. Build for Testing**
```bash
npm run build:android
```

---

## 🌐 **Web Support**

This demo now includes **full web support** with MapLibre-GL!

### **What Works on Web:**
- ✅ Map display (vector & raster tiles)
- ✅ Zoom controls
- ✅ Search functionality
- ✅ Route display
- ✅ Location services (browser geolocation)

### **Web-Specific Setup:**
- MapLibre-GL CSS is automatically loaded via `index.html`
- The SDK's web fallback component provides a seamless experience
- All features work across platforms (iOS, Android, Web)

---

## 📚 **Documentation**

All detailed documentation is in the [`docs/`](./docs/) folder:

- **[Navigation Guide](./docs/NAVIGATION_DEMO.md)** - Multi-point navigation system
- **[Voice Guidance](./docs/VOICE_GUIDANCE_INTEGRATION.md)** - Turn-by-turn voice navigation
- **[User Location](./docs/USER_LOCATION_FIX.md)** - Purple user location display
- **[Testing Instructions](./docs/TESTING_INSTRUCTIONS.md)** - Comprehensive testing guide

---

## 🎨 **Customization**

### **Colors**
The app uses a signature purple theme (`#9C1AFF`):
- User location dot
- Navigation route line
- Accent colors

To change, search for `#9C1AFF` in `App.tsx` and `SimpleNavigationUI.tsx`.

### **Tile Servers**
Toggle between Vector and Raster tiles in **Settings** tab:
- **Vector**: Carto Voyager (professional, smooth)
- **Raster**: OpenStreetMap (standard, reliable)

### **Transport Modes**
Configured in `App.tsx`:
```typescript
const TRANSPORT_MODES = [
  { id: 'car', name: 'Car', icon: '🚗', profile: 'driving', color: '#007AFF' },
  { id: 'bike', name: 'Bike', icon: '🚴', profile: 'cycling', color: '#34C759' },
  // ... add more modes
];
```

---

## 🧪 **Testing**

See [TESTING_INSTRUCTIONS.md](./docs/TESTING_INSTRUCTIONS.md) for:
- Feature testing checklists
- Platform-specific tests
- Performance testing
- Edge case scenarios

---

## 🔧 **Development**

### **Adding New Components**
Place in `src/components/`:
```typescript
// src/components/MyComponent.tsx
import React from 'react';
export const MyComponent = () => { /* ... */ };
```

### **Adding Documentation**
Place in `docs/`:
1. Create `docs/MY_FEATURE.md`
2. Update `docs/README.md` with link
3. Follow the standard documentation structure

---

## 📦 **Dependencies**

| Package | Purpose |
|---------|---------|
| `expo-osm-sdk` | Core mapping SDK |
| `expo-location` | GPS & location services |
| `expo-speech` | Voice guidance (TTS) |
| `maplibre-gl` | Web map rendering |
| `react-native` | Cross-platform framework |

---

## 🐛 **Troubleshooting**

### **"expo-doctor" Issues**
This is normal - native modules require EAS Build or dev client. See [TESTING_INSTRUCTIONS.md](./docs/TESTING_INSTRUCTIONS.md).

### **Map Not Loading on Web**
Ensure `maplibre-gl` is installed:
```bash
npm install maplibre-gl
```

### **Voice Not Working**
- Check device volume
- Ensure `expo-speech` permissions
- Test voice button toggle (🔊/🔇)

### **Location Not Showing**
- Grant location permissions
- Check GPS is enabled
- Use real device (not simulator for best results)

---

## 🌟 **Features Showcase**

This demo showcases:
- ✅ All `expo-osm-sdk` capabilities
- ✅ Production-ready UI patterns
- ✅ Performance optimizations
- ✅ Error handling
- ✅ Cross-platform compatibility
- ✅ Accessibility features

---

## 📄 **License**

This demo app is part of the `expo-osm-sdk` project.

---

## 🤝 **Contributing**

To contribute:
1. Add features to `src/components/`
2. Document in `docs/`
3. Update this README
4. Test on all platforms (iOS, Android, Web)

---

## 🎉 **What's Next?**

This demo can be extended with:
- [ ] Offline maps (SDK supports it!)
- [ ] Geofencing (SDK has it!)
- [ ] Custom markers (SDK has it!)
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Route history
- [ ] Favorites/bookmarks

Explore the [expo-osm-sdk documentation](../expo-osm-sdk/README.md) for more!

---

**Built with 💜 using expo-osm-sdk**
