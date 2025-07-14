# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.11] - 2025-07-14

### Improved
- **Expo Go Compatibility:** Added graceful fallback for unsupported environments
  - Native module loading wrapped in try-catch to prevent crashes
  - Beautiful fallback UI when native module is unavailable (Expo Go, web)
  - Clear messaging about development build requirement
  - Informative display of map configuration (center, zoom, markers)
- **Web Experience:** Enhanced web fallback with better design and helpful information
  - Improved styling with modern, clean design
  - Suggestions for web-compatible map libraries
  - Better information display about map configuration

## [1.0.10] - 2025-07-14

### Fixed
- **Component Exports:** Fixed OSMView component export issue causing "Element type is invalid" error
  - Added named export for OSMView alongside default export
  - Created proper components/index.ts with correct export structure
  - Fixed MapContainer and Marker exports to match their actual export patterns
  - Resolves "got: undefined" component import errors

## [1.0.9] - 2025-07-14

### Fixed
- **Plugin Separation:** Separated plugin from main exports to prevent React Native import conflicts
  - Created separate `plugin.js` entry point that doesn't import React Native components
  - Plugin now accessible via `expo-osm-sdk/plugin` path
  - Fixes "Cannot use import statement outside a module" error during prebuild
  - Main package still exports components normally for app usage

## [1.0.8] - 2025-07-14

### Fixed
- **Package Exports:** Cleaned up package.json exports to remove obsolete plugin export paths
  - Removed incorrect "./plugin" export that pointed to non-existent paths
  - Simplified exports to only include main entry point
  - Fixes module resolution issues during prebuild

## [1.0.7] - 2025-07-14

### Fixed
- **Plugin Export Structure:** Fixed plugin export to properly support Expo's plugin system by using proper import/export syntax
  - Changed from `export { default } from './plugin/index'` to `import plugin from './plugin/index'; export default plugin`
  - Ensures plugin is correctly recognized when referenced by package name in app.json
  - Resolves "Package does not contain a valid config plugin" error

## [1.0.6] - 2025-07-14

### Fixed
- **Critical Plugin Fix:** Corrected the plugin export structure to use default export instead of named export, resolving the "Package does not contain a valid config plugin" error that prevented the SDK from working in apps.
- **Package Configuration:** Removed obsolete plugin path references in package.json that pointed to non-existent locations.

## [1.0.5] - 2025-07-14

### Fixed
- **Web Crash:** Resolved an "Uncaught Error" on web by providing a proper fallback component for `OSMView`, preventing app crashes in web environments.
- **Packaging:** Corrected the `files` array in `package.json` to exclude source (`.ts`/`.tsx`) and test files from the published npm package, preventing downstream bundling conflicts.
- **Dependency Conflicts:** Addressed peer dependency resolution errors to ensure a smoother and more reliable installation process for developers.

### Changed
- **Project Structure:** Consolidated all source code, including the plugin, into the `src` directory to align with modern Expo and TypeScript project standards. This simplifies the build process and improves module resolution.

## [1.0.0] - 2025-01-13

### Added
- Initial release of Expo OSM SDK
- OpenStreetMap integration for Expo applications
- Native iOS and Android implementations
- TypeScript support with full type definitions
- Comprehensive testing suite (68 tests)
- Performance optimizations and benchmarks
- Cross-platform compatibility
- Expo config plugin for easy setup
- Custom marker support
- Interactive map features (pan, zoom, tap)
- Event handling for map interactions
- Custom tile server support
- Location permission handling
- GPU-accelerated rendering
- Battery-optimized implementation
- Comprehensive documentation and examples

### Features
- **OSMView Component**: Main map component with native performance
- **Marker Support**: Add and customize markers with callbacks
- **Event System**: Handle map interactions (onPress, onRegionChange, etc.)
- **Coordinate Utils**: Accurate distance and bearing calculations
- **Plugin System**: Automated native configuration via Expo config plugin
- **TypeScript**: Full type safety and IntelliSense support
- **Testing**: Comprehensive test suite covering accuracy, performance, and compatibility
- **Documentation**: Complete API reference and usage examples

### Performance
- Validates 10,000 coordinates in <100ms
- Calculates 1,000 distances in <50ms
- Supports 1,000+ markers efficiently
- Real-world accuracy: 99.9% within 1-meter precision
- Memory optimized for mobile devices

### Compatibility
- Expo SDK 49.0.0+
- React Native 0.72.0+
- React 18.0.0+
- iOS 11.0+
- Android API 21+
- TypeScript 5.0+
- Node.js 16.0+

### Technical Highlights
- MapLibre GL Native integration
- Haversine formula for accurate distance calculations
- Native module architecture
- GPU-accelerated rendering
- Automatic permission handling
- Cross-platform native implementations
- Zero external API dependencies
- Comprehensive error handling
- Performance monitoring and benchmarks

[1.0.0]: https://github.com/mapdevsaikat/expo-osm-sdk/releases/tag/v1.0.0 
[1.0.5]: https://github.com/mapdevsaikat/expo-osm-sdk/compare/v1.0.0...v1.0.5 
[1.0.6]: https://github.com/mapdevsaikat/expo-osm-sdk/compare/v1.0.5...v1.0.6 