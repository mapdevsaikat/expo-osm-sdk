const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support for platform-specific files (.web.tsx, .native.tsx, etc.)
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Support for TypeScript platform-specific extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.tsx',
  'web.ts',
  'web.jsx',
  'web.js'
];

module.exports = config; 