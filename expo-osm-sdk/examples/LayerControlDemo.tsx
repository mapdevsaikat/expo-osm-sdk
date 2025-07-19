import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  OSMView,
  LayerControl,
  Marker,
  BUILT_IN_LAYERS,
  type OSMViewRef,
  type LayerConfig,
} from 'expo-osm-sdk';

/**
 * LayerControl Demo
 * 
 * Demonstrates the powerful layer switching capabilities of expo-osm-sdk.
 * Shows how developers can give users complete control over map layers.
 */
export default function LayerControlDemo() {
  const mapRef = useRef<OSMViewRef>(null);
  const [currentLayer, setCurrentLayer] = useState('carto-vector');
  const [showLayerControl, setShowLayerControl] = useState(true);

  // Sample markers for testing
  const markers = [
    {
      id: 'marker1',
      coordinate: { latitude: 40.7128, longitude: -74.0060 },
      title: 'New York City',
      description: 'The Big Apple'
    },
    {
      id: 'marker2',
      coordinate: { latitude: 34.0522, longitude: -118.2437 },
      title: 'Los Angeles',
      description: 'City of Angels'
    },
    {
      id: 'marker3',
      coordinate: { latitude: 41.8781, longitude: -87.6298 },
      title: 'Chicago',
      description: 'Windy City'
    }
  ];

  // Custom layers example
  const customLayers: LayerConfig[] = [
    ...BUILT_IN_LAYERS,
    {
      id: 'custom-raster',
      name: 'Watercolor',
      type: 'raster',
      url: 'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png',
      attribution: '© Stamen Design, © OpenStreetMap contributors',
      maxZoom: 16,
      isBaseLayer: true,
      description: 'Artistic watercolor-style mapping'
    },
    {
      id: 'traffic-overlay',
      name: 'Traffic',
      type: 'custom',
      url: '', // Would be implemented with traffic data
      isBaseLayer: false,
      description: 'Real-time traffic information overlay'
    },
    {
      id: 'weather-overlay',
      name: 'Weather',
      type: 'custom',
      url: '', // Would be implemented with weather data
      isBaseLayer: false,
      description: 'Weather radar overlay'
    }
  ];

  const handleBaseLayerChange = async (layerId: string, layer: LayerConfig) => {
    console.log('🗺️ Switching base layer to:', layer.name);
    setCurrentLayer(layerId);
    
    try {
      if (mapRef.current) {
        await mapRef.current.setBaseLayer(layerId, layer);
        Alert.alert('Layer Changed', `Switched to ${layer.name}`);
      }
    } catch (error) {
      console.error('Failed to switch layer:', error);
      Alert.alert('Error', 'Failed to switch layer');
    }
  };

  const handleOverlayToggle = async (layerId: string, layer: LayerConfig, visible: boolean) => {
    console.log(`🔄 ${visible ? 'Enabling' : 'Disabling'} overlay:`, layer.name);
    
    try {
      if (mapRef.current) {
        await mapRef.current.toggleLayer(layerId, visible);
        Alert.alert(
          'Overlay Toggle',
          `${layer.name} ${visible ? 'enabled' : 'disabled'}`
        );
      }
    } catch (error) {
      console.error('Failed to toggle overlay:', error);
      Alert.alert('Error', 'Failed to toggle overlay');
    }
  };

  const handleMapReady = () => {
    console.log('🗺️ Map is ready!');
  };

  const testLayerMethods = async () => {
    if (!mapRef.current) return;

    try {
      // Test getting active layers
      const activeLayers = await mapRef.current.getActiveLayers();
      console.log('Active layers:', activeLayers);

      // Test getting layer info
      const layerInfo = await mapRef.current.getLayerInfo(currentLayer);
      console.log('Current layer info:', layerInfo);

      Alert.alert(
        'Layer Info',
        `Active: ${activeLayers.join(', ')}\n\nCurrent: ${layerInfo?.name || 'Unknown'}`
      );
    } catch (error) {
      console.error('Failed to get layer info:', error);
    }
  };

  const demonstrateLayerOpacity = async () => {
    if (!mapRef.current) return;

    try {
      // Demonstrate opacity control
      await mapRef.current.setLayerOpacity(currentLayer, 0.5);
      
      setTimeout(async () => {
        await mapRef.current?.setLayerOpacity(currentLayer, 1.0);
      }, 2000);

      Alert.alert('Opacity Demo', 'Layer opacity will change for 2 seconds');
    } catch (error) {
      console.error('Failed to change opacity:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Layer Control Demo</Text>
        <Text style={styles.subtitle}>
          Switch between raster and vector tiles • Control overlays
        </Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <OSMView
          ref={mapRef}
          style={styles.map}
          initialCenter={{ latitude: 39.8283, longitude: -98.5795 }} // Center of USA
          initialZoom={4}
          markers={markers}
          onMapReady={handleMapReady}
          showUserLocation={true}
        >
          {markers.map(marker => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
            />
          ))}
        </OSMView>

        {/* Layer Control */}
        {showLayerControl && (
          <LayerControl
            mapRef={mapRef}
            layers={customLayers}
            activeBaseLayer={currentLayer}
            position="top-right"
            onBaseLayerChange={handleBaseLayerChange}
            onOverlayToggle={handleOverlayToggle}
            showDescriptions={true}
            defaultCollapsed={false}
            title="Map Layers"
          />
        )}
      </View>

      {/* Controls */}
      <ScrollView style={styles.controls} horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => setShowLayerControl(!showLayerControl)}
        >
          <Text style={styles.buttonText}>
            {showLayerControl ? 'Hide' : 'Show'} Layer Control
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={testLayerMethods}
        >
          <Text style={styles.buttonTextSecondary}>Test Layer API</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={demonstrateLayerOpacity}
        >
          <Text style={styles.buttonTextSecondary}>Opacity Demo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => mapRef.current?.fitToMarkers()}
        >
          <Text style={styles.buttonTextSecondary}>Fit to Markers</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>🎯 What This Demo Shows:</Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Base Layer Switching:</Text> Toggle between raster and vector tiles{'\n'}
          • <Text style={styles.bold}>Overlay Management:</Text> Add weather, traffic, and custom overlays{'\n'}
          • <Text style={styles.bold}>Developer Control:</Text> Full programmatic API for layer management{'\n'}
          • <Text style={styles.bold}>Cross-Platform:</Text> Works on native, web, and Expo Go
        </Text>
        
        <View style={styles.currentLayerInfo}>
          <Text style={styles.currentLayerText}>
            Current Layer: <Text style={styles.bold}>{customLayers.find(l => l.id === currentLayer)?.name}</Text>
          </Text>
          <Text style={styles.layerType}>
            Type: {customLayers.find(l => l.id === currentLayer)?.type.toUpperCase()}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e40af',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  controls: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    maxHeight: 80,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonTextSecondary: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  infoPanel: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '600',
  },
  currentLayerInfo: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  currentLayerText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
  },
  layerType: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
}); 