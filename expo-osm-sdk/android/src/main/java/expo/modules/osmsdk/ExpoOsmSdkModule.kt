package expo.modules.osmsdk

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsResponseListener
import expo.modules.interfaces.permissions.PermissionsStatus

// Main Expo module for OSM SDK on Android
class ExpoOsmSdkModule : Module() {
    // Shared view instance for module functions.
    // Held weakly so an unmounted map view can be garbage collected instead of
    // leaking through the module for the lifetime of the app.
    @Volatile
    private var currentOSMViewRef: java.lang.ref.WeakReference<OSMMapView>? = null
    private val viewLock = Object()
    
    private var currentOSMView: OSMMapView?
        get() = currentOSMViewRef?.get()
        set(value) {
            currentOSMViewRef = if (value != null) java.lang.ref.WeakReference(value) else null
        }
    
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
        
        // Requests the ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION runtime
        // permissions via the Expo permissions manager, triggering the real
        // Android system dialog (manifest entries alone are not sufficient
        // on API 23+). Resolves `true` if at least one of the two location
        // permissions is granted, `false` otherwise (denied or unavailable).
        // Does not require a mounted OSMView — this is a standalone,
        // module-level permission request so JS can call it before the map
        // is on screen.
        AsyncFunction("requestLocationPermission") { promise: Promise ->
            executeRequestLocationPermission(promise)
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
        
        // Options map is an optional trailing argument — the zero-arg JS call
        // (pre-2.4 behavior) passes null and keeps the foreground-only path.
        // Keys: background (Boolean), accuracy ("high"|"balanced"|"low"),
        // intervalMs (Number), distanceFilterMeters (Number),
        // notificationTitle / notificationText (String, background only).
        AsyncFunction("startLocationTracking") { options: Map<String, Any?>?, promise: Promise ->
            
            val view = getViewSafely()
            if (view == null) {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                return@AsyncFunction
            }
            
            // Ensure we're on the UI thread for location operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeStartLocationTracking(options, promise)
                }
                return@AsyncFunction
            }
            
