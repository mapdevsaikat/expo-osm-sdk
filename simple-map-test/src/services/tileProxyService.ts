import { getTile, initializeCache, cleanCacheIfNeeded, checkFileSystemAvailability, getFileSystemStatus } from './tileCacheService';
import { logger } from '../utils/logger';

/**
 * Tile Proxy Service
 * Intercepts tile URLs and serves from cache when available
 */

let cacheInitialized = false;

/**
 * Check FileSystem availability and initialize tile proxy service
 */
export const initializeTileProxy = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Check FileSystem availability first
    const status = getFileSystemStatus();
    
    if (!status.available) {
      logger.warn(`⚠️ Tile cache disabled: ${status.reason}`);
      return {
        success: false,
        message: status.reason || 'FileSystem not available'
      };
    }
    
    if (!cacheInitialized) {
      await initializeCache();
      cacheInitialized = true;
      logger.log('✅ Tile proxy service initialized - caching enabled');
      return {
        success: true,
        message: 'Tile caching enabled'
      };
    }
    
    return {
      success: true,
      message: 'Tile proxy already initialized'
    };
  } catch (error) {
    logger.error('❌ Failed to initialize tile proxy:', error);
    return {
      success: false,
      message: `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Proxy a tile URL
 * Returns cached tile URI if available, otherwise returns original URL
 * 
 * Note: Since we can't intercept native map tile requests directly,
 * this service prepares cached tiles for use. The actual caching
 * happens when tiles are requested through the map component.
 */
export const proxyTileUrl = async (tileUrl: string): Promise<string> => {
  try {
    if (!cacheInitialized) {
      await initializeTileProxy();
    }
    
    // Get tile from cache or download
    const cachedUri = await getTile(tileUrl);
    
    // Periodically clean cache
    if (Math.random() < 0.01) { // 1% chance to clean on each request
      cleanCacheIfNeeded().catch(error => {
        logger.warn('⚠️ Cache cleanup failed:', error);
      });
    }
    
    return cachedUri;
  } catch (error) {
    logger.error('❌ Tile proxy failed:', error);
    return tileUrl; // Fallback to original URL
  }
};

/**
 * Pre-cache tiles for a region
 * Useful for offline map downloads
 */
export const preCacheRegion = async (
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  minZoom: number = 10,
  maxZoom: number = 15
): Promise<{ cached: number; failed: number }> => {
  let cached = 0;
  let failed = 0;
  
  try {
    logger.log(`📦 Pre-caching region: ${minLat},${minLng} to ${maxLat},${maxLng} (zoom ${minZoom}-${maxZoom})`);
    
    // Calculate tile coordinates for the region
    const latLngToTile = (lat: number, lng: number, zoom: number) => {
      const n = Math.pow(2, zoom);
      const x = Math.floor((lng + 180) / 360 * n);
      const latRad = lat * Math.PI / 180;
      const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
      return { x, y };
    };
    
    const minTile = latLngToTile(maxLat, minLng, maxZoom);
    const maxTile = latLngToTile(minLat, maxLng, maxZoom);
    
    // Cache tiles for each zoom level
    for (let z = minZoom; z <= maxZoom; z++) {
      const scale = Math.pow(2, maxZoom - z);
      const startX = Math.floor(minTile.x / scale);
      const endX = Math.floor(maxTile.x / scale);
      const startY = Math.floor(minTile.y / scale);
      const endY = Math.floor(maxTile.y / scale);
      
      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          // Construct tile URL (example for OSM)
          const tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
          
          try {
            const result = await getTile(tileUrl);
            if (result && result.startsWith('file://')) {
              cached++;
            } else {
              failed++;
            }
          } catch (error) {
            failed++;
          }
          
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
    
    logger.log(`✅ Pre-caching complete: ${cached} cached, ${failed} failed`);
  } catch (error) {
    logger.error('❌ Pre-caching failed:', error);
  }
  
  return { cached, failed };
};

