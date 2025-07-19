import React, { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  Alert,
  Switch,
  TouchableOpacity,
} from 'react-native';
import {
  OSMView,
  OSMViewRef,
  AdvancedGestureControl,
  PitchBearingControl,
  ZoomControl,
  Coordinate,
  GestureEvent,
} from 'expo-osm-sdk';

/**
 * Advanced Gesture Demo Component
 * 
 * Comprehensive demonstration of all gesture and interaction handling features:
 * - Long press detection
 * - Multi-touch gestures (3+ fingers)
 * - Map rotation and tilt
 * - Custom gesture recognition
 * - Gesture conflict resolution
 */
export default function AdvancedGestureDemo() {
  const mapRef = useRef<OSMViewRef>(null);
  
  // Demo state
  const [gestureEvents, setGestureEvents] = useState<string[]>([]);
  const [customGestures, setCustomGestures] = useState<string[]>([]);
  const [currentMapState, setCurrentMapState] = useState({
    pitch: 0,
    bearing: 0,
    zoom: 12,
  });
  
  // Configuration state
  const [enable3FingerGestures, setEnable3FingerGestures] = useState(true);
  const [enable4FingerGestures, setEnable4FingerGestures] = useState(true);
  const [enableSwipePatterns, setEnableSwipePatterns] = useState(true);
  const [debugMode, setDebugMode] = useState(true);
  const [rotateEnabled, setRotateEnabled] = useState(true);
  const [pitchEnabled, setPitchEnabled] = useState(true);
  
  // Map center coordinates (San Francisco)
  const mapCenter: Coordinate = { latitude: 37.7749, longitude: -122.4194 };

  // Add gesture event to log
  const addGestureEvent = useCallback((message: string) => {
    setGestureEvents(prev => {
      const newEvents = [message, ...prev].slice(0, 10); // Keep last 10 events
      return newEvents;
    });
  }, []);

  // Add custom gesture to log
  const addCustomGesture = useCallback((message: string) => {
    setCustomGestures(prev => {
      const newEvents = [message, ...prev].slice(0, 5); // Keep last 5 custom gestures
      return newEvents;
    });
  }, []);

  // Handle basic map gestures
  const handleMapPress = (coordinate: Coordinate) => {
    addGestureEvent(`🎯 Map press: ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`);
  };

  const handleLongPress = (coordinate: Coordinate) => {
    addGestureEvent(`⏰ Long press: ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`);
    Alert.alert(
      'Long Press Detected!',
      `Location: ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      [{ text: 'OK' }]
    );
  };

  // Handle advanced gesture events
  const handleAdvancedGesture = (event: GestureEvent) => {
    const timestamp = new Date().toLocaleTimeString();
    let message = '';
    
    switch (event.type) {
      case 'multi-touch':
        message = `🖐️ ${event.fingerCount}-finger tap (${timestamp})`;
        break;
      case 'swipe':
        message = `👋 ${event.fingerCount}-finger swipe ${event.pattern} (${timestamp})`;
        break;
      case 'long-press':
        message = `⏰ Advanced long press (${timestamp})`;
        break;
      default:
        message = `✨ ${event.type} gesture (${timestamp})`;
    }
    
    addGestureEvent(message);
    
    // Special handling for multi-finger gestures
    if (event.type === 'multi-touch') {
      if (event.fingerCount === 3) {
        // 3-finger gesture - show map info
        showMapInfo();
      } else if (event.fingerCount === 4) {
        // 4-finger gesture - reset map view
        resetMapView();
      }
    }
  };

  // Handle custom gesture patterns
  const handleCustomGesture = (pattern: string, data: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const message = `🎨 ${pattern} pattern (confidence: ${data.confidence}) (${timestamp})`;
    addCustomGesture(message);
    
    // Handle specific patterns
    switch (pattern) {
      case 'triangle':
        Alert.alert('Triangle Gesture!', 'You drew a triangle with 3 fingers!');
        break;
      case 'line':
        Alert.alert('Line Gesture!', 'You drew a line with multiple fingers!');
        break;
      case 'square':
        Alert.alert('Square Gesture!', 'You drew a square with 4 fingers!');
        break;
      case 'diamond':
        Alert.alert('Diamond Gesture!', 'You drew a diamond pattern!');
        break;
    }
  };

  // Show current map information
  const showMapInfo = async () => {
    try {
      const pitch = await mapRef.current?.getPitch() || 0;
      const bearing = await mapRef.current?.getBearing() || 0;
      
      Alert.alert(
        'Map Information',
        `Current State:\n• Pitch: ${Math.round(pitch)}°\n• Bearing: ${Math.round(bearing)}°\n• Zoom: ~${currentMapState.zoom}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error getting map info:', error);
    }
  };

  // Reset map view to initial state
  const resetMapView = async () => {
    try {
      await mapRef.current?.setPitch(0);
      await mapRef.current?.setBearing(0);
      await mapRef.current?.animateToLocation(mapCenter.latitude, mapCenter.longitude, 12);
      
      setCurrentMapState({ pitch: 0, bearing: 0, zoom: 12 });
      addGestureEvent('🔄 Map view reset');
    } catch (error) {
      console.error('Error resetting map:', error);
    }
  };

  // Handle pitch/bearing changes
  const handlePitchChange = (pitch: number) => {
    setCurrentMapState(prev => ({ ...prev, pitch }));
  };

  const handleBearingChange = (bearing: number) => {
    setCurrentMapState(prev => ({ ...prev, bearing }));
  };

  // Clear event logs
  const clearLogs = () => {
    setGestureEvents([]);
    setCustomGestures([]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Map */}
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={mapCenter}
        initialZoom={12}
        rotateEnabled={rotateEnabled}
        pitchEnabled={pitchEnabled}
        onMapReady={() => addGestureEvent('🗺️ Map ready!')}
        onPress={handleMapPress}
        onLongPress={handleLongPress}
        onRegionChange={(region) => {
          setCurrentMapState(prev => ({ 
            ...prev, 
            zoom: Math.round((region.latitudeDelta + region.longitudeDelta) * 10) / 2 
          }));
        }}
      />

      {/* Advanced Gesture Control */}
      <AdvancedGestureControl
        mapRef={mapRef}
        config={{
          enable3FingerGestures,
          enable4FingerGestures,
          enableSwipePatterns,
          gestureTimeout: 5000,
        }}
        onGesture={handleAdvancedGesture}
        onCustomGesture={handleCustomGesture}
        debugMode={debugMode}
      />

      {/* Map Controls */}
      <ZoomControl
        mapRef={mapRef}
        position="bottom-right"
        showZoomLevel={true}
        theme="light"
        size="medium"
      />

      <PitchBearingControl
        mapRef={mapRef}
        position="top-right"
        showValues={true}
        showCompass={true}
        onPitchChange={handlePitchChange}
        onBearingChange={handleBearingChange}
        theme="light"
        size="medium"
        pitchStep={15}
        bearingStep={30}
      />

      {/* Demo Panel */}
      <View style={styles.demoPanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>🎮 Advanced Gesture Demo</Text>
          <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Current State */}
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Current State:</Text>
          <Text style={styles.stateText}>
            Pitch: {Math.round(currentMapState.pitch)}° | 
            Bearing: {Math.round(currentMapState.bearing)}° | 
            Zoom: {currentMapState.zoom}
          </Text>
        </View>

        {/* Configuration Options */}
        <ScrollView style={styles.configContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>3-Finger Gestures</Text>
            <Switch
              value={enable3FingerGestures}
              onValueChange={setEnable3FingerGestures}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
            />
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>4-Finger Gestures</Text>
            <Switch
              value={enable4FingerGestures}
              onValueChange={setEnable4FingerGestures}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
            />
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Swipe Patterns</Text>
            <Switch
              value={enableSwipePatterns}
              onValueChange={setEnableSwipePatterns}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
            />
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Map Rotation</Text>
            <Switch
              value={rotateEnabled}
              onValueChange={setRotateEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
            />
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Map Pitch</Text>
            <Switch
              value={pitchEnabled}
              onValueChange={setPitchEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
            />
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Debug Mode</Text>
            <Switch
              value={debugMode}
              onValueChange={setDebugMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
            />
          </View>
        </ScrollView>

        {/* Event Logs */}
        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>Recent Gestures:</Text>
          <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
            {gestureEvents.map((event, index) => (
              <Text key={index} style={styles.eventText}>
                {event}
              </Text>
            ))}
            {gestureEvents.length === 0 && (
              <Text style={styles.noEventsText}>No gestures detected yet</Text>
            )}
          </ScrollView>

          {customGestures.length > 0 && (
            <>
              <Text style={styles.logsTitle}>Custom Patterns:</Text>
              <ScrollView style={styles.customList} showsVerticalScrollIndicator={false}>
                {customGestures.map((gesture, index) => (
                  <Text key={index} style={styles.customText}>
                    {gesture}
                  </Text>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Instructions */}
        <Text style={styles.instructions}>
          💡 Try these gestures:{'\n'}
          🖐️ 3-finger tap → Map info{'\n'}
          🤚 4-finger tap → Reset view{'\n'}
          ✋ Multi-finger patterns{'\n'}
          ⏰ Long press → Alert{'\n'}
          🎯 Use controls for precise navigation
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  demoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 120, // Leave space for zoom control
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    maxHeight: 400,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stateContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  stateTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  stateText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  configContainer: {
    maxHeight: 120,
    marginBottom: 12,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  configLabel: {
    fontSize: 14,
    color: '#333',
  },
  logsContainer: {
    flex: 1,
    minHeight: 80,
  },
  logsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  eventsList: {
    maxHeight: 60,
    marginBottom: 8,
  },
  customList: {
    maxHeight: 40,
    marginBottom: 8,
  },
  eventText: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  customText: {
    fontSize: 11,
    color: '#007AFF',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  noEventsText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  instructions: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
}); 