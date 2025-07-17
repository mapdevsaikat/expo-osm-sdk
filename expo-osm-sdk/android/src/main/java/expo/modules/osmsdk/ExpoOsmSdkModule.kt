package expo.modules.osmsdk

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

// Main Expo module for OSM SDK on Android
class ExpoOsmSdkModule : Module() {
    // Shared view instance for module functions
    private var currentOSMView: OSMMapView? = null
    
    override fun definition() = ModuleDefinition {
        // Module name
        Name("ExpoOsmSdk")
        
        // View manager for OSMView  
        View(OSMMapView::class) {
            // Events
            Events("onMapReady", "onRegionChange", "onMarkerPress", "onPress", "onUserLocationChange")
            
            // Props
            Prop("initialCenter") { view: OSMMapView, center: Map<String, Double> ->
                currentOSMView = view // Store reference when props are set
                view.setInitialCenter(center)
            }
            
            Prop("initialZoom") { view: OSMMapView, zoom: Double ->
                view.setInitialZoom(zoom)
            }
            
            Prop("tileServerUrl") { view: OSMMapView, url: String ->
                view.setTileServerUrl(url)
            }
            
            Prop("styleUrl") { view: OSMMapView, url: String? ->
                view.setStyleUrl(url)
            }
            
            Prop("markers") { view: OSMMapView, markers: List<Map<String, Any>> ->
                view.setMarkers(markers)
            }
            
            Prop("showUserLocation") { view: OSMMapView, show: Boolean ->
                view.setShowUserLocation(show)
            }
            
            Prop("followUserLocation") { view: OSMMapView, follow: Boolean ->
                view.setFollowUserLocation(follow)
            }
            
            // Note: View reference is managed through async function calls
        }
        
        // Module functions for zoom and location control
        AsyncFunction("zoomIn") { promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🔍 zoomIn called")
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for zoomIn")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeZoomIn(promise)
                }
                return@AsyncFunction
            }
            
            executeZoomIn(promise)
        }
        
        AsyncFunction("zoomOut") { promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🔍 zoomOut called")
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for zoomOut")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeZoomOut(promise)
                }
                return@AsyncFunction
            }
            
            executeZoomOut(promise)
        }
        
        AsyncFunction("setZoom") { zoom: Double, promise: Promise ->
            val view = currentOSMView
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            try {
                view.setZoom(zoom)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("ZOOM_FAILED", "Failed to set zoom", e)
            }
        }
        
        AsyncFunction("animateToLocation") { latitude: Double, longitude: Double, zoom: Double?, promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🔍 animateToLocation called - lat: $latitude, lng: $longitude, zoom: $zoom")
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for animateToLocation")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeAnimateToLocation(latitude, longitude, zoom, promise)
                }
                return@AsyncFunction
            }
            
            executeAnimateToLocation(latitude, longitude, zoom, promise)
        }
        
        AsyncFunction("getCurrentLocation") { promise: Promise ->
            val view = currentOSMView
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            try {
                val location = view.getCurrentLocation()
                promise.resolve(location)
            } catch (e: Exception) {
                promise.reject("LOCATION_FAILED", "Failed to get current location", e)
            }
        }
        
        AsyncFunction("startLocationTracking") { promise: Promise ->
            val view = currentOSMView
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            try {
                view.startLocationTracking()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("LOCATION_FAILED", "Failed to start location tracking", e)
            }
        }
        
        AsyncFunction("stopLocationTracking") { promise: Promise ->
            val view = currentOSMView
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            try {
                view.stopLocationTracking()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("LOCATION_FAILED", "Failed to stop location tracking", e)
            }
        }
        
        AsyncFunction("waitForLocation") { timeoutSeconds: Int, promise: Promise ->
            val view = currentOSMView
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            try {
                val location = view.waitForLocation(timeoutSeconds)
                promise.resolve(location)
            } catch (e: Exception) {
                promise.reject("LOCATION_TIMEOUT", "Failed to get location within timeout", e)
            }
        }
        
        // Simple module function that returns a constant value
        Function("isAvailable") {
            return@Function true
        }
    }
    
    // Helper functions for UI thread operations
    private fun executeZoomIn(promise: Promise) {
        val view = currentOSMView
        if (view == null) {
            android.util.Log.e("OSMSDKModule", "❌ OSM view not available for zoomIn")
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.zoomIn()")
            view.zoomIn()
            android.util.Log.d("OSMSDKModule", "✅ zoomIn completed successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ zoomIn failed with error: ${e.message}", e)
            promise.reject("ZOOM_FAILED", "Failed to zoom in: ${e.message}", e)
        }
    }
    
    private fun executeZoomOut(promise: Promise) {
        val view = currentOSMView
        if (view == null) {
            android.util.Log.e("OSMSDKModule", "❌ OSM view not available for zoomOut")
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.zoomOut()")
            view.zoomOut()
            android.util.Log.d("OSMSDKModule", "✅ zoomOut completed successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ zoomOut failed with error: ${e.message}", e)
            promise.reject("ZOOM_FAILED", "Failed to zoom out: ${e.message}", e)
        }
    }
    
    private fun executeAnimateToLocation(latitude: Double, longitude: Double, zoom: Double?, promise: Promise) {
        val view = currentOSMView
        if (view == null) {
            android.util.Log.e("OSMSDKModule", "❌ OSM view not available for animateToLocation")
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            val targetZoom = zoom ?: view.initialZoom
            android.util.Log.d("OSMSDKModule", "📍 Calling view.animateToLocation($latitude, $longitude, $targetZoom)")
            view.animateToLocation(latitude, longitude, targetZoom)
            android.util.Log.d("OSMSDKModule", "✅ animateToLocation completed successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ animateToLocation failed with error: ${e.message}", e)
            promise.reject("ANIMATION_FAILED", "Failed to animate to location: ${e.message}", e)
        }
    }
} 