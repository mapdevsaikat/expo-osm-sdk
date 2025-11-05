/**
 * Logger utility that only logs in development mode
 * All logs are automatically disabled in production builds
 */

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export const logger = {
  /**
   * Logs info messages (only in dev)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Logs warning messages (only in dev)
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Logs error messages (always, even in production)
   * Errors should always be logged for debugging production issues
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Logs info messages (only in dev)
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Logs debug messages (only in dev)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
};

