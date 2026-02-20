# expo-osm-sdk

[![npm version](https://img.shields.io/npm/v/expo-osm-sdk.svg)](https://www.npmjs.com/package/expo-osm-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)](https://expo.dev/)

**Native OpenStreetMap SDK for Expo** — display maps, markers, shapes, and track location on iOS and Android.

> **v2.0.0** — Focused core SDK. Routing (OSRM) and search (Nominatim) features have been removed. See the [migration guide](#v200-migration-guide) if you were using them.

---

## Features

- 🗺️ **Native map** powered by MapLibre GL Native (iOS & Android)
- 📍 **Markers** with custom icons, drag support, and info windows
- 📐 **Shapes** — polylines, polygons, circles, custom overlays
- 📷 **Camera controls** — zoom, pan, pitch, bearing, `animateToLocation`, `fitToMarkers`
- 📌 **User location** — display with signature purple dot, follow mode, and color customization
- 🛰️ **Location tracking** hook (`useLocationTracking`)
- 🏠 **Geofencing** hooks (`useGeofencing`, `useSingleGeofence`) with enter/exit/dwell events
- 🧭 **Navigation controls** UI component (zoom, compass, pitch toggle)
- 🌐 **Web** — safe fallback when MapLibre GL JS is not installed
- 📦 **TypeScript** — full type definitions included

---

## Requirements

| Requirement | Version |
|---|---|
| Expo SDK | ≥ 49 |
| React Native | ≥ 0.72 |
| React | ≥ 18 |
| iOS | ≥ 11 |
| Android API | ≥ 21 |
| Node.js | ≥ 16 |

---

## Installation

```bash
npm install expo-osm-sdk
```

### Expo Config Plugin

Add to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-osm-sdk/plugin",
        {
          "locationWhenInUseDescription": "Used to show your position on the map."
        }
      ]
    ]
  }
}
```

Then run:

```bash
npx expo prebuild
```

> **Note:** This SDK requires a [development build](https://docs.expo.dev/develop/development-builds/introduction/). It does **not** work in Expo Go.

#### Plugin options

All options are optional.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `locationWhenInUseDescription` | `string` | `"This app uses your location to show it on the map."` | iOS: text shown in the system location permission prompt |
| `locationAlwaysDescription` | `string` | same as above | iOS: text shown when requesting background location access |
| `enableBackgroundLocation` | `boolean` | `false` | Adds background location permissions. Only set `true` if your app tracks location while backgrounded |
| `enableFineLocation` | `boolean` | `true` | Android `ACCESS_FINE_LOCATION` (GPS precision) |
| `enableCoarseLocation` | `boolean` | `true` | Android `ACCESS_COARSE_LOCATION` (network precision) |
| `allowCleartextTraffic` | `boolean` | `false` | Android: allow HTTP tile servers. Only needed for self-hosted servers without HTTPS |

The plugin automatically configures:

**Android** — `INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`

**iOS** — `NSLocationWhenInUseUsageDescription` in Info.plist; adds `UIBackgroundModes: [location]` if `enableBackgroundLocation: true`

---

## Quick Start

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
        initialZoom={12}
        onMapReady={() => console.log('Map is ready')}
        onPress={(coordinate) => console.log('Tapped:', coordinate)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
```

---

## API Reference

### `OSMView`

The main map component.

```tsx
import { OSMView, OSMViewRef } from 'expo-osm-sdk';
import { useRef } from 'react';

const mapRef = useRef<OSMViewRef>(null);

<OSMView
  ref={mapRef}
  style={{ flex: 1 }}

  // Initial camera
  initialCenter={{ latitude: 51.505, longitude: -0.09 }}
  initialZoom={13}
  initialPitch={0}       // tilt in degrees (0–60)
  initialBearing={0}     // rotation in degrees (0–360)

  // Tile source — defaults to Carto Voyager vector tiles
  styleUrl="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
  // or raster:
  tileServerUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png"

  // Overlays
  markers={[...]}
  polylines={[...]}
  polygons={[...]}
  circles={[...]}

  // Clustering
  clustering={{ enabled: true, radius: 50 }}

  // User location
  showUserLocation={true}
  followUserLocation={false}
  userLocationTintColor="#9C1AFF"

  // Controls
  showsCompass={true}
  showsZoomControls={true}
  rotateEnabled={true}
  scrollEnabled={true}
  zoomEnabled={true}
  pitchEnabled={true}

  // Events
  onMapReady={() => {}}
  onRegionChange={(region) => {}}
  onPress={(coordinate) => {}}
  onLongPress={(coordinate) => {}}
  onMarkerPress={(markerId, coordinate) => {}}
  onUserLocationChange={(coordinate) => {}}
/>
```

