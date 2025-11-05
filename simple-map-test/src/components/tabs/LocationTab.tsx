import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { LocationError, LocationHealthStatus, Coordinate } from 'expo-osm-sdk';
import { getStatusEmoji, getErrorTypeEmoji } from '../../utils/helpers';
import { locationTabStyles } from '../../styles/tabs';

interface LocationTabProps {
  isTracking: boolean;
  trackingStatus: string;
  healthStatus: LocationHealthStatus | null;
  locationError: LocationError | null;
  retryAttempts: number;
  currentLocation: Coordinate | null;
  onToggleTracking: () => void;
  onRetry: () => void;
  onClearError: () => void;
}

export const LocationTab: React.FC<LocationTabProps> = ({
  isTracking,
  trackingStatus,
  healthStatus,
  locationError,
  retryAttempts,
  currentLocation,
  onToggleTracking,
  onRetry,
  onClearError,
}) => {
  return (
    <View style={locationTabStyles.tabContent}>
      <View style={locationTabStyles.statusCard}>
        <Text style={locationTabStyles.cardTitle}>📊 System Status</Text>
        <Text style={locationTabStyles.infoText}>
          Tracking: {getStatusEmoji(trackingStatus)} {isTracking ? 'Active' : 'Inactive'} ({trackingStatus})
        </Text>
        {healthStatus && (
          <>
            <Text style={locationTabStyles.infoText}>
              🗺️ View Ready: {healthStatus.isViewReady ? '✅' : '❌'}
            </Text>
            <Text style={locationTabStyles.infoText}>
              🌐 Network: {healthStatus.networkAvailable ? '✅' : '❌'}
            </Text>
          </>
        )}
        {isTracking && currentLocation && (
          <View style={locationTabStyles.locationInfoContainer}>
            <View style={locationTabStyles.locationInfoHeader}>
              <Text style={locationTabStyles.locationInfoTitle}>📍 Live Location</Text>
              <View style={locationTabStyles.liveIndicator}>
                <View style={locationTabStyles.liveDot} />
                <Text style={locationTabStyles.liveText}>Live</Text>
              </View>
            </View>
            <Text style={locationTabStyles.locationInfoText}>
              Lat: {currentLocation.latitude.toFixed(6)}
            </Text>
            <Text style={locationTabStyles.locationInfoText}>
              Lng: {currentLocation.longitude.toFixed(6)}
            </Text>
            {(currentLocation as any).accuracy && (
              <Text style={locationTabStyles.locationInfoText}>
                Accuracy: ±{((currentLocation as any).accuracy as number).toFixed(0)}m
              </Text>
            )}
            {(currentLocation as any).timestamp && (
              <Text style={locationTabStyles.locationInfoTimestamp}>
                Updated: {new Date((currentLocation as any).timestamp as number).toLocaleTimeString()}
              </Text>
            )}
          </View>
        )}
        {locationError && (
          <View style={locationTabStyles.errorContainer}>
            <Text style={[locationTabStyles.infoText, locationTabStyles.errorText]}>
              {getErrorTypeEmoji(locationError.type)} {locationError.userMessage}
            </Text>
            <Text style={locationTabStyles.errorSuggestion}>
              💡 {locationError.suggestedAction}
            </Text>
          </View>
        )}
      </View>

      <View style={locationTabStyles.actionRow}>
        <TouchableOpacity
          style={[
            locationTabStyles.primaryButton,
            isTracking ? locationTabStyles.activeButton : locationTabStyles.inactiveButton,
            (trackingStatus === 'starting' || trackingStatus === 'stopping') ? locationTabStyles.disabledButton : null
          ]}
          onPress={onToggleTracking}
          disabled={trackingStatus === 'starting' || trackingStatus === 'stopping'}
        >
          <Text style={locationTabStyles.buttonText}>
            {trackingStatus === 'starting'
              ? '⏳ Starting...'
              : trackingStatus === 'stopping'
              ? '⏳ Stopping...'
              : isTracking
              ? '🛑 Stop Tracking'
              : '📍 Start Tracking'}
          </Text>
        </TouchableOpacity>
      </View>

      {locationError && locationError.canRetry && retryAttempts < 3 && (
        <View style={locationTabStyles.actionRow}>
          <TouchableOpacity style={locationTabStyles.retryButton} onPress={onRetry}>
            <Text style={locationTabStyles.buttonText}>🔄 Retry ({locationError.type}) - {retryAttempts}/3</Text>
          </TouchableOpacity>
        </View>
      )}

      {locationError && (
        <View style={locationTabStyles.actionRow}>
          <TouchableOpacity style={locationTabStyles.clearButton} onPress={onClearError}>
            <Text style={locationTabStyles.buttonText}>🗑️ Clear Error</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

