const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Web support configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add support for CSS imports on web
config.resolver.assetExts.push('css');

// Support for MapLibre GL JS
config.resolver.alias = {
  ...config.resolver.alias,
  'maplibre-gl': path.resolve(__dirname, 'node_modules/maplibre-gl'),
};

module.exports = config; 