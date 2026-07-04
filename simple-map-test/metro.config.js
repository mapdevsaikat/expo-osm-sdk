const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-osm-sdk is installed from npm (see package.json). No watchFolders or
// symlink resolver configuration is required for production or normal dev.
// For local SDK hacking, use `npm run link:sdk-local` (see README).

// Block maplibre-gl (browser-only library) from native Android/iOS bundles.
// expo-osm-sdk's .web.tsx files use it, but Metro correctly excludes those
// from native builds. This resolver stub prevents any residual graph edges
// from causing "Cannot read property … of undefined" runtime errors.
const originalResolver = config.resolver?.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform !== 'web' &&
    (moduleName === 'maplibre-gl' || moduleName.startsWith('maplibre-gl/'))
  ) {
    return { type: 'empty' };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
