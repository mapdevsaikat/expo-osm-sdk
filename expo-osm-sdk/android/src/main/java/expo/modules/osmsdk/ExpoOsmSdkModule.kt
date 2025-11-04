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
            
            // Lifecycle management - CRITICAL for view reference
            OnCreate {
                android.util.Log.d("OSMSDKModule", "🚀 OnCreate FIRED! - View lifecycle started")
                // Note: In Expo SDK 53+, OnCreate doesn't receive view parameter
                // View reference is already stored via Prop callbacks
                android.util.Log.d("OSMSDKModule", "✅ OSMView lifecycle initialized")
            }
            
            OnDestroy {
                android.util.Log.d("OSMSDKModule", "🗑️ OnDestroy FIRED! - Clearing view reference")
                // Note: In Expo SDK 53+, OnDestroy doesn't receive view parameter
                synchronized(viewLock) {
                    currentOSMView = null
                    android.util.Log.d("OSMSDKModule", "✅ View reference cleared successfully")
                }
            }
            
            android.util.Log.d("OSMSDKModule", "📍 Setting up view props...")
            
            // Props
            Prop("initialCenter") { view: OSMMapView, center: Map<String, Double>? ->
                synchronized(viewLock) {
                    android.util.Log.d("OSMSDKModule", "🎯 Setting initialCenter: $center")
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
            android.util.Log.d("OSMSDKModule", "🔍 setZoom called with zoom: $zoom")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for setZoom")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for setZoom")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeSetZoom(view, zoom, promise)
                }
                return@AsyncFunction
            }
            
            executeSetZoom(view, zoom, promise)
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
        
        // OSRM Routing Functions
        AsyncFunction("calculateRoute") { fromLat: Double, fromLng: Double, toLat: Double, toLng: Double, profile: String?, promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🚗 calculateRoute called")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for calculateRoute")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for calculateRoute")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeCalculateRoute(view, fromLat, fromLng, toLat, toLng, profile ?: "driving", promise)
                }
                return@AsyncFunction
            }
            
            executeCalculateRoute(view, fromLat, fromLng, toLat, toLng, profile ?: "driving", promise)
        }
        
        AsyncFunction("displayRoute") { routeCoordinates: List<Map<String, Double>>, routeOptions: Map<String, Any>?, promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🛣️ displayRoute called")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for displayRoute")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for displayRoute")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeDisplayRoute(view, routeCoordinates, routeOptions ?: mapOf(), promise)
                }
                return@AsyncFunction
            }
            
            executeDisplayRoute(view, routeCoordinates, routeOptions ?: mapOf(), promise)
        }
        
        AsyncFunction("clearRoute") { promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🗑️ clearRoute called")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for clearRoute")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for clearRoute")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeClearRoute(view, promise)
                }
                return@AsyncFunction
            }
            
            executeClearRoute(view, promise)
        }
        
        AsyncFunction("fitRouteInView") { routeCoordinates: List<Map<String, Double>>, padding: Double?, promise: Promise ->
            android.util.Log.d("OSMSDKModule", "📍 fitRouteInView called")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for fitRouteInView")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for fitRouteInView")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeFitRouteInView(view, routeCoordinates, padding ?: 50.0, promise)
                }
                return@AsyncFunction
            }
            
            executeFitRouteInView(view, routeCoordinates, padding ?: 50.0, promise)
        }
        
        // Camera orientation controls
        AsyncFunction("setPitch") { pitch: Double, promise: Promise ->
            android.util.Log.d("OSMSDKModule", "📐 setPitch called with pitch: $pitch")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for setPitch")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            try {
                view.setPitch(pitch)
                promise.resolve(null)
            } catch (e: Exception) {
                android.util.Log.e("OSMSDKModule", "❌ setPitch failed: ${e.message}", e)
                promise.reject("SET_PITCH_FAILED", "Failed to set pitch: ${e.message}", e)
            }
        }
        
        AsyncFunction("setBearing") { bearing: Double, promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🧭 setBearing called with bearing: $bearing")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for setBearing")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            try {
                view.setBearing(bearing)
                promise.resolve(null)
            } catch (e: Exception) {
                android.util.Log.e("OSMSDKModule", "❌ setBearing failed: ${e.message}", e)
                promise.reject("SET_BEARING_FAILED", "Failed to set bearing: ${e.message}", e)
            }
        }
        
        AsyncFunction("getPitch") { promise: Promise ->
            android.util.Log.d("OSMSDKModule", "📐 getPitch called")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for getPitch")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            try {
                val pitch = view.getPitch()
                promise.resolve(pitch)
            } catch (e: Exception) {
                android.util.Log.e("OSMSDKModule", "❌ getPitch failed: ${e.message}", e)
                promise.reject("GET_PITCH_FAILED", "Failed to get pitch: ${e.message}", e)
            }
        }
        
        AsyncFunction("getBearing") { promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🧭 getBearing called")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for getBearing")
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            try {
                val bearing = view.getBearing()
                promise.resolve(bearing)
            } catch (e: Exception) {
                android.util.Log.e("OSMSDKModule", "❌ getBearing failed: ${e.message}", e)
                promise.reject("GET_BEARING_FAILED", "Failed to get bearing: ${e.message}", e)
            }
        }
        
        AsyncFunction("animateCamera") { options: Map<String, Any?>, promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🎥 animateCamera called with options: $options")
            
            val view = getViewSafely()
            if (view == null) {
                android.util.Log.e("OSMSDKModule", "❌ OSM view not available for animateCamera")
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
                android.util.Log.e("OSMSDKModule", "❌ animateCamera failed: ${e.message}", e)
                promise.reject("ANIMATE_CAMERA_FAILED", "Failed to animate camera: ${e.message}", e)
            }
        }
        
        android.util.Log.d("OSMSDKModule", "🎯 MODULE DEFINITION COMPLETED SUCCESSFULLY!")
        android.util.Log.d("OSMSDKModule", "📋 Summary:")
        android.util.Log.d("OSMSDKModule", "  ✅ Module name: ExpoOsmSdk")
        android.util.Log.d("OSMSDKModule", "  ✅ View class: ${OSMMapView::class.java.name}")
        android.util.Log.d("OSMSDKModule", "  ✅ AsyncFunctions: zoom, location, routing, camera (setPitch, setBearing, getPitch, getBearing, animateCamera)")
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
    
    private fun executeSetZoom(view: OSMMapView, zoom: Double, promise: Promise) {
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.setZoom($zoom)")
            view.setZoom(zoom)
            android.util.Log.d("OSMSDKModule", "✅ setZoom completed successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ setZoom failed with error: ${e.message}", e)
            promise.reject("ZOOM_FAILED", "Failed to set zoom: ${e.message}", e)
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
    
    // OSRM Routing Execute Functions
    private fun executeCalculateRoute(
        view: OSMMapView,
        fromLat: Double,
        fromLng: Double,
        toLat: Double,
        toLng: Double,
        profile: String,
        promise: Promise
    ) {
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.calculateRoute($fromLat, $fromLng, $toLat, $toLng, $profile)")
            val result = view.calculateRoute(fromLat, fromLng, toLat, toLng, profile)
            android.util.Log.d("OSMSDKModule", "✅ calculateRoute completed successfully")
            promise.resolve(result)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ calculateRoute failed with error: ${e.message}", e)
            promise.reject("ROUTE_CALCULATION_FAILED", "Failed to calculate route: ${e.message}", e)
        }
    }
    
    private fun executeDisplayRoute(
        view: OSMMapView,
        routeCoordinates: List<Map<String, Double>>,
        routeOptions: Map<String, Any>,
        promise: Promise
    ) {
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.displayRoute with ${routeCoordinates.size} coordinates")
            view.displayRoute(routeCoordinates, routeOptions)
            android.util.Log.d("OSMSDKModule", "✅ displayRoute completed successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ displayRoute failed with error: ${e.message}", e)
            promise.reject("ROUTE_DISPLAY_FAILED", "Failed to display route: ${e.message}", e)
        }
    }
    
    private fun executeClearRoute(view: OSMMapView, promise: Promise) {
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.clearRoute()")
            view.clearRoute()
            android.util.Log.d("OSMSDKModule", "✅ clearRoute completed successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ clearRoute failed with error: ${e.message}", e)
            promise.reject("ROUTE_CLEAR_FAILED", "Failed to clear route: ${e.message}", e)
        }
    }
    
    private fun executeFitRouteInView(
        view: OSMMapView,
        routeCoordinates: List<Map<String, Double>>,
        padding: Double,
        promise: Promise
    ) {
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.fitRouteInView with ${routeCoordinates.size} coordinates")
            view.fitRouteInView(routeCoordinates, padding)
            android.util.Log.d("OSMSDKModule", "✅ fitRouteInView completed successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ fitRouteInView failed with error: ${e.message}", e)
            promise.reject("ROUTE_FIT_FAILED", "Failed to fit route in view: ${e.message}", e)
        }
    }
} 