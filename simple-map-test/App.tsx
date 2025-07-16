import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, Alert, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { OSMView } from 'expo-osm-sdk';

export default function App() {
  const [nativeSupport, setNativeSupport] = useState<boolean | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  
  useEffect(() => {
    console.log('🚀 Simple Map Test App Starting...');
    console.log('📱 Platform:', Platform.OS);
    
    // Better native module detection
    const hasExpoModules = !!(global as any).ExpoModules;
    const isExpoGo = !!(global as any).expo;
    const hasNativeModules = hasExpoModules && !isExpoGo;
    
    console.log('🔧 ExpoModules available:', hasExpoModules);
    console.log('📦 Running in Expo Go:', isExpoGo);
    console.log('🏗️ Native modules supported:', hasNativeModules);
    console.log('🗺️ OSMView component:', typeof OSMView);
    
    setNativeSupport(hasNativeModules);
  }, []);

  const handleMapPress = (coordinate: any) => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    console.log(`📍 Map tapped ${newCount} times at:`, coordinate);
    
    Alert.alert(
      '🗺️ Map Interaction',
      `Tap #${newCount}\n\nLatitude: ${coordinate.latitude.toFixed(6)}\nLongitude: ${coordinate.longitude.toFixed(6)}`,
      [{ text: 'Cool! 🎉', style: 'default' }]
    );
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
      />
      
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          🎯 Tap the map to test interactions
        </Text>
        <Text style={styles.instructionText}>
          📊 Check console for detailed logs
        </Text>
        <Text style={styles.instructionText}>
          🤏 Pan and zoom to test performance
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
}); 