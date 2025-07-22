# 🗺️ MapLibre GL JS Web Integration Roadmap

## Why MapLibre GL JS is Perfect for expo-osm-sdk

MapLibre GL JS is the **ideal web mapping solution** for your SDK because:

- 🎯 **Technology Alignment**: Same vector tile technology as your native implementation
- 🆓 **Open Source**: No vendor lock-in, perfect for OSM-focused SDK
- ⚡ **High Performance**: WebGL rendering with 60fps animations
- 🎨 **Style Compatibility**: Can use same map styles across platforms
- 🔧 **Feature Completeness**: Full support for markers, overlays, events, clustering

## 📋 Implementation Plan

### Phase 1: Basic MapLibre Integration (v1.1.0)
**Timeline**: 1-2 weeks
**Goal**: Replace fallback UI with actual interactive maps

#### 1.1 Enhanced OSMView.web.tsx
```tsx
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const OSMView = forwardRef<OSMViewRef, OSMViewProps>((props, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [{
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }]
        },
        center: [props.initialCenter?.longitude || 0, props.initialCenter?.latitude || 0],
        zoom: props.initialZoom || 10
      });
      
      // Call onMapReady when map loads
      map.current.on('load', () => {
        props.onMapReady?.();
      });
    }
  }, []);
  
  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
});
```

#### 1.2 Peer Dependencies Setup
```json
{
  "peerDependencies": {
    "maplibre-gl": ">=3.0.0"
  },
  "peerDependenciesMeta": {
    "maplibre-gl": {
      "optional": true
    }
  }
}
```

#### 1.3 Smart Detection
```tsx
// Auto-detect if MapLibre is available
const hasMapLibre = typeof window !== 'undefined' && 
                   typeof require !== 'undefined' && 
                   (() => {
                     try {
                       require('maplibre-gl');
                       return true;
                     } catch {
                       return false;
                     }
                   })();

if (hasMapLibre) {
  return <MapLibreOSMView {...props} />;
} else {
  return <FallbackOSMView {...props} />; // Current v1.0.85 implementation
}
```

### Phase 2: Feature Parity (v1.2.0)
**Timeline**: 2-3 weeks
**Goal**: Match native functionality on web

#### 2.1 Markers Support
```tsx
// Add markers to MapLibre map
useEffect(() => {
  if (!map.current || !props.markers) return;
  
  // Clear existing markers
  markers.current.forEach(marker => marker.remove());
  markers.current = [];
  
  // Add new markers
  props.markers.forEach(markerConfig => {
    const marker = new maplibregl.Marker()
      .setLngLat([markerConfig.coordinate.longitude, markerConfig.coordinate.latitude])
      .addTo(map.current!);
    
    marker.getElement().addEventListener('click', () => {
      props.onMarkerPress?.(markerConfig.id, markerConfig.coordinate);
    });
    
    markers.current.push(marker);
  });
}, [props.markers]);
```

#### 2.2 Polylines & Polygons
```tsx
// Add polylines support
useEffect(() => {
  if (!map.current || !props.polylines) return;
  
  props.polylines.forEach(polyline => {
    map.current!.addSource(polyline.id, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: polyline.coordinates.map(c => [c.longitude, c.latitude])
        }
      }
    });
    
    map.current!.addLayer({
      id: polyline.id,
      type: 'line',
      source: polyline.id,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': polyline.strokeColor || '#000000',
        'line-width': polyline.strokeWidth || 2
      }
    });
  });
}, [props.polylines]);
```

#### 2.3 Event Handling
```tsx
// Map events
useEffect(() => {
  if (!map.current) return;
  
  const handleClick = (e: maplibregl.MapMouseEvent) => {
    props.onPress?.({
      latitude: e.lngLat.lat,
      longitude: e.lngLat.lng
    });
  };
  
  const handleMove = () => {
    const center = map.current!.getCenter();
    const zoom = map.current!.getZoom();
    
    props.onRegionChange?.({
      latitude: center.lat,
      longitude: center.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    });
  };
  
  map.current.on('click', handleClick);
  map.current.on('moveend', handleMove);
  
  return () => {
    map.current?.off('click', handleClick);
    map.current?.off('moveend', handleMove);
  };
}, [props.onPress, props.onRegionChange]);
```

### Phase 3: Advanced Features (v1.3.0)
**Timeline**: 3-4 weeks
**Goal**: Advanced web-specific features

#### 3.1 Vector Tile Styles
```tsx
// Support for custom vector tile styles
const style = props.tileServerUrl ? {
  version: 8,
  sources: {
    'vector-tiles': {
      type: 'vector',
      tiles: [props.tileServerUrl]
    }
  },
  layers: [
    // Custom style layers
  ]
} : defaultOSMStyle;
```

#### 3.2 Clustering
```tsx
// Add clustering support
map.current.addSource('markers', {
  type: 'geojson',
  data: markersGeoJSON,
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50
});
```

#### 3.3 User Location
```tsx
// Add user location support
if (props.showUserLocation) {
  const geolocate = new maplibregl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: props.followUserLocation
  });
  
  map.current.addControl(geolocate);
}
```

## 📊 Benefits of MapLibre Integration

### Developer Experience
```tsx
// Same component, works everywhere!
<OSMView
  initialCenter={{ latitude: 22.57, longitude: 88.36 }}
  markers={markers}
  onPress={handleMapPress}
  showUserLocation={true}
/>
```

**Mobile**: Native high-performance maps
**Web**: MapLibre GL JS interactive maps
**Fallback**: Safe UI if MapLibre not installed

### Technical Benefits
- ✅ **Consistent API** across all platforms
- ✅ **No breaking changes** - backward compatible
- ✅ **Optional dependency** - developers choose
- ✅ **Progressive enhancement** - works without MapLibre
- ✅ **Bundle optimization** - only loads when needed

## 🛠️ Developer Setup Options

### Option 1: Automatic (Recommended)
```bash
npm install expo-osm-sdk maplibre-gl
# Maps automatically work on web!
```

### Option 2: Explicit Control
```tsx
import { OSMView } from 'expo-osm-sdk';

<OSMView 
  webMapProvider="maplibre"  // 'maplibre' | 'fallback'
  // ... other props
/>
```

### Option 3: Custom Styles
```tsx
<OSMView
  webMapStyle={{
    version: 8,
    sources: { /* custom sources */ },
    layers: [ /* custom layers */ ]
  }}
/>
```

## 🎯 Implementation Priority

1. **v1.0.85 (Current)**: ✅ Safe fallback, plugin, docs
2. **v1.1.0 (Next)**: 🚀 Basic MapLibre integration
3. **v1.2.0**: 📍 Full feature parity (markers, overlays)
4. **v1.3.0**: ⚡ Advanced features (clustering, vector styles)

## 🤔 Questions for You

1. **Timeline**: When would you like MapLibre integration?
2. **Approach**: Automatic detection or explicit configuration?
3. **Features**: Which features are most important for web?
4. **Styling**: Default OSM style or custom vector styles?

---

**Ready to make your SDK truly universal?** 🌍
MapLibre GL JS would make expo-osm-sdk the **first truly cross-platform** OSM SDK for Expo! 🚀 