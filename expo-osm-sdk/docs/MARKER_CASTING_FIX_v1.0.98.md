# Marker Casting Error Fix - v1.0.98

## Issue Description

When initializing markers in the OSMView component, users encountered a casting error:

```
ERROR Cannot set prop 'markers' on view 'class expo.modules.osmsdk.OSMMapView'
→ Caused by: Cannot cast 'class com.facebook.react.bridge.DynamicFromMap' to 'kotlin.collections.Map<kotlin.String, kotlin.Any>' 
   required by the collection of type: 'kotlin.collections.List<kotlin.collections.Map<kotlin.String, kotlin.Any>>'.
→ Caused by: com.facebook.react.bridge.UnexpectedNativeTypeException: 
   Value for markers cannot be cast from Boolean to ReadableNativeMap
```

## Root Cause

The Android native module's prop definitions in `ExpoOsmSdkModule.kt` were not handling nullable/undefined values properly. When props like `markers`, `circles`, `polylines`, or `polygons` were:
- Not provided (undefined)
- Set to null
- Conditionally rendered

React Native's bridge would sometimes pass a Boolean value instead of an empty array, causing a type casting exception.

## Solution

Made all collection props nullable and provide empty lists/arrays as fallbacks on both platforms:

### Changes in `ExpoOsmSdkModule.kt` (Android)

**Before:**
```kotlin
Prop("markers") { view: OSMMapView, markers: List<Map<String, Any>> ->
    synchronized(viewLock) {
        currentOSMView = view
        view.setMarkers(markers)
    }
}
```

**After:**
```kotlin
Prop("markers") { view: OSMMapView, markers: List<Map<String, Any>>? ->
    synchronized(viewLock) {
        currentOSMView = view
        view.setMarkers(markers ?: emptyList())
    }
}
```

### Changes in `ExpoOsmSdkModule.swift` (iOS)

**Before:**
```swift
Prop("markers") { (view: OSMMapView, markers: [[String: Any]]) in
    view.setMarkers(markers)
}
```

**After:**
```swift
Prop("markers") { (view: OSMMapView, markers: [[String: Any]]?) in
    view.setMarkers(markers ?? [])
}
```

### Props Fixed (Both Platforms)

Applied the same pattern to all collection props:
- ✅ `markers` - Made nullable with empty list/array fallback
- ✅ `circles` - Made nullable with empty list/array fallback
- ✅ `polylines` - Made nullable with empty list/array fallback
- ✅ `polygons` - Made nullable with empty list/array fallback

### Additional iOS Cleanup

- ✅ Removed duplicate routing functions (`calculateRoute`, `displayRoute`, `clearRoute`, `fitRouteInView`) that were defined twice in the iOS module

## Benefits

1. **Error Prevention**: No more casting errors when props are undefined or null
2. **Better Defaults**: Empty collections are a sensible default instead of crashing
3. **Improved Robustness**: Handles edge cases in React Native's bridge type system
4. **Consistent Pattern**: All collection props now follow the same safe pattern

## Verification

The setter methods in `OSMMapView.kt` already handle empty lists safely:
- Use `.mapNotNull` which returns empty lists for empty input
- Use `.forEach` which is safe with empty collections
- Properly clear existing items before adding new ones

## Testing

To verify the fix:

```tsx
// Case 1: No markers prop (should work now)
<OSMView initialCenter={{latitude: 0, longitude: 0}} initialZoom={10} />

// Case 2: Empty markers array (should work)
<OSMView markers={[]} />

// Case 3: Conditional markers (should work)
<OSMView markers={showMarkers ? markerData : undefined} />

// Case 4: Actual markers (should continue working)
<OSMView markers={[{id: '1', coordinate: {latitude: 0, longitude: 0}}]} />
```

## Version

- **Fixed in**: v1.0.98
- **Files Modified**:
  - `android/src/main/java/expo/modules/osmsdk/ExpoOsmSdkModule.kt`
    - Lines 59, 66, 73, 80: Added `?` to type and `?: emptyList()` to default
  - `ios/ExpoOsmSdkModule.swift`
    - Lines 55, 60, 64, 68: Added `?` to type and `?? []` to default
    - Lines 405-494: Removed duplicate routing functions

## Impact

- **Breaking Changes**: None
- **API Changes**: None (internal implementation only)
- **Backwards Compatibility**: ✅ Fully compatible

---

**Date**: November 4, 2025
**Reported By**: User experiencing marker initialization errors
**Fixed By**: AI Assistant with user approval

