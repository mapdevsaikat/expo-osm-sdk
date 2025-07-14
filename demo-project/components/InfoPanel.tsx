import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { X, MapPin, Smartphone, Globe } from 'lucide-react-native';

interface InfoPanelProps {
  onClose: () => void;
}

export function InfoPanel({ onClose }: InfoPanelProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>OpenStreetMap Demo</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>About This Demo</Text>
            </View>
            <Text style={styles.sectionText}>
              This demo showcases the expo-osm-sdk package for integrating 
              OpenStreetMap functionality into Expo applications. The SDK 
              provides native performance and features for mobile platforms.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Smartphone size={18} color="#059669" />
              <Text style={styles.sectionTitle}>Native Features</Text>
            </View>
            <Text style={styles.sectionText}>
              • High-performance map rendering{'\n'}
              • Touch gestures (pinch, pan, rotate){'\n'}
              • Custom markers and overlays{'\n'}
              • Location services integration{'\n'}
              • Offline map capabilities
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Globe size={18} color="#dc2626" />
              <Text style={styles.sectionTitle}>Platform Support</Text>
            </View>
            <Text style={styles.sectionText}>
              This demo is optimized for Android and iOS platforms. 
              The native experience provides better performance and 
              platform-specific optimizations compared to web alternatives.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Controls</Text>
            <Text style={styles.sectionText}>
              • Zoom In/Out: Use the + and - buttons{'\n'}
              • Get Location: Navigation button (requires permissions){'\n'}
              • Reset View: Reset to default San Francisco view{'\n'}
              • Touch: Pan around the map area
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});