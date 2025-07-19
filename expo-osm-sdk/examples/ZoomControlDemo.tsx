import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import {
  OSMView,
  ZoomControl,
  LayerControl,
  UserLocationButton,
  Marker,
  type OSMViewRef,
} from 'expo-osm-sdk';

/**
 * ZoomControl Demo
 * 
 * Demonstrates the comprehensive zoom control capabilities of expo-osm-sdk.
 * Shows different themes, positions, and configurations.
 */
export default function ZoomControlDemo() {
  const mapRef = useRef<OSMViewRef>(null);
  const [showZoomLevel, setShowZoomLevel] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [position, setPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showControls, setShowControls] = useState({
    zoom: true,
    layer: true,
    location: true,
  });

  // Sample markers
  const markers = [
    {
      id: 'marker1',
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      title: 'San Francisco',
      description: 'Golden Gate City'
    },
    {
      id: 'marker2',
      coordinate: { latitude: 40.7128, longitude: -74.0060 },
      title: 'New York City',
      description: 'The Big Apple'
    },
    {
      id: 'marker3',
      coordinate: { latitude: 51.5074, longitude: -0.1278 },
      title: 'London',
      description: 'Big Ben & Thames'
    }
  ];

  const handleZoomChange = (zoom: number) => {
    setCurrentZoom(zoom);
    console.log(`🔍 Zoom changed to: ${zoom}`);
  };

  const handleMapReady = () => {
    console.log('🗺️ Map is ready!');
  };

  const testZoomMethods = async () => {
    if (!mapRef.current) return;

    try {
      Alert.alert('Zoom Demo', 'Watch the zoom controls in action!');
      
      // Zoom in sequence
      await mapRef.current.setZoom(5);
      setTimeout(async () => {
        await mapRef.current?.setZoom(10);
        setTimeout(async () => {
          await mapRef.current?.setZoom(15);
          setTimeout(async () => {
            await mapRef.current?.setZoom(10);
          }, 1000);
        }, 1000);
      }, 1000);
    } catch (error) {
      console.error('Zoom demo failed:', error);
    }
  };

  const fitToMarkers = async () => {
    if (!mapRef.current) return;
    
    try {
      await mapRef.current.fitToMarkers(undefined, 50);
      Alert.alert('Success', 'Fitted map to show all markers');
    } catch (error) {
      console.error('Fit to markers failed:', error);
    }
  };

  const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
  const sizes = ['small', 'medium', 'large'] as const;
  const themes = ['light', 'dark'] as const;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Zoom Control Demo</Text>
        <Text style={styles.subtitle}>
          Interactive zoom controls • Customizable positioning and themes
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
          showUserLocation={false}
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

        {/* Zoom Control */}
        {showControls.zoom && (
          <ZoomControl
            mapRef={mapRef}
            position={position}
            showZoomLevel={showZoomLevel}
            onZoomChange={handleZoomChange}
            size={size}
            theme={theme}
            minZoom={1}
            maxZoom={18}
            zoomStep={1}
            animateZoom={true}
            disableAtLimits={true}
          />
        )}

        {/* Layer Control (positioned to avoid zoom control) */}
        {showControls.layer && (
          <LayerControl
            mapRef={mapRef}
            position={position === 'top-right' ? 'top-left' : 'top-right'}
            defaultCollapsed={true}
            showDescriptions={false}
          />
        )}

        {/* User Location Button */}
        {showControls.location && (
          <UserLocationButton
            mapRef={mapRef}
            style={{
              position: 'absolute',
              top: position.includes('top') ? 20 : undefined,
              bottom: position.includes('bottom') ? 120 : undefined,
              left: position.includes('left') ? 20 : undefined,
              right: position.includes('right') ? 20 : undefined,
            }}
            size="medium"
            variant="filled"
          />
        )}
      </View>

      {/* Controls Panel */}
      <ScrollView style={styles.controlPanel} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>🎛️ Control Configuration</Text>
        
        {/* Current Zoom Display */}
        <View style={styles.configSection}>
          <Text style={styles.configLabel}>Current Zoom Level</Text>
          <View style={styles.zoomDisplay}>
            <Text style={styles.zoomText}>{currentZoom.toFixed(1)}</Text>
          </View>
        </View>

        {/* Show Zoom Level Toggle */}
        <View style={styles.configSection}>
          <Text style={styles.configLabel}>Show Zoom Level</Text>
          <Switch
            value={showZoomLevel}
            onValueChange={setShowZoomLevel}
            trackColor={{ false: '#767577', true: '#3b82f6' }}
            thumbColor={showZoomLevel ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        {/* Theme Selection */}
        <View style={styles.configSection}>
          <Text style={styles.configLabel}>Theme</Text>
          <View style={styles.buttonGroup}>
            {themes.map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.optionButton,
                  theme === t && styles.optionButtonActive,
                ]}
                onPress={() => setTheme(t)}
              >
                <Text style={[
                  styles.optionButtonText,
                  theme === t && styles.optionButtonTextActive,
                ]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Position Selection */}
        <View style={styles.configSection}>
          <Text style={styles.configLabel}>Position</Text>
          <View style={styles.buttonGroup}>
            {positions.map(pos => (
              <TouchableOpacity
                key={pos}
                style={[
                  styles.optionButton,
                  position === pos && styles.optionButtonActive,
                ]}
                onPress={() => setPosition(pos)}
              >
                <Text style={[
                  styles.optionButtonText,
                  position === pos && styles.optionButtonTextActive,
                ]}>
                  {pos.replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Size Selection */}
        <View style={styles.configSection}>
          <Text style={styles.configLabel}>Size</Text>
          <View style={styles.buttonGroup}>
            {sizes.map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.optionButton,
                  size === s && styles.optionButtonActive,
                ]}
                onPress={() => setSize(s)}
              >
                <Text style={[
                  styles.optionButtonText,
                  size === s && styles.optionButtonTextActive,
                ]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Control Visibility */}
        <View style={styles.configSection}>
          <Text style={styles.configLabel}>Visible Controls</Text>
          <View style={styles.switchGroup}>
            <View style={styles.switchItem}>
              <Text style={styles.switchLabel}>Zoom Control</Text>
              <Switch
                value={showControls.zoom}
                onValueChange={(value) => setShowControls(prev => ({ ...prev, zoom: value }))}
                trackColor={{ false: '#767577', true: '#3b82f6' }}
              />
            </View>
            <View style={styles.switchItem}>
              <Text style={styles.switchLabel}>Layer Control</Text>
              <Switch
                value={showControls.layer}
                onValueChange={(value) => setShowControls(prev => ({ ...prev, layer: value }))}
                trackColor={{ false: '#767577', true: '#3b82f6' }}
              />
            </View>
            <View style={styles.switchItem}>
              <Text style={styles.switchLabel}>Location Button</Text>
              <Switch
                value={showControls.location}
                onValueChange={(value) => setShowControls(prev => ({ ...prev, location: value }))}
                trackColor={{ false: '#767577', true: '#3b82f6' }}
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={testZoomMethods}>
            <Text style={styles.actionButtonText}>🎬 Demo Zoom Animation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={fitToMarkers}>
            <Text style={styles.actionButtonText}>📍 Fit to Markers</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>✨ ZoomControl Features:</Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Smart Positioning:</Text> 4 corner positions{'\n'}
          • <Text style={styles.bold}>Theme Support:</Text> Light and dark themes{'\n'}
          • <Text style={styles.bold}>Size Options:</Text> Small, medium, large buttons{'\n'}
          • <Text style={styles.bold}>Zoom Level Display:</Text> Optional current zoom indicator{'\n'}
          • <Text style={styles.bold}>Limit Awareness:</Text> Disabled at min/max zoom{'\n'}
          • <Text style={styles.bold}>Smooth Animations:</Text> Press feedback and transitions
        </Text>
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
    backgroundColor: '#4f46e5',
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
    color: '#c7d2fe',
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  controlPanel: {
    backgroundColor: 'white',
    maxHeight: 200,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  configSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  zoomDisplay: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'monospace',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  optionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  optionButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: 'white',
  },
  switchGroup: {
    gap: 8,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  switchLabel: {
    fontSize: 12,
    color: '#4b5563',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
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
  },
  bold: {
    fontWeight: '600',
  },
}); 