# expo-osm-sdk demo app

A minimal demo app that shows the real features of [expo-osm-sdk](../expo-osm-sdk).

---

## Screens

### Map tab
- OSMView with Indian city markers
- Tile style switcher (Liberty / Positron / Bright via OpenFreeMap)
- Zoom controls (`NavigationControls`)
- My location button (`LocationButton`)
- Tap any city marker to zoom to it

### Shapes tab
- `Polyline` — Mumbai → Pune route
- `Circle` — radius overlays around Mumbai and Pune

### Location tab
- `useLocationTracking` hook demo
- Live status indicator (idle / starting / active / error)
- Displays current GPS coordinates
- Map follows user position when tracking is active

---

## Run locally

```bash
# Install dependencies
npm install

# Start with Expo (development build required — does not run in Expo Go)
npx expo run:ios
# or
npx expo run:android
```

> The app uses `expo-osm-sdk` from the local `../expo-osm-sdk` directory via a `file:` reference.
> After publishing expo-osm-sdk to npm, update `package.json` to use `"expo-osm-sdk": "^2.1.1"`.

---

## Build for device testing

```bash
# Android APK (preview profile in eas.json)
npm run build:android
```

---

## What this app uses from expo-osm-sdk

| API | Screen |
|-----|--------|
| `OSMView` | All |
| `TILE_CONFIGS` | Map, Shapes, Location |
| `NavigationControls` | Map |
| `LocationButton` | Map |
| `Polyline` | Shapes |
| `Circle` | Shapes |
| `useLocationTracking` | Location |
| `MarkerConfig`, `Coordinate`, `OSMViewRef` | All (types) |
