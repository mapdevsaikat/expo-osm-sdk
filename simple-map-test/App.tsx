import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Platform, Alert, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { OSMView, OSMViewRef } from 'expo-osm-sdk';

export default function App() {
  const [nativeSupport, setNativeSupport] = useState<boolean | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const mapRef = useRef<OSMViewRef>(null);
  
  useEffect(() => {
    console.log('🚀 Simple Map Test App Starting...');
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

  // Location control functions
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

  if (nativeSupport === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔄 Initializing...</Text>
        <Text style={styles.info}>Checking native module support...</Text>
      </View>
    );
  }

  if (!nativeSupport) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🗺️ Simple Map Test</Text>
          <Text style={styles.platform}>Platform: {Platform.OS}</Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            📱 Native Map Module Not Available
          </Text>
          
          <Text style={styles.info}>
            For full interactive map functionality, build with EAS:
          </Text>
          
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>
              eas build --profile preview --platform {Platform.OS}
            </Text>
          </View>
          
          <Text style={styles.infoHighlight}>
            ✨ EAS builds in the cloud - no local SDK setup required!
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.feature}>• Interactive OpenStreetMap</Text>
            <Text style={styles.feature}>• Tap interactions with alerts</Text>
            <Text style={styles.feature}>• Pan and zoom gestures</Text>
            <Text style={styles.feature}>• Real-time coordinate logging</Text>
          </View>
        </View>
        
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Simple Map Test</Text>
        <Text style={styles.platform}>
          {Platform.OS.toUpperCase()} • {mapReady ? '✅ Ready' : '⏳ Loading'}
        </Text>
        {tapCount > 0 && (
          <Text style={styles.tapCounter}>Taps: {tapCount}</Text>
        )}
      </View>
      
      <OSMView
        style={styles.map}
        initialCenter={{ latitude: 37.7749, longitude: -122.4194 }} // San Francisco
        initialZoom={12}
        onMapReady={() => {
          console.log('✅ Map is ready!');
          setMapReady(true);
        }}
        onPress={handleMapPress}
        onRegionChange={(region) => {
          console.log('🔄 Region changed:', region);
        }}
        ref={mapRef}
      />
      
      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
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

      {/* Location Controls */}
      <View style={styles.locationControls}>
        <TouchableOpacity style={styles.locationButton} onPress={handleGoToSanFrancisco}>
          <Text style={styles.locationButtonText}>🌉 SF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.locationButton} onPress={handleGoToLondon}>
          <Text style={styles.locationButtonText}>🏰 London</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.locationButton} onPress={handleGoToTokyo}>
          <Text style={styles.locationButtonText}>🗼 Tokyo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          🎯 Tap: {tapCount} | 🔍 Use zoom controls | 🌍 Try locations
        </Text>
        <Text style={styles.instructionSubtext}>
          📊 Check console for detailed logs
        </Text>
        <Text style={styles.instructionSubtext}>
          🎪 Pan and zoom to test performance
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
    paddingBottom: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  platform: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  tapCounter: {
    fontSize: 12,
    textAlign: 'center',
    color: '#007AFF',
    marginTop: 4,
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
  instructions: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  instructionText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginVertical: 2,
  },
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#e0e0e0',
    borderTopWidth: 1,
    borderTopColor: '#d0d0d0',
  },
  controlButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  locationControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#e0e0e0',
    borderTopWidth: 1,
    borderTopColor: '#d0d0d0',
  },
  locationButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  locationButtonText: {
    fontSize: 16,
    color: '#333',
  },
  instructionSubtext: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginVertical: 1,
  },
}); 