#### `OSMViewRef` Methods

| Method | Description |
|---|---|
| `zoomIn()` | Zoom in one level |
| `zoomOut()` | Zoom out one level |
| `setZoom(zoom)` | Set zoom level (1–20) |
| `animateToLocation(lat, lng, zoom?)` | Fly to coordinates |
| `animateToRegion(region, duration?)` | Fit to a region |
| `fitToMarkers(markerIds?, padding?)` | Fit all/selected markers in view |
| `animateCamera(options)` | Animate pitch, bearing, zoom together |
| `setPitch(degrees)` | Set camera tilt |
| `setBearing(degrees)` | Set camera rotation |
| `getPitch()` | Get current pitch |
| `getBearing()` | Get current bearing |
| `getCurrentLocation()` | Get user's GPS coordinate |
| `startLocationTracking()` | Start GPS updates |
| `stopLocationTracking()` | Stop GPS updates |
| `waitForLocation(timeoutSeconds)` | Wait for fresh GPS fix |
| `addMarker(marker)` | Add marker at runtime |
| `removeMarker(markerId)` | Remove marker |
| `updateMarker(markerId, updates)` | Update marker properties |
| `addPolyline(polyline)` | Add polyline |
| `removePolyline(polylineId)` | Remove polyline |
| `addPolygon(polygon)` | Add polygon |
| `removePolygon(polygonId)` | Remove polygon |
| `addCircle(circle)` | Add circle |
| `removeCircle(circleId)` | Remove circle |
| `takeSnapshot(format?, quality?)` | Capture map as image |

---

### Markers

```tsx
import { OSMView } from 'expo-osm-sdk';
import type { MarkerConfig } from 'expo-osm-sdk';

const markers: MarkerConfig[] = [
  {
    id: 'marker-1',
    coordinate: { latitude: 40.7128, longitude: -74.0060 },
    title: 'New York',
    description: 'The Big Apple',
    icon: {
      uri: 'https://example.com/pin.png',
      size: 40,
      anchor: { x: 0.5, y: 1.0 },  // bottom-center
    },
    draggable: true,
    opacity: 1,
  },
];

<OSMView
  markers={markers}
  onMarkerPress={(id, coord) => console.log('Marker pressed:', id)}
  onMarkerDragEnd={(id, coord) => console.log('Dragged to:', coord)}
/>
```

---

### Shapes

```tsx
import type { PolylineConfig, PolygonConfig, CircleConfig } from 'expo-osm-sdk';

const polylines: PolylineConfig[] = [{
  id: 'route',
  coordinates: [
    { latitude: 40.7128, longitude: -74.0060 },
    { latitude: 40.7580, longitude: -73.9855 },
  ],
  strokeColor: '#007AFF',
  strokeWidth: 4,
  strokeOpacity: 0.9,
}];

const polygons: PolygonConfig[] = [{
  id: 'area',
  coordinates: [
    { latitude: 40.70, longitude: -74.02 },
    { latitude: 40.73, longitude: -74.02 },
    { latitude: 40.73, longitude: -73.98 },
    { latitude: 40.70, longitude: -73.98 },
  ],
  fillColor: '#FF0000',
  fillOpacity: 0.2,
  strokeColor: '#FF0000',
  strokeWidth: 2,
}];

const circles: CircleConfig[] = [{
  id: 'zone',
  center: { latitude: 40.7128, longitude: -74.0060 },
  radius: 500,  // meters
  fillColor: '#0000FF',
  fillOpacity: 0.15,
  strokeColor: '#0000FF',
  strokeWidth: 2,
}];

<OSMView
  polylines={polylines}
  polygons={polygons}
  circles={circles}
/>
```

