# 📚 Expo OSM SDK Examples

This directory contains comprehensive examples showcasing different features and use cases of the Expo OSM SDK.

## 📂 Examples Overview

### 🚀 **Basic Usage**
- [**BasicMap.tsx**](./BasicMap.tsx) - Simple map with markers
- [**DeclarativeAPI.tsx**](./DeclarativeAPI.tsx) - Using JSX children API
- [**NominatimBasicDemo.tsx**](./NominatimBasicDemo.tsx) - Nominatim search and geocoding features

### 🎮 **Control Components** 
- [**ZoomControlDemo.tsx**](./ZoomControlDemo.tsx) - Zoom control component usage
- [**PitchBearingDemo.tsx**](./PitchBearingDemo.tsx) - Pitch & bearing controls with compass
- [**LayerControlDemo.tsx**](./LayerControlDemo.tsx) - Layer switching interface

### 🎯 **Advanced Features**
- [**OverlayShowcase.tsx**](./OverlayShowcase.tsx) - Polylines, polygons, circles
- [**ClusteringDemo.tsx**](./ClusteringDemo.tsx) - Smart marker clustering
- [**LocationTracking.tsx**](./LocationTracking.tsx) - GPS and location services
- [**SearchIntegration.tsx**](./SearchIntegration.tsx) - Nominatim search integration

### 🏗️ **Real-World Apps**
- [**DeliveryTracker.tsx**](./DeliveryTracker.tsx) - Delivery tracking app
- [**TourGuide.tsx**](./TourGuide.tsx) - Interactive tour guide
- [**PropertyMap.tsx**](./PropertyMap.tsx) - Real estate property map
- [**EventLocator.tsx**](./EventLocator.tsx) - Event location finder

### 🔧 **Integration Examples**
- [**ReactNavigation.tsx**](./ReactNavigation.tsx) - React Navigation integration
- [**StateManagement.tsx**](./StateManagement.tsx) - Redux/Zustand integration
- [**CustomThemes.tsx**](./CustomThemes.tsx) - Custom map themes
- [**PerformanceOptimized.tsx**](./PerformanceOptimized.tsx) - Performance best practices

## 🚀 How to Use These Examples

### 1. Copy Example to Your Project
```bash
# Copy any example file to your project
cp expo-osm-sdk/examples/BasicMap.tsx ./src/components/
```

### 2. Install Required Dependencies
```bash
# Most examples require these dependencies
npm install expo-osm-sdk react-native-vector-icons
```

### 3. Import and Use
```tsx
import React from 'react';
import BasicMap from './components/BasicMap';

export default function App() {
  return <BasicMap />;
}
```

## 📱 Example Categories

### 🎯 **Beginner Examples**
Perfect for getting started:
- BasicMap.tsx
- DeclarativeAPI.tsx
- NominatimBasicDemo.tsx

### 🎨 **Intermediate Examples**
For adding more functionality:
- OverlayShowcase.tsx
- ClusteringDemo.tsx
- SearchIntegration.tsx

### 🚀 **Advanced Examples**
Real-world application patterns:
- AdvancedGestureDemo.tsx
- DeliveryTracker.tsx
- PropertyMap.tsx
- PerformanceOptimized.tsx

## 💡 Tips for Using Examples

1. **Start Simple**: Begin with BasicMap.tsx and gradually add features
2. **Mix and Match**: Combine features from different examples
3. **Customize**: Modify examples to fit your specific use case
4. **Performance**: Check PerformanceOptimized.tsx for best practices
5. **Testing**: Test examples on physical devices for best experience

## 🔗 Related Resources

- [Main Documentation](../README.md)
- [API Reference](../API.md)
- [TypeScript Definitions](../src/types/index.ts)
- [Troubleshooting Guide](../TROUBLESHOOTING.md)

---

*Each example includes detailed comments explaining the implementation and best practices.* 