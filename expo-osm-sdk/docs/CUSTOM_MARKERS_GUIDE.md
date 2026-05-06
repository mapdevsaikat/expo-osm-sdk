# 📍 Custom Markers & Overlays Guide

Complete guide to custom markers and shapes with **expo-osm-sdk 2.x** (native **iOS / Android**). See also [GitHub issue #3 — custom markers / `icon.uri`](https://github.com/mapdevsaikat/expo-osm-sdk/issues/3).

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Markers](#markers)
3. [Circles](#circles)
4. [Polylines](#polylines)
5. [Polygons](#polygons)
6. [Custom overlays note](#custom-overlays-customoverlay--overlays)
7. [Combining Features](#combining-features)
8. [Best Practices](#best-practices)
9. [Examples](#examples)

---

## Overview

**expo-osm-sdk** supports multiple overlay types for visualizing data on maps:

| Type | Use Case | Example |
|------|----------|---------|
| **Markers** | Points of interest | 📍 Stores, homes, pins |
| **Circles** | Radius-based areas | 🎯 Delivery zones, geofences |
| **Polylines** | Routes and paths | 🛣️ Navigation, trails |
| **Polygons** | Area boundaries | 🏞️ Parks, zones, regions |
| **`CustomOverlay` / `overlays`** | Reserved API — **not rendered on the map in current `OSMView`** | Use **`icon.uri`** or absolute-positioned views above the map |

---

## Markers

### FAQ — Custom markers ([GitHub #3](https://github.com/mapdevsaikat/expo-osm-sdk/issues/3)): `icon.uri` and React components

**`icon` is optional.** When you use it, the native map loads a **bitmap** (PNG/JPEG):

| Field | What to pass |
|--------|----------------|
| **`uri`** | String: **`https://…/pin.png`** (remote) or **`file://…`** (local file). |
| **`size`** | One number — icon is a **square** (`size` × `size` pixels). Not separate width/height. |
| **`name`** | Optional preset: `park`, `building`, `beach`, `star`, `pin`. If set, it **replaces** `uri`. |
| **`anchor`** | Optional `{ x: 0..1, y: 0..1 }`; e.g. `{ x: 0.5, y: 1 }` = tip at the coordinate. |

**Remote `uri`**

```tsx
import { OSMView } from 'expo-osm-sdk';

<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 48.8584, longitude: 2.2945 }}
  initialZoom={14}
  markers={[
    {
      id: 'tower',
      coordinate: { latitude: 48.8584, longitude: 2.2945 },
      title: 'Eiffel Tower',
      icon: {
        uri: 'https://example.com/eiffel-tower.png',
        size: 44,
        anchor: { x: 0.5, y: 1 },
      },
    },
  ]}
/>
```

**Bundled image (`require`) → `uri`**

Use `Image.resolveAssetSource` so you get a real URI string on the device:

```tsx
import { Image } from 'react-native';
import { OSMView } from 'expo-osm-sdk';

const pinUri = Image.resolveAssetSource(require('../assets/pin.png')).uri;

<OSMView
  markers={[
    {
      id: 'here',
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      icon: { uri: pinUri, size: 40 },
    },
  ]}
/>
```

**Using my own React component as the marker**

The map layer cannot host arbitrary JSX inside an annotation. Practical options:

1. **Rasterize** — Render your component (e.g. hidden), snapshot to PNG (`react-native-view-shot`), then pass the cached **`file://`** path as **`icon.uri`**.
2. **Overlay** — Draw a normal **`View`** above the map (`position: 'absolute'`) and move it when the camera moves by converting lat/lng ↔ screen (you implement sync on `onRegionChange` / ref methods; not built into `OSMView`).

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { OSMView } from 'expo-osm-sdk';

// Illustration only — `left`/`top` must follow map projection / region updates.
export function MapWithFloatingChip() {
  return (
    <View style={{ flex: 1 }}>
      <OSMView style={StyleSheet.absoluteFillObject} initialZoom={12} />
      <View style={{ position: 'absolute', left: 24, top: 120 }} pointerEvents="box-none">
        <Text>Custom JSX (sync position from map yourself)</Text>
      </View>
    </View>
  );
}
```

---

### Basic Marker

```tsx
import { OSMView } from 'expo-osm-sdk';

<OSMView
  markers={[
    {
      id: 'home',
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      title: 'Home',
      description: 'My house',
    },
  ]}
/>
```

### Marker with a remote image (`icon.uri`)

Native maps draw **bitmaps**, not React components. Put your artwork online or on disk, then pass a URI string.

```tsx
<OSMView
  markers={[
    {
      id: 'store',
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      title: 'Coffee Shop',
      icon: {
        uri: 'https://example.com/coffee-icon.png', // https:// or file://
        size: 40, // square width/height in px
        anchor: { x: 0.5, y: 1 }, // tip at coordinate (defaults ≈ bottom-center)
      },
    },
  ]}
/>
```

- **`uri`** — `https://…` PNG/JPEG works on **iOS and Android**. For bundled assets, resolve to a **`file://`** path (e.g. via `expo-asset` / `Image.resolveAssetSource` + file URI).
- **`size`** — Single number: icon is drawn as a **square** (`size` × `size`). There is no separate `width` / `height` in the public TypeScript API.

### Built-in icon presets (`icon.name`)

If **`name`** is set, it **overrides** **`uri`** (same rule as iOS).

Supported names (case-insensitive): **`park`**, **`building`**, **`beach`**, **`star`**, **`pin`**.

| Platform | Behavior |
|----------|-----------|
| **iOS** | SF Symbols (e.g. `tree.fill`, `mappin.circle.fill`) |
| **Android** | Colored **pin bitmap** per category (simple shape, not SF Symbols) |

```tsx
icon: { name: 'park', size: 36, color: '#228B22' }
```

### Interactive markers

`onMarkerPress` receives **`(markerId, coordinate)`**, not the whole marker object:

```tsx
<OSMView
  markers={markers}
  onMarkerPress={(markerId, coordinate) => {
    const m = markers.find((x) => x.id === markerId);
    Alert.alert(m?.title ?? 'Marker', m?.description ?? '');
  }}
/>
```

### Using your own React component as a “marker”

The SDK does **not** mount arbitrary JSX inside MapLibre annotations. Typical patterns:

1. **`icon.uri`** — Rasterize your UI (e.g. `react-native-view-shot`) and pass the image URI.
2. **Overlay** — Absolutely position a `View` on top of the map and sync lat/lng ↔ screen yourself (not built into `OSMView`).

### Types (authoritative)

See **`MarkerConfig`** and **`MarkerIcon`** in the package exports (`src/types`). Important fields include `id`, `coordinate`, optional `title` / `description`, optional `icon`, `draggable`, `opacity`, `rotation`, `zIndex`, etc.

```tsx
interface MarkerIcon {
  uri?: string; // https:// or file:// — ignored if `name` is set
  name?: string; // park | building | beach | star | pin
  size?: number;
  color?: string;
  anchor?: { x: number; y: number };
}
```

---

## Circles

### Basic Circle

```tsx
<OSMView
  circles={[
    {
      id: 'delivery-zone',
      center: { latitude: 37.7749, longitude: -122.4194 },
      radius: 500, // meters
      fillColor: 'rgba(0, 122, 255, 0.2)',
      strokeColor: '#007AFF',
      strokeWidth: 2,
    },
  ]}
/>
```

### Multiple Circles

```tsx
const zones = [
  {
    id: 'zone-1',
    center: { latitude: 37.7749, longitude: -122.4194 },
    radius: 500,
    fillColor: 'rgba(76, 175, 80, 0.3)',
    strokeColor: '#4CAF50',
    strokeWidth: 2,
  },
  {
    id: 'zone-2',
    center: { latitude: 37.7849, longitude: -122.4094 },
    radius: 800,
    fillColor: 'rgba(244, 67, 54, 0.3)',
    strokeColor: '#F44336',
    strokeWidth: 2,
  },
];

<OSMView circles={zones} />
```

### Circle Configuration

```tsx
interface CircleConfig {
  id: string;                    // Unique identifier
  center: Coordinate;            // Center point
  radius: number;                // Radius in meters
  fillColor?: string;            // Fill color (rgba/hex)
  strokeColor?: string;          // Border color
  strokeWidth?: number;          // Border width
  zIndex?: number;               // Draw order
}
```

### Use Cases

- ✅ Delivery zones
- ✅ Geofence visualization
- ✅ Search radius
- ✅ Coverage areas
- ✅ Accuracy indicators

---

## Polylines

### Basic Route

```tsx
<OSMView
  polylines={[
    {
      id: 'route',
      coordinates: [
        { latitude: 37.7749, longitude: -122.4194 },
        { latitude: 37.7779, longitude: -122.4164 },
        { latitude: 37.7809, longitude: -122.4134 },
      ],
      strokeColor: '#2196F3',
      strokeWidth: 4,
    },
  ]}
/>
```

### Styled Routes

```tsx
const routes = [
  {
    id: 'walking',
    coordinates: walkingPath,
    strokeColor: '#4CAF50',
    strokeWidth: 3,
    lineCap: 'round',
    lineJoin: 'round',
  },
  {
    id: 'driving',
    coordinates: drivingPath,
    strokeColor: '#2196F3',
    strokeWidth: 5,
    lineDashPattern: [5, 5], // Dashed line
  },
];

<OSMView polylines={routes} />
```

### Polyline Configuration

```tsx
interface PolylineConfig {
  id: string;                    // Unique identifier
  coordinates: Coordinate[];     // Path points
  strokeColor?: string;          // Line color
  strokeWidth?: number;          // Line width
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'bevel' | 'round' | 'miter';
  lineDashPattern?: number[];    // Dash pattern [dash, gap]
  zIndex?: number;               // Draw order
}
```

### Use Cases

- ✅ Navigation routes
- ✅ Hiking trails
- ✅ Boundaries
- ✅ Connections
- ✅ Flight paths

---

## Polygons

### Basic Area

```tsx
<OSMView
  polygons={[
    {
      id: 'park',
      coordinates: [
        { latitude: 37.7769, longitude: -122.4214 },
        { latitude: 37.7769, longitude: -122.4174 },
        { latitude: 37.7729, longitude: -122.4174 },
        { latitude: 37.7729, longitude: -122.4214 },
      ],
      fillColor: 'rgba(76, 175, 80, 0.3)',
      strokeColor: '#4CAF50',
      strokeWidth: 2,
    },
  ]}
/>
```

### Complex Shapes

```tsx
const neighborhood = {
  id: 'downtown',
  coordinates: [
    { latitude: 37.7900, longitude: -122.4100 },
    { latitude: 37.7950, longitude: -122.4000 },
    { latitude: 37.7900, longitude: -122.3900 },
    { latitude: 37.7800, longitude: -122.3950 },
    { latitude: 37.7750, longitude: -122.4050 },
    // Closes automatically
  ],
  fillColor: 'rgba(33, 150, 243, 0.2)',
  strokeColor: '#2196F3',
  strokeWidth: 3,
};

<OSMView polygons={[neighborhood]} />
```

### Polygon Configuration

```tsx
interface PolygonConfig {
  id: string;                    // Unique identifier
  coordinates: Coordinate[];     // Polygon vertices (min 3)
  fillColor?: string;            // Fill color
  strokeColor?: string;          // Border color
  strokeWidth?: number;          // Border width
  holes?: Coordinate[][];        // Holes (optional)
  zIndex?: number;               // Draw order
}
```

### Use Cases

- ✅ Parks and zones
- ✅ Property boundaries
- ✅ Service areas
- ✅ Geographic regions
- ✅ Heat maps

---

## Custom overlays (`CustomOverlay` / `overlays`)

The TypeScript API includes **`OverlayConfig`** and a **`CustomOverlay`** helper component for forward compatibility, but **`OSMView` does not currently forward `overlays` to native or render `children` on the map**. Treat them as placeholders unless you extend the native bridge yourself.

**Recommended approaches today:**

- Custom visuals → **`markers[].icon.uri`** (image) or **`icon.name`** presets above.
- Fully custom JSX → **`View`** with **`position: 'absolute'`** layered above `<OSMView />`, positioned using your own coordinate → layout math (or a small helper library).

---

## Combining Features

### Complete Example

```tsx
import { OSMView } from 'expo-osm-sdk';

function DeliveryMap() {
  const markers = [
    {
      id: 'restaurant',
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      title: 'Restaurant',
      icon: {
        uri: 'https://example.com/restaurant.png',
        width: 40,
        height: 40,
      },
    },
    {
      id: 'customer',
      coordinate: { latitude: 37.7819, longitude: -122.4124 },
      title: 'Customer',
      icon: {
        uri: 'https://example.com/home.png',
        width: 40,
        height: 40,
      },
    },
  ];

  const deliveryZone = {
    id: 'zone',
    center: { latitude: 37.7749, longitude: -122.4194 },
    radius: 1000,
    fillColor: 'rgba(76, 175, 80, 0.1)',
    strokeColor: '#4CAF50',
    strokeWidth: 2,
  };

  const route = {
    id: 'delivery-route',
    coordinates: [
      { latitude: 37.7749, longitude: -122.4194 },
      { latitude: 37.7779, longitude: -122.4164 },
      { latitude: 37.7809, longitude: -122.4134 },
      { latitude: 37.7819, longitude: -122.4124 },
    ],
    strokeColor: '#2196F3',
    strokeWidth: 4,
  };

  return (
    <OSMView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 37.7784,
        longitude: -122.4159,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
      markers={markers}
      circles={[deliveryZone]}
      polylines={[route]}
      onMarkerPress={(marker) => {
        console.log('Marker pressed:', marker.title);
      }}
    />
  );
}
```

---

## Best Practices

### Performance

1. **Limit Overlays**
   ```tsx
   // ❌ BAD: Too many markers
   markers={hugeArray} // 1000+ markers
   
   // ✅ GOOD: Cluster or limit visible
   markers={visibleMarkers.slice(0, 100)}
   ```

2. **Optimize Icons**
   ```tsx
   // ❌ BAD: Large image
   icon={{ uri: 'https://huge-image.jpg', width: 40, height: 40 }}
   
   // ✅ GOOD: Optimized icon
   icon={{ uri: 'https://optimized-icon.png', width: 40, height: 40 }}
   ```

3. **Use zIndex**
   ```tsx
   // Ensure proper layering
   circles={[{ ...circle, zIndex: 1 }]}
   polylines={[{ ...route, zIndex: 2 }]}
   markers={[{ ...marker, zIndex: 3 }]}
   ```

### Styling

1. **Consistent Colors**
   ```tsx
   const COLORS = {
     primary: '#2196F3',
     success: '#4CAF50',
     danger: '#F44336',
   };
   ```

2. **Appropriate Sizes**
   ```tsx
   // Marker icons: 30-50px
   // Stroke widths: 2-5px
   // Circles: 50-2000m radius
   ```

3. **Transparency**
   ```tsx
   // Use alpha for overlapping areas
   fillColor: 'rgba(33, 150, 243, 0.3)' // 30% opacity
   ```

### Accessibility

1. **Descriptive Titles**
   ```tsx
   title: 'Coffee Shop - Downtown' // Clear and specific
   ```

2. **Meaningful IDs**
   ```tsx
   id: 'store-123' // Instead of 'marker-1'
   ```

---

## Examples

### Example 1: Store Locator

```tsx
const stores = [
  {
    id: 'store-1',
    coordinate: { latitude: 37.7749, longitude: -122.4194 },
    title: 'Downtown Store',
    icon: { uri: 'https://example.com/store.png', width: 40, height: 40 },
  },
  // ... more stores
];

<OSMView
  markers={stores}
  onMarkerPress={(marker) => {
    navigation.navigate('StoreDetail', { storeId: marker.id });
  }}
/>
```

### Example 2: Service Area

```tsx
const serviceArea = {
  id: 'coverage',
  coordinates: [
    { latitude: 37.7900, longitude: -122.4200 },
    { latitude: 37.7900, longitude: -122.4000 },
    { latitude: 37.7700, longitude: -122.4000 },
    { latitude: 37.7700, longitude: -122.4200 },
  ],
  fillColor: 'rgba(76, 175, 80, 0.2)',
  strokeColor: '#4CAF50',
  strokeWidth: 2,
};

<OSMView polygons={[serviceArea]} />
```

### Example 3: Navigation

```tsx
const navigationRoute = {
  id: 'nav',
  coordinates: routeCoordinates,
  strokeColor: '#2196F3',
  strokeWidth: 5,
  lineCap: 'round',
};

<OSMView
  polylines={[navigationRoute]}
  markers={[
    { id: 'start', coordinate: start, title: 'Start' },
    { id: 'end', coordinate: end, title: 'Destination' },
  ]}
/>
```

---

## Summary

### Quick Reference

```tsx
// Markers
<OSMView markers={[{ id, coordinate, title, icon }]} />

// Circles
<OSMView circles={[{ id, center, radius, fillColor }]} />

// Polylines
<OSMView polylines={[{ id, coordinates, strokeColor }]} />

// Polygons
<OSMView polygons={[{ id, coordinates, fillColor }]} />

// Custom
<OSMView>
  <CustomOverlay coordinate={coord}>
    <YourComponent />
  </CustomOverlay>
</OSMView>
```

---

## Need Help?

- 📖 [Main README](../README.md)
- 📝 [Examples](../example/CustomMarkersExample.tsx)
- 🐛 [Report Issues](https://github.com/yourusername/expo-osm-sdk/issues)

---

**Made with ❤️ by the expo-osm-sdk team**

