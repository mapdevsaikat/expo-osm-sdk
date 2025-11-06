import { logger } from '../utils/logger';

/**
 * Tile Cache Service
 * Handles caching of map tiles for offline use
 */

// Lazy load FileSystem to handle cases where native module isn't available
let FileSystem: any = null;
let isFileSystemAvailable = false;

try {
  FileSystem = require('expo-file-system');
  isFileSystemAvailable = FileSystem && FileSystem.cacheDirectory;
} catch (error) {
  logger.warn('⚠️ expo-file-system not available - tile caching disabled');
  isFileSystemAvailable = false;
}

const CACHE_DIR = isFileSystemAvailable ? `${FileSystem.cacheDirectory}tiles/` : '';
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB
const TILE_EXPIRY_DAYS = 30; // Tiles expire after 30 days

interface TileInfo {
  path: string;
  size: number;
  timestamp: number;
}

/**
 * Check if FileSystem is available
 */
export const checkFileSystemAvailability = (): boolean => {
  return isFileSystemAvailable;
};

/**
 * Get FileSystem availability status
 */
export const getFileSystemStatus = (): { available: boolean; reason?: string } => {
  if (isFileSystemAvailable && FileSystem) {
    return { available: true };
  }
  return { 
    available: false, 
    reason: 'expo-file-system native module not linked. Please rebuild the app.' 
  };
};

/**
 * Get cache directory path
 */
export const getCacheDir = (): string => CACHE_DIR;

/**
 * Initialize cache directory
 */
export const initializeCache = async (): Promise<void> => {
  if (!isFileSystemAvailable || !FileSystem) {
    logger.warn('⚠️ FileSystem not available - cache initialization skipped');
    return;
  }
  
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      logger.log('📦 Tile cache directory created');
    }
  } catch (error) {
    logger.error('❌ Failed to initialize cache directory:', error);
  }
};

/**
 * Get tile path from URL
 * Converts: https://tile.openstreetmap.org/12/2048/1365.png
 * To: cache/tiles/12/2048/1365.png
 */
export const getTilePath = (tileUrl: string): string => {
  try {
    // Extract z/x/y from URL
    const urlPattern = /\/(\d+)\/(\d+)\/(\d+)\.(png|pbf|jpg|jpeg)/i;
    const match = tileUrl.match(urlPattern);
    
    if (!match) {
      // For vector tiles, use a hash of the URL
      const urlHash = tileUrl.split('/').pop() || 'unknown';
      return `${CACHE_DIR}vector/${urlHash}`;
    }
    
    const [, z, x, y, ext] = match;
    return `${CACHE_DIR}${z}/${x}/${y}.${ext}`;
  } catch (error) {
    logger.error('❌ Failed to parse tile URL:', error);
    return `${CACHE_DIR}unknown/${Date.now()}`;
  }
};

/**
 * Check if tile exists in cache
 */
export const isTileCached = async (tileUrl: string): Promise<boolean> => {
  if (!isFileSystemAvailable || !FileSystem) {
    return false;
  }
  
  try {
    const tilePath = getTilePath(tileUrl);
    const fileInfo = await FileSystem.getInfoAsync(tilePath);
    return fileInfo.exists && fileInfo.size > 0;
  } catch (error) {
    logger.warn('⚠️ Failed to check tile cache:', error);
    return false;
  }
};

/**
 * Check if cached tile is expired
 */
export const isTileExpired = async (tileUrl: string): Promise<boolean> => {
  if (!isFileSystemAvailable || !FileSystem) {
    return true;
  }
  
  try {
    const tilePath = getTilePath(tileUrl);
    const fileInfo = await FileSystem.getInfoAsync(tilePath);
    
    if (!fileInfo.exists) return true;
    
    const now = Date.now();
    const fileTime = fileInfo.modificationTime * 1000; // Convert to milliseconds
    const expiryTime = TILE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    return (now - fileTime) > expiryTime;
  } catch (error) {
    logger.warn('⚠️ Failed to check tile expiry:', error);
    return true;
  }
};

/**
 * Get cached tile URI
 * Returns file:// URI for use in map
 */
export const getCachedTileUri = (tileUrl: string): string => {
  const tilePath = getTilePath(tileUrl);
  // Convert to file:// URI
  if (tilePath.startsWith('file://')) {
    return tilePath;
  }
  return `file://${tilePath}`;
};

/**
 * Cache a tile from URL
 */
