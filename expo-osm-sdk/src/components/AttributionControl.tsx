import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Linking,
  Animated 
} from 'react-native';

export interface AttributionControlProps {
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  style?: object;
  expandedByDefault?: boolean;
  mandatory?: boolean; // If true, cannot be fully hidden
  customAttribution?: string[];
}

export default function AttributionControl({
  position = 'bottom-right',
  style,
  expandedByDefault = false,
  mandatory = true,
  customAttribution = []
}: AttributionControlProps) {
  const [expanded, setExpanded] = useState(expandedByDefault);
  const [animation] = useState(new Animated.Value(expandedByDefault ? 1 : 0));

  const toggleExpanded = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    Animated.timing(animation, {
      toValue: newExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const openOSMLink = () => {
    Linking.openURL('https://www.openstreetmap.org/copyright');
  };

  const openMapLibreLink = () => {
    Linking.openURL('https://maplibre.org/');
  };

  const positionStyles = {
    'bottom-left': { bottom: 10, left: 10 },
    'bottom-right': { bottom: 10, right: 10 },
    'top-left': { top: 10, left: 10 },
    'top-right': { top: 10, right: 10 },
  };

  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 120], // Collapsed vs expanded height
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        positionStyles[position],
        { height: animatedHeight },
        style
      ]}
    >
      {/* Always visible attribution line */}
      <TouchableOpacity 
        style={styles.toggleButton} 
        onPress={toggleExpanded}
        accessibilityLabel="Toggle map attribution"
      >
        <Text style={styles.compactText}>
          ⓘ © OSM {expanded ? '−' : '+'}
        </Text>
      </TouchableOpacity>

      {/* Expanded attribution details */}
      {expanded && (
        <View style={styles.expandedContent}>
          <TouchableOpacity onPress={openOSMLink}>
            <Text style={styles.linkText}>
              © OpenStreetMap contributors
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={openMapLibreLink}>
            <Text style={styles.linkText}>
              Powered by MapLibre GL
            </Text>
          </TouchableOpacity>

          {customAttribution.map((attr, index) => (
            <Text key={index} style={styles.customText}>
              {attr}
            </Text>
          ))}

          <Text style={styles.noteText}>
            Map data licensed under ODbL
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    minWidth: 100,
    maxWidth: 200,
  },
  toggleButton: {
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
  },
  expandedContent: {
    padding: 8,
    paddingTop: 4,
  },
  linkText: {
    fontSize: 10,
    color: '#0066cc',
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  customText: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 8,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
}); 