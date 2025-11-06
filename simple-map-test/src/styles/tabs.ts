import { StyleSheet } from 'react-native';

// Common tab styles
const commonStyles = {
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  infoBox: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#50C878',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  statusCard: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 8,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorText: {
    color: '#FF3B30',
    fontWeight: '500' as const,
  },
  errorSuggestion: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  locationInfoContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  locationInfoHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  locationInfoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  liveIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#4CAF50',
  },
  locationInfoText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  locationInfoTimestamp: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  actionRow: {
    marginBottom: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center' as const,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeButton: {
    backgroundColor: '#FF6B6B',
  },
  inactiveButton: {
    backgroundColor: '#4A90E2',
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  retryButton: {
    backgroundColor: '#8E44AD',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
};

// Location Tab Styles
export const locationTabStyles = StyleSheet.create({
  ...commonStyles,
});

// Cities Tab Styles
export const citiesTabStyles = StyleSheet.create({
  ...commonStyles,
  cityGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  cityButton: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '48%',
    marginBottom: 8,
  },
  cityEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  cityName: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#333333',
  },
});

// Settings Tab Styles
export const settingsTabStyles = StyleSheet.create({
  ...commonStyles,
  settingRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#333333',
  },
  switchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  switchText: {
    fontSize: 14,
    color: '#666666',
    marginHorizontal: 8,
  },
  markerButtonsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center' as const,
  },
  activeSmallButton: {
    backgroundColor: '#4CAF50',
  },
  inactiveSmallButton: {
    backgroundColor: '#4A90E2',
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 13,
  },
});

// Routing Tab Styles
export const routingTabStyles = StyleSheet.create({
  ...commonStyles,
  routingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'visible' as const,
  },
  routingSearchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
    overflow: 'visible' as const,
    zIndex: 10000,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  routingSearchBox: {
    flex: 1,
    overflow: 'visible' as const,
    zIndex: 10000,
  },
  inlineSearchInput: {
    // Removed - styles are now handled in SearchBox component
  },
  inlineSearchContainer: {
    // Removed - no extra container styling needed
    overflow: 'visible' as const,
    zIndex: 10000,
  },
  routingSeparator: {
    height: 12,
  },
  selectedLocations: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectedLocationText: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  getDirectionButton: {
    backgroundColor: '#9C1AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#9C1AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 48,
  },
  getDirectionButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  getDirectionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 16,
  },
  currentLocationButtonContainer: {
    marginLeft: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  transportContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  transportTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333333',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  transportModes: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  transportMode: {
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 12,
    minWidth: 70,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTransportMode: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  transportIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  selectedTransportIcon: {
    fontSize: 22,
  },
  transportName: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#333333',
    marginBottom: 4,
  },
  selectedTransportName: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  transportTime: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  transportDistance: {
    fontSize: 10,
    color: '#666666',
  },
  selectedTransportDistance: {
    color: '#E3F2FD',
  },
  routeInfo: {
    alignItems: 'center' as const,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  routeTime: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#000000',
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    width: '100%',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 16,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 16,
  },
  clearNavButton: {
    backgroundColor: '#FF6B6B',
  },
  clearNavButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  clearNavButtonInline: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start' as const,
  },
  clearNavButtonInlineText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 13,
  },
  navigationActive: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  navigationText: {
    color: '#FFFFFF',
    textAlign: 'center' as const,
    fontWeight: '600' as const,
    fontSize: 16,
  },
  navigationSubText: {
    color: '#FFFFFF',
    textAlign: 'center' as const,
    fontWeight: '400' as const,
    fontSize: 14,
    marginTop: 4,
  },
});

