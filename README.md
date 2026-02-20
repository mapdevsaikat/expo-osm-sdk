# expo-osm-sdk

[![npm version](https://img.shields.io/npm/v/expo-osm-sdk.svg)](https://www.npmjs.com/package/expo-osm-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)](https://expo.dev/)

**Native OpenStreetMap maps for Expo — iOS, Android, and Web.**

Powered by [MapLibre GL Native](https://maplibre.org/) on mobile and [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) on web. Zero configuration. No API keys required.

```bash
# iOS & Android
npm install expo-osm-sdk

# Web (also install peer dependency)
npm install expo-osm-sdk maplibre-gl
```

Add the plugin to your `app.json`:

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

> **Note:** Requires an Expo development build. Does not run in Expo Go.

### Plugin options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `locationWhenInUseDescription` | `string` | `"This app uses your location to show it on the map."` | iOS permission prompt text |
| `locationAlwaysDescription` | `string` | same as above | iOS background location prompt text |
| `enableBackgroundLocation` | `boolean` | `false` | Adds background location permissions (Android + iOS) |
| `enableFineLocation` | `boolean` | `true` | Android `ACCESS_FINE_LOCATION` (GPS precision) |
| `enableCoarseLocation` | `boolean` | `true` | Android `ACCESS_COARSE_LOCATION` (network precision) |
| `allowCleartextTraffic` | `boolean` | `false` | Android: allow HTTP tile servers (non-HTTPS) |

The plugin automatically sets up:
- **Android:** `INTERNET`, `ACCESS_NETWORK_STATE`, location permissions
- **iOS:** `NSLocationWhenInUseUsageDescription`, background modes if needed

---

## What this SDK provides

- **`OSMView`** — native map component (iOS, Android, Web)
- **Map overlays** — `Marker`, `Polyline`, `Polygon`, `Circle`, `CustomOverlay`
- **UI helpers** — `LocationButton`, `NavigationControls`
- **Location tracking** — `useLocationTracking` hook with retry and error handling
- **Geofencing** — `useGeofencing`, `useSingleGeofence` hooks + utility functions
- **Tile presets** — `TILE_CONFIGS` with OpenFreeMap and OpenStreetMap presets
- **Camera control** — `animateToLocation`, `animateCamera`, `fitRouteInView`, `setPitch`, `setBearing`

---

## Quick Start

### Basic map

```tsx
import { OSMView } from 'expo-osm-sdk';

<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 51.5074, longitude: -0.1278 }}
  initialZoom={12}
/>
```

### Map with markers

```tsx
import { OSMView } from 'expo-osm-sdk';
import { useRef } from 'react';
import type { OSMViewRef } from 'expo-osm-sdk';

const mapRef = useRef<OSMViewRef>(null);

const markers = [
  {
    id: 'hq',
    coordinate: { latitude: 51.5074, longitude: -0.1278 },
    title: 'London HQ',
    description: 'Our office'
  }
];

<OSMView
  ref={mapRef}
  style={{ flex: 1 }}
  initialCenter={{ latitude: 51.5074, longitude: -0.1278 }}
  initialZoom={12}
  markers={markers}
  onMarkerPress={(id) => console.log('tapped:', id)}
/>
```

### Draw a route line

Use `displayRoute` on the ref to draw a polyline between coordinates (e.g. after fetching directions from any routing API):

```tsx
await mapRef.current?.displayRoute(
  [
    { latitude: 51.5074, longitude: -0.1278 },
    { latitude: 51.515,  longitude: -0.0900 },
    { latitude: 51.530,  longitude: -0.0700 },
  ],
  { color: '#007AFF', width: 5 }
);
```

---

## Tile Presets (`TILE_CONFIGS`)

Switch the base map style by passing a `styleUrl` to `OSMView`. Use the built-in presets or supply your own URL.

```tsx
import { OSMView, TILE_CONFIGS } from 'expo-osm-sdk';

// OpenFreeMap — free, no API key, vector tiles
<OSMView styleUrl={TILE_CONFIGS.openfreemapLiberty.styleUrl}  ... />
<OSMView styleUrl={TILE_CONFIGS.openfreemapPositron.styleUrl} ... />
<OSMView styleUrl={TILE_CONFIGS.openfreemapBright.styleUrl}   ... />
```

| Preset | Style | Attribution required |
|--------|-------|----------------------|
| `openfreemapLiberty` | Colorful OSM-flavored vector map | © OpenStreetMap contributors © OpenMapTiles · OpenFreeMap |
| `openfreemapPositron` | Clean light vector map | © OpenStreetMap contributors © OpenMapTiles · OpenFreeMap |
| `openfreemapBright` | Vibrant high-contrast vector map | © OpenStreetMap contributors © OpenMapTiles · OpenFreeMap |

> [OpenFreeMap](https://openfreemap.org) is a free, open-source tile service. Consider [supporting them](https://openfreemap.org/#support) if you use it in production.

---

## Location Tracking

```tsx
import { useLocationTracking } from 'expo-osm-sdk';

const {
  isTracking,
  currentLocation,
  error,
  startTracking,
  stopTracking,
} = useLocationTracking(mapRef, {
  autoStart: false,
  onLocationChange: (coord) => console.log(coord),
  onError: (err) => console.error(err.userMessage),
});
```

---

## Geofencing

```tsx
import { useGeofencing, TILE_CONFIGS } from 'expo-osm-sdk';
import type { Geofence } from 'expo-osm-sdk';

const geofences: Geofence[] = [
  {
    id: 'office',
    name: 'Office Zone',
    type: 'circle',
    center: { latitude: 51.5074, longitude: -0.1278 },
    radius: 200, // metres
  }
];

const { activeGeofences, isInGeofence } = useGeofencing(geofences, {
  onEnter: (event) => console.log('entered:', event.geofenceName),
  onExit:  (event) => console.log('exited:',  event.geofenceName),
});
```

---

## Map Overlays

```tsx
import { OSMView, Marker, Polyline, Polygon, Circle } from 'expo-osm-sdk';

<OSMView style={{ flex: 1 }} initialCenter={...} initialZoom={12}>
  <Marker
    coordinate={{ latitude: 51.5074, longitude: -0.1278 }}
    title="London"
  />
  <Polyline
    coordinates={[
      { latitude: 51.5074, longitude: -0.1278 },
      { latitude: 51.530,  longitude: -0.070  },
    ]}
    strokeColor="#007AFF"
    strokeWidth={3}
  />
  <Circle
    center={{ latitude: 51.5074, longitude: -0.1278 }}
    radius={500}
    fillColor="rgba(0,122,255,0.15)"
    strokeColor="#007AFF"
  />
</OSMView>
```

---

## Platform Support

| Platform | Support | Notes |
|----------|---------|-------|
| iOS (dev build) | ✅ Full native | MapLibre GL Native |
| Android (dev build) | ✅ Full native | MapLibre GL Native |
| Web | ✅ MapLibre GL JS | Requires `maplibre-gl` peer dep |
| Expo Go | ⚠️ Graceful fallback, Placeholder UI — no map | Requires native modules |

---

## Compatibility

| SDK | React Native | Min iOS | Min Android API |
|-----|-------------|---------|-----------------|
| Expo SDK 54 | 0.81 | 15.1 | 21 |

---

## Repository Structure

```
expo-osm-sdk/
├── expo-osm-sdk/    ← npm package source
└── example/         ← development test app
```

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Test your changes
4. Open a Pull Request

---

## License

MIT — see [LICENSE](./expo-osm-sdk/LICENSE).

---

## Acknowledgments

- [MapLibre GL Native](https://maplibre.org/) — map rendering engine
- [OpenStreetMap](https://www.openstreetmap.org/) — map data
- [OpenFreeMap](https://openfreemap.org/) — free vector tile hosting
- [Expo](https://expo.dev/) — development platform

---

**Made with ❤️ by [Saikat Maiti](https://github.com/mapdevsaikat)**