            executeStartLocationTracking(options, promise)
        }
        
        AsyncFunction("stopLocationTracking") { promise: Promise ->
            
            // Unlike other location calls, stop must also work when the map
            // view is gone but the background service is still running.
            if (getViewSafely() == null && !LocationTrackingService.isRunning) {
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
        
        // Returns and clears the fixes buffered by LocationTrackingService
        // while the JS runtime was asleep (background tracking). Does not
        // require a mounted map view — the buffer lives with the service.
        AsyncFunction("getBufferedLocationFixes") { promise: Promise ->
            try {
                promise.resolve(LocationTrackingService.drainBufferedFixes())
            } catch (e: Exception) {
                promise.reject("BUFFER_DRAIN_FAILED", "Failed to drain buffered location fixes: ${e.message}", e)
            }
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
            // MapLibre camera operations must run on the main/UI thread
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeAnimateCamera(options, promise)
                }
                return@AsyncFunction
            }

            executeAnimateCamera(options, promise)
        }

        AsyncFunction("takeSnapshot") { format: String?, quality: Double?, promise: Promise ->
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeTakeSnapshot(format, quality, promise)
                }
                return@AsyncFunction
            }

            executeTakeSnapshot(format, quality, promise)
        }
        
    }
    
    // Thread-safe view access. The weak reference returns null once an
    // unmounted view has been collected, so calls reject cleanly instead of
    // targeting a torn-down map.
    private fun getViewSafely(): OSMMapView? {
        return synchronized(viewLock) {
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
    
    private fun executeRequestLocationPermission(promise: Promise) {
        val permissionsManager = appContext.permissions
        if (permissionsManager == null) {
            promise.reject(
                "PERMISSIONS_MODULE_NOT_FOUND",
                "Expo permissions module is not available; cannot request location permission",
                null
            )
            return
        }

        try {
            permissionsManager.askForPermissions(
                PermissionsResponseListener { results ->
                    val granted = results.values.any { it.status == PermissionsStatus.GRANTED }
                    if (granted) {
                        // Apply deferred showUserLocation / followUserLocation props
                        // now that runtime permission is available.
                        getViewSafely()?.onLocationPermissionGranted()
                    }
                    promise.resolve(granted)
                },
                android.Manifest.permission.ACCESS_FINE_LOCATION,
                android.Manifest.permission.ACCESS_COARSE_LOCATION
            )
        } catch (e: Exception) {
            promise.reject("PERMISSION_REQUEST_FAILED", "Failed to request location permission: ${e.message}", e)
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
    
    // Interval/distance presets for the `accuracy` tracking option, with
    // per-key overrides. "high" mirrors the pre-2.4 defaults (1 s / 0-1 m).
    private data class TrackingParams(val intervalMs: Long, val minDistanceMeters: Float)
    
    private fun trackingParamsFrom(options: Map<String, Any?>?): TrackingParams {
        var intervalMs: Long
        var minDistanceMeters: Float
        when (options?.get("accuracy") as? String ?: "high") {
            "low" -> { intervalMs = 30_000L; minDistanceMeters = 50f }
            "balanced" -> { intervalMs = 5_000L; minDistanceMeters = 10f }
            else -> { intervalMs = 1_000L; minDistanceMeters = 0f }
        }
        (options?.get("intervalMs") as? Number)?.let { intervalMs = it.toLong() }
        (options?.get("distanceFilterMeters") as? Number)?.let { minDistanceMeters = it.toFloat() }
        return TrackingParams(intervalMs, minDistanceMeters)
    }
    
    private fun executeStartLocationTracking(options: Map<String, Any?>?, promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            if (options?.get("background") as? Boolean == true) {
                startBackgroundTracking(view, options)
            } else if (options == null) {
                // Zero-arg call: exact pre-2.4 behavior (1 s / 1 m defaults)
                view.startLocationTracking()
            } else {
                val params = trackingParamsFrom(options)
                view.startLocationTracking(params.intervalMs, params.minDistanceMeters)
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("LOCATION_FAILED", "Failed to start location tracking: ${e.message}", e)
        }
    }
    
    // Validates permissions and hands the LocationManager subscription over to
    // the foreground service so fixes keep flowing with the screen off.
    private fun startBackgroundTracking(view: OSMMapView, options: Map<String, Any?>?) {
        val context = appContext.reactContext
            ?: throw Exception("React context unavailable; cannot start background tracking")
        
        val fineGranted = androidx.core.content.ContextCompat.checkSelfPermission(
            context, android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        val coarseGranted = androidx.core.content.ContextCompat.checkSelfPermission(
            context, android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        if (!fineGranted && !coarseGranted) {
            throw Exception("Location permission not granted. Call requestLocationPermission() first to prompt the user, then retry.")
        }
        
        // Android 14+ (API 34) refuses to start a "location" foreground
        // service unless FOREGROUND_SERVICE_LOCATION is declared in the
        // manifest — the config plugin adds it via enableBackgroundLocation.
        if (android.os.Build.VERSION.SDK_INT >= 34) {
            val fgsLocationGranted = androidx.core.content.ContextCompat.checkSelfPermission(
                context, "android.permission.FOREGROUND_SERVICE_LOCATION"
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            if (!fgsLocationGranted) {
                throw Exception(
                    "FOREGROUND_SERVICE_LOCATION permission is missing. Set enableBackgroundLocation: true " +
                    "in the expo-osm-sdk config plugin (app.json) and rebuild the app to use background tracking."
                )
            }
        }
        
        val params = trackingParamsFrom(options)
        
        // The service owns the LocationManager subscription while background
        // tracking is active — stop the view's own updates to avoid double delivery.
        try {
            view.stopLocationTracking()
        } catch (e: Exception) {
            // ignored — best effort
        }
        
        // Forward service fixes to the (weakly held) view so live
        // onUserLocationChange events keep flowing while the app is active.
        LocationTrackingService.liveLocationListener = { location ->
            getViewSafely()?.onServiceLocationUpdate(location)
        }
        
        LocationTrackingService.start(
            context,
            params.intervalMs,
            params.minDistanceMeters,
            options?.get("notificationTitle") as? String,
            options?.get("notificationText") as? String
        )
    }
    
    private fun executeStopLocationTracking(promise: Promise) {
        // Always tear down the background service first — it must stop even
        // when the map view has been unmounted in the meantime.
        val serviceWasRunning = LocationTrackingService.isRunning
        try {
            LocationTrackingService.liveLocationListener = null
            appContext.reactContext?.let { LocationTrackingService.stop(it) }
        } catch (e: Exception) {
            // ignored — service teardown must never block stopping view tracking
        }
        
        val view = getViewSafely()
        if (view == null) {
            if (serviceWasRunning) {
                promise.resolve(null)
            } else {
                promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            }
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
        
        // Non-blocking: the view polls via Handler callbacks and settles the
        // promise exactly once, so the main thread is never held (no ANR risk).
        val settled = java.util.concurrent.atomic.AtomicBoolean(false)
        view.waitForLocation(
            timeoutSeconds,
            onSuccess = { location ->
                if (settled.compareAndSet(false, true)) {
                    promise.resolve(location)
                }
            },
            onError = { e ->
                if (settled.compareAndSet(false, true)) {
                    promise.reject("LOCATION_TIMEOUT", "Failed to get location within timeout: ${e.message}", e)
                }
            }
        )
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

    private fun executeAnimateCamera(options: Map<String, Any?>, promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
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

    private fun executeTakeSnapshot(format: String?, quality: Double?, promise: Promise) {
        val view = getViewSafely()
        if (view == null) {
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }

        view.takeSnapshot(
            format ?: "png",
            quality ?: 1.0,
            onSuccess = { dataUri -> promise.resolve(dataUri) },
            onError = { e ->
                promise.reject("SNAPSHOT_FAILED", "Failed to take snapshot: ${e.message}", e)
            }
        )
    }
    
} 