import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import {
  OSMView,
  OSMViewRef,
  PitchBearingControl,
  ZoomControl,
  Coordinate,
} from 'expo-osm-sdk';

/**
 * PitchBearingDemo Component
 * 
 * Demonstrates the PitchBearingControl component with various configurations
 * and integration with OSMView.
 */
export default function PitchBearingDemo() {
  const mapRef = useRef<OSMViewRef>(null);
  
  // Control states
  const [showValues, setShowValues] = useState(true);
  const [showCompass, setShowCompass] = useState(true);
  const [useCompactMode, setUseCompactMode] = useState(false);
  const [useDarkTheme, setUseDarkTheme] = useState(false);
  
  // Current values
  const [currentPitch, setCurrentPitch] = useState(0);
  const [currentBearing, setCurrentBearing] = useState(0);

  // Map center coordinates (NYC)
  const mapCenter: Coordinate = { latitude: 40.7128, longitude: -74.0060 };

  // Handle pitch changes
  const handlePitchChange = (pitch: number) => {
    setCurrentPitch(pitch);
    console.log('🎯 Pitch changed to:', pitch);
  };

  // Handle bearing changes
  const handleBearingChange = (bearing: number) => {
    setCurrentBearing(bearing);
    console.log('🧭 Bearing changed to:', bearing);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Map */}
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={mapCenter}
        initialZoom={14}
        pitchEnabled={true}
        rotateEnabled={true}
        onMapReady={() => console.log('Map is ready for pitch/bearing demo!')}
      />

      {/* Zoom Control (bottom-right) */}
      <ZoomControl
        mapRef={mapRef}
        position="bottom-right"
        showZoomLevel={true}
        theme={useDarkTheme ? 'dark' : 'light'}
        size={useCompactMode ? 'small' : 'medium'}
      />

      {/* Pitch & Bearing Control (top-right) */}
      <PitchBearingControl
        mapRef={mapRef}
        position="top-right"
        showValues={showValues}
        showCompass={showCompass}
        onPitchChange={handlePitchChange}
        onBearingChange={handleBearingChange}
        theme={useDarkTheme ? 'dark' : 'light'}
        size={useCompactMode ? 'small' : 'medium'}
        pitchStep={15}
        bearingStep={45}
        disableAtLimits={true}
      />

      {/* Control Panel */}
      <View style={[
        styles.controlPanel,
        useDarkTheme && styles.darkPanel
      ]}>
        <Text style={[
          styles.title,
          useDarkTheme && styles.darkText
        ]}>
          🎮 Pitch & Bearing Demo
        </Text>
        
        {/* Current Values Display */}
        <View style={styles.valuesContainer}>
          <View style={styles.valueItem}>
            <Text style={[styles.valueLabel, useDarkTheme && styles.darkText]}>
              Pitch (Tilt):
            </Text>
            <Text style={[styles.valueNumber, useDarkTheme && styles.darkText]}>
              {Math.round(currentPitch)}°
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={[styles.valueLabel, useDarkTheme && styles.darkText]}>
              Bearing (Rotation):
            </Text>
            <Text style={[styles.valueNumber, useDarkTheme && styles.darkText]}>
              {Math.round(currentBearing)}°
            </Text>
          </View>
        </View>

        {/* Control Options */}
        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.option}>
            <Text style={[styles.optionText, useDarkTheme && styles.darkText]}>
              Show Values
            </Text>
            <Switch
              value={showValues}
              onValueChange={setShowValues}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={showValues ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.option}>
            <Text style={[styles.optionText, useDarkTheme && styles.darkText]}>
              Show Compass
            </Text>
            <Switch
              value={showCompass}
              onValueChange={setShowCompass}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={showCompass ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.option}>
            <Text style={[styles.optionText, useDarkTheme && styles.darkText]}>
              Compact Mode
            </Text>
            <Switch
              value={useCompactMode}
              onValueChange={setUseCompactMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={useCompactMode ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.option}>
            <Text style={[styles.optionText, useDarkTheme && styles.darkText]}>
              Dark Theme
            </Text>
            <Switch
              value={useDarkTheme}
              onValueChange={setUseDarkTheme}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={useDarkTheme ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </ScrollView>

        <Text style={[styles.instructions, useDarkTheme && styles.darkText]}>
          💡 Use the top-right controls for pitch/bearing{'\n'}
          🎯 Pitch: ▲▼ buttons (0-60°){'\n'}
          🧭 Bearing: ◀▶ buttons (0-360°){'\n'}
          📍 Tap values/compass to reset{'\n'}
          🔍 Use bottom-right for zoom
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
  controlPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 100, // Leave space for zoom control
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    maxHeight: 300,
  },
  darkPanel: {
    backgroundColor: 'rgba(33, 33, 33, 0.95)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  darkText: {
    color: '#fff',
  },
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  valueItem: {
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  valueNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsContainer: {
    maxHeight: 120,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  instructions: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
}); 