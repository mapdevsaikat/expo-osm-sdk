import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { OSMViewProps, OSMViewRef, Coordinate, MapRegion } from '../types';

/**
 * Enhanced Expo Go Fallback Component
 * 
 * Provides an interactive map-like experience in Expo Go:
 * - Visual coordinate grid
 * - Interactive marker placement
 * - Manual location input
 * - Mock map interactions
 * - Testing utilities for developers
 */
const ExpoGoFallback = forwardRef<OSMViewRef, OSMViewProps>(({
  style,
  initialCenter = { latitude: 40.7128, longitude: -74.0060 },
  initialZoom = 10,
  markers = [],
  polylines = [],
  polygons = [],
  circles = [],
  showUserLocation = false,
  onMapReady,
  onRegionChange,
  onMarkerPress,
  onPress,
  children
}, ref) => {
  const [currentCenter, setCurrentCenter] = useState(initialCenter);
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const [mockMarkers, setMockMarkers] = useState(markers);
  const [coordinateInput, setCoordinateInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const { width, height } = Dimensions.get('window');
  const gridSize = 20; // Grid cell size in pixels

  // Process children to extract markers (same as native)
  const processedData = React.useMemo(() => {
    if (!children) return { markers };

    const extractedMarkers = [...markers];
    React.Children.forEach(children, (child, index) => {
      if (!React.isValidElement(child)) return;
      const childType = child.type as any;
      const displayName = childType?.displayName || childType?.name;
      const props = child.props as any;

      if (displayName === 'Marker') {
        extractedMarkers.push({
          id: props.id || `marker-${index}`,
          ...props,
        });
      }
    });

    return { markers: extractedMarkers };
  }, [children]);

  // Initialize map ready
  useEffect(() => {
    const timer = setTimeout(() => {
      onMapReady?.();
    }, 500);
    return () => clearTimeout(timer);
  }, [onMapReady]);

  // Mock coordinate grid rendering
  const renderCoordinateGrid = () => {
    const gridItems = [];
    const cellsX = Math.floor(width / gridSize);
    const cellsY = Math.floor(height / gridSize);

    for (let x = 0; x < cellsX; x++) {
      for (let y = 0; y < cellsY; y++) {
        const lat = currentCenter.latitude + (y - cellsY/2) * (0.01 / currentZoom);
        const lng = currentCenter.longitude + (x - cellsX/2) * (0.01 / currentZoom);
        
        gridItems.push(
          <TouchableOpacity
            key={`${x}-${y}`}
            style={[
              styles.gridCell,
              {
                left: x * gridSize,
                top: y * gridSize,
                width: gridSize,
                height: gridSize,
              }
            ]}
            onPress={() => handleGridPress({ latitude: lat, longitude: lng })}
            activeOpacity={0.3}
          >
            {((x + y) % 4 === 0) && (
              <Text style={styles.coordinateText}>
                {lat.toFixed(2)},{lng.toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>
        );
      }
    }
    return gridItems;
  };

  const handleGridPress = (coordinate: Coordinate) => {
    onPress?.(coordinate);
    
    // Add a marker at the pressed location
    const newMarker = {
      id: `mock-marker-${Date.now()}`,
      coordinate,
      title: `Marker at ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      description: 'Tapped in Expo Go fallback'
    };
    
    setMockMarkers(prev => [...prev, newMarker]);
  };

  const handleMarkerPress = (marker: any) => {
    if (!marker.coordinate || typeof marker.coordinate.latitude !== 'number' || typeof marker.coordinate.longitude !== 'number') {
      return;
    }
    
    onMarkerPress?.(marker.id, marker.coordinate);
    Alert.alert(
      marker.title || 'Marker',
      marker.description || `Lat: ${marker.coordinate.latitude.toFixed(4)}\nLng: ${marker.coordinate.longitude.toFixed(4)}`
    );
  };

  const parseCoordinateInput = (input: string): Coordinate | null => {
    const parts = input.split(',');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    
    if (isNaN(lat) || isNaN(lng)) return null;
    
    return { latitude: lat, longitude: lng };
  };

  const handleGoToCoordinate = () => {
    const coord = parseCoordinateInput(coordinateInput);
    if (coord) {
      setCurrentCenter(coord);
      const region: MapRegion = {
        latitude: coord.latitude,
        longitude: coord.longitude,
        latitudeDelta: 0.1 / currentZoom,
        longitudeDelta: 0.1 / currentZoom
      };
      onRegionChange?.(region);
      setCoordinateInput('');
      Alert.alert('Success', `Moved to ${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`);
    } else {
      Alert.alert('Invalid Input', 'Please enter coordinates as: latitude, longitude\nExample: 40.7128, -74.0060');
    }
  };

  // Imperative API methods (mock implementations for testing)
  useImperativeHandle(ref, () => ({
    zoomIn: async () => {
      const newZoom = Math.min(currentZoom + 1, 18);
      setCurrentZoom(newZoom);
      console.log(`🔍 Mock Zoom In: ${newZoom}`);
    },
    zoomOut: async () => {
      const newZoom = Math.max(currentZoom - 1, 1);
      setCurrentZoom(newZoom);
      console.log(`🔍 Mock Zoom Out: ${newZoom}`);
    },
    setZoom: async (zoom: number) => {
      setCurrentZoom(Math.max(1, Math.min(18, zoom)));
      console.log(`🔍 Mock Set Zoom: ${zoom}`);
    },
    animateToLocation: async (latitude: number, longitude: number, zoom?: number) => {
      const newCenter = { latitude, longitude };
      setCurrentCenter(newCenter);
      if (zoom) setCurrentZoom(zoom);
      console.log(`📍 Mock Animate to: ${latitude}, ${longitude}`);
    },
    animateToRegion: async (region: MapRegion) => {
      setCurrentCenter({ latitude: region.latitude, longitude: region.longitude });
      console.log(`📍 Mock Animate to region: ${region.latitude}, ${region.longitude}`);
    },
    getCurrentLocation: async () => {
      console.log('📍 Mock Get Current Location');
      return {
        ...currentCenter,
        timestamp: Date.now(),
        source: 'map-center' as const
      };
    },
    fitToMarkers: async () => {
      console.log('📍 Mock Fit to Markers');
    },
    addMarker: async (marker: any) => {
      setMockMarkers(prev => [...prev, marker]);
      console.log('📌 Mock Add Marker:', marker.id);
    },
    removeMarker: async (markerId: string) => {
      setMockMarkers(prev => prev.filter(m => m.id !== markerId));
      console.log('📌 Mock Remove Marker:', markerId);
    },
    updateMarker: async (markerId: string, updates: any) => {
      setMockMarkers(prev => prev.map(m => m.id === markerId ? { ...m, ...updates } : m));
      console.log('📌 Mock Update Marker:', markerId);
    },
    // Stubs for other methods
    startLocationTracking: async () => console.log('📍 Mock Start Location Tracking'),
    stopLocationTracking: async () => console.log('📍 Mock Stop Location Tracking'),
    waitForLocation: async () => ({
      ...currentCenter,
      timestamp: Date.now(),
      source: 'map-center' as const
    }),
    showInfoWindow: async () => console.log('📌 Mock Show Info Window'),
    hideInfoWindow: async () => console.log('📌 Mock Hide Info Window'),
    addPolyline: async () => console.log('📐 Mock Add Polyline'),
    removePolyline: async () => console.log('📐 Mock Remove Polyline'),
    updatePolyline: async () => console.log('📐 Mock Update Polyline'),
    addPolygon: async () => console.log('📐 Mock Add Polygon'),
    removePolygon: async () => console.log('📐 Mock Remove Polygon'),
    updatePolygon: async () => console.log('📐 Mock Update Polygon'),
    addCircle: async () => console.log('⭕ Mock Add Circle'),
    removeCircle: async () => console.log('⭕ Mock Remove Circle'),
    updateCircle: async () => console.log('⭕ Mock Update Circle'),
    addOverlay: async () => console.log('🗺️ Mock Add Overlay'),
    removeOverlay: async () => console.log('🗺️ Mock Remove Overlay'),
    updateOverlay: async () => console.log('🗺️ Mock Update Overlay'),
    animateMarker: async () => console.log('🎬 Mock Animate Marker'),
    coordinateForPoint: async () => ({ latitude: 0, longitude: 0 }),
    pointForCoordinate: async () => ({ x: 0, y: 0 }),
    takeSnapshot: async () => 'mock-snapshot-data',
    
    // Layer controls
    setBaseLayer: async (layerId: string, layerConfig: any) => {
      console.log('🗺️ Mock setBaseLayer:', layerId, layerConfig);
    },
    addLayer: async (layerConfig: any) => {
      console.log('🗺️ Mock addLayer:', layerConfig);
    },
    removeLayer: async (layerId: string) => {
      console.log('🗺️ Mock removeLayer:', layerId);
    },
    toggleLayer: async (layerId: string, visible: boolean) => {
      console.log('🗺️ Mock toggleLayer:', layerId, visible);
    },
    setLayerOpacity: async (layerId: string, opacity: number) => {
      console.log('🗺️ Mock setLayerOpacity:', layerId, opacity);
    },
    getActiveLayers: async () => {
      console.log('🗺️ Mock getActiveLayers');
      return ['mock-base-layer'];
    },
    getLayerInfo: async (layerId: string) => {
      console.log('🗺️ Mock getLayerInfo:', layerId);
      return null;
    },
    
    // Pitch & Bearing controls (fallback implementations)
    setPitch: async (pitch: number) => {
      console.log('🎯 ExpoGoFallback: setPitch called - not implemented');
    },
    setBearing: async (bearing: number) => {
      console.log('🧭 ExpoGoFallback: setBearing called - not implemented');
    },
    getPitch: async () => {
      console.log('🎯 ExpoGoFallback: getPitch called - not implemented');
      return 0;
    },
    getBearing: async () => {
      console.log('🧭 ExpoGoFallback: getBearing called - not implemented');
      return 0;
    },
  }), []);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Expo Go Map Simulator</Text>
        <Text style={styles.subtitle}>
          Center: {currentCenter.latitude.toFixed(4)}, {currentCenter.longitude.toFixed(4)} | Zoom: {currentZoom}
        </Text>
      </View>

      {/* Map Area */}
      <View style={styles.mapArea}>
        {renderCoordinateGrid()}
        
        {/* Render mock markers */}
        {[...processedData.markers, ...mockMarkers].map((marker, index) => (
          <TouchableOpacity
            key={marker.id || index}
            style={[
              styles.mockMarker,
              {
                left: Math.random() * (width - 40) + 20, // Mock positioning
                top: Math.random() * (height * 0.6) + 100,
              }
            ]}
            onPress={() => handleMarkerPress(marker)}
          >
            <Text style={styles.markerIcon}>📍</Text>
            <Text style={styles.markerText}>{marker.title || marker.id}</Text>
          </TouchableOpacity>
        ))}

        {/* Center crosshair */}
        <View style={styles.crosshair}>
          <Text style={styles.crosshairText}>⊕</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.zoomControls}>
          <TouchableOpacity 
            style={styles.zoomButton} 
            onPress={() => setCurrentZoom(Math.min(currentZoom + 1, 18))}
          >
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.zoomButton} 
            onPress={() => setCurrentZoom(Math.max(currentZoom - 1, 1))}
          >
            <Text style={styles.zoomButtonText}>-</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.coordinateInput}>
          <TextInput
            style={styles.textInput}
            placeholder="Lat, Lng (e.g., 40.7128, -74.0060)"
            value={coordinateInput}
            onChangeText={setCoordinateInput}
            returnKeyType="go"
            onSubmitEditing={handleGoToCoordinate}
          />
          <TouchableOpacity style={styles.goButton} onPress={handleGoToCoordinate}>
            <Text style={styles.goButtonText}>Go</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.instructions}>
          🎯 Tap grid cells to add markers
          {'\n'}📱 Use coordinate input to navigate
          {'\n'}🔍 Use zoom controls for scale
          {'\n'}✨ All ref methods log to console
        </Text>
      </View>
    </View>
  );
});

ExpoGoFallback.displayName = 'ExpoGoFallback';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#bfdbfe',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e0f2fe',
  },
  gridCell: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: '#0891b2',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coordinateText: {
    fontSize: 6,
    color: '#164e63',
    textAlign: 'center',
  },
  mockMarker: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 20,
  },
  markerText: {
    fontSize: 10,
    color: '#374151',
    maxWidth: 80,
    textAlign: 'center',
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  crosshairText: {
    fontSize: 24,
    color: '#dc2626',
  },
  controls: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  zoomButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  zoomButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  coordinateInput: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
  },
  goButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  goButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export { ExpoGoFallback }; 