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
        
        // Module name
        Name("ExpoOsmSdk")
        
        
        // View manager for OSMView  
        View(OSMMapView::class) {
            
            // Core Events (stable functionality only)
            Events(
                "onMapReady", "onRegionChange", "onMarkerPress", "onPress", "onLongPress", "onUserLocationChange"
            )
            
            // NOTE: OnCreate/OnDestroy removed for Expo SDK 53 compatibility
            // View reference is managed through Props (12 capture points)
            // This approach works with both Expo SDK < 53 and SDK 53+
            
            
            // Props
            Prop("initialCenter") { view: OSMMapView, center: Map<String, Double>? ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    center?.let { view.setInitialCenter(it) }
                }
            }
            
            Prop("initialZoom") { view: OSMMapView, zoom: Double? ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    zoom?.let { view.setInitialZoom(it) }
                }
            }
            
            Prop("initialPitch") { view: OSMMapView, pitch: Double? ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    pitch?.let { view.setInitialPitch(it) }
                }
            }
            
            Prop("initialBearing") { view: OSMMapView, bearing: Double? ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    bearing?.let { view.setInitialBearing(it) }
                }
            }
            
            Prop("tileServerUrl") { view: OSMMapView, url: String? ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    url?.let { view.setTileServerUrl(it) }
                }
            }
            
            Prop("styleUrl") { view: OSMMapView, url: String? ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setStyleUrl(url)
                }
            }
            
            Prop("markers") { view: OSMMapView, markers: List<Map<String, Any>>? ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setMarkers(markers ?: emptyList())
                }
            }
            
            Prop("circles") { view: OSMMapView, circles: List<Map<String, Any>>? ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setCircles(circles ?: emptyList())
                }
            }
            
            Prop("polylines") { view: OSMMapView, polylines: List<Map<String, Any>>? ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setPolylines(polylines ?: emptyList())
                }
            }
            
            Prop("polygons") { view: OSMMapView, polygons: List<Map<String, Any>>? ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setPolygons(polygons ?: emptyList())
                }
            }
            
            Prop("showUserLocation") { view: OSMMapView, show: Boolean ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setShowUserLocation(show)
                }
            }
            
            Prop("followUserLocation") { view: OSMMapView, follow: Boolean ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setFollowUserLocation(follow)
                }
            }
            
            Prop("showsCompass") { view: OSMMapView, show: Boolean ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setShowsCompass(show)
                }
            }
            
            Prop("showsScale") { view: OSMMapView, show: Boolean ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setShowsScale(show)
                }
            }
            
            Prop("rotateEnabled") { view: OSMMapView, enabled: Boolean ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setRotateEnabled(enabled)
                }
            }
            
            Prop("scrollEnabled") { view: OSMMapView, enabled: Boolean ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setScrollEnabled(enabled)
                }
            }
            
            Prop("zoomEnabled") { view: OSMMapView, enabled: Boolean ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setZoomEnabled(enabled)
                }
            }
            
            Prop("pitchEnabled") { view: OSMMapView, enabled: Boolean ->
                synchronized(viewLock) {
                    currentOSMView = view // Store view reference safely
                    view.setPitchEnabled(enabled)
                }
            }
            
        }
        
        // Enhanced module functions with proper view checking
        AsyncFunction("zoomIn") { promise: Promise ->
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeZoomIn(promise)
                }
                return@AsyncFunction
            }
            
            executeZoomIn(promise)
        }
        
        AsyncFunction("zoomOut") { promise: Promise ->
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
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
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeSetZoom(view, zoom, promise)
                }
                return@AsyncFunction
            }
            
            executeSetZoom(view, zoom, promise)
        }
        
        AsyncFunction("animateToLocation") { latitude: Double, longitude: Double, zoom: Double?, promise: Promise ->
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeAnimateToLocation(latitude, longitude, zoom, promise)
                }
                return@AsyncFunction
            }
            
            executeAnimateToLocation(latitude, longitude, zoom, promise)
        }
        
        AsyncFunction("getCurrentLocation") { promise: Promise ->
            
            val view = getViewSafely()
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread for location operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeGetCurrentLocation(promise)
                }
                return@AsyncFunction
            }
            
            executeGetCurrentLocation(promise)
        }
        
        AsyncFunction("startLocationTracking") { promise: Promise ->
            
            val view = getViewSafely()
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread for location operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeStartLocationTracking(promise)
                }
                return@AsyncFunction
            }
            
            executeStartLocationTracking(promise)
        }
        
        AsyncFunction("stopLocationTracking") { promise: Promise ->
            
            val view = getViewSafely()
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread for location operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeStopLocationTracking(promise)
                }
                return@AsyncFunction
            }
            
            executeStopLocationTracking(promise)
        }
        
        AsyncFunction("waitForLocation") { timeoutSeconds: Int, promise: Promise ->
            
            val view = getViewSafely()
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread for location operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
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
        
        // Camera orientation controls
        AsyncFunction("setPitch") { pitch: Double, promise: Promise ->
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeSetPitch(pitch, promise)
                }
                return@AsyncFunction
            }
            
            executeSetPitch(pitch, promise)
        }
        
        AsyncFunction("setBearing") { bearing: Double, promise: Promise ->
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeSetBearing(bearing, promise)
                }
                return@AsyncFunction
            }
            
            executeSetBearing(bearing, promise)
        }
        
        AsyncFunction("getPitch") { promise: Promise ->
            
            val view = getViewSafely()
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            try {
                val pitch = view.getPitch()
                promise.resolve(pitch)
            } catch (e: Exception) {
                promise.reject("GET_PITCH_FAILED", "Failed to get pitch: ${e.message}", e)
            }
        }
        
        AsyncFunction("getBearing") { promise: Promise ->
            
            val view = getViewSafely()
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            try {
                val bearing = view.getBearing()
                promise.resolve(bearing)
            } catch (e: Exception) {
                promise.reject("GET_BEARING_FAILED", "Failed to get bearing: ${e.message}", e)
            }
        }
        
        AsyncFunction("animateCamera") { options: Map<String, Any?>, promise: Promise ->
            
            val view = getViewSafely()
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            try {
                val latitude = options["latitude"] as? Double
                val longitude = options["longitude"] as? Double
                val zoom = options["zoom"] as? Double
                val pitch = options["pitch"] as? Double
                val bearing = options["bearing"] as? Double
                val duration = options["duration"] as? Int
                
                view.animateCamera(latitude, longitude, zoom, pitch, bearing, duration)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("ANIMATE_CAMERA_FAILED", "Failed to animate camera: ${e.message}", e)
            }
        }
        
    }
    
    // Thread-safe view access
    private fun getViewSafely(): OSMMapView? {
        return synchronized(viewLock) {
            
            if (currentOSMView != null) {
                try {
                    val isReady = currentOSMView!!.isMapReady()
                } catch (e: Exception) {
                }
            } else {
            }
            
            currentOSMView
        }
    }
    
    // Helper functions for UI thread operations
    private fun executeZoomIn(promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            view.zoomIn()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ZOOM_FAILED", "Failed to zoom in: ${e.message}", e)
        }
    }
    
    private fun executeZoomOut(promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            view.zoomOut()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ZOOM_FAILED", "Failed to zoom out: ${e.message}", e)
        }
    }
    
    private fun executeSetZoom(view: OSMMapView, zoom: Double, promise: Promise) {
        try {
            view.setZoom(zoom)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ZOOM_FAILED", "Failed to set zoom: ${e.message}", e)
        }
    }
    
    private fun executeAnimateToLocation(latitude: Double, longitude: Double, zoom: Double?, promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            view.animateToLocation(latitude, longitude, zoom ?: view.initialZoom)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ANIMATION_FAILED", "Failed to animate to location: ${e.message}", e)
        }
    }
    
    private fun executeGetCurrentLocation(promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            val location = view.getCurrentLocation()
            promise.resolve(location)
        } catch (e: Exception) {
            promise.reject("LOCATION_FAILED", "Failed to get current location: ${e.message}", e)
        }
    }
    
    private fun executeStartLocationTracking(promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            view.startLocationTracking()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("LOCATION_FAILED", "Failed to start location tracking: ${e.message}", e)
        }
    }
    
    private fun executeStopLocationTracking(promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            view.stopLocationTracking()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("LOCATION_FAILED", "Failed to stop location tracking: ${e.message}", e)
        }
    }
    
    private fun executeWaitForLocation(timeoutSeconds: Int, promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            val location = view.waitForLocation(timeoutSeconds)
            promise.resolve(location)
        } catch (e: Exception) {
            promise.reject("LOCATION_TIMEOUT", "Failed to get location within timeout: ${e.message}", e)
        }
    }
    
    private fun executeSetPitch(pitch: Double, promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            view.setPitch(pitch)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SET_PITCH_FAILED", "Failed to set pitch: ${e.message}", e)
        }
    }
    
    private fun executeSetBearing(bearing: Double, promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            view.setBearing(bearing)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SET_BEARING_FAILED", "Failed to set bearing: ${e.message}", e)
        }
    }
    
} 