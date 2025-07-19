import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import type { OSMViewRef } from '../types';

/**
 * Layer Configuration Interface
 */
export interface LayerConfig {
  id: string;
  name: string;
  type: 'raster' | 'vector' | 'satellite' | 'terrain' | 'custom';
  url: string;
  styleUrl?: string; // For vector tiles
  attribution?: string;
  maxZoom?: number;
  minZoom?: number;
  opacity?: number;
  visible?: boolean;
  isBaseLayer?: boolean; // true for base layers, false for overlays
  thumbnail?: string; // Preview image URL
  description?: string;
}

/**
 * Built-in Layer Definitions
 */
export const BUILT_IN_LAYERS: LayerConfig[] = [
  {
    id: 'osm-raster',
    name: 'OpenStreetMap',
    type: 'raster',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    isBaseLayer: true,
    description: 'Standard OpenStreetMap raster tiles'
  },
  {
    id: 'carto-vector',
    name: 'Carto Voyager',
    type: 'vector',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    attribution: '© CARTO, © OpenStreetMap contributors',
    maxZoom: 18,
    isBaseLayer: true,
    description: 'Modern vector tiles with clean styling'
  },
  {
    id: 'carto-dark',
    name: 'Carto Dark',
    type: 'vector',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    attribution: '© CARTO, © OpenStreetMap contributors',
    maxZoom: 18,
    isBaseLayer: true,
    description: 'Dark theme vector tiles'
  },
  {
    id: 'carto-light',
    name: 'Carto Light',
    type: 'vector',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    attribution: '© CARTO, © OpenStreetMap contributors',
    maxZoom: 18,
    isBaseLayer: true,
    description: 'Light theme vector tiles'
  },
  {
    id: 'osm-hot',
    name: 'Humanitarian',
    type: 'raster',
    url: 'https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, Tiles courtesy of Humanitarian OSM Team',
    maxZoom: 17,
    isBaseLayer: true,
    description: 'Humanitarian-focused mapping style'
  },
  {
    id: 'stamen-terrain',
    name: 'Terrain',
    type: 'raster',
    url: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png',
    attribution: '© Stamen Design, © OpenStreetMap contributors',
    maxZoom: 15,
    isBaseLayer: true,
    description: 'Terrain visualization with topography'
  }
];

export interface LayerControlProps {
  /** Reference to the OSMView map component */
  mapRef: React.RefObject<OSMViewRef>;
  
  /** Available layers (defaults to built-in layers) */
  layers?: LayerConfig[];
  
  /** Currently active base layer ID */
  activeBaseLayer?: string;
  
  /** Currently active overlay layer IDs */
  activeOverlays?: string[];
  
  /** Callback when base layer changes */
  onBaseLayerChange?: (layerId: string, layer: LayerConfig) => void;
  
  /** Callback when overlay layer toggles */
  onOverlayToggle?: (layerId: string, layer: LayerConfig, visible: boolean) => void;
  
  /** Position of the control */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /** Custom style for the control container */
  style?: any;
  
  /** Whether to show layer thumbnails */
  showThumbnails?: boolean;
  
  /** Whether to show layer descriptions */
  showDescriptions?: boolean;
  
  /** Whether to allow multiple base layers (for comparison) */
  allowMultipleBaseLayers?: boolean;
  
  /** Collapsed state control */
  defaultCollapsed?: boolean;
  
  /** Custom control title */
  title?: string;
}

/**
 * LayerControl Component
 * 
 * Provides an interactive layer switcher for OSMView maps.
 * Supports both base layers and overlay layers with smooth animations.
 * 
 * @example
 * ```tsx
 * <LayerControl
 *   mapRef={mapRef}
 *   position="top-right"
 *   onBaseLayerChange={(layerId, layer) => {
 *     console.log('Switched to:', layer.name);
 *   }}
 *   showDescriptions={true}
 * />
 * ```
 */
