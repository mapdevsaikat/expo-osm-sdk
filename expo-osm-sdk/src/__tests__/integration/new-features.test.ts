import {
  // Vector tile utilities
  DEFAULT_CONFIG,
  TILE_CONFIGS,
  isVectorTileUrl,
  validateStyleUrl,
  getDefaultTileConfig,

  // Types
  TileConfig,
} from '../../index';

describe('Core Features Integration Tests', () => {
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

  describe('TypeScript Type Definitions', () => {
    it('has proper type exports available at compile time', () => {
      const tileConfig: TileConfig = {
        name: 'Test',
        description: 'Test tile config',
        isVector: true,
        styleUrl: 'https://example.com/style.json'
      };
      expect(tileConfig.name).toBe('Test');
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
      expect(DEFAULT_CONFIG).toBeDefined();
      expect(TILE_CONFIGS).toBeDefined();
    });

    it('vector tiles are ready for production use', () => {
      expect(DEFAULT_CONFIG.isVectorTiles).toBe(true);
      expect(DEFAULT_CONFIG.styleUrl).toBeDefined();
      expect(TILE_CONFIGS.openMapTiles.styleUrl).toBeDefined();
    });
  });
});
