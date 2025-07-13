# Project Architecture: OSM-Based SDK for Expo Mobile Development

## Architecture Overview

This document outlines the comprehensive architecture for building an OpenStreetMap-based SDK specifically designed for Expo mobile app development, leveraging **MapLibre GL Native**, **OpenMapTiles**, and **OSRM** as the core foundation.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXPO APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                    EXPO-OSM-SDK (Public API)                    │
├─────────────────────────────────────────────────────────────────┤
│                    REACT NATIVE BRIDGE                          │
├─────────────────────────────────────────────────────────────────┤
│           NATIVE MODULES (iOS/Android)                          │
├─────────────────────────────────────────────────────────────────┤
│                    MAPLIBRE GL NATIVE                           │
├─────────────────────────────────────────────────────────────────┤
│    EXTERNAL SERVICES: OpenMapTiles | OSRM | Nominatim          │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components Architecture

### 1. **SDK Package Structure**

```
expo-osm-sdk/
├── src/
│   ├── components/           # React Native components
│   │   ├── OSMView.tsx      # Main map view component
│   │   ├── Marker.tsx       # Marker component
│   │   ├── Polyline.tsx     # Route/path component
│   │   └── Callout.tsx      # Info callout component
│   ├── services/            # Core services
│   │   ├── MapService.ts    # Map management service
│   │   ├── RoutingService.ts # OSRM integration
│   │   ├── GeocodingService.ts # Address/coordinate conversion
│   │   ├── TileService.ts   # Tile management and caching
│   │   └── OfflineService.ts # Offline functionality
│   ├── utils/               # Utility functions
│   │   ├── coordinate.ts    # Coordinate transformations
│   │   ├── styling.ts       # Map styling utilities
│   │   └── constants.ts     # Configuration constants
│   ├── types/               # TypeScript definitions
│   │   ├── index.ts         # Main type exports
│   │   ├── map.ts           # Map-related types
│   │   ├── routing.ts       # Routing types
│   │   └── geocoding.ts     # Geocoding types
│   └── index.ts             # Main SDK export
├── ios/                     # iOS native module
│   ├── ExpoOsmSdk.xcodeproj
│   ├── ExpoOsmSdk/
│   │   ├── OSMMapView.swift # iOS map view implementation
│   │   ├── OSMMapManager.swift # Map management
│   │   ├── OSMMarkerView.swift # Marker implementation
│   │   └── ExpoOsmSdkModule.swift # Bridge module
│   └── Podfile              # iOS dependencies
├── android/                 # Android native module
│   ├── build.gradle
│   ├── src/main/java/expo/modules/osmsdk/
│   │   ├── OSMMapView.kt    # Android map view
│   │   ├── OSMMapManager.kt # Map management
│   │   ├── OSMMarkerView.kt # Marker implementation
│   │   └── ExpoOsmSdkModule.kt # Bridge module
│   └── proguard-rules.pro   # Android optimization
├── plugin/                  # Expo config plugin
│   ├── src/
│   │   ├── index.ts         # Plugin entry point
│   │   ├── withOsmSdk.ts    # Configuration modifier
│   │   └── ios/             # iOS-specific configs
│   └── build/               # Compiled plugin
├── example/                 # Example Expo app
│   ├── App.tsx              # Demo application
│   ├── app.json             # Expo configuration
│   └── package.json         # Dependencies
├── docs/                    # Documentation
│   ├── api/                 # API documentation
│   ├── guides/              # Integration guides
│   └── examples/            # Code examples
└── package.json             # SDK package configuration
```

### 2. **Core Architecture Layers**

#### **Layer 1: Public API (React Native)**
```typescript
// Main SDK export structure
export interface ExpoOsmSdkAPI {
  // Components
  OSMView: React.ComponentType<OSMViewProps>;
  Marker: React.ComponentType<MarkerProps>;
  Polyline: React.ComponentType<PolylineProps>;
  
  // Services
  MapService: IMapService;
  RoutingService: IRoutingService;
  GeocodingService: IGeocodingService;
  
  // Utilities
  CoordinateUtils: ICoordinateUtils;
  StylingUtils: IStylingUtils;
}
```