export const LayerControl: React.FC<LayerControlProps> = ({
  mapRef,
  layers = BUILT_IN_LAYERS,
  activeBaseLayer = 'carto-vector',
  activeOverlays = [],
  onBaseLayerChange,
  onOverlayToggle,
  position = 'top-right',
  style,
  showThumbnails = false,
  showDescriptions = true,
  allowMultipleBaseLayers = false,
  defaultCollapsed = true,
  title = 'Map Layers'
}) => {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const [currentBaseLayer, setCurrentBaseLayer] = useState(activeBaseLayer);
  const [currentOverlays, setCurrentOverlays] = useState<string[]>(activeOverlays);
  const [animatedHeight] = useState(new Animated.Value(defaultCollapsed ? 0 : 1));

  // Separate base layers and overlays
  const baseLayers = layers.filter(layer => layer.isBaseLayer);
  const overlayLayers = layers.filter(layer => !layer.isBaseLayer);

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const handleBaseLayerChange = async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    try {
      // Update map layer
      if (mapRef.current) {
        // For vector layers, use styleUrl; for raster, use tileServerUrl
        if (layer.type === 'vector' && layer.styleUrl) {
          // This would need to be implemented in the native modules
          console.log('🗺️ Switching to vector layer:', layer.styleUrl);
        } else {
          // This would need to be implemented in the native modules  
          console.log('🗺️ Switching to raster layer:', layer.url);
        }
      }

      setCurrentBaseLayer(layerId);
      onBaseLayerChange?.(layerId, layer);
      
      console.log(`🔄 Base layer changed to: ${layer.name}`);
    } catch (error) {
      console.error('❌ Failed to change base layer:', error);
    }
  };

  const handleOverlayToggle = async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    const isCurrentlyActive = currentOverlays.includes(layerId);
    const newOverlays = isCurrentlyActive
      ? currentOverlays.filter(id => id !== layerId)
      : [...currentOverlays, layerId];

    try {
      // Update map overlay
      if (mapRef.current) {
        if (isCurrentlyActive) {
          console.log('🗺️ Removing overlay:', layer.name);
          // Remove overlay logic
        } else {
          console.log('🗺️ Adding overlay:', layer.name);
          // Add overlay logic
        }
      }

      setCurrentOverlays(newOverlays);
      onOverlayToggle?.(layerId, layer, !isCurrentlyActive);
      
      console.log(`🔄 Overlay ${!isCurrentlyActive ? 'enabled' : 'disabled'}: ${layer.name}`);
    } catch (error) {
      console.error('❌ Failed to toggle overlay:', error);
    }
  };

  const getPositionStyles = () => {
    const basePosition = {
      position: 'absolute' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'top-left':
        return { ...basePosition, top: 20, left: 20 };
      case 'top-right':
        return { ...basePosition, top: 20, right: 20 };
      case 'bottom-left':
        return { ...basePosition, bottom: 20, left: 20 };
      case 'bottom-right':
        return { ...basePosition, bottom: 20, right: 20 };
      default:
        return { ...basePosition, top: 20, right: 20 };
    }
  };

  const renderLayerItem = (layer: LayerConfig, isActive: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={layer.id}
      style={[
        styles.layerItem,
        isActive && styles.layerItemActive,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {showThumbnails && layer.thumbnail && (
        <View style={styles.thumbnailContainer}>
          {/* Thumbnail would be implemented with Image component */}
          <Text style={styles.thumbnailPlaceholder}>🗺️</Text>
        </View>
      )}
      
      <View style={styles.layerInfo}>
        <Text style={[styles.layerName, isActive && styles.layerNameActive]}>
          {layer.name}
        </Text>
        {showDescriptions && layer.description && (
          <Text style={styles.layerDescription}>
            {layer.description}
          </Text>
        )}
        <Text style={styles.layerType}>
          {layer.type.toUpperCase()} • Zoom: {layer.minZoom || 0}-{layer.maxZoom || 18}
        </Text>
      </View>
      
      <View style={styles.layerIndicator}>
        {layer.isBaseLayer ? (
          <Text style={[styles.indicatorDot, isActive && styles.indicatorDotActive]}>
            ●
          </Text>
        ) : (
          <Text style={[styles.checkBox, isActive && styles.checkBoxActive]}>
            {isActive ? '☑️' : '☐'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, getPositionStyles(), style]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.expandIcon, { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }]}>
          ▼
        </Text>
      </TouchableOpacity>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 400], // Max height
            }),
            opacity: animatedHeight,
          }
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Base Layers Section */}
          {baseLayers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Base Layers</Text>
              {baseLayers.map(layer =>
                renderLayerItem(
                  layer,
                  currentBaseLayer === layer.id,
                  () => handleBaseLayerChange(layer.id)
                )
              )}
            </View>
          )}

          {/* Overlays Section */}
          {overlayLayers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overlays</Text>
              {overlayLayers.map(layer =>
                renderLayerItem(
                  layer,
                  currentOverlays.includes(layer.id),
                  () => handleOverlayToggle(layer.id)
                )
              )}
            </View>
          )}

          {/* Layer Stats */}
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              {baseLayers.length} base • {overlayLayers.length} overlays
            </Text>
            <Text style={styles.statsText}>
              Active: {layers.find(l => l.id === currentBaseLayer)?.name}
              {currentOverlays.length > 0 && ` + ${currentOverlays.length} overlays`}
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 280,
    minWidth: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  expandIcon: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  content: {
    overflow: 'hidden',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  layerItemActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  thumbnailContainer: {
    width: 40,
    height: 30,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  thumbnailPlaceholder: {
    fontSize: 16,
  },
  layerInfo: {
    flex: 1,
  },
  layerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  layerNameActive: {
    color: '#1d4ed8',
  },
  layerDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  layerType: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  layerIndicator: {
    marginLeft: 8,
  },
  indicatorDot: {
    fontSize: 18,
    color: '#d1d5db',
  },
  indicatorDotActive: {
    color: '#3b82f6',
  },
  checkBox: {
    fontSize: 16,
    color: '#d1d5db',
  },
  checkBoxActive: {
    color: '#10b981',
  },
  stats: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  statsText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 2,
  },
});

export default LayerControl; 