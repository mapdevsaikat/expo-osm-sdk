# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.22] - 2025-07-15

### 🚀 Major Compatibility Updates
- **MapLibre 11.8.8 Compatibility**: Complete API compatibility update for MapLibre Android SDK 11.x
- **Expo Modules Core Updates**: Updated to latest Expo modules core lifecycle API

### 🔧 Critical Fixes
- **Expo Lifecycle Methods**: 
  - Fixed `OnViewCreated` → `OnViewDidLoad` (updated to current Expo modules API)
  - Fixed `OnViewDestroys` → `OnViewWillUnmount` (updated to current Expo modules API)
- **ExpoView Constructor**: Fixed missing `appContext` parameter in OSMMapView constructor
- **MapLibre getInstance()**: Updated API call to remove deprecated null parameter
- **RasterSource Constructor**: Updated from deprecated TileSet.Builder pattern to direct constructor
- **Map Click Listeners**: Fixed `setOnMapClickListener` → `addOnMapClickListener` with proper return types
- **Type Inference**: Added explicit type annotations to resolve Kotlin compilation errors
- **Null Safety**: Enhanced null-safety checks for map camera position and bounds

### 🧹 Code Cleanup
- **Unused Imports**: Removed obsolete TileSet import that's no longer used in MapLibre 11.x
- **Error Handling**: Enhanced cleanup method with proper try-catch blocks
- **Type Safety**: Added explicit lambda parameter types for better type inference

### 🎯 Build System
- **JVM Compatibility**: Maintains JVM 17 target for consistent compilation
- **Dependency Management**: Verified MapLibre 11.8.8 compatibility with Maven Central
- **Module Configuration**: Updated Android module configuration for latest APIs

### 📋 Breaking Changes Addressed
This release specifically addresses breaking changes introduced in MapLibre Android SDK 11.x:
- TileSet.Builder API removal
- MapLibre.getInstance() parameter changes  
- Map listener method name changes
- Enhanced type safety requirements

### 🧪 Technical Details
- All 125 tests maintained compatibility and passing
- Zero regression in existing functionality
- Full backward compatibility for app developers (no breaking changes in public API)
- EAS build compatibility restored for Android platform

### ⚡ Performance
- Maintained GPU-accelerated rendering performance
- No impact on memory usage or battery optimization
- Preserved all existing performance characteristics

## [1.0.21] - 2025-07-15

### 🔧 Critical Build Fix
- **JVM Target Compatibility**: Fixed inconsistent JVM-target compatibility for Android builds
  - Updated JVM target from 11 to 17 for both Java and Kotlin compilation
  - Resolves "Inconsistent JVM-target compatibility detected" build error in EAS
  - Ensures consistent compilation targets across the entire build process
- **Published**: expo-osm-sdk@1.0.21 with all tests passing (125/125)
- **Demo Project**: Updated to use latest SDK version

### 🎯 Build System
- **Gradle Compatibility**: Enhanced Gradle build configuration for modern Android toolchain
- **EAS Build Support**: Restored EAS build compatibility for Android platform
- **Developer Experience**: Eliminated confusing JVM version mismatch errors

## [1.0.20] - 2025-07-15

### 🔧 Critical EAS Build Fix
- **Plugin Repository Issue**: Removed automatic addition of mapbox Maven repository from plugin
  - Fixed critical plugin issue that was adding `maven.mapbox.com` repository automatically
  - Plugin now relies on `mavenCentral()` for MapLibre dependencies
  - Resolves EAS build failures with "No address associated with hostname" errors
- **MapLibre Version**: Updated Android SDK from 10.5.0 to 11.8.8 for better compatibility
- **Published**: expo-osm-sdk@1.0.20 with all build fixes

### 🎯 Technical Resolution
- **Root Cause**: Plugin was overriding correct build.gradle configuration
- **Solution**: MapLibre is available on Maven Central (public repository)
- **Impact**: Eliminates mapbox repository dependency issues

## [1.0.12] - 2025-07-14

### 🔧 Fixed
- **Expo Go Fallback Detection**: Fixed native module detection logic to properly show fallback UI in Expo Go instead of crashing
- **Web Platform Handling**: Improved platform-specific exports for better web fallback behavior
- **Fallback UI Experience**: Enhanced fallback components to provide clear, helpful messaging

### 📖 Improved  
- **Documentation**: Added comprehensive "Platform Behavior Guide" to README
- **Developer Experience**: Clear explanation of expected behavior across platforms
- **Troubleshooting**: Added section clarifying that fallback UIs are expected, not bugs

### 🧪 Technical
- Enhanced native module availability detection
- Improved platform-specific component exports in package.json
- All 125 tests passing with full coverage

### 🎯 Platform Behavior Summary
- **Development Builds**: Full native map functionality ✅
- **Expo Go**: Professional fallback UI with clear messaging ✅  
- **Web**: Informative fallback with alternative suggestions ✅

## [1.0.11] - 2025-07-14

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