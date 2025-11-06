import { useState, useEffect, useCallback } from 'react';
import {
  initializeCache,
  getCacheSizeFormatted,
  clearAllTiles,
  clearExpiredTiles,
  cleanCacheIfNeeded,
  checkFileSystemAvailability,
  getFileSystemStatus,
} from '../services/tileCacheService';
import { initializeTileProxy } from '../services/tileProxyService';
import { logger } from '../utils/logger';

/**
 * Hook for managing tile cache
 */
export const useTileCache = () => {
  const [cacheSize, setCacheSize] = useState<string>('0 MB');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isFileSystemAvailable, setIsFileSystemAvailable] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<string>('Initializing...');

  // Initialize cache on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Check FileSystem availability first
        const fsAvailable = checkFileSystemAvailability();
        setIsFileSystemAvailable(fsAvailable);
        
        if (!fsAvailable) {
          const status = getFileSystemStatus();
          setCacheStatus(status.reason || 'FileSystem not available');
          logger.warn('⚠️ Tile cache disabled - FileSystem not available');
          return;
        }
        
        // Initialize cache
        const result = await initializeTileProxy();
        setCacheStatus(result.message);
        
        if (result.success) {
          setIsInitialized(true);
          await refreshCacheSize();
          logger.log('✅ Tile cache initialized');
        } else {
          setCacheStatus(result.message);
          logger.warn(`⚠️ Tile cache initialization failed: ${result.message}`);
        }
      } catch (error) {
        logger.error('❌ Failed to initialize tile cache:', error);
        setCacheStatus('Initialization failed');
      }
    };
    init();
  }, []);

  // Refresh cache size
  const refreshCacheSize = useCallback(async () => {
    try {
      const size = await getCacheSizeFormatted();
      setCacheSize(size);
    } catch (error) {
      logger.error('❌ Failed to refresh cache size:', error);
    }
  }, []);

  // Clear all tiles
  const clearCache = useCallback(async () => {
    try {
      setIsClearing(true);
      await clearAllTiles();
      await refreshCacheSize();
      logger.log('✅ Cache cleared');
    } catch (error) {
      logger.error('❌ Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  }, [refreshCacheSize]);

  // Clear expired tiles
  const clearExpired = useCallback(async () => {
    try {
      setIsClearing(true);
      const cleared = await clearExpiredTiles();
      await refreshCacheSize();
      logger.log(`✅ Cleared ${cleared} expired tiles`);
      return cleared;
    } catch (error) {
      logger.error('❌ Failed to clear expired tiles:', error);
      return 0;
    } finally {
      setIsClearing(false);
    }
  }, [refreshCacheSize]);

  // Clean cache if needed
  const cleanCache = useCallback(async () => {
    try {
      await cleanCacheIfNeeded();
      await refreshCacheSize();
    } catch (error) {
      logger.error('❌ Failed to clean cache:', error);
    }
  }, [refreshCacheSize]);

  return {
    cacheSize,
    isInitialized,
    isClearing,
    isFileSystemAvailable,
    cacheStatus,
    refreshCacheSize,
    clearCache,
    clearExpired,
    cleanCache,
  };
};

