import {
  // Vector tile utilities
  DEFAULT_CONFIG,
  TILE_CONFIGS,
  isVectorTileUrl,
  validateStyleUrl,
  getDefaultTileConfig,
  
  // Search functionality
  searchLocations,
  reverseGeocode,
  getSuggestions,
  useNominatimSearch,
  SearchBox,
  
  // Types
  TileConfig,
  SearchLocation,
  NominatimSearchResult,
  NominatimAddress,
  UseNominatimSearchReturn,
  SearchBoxProps
} from '../../index';

describe('New Features Integration Tests', () => {
  describe('Vector Tile Configuration', () => {
    it('exports vector tile configuration correctly', () => {
      expect(DEFAULT_CONFIG).toBeDefined();
      expect(TILE_CONFIGS).toBeDefined();
      expect(typeof isVectorTileUrl).toBe('function');
      expect(typeof validateStyleUrl).toBe('function');
      expect(typeof getDefaultTileConfig).toBe('function');
    });

    it('has correct default configuration', () => {
      expect(DEFAULT_CONFIG.isVectorTiles).toBe(true);
      expect(DEFAULT_CONFIG.styleUrl).toContain('basemaps.cartocdn.com');
    });

    it('has proper tile configurations', () => {
      expect(TILE_CONFIGS.openMapTiles).toBeDefined();
      expect(TILE_CONFIGS.openStreetMap).toBeDefined();
      
      expect(TILE_CONFIGS.openMapTiles.isVector).toBe(true);
      expect(TILE_CONFIGS.openStreetMap.isVector).toBe(false);
    });
  });

  describe('Search Functionality Exports', () => {
    it('exports search utility functions', () => {
      expect(typeof searchLocations).toBe('function');
      expect(typeof reverseGeocode).toBe('function');
      expect(typeof getSuggestions).toBe('function');
    });

    it('exports search React components', () => {
      expect(typeof useNominatimSearch).toBe('function');
      expect(typeof SearchBox).toBe('function');
    });
  });

  describe('TypeScript Type Definitions', () => {
    it('has proper type exports available at compile time', () => {
      // These tests verify that TypeScript types are properly exported
      // If they compile without errors, the types are working correctly
      
      const tileConfig: TileConfig = {
        name: 'Test',
        description: 'Test tile config',
        isVector: true,
        styleUrl: 'https://example.com/style.json'
      };
      expect(tileConfig.name).toBe('Test');

      const searchLocation: SearchLocation = {
        coordinate: { latitude: 40.7128, longitude: -74.0060 },
        displayName: 'Test Location',
        placeId: 'test-123'
      };
      expect(searchLocation.displayName).toBe('Test Location');

      const nominatimResult: NominatimSearchResult = {
        place_id: 'test-place',
        display_name: 'Test Place',
        lat: '40.7128',
        lon: '-74.0060',
        boundingbox: ['40.1', '40.9', '-74.5', '-73.5'],
        type: 'city',
        importance: 0.8,
        class: 'place'
      };
      expect(nominatimResult.place_id).toBe('test-place');
    });
  });

  describe('Vector Tile Utilities', () => {
    it('detects vector tile URLs correctly', () => {
      expect(isVectorTileUrl('https://example.com/style.json')).toBe(true);
      expect(isVectorTileUrl('https://tile.openstreetmap.org/{z}/{x}/{y}.png')).toBe(false);
    });

    it('validates style URLs', () => {
      expect(() => validateStyleUrl('https://example.com/style.json')).not.toThrow();
      expect(() => validateStyleUrl('http://insecure.com/style.json')).toThrow();
      expect(() => validateStyleUrl('')).toThrow();
    });

    it('gets default tile configurations', () => {
      const defaultConfig = getDefaultTileConfig();
      expect(defaultConfig).toEqual(TILE_CONFIGS.openStreetMap);

      const openMapTilesConfig = getDefaultTileConfig('openMapTiles');
      expect(openMapTilesConfig).toEqual(TILE_CONFIGS.openMapTiles);
    });
  });

  describe('Module Structure', () => {
    it('maintains backward compatibility', () => {
      // Ensure existing exports are still available
      expect(DEFAULT_CONFIG).toBeDefined();
      expect(TILE_CONFIGS).toBeDefined();
    });

    it('adds new exports without breaking changes', () => {
      // Verify new search exports don't conflict with existing ones
      expect(searchLocations).toBeDefined();
      expect(useNominatimSearch).toBeDefined();
      expect(SearchBox).toBeDefined();
    });
  });

  describe('Feature Readiness', () => {
    it('vector tiles are ready for production use', () => {
      expect(DEFAULT_CONFIG.isVectorTiles).toBe(true);
      expect(DEFAULT_CONFIG.styleUrl).toBeDefined();
      expect(TILE_CONFIGS.openMapTiles.styleUrl).toBeDefined();
    });

    it('search functionality is properly structured', () => {
      // Verify the search API is consistent
      expect(typeof searchLocations).toBe('function');
      expect(typeof reverseGeocode).toBe('function');
      expect(typeof getSuggestions).toBe('function');
      
      // React components should be functions (components or hooks)
      expect(typeof useNominatimSearch).toBe('function');
      expect(typeof SearchBox).toBe('function');
    });
  });
}); 