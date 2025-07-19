import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  Switch, 
  ScrollView, 
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { 
  OSMView, 
  OSMViewRef, 
  Coordinate, 
  MapRegion, 
  MarkerConfig, 
  PolylineConfig,
  PolygonConfig,
  CircleConfig,
  TILE_CONFIGS 
} from 'expo-osm-sdk';
import * as Location from 'expo-location';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const App: React.FC = () => {
  const mapRef = useRef<OSMViewRef>(null);
  
  // State management
  const [useJSXChildren, setUseJSXChildren] = useState<boolean>(true);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [enableClustering, setEnableClustering] = useState<boolean>(true);
  const [testingMode, setTestingMode] = useState<'basic' | 'overlays' | 'methods'>('basic');
  const [testResults, setTestResults] = useState<string[]>([]);

  // Map center coordinates (NYC)
  const [mapCenter] = useState<Coordinate>({ latitude: 40.7128, longitude: -74.0060 });

  // Test data for props-based overlays
  const propMarkers: MarkerConfig[] = [
    {
      id: 'prop-marker-1',
      coordinate: { latitude: 40.7128, longitude: -74.0060 },
      title: 'Props Marker 1',
      description: 'This is a marker from props'
    },
    {
      id: 'prop-marker-2', 
      coordinate: { latitude: 40.7200, longitude: -74.0100 },
      title: 'Props Marker 2',
      description: 'Another props marker'
    }
  ];

  const propPolylines: PolylineConfig[] = [
    {
      id: 'prop-polyline-1',
      coordinates: [
        { latitude: 40.7100, longitude: -74.0050 },
        { latitude: 40.7150, longitude: -74.0080 },
        { latitude: 40.7180, longitude: -74.0040 }
      ],
      strokeColor: '#FF0000',
      strokeWidth: 3
    }
  ];

  const propPolygons: PolygonConfig[] = [
    {
      id: 'prop-polygon-1',
      coordinates: [
        { latitude: 40.7050, longitude: -74.0020 },
        { latitude: 40.7080, longitude: -74.0020 },
        { latitude: 40.7080, longitude: -73.9980 },
        { latitude: 40.7050, longitude: -73.9980 }
      ],
      fillColor: '#00FF00',
      strokeColor: '#008000',
      strokeWidth: 2
    }
  ];

  const propCircles: CircleConfig[] = [
    {
      id: 'prop-circle-1',
      center: { latitude: 40.7250, longitude: -74.0150 },
      radius: 500,
      fillColor: '#0000FF',
      strokeColor: '#000080',
      strokeWidth: 2
    }
  ];

  // Add logging function
  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Test ref methods
  const testRefMethods = async () => {
    if (!mapRef.current) {
      addTestResult('❌ Map ref not available');
      return;
    }

    try {
      addTestResult('🧪 Testing ref methods...');

      // Test zoom controls
      await mapRef.current.zoomIn();
      addTestResult('✅ zoomIn() works');

      await new Promise(resolve => setTimeout(resolve, 500));
      await mapRef.current.zoomOut();
      addTestResult('✅ zoomOut() works');

      // Test location animation
      await mapRef.current.animateToLocation(40.7589, -73.9851, 15); // Times Square
      addTestResult('✅ animateToLocation() works');

      // Test marker addition
      await mapRef.current.addMarker({
        id: 'ref-test-marker',
        coordinate: { latitude: 40.7589, longitude: -73.9851 },
        title: 'Ref Test Marker'
      });
      addTestResult('✅ addMarker() works');

      // Test polyline addition
      await mapRef.current.addPolyline({
        id: 'ref-test-polyline',
        coordinates: [
          { latitude: 40.7580, longitude: -73.9860 },
          { latitude: 40.7600, longitude: -73.9840 }
        ],
                                   strokeColor: '#FF00FF',
          strokeWidth: 4
      });
      addTestResult('✅ addPolyline() works');

      // Test polygon addition
      await mapRef.current.addPolygon({
        id: 'ref-test-polygon',
        coordinates: [
          { latitude: 40.7570, longitude: -73.9870 },
          { latitude: 40.7580, longitude: -73.9870 },
          { latitude: 40.7580, longitude: -73.9850 },
          { latitude: 40.7570, longitude: -73.9850 }
        ],
        fillColor: '#FFFF00',
        strokeColor: '#FF8800'
      });
      addTestResult('✅ addPolygon() works');

      // Test circle addition
      await mapRef.current.addCircle({
        id: 'ref-test-circle',
        center: { latitude: 40.7610, longitude: -73.9830 },
        radius: 200,
        fillColor: '#00FFFF',
        strokeColor: '#0088FF'
      });
      addTestResult('✅ addCircle() works');

      addTestResult('🎉 All ref methods tested successfully!');

    } catch (error) {
      addTestResult(`❌ Ref method test failed: ${error}`);
    }
  };

  // Test location services
  const testLocationServices = async () => {
    try {
      addTestResult('📍 Testing location services...');
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        addTestResult('❌ Location permission not granted');
        return;
      }

      if (mapRef.current) {
        await mapRef.current.startLocationTracking();
        addTestResult('✅ Location tracking started');
        
        const location = await mapRef.current.getCurrentLocation();
        addTestResult(`✅ Current location: ${location.latitude}, ${location.longitude}`);
      }
    } catch (error) {
      addTestResult(`❌ Location test failed: ${error}`);
    }
  };

  // Event handlers
  const handleMapReady = () => {
    addTestResult('🗺️ Map is ready!');
  };

  const handleMarkerPress = (markerId: string, coordinate: Coordinate) => {
    addTestResult(`📍 Marker pressed: ${markerId}`);
  };

  const handlePolylinePress = (polylineId: string, coordinate: Coordinate) => {
    addTestResult(`📐 Polyline pressed: ${polylineId}`);
  };

  const handlePolygonPress = (polygonId: string, coordinate: Coordinate) => {
    addTestResult(`⬟ Polygon pressed: ${polygonId}`);
  };

  const handleCirclePress = (circleId: string, coordinate: Coordinate) => {
    addTestResult(`⭕ Circle pressed: ${circleId}`);
  };

  const renderTestControls = () => (
    <View style={styles.controlsContainer}>
      <Text style={styles.title}>🧪 Expo OSM SDK Test Suite</Text>
      
      <View style={styles.switchContainer}>
        <Text>Use JSX Children API:</Text>
        <Switch value={useJSXChildren} onValueChange={setUseJSXChildren} />
      </View>

      <View style={styles.switchContainer}>
        <Text>Show Overlays:</Text>
        <Switch value={showOverlays} onValueChange={setShowOverlays} />
      </View>

      <View style={styles.switchContainer}>
        <Text>Enable Clustering:</Text>
        <Switch value={enableClustering} onValueChange={setEnableClustering} />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={testRefMethods}>
          <Text style={styles.buttonText}>Test Ref Methods</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={testLocationServices}>
          <Text style={styles.buttonText}>Test Location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        <ScrollView style={styles.resultsScroll}>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>{result}</Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderJSXChildrenMap = () => (
    <OSMView
      ref={mapRef}
      style={styles.map}
      initialCenter={mapCenter}
      initialZoom={13}
      clustering={enableClustering ? { enabled: true, radius: 50, maxZoom: 16 } : undefined}
      onMapReady={handleMapReady}
      onMarkerPress={handleMarkerPress}
      onPolylinePress={handlePolylinePress}
      onPolygonPress={handlePolygonPress}
      onCirclePress={handleCirclePress}
    >
      {/* JSX Children API Testing */}
      <Marker
        coordinate={{ latitude: 40.7128, longitude: -74.0060 }}
        title="JSX Marker 1"
        description="This is a JSX marker"
      />
      <Marker
        coordinate={{ latitude: 40.7200, longitude: -74.0100 }}
        title="JSX Marker 2"
        description="Another JSX marker"
      />
      <Marker
        coordinate={{ latitude: 40.7300, longitude: -74.0200 }}
        title="JSX Marker 3"
        description="Third JSX marker for clustering"
      />

      {showOverlays && (
        <>
          <Polyline
            coordinates={[
              { latitude: 40.7100, longitude: -74.0050 },
              { latitude: 40.7150, longitude: -74.0080 },
              { latitude: 40.7180, longitude: -74.0040 }
            ]}
                                                   strokeColor="#FF0000"
              strokeWidth={3}
          />

          <Polygon
            coordinates={[
              { latitude: 40.7050, longitude: -74.0020 },
              { latitude: 40.7080, longitude: -74.0020 },
              { latitude: 40.7080, longitude: -73.9980 },
              { latitude: 40.7050, longitude: -73.9980 }
            ]}
            fillColor="#00FF00"
            strokeColor="#008000"
            strokeWidth={2}
          />

          <Circle
            center={{ latitude: 40.7250, longitude: -74.0150 }}
            radius={500}
            fillColor="#0000FF"
            strokeColor="#000080"
            strokeWidth={2}
          />
        </>
      )}
    </OSMView>
  );

  const renderPropsMap = () => (
    <OSMView
      ref={mapRef}
      style={styles.map}
      initialCenter={mapCenter}
      initialZoom={13}
      markers={propMarkers}
      polylines={showOverlays ? propPolylines : []}
      polygons={showOverlays ? propPolygons : []}
      circles={showOverlays ? propCircles : []}
      clustering={enableClustering ? { enabled: true, radius: 50, maxZoom: 16 } : undefined}
      onMapReady={handleMapReady}
      onMarkerPress={handleMarkerPress}
      onPolylinePress={handlePolylinePress}
      onPolygonPress={handlePolygonPress}
      onCirclePress={handleCirclePress}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {useJSXChildren ? renderJSXChildrenMap() : renderPropsMap()}
      
      {renderTestControls()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 15,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultsContainer: {
    maxHeight: 150,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultsScroll: {
    maxHeight: 120,
  },
  resultText: {
    fontSize: 10,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // User Location Button styles
  userLocationButton: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: '#8c14ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#8c14ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App; 