export const cacheTile = async (tileUrl: string): Promise<string | null> => {
  if (!isFileSystemAvailable || !FileSystem) {
    return null;
  }
  
  try {
    const tilePath = getTilePath(tileUrl);
    
    // Create directory if needed
    const dirPath = tilePath.substring(0, tilePath.lastIndexOf('/'));
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
    
    // Download tile
    const downloadResult = await FileSystem.downloadAsync(tileUrl, tilePath);
    
    if (downloadResult.status === 200) {
      logger.log(`✅ Tile cached: ${tilePath}`);
      return tilePath;
    } else {
      logger.warn(`⚠️ Failed to cache tile: ${tileUrl} (status: ${downloadResult.status})`);
      return null;
    }
  } catch (error) {
    logger.error('❌ Failed to cache tile:', error);
    return null;
  }
};

/**
 * Get tile from cache or download
 * Returns file:// URI if cached, or original URL if not
 */
export const getTile = async (tileUrl: string): Promise<string> => {
  try {
    // Check if tile is cached and not expired
    const cached = await isTileCached(tileUrl);
    const expired = cached ? await isTileExpired(tileUrl) : true;
    
    if (cached && !expired) {
      // Return cached tile URI
      const cachedUri = getCachedTileUri(tileUrl);
      logger.log(`📦 Using cached tile: ${tileUrl}`);
      return cachedUri;
    }
    
    // Cache tile in background (don't wait)
    cacheTile(tileUrl).catch(error => {
      logger.warn('⚠️ Background tile caching failed:', error);
    });
    
    // Return original URL for now
    return tileUrl;
  } catch (error) {
    logger.error('❌ Failed to get tile:', error);
    return tileUrl; // Fallback to original URL
  }
};

/**
 * Get cache size in bytes
 */
export const getCacheSize = async (): Promise<number> => {
  if (!isFileSystemAvailable || !FileSystem || !CACHE_DIR) {
    return 0;
  }
  
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) return 0;
    
    // Recursively calculate size
    const calculateSize = async (path: string): Promise<number> => {
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return 0;
      
      if (info.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(path);
        let totalSize = 0;
        for (const file of files) {
          totalSize += await calculateSize(`${path}/${file}`);
        }
        return totalSize;
      } else {
        return info.size || 0;
      }
    };
    
    return await calculateSize(CACHE_DIR);
  } catch (error) {
    logger.error('❌ Failed to calculate cache size:', error);
    return 0;
  }
};

/**
 * Get cache size in human-readable format
 */
export const getCacheSizeFormatted = async (): Promise<string> => {
  const size = await getCacheSize();
  const mb = size / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};

/**
 * Clear expired tiles
 */
export const clearExpiredTiles = async (): Promise<number> => {
  if (!isFileSystemAvailable || !FileSystem || !CACHE_DIR) {
    return 0;
  }
  
  let clearedCount = 0;
  
  try {
    const clearDirectory = async (path: string): Promise<void> => {
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return;
      
      if (info.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(path);
        for (const file of files) {
          await clearDirectory(`${path}/${file}`);
        }
      } else {
        // Check if file is expired
        const fileTime = info.modificationTime * 1000;
        const now = Date.now();
        const expiryTime = TILE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        
        if ((now - fileTime) > expiryTime) {
          await FileSystem.deleteAsync(path, { idempotent: true });
          clearedCount++;
        }
      }
    };
    
    await clearDirectory(CACHE_DIR);
    logger.log(`🗑️ Cleared ${clearedCount} expired tiles`);
  } catch (error) {
    logger.error('❌ Failed to clear expired tiles:', error);
  }
  
  return clearedCount;
};

/**
 * Clear all cached tiles
 */
export const clearAllTiles = async (): Promise<void> => {
  if (!isFileSystemAvailable || !FileSystem || !CACHE_DIR) {
    logger.warn('⚠️ FileSystem not available - cannot clear cache');
    return;
  }
  
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      logger.log('🗑️ All tiles cleared from cache');
    }
  } catch (error) {
    logger.error('❌ Failed to clear all tiles:', error);
  }
};

/**
 * Clean cache if it exceeds max size
 */
export const cleanCacheIfNeeded = async (): Promise<void> => {
  try {
    const currentSize = await getCacheSize();
    
    if (currentSize > MAX_CACHE_SIZE) {
      logger.log(`⚠️ Cache size (${(currentSize / 1024 / 1024).toFixed(2)} MB) exceeds limit (${MAX_CACHE_SIZE / 1024 / 1024} MB)`);
      
      // Clear expired tiles first
      await clearExpiredTiles();
      
      // If still too large, clear oldest tiles
      const newSize = await getCacheSize();
      if (newSize > MAX_CACHE_SIZE) {
        logger.log('🗑️ Cache still too large, clearing oldest tiles...');
        // TODO: Implement LRU cache eviction
        await clearExpiredTiles();
      }
    }
  } catch (error) {
    logger.error('❌ Failed to clean cache:', error);
  }
};

