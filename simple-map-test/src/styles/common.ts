import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export const BOTTOM_SHEET_HEIGHT_25 = SCREEN_HEIGHT * 0.25;
export const BOTTOM_SHEET_HEIGHT_50 = SCREEN_HEIGHT * 0.5;
export const SEARCH_TOP_PADDING = Platform.OS === 'ios' ? 60 : 30;

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: SEARCH_TOP_PADDING,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  searchBox: {
    // Removed - styles are now handled in SearchBox component
  },
  searchBoxContainer: {
    // Removed - no extra container styling needed
  },
  navigationControlsContainer: {
    position: 'absolute',
    top: SEARCH_TOP_PADDING + 220,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999,
    overflow: 'hidden',
  },
  locationButtonContainer: {
    position: 'absolute',
    top: SEARCH_TOP_PADDING + 120 + 48 + 8,
    right: 16,
    zIndex: 999,
  },
  compassButtonContainer: {
    position: 'absolute',
    top: SEARCH_TOP_PADDING + 205 + 48 + 8 + 42 + 8, // Below LocationButton with 8px gap
    right: 16,
    zIndex: 999,
  },
});

