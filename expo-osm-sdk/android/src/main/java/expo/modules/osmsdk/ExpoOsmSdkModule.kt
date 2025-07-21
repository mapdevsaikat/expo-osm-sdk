package expo.modules.osmsdk

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

// Main Expo module for OSM SDK on Android
class ExpoOsmSdkModule : Module() {
    // Shared view instance for module functions - use thread-safe access
    @Volatile
    private var currentOSMView: OSMMapView? = null
    private val viewLock = Object()
    
    override fun definition() = ModuleDefinition {
        android.util.Log.d("OSMSDKModule", "🚀 STARTING MODULE DEFINITION")
        android.util.Log.d("OSMSDKModule", "📦 Module class: ${this::class.java.name}")
        
        // Module name
        Name("ExpoOsmSdk")
        android.util.Log.d("OSMSDKModule", "✅ Module name set: ExpoOsmSdk")
        
        android.util.Log.d("OSMSDKModule", "🔧 Module definition starting...")
        
        // View manager for OSMView  
        View(OSMMapView::class) {
            android.util.Log.d("OSMSDKModule", "🖼️ STARTING VIEW DEFINITION")
            android.util.Log.d("OSMSDKModule", "📱 View class: ${OSMMapView::class.java.name}")
            android.util.Log.d("OSMSDKModule", "🔧 View definition starting...")
            
            // Core Events (stable functionality only)
            Events(
                "onMapReady", "onRegionChange", "onMarkerPress", "onPress", "onLongPress", "onUserLocationChange"
            )
            android.util.Log.d("OSMSDKModule", "📡 Events registered")
            
            android.util.Log.d("OSMSDKModule", "📍 Setting up view props...")
            
            // Props
            Prop("initialCenter") { view: OSMMapView, center: Map<String, Double> ->
                synchronized(viewLock) {
                    android.util.Log.d("OSMSDKModule", "🎯 Setting initialCenter: $center")
                    currentOSMView = view // Store view reference safely
                    view.setInitialCenter(center)
                }
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
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setMarkers(markers)
                }
            }
            
            Prop("showUserLocation") { view: OSMMapView, show: Boolean ->
                view.setShowUserLocation(show)
            }
            
            Prop("followUserLocation") { view: OSMMapView, follow: Boolean ->
                view.setFollowUserLocation(follow)
            }
            
            // REMOVED: Problematic overlay and advanced feature props that were breaking builds
            // These will be re-added once the corresponding methods are properly implemented
        }
        
