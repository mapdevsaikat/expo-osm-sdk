# 🔧 Troubleshooting Guide - Expo OSM SDK

This guide covers common issues, solutions, and best practices for the Expo OSM SDK.

## 📖 Table of Contents

1. [Expected Behaviors (Not Bugs)](#expected-behaviors-not-bugs)
2. [Installation Issues](#installation-issues)
3. [Build & Runtime Errors](#build--runtime-errors)
4. [Map Rendering Issues](#map-rendering-issues)
5. [Location & Permissions](#location--permissions)
6. [Performance Issues](#performance-issues)
7. [Platform-Specific Issues](#platform-specific-issues)
8. [Debug Information](#debug-information)

## ✅ Expected Behaviors (Not Bugs)

**Before troubleshooting, understand these are NORMAL behaviors:**

### 📱 **Expo Go Shows Fallback UI**
```
📍 OpenStreetMap View
    Development Build Required

This app requires a development build to display maps.
```

**✅ This is expected!**
- Expo Go cannot run native modules
- Solution: Create development build with `npx expo run:ios` or `npx expo run:android`

### 🌐 **Web Shows Fallback UI**
```
🗺️ OpenStreetMap View
     Web Platform

For web support, consider using:
• react-leaflet for OpenStreetMap
```

**✅ This is expected!**
- Native mobile SDKs don't run in browsers
- Solution: Use web-compatible map libraries for web platform

### 📦 **"Map not rendering" in Expo Go**
**✅ This is expected!** The SDK requires native code that Expo Go cannot execute.

## 🔧 Installation Issues

### Issue: "Package does not contain a valid config plugin"

```bash
Error: expo-osm-sdk: Package does not contain a valid config plugin
```

**Solutions:**
1. Check plugin configuration in `app.json`:
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

2. Ensure you're using the correct package version:
```bash
npm install expo-osm-sdk@latest
```

### Issue: "Cannot find module 'expo-osm-sdk'"

**Solutions:**
1. Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npx expo install --fix
```

2. Check import syntax:
```tsx
// ✅ Correct
import { OSMView, Marker } from 'expo-osm-sdk';

// ❌ Incorrect
import OSMView from 'expo-osm-sdk';
```

## 🏗️ Build & Runtime Errors

### Issue: "OSMView is not defined" or Component Undefined

**Root Cause:** Not using development build or incorrect import

**Solutions:**
1. **Use Development Build:**
```bash
# iOS
npx expo run:ios

# Android  
npx expo run:android
```

2. **Check Import Statement:**
```tsx
// ✅ Named import
import { OSMView } from 'expo-osm-sdk';

// ❌ Default import won't work
import OSMView from 'expo-osm-sdk';
```

3. **Verify Plugin Configuration:**
```json
{
  "expo": {
    "plugins": ["expo-osm-sdk/plugin"]
  }
}
```

### Issue: "Cannot use import statement outside a module"

**Solutions:**
1. Check package versions:
```bash
npm list expo
npm list react-native
```

2. Update to compatible versions:
```bash
npm install expo@latest
npx expo install --fix
```

### Issue: Build fails with "duplicate symbols" or "linking errors"

**Solutions:**
1. Clean build cache:
```bash
# iOS
npx expo run:ios --clear

# Android
npx expo run:android --clear
```

2. Reset Metro cache:
```bash
npx expo start --clear
```

3. Rebuild from scratch:
```bash
rm -rf node_modules package-lock.json ios android
npm install
npx expo run:ios
```

## 🗺️ Map Rendering Issues

### Issue: Map shows blank/white screen

**Diagnostic Steps:**
1. Check console for errors:
```tsx
<OSMView
  onMapReady={() => console.log('✅ Map ready!')}
  // Add error logging
/>
```

2. Verify you're using development build (not Expo Go)

3. Test with basic configuration:
```tsx
<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 0, longitude: 0 }}
  initialZoom={2}
  onMapReady={() => Alert.alert('Map loaded!')}
/>
```

**Solutions:**
1. **Network Issues:** Check internet connection for tile loading
2. **Style URL Issues:** Try default configuration first
3. **Coordinate Issues:** Verify coordinate format (decimal degrees)

### Issue: Tiles not loading

**Solutions:**
1. **Try different tile sources:**
```tsx
// Vector tiles (recommended)
<OSMView styleUrl="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" />

// Raster tiles (fallback)
<OSMView tileServerUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
```

2. **Check network connectivity**
3. **Verify tile URL format**

### Issue: Markers not appearing

**Diagnostic Steps:**
```tsx
const [markers, setMarkers] = useState([
  {
    id: 'test',
    coordinate: { latitude: 40.7128, longitude: -74.0060 },
    title: 'Test Marker',
    description: 'Should be visible'
  }
]);

// Log marker data
console.log('Markers:', markers);
```

**Solutions:**
1. **Coordinate Validation:**
```tsx
// ✅ Valid coordinates
{ latitude: 40.7128, longitude: -74.0060 }

// ❌ Invalid coordinates  
{ lat: 40.7128, lng: -74.0060 }
{ latitude: "40.7128", longitude: "-74.0060" }
```

2. **Unique IDs:** Ensure each marker has a unique `id`
3. **Visible Area:** Ensure markers are within map bounds

## 📍 Location & Permissions

### Issue: "Location permission denied" or location not working

**Solutions:**
1. **Add permissions to app.json:**
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

2. **Request permissions explicitly:**
```tsx
import * as Location from 'expo-location';

const requestLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Location permission is required');
    return;
  }
  
  // Now use location features
  await mapRef.current?.startLocationTracking();
};
```

3. **Check device settings:**
   - iOS: Settings → Privacy → Location Services
   - Android: Settings → Apps → [Your App] → Permissions

### Issue: getCurrentLocation() returns null

**Solutions:**
1. **Wait for GPS fix:**
```tsx
const getLocation = async () => {
  try {
    // Wait up to 30 seconds for GPS fix
    const location = await mapRef.current?.waitForLocation(30);
    console.log('Location:', location);
  } catch (error) {
    console.error('Location error:', error);
  }
};
```

2. **Check GPS settings:**
   - Ensure GPS is enabled
   - Try outdoors for better signal
   - Wait a few seconds for first fix

## ⚡ Performance Issues

### Issue: App crashes with many markers

**Solutions:**
1. **Enable clustering:**
```tsx
<OSMView
  markers={largeMarkerArray}
  clustering={{
    enabled: true,
    radius: 100,
    maxZoom: 15,
    minPoints: 2
  }}
/>
```

2. **Optimize rendering:**
```tsx
// ✅ Memoize marker processing
const processedMarkers = useMemo(() => {
  return rawData.map(item => ({
    id: item.id,
    coordinate: { latitude: item.lat, longitude: item.lng },
    title: item.name
  }));
}, [rawData]);

// ✅ Conditional rendering
{showMarkers && markers.map(marker => (
  <Marker key={marker.id} {...marker} />
))}
```

### Issue: Slow map performance

**Solutions:**
1. **Use vector tiles:**
```tsx
<OSMView
  styleUrl="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
  // 40-60% faster than raster tiles
/>
```

2. **Limit overlay complexity:**
```tsx
// ✅ Reasonable number of overlays
const MAX_OVERLAYS = 50;

// ✅ Use clustering for markers
// ✅ Conditionally render based on zoom level
```

3. **Optimize re-renders:**
```tsx
const MapComponent = React.memo(({ markers, ...props }) => {
  return <OSMView markers={markers} {...props} />;
});
```

## 📱 Platform-Specific Issues

### iOS Issues

#### Issue: "No bundle URL present" or Metro connection issues

**Solutions:**
1. Ensure Metro is running:
```bash
npx expo start
```

2. Reset iOS simulator:
```bash
npx expo run:ios --clear
```

3. Check network connectivity between simulator and Metro

#### Issue: Location permission not working on iOS

**Solutions:**
1. Check Info.plist entries:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app uses location for map features</string>
```

2. Request permission before use:
```tsx
await mapRef.current?.startLocationTracking();
```

### Android Issues

#### Issue: "INSTALL_FAILED_INSUFFICIENT_STORAGE"

**Solutions:**
1. Free up device storage
2. Use physical device instead of emulator
3. Increase emulator storage

#### Issue: Location not working on Android

**Solutions:**
1. Check AndroidManifest.xml:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

2. Enable location services in device settings

## 🐛 Debug Information

### Enable Debug Logging

Add debug logging to understand issues:

```tsx
<OSMView
  onMapReady={() => console.log('✅ Map ready')}
  onRegionChange={(region) => console.log('📍 Region:', region)}
  onPress={(coord) => console.log('👆 Tap:', coord)}
  onMarkerPress={(id, coord) => console.log('📌 Marker:', id, coord)}
  onUserLocationChange={(loc) => console.log('🎯 Location:', loc)}
/>
```

### Check Native Module Availability

```tsx
import { requireNativeModule } from 'expo-modules-core';

try {
  const NativeOSMModule = requireNativeModule('ExpoOsmSdk');
  console.log('✅ Native module available');
} catch (error) {
  console.log('❌ Native module not available:', error);
}
```

### Verify Environment

```tsx
import Constants from 'expo-constants';
import { Platform } from 'react-native';

console.log('Platform:', Platform.OS);
console.log('Execution environment:', Constants.executionEnvironment);
console.log('Is Expo Go:', Constants.executionEnvironment === 'expoGo');
```

## 📞 Getting Help

### 1. Check Debug Output
Enable verbose logging and check console output

### 2. Verify Expected Behavior
Review [Expected Behaviors](#expected-behaviors-not-bugs) section

### 3. Test with Minimal Example
Start with basic map configuration to isolate issues

### 4. Check Version Compatibility
```bash
npm list expo-osm-sdk
npm list expo
npm list react-native
```

### 5. Report Issues
If you've found a genuine bug:
1. Create minimal reproduction case
2. Include debug output
3. Specify platform and versions
4. Report at: [GitHub Issues](https://github.com/mapdevsaikat/expo-osm-sdk/issues)

## 📋 Checklist Before Reporting Issues

- [ ] Using development build (not Expo Go)
- [ ] Plugin configured in app.json
- [ ] Latest SDK version installed
- [ ] Tested basic configuration
- [ ] Checked console for errors
- [ ] Verified coordinate format
- [ ] Tested on physical device
- [ ] Reviewed this troubleshooting guide

---

**Remember:** Most "issues" are actually expected behaviors related to Expo Go limitations or missing development builds. Always start with creating a development build! 