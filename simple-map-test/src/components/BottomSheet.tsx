import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import type { TabType, BottomSheetState } from '../types'  ;
import { LocationTab, CitiesTab, SettingsTab, RoutingTab } from './tabs';
import type { LocationError, LocationHealthStatus, MarkerConfig, OSMViewRef, SearchLocation, Coordinate } from 'expo-osm-sdk';
import type { NavigationState } from '../types';
import type { City } from '../constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT_25 = SCREEN_HEIGHT * 0.25;
const BOTTOM_SHEET_HEIGHT_50 = SCREEN_HEIGHT * 0.5;

interface BottomSheetProps {
  bottomSheetState: BottomSheetState;
  activeTab: TabType;
  onToggleBottomSheet: () => void;
  onCloseBottomSheet: () => void;
  onTabChange: (tab: TabType) => void;
  
  // Location Tab Props
  isTracking: boolean;
  trackingStatus: string;
  healthStatus: LocationHealthStatus | null;
  locationError: LocationError | null;
  retryAttempts: number;
  currentLocation: Coordinate | null;
  onToggleTracking: () => void;
  onRetry: () => void;
  onClearError: () => void;
  
  // Cities Tab Props
  onCityPress: (city: City) => void;
  
  // Settings Tab Props
  useVectorTiles: boolean;
  markersCount: number;
  isMarkerModeEnabled: boolean;
  onToggleTileMode: () => void;
  onToggleMarkerMode: () => void;
  onClearMarkers: () => void;
  
  // Routing Tab Props
  navigation: NavigationState;
  mapRef: React.RefObject<OSMViewRef | null>;
  markers: MarkerConfig[];
  onFromLocationSelected: (location: SearchLocation) => void;
  onToLocationSelected: (location: SearchLocation) => void;
  onSelectTransportMode: (modeId: string) => void;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
  onClearNavigation: () => void;
  onSetMarkers: React.Dispatch<React.SetStateAction<MarkerConfig[]>>;
  onAnimateToLocation: (lat: number, lng: number, zoom: number) => Promise<void>;
  onSetNavigation: React.Dispatch<React.SetStateAction<NavigationState>>;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  bottomSheetState,
  activeTab,
  onToggleBottomSheet,
  onCloseBottomSheet,
  onTabChange,
  isTracking,
  trackingStatus,
  healthStatus,
  locationError,
  retryAttempts,
  currentLocation,
  onToggleTracking,
  onRetry,
  onClearError,
  onCityPress,
  useVectorTiles,
  markersCount,
  isMarkerModeEnabled,
  onToggleTileMode,
  onToggleMarkerMode,
  onClearMarkers,
  navigation,
  mapRef,
  markers,
  onFromLocationSelected,
  onToLocationSelected,
  onSelectTransportMode,
  onStartNavigation,
  onStopNavigation,
  onClearNavigation,
  onSetMarkers,
  onAnimateToLocation,
  onSetNavigation,
}) => {
  return (
    <>
      {/* Bottom Sheet Handle */}
      <TouchableOpacity
        style={[
          styles.bottomSheetHandle,
          {
            bottom:
              bottomSheetState === 'closed'
                ? 0
                : bottomSheetState === 'half'
                ? BOTTOM_SHEET_HEIGHT_25
                : BOTTOM_SHEET_HEIGHT_50,
          },
        ]}
        onPress={onToggleBottomSheet}
      >
        <View style={styles.handle} />
        <Text style={styles.handleText}>
          {bottomSheetState === 'closed'
            ? '↑ Explore Expo-OSM'
            : bottomSheetState === 'half'
            ? '↑ Expand More'
            : '⌄ Expo-OSM'}
        </Text>
      </TouchableOpacity>

      {/* Collapsible Bottom Sheet */}
      {bottomSheetState !== 'closed' && (
        <View
          style={[
            styles.bottomSheet,
            {
              height:
                bottomSheetState === 'half' ? BOTTOM_SHEET_HEIGHT_25 : BOTTOM_SHEET_HEIGHT_50,
            },
          ]}
        >
          {/* Tab Navigation with Close Button */}
          <View style={styles.tabNavigationWrapper}>
            <View style={styles.tabNavigation}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'location' && styles.activeTab]}
                onPress={() => onTabChange('location')}
              >
                <Text style={[styles.tabText, activeTab === 'location' && styles.activeTabText]}>
                  🛡️ Location
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'cities' && styles.activeTab]}
                onPress={() => onTabChange('cities')}
              >
                <Text style={[styles.tabText, activeTab === 'cities' && styles.activeTabText]}>
                  ✈️ Cities
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'routing' && styles.activeTab]}
                onPress={() => onTabChange('routing')}
              >
                <Text style={[styles.tabText, activeTab === 'routing' && styles.activeTabText]}>
                  🧭 Routing
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
                onPress={() => onTabChange('settings')}
              >
                <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
                  ⚙️ Settings
                </Text>
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onCloseBottomSheet}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView 
            style={styles.tabContentContainer} 
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {activeTab === 'location' && (
              <LocationTab
                isTracking={isTracking}
                trackingStatus={trackingStatus}
                healthStatus={healthStatus}
                locationError={locationError}
                retryAttempts={retryAttempts}
                currentLocation={currentLocation}
                onToggleTracking={onToggleTracking}
                onRetry={onRetry}
                onClearError={onClearError}
              />
            )}
            {activeTab === 'cities' && <CitiesTab onCityPress={onCityPress} />}
            {activeTab === 'settings' && (
              <SettingsTab
                useVectorTiles={useVectorTiles}
                markersCount={markersCount}
                isMarkerModeEnabled={isMarkerModeEnabled}
                onToggleTileMode={onToggleTileMode}
                onToggleMarkerMode={onToggleMarkerMode}
                onClearMarkers={onClearMarkers}
              />
            )}
            {activeTab === 'routing' && (
              <RoutingTab
                navigation={navigation}
                isTracking={isTracking}
                mapRef={mapRef}
                markers={markers}
                onFromLocationSelected={onFromLocationSelected}
                onToLocationSelected={onToLocationSelected}
                onSelectTransportMode={onSelectTransportMode}
                onStartNavigation={onStartNavigation}
                onStopNavigation={onStopNavigation}
                onClearNavigation={onClearNavigation}
                onSetMarkers={onSetMarkers}
                onAnimateToLocation={onAnimateToLocation}
                onSetNavigation={onSetNavigation}
              />
            )}
          </ScrollView>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  bottomSheetHandle: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
    minHeight: 60,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  handleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 1001,
  },
  tabNavigationWrapper: {
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  tabNavigation: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#4A90E2',
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: -48,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666666',
  },
  tabContentContainer: {
    flex: 1,
  },
});