        // Enhanced module functions with proper view checking
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
            val view = getViewSafely()
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
            android.util.Log.d("OSMSDKModule", "📍 getCurrentLocation called")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for getCurrentLocation")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread for location operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for getCurrentLocation")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeGetCurrentLocation(promise)
                }
                return@AsyncFunction
            }
            
            executeGetCurrentLocation(promise)
        }
        
        AsyncFunction("startLocationTracking") { promise: Promise ->
            android.util.Log.d("OSMSDKModule", "📍 startLocationTracking called")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for startLocationTracking")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread for location operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for startLocationTracking")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeStartLocationTracking(promise)
                }
                return@AsyncFunction
            }
            
            executeStartLocationTracking(promise)
        }
        
        AsyncFunction("stopLocationTracking") { promise: Promise ->
            android.util.Log.d("OSMSDKModule", "📍 stopLocationTracking called")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for stopLocationTracking")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread for location operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for stopLocationTracking")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeStopLocationTracking(promise)
                }
                return@AsyncFunction
            }
            
            executeStopLocationTracking(promise)
        }
        
        AsyncFunction("waitForLocation") { timeoutSeconds: Int, promise: Promise ->
            android.util.Log.d("OSMSDKModule", "📍 waitForLocation called with timeout: ${timeoutSeconds}s")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for waitForLocation")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread for location operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for waitForLocation")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeWaitForLocation(timeoutSeconds, promise)
                }
                return@AsyncFunction
            }
            
            executeWaitForLocation(timeoutSeconds, promise)
        }
        
        // Enhanced availability check
        Function("isAvailable") {
            val view = getViewSafely()
            return@Function view != null
        }
        
        // Add view readiness check
        AsyncFunction("isViewReady") { promise: Promise ->
            val view = getViewSafely()
            if (view == null) {
                promise.resolve(false)
                return@AsyncFunction
            }
            
            // Check if view is properly initialized
            promise.resolve(view.isMapReady())
        }
        
        android.util.Log.d("OSMSDKModule", "🎯 MODULE DEFINITION COMPLETED SUCCESSFULLY!")
        android.util.Log.d("OSMSDKModule", "📋 Summary:")
        android.util.Log.d("OSMSDKModule", "  ✅ Module name: ExpoOsmSdk")
        android.util.Log.d("OSMSDKModule", "  ✅ View class: ${OSMMapView::class.java.name}")
        android.util.Log.d("OSMSDKModule", "  ✅ AsyncFunctions: zoomIn, zoomOut, setZoom, animateToLocation, getCurrentLocation, startLocationTracking, stopLocationTracking, waitForLocation, isViewReady")
        android.util.Log.d("OSMSDKModule", "  ✅ Functions: isAvailable")
    }
    
    // Thread-safe view access
    private fun getViewSafely(): OSMMapView? {
        return synchronized(viewLock) {
            android.util.Log.d("OSMSDKModule", "🔍 getViewSafely() called")
            android.util.Log.d("OSMSDKModule", "📊 Current view state: $currentOSMView")
            android.util.Log.d("OSMSDKModule", "🧵 Thread: ${Thread.currentThread().name}")
            
            if (currentOSMView != null) {
                android.util.Log.d("OSMSDKModule", "✅ View is available: $currentOSMView")
                try {
                    val isReady = currentOSMView!!.isMapReady()
                    android.util.Log.d("OSMSDKModule", "📋 View readiness: $isReady")
                } catch (e: Exception) {
                    android.util.Log.w("OSMSDKModule", "⚠️ Error checking view readiness: ${e.message}")
                }
            } else {
                android.util.Log.e("OSMSDKModule", "❌ View is NULL! Possible causes:")
                android.util.Log.e("OSMSDKModule", "   1. OnCreate never fired")
                android.util.Log.e("OSMSDKModule", "   2. View was destroyed")
                android.util.Log.e("OSMSDKModule", "   3. Module recreated")
            }
            
            currentOSMView
        }
    }
    
    // Helper functions for UI thread operations
    private fun executeZoomIn(promise: Promise) {
        val view = getViewSafely()
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
        val view = getViewSafely()
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
        val view = getViewSafely()
        if (view == null) {
            android.util.Log.e("OSMSDKModule", "❌ OSM view not available for animateToLocation")
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.animateToLocation($latitude, $longitude, $zoom)")
            view.animateToLocation(latitude, longitude, zoom ?: view.initialZoom)
            android.util.Log.d("OSMSDKModule", "✅ animateToLocation completed successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ animateToLocation failed with error: ${e.message}", e)
            promise.reject("ANIMATION_FAILED", "Failed to animate to location: ${e.message}", e)
        }
    }
    
    private fun executeGetCurrentLocation(promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            android.util.Log.e("OSMSDKModule", "❌ OSM view not available for getCurrentLocation")
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.getCurrentLocation()")
            val location = view.getCurrentLocation()
            android.util.Log.d("OSMSDKModule", "✅ getCurrentLocation completed successfully")
            promise.resolve(location)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ getCurrentLocation failed with error: ${e.message}", e)
            promise.reject("LOCATION_FAILED", "Failed to get current location: ${e.message}", e)
        }
    }
    
    private fun executeStartLocationTracking(promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            android.util.Log.e("OSMSDKModule", "❌ OSM view not available for startLocationTracking")
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.startLocationTracking()")
            view.startLocationTracking()
            android.util.Log.d("OSMSDKModule", "✅ startLocationTracking completed successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ startLocationTracking failed with error: ${e.message}", e)
            promise.reject("LOCATION_FAILED", "Failed to start location tracking: ${e.message}", e)
        }
    }
    
    private fun executeStopLocationTracking(promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            android.util.Log.e("OSMSDKModule", "❌ OSM view not available for stopLocationTracking")
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.stopLocationTracking()")
            view.stopLocationTracking()
            android.util.Log.d("OSMSDKModule", "✅ stopLocationTracking completed successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ stopLocationTracking failed with error: ${e.message}", e)
            promise.reject("LOCATION_FAILED", "Failed to stop location tracking: ${e.message}", e)
        }
    }
    
    private fun executeWaitForLocation(timeoutSeconds: Int, promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            android.util.Log.e("OSMSDKModule", "❌ OSM view not available for waitForLocation")
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.waitForLocation($timeoutSeconds)")
            val location = view.waitForLocation(timeoutSeconds)
            android.util.Log.d("OSMSDKModule", "✅ waitForLocation completed successfully")
            promise.resolve(location)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ waitForLocation failed with error: ${e.message}", e)
            promise.reject("LOCATION_TIMEOUT", "Failed to get location within timeout: ${e.message}", e)
        }
    }
} 