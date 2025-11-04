# Build and Publish Guide - v1.0.98

## Overview

Version 1.0.98 fixes a critical casting error that occurred when marker props were undefined or null on both Android and iOS platforms. Additionally, duplicate code was removed from the iOS module.

## Changes Summary

### 🔧 Android Module (`ExpoOsmSdkModule.kt`)
- Made collection props nullable: `markers`, `circles`, `polylines`, `polygons`
- Added empty list fallbacks using `?: emptyList()`
- Lines modified: 59, 66, 73, 80

### 🔧 iOS Module (`ExpoOsmSdkModule.swift`)
- Made collection props optional: `markers`, `circles`, `polylines`, `polygons`
- Added empty array fallbacks using `?? []`
- Lines modified: 55, 60, 64, 68
- **Cleanup**: Removed duplicate routing functions (lines 405-494)

### 📝 Documentation
- Updated `CHANGELOG.md` with v1.0.98 entry
- Created `MARKER_CASTING_FIX_v1.0.98.md` with detailed fix documentation
- Updated `package.json` version to 1.0.98

## Build Steps

### 1. Clean Previous Build
```bash
cd /Users/saikat.maiti/Documents/expo-osm-sdk/expo-osm-sdk
npm run clean
```

### 2. Build TypeScript
```bash
npm run build
```

This compiles:
- `src/**/*.ts` → `build/**/*.js`
- Generates type definitions (`.d.ts` files)
- Creates source maps

### 3. Verify Build
```bash
# Check that build directory exists and has files
ls -la build/

# Should see:
# - index.js, index.d.ts
# - components/
# - hooks/
# - types/
# - utils/
```

### 4. Test Locally (Optional)
```bash
# In your test app
cd /path/to/your/test/app
npm install /Users/saikat.maiti/Documents/expo-osm-sdk/expo-osm-sdk

# Test markers without errors
```

### 5. Publish to npm
```bash
cd /Users/saikat.maiti/Documents/expo-osm-sdk/expo-osm-sdk

# Login to npm (if not already logged in)
npm login

# Publish
npm publish --access public
```

## Verification Checklist

Before publishing, verify:

- [ ] Package version is 1.0.98 in `package.json`
- [ ] CHANGELOG.md has v1.0.98 entry
- [ ] Build directory exists with all compiled files
- [ ] No linter errors in Android or iOS modules
- [ ] Test that markers work without casting errors

## Post-Publish

### 1. Commit and Tag
```bash
git add .
git commit -m "v1.0.98: Fix marker/collection props casting error on Android & iOS"
git tag v1.0.98
git push origin main --tags
```

### 2. Update Consumers
In apps using the package:
```bash
npm update expo-osm-sdk
# or
npm install expo-osm-sdk@1.0.98
```

### 3. Test in Production
Verify that:
- Markers can be undefined/null without errors
- Conditional rendering works: `markers={showMarkers ? data : undefined}`
- Empty arrays work: `markers={[]}`
- Normal usage continues to work

## Breaking Changes

**None** - This release is fully backward compatible.

## Expected Impact

- ✅ No more "Cannot cast from Boolean to ReadableNativeMap" errors
- ✅ More robust prop handling
- ✅ Better developer experience with conditional rendering
- ✅ Cleaner iOS codebase (removed duplicates)

## Rollback Plan

If issues arise:
```bash
# Unpublish (within 72 hours)
npm unpublish expo-osm-sdk@1.0.98

# Or deprecate
npm deprecate expo-osm-sdk@1.0.98 "Please use v1.0.97"

# Users can downgrade
npm install expo-osm-sdk@1.0.97
```

## Support

- GitHub Issues: https://github.com/mapdevsaikat/expo-osm-sdk/issues
- Documentation: See `MARKER_CASTING_FIX_v1.0.98.md` for detailed technical info

---

**Release Date**: November 4, 2025  
**Release Type**: Patch (Bug Fix)  
**Platforms**: Android, iOS, Web  
**Status**: Ready for Production

