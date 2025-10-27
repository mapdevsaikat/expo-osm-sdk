# Publishing Guide for Expo OSM SDK

This guide walks through the complete process of publishing the Expo OSM SDK to npm.

## Pre-Publishing Checklist

### ✅ Package Preparation
- [x] Version updated to 1.0.0 in package.json
- [x] All tests passing (68/68 tests)
- [x] Build successful (TypeScript compilation)
- [x] Plugin build successful
- [x] Documentation updated (README.md, CHANGELOG.md)
- [x] License file created (MIT)
- [x] Package files configured (.npmignore, files array)

### ✅ Quality Assurance
- [x] Test suite covers accuracy, performance, and compatibility
- [x] Real-world coordinate validation (NYC↔London: 5,570km)
- [x] Performance benchmarks met (10,000 coordinates in <100ms)
- [x] TypeScript types generated and included
- [x] Native modules properly configured

### ✅ Publishing Configuration
- [x] Package name: `expo-osm-sdk`
- [x] Version: `1.0.0`
- [x] Main entry point: `build/index.js`
- [x] Types: `build/index.d.ts`
- [x] Plugin export: `./plugin`
- [x] Repository URLs configured
- [x] Keywords optimized for discovery

## Publishing Steps

### 1. Final Pre-Publishing Verification

```bash
# Run all tests one final time
npm run test:all

# Clean and rebuild everything
npm run clean
npm run build:all

# Verify package contents
npm pack --dry-run
```

### 2. Login to npm

```bash
npm login
```

### 3. Publish to npm

```bash
# Publish the package
npm publish

# Or publish with tag (for pre-releases)
npm publish --tag beta
```

### 4. Verify Publication

```bash
# Check package on npm
npm view expo-osm-sdk

# Test installation
npm install expo-osm-sdk
```

## Package Contents

The published package includes:

```
expo-osm-sdk@1.0.0
├── build/                     # Compiled TypeScript output
│   ├── components/
│   ├── types/
│   ├── utils/
│   └── index.js
├── android/                   # Android native implementation
│   ├── build.gradle
│   └── src/main/java/expo/modules/osmsdk/
├── ios/                      # iOS native implementation
│   ├── ExpoOsmSdk.podspec
│   ├── ExpoOsmSdkModule.swift
│   └── OSMMapView.swift
├── plugin/                   # Expo config plugin
│   ├── build/               # Compiled plugin
│   └── src/                 # Plugin source
├── expo-module.config.json   # Expo module configuration
├── README.md                 # Documentation
├── LICENSE                   # MIT License
├── CHANGELOG.md             # Version history
└── package.json             # Package metadata
```

## Post-Publishing Tasks

### 1. GitHub Release

Create a GitHub release with:
- Tag: `v1.0.0`
- Title: `Expo OSM SDK v1.0.0`
- Description: Copy from CHANGELOG.md
- Assets: Include the tarball if needed

### 2. Documentation Updates

- Update any external documentation
- Update example projects
- Notify community/users

### 3. Social Media & Community

- Tweet about the release
- Post to relevant communities
- Update Discord/Slack channels

## Usage for Developers

After publishing, developers can install and use the SDK:

```bash
# Install the package
npm install expo-osm-sdk

# Or with yarn
yarn add expo-osm-sdk
```

### App Configuration

Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      ["expo-osm-sdk", {
        "locationPermissionText": "This app uses location for map features"
      }]
    ]
  }
}
```

### Basic Usage

```tsx
import { OSMView } from 'expo-osm-sdk';

<OSMView
  style={{ flex: 1 }}
  initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
  initialZoom={10}
/>
```

## Version Management

### Semantic Versioning

- **Major (1.0.0)**: Breaking changes
- **Minor (1.1.0)**: New features, backward compatible
- **Patch (1.0.1)**: Bug fixes, backward compatible

### Release Process

```bash
# For patch releases
npm version patch
npm run version  # Runs tests and builds
npm publish

# For minor releases
npm version minor
npm run version
npm publish

# For major releases
npm version major
npm run version
npm publish
```

## Package Statistics

- **Package Size**: 17.1 kB
- **Unpacked Size**: 59.5 kB
- **Total Files**: 32
- **Test Coverage**: 68 tests passing
- **TypeScript**: Full type definitions included
- **Platforms**: iOS, Android
- **Dependencies**: 2 runtime dependencies

## Support

- **GitHub Issues**: https://github.com/mapdevsaikat/expo-osm-sdk/issues
- **Documentation**: https://github.com/mapdevsaikat/expo-osm-sdk#readme
- **npm Package**: https://www.npmjs.com/package/expo-osm-sdk

## Notes

- This package requires Expo development builds (not compatible with Expo Go)
- Minimum requirements: Expo SDK 49.0.0+, React Native 0.72.0+
- Full TypeScript support with IntelliSense
- Native performance with GPU acceleration
- Zero external API dependencies (uses OpenStreetMap directly) 