#### **Layer 2: Native Bridge Communication**
```typescript
// Native module interface
interface OSMNativeModule {
  // Map operations
  createMapView(viewId: string, config: MapConfig): Promise<void>;
  updateMapView(viewId: string, updates: MapUpdate): Promise<void>;
  
  // Marker operations
  addMarker(viewId: string, marker: MarkerConfig): Promise<string>;
  updateMarker(viewId: string, markerId: string, updates: MarkerUpdate): Promise<void>;
  
  // Routing operations
  calculateRoute(start: Coordinate, end: Coordinate, options: RoutingOptions): Promise<Route>;
  
  // Geocoding operations
  geocodeAddress(address: string): Promise<GeocodingResult[]>;
  reverseGeocode(coordinate: Coordinate): Promise<ReverseGeocodingResult>;
}
```

#### **Layer 3: Native Implementation**

**iOS Implementation (Swift)**
```swift
// OSMMapView.swift
class OSMMapView: UIView {
    private var mapView: MLNMapView!
    private var tileSource: MLNVectorTileSource!
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupMapView()
    }
    
    private func setupMapView() {
        // Initialize MapLibre GL Native
        mapView = MLNMapView(frame: bounds)
        mapView.delegate = self
        
        // Configure OpenMapTiles source
        setupTileSource()
        
        addSubview(mapView)
    }
    
    private func setupTileSource() {
        let tileURL = URL(string: "https://api.maptiler.com/maps/streets/{z}/{x}/{y}.pbf")!
        tileSource = MLNVectorTileSource(identifier: "openmaptiles", tileURLTemplates: [tileURL.absoluteString])
        mapView.style?.addSource(tileSource)
    }
}
```

**Android Implementation (Kotlin)**
```kotlin
// OSMMapView.kt
class OSMMapView(context: Context, attrs: AttributeSet) : FrameLayout(context, attrs) {
    private lateinit var mapView: MapView
    private lateinit var mapLibreMap: MapLibreMap
    
    init {
        initializeMapView()
    }
    
    private fun initializeMapView() {
        mapView = MapView(context)
        
        mapView.getMapAsync { map ->
            mapLibreMap = map
            setupTileSource()
        }
        
        addView(mapView)
    }
    
    private fun setupTileSource() {
        val tileSource = VectorSource(
            "openmaptiles",
            "https://api.maptiler.com/maps/streets/{z}/{x}/{y}.pbf"
        )
        mapLibreMap.style?.addSource(tileSource)
    }
}
```

### 3. **Service Architecture**

#### **Routing Service (OSRM Integration)**
```typescript
interface IRoutingService {
  calculateRoute(
    start: Coordinate,
    end: Coordinate,
    options?: RoutingOptions
  ): Promise<Route>;
  
  calculateMultipleRoutes(
    waypoints: Coordinate[],
    options?: RoutingOptions
  ): Promise<Route[]>;
  
  getDirections(
    start: Coordinate,
    end: Coordinate,
    options?: DirectionsOptions
  ): Promise<DirectionsResult>;
}

class RoutingService implements IRoutingService {
  private osrmBaseUrl = 'https://router.project-osrm.org';
  
  async calculateRoute(
    start: Coordinate,
    end: Coordinate,
    options: RoutingOptions = {}
  ): Promise<Route> {
    const profile = options.profile || 'driving';
    const url = `${this.osrmBaseUrl}/route/v1/${profile}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
    
    const response = await fetch(`${url}?overview=full&geometries=geojson`);
    const data = await response.json();
    
    return this.parseOSRMResponse(data);
  }
}
```

#### **Geocoding Service**
```typescript
interface IGeocodingService {
  geocodeAddress(address: string): Promise<GeocodingResult[]>;
  reverseGeocode(coordinate: Coordinate): Promise<ReverseGeocodingResult>;
  searchPOI(query: string, bounds?: BoundingBox): Promise<POIResult[]>;
}

