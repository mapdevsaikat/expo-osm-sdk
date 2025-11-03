# 📍 Custom Markers & Overlays Guide

Complete guide to using custom markers, shapes, and overlays with **expo-osm-sdk v1.0.95+**

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Markers](#markers)
3. [Circles](#circles)
4. [Polylines](#polylines)
5. [Polygons](#polygons)
6. [Custom Overlays](#custom-overlays)
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
| **Custom Overlays** | Any React component | 🎨 Custom UI elements |

---

## Markers

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

### Marker with Custom Icon

```tsx
<OSMView
  markers={[
    {
      id: 'store',
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      title: 'Coffee Shop',
      description: 'Best coffee in town',
      icon: {
        uri: 'https://example.com/coffee-icon.png',
        width: 40,
        height: 40,
      },
    },
  ]}
/>
```

### Interactive Markers

```tsx
<OSMView
  markers={markers}
  onMarkerPress={(marker) => {
    Alert.alert(marker.title, marker.description);
  }}
/>
```

### Marker Configuration

```tsx
interface MarkerConfig {
  id: string;                    // Unique identifier
  coordinate: Coordinate;        // Position
  title?: string;                // Title (shown in callout)
  description?: string;          // Description
  icon?: MarkerIcon;             // Custom icon
  draggable?: boolean;           // Can be moved
  anchor?: { x: number; y: number }; // Icon anchor point
  calloutAnchor?: { x: number; y: number };
  zIndex?: number;               // Draw order
  rotation?: number;             // Rotation angle (degrees)
  flat?: boolean;                // Flat against map
  opacity?: number;              // 0-1 transparency
}

interface MarkerIcon {
  uri: string;                   // Image URL or local path
  width: number;                 // Icon width
  height: number;                // Icon height
  scale?: number;                // Scale factor
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

## Custom Overlays

### Basic Custom Component

```tsx
import { CustomOverlay } from 'expo-osm-sdk';

<OSMView>
  <CustomOverlay
    coordinate={{ latitude: 37.7749, longitude: -122.4194 }}
    width={100}
    height={50}
  >
    <View style={styles.customMarker}>
      <Text>Custom!</Text>
    </View>
  </CustomOverlay>
</OSMView>
```

### Animated Overlay

```tsx
<CustomOverlay
  coordinate={driverLocation}
  width={60}
  height={60}
  anchor={{ x: 0.5, y: 0.5 }}
>
  <Animated.View style={[styles.driver, animatedStyle]}>
    <Text>🚗</Text>
  </Animated.View>
</CustomOverlay>
```

### Custom Overlay Props

```tsx
interface CustomOverlayProps {
  coordinate: Coordinate;        // Position
  children: React.ReactNode;     // Custom component
  width?: number;                // Overlay width
  height?: number;               // Overlay height
  anchor?: { x: number; y: number }; // Anchor (0-1)
  zIndex?: number;               // Draw order
  visible?: boolean;             // Visibility
}
```

### Use Cases

- ✅ Custom markers
- ✅ Info windows
- ✅ Animated elements
- ✅ Complex UI
- ✅ Data visualizations

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