---

### User Location

```tsx
<OSMView
  showUserLocation={true}
  followUserLocation={true}
  userLocationTintColor="#9C1AFF"
  userLocationAccuracyFillColor="rgba(156, 26, 255, 0.2)"
  userLocationAccuracyBorderColor="#9C1AFF"
  onUserLocationChange={(coord) => {
    console.log('User is at:', coord.latitude, coord.longitude);
  }}
/>
```

---

### Camera Controls

```tsx
import { useRef } from 'react';
import { OSMView, OSMViewRef } from 'expo-osm-sdk';

const mapRef = useRef<OSMViewRef>(null);

// Fly to a location
await mapRef.current?.animateToLocation(48.8566, 2.3522, 14);

// 3D navigation view
await mapRef.current?.animateCamera({
  latitude: 48.8566,
  longitude: 2.3522,
  zoom: 16,
  pitch: 45,
  bearing: 90,
  duration: 1000,
});

// Fit all markers in view
await mapRef.current?.fitToMarkers(undefined, 80);
```

---

### `NavigationControls` Component

A ready-made controls overlay for zoom, compass, and pitch:

```tsx
import { NavigationControls } from 'expo-osm-sdk';

<NavigationControls
  onZoomIn={() => mapRef.current?.zoomIn()}
  onZoomOut={() => mapRef.current?.zoomOut()}
  onResetBearing={() => mapRef.current?.setBearing(0)}
  onResetPitch={() => mapRef.current?.setPitch(0)}
  getBearing={() => mapRef.current?.getBearing() ?? Promise.resolve(0)}
  getPitch={() => mapRef.current?.getPitch() ?? Promise.resolve(0)}
  style={{ position: 'absolute', right: 16, bottom: 120 }}
/>
```

---

### `LocationButton` Component

A button that flies the camera to the user's current location:

```tsx
import { LocationButton } from 'expo-osm-sdk';

<LocationButton
  getCurrentLocation={() => mapRef.current!.getCurrentLocation()}
  onLocationFound={(loc) => {
    mapRef.current?.animateToLocation(loc.latitude, loc.longitude, 15);
  }}
  style={{ position: 'absolute', right: 16, bottom: 60 }}
/>
```

---

### `useLocationTracking` Hook

```tsx
import { useLocationTracking } from 'expo-osm-sdk';
import { useRef } from 'react';

const mapRef = useRef<OSMViewRef>(null);
const { currentLocation, isTracking, error } = useLocationTracking(mapRef, {
  autoStart: true,
});
```

---

### `useGeofencing` Hook

Monitor enter, exit, and dwell events for circle and polygon geofences:

```tsx
import { useGeofencing } from 'expo-osm-sdk';
import type { Geofence } from 'expo-osm-sdk';

const geofences: Geofence[] = [
  {
    id: 'office',
    name: 'Office',
    type: 'circle',
    center: { latitude: 51.505, longitude: -0.09 },
    radius: 200,  // meters
  },
  {
    id: 'park',
    name: 'Hyde Park',
    type: 'polygon',
    coordinates: [
      { latitude: 51.508, longitude: -0.165 },
      { latitude: 51.513, longitude: -0.165 },
      { latitude: 51.513, longitude: -0.155 },
      { latitude: 51.508, longitude: -0.155 },
    ],
  },
];

const { activeGeofences, isInGeofence, getDwellTime } = useGeofencing(
  mapRef,
  geofences,
  {
    onEnter: (event) => console.log('Entered:', event.geofenceName),
    onExit: (event) => console.log('Exited:', event.geofenceName),
    onDwell: (event) => console.log('Dwelling in:', event.geofenceName),
    checkInterval: 5000,     // ms
    dwellThreshold: 60000,   // ms before dwell event fires
  }
);

console.log('Currently inside:', activeGeofences);
console.log('In office?', isInGeofence('office'));
console.log('Office dwell time (ms):', getDwellTime('office'));
```

