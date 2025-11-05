import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { settingsTabStyles } from '../../styles/tabs';

interface SettingsTabProps {
  useVectorTiles: boolean;
  markersCount: number;
  isMarkerModeEnabled: boolean;
  onToggleTileMode: () => void;
  onToggleMarkerMode: () => void;
  onClearMarkers: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  useVectorTiles,
  markersCount,
  isMarkerModeEnabled,
  onToggleTileMode,
  onToggleMarkerMode,
  onClearMarkers,
}) => {
  return (
    <View style={settingsTabStyles.tabContent}>
      <View style={settingsTabStyles.settingRow}>
        <Text style={settingsTabStyles.settingLabel}>Map Style</Text>
        <View style={settingsTabStyles.switchContainer}>
          <Text style={settingsTabStyles.switchText}>Raster</Text>
          <Switch
            value={useVectorTiles}
            onValueChange={onToggleTileMode}
            trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
            thumbColor={useVectorTiles ? '#FFFFFF' : '#FFFFFF'}
          />
          <Text style={settingsTabStyles.switchText}>Vector</Text>
        </View>
      </View>

      <View style={settingsTabStyles.settingRow}>
        <Text style={settingsTabStyles.settingLabel}>Markers ({markersCount})</Text>
        <View style={settingsTabStyles.markerButtonsContainer}>
          <TouchableOpacity
            style={[
              settingsTabStyles.smallButton,
              isMarkerModeEnabled ? settingsTabStyles.activeSmallButton : settingsTabStyles.inactiveSmallButton,
            ]}
            onPress={onToggleMarkerMode}
          >
            <Text style={settingsTabStyles.smallButtonText}>
              {isMarkerModeEnabled ? '✅ Stop' : '📍 Add'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[settingsTabStyles.clearButton, { marginLeft: 8 }]} onPress={onClearMarkers}>
            <Text style={settingsTabStyles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isMarkerModeEnabled && (
        <View style={settingsTabStyles.infoBox}>
          <Text style={settingsTabStyles.infoText}>✅ Marker mode active - Tap the map to add markers</Text>
        </View>
      )}

      <View style={settingsTabStyles.infoBox}>
        <Text style={settingsTabStyles.infoText}>💡 Click "Add Marker" button to enable marker placement</Text>
        <Text style={settingsTabStyles.infoText}>📱 Use pinch & pan gestures</Text>
        <Text style={settingsTabStyles.infoText}>🔄 Swipe up for more controls</Text>
        <Text style={settingsTabStyles.infoText}>🧪 Test error scenarios in Location tab</Text>
      </View>
    </View>
  );
};

