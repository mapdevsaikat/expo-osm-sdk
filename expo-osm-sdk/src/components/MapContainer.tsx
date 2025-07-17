import React, { forwardRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import OSMView from './OSMView';
import { OSMViewProps, Coordinate, MapRegion } from '../types';

export interface MapContainerProps extends OSMViewProps {
  fallbackComponent?: React.ComponentType<{ error: string }>;
  showDebugInfo?: boolean;
  onError?: (error: Error) => void;
}

const DefaultFallback: React.FC<{ error: string }> = ({ error }) => (
  <View style={styles.fallbackContainer}>
    <Text style={styles.fallbackTitle}>Map Error</Text>
    <Text style={styles.fallbackText}>{error}</Text>
    <Text style={styles.fallbackHint}>
      Make sure you're using a development build and have configured the plugin correctly.
    </Text>
  </View>
);

export const MapContainer = forwardRef<any, MapContainerProps>(
  ({ 
    fallbackComponent: FallbackComponent = DefaultFallback,
    showDebugInfo = __DEV__,
    onError,
    ...osmViewProps 
  }, ref) => {
    const [mapReady, setMapReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<{
      region?: MapRegion;
      markersCount: number;
      lastInteraction?: string;
    }>({ markersCount: 0 });

    useEffect(() => {
      // Validate props in development
      if (__DEV__) {
        try {
          if (osmViewProps.initialCenter) {
            const { latitude, longitude } = osmViewProps.initialCenter;
            if (latitude < -90 || latitude > 90) {
              throw new Error('initialCenter.latitude must be between -90 and 90');
            }
            if (longitude < -180 || longitude > 180) {
              throw new Error('initialCenter.longitude must be between -180 and 180');
            }
          }
          
          if (osmViewProps.initialZoom && (osmViewProps.initialZoom < 1 || osmViewProps.initialZoom > 18)) {
            throw new Error('initialZoom must be between 1 and 18');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown validation error';
          setError(errorMessage);
          onError?.(err instanceof Error ? err : new Error(errorMessage));
          return;
        }
      }
    }, [osmViewProps.initialCenter, osmViewProps.initialZoom, onError]);

    const handleMapReady = () => {
      setMapReady(true);
      setError(null);
      osmViewProps.onMapReady?.();
    };

    const handleRegionChange = (region: MapRegion) => {
      if (showDebugInfo) {
        setDebugInfo(prev => ({ ...prev, region }));
      }
      osmViewProps.onRegionChange?.(region);
    };

    const handleMarkerPress = (markerId: string) => {
      if (showDebugInfo) {
        setDebugInfo(prev => ({ ...prev, lastInteraction: `Marker pressed: ${markerId}` }));
      }
      
      // Find the marker coordinate by ID
      const marker = osmViewProps.markers?.find(m => m.id === markerId);
      if (marker && osmViewProps.onMarkerPress) {
        osmViewProps.onMarkerPress(markerId, marker.coordinate);
      }
    };

    const handlePress = (coordinate: Coordinate) => {
      if (showDebugInfo) {
        setDebugInfo(prev => ({ 
          ...prev, 
          lastInteraction: `Map pressed at: ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}` 
        }));
      }
      osmViewProps.onPress?.(coordinate);
    };

    // Update markers count when markers change
    useEffect(() => {
      setDebugInfo(prev => ({ 
        ...prev, 
        markersCount: osmViewProps.markers?.length || 0 
      }));
    }, [osmViewProps.markers]);

    if (error) {
      return <FallbackComponent error={error} />;
    }

    return (
      <View style={styles.container}>
        <OSMView
          {...osmViewProps}
          onMapReady={handleMapReady}
          onRegionChange={handleRegionChange}
          onMarkerPress={handleMarkerPress}
          onPress={handlePress}
        />
        
        {showDebugInfo && mapReady && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Map Ready: {mapReady ? '✅' : '⏳'}
            </Text>
            <Text style={styles.debugText}>
              Markers: {debugInfo.markersCount}
            </Text>
            {debugInfo.region && (
              <Text style={styles.debugText}>
                Region: {debugInfo.region.latitude.toFixed(4)}, {debugInfo.region.longitude.toFixed(4)}
              </Text>
            )}
            {debugInfo.lastInteraction && (
              <Text style={styles.debugText}>
                Last: {debugInfo.lastInteraction}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    margin: 10,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 10,
  },
  fallbackText: {
    fontSize: 14,
    color: '#721c24',
    textAlign: 'center',
    marginBottom: 10,
  },
  fallbackHint: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  debugInfo: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    minWidth: 150,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    marginBottom: 2,
  },
});

MapContainer.displayName = 'MapContainer'; 