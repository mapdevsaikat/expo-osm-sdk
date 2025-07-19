# 📘 Expo OSM SDK - Complete API Reference

This document provides comprehensive API documentation for all components, interfaces, and methods in the Expo OSM SDK.

## 📖 Table of Contents

1. [OSMView Component](#osmview-component)
2. [JSX Children Components](#jsx-children-components)
3. [Reference Methods](#reference-methods)
4. [TypeScript Interfaces](#typescript-interfaces)
5. [Utility Functions](#utility-functions)
6. [Search & Geocoding](#search--geocoding)
7. [Event Handlers](#event-handlers)

## 🗺️ OSMView Component

The main map component that renders OpenStreetMap with native performance.

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `style` | `ViewStyle` | `{}` | ❌ | Style object for the map container |
| `initialCenter` | `Coordinate` | `{latitude: 0, longitude: 0}` | ❌ | Initial map center position |
| `initialZoom` | `number` | `10` | ❌ | Initial zoom level (1-18) |
| `styleUrl` | `string` | OpenMapTiles vector style | ❌ | MapLibre GL style URL for vector tiles |
| `tileServerUrl` | `string` | `undefined` | ❌ | Raster tile server URL (overrides styleUrl) |
| `showUserLocation` | `boolean` | `false` | ❌ | Display user's current location |
| `followUserLocation` | `boolean` | `false` | ❌ | Auto-follow user location changes |
| `markers` | `MarkerConfig[]` | `[]` | ❌ | Array of marker configurations |
| `polylines` | `PolylineConfig[]` | `[]` | ❌ | Array of polyline configurations *(v1.1.0+)* |
| `polygons` | `PolygonConfig[]` | `[]` | ❌ | Array of polygon configurations *(v1.1.0+)* |
| `circles` | `CircleConfig[]` | `[]` | ❌ | Array of circle configurations *(v1.1.0+)* |
| `overlays` | `OverlayConfig[]` | `[]` | ❌ | Array of custom overlay configurations *(v1.1.0+)* |
| `clustering` | `ClusterConfig` | `undefined` | ❌ | Marker clustering configuration *(v1.1.0+)* |
| `children` | `ReactNode` | `undefined` | ❌ | JSX children (Marker, Polyline, etc.) *(v1.1.0+)* |

### Event Handlers

| Event | Signature | Description |
|-------|-----------|-------------|
| `onMapReady` | `() => void` | Called when map finishes loading |
| `onRegionChange` | `(region: MapRegion) => void` | Called when map region changes |
| `onPress` | `(coordinate: Coordinate) => void` | Called when map is tapped |
| `onLongPress` | `(coordinate: Coordinate) => void` | Called when map is long pressed *(v1.1.0+)* |
| `onMarkerPress` | `(markerId: string, coordinate: Coordinate) => void` | Called when marker is tapped |
| `onPolylinePress` | `(polylineId: string, coordinate: Coordinate) => void` | Called when polyline is tapped *(v1.1.0+)* |
| `onPolygonPress` | `(polygonId: string, coordinate: Coordinate) => void` | Called when polygon is tapped *(v1.1.0+)* |
| `onCirclePress` | `(circleId: string, coordinate: Coordinate) => void` | Called when circle is tapped *(v1.1.0+)* |
| `onUserLocationChange` | `(coordinate: Coordinate) => void` | Called when user location updates |

### Example Usage

```tsx
<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
  initialZoom={12}
  styleUrl="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
  showUserLocation={true}
  clustering={{ enabled: true, radius: 100 }}
  onMapReady={() => console.log('Map ready!')}
  onPress={(coord) => console.log('Tapped at:', coord)}
>
  <Marker coordinate={{ latitude: 40.7128, longitude: -74.0060 }} title="NYC" />
  <Polyline coordinates={routeCoords} strokeColor="#FF0000" strokeWidth={3} />
</OSMView>
```

## 🎯 JSX Children Components

### Marker Component *(v1.1.0+)*

Declarative marker component for use as JSX child.

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `coordinate` | `Coordinate` | - | ✅ | Marker position |
| `title` | `string` | `undefined` | ❌ | Marker title |
| `description` | `string` | `undefined` | ❌ | Marker description |
| `icon` | `MarkerIcon` | `undefined` | ❌ | Custom icon configuration |
| `animation` | `MarkerAnimation` | `undefined` | ❌ | Marker animation |
| `zIndex` | `number` | `0` | ❌ | Render order |
| `draggable` | `boolean` | `false` | ❌ | Enable dragging |
| `opacity` | `number` | `1.0` | ❌ | Opacity (0.0 to 1.0) |
| `rotation` | `number` | `0` | ❌ | Rotation in degrees |
| `visible` | `boolean` | `true` | ❌ | Visibility |

```tsx
<Marker
  coordinate={{ latitude: 40.7128, longitude: -74.0060 }}
  title="New York City"
  description="The Big Apple!"
  draggable={true}
  rotation={45}
/>
```

### Polyline Component *(v1.1.0+)*

Declarative polyline component for drawing connected line segments.

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `coordinates` | `Coordinate[]` | - | ✅ | Array of coordinates |
| `strokeColor` | `string` | `"#000000"` | ❌ | Line color (hex) |
| `strokeWidth` | `number` | `2` | ❌ | Line width in pixels |
| `strokeOpacity` | `number` | `1.0` | ❌ | Line opacity (0.0 to 1.0) |
| `strokePattern` | `'solid' \| 'dashed' \| 'dotted'` | `"solid"` | ❌ | Line pattern |
| `lineCap` | `'round' \| 'square' \| 'butt'` | `"round"` | ❌ | Line cap style |
| `lineJoin` | `'round' \| 'bevel' \| 'miter'` | `"round"` | ❌ | Line join style |
| `zIndex` | `number` | `0` | ❌ | Render order |
| `visible` | `boolean` | `true` | ❌ | Visibility |

```tsx
<Polyline
  coordinates={[
    { latitude: 40.7128, longitude: -74.0060 },
    { latitude: 40.7614, longitude: -73.9776 }
  ]}
  strokeColor="#FF0000"
  strokeWidth={4}
  strokePattern="dashed"
  lineCap="round"
/>
```

### Polygon Component *(v1.1.0+)*

Declarative polygon component for drawing filled areas.

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `coordinates` | `Coordinate[]` | - | ✅ | Polygon boundary coordinates |
| `holes` | `Coordinate[][]` | `undefined` | ❌ | Array of hole coordinate arrays |
| `fillColor` | `string` | `"#00000020"` | ❌ | Fill color with alpha |
| `fillOpacity` | `number` | `1.0` | ❌ | Fill opacity (0.0 to 1.0) |
| `strokeColor` | `string` | `"#000000"` | ❌ | Border color |
| `strokeWidth` | `number` | `1` | ❌ | Border width |
| `strokeOpacity` | `number` | `1.0` | ❌ | Border opacity |
| `strokePattern` | `'solid' \| 'dashed' \| 'dotted'` | `"solid"` | ❌ | Border pattern |
| `zIndex` | `number` | `0` | ❌ | Render order |
| `visible` | `boolean` | `true` | ❌ | Visibility |

```tsx
<Polygon
  coordinates={[
    { latitude: 40.7500, longitude: -74.0000 },
    { latitude: 40.7600, longitude: -74.0000 },
    { latitude: 40.7600, longitude: -73.9900 },
    { latitude: 40.7500, longitude: -73.9900 }
  ]}
  fillColor="#FF000040"
  strokeColor="#FF0000"
  strokeWidth={2}
/>
```

### Circle Component *(v1.1.0+)*

Declarative circle component for drawing circular areas.

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `center` | `Coordinate` | - | ✅ | Circle center position |
| `radius` | `number` | - | ✅ | Radius in meters |
| `fillColor` | `string` | `"#00000020"` | ❌ | Fill color with alpha |
| `fillOpacity` | `number` | `1.0` | ❌ | Fill opacity (0.0 to 1.0) |
| `strokeColor` | `string` | `"#000000"` | ❌ | Border color |
| `strokeWidth` | `number` | `1` | ❌ | Border width |
| `strokeOpacity` | `number` | `1.0` | ❌ | Border opacity |
| `strokePattern` | `'solid' \| 'dashed' \| 'dotted'` | `"solid"` | ❌ | Border pattern |
| `zIndex` | `number` | `0` | ❌ | Render order |
| `visible` | `boolean` | `true` | ❌ | Visibility |

```tsx
<Circle
  center={{ latitude: 40.7128, longitude: -74.0060 }}
  radius={1000}
  fillColor="#0000FF30"
  strokeColor="#0000FF"
  strokeWidth={2}
/>
```

## 🎮 Reference Methods

Access map methods through a ref:

```tsx
const mapRef = useRef<OSMViewRef>(null);

// Example usage
await mapRef.current?.zoomIn();
```

### Zoom Controls

| Method | Signature | Description |
|--------|-----------|-------------|
| `zoomIn` | `() => Promise<void>` | Zoom in by one level |
| `zoomOut` | `() => Promise<void>` | Zoom out by one level |
| `setZoom` | `(zoom: number) => Promise<void>` | Set specific zoom level (1-18) |

### Camera Controls

| Method | Signature | Description |
|--------|-----------|-------------|
| `animateToLocation` | `(lat: number, lng: number, zoom?: number) => Promise<void>` | Animate to coordinate |
| `animateToRegion` | `(region: MapRegion, duration?: number) => Promise<void>` | Animate to region |
| `fitToMarkers` | `(markerIds?: string[], padding?: number) => Promise<void>` | Fit map to markers |

### Location Services

| Method | Signature | Description |
|--------|-----------|-------------|
| `getCurrentLocation` | `() => Promise<Coordinate>` | Get current GPS location |
| `startLocationTracking` | `() => Promise<void>` | Start location tracking |
| `stopLocationTracking` | `() => Promise<void>` | Stop location tracking |
| `waitForLocation` | `(timeoutSeconds: number) => Promise<Coordinate>` | Wait for fresh GPS fix |

### Marker Controls *(v1.1.0+)*

| Method | Signature | Description |
|--------|-----------|-------------|
| `addMarker` | `(marker: MarkerConfig) => Promise<void>` | Add marker programmatically |
| `removeMarker` | `(markerId: string) => Promise<void>` | Remove marker by ID |
| `updateMarker` | `(id: string, updates: Partial<MarkerConfig>) => Promise<void>` | Update marker properties |
| `showInfoWindow` | `(markerId: string) => Promise<void>` | Show marker info window |
| `hideInfoWindow` | `(markerId: string) => Promise<void>` | Hide marker info window |

### Overlay Controls *(v1.1.0+)*

| Method | Signature | Description |
|--------|-----------|-------------|
| `addPolyline` | `(polyline: PolylineConfig) => Promise<void>` | Add polyline programmatically |
| `removePolyline` | `(polylineId: string) => Promise<void>` | Remove polyline by ID |
| `updatePolyline` | `(id: string, updates: Partial<PolylineConfig>) => Promise<void>` | Update polyline properties |
| `addPolygon` | `(polygon: PolygonConfig) => Promise<void>` | Add polygon programmatically |
| `removePolygon` | `(polygonId: string) => Promise<void>` | Remove polygon by ID |
| `updatePolygon` | `(id: string, updates: Partial<PolygonConfig>) => Promise<void>` | Update polygon properties |
| `addCircle` | `(circle: CircleConfig) => Promise<void>` | Add circle programmatically |
| `removeCircle` | `(circleId: string) => Promise<void>` | Remove circle by ID |
| `updateCircle` | `(id: string, updates: Partial<CircleConfig>) => Promise<void>` | Update circle properties |

### Map Utilities

| Method | Signature | Description |
|--------|-----------|-------------|
| `takeSnapshot` | `(format?: 'png' \| 'jpg', quality?: number) => Promise<string>` | Capture map screenshot |

## 📋 TypeScript Interfaces

### Core Types

```typescript
interface Coordinate {
  latitude: number;   // -90 to 90
  longitude: number;  // -180 to 180
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
```

### Marker Configuration

```typescript
interface MarkerConfig {
  id: string;
  coordinate: Coordinate;
  title?: string;
  description?: string;
  icon?: MarkerIcon;
  animation?: MarkerAnimation;
  zIndex?: number;
  draggable?: boolean;
  opacity?: number;        // 0.0 to 1.0
  rotation?: number;       // Degrees
  visible?: boolean;
}

interface MarkerIcon {
  uri?: string;           // Image URL or local path
  width?: number;         // Icon width
  height?: number;        // Icon height
  anchor?: { x: number; y: number }; // Anchor point (0.5, 0.5 = center)
}

interface MarkerAnimation {
  type: 'bounce' | 'pulse' | 'fade' | 'scale' | 'rotate';
  duration: number;       // Animation duration in ms
  delay?: number;         // Animation delay in ms
  repeatCount?: number;   // Number of repetitions (-1 = infinite)
}
```

### Overlay Configurations *(v1.1.0+)*

```typescript
interface PolylineConfig {
  id: string;
  coordinates: Coordinate[];
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokePattern?: 'solid' | 'dashed' | 'dotted';
  lineCap?: 'round' | 'square' | 'butt';
  lineJoin?: 'round' | 'bevel' | 'miter';
  zIndex?: number;
  visible?: boolean;
}

interface PolygonConfig {
  id: string;
  coordinates: Coordinate[];
  holes?: Coordinate[][];
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokePattern?: 'solid' | 'dashed' | 'dotted';
  zIndex?: number;
  visible?: boolean;
}

interface CircleConfig {
  id: string;
  center: Coordinate;
  radius: number;         // Radius in meters
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokePattern?: 'solid' | 'dashed' | 'dotted';
  zIndex?: number;
  visible?: boolean;
}
```

### Clustering Configuration *(v1.1.0+)*

```typescript
interface ClusterConfig {
  enabled: boolean;
  radius?: number;          // Cluster radius in pixels (default: 100)
  maxZoom?: number;         // Max zoom level to cluster (default: 15)
  minPoints?: number;       // Min markers to form cluster (default: 2)
  maxClusterRadius?: number; // Max cluster radius in meters
  animate?: boolean;        // Animate cluster changes (default: true)
  animationDuration?: number; // Animation duration in ms (default: 300)
}
```

## 🔍 Search & Geocoding

### SearchBox Component

Pre-built search component with autocomplete.

```tsx
import { SearchBox } from 'expo-osm-sdk';

<SearchBox
  placeholder="Search for places..."
  onLocationSelect={(location) => {
    console.log('Selected:', location);
  }}
  maxResults={10}
  debounceMs={300}
/>
```

### useNominatimSearch Hook

React hook for building custom search interfaces.

```tsx
import { useNominatimSearch } from 'expo-osm-sdk';

const {
  query,
  setQuery,
  results,
  isLoading,
  error,
  searchLocations,
  clearResults
} = useNominatimSearch();
```

### Direct API Functions

Low-level search functions for custom implementations.

```typescript
import { searchLocations, reverseGeocode } from 'expo-osm-sdk';

// Search by text query
const results = await searchLocations('New York City', {
  limit: 10,
  countryCode: 'US'
});

// Reverse geocoding
const address = await reverseGeocode(40.7128, -74.0060);
```

## ⚡ Performance Best Practices

### 1. Marker Clustering
Enable clustering for maps with many markers:

```tsx
<OSMView
  clustering={{
    enabled: true,
    radius: 100,
    maxZoom: 15,
    minPoints: 2
  }}
>
```

### 2. Conditional Rendering
Use conditional rendering for dynamic overlays:

```tsx
<OSMView>
  {showRoute && (
    <Polyline coordinates={routeCoords} strokeColor="#FF0000" />
  )}
  {markers.map(marker => (
    <Marker key={marker.id} coordinate={marker.coordinate} />
  ))}
</OSMView>
```

### 3. Optimize Re-renders
Memoize expensive data processing:

```tsx
const processedMarkers = useMemo(() => {
  return rawData.map(item => ({
    id: item.id,
    coordinate: { latitude: item.lat, longitude: item.lng },
    title: item.name
  }));
}, [rawData]);
```

### 4. Use Vector Tiles
Vector tiles provide better performance:

```tsx
<OSMView
  styleUrl="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
  // Much faster than raster tiles
/>
```

---

## 📝 Notes

- All coordinate values use decimal degrees (WGS84)
- Colors support hex format with optional alpha: `#RRGGBBAA`
- All async methods return Promises for proper error handling
- JSX children are automatically merged with props arrays
- Clustering improves performance with 100+ markers

For complete examples, see the [examples directory](./examples/). 