# 🎯 Geofencing Guide

Complete guide to using geofencing with **expo-osm-sdk v1.0.95+**

---

## 📚 Table of Contents

1. [What is Geofencing?](#what-is-geofencing)
2. [Installation](#installation)
3. [Basic Usage](#basic-usage)
4. [Circle Geofences](#circle-geofences)
5. [Polygon Geofences](#polygon-geofences)
6. [Multiple Geofences](#multiple-geofences)
7. [Events](#events)
8. [Configuration](#configuration)
9. [Performance](#performance)
10. [API Reference](#api-reference)
11. [Examples](#examples)
12. [Troubleshooting](#troubleshooting)

---

## What is Geofencing?

**Geofencing** is a location-based service that triggers actions when a device enters or exits a defined geographic boundary.

### Use Cases

- 🏬 **Retail**: Send promotions when customer enters store vicinity
- 🚗 **Delivery**: Notify when driver arrives at destination
- 🏢 **Workplace**: Automatic clock-in/out when entering office
- 🏡 **Smart Home**: Trigger home automation on arrival
- 📍 **Location Reminders**: Alert when near specific places
- 🎫 **Events**: Check-in confirmation at venues
- 🚨 **Safety**: Alert when entering/leaving safe zones

---

## Installation

Geofencing is built into `expo-osm-sdk` v1.0.95+. No additional dependencies needed!

```bash
# Already installed? You're ready!
npm install expo-osm-sdk

# Or update to latest
npm install expo-osm-sdk@latest
```

---

## Basic Usage

### Simplest Example - Single Geofence

```tsx
import { useSingleGeofence } from 'expo-osm-sdk';

function App() {
  const storeGeofence = {
    id: 'my-store',
    name: 'Coffee Shop',
    type: 'circle' as const,
    center: { latitude: 37.7749, longitude: -122.4194 },
    radius: 100, // 100 meters
  };

  const { isInside, dwellTime } = useSingleGeofence(storeGeofence, {
    onEnter: (event) => {
      console.log('Welcome to', event.geofenceName);
      // Show notification, trigger action, etc.
    },
    onExit: (event) => {
      console.log('Thanks for visiting', event.geofenceName);
    },
  });

  return (
    <View>
      <Text>Inside store: {isInside ? 'Yes' : 'No'}</Text>
      <Text>Time inside: {Math.floor(dwellTime / 1000)}s</Text>
    </View>
  );
}
```

---

## Circle Geofences

Defined by a center point and radius.

### Definition

```tsx
import type { CircleGeofence } from 'expo-osm-sdk';

const circleGeofence: CircleGeofence = {
  id: 'office',
  name: 'Office Building',
  type: 'circle',
  center: { 
    latitude: 37.7749, 
    longitude: -122.4194 
  },
  radius: 50, // meters
  metadata: {
    address: '123 Main St',
    buildingId: 'ABC123',
  },
};
```

### Use Cases

- ✅ Buildings with circular coverage
- ✅ Stores, restaurants, venues
- ✅ Delivery drop-off points
- ✅ Parking lots
- ✅ Quick proximity checks

### Pros & Cons

**Pros:**
- Simple to define
- Fast computation
- Easy to visualize

**Cons:**
- Can't match complex shapes
- May include unwanted areas

---

## Polygon Geofences

Defined by an array of coordinates forming any shape.

### Definition

```tsx
import type { PolygonGeofence } from 'expo-osm-sdk';

const polygonGeofence: PolygonGeofence = {
  id: 'park',
  name: 'Central Park',
  type: 'polygon',
  coordinates: [
    { latitude: 40.7829, longitude: -73.9654 }, // Top-left
    { latitude: 40.7829, longitude: -73.9489 }, // Top-right
    { latitude: 40.7640, longitude: -73.9489 }, // Bottom-right
    { latitude: 40.7640, longitude: -73.9654 }, // Bottom-left
  ],
  metadata: {
    area: 'Manhattan',
    parkId: 'CP001',
  },
};
```

### Use Cases

- ✅ Complex building shapes
- ✅ Neighborhoods, districts
- ✅ Parks, campuses
- ✅ Irregular boundaries
- ✅ Following streets/property lines

### Pros & Cons

**Pros:**
- Matches exact boundaries
- Highly accurate
- Flexible for any shape

**Cons:**
- More coordinates to define
- Slightly slower computation
- Harder to create manually

### Creating Polygons

**Option 1: Use a GeoJSON tool** (recommended)
- [geojson.io](http://geojson.io/) - Draw on map, copy coordinates
- [Google My Maps](https://www.google.com/maps/d/u/0/) - Draw, export KML

**Option 2: From property boundaries**
- Use OpenStreetMap data
- Use government GIS data

**Option 3: Trace on satellite imagery**
- Find coordinates at corners
- Create array manually

---

## Multiple Geofences

Monitor many geofences simultaneously.

### Example: Store Chain

```tsx
import { useGeofencing } from 'expo-osm-sdk';

function StoreLocator() {
  const stores = [
    {
      id: 'store-1',
      name: 'Downtown Store',
      type: 'circle' as const,
      center: { latitude: 37.7749, longitude: -122.4194 },
      radius: 50,
    },
    {
      id: 'store-2',
      name: 'Airport Store',
      type: 'circle' as const,
      center: { latitude: 37.6213, longitude: -122.3790 },
      radius: 75,
    },
    {
      id: 'store-3',
      name: 'Mall Store',
      type: 'circle' as const,
      center: { latitude: 37.7893, longitude: -122.4079 },
      radius: 100,
    },
  ];

  const { activeGeofences, isInGeofence } = useGeofencing(stores, {
    onEnter: (event) => {
      console.log(`Entered: ${event.geofenceName}`);
      // Show store-specific promotion
    },
  });

  return (
    <View>
      <Text>Nearby stores: {activeGeofences.length}</Text>
      {stores.map(store => (
        <Text key={store.id}>
          {store.name}: {isInGeofence(store.id) ? '📍 Nearby' : ''}
        </Text>
      ))}
    </View>
  );
}
```

### Performance Tips

- ✅ Limit to 50-100 geofences max
- ✅ Use larger checkInterval for many geofences
- ✅ Disable high accuracy if precision not critical
- ✅ Remove geofences when far away (dynamic loading)

---

## Events

Three types of events: **enter**, **exit**, **dwell**.

### Enter Event

Triggered when user enters a geofence.

```tsx
const { activeGeofences } = useGeofencing(geofences, {
  onEnter: (event) => {
    console.log('Entered geofence:', event);
    // event.geofenceId - ID of geofence entered
    // event.geofenceName - Name of geofence
    // event.coordinate - User's location
    // event.timestamp - When it happened
    // event.distance - Distance from boundary
    // event.metadata - Custom data
  },
});
```

### Exit Event

Triggered when user leaves a geofence.

```tsx
const { activeGeofences } = useGeofencing(geofences, {
  onExit: (event) => {
    console.log('Exited geofence:', event);
    // Same structure as enter event
  },
});
```

### Dwell Event

Triggered when user stays inside for specified duration.

```tsx
const { activeGeofences } = useGeofencing(geofences, {
  dwellThreshold: 60000, // 1 minute (in milliseconds)
  onDwell: (event) => {
    console.log('User has been here for 1+ minute:', event);
    // Great for: discounts, loyalty points, check-ins
  },
});
```

### All Events

Listen to all events at once:

```tsx
const { events } = useGeofencing(geofences, {
  onEvent: (event) => {
    console.log(`Event: ${event.type} at ${event.geofenceName}`);
  },
});

// Or access events array
console.log('All events:', events);
```

---

## Configuration

Fine-tune geofencing behavior.

### Check Interval

How often to check if user crossed boundaries:

```tsx
useGeofencing(geofences, {
  checkInterval: 5000, // Default: 5 seconds
});

// Options:
// - 1000 = 1 second (very responsive, higher battery usage)
// - 5000 = 5 seconds (balanced) ✅ RECOMMENDED
// - 10000 = 10 seconds (battery friendly, slower response)
// - 30000 = 30 seconds (very battery friendly, slow response)
```

**Recommendations:**
- **Real-time apps** (ride-sharing): 1-3 seconds
- **Most apps** (delivery, retail): 5 seconds
- **Background monitoring**: 10-30 seconds

### Dwell Threshold

How long user must stay before dwell event:

```tsx
useGeofencing(geofences, {
  dwellThreshold: 60000, // Default: 1 minute
});

// Examples:
// - 10000 = 10 seconds (quick check-ins)
// - 60000 = 1 minute (standard) ✅ RECOMMENDED
// - 300000 = 5 minutes (long visits)
// - 900000 = 15 minutes (extended stays)
```

### Location Accuracy

Balance between accuracy and battery:

```tsx
useGeofencing(geofences, {
  enableHighAccuracy: true, // Default: true
});

// true = GPS + WiFi + Cellular (±10m, higher battery)
// false = WiFi + Cellular only (±50m, lower battery)
```

**Recommendations:**
- **Small geofences** (<50m): Use `true`
- **Large geofences** (>100m): Can use `false`
- **Battery-critical apps**: Use `false`

---

## Performance

Optimize for battery life and responsiveness.

### Battery Usage Tips

1. **Increase checkInterval**
   ```tsx
   checkInterval: 10000 // Check every 10s instead of 5s
   ```

2. **Disable high accuracy** (if acceptable)
   ```tsx
   enableHighAccuracy: false
   ```

3. **Reduce number of geofences**
   ```tsx
   // Load only nearby geofences dynamically
   const nearbyGeofences = allGeofences.filter(g => 
     isCloseEnough(userLocation, g)
   );
   ```

4. **Use larger geofences**
   ```tsx
   // 100m radius = less frequent boundary crossings
   radius: 100
   ```

### Battery Impact Estimates

| Configuration | Battery Impact | Responsiveness |
|--------------|----------------|----------------|
| `checkInterval: 1000, enableHighAccuracy: true` | 🔴 High (~5-10%/hr) | ⚡ Instant |
| `checkInterval: 5000, enableHighAccuracy: true` | 🟡 Medium (~2-4%/hr) | ✅ Fast |
| `checkInterval: 10000, enableHighAccuracy: false` | 🟢 Low (~1-2%/hr) | ✓ Good |
| `checkInterval: 30000, enableHighAccuracy: false` | 🟢 Very Low (~0.5-1%/hr) | Slow |

---

## API Reference

### `useGeofencing(geofences, options)`

Main geofencing hook.

#### Parameters

```tsx
geofences: Geofence[]  // Array of geofences to monitor
options: UseGeofencingOptions  // Configuration
```

#### Options

```tsx
interface UseGeofencingOptions {
  checkInterval?: number;         // Default: 5000 ms
  dwellThreshold?: number;        // Default: 60000 ms
  enableHighAccuracy?: boolean;   // Default: true
  onEnter?: (event) => void;
  onExit?: (event) => void;
  onDwell?: (event) => void;
  onEvent?: (event) => void;
}
```

#### Returns

```tsx
interface UseGeofencingReturn {
  activeGeofences: string[];      // IDs of active geofences
  geofenceStates: Map<string, GeofenceState>;
  isInGeofence: (id: string) => boolean;
  getDwellTime: (id: string) => number;
  checkGeofences: () => void;     // Manual check
  currentLocation: Coordinate | null;
  isTracking: boolean;
  events: GeofenceEvent[];        // All events
}
```

### `useSingleGeofence(geofence, options)`

Simplified hook for single geofence.

#### Returns

```tsx
{
  ...UseGeofencingReturn,
  isInside: boolean,              // Are we inside?
  dwellTime: number,              // Time inside (ms)
}
```

### Utility Functions

```tsx
// Calculate distance between two points (meters)
calculateDistance(point1, point2)

// Check if point is in circle
isPointInCircle(point, circleGeofence)

// Check if point is in polygon
isPointInPolygon(point, polygonGeofence)

// Check if point is in any geofence
isPointInGeofence(point, geofence)

// Distance to geofence boundary (meters)
distanceToGeofence(point, geofence)

// Validate geofence configuration
validateGeofence(geofence)

// Get center of geofence
getGeofenceCenter(geofence)

// Check if two geofences overlap
doGeofencesOverlap(geofence1, geofence2)
```

---

## Examples

### Example 1: Store Promotion

```tsx
import { useSingleGeofence } from 'expo-osm-sdk';
import { Alert } from 'react-native';

function StorePromotion() {
  const store = {
    id: 'coffee-shop',
    name: 'Bean There Coffee',
    type: 'circle' as const,
    center: { latitude: 37.7749, longitude: -122.4194 },
    radius: 50,
  };

  const { isInside } = useSingleGeofence(store, {
    onEnter: (event) => {
      Alert.alert(
        'Welcome! ☕',
        '20% off your order today!',
        [{ text: 'View Menu', onPress: () => console.log('Open menu') }]
      );
    },
    onDwell: (event) => {
      // User stayed for 1+ minute
      Alert.alert('Thanks for visiting!', 'Earn 10 loyalty points?');
    },
  });

  return (
    <View>
      {isInside && <Text>🎉 You're at Bean There! Get 20% off!</Text>}
    </View>
  );
}
```

### Example 2: Delivery Tracking

```tsx
import { useGeofencing } from 'expo-osm-sdk';

function DeliveryTracker({ deliveryAddress }) {
  const geofences = [
    {
      id: 'destination',
      name: 'Delivery Address',
      type: 'circle' as const,
      center: deliveryAddress,
      radius: 100,
    },
    {
      id: 'nearby',
      name: 'Near Delivery',
      type: 'circle' as const,
      center: deliveryAddress,
      radius: 500, // 500m = 5-10 min away
    },
  ];

  const { activeGeofences } = useGeofencing(geofences, {
    checkInterval: 3000, // Check every 3 seconds
    onEnter: (event) => {
      if (event.geofenceId === 'nearby') {
        // Notify customer: "Driver is nearby!"
        sendPushNotification('Your delivery is 5-10 minutes away!');
      } else if (event.geofenceId === 'destination') {
        // Notify customer: "Driver has arrived!"
        sendPushNotification('Your delivery has arrived!');
      }
    },
  });

  return (
    <View>
      {activeGeofences.includes('nearby') && (
        <Text>🚗 Driver is nearby!</Text>
      )}
      {activeGeofences.includes('destination') && (
        <Text>📦 Driver has arrived!</Text>
      )}
    </View>
  );
}
```

### Example 3: Office Check-In

```tsx
import { useSingleGeofence } from 'expo-osm-sdk';

function OfficeCheckIn() {
  const office = {
    id: 'office',
    name: 'Main Office',
    type: 'polygon' as const,
    coordinates: [
      { latitude: 37.7749, longitude: -122.4194 },
      { latitude: 37.7750, longitude: -122.4190 },
      { latitude: 37.7745, longitude: -122.4188 },
      { latitude: 37.7744, longitude: -122.4192 },
    ],
  };

  const { isInside, dwellTime } = useSingleGeofence(office, {
    dwellThreshold: 300000, // 5 minutes
    onEnter: (event) => {
      console.log('Arrived at office:', event.timestamp);
      // Auto clock-in
      clockIn(event.timestamp);
    },
    onExit: (event) => {
      console.log('Left office:', event.timestamp);
      // Auto clock-out
      clockOut(event.timestamp);
    },
    onDwell: (event) => {
      console.log('Been at office for 5+ minutes');
      // Confirm attendance
      confirmAttendance();
    },
  });

  return (
    <View>
      <Text>At office: {isInside ? '✅ Yes' : '❌ No'}</Text>
      <Text>Time at office: {Math.floor(dwellTime / 60000)} min</Text>
    </View>
  );
}
```

### Example 4: Smart Home Automation

```tsx
import { useSingleGeofence } from 'expo-osm-sdk';

function SmartHome() {
  const home = {
    id: 'home',
    name: 'My Home',
    type: 'circle' as const,
    center: { latitude: 37.7749, longitude: -122.4194 },
    radius: 100,
  };

  useSingleGeofence(home, {
    onEnter: (event) => {
      // Arriving home - turn on lights, AC, etc.
      smartHomeAPI.turnOnLights();
      smartHomeAPI.setTemperature(72);
      console.log('Welcome home! 🏠');
    },
    onExit: (event) => {
      // Leaving home - turn off devices, arm security
      smartHomeAPI.turnOffLights();
      smartHomeAPI.armSecurity();
      console.log('Goodbye! Stay safe! 🔒');
    },
  });

  return <View><Text>Smart Home Automation Active</Text></View>;
}
```

### Example 5: Location-Based Reminders

```tsx
import { useGeofencing } from 'expo-osm-sdk';
import { Alert } from 'react-native';

function LocationReminders() {
  const reminders = [
    {
      id: 'grocery',
      name: 'Grocery Store',
      type: 'circle' as const,
      center: { latitude: 37.7749, longitude: -122.4194 },
      radius: 200,
      metadata: { reminder: 'Buy milk, eggs, bread' },
    },
    {
      id: 'pharmacy',
      name: 'Pharmacy',
      type: 'circle' as const,
      center: { latitude: 37.7850, longitude: -122.4090 },
      radius: 150,
      metadata: { reminder: 'Pick up prescription' },
    },
  ];

  useGeofencing(reminders, {
    onEnter: (event) => {
      Alert.alert(
        `📍 You're near ${event.geofenceName}`,
        event.metadata?.reminder,
        [
          { text: 'Dismiss', style: 'cancel' },
          { text: 'Mark Done', onPress: () => console.log('Done') },
        ]
      );
    },
  });

  return <View><Text>Location Reminders Active</Text></View>;
}
```

---

## Troubleshooting

### Events Not Firing

**Problem:** `onEnter`/`onExit` not being called.

**Solutions:**
1. Check location permissions:
   ```tsx
   import * as Location from 'expo-location';
   const { status } = await Location.requestForegroundPermissionsAsync();
   ```

2. Verify geofence is valid:
   ```tsx
   import { validateGeofence } from 'expo-osm-sdk';
   console.log(validateGeofence(myGeofence)); // Should be true
   ```

3. Check if location is updating:
   ```tsx
   const { currentLocation, isTracking } = useGeofencing(...);
   console.log('Location:', currentLocation, 'Tracking:', isTracking);
   ```

4. Reduce `checkInterval` for faster response:
   ```tsx
   checkInterval: 1000 // Check every 1 second
   ```

### High Battery Usage

**Problem:** App draining battery quickly.

**Solutions:**
1. Increase `checkInterval`:
   ```tsx
   checkInterval: 10000 // Check every 10 seconds
   ```

2. Disable high accuracy:
   ```tsx
   enableHighAccuracy: false
   ```

3. Reduce number of geofences:
   ```tsx
   // Only monitor nearby geofences
   ```

4. Use larger geofences:
   ```tsx
   radius: 200 // Instead of 50
   ```

### Inaccurate Detection

**Problem:** False enter/exit events.

**Solutions:**
1. Enable high accuracy:
   ```tsx
   enableHighAccuracy: true
   ```

2. Increase geofence size:
   ```tsx
   radius: 100 // Instead of 20
   ```

3. Add hysteresis (buffer zone):
   ```tsx
   // Use two geofences: inner (enter) and outer (exit)
   ```

### Polygon Not Working

**Problem:** Polygon geofence not detecting correctly.

**Solutions:**
1. Verify at least 3 coordinates:
   ```tsx
   coordinates.length >= 3 // Must be true
   ```

2. Check coordinate order (should form closed loop):
   ```tsx
   // Connect back to start
   const lastPoint = coordinates[coordinates.length - 1];
   const firstPoint = coordinates[0];
   // These should be close if manually closing
   ```

3. Visualize on map:
   ```tsx
   <OSMView>
     <Polygon coordinates={geofence.coordinates} />
   </OSMView>
   ```

---

## Summary

### Key Takeaways

✅ **Two geofence types**: Circle (simple) and Polygon (flexible)  
✅ **Three events**: Enter, Exit, Dwell  
✅ **Two hooks**: `useGeofencing` (multiple) and `useSingleGeofence` (single)  
✅ **Configurable**: Adjust intervals, accuracy, thresholds  
✅ **Battery-conscious**: Optimize for your use case  
✅ **TypeScript support**: Full type safety  

### Quick Start Checklist

- [ ] Update to expo-osm-sdk v1.0.95+
- [ ] Request location permissions
- [ ] Define geofence(s)
- [ ] Use `useGeofencing` or `useSingleGeofence`
- [ ] Add event handlers (`onEnter`, `onExit`)
- [ ] Test with simulator or device
- [ ] Optimize for battery if needed

---

## Need Help?

- 📖 [Main README](../README.md)
- 🐛 [Report Issues](https://github.com/yourusername/expo-osm-sdk/issues)
- 💬 [Discussions](https://github.com/yourusername/expo-osm-sdk/discussions)

---

**Made with ❤️ by the expo-osm-sdk team**