For a single geofence, use `useSingleGeofence`:

```tsx
import { useSingleGeofence } from 'expo-osm-sdk';

const { isInside, dwellTime } = useSingleGeofence(mapRef, geofences[0], {
  onEnter: (e) => alert('You arrived!'),
});
```

---

### Tile Configuration

All built-in presets are available via `TILE_CONFIGS`. Each entry has a `styleUrl` (vector) or `tileUrl` (raster), plus an `attribution` string you must display in your app per each provider's terms.

| Key | Provider | Type | Production? | API key |
|---|---|---|---|---|
| `openMapTiles` | Carto Voyager | Vector | ✅ Recommended | None |
| `openfreemapLiberty` | [OpenFreeMap](https://openfreemap.org) | Vector | ✅ Recommended | None |
| `openfreemapPositron` | [OpenFreeMap](https://openfreemap.org) | Vector | ✅ Recommended | None |
| `openfreemapBright` | [OpenFreeMap](https://openfreemap.org) | Vector | ✅ Recommended | None |
| `openTopoMap` | OpenTopoMap | Raster | ⚠️ Low-traffic only | None |
| `humanitarian` | HOT OSM | Raster | ⚠️ Low-traffic only | None |
| `openStreetMap` | OpenStreetMap | Raster | ❌ Dev/demo only | None |

> **`openStreetMap` raster tiles must not be used in production.** The OSM tile servers are a shared community resource. Their [usage policy](https://operations.osmfoundation.org/policies/tiles/) explicitly prohibits commercial or high-traffic use. Violating it risks your IP being blocked. Use any of the vector presets above instead — they look better, load faster, and have no such restrictions.

> **OpenFreeMap** is fully open-source. If you use `openfreemap*` presets in production, consider [sponsoring the project](https://github.com/sponsors/hyperknot) or [self-hosting](https://github.com/hyperknot/openfreemap) for SLA needs.

#### Basic usage

```tsx
import { OSMView, TILE_CONFIGS } from 'expo-osm-sdk';

// Vector (recommended for all production apps)
<OSMView styleUrl={TILE_CONFIGS.openMapTiles.styleUrl} />
<OSMView styleUrl={TILE_CONFIGS.openfreemapLiberty.styleUrl} />
<OSMView styleUrl={TILE_CONFIGS.openfreemapPositron.styleUrl} />
<OSMView styleUrl={TILE_CONFIGS.openfreemapBright.styleUrl} />

// Raster (dev/demo/specialist use only)
<OSMView tileServerUrl={TILE_CONFIGS.openTopoMap.tileUrl} />
<OSMView tileServerUrl={TILE_CONFIGS.humanitarian.tileUrl} />
```

#### Layer switcher pattern

Let the user switch basemap style at runtime — `styleUrl` is a reactive prop:

```tsx
import { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { OSMView, TILE_CONFIGS } from 'expo-osm-sdk';

type LayerKey = 'openMapTiles' | 'openfreemapLiberty' | 'openfreemapPositron' | 'openfreemapBright';

const LAYERS: Record<LayerKey, string> = {
  openMapTiles:        'Voyager',
  openfreemapLiberty:  'Liberty',
  openfreemapPositron: 'Positron',
  openfreemapBright:   'Bright',
};

export default function MapWithLayerSwitcher() {
  const [active, setActive] = useState<LayerKey>('openfreemapLiberty');
  const config = TILE_CONFIGS[active];

  return (
    <View style={{ flex: 1 }}>
      <OSMView
        style={{ flex: 1 }}
        styleUrl={config.styleUrl}
        initialCenter={{ latitude: 20.5937, longitude: 78.9629 }}
        initialZoom={5}
      />

      {/* Layer switcher */}
      <View style={styles.switcher}>
        {(Object.keys(LAYERS) as LayerKey[]).map((key) => (
          <Pressable
            key={key}
            onPress={() => setActive(key)}
            style={[styles.chip, active === key && styles.chipActive]}
          >
            <Text style={[styles.chipText, active === key && styles.chipTextActive]}>
              {LAYERS[key]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Attribution — required by each provider's terms */}
      <Text style={styles.attribution}>{config.attribution}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  switcher:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 10 },
  chip:           { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e2e8f0' },
  chipActive:     { backgroundColor: '#0ea5e9' },
  chipText:       { fontSize: 13, color: '#1e293b' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  attribution:    { fontSize: 10, color: '#64748b', textAlign: 'right', paddingHorizontal: 8, paddingBottom: 4 },
});
```

---

### Geofencing Utilities

Low-level utilities for custom geofence logic:

```tsx
import {
  calculateDistance,    // meters between two coordinates
  isPointInCircle,
  isPointInPolygon,
  isPointInGeofence,
  distanceToGeofence,
  validateGeofence,
  getGeofenceCenter,
  doGeofencesOverlap,
} from 'expo-osm-sdk';

const dist = calculateDistance(
  { latitude: 51.505, longitude: -0.09 },
  { latitude: 48.857, longitude: 2.352 }
);
console.log(dist, 'meters');
```

---

## Web Support

On web, `OSMView` renders a fallback UI by default. For a real interactive map on web, install `maplibre-gl`:

```bash
npm install maplibre-gl
```

Then configure your bundler to handle MapLibre's CSS (see `docs/WEB_SETUP_GUIDE.md`).

---

## Platform Behavior

| Environment | Behavior |
|---|---|
| iOS development build | ✅ Full native map |
| Android development build | ✅ Full native map |
| Expo Go | ⚠️ Fallback UI — native modules not available |
| Web (without maplibre-gl) | ⚠️ Fallback UI |
| Web (with maplibre-gl) | ✅ Interactive map via MapLibre GL JS |

---

## Expo SDK Compatibility

| expo-osm-sdk | Expo SDK | React Native |
|---|---|---|
| 2.x | 49–53+ | 0.72–0.77+ |
| 1.x | 49–53 | 0.72–0.76 |

---

## v2.0.0 Migration Guide

v2.0.0 removes the built-in routing and search features. These were out of scope for a map display SDK — they depend on external services (OSRM, Nominatim) and belong in separate, purpose-built packages.

### Removed exports

| Removed | Reason |
|---|---|
| `useOSRMRouting` | Routing belongs in a routing library |
| `calculateRoute`, `calculateSimpleRoute`, `getRouteEstimate` | Routing |
| `formatDuration`, `formatRouteDistance`, `calculateStraightLineDistance` | Routing utilities |
| `useNominatimSearch` | Geocoding belongs in a geocoding library |
| `searchLocations`, `reverseGeocode`, `getSuggestions` | Geocoding |
| `calculateDistanceKm`, `formatDistance` (nominatim) | Geocoding utilities |
| `quickSearch`, `searchNearby`, `getAddressFromCoordinates`, `searchPOI`, `smartSearch` | Search helpers |
| `SearchBox` | App-specific UI component |
| `Route`, `RouteStep`, `NominatimSearchResult`, `NominatimAddress`, etc. | Types for removed features |

### What to use instead

**For routing:**

Draw a route by passing coordinates to `polylines` directly, or use any routing API (OSRM, Valhalla, GraphHopper, Google Directions, etc.) and pass the resulting coordinates:

```tsx
// Get coordinates from any routing API, then display them:
<OSMView
  polylines={[{
    id: 'route',
    coordinates: routeCoordinates,  // from your routing provider
    strokeColor: '#007AFF',
    strokeWidth: 4,
  }]}
/>
```

**For geocoding/search:**

Use any geocoding library. For Nominatim specifically, the API is simple enough to call directly:

```ts
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`,
  { headers: { 'User-Agent': 'YourApp/1.0' } }
);
const results = await response.json();
```

---

## License

MIT © [Saikat Maiti](https://github.com/mapdevsaikat)
