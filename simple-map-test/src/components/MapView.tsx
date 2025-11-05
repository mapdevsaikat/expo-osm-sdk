import React, { useCallback } from 'react';
import { View, Alert } from 'react-native';
import { OSMView, type OSMViewRef, type Coordinate, type MarkerConfig, TILE_CONFIGS } from 'expo-osm-sdk';
import { commonStyles, BOTTOM_SHEET_HEIGHT_25 } from '../styles/common';
import type { BottomSheetState } from '../types';
import { logger } from '../utils/logger';

interface MapViewProps {
  mapRef: React.RefObject<OSMViewRef | null>;
  mapCenter: Coordinate;
  mapZoom: number;
  markers: MarkerConfig[];
  useVectorTiles: boolean;
  bottomSheetState: BottomSheetState;
  showUserLocation: boolean;
  followUserLocation: boolean;
  isMarkerModeEnabled: boolean;
  onMapReady: (useVectorTiles: boolean) => Promise<void>;
  onRegionChange?: () => void;
  onUserLocationChange: (location: Coordinate) => void;
  onMapPress: (coordinate: Coordinate) => void;
  onMarkerPress: (markerId: string, coordinate: Coordinate) => void;
  onMarkersUpdate: React.Dispatch<React.SetStateAction<MarkerConfig[]>>;
}

export const MapView: React.FC<MapViewProps> = ({
  mapRef,
  mapCenter,
  mapZoom,
  markers,
  useVectorTiles,
  bottomSheetState,
  showUserLocation,
  followUserLocation,
  isMarkerModeEnabled,
  onMapReady,
  onRegionChange,
  onUserLocationChange,
  onMapPress,
  onMarkerPress,
  onMarkersUpdate,
}) => {
  // Dynamic tile URL based on current mode
  const currentTileUrl = useVectorTiles 
    ? TILE_CONFIGS.openMapTiles.styleUrl    // Vector tiles
    : TILE_CONFIGS.openStreetMap.tileUrl;   // Raster tiles

  // Map handlers
  const handleMapReady = useCallback(async () => {
    await onMapReady(useVectorTiles);
  }, [useVectorTiles, onMapReady]);

  const handleRegionChange = useCallback(() => {
    logger.log('🗺️ Region changed');
    onRegionChange?.();
  }, [onRegionChange]);

  const handleMapPress = useCallback((coordinate: Coordinate) => {
    // Only add markers if marker mode is enabled
    if (!isMarkerModeEnabled) {
      return;
    }
    
    const newMarker: MarkerConfig = {
      id: `marker-${Date.now()}`,
      coordinate,
      title: 'Tap Marker',
      description: `Added at ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
    };
    onMarkersUpdate(prev => [...prev, newMarker]);
    logger.log('📍 Added marker at:', coordinate);
  }, [isMarkerModeEnabled, onMarkersUpdate]);

  const handleMarkerPress = useCallback((markerId: string, coordinate: Coordinate) => {
    const marker = markers.find(m => m.id === markerId);
    if (marker) {
      Alert.alert('Marker Info', `${marker.title}\n${marker.description}`);
    }
    logger.log('🔍 Marker pressed:', markerId, coordinate);
    onMarkerPress(markerId, coordinate);
  }, [markers, onMarkerPress]);

  // Calculate bottom padding based on bottom sheet state
  const bottomPadding = bottomSheetState === 'closed' ? 60 : 
                        bottomSheetState === 'half' ? BOTTOM_SHEET_HEIGHT_25 + 60 : 
                        BOTTOM_SHEET_HEIGHT_25 + 60;

  return (
    <View style={[
      commonStyles.mapContainer,
      { paddingBottom: bottomPadding }
    ]}>
      <OSMView
        ref={mapRef}
        style={commonStyles.map}
        initialCenter={mapCenter}
        initialZoom={mapZoom}
        tileServerUrl={currentTileUrl}
        key={`map-${useVectorTiles ? 'vector' : 'raster'}`}
        markers={markers}
        showUserLocation={showUserLocation}
        followUserLocation={followUserLocation}
        userLocationTintColor="#9C1AFF"
        userLocationAccuracyFillColor="rgba(156, 26, 255, 0.2)"
        userLocationAccuracyBorderColor="#9C1AFF"
        showsCompass={false}
        pitchEnabled={true}
        rotateEnabled={true}
        onMapReady={handleMapReady}
        onRegionChange={handleRegionChange}
        onPress={handleMapPress}
        onMarkerPress={handleMarkerPress}
        onUserLocationChange={onUserLocationChange}
      />
    </View>
  );
};