class GeocodingService implements IGeocodingService {
  private nominatimBaseUrl = 'https://nominatim.openstreetmap.org';
  
  async geocodeAddress(address: string): Promise<GeocodingResult[]> {
    const url = `${this.nominatimBaseUrl}/search?format=json&q=${encodeURIComponent(address)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.map(this.parseNominatimResult);
  }
}
```

### 4. **Data Flow Architecture**

```
User Interaction → OSMView Component → Native Bridge → Native Module → MapLibre GL Native → Render
                                                    ↓
External API Call → Service Layer → Response Processing → State Update → UI Update
```

### 5. **Configuration Architecture**

#### **Expo Plugin Configuration**
```typescript
// plugin/src/withOsmSdk.ts
import { ConfigPlugin, withPlugins } from '@expo/config-plugins';

const withOsmSdk: ConfigPlugin<OsmSdkPluginProps> = (config, props) => {
  return withPlugins(config, [
    [withOsmSdkIOS, props],
    [withOsmSdkAndroid, props],
    [withOsmSdkPermissions, props],
  ]);
};

const withOsmSdkIOS: ConfigPlugin<OsmSdkPluginProps> = (config, props) => {
  return withInfoPlist(config, (config) => {
    config.modResults.NSLocationWhenInUseUsageDescription = 
      props?.locationPermissionText || 'This app uses location for map features';
    return config;
  });
};
```

### 6. **Type System Architecture**

```typescript
// types/index.ts
export interface OSMViewProps {
  style?: ViewStyle;
  initialCenter?: Coordinate;
  initialZoom?: number;
  tileServer?: string;
  styleURL?: string;
  markers?: MarkerConfig[];
  onMapReady?: () => void;
  onRegionChange?: (region: MapRegion) => void;
  onMarkerPress?: (markerId: string) => void;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface MarkerConfig {
  id: string;
  coordinate: Coordinate;
  title?: string;
  description?: string;
  icon?: string;
}

export interface Route {
  coordinates: Coordinate[];
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinate: Coordinate;
}
```

### 7. **Performance Architecture**

#### **Caching Strategy**
```typescript
class TileCache {
  private cache: Map<string, TileData> = new Map();
  private maxSize = 100; // MB
  
  async getTile(tileKey: string): Promise<TileData | null> {
    if (this.cache.has(tileKey)) {
      return this.cache.get(tileKey)!;
    }
    
    const tileData = await this.fetchTile(tileKey);
    this.cache.set(tileKey, tileData);
    
    if (this.getCacheSize() > this.maxSize) {
      this.evictOldestTiles();
    }
    
    return tileData;
  }
}
```

## Integration Points

### 1. **MapLibre GL Native Integration**
- iOS: CocoaPods dependency
- Android: Gradle dependency
- Custom styling support
- Vector tile rendering

### 2. **OpenMapTiles Integration**
- Default tile server configuration
- Custom tile server support
- Offline tile caching
- Style customization

### 3. **OSRM Integration**
- Public OSRM server by default
- Custom OSRM server configuration
- Multiple routing profiles
- Route optimization

### 4. **Expo Integration**
- Config plugin for native dependencies
- Development build compatibility
- Expo Go limitations handling
- TypeScript support

## Security & Privacy

- No API keys required for basic functionality
- Optional API key support for premium tile servers
- Location permission handling
- Data privacy compliance (GDPR)
- Secure communication with external services

## Scalability Considerations

- Modular service architecture
- Configurable tile servers
- Efficient caching mechanisms
- Memory management optimization
- Network request optimization

This architecture provides a solid foundation for building a comprehensive OSM-based SDK that meets all the requirements outlined in your context document while maintaining performance, scalability, and ease of integration with Expo projects. 