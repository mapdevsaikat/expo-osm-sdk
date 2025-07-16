import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Platform, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { OSMView, OSMViewRef } from 'expo-osm-sdk';

// Temporary types until full implementation
interface SimpleMarkerConfig {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  icon?: string;
}

export default function App() {
  const [nativeSupport, setNativeSupport] = useState<boolean | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [markerCount, setMarkerCount] = useState(3);
  const mapRef = useRef<OSMViewRef>(null);
  
  // Simple markers for current implementation
  const [markers, setMarkers] = useState<SimpleMarkerConfig[]>([
    {
      id: 'marker1',
      coordinate: { latitude: 37.7849, longitude: -122.4094 },
      title: 'Golden Gate Park',
      description: 'Beautiful park with museums and gardens',
      icon: 'park'
    },
    {
      id: 'marker2',
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      title: 'Downtown SF',
      description: 'City center',
      icon: 'building'
    },
    {
      id: 'marker3',
      coordinate: { latitude: 37.7849, longitude: -122.4294 },
      title: 'Ocean Beach',
      description: 'Beautiful beach on the Pacific',
      icon: 'beach'
    }
  ]);
  
  useEffect(() => {
    console.log('🚀 Enhanced Map Test App Starting...');
    console.log('📱 Platform:', Platform.OS);
    
    // Better native module detection using Constants like OSMView
    const hasExpoModules = !!(global as any).ExpoModules;
    
    // Improved Expo Go detection using Constants.executionEnvironment
    let isExpoGo = false;
    try {
      const Constants = require('expo-constants').default;
      isExpoGo = Constants.executionEnvironment === 'expoGo';
    } catch {
      isExpoGo = !!(global as any).expo;
    }
    
    console.log('🔧 ExpoModules available:', hasExpoModules);
    console.log('📦 Running in Expo Go:', isExpoGo);
    console.log('🏗️ Native modules supported:', !isExpoGo);
    console.log('🗺️ OSMView component:', typeof OSMView);
    
    setNativeSupport(!isExpoGo);
  }, []);

  const handleMapPress = (coordinate: any) => {
    setTapCount(prev => prev + 1);
    console.log('🎯 Map tapped at:', coordinate);
  };

  const handleMarkerPress = (markerId: string) => {
    console.log('📍 Marker pressed:', markerId);
    Alert.alert('Marker Pressed', `Marker ${markerId} was pressed`);
  };

  const handleMarkerDrag = (markerId: string, coordinate: any) => {
    console.log('🔄 Marker dragged:', markerId, coordinate);
    // Update marker position
    setMarkers(prev => prev.map(m => 
      m.id === markerId ? { ...m, coordinate } : m
    ));
  };

  const handleInfoWindowPress = (markerId: string) => {
    console.log('ℹ️ Info window pressed:', markerId);
    Alert.alert('Info Window', `Info window for marker ${markerId} pressed`);
  };

  // Zoom control functions
  const handleZoomIn = async () => {
    try {
      await mapRef.current?.zoomIn();
      console.log('🔍 Zoom In executed');
    } catch (error) {
      console.error('❌ Zoom In failed:', error);
    }
  };

  const handleZoomOut = async () => {
    try {
      await mapRef.current?.zoomOut();
      console.log('🔍 Zoom Out executed');
    } catch (error) {
      console.error('❌ Zoom Out failed:', error);
    }
  };

  const handleSetZoom = async (level: number) => {
    try {
      await mapRef.current?.setZoom(level);
      console.log(`🔍 Set Zoom to ${level} executed`);
    } catch (error) {
      console.error('❌ Set Zoom failed:', error);
    }
  };

  // Enhanced location control functions
  const handleGoToLondon = async () => {
    try {
      await mapRef.current?.animateToLocation(51.5074, -0.1278, 12);
      console.log('📍 Animated to London');
    } catch (error) {
      console.error('❌ London navigation failed:', error);
    }
  };

  const handleGoToTokyo = async () => {
    try {
      await mapRef.current?.animateToLocation(35.6762, 139.6503, 12);
      console.log('📍 Animated to Tokyo');
    } catch (error) {
      console.error('❌ Tokyo navigation failed:', error);
    }
  };

  const handleGoToSanFrancisco = async () => {
    try {
      await mapRef.current?.animateToLocation(37.7749, -122.4194, 12);
      console.log('📍 Animated to San Francisco');
    } catch (error) {
      console.error('❌ San Francisco navigation failed:', error);
    }
  };

  // Enhanced marker functions
  const handleAddRandomMarker = () => {
    const newMarker: SimpleMarkerConfig = {
      id: `marker_${Date.now()}`,
      coordinate: {
        latitude: 37.7749 + (Math.random() - 0.5) * 0.02,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.02
      },
      title: `Random Marker ${markerCount + 1}`,
      description: 'A randomly placed marker',
      icon: 'star'
    };
    
    setMarkers(prev => [...prev, newMarker]);
    setMarkerCount(prev => prev + 1);
  };

  const handleRemoveLastMarker = () => {
    setMarkers(prev => prev.slice(0, -1));
  };

  const handleToggleMarkerVisibility = () => {
    // For now, just log - visibility feature coming in enhanced version
    console.log('🔄 Toggle marker visibility (feature preview)');
    Alert.alert('Feature Preview', 'Marker visibility toggle coming in enhanced version!');
  };

  if (nativeSupport === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔄 Initializing Enhanced SDK...</Text>
        <Text style={styles.info}>Checking native module support...</Text>
      </View>
    );
  }

  if (!nativeSupport) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🗺️ Enhanced Map Test</Text>
          <Text style={styles.platform}>Platform: {Platform.OS}</Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            📱 Enhanced Native Map Module Not Available
          </Text>
          
          <Text style={styles.info}>
            For full enhanced map functionality, build with EAS:
          </Text>
          
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>
              eas build --profile preview --platform {Platform.OS}
            </Text>
          </View>
          
          <Text style={styles.infoHighlight}>
            ✨ Enhanced features include:
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.feature}>• Custom marker icons & animations</Text>
            <Text style={styles.feature}>• Interactive info windows</Text>
            <Text style={styles.feature}>• Polylines, polygons & circles</Text>
            <Text style={styles.feature}>• Marker clustering & drag support</Text>
            <Text style={styles.feature}>• Advanced gesture controls</Text>
            <Text style={styles.feature}>• Real-time location tracking</Text>
          </View>
        </View>
        
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Enhanced Map Test</Text>
        <Text style={styles.platform}>
          {Platform.OS.toUpperCase()} • {mapReady ? '✅ Ready' : '⏳ Loading'} • Markers: {markers.length}
        </Text>
        {tapCount > 0 && (
          <Text style={styles.tapCounter}>Taps: {tapCount}</Text>
        )}
      </View>
      
      <OSMView
        style={styles.map}
        initialCenter={{ latitude: 37.7749, longitude: -122.4194 }} // San Francisco
        initialZoom={13}
        markers={markers}
        onMapReady={() => {
          console.log('✅ Enhanced Map is ready!');
          setMapReady(true);
        }}
        onPress={handleMapPress}
        onRegionChange={(region) => {
          console.log('🔄 Region changed:', region);
        }}
        onMarkerPress={handleMarkerPress}
        ref={mapRef}
      />
      
      {/* Enhanced Controls */}
      <ScrollView horizontal style={styles.controlsContainer} showsHorizontalScrollIndicator={false}>
        {/* Zoom Controls */}
        <View style={styles.controlSection}>
          <Text style={styles.controlSectionTitle}>Zoom</Text>
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
              <Text style={styles.buttonText}>🔍+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
              <Text style={styles.buttonText}>🔍-</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={() => handleSetZoom(15)}>
              <Text style={styles.buttonText}>15x</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Controls */}
        <View style={styles.controlSection}>
          <Text style={styles.controlSectionTitle}>Locations</Text>
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.locationButton} onPress={handleGoToSanFrancisco}>
              <Text style={styles.locationButtonText}>🌉 SF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.locationButton} onPress={handleGoToLondon}>
              <Text style={styles.locationButtonText}>🏰 LON</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.locationButton} onPress={handleGoToTokyo}>
              <Text style={styles.locationButtonText}>🗼 TOK</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Marker Controls */}
        <View style={styles.controlSection}>
          <Text style={styles.controlSectionTitle}>Markers</Text>
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.markerButton} onPress={handleAddRandomMarker}>
              <Text style={styles.markerButtonText}>➕ Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.markerButton} onPress={handleRemoveLastMarker}>
              <Text style={styles.markerButtonText}>➖ Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.markerButton} onPress={handleToggleMarkerVisibility}>
              <Text style={styles.markerButtonText}>👁️ Toggle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          🎯 Tap: {tapCount} | 📍 Markers: {markers.length} | 🔍 Zoom & pan to explore
        </Text>
        <Text style={styles.instructionSubtext}>
          📊 Enhanced features: Custom icons, animations, overlays, clustering
        </Text>
        <Text style={styles.instructionSubtext}>
          🎪 Try dragging markers, tapping overlays, and using all controls
        </Text>
      </View>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  platform: {
    fontSize: 13,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  tapCounter: {
    fontSize: 11,
    textAlign: 'center',
    color: '#007AFF',
    marginTop: 2,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  info: {
    fontSize: 16,
    textAlign: 'center',
    margin: 15,
    color: '#666',
    lineHeight: 22,
  },
  infoHighlight: {
    fontSize: 16,
    textAlign: 'center',
    margin: 15,
    color: '#007AFF',
    fontWeight: '600',
    lineHeight: 22,
  },
  codeContainer: {
    backgroundColor: '#f1f3f4',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  featureList: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  feature: {
    fontSize: 15,
    color: '#555',
    marginVertical: 3,
    textAlign: 'left',
  },
  controlsContainer: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    maxHeight: 120,
  },
  controlSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 140,
  },
  controlSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 6,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#90caf9',
    marginHorizontal: 2,
  },
  buttonText: {
    fontSize: 14,
    color: '#1565c0',
    fontWeight: '600',
  },
  locationButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f3e5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ce93d8',
    marginHorizontal: 2,
  },
  locationButtonText: {
    fontSize: 12,
    color: '#7b1fa2',
    fontWeight: '600',
  },
  markerButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a5d6a7',
    marginHorizontal: 2,
  },
  markerButtonText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  instructionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginVertical: 1,
  },
  instructionSubtext: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginVertical: 1,
  },
}); 