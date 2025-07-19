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
            Events("onMapReady", "onRegionChange", "onMarkerPress", "onPress", "onLongPress", "onUserLocationChange")
            
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
            
            // Overlay support props
            Prop("polylines") { view: OSMMapView, polylines: List<Map<String, Any>> ->
                view.setPolylines(polylines)
            }
            
            Prop("polygons") { view: OSMMapView, polygons: List<Map<String, Any>> ->
                view.setPolygons(polygons)
            }
            
            Prop("circles") { view: OSMMapView, circles: List<Map<String, Any>> ->
                view.setCircles(circles)
            }
            
            // Clustering configuration
            Prop("clustering") { view: OSMMapView, clustering: Map<String, Any> ->
                view.setClustering(clustering)
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
        
        // MARK: - Camera Controls (Pitch & Bearing)
        
        AsyncFunction("setPitch") { pitch: Double, promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🔍 setPitch called with pitch: $pitch")
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for setPitch")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executePitchOperation(pitch, promise, "setPitch")
                }
                return@AsyncFunction
            }
            
            executePitchOperation(pitch, promise, "setPitch")
        }
        
        AsyncFunction("setBearing") { bearing: Double, promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🔍 setBearing called with bearing: $bearing")
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for setBearing")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeBearingOperation(bearing, promise, "setBearing")
                }
                return@AsyncFunction
            }
            
            executeBearingOperation(bearing, promise, "setBearing")
        }
        
        AsyncFunction("getPitch") { promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🔍 getPitch called")
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for getPitch")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeGetPitchOperation(promise)
                }
                return@AsyncFunction
            }
            
            executeGetPitchOperation(promise)
        }
        
        AsyncFunction("getBearing") { promise: Promise ->
            android.util.Log.d("OSMSDKModule", "🔍 getBearing called")
            
            // Ensure we're on the UI thread for MapLibre operations
            if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
                android.util.Log.d("OSMSDKModule", "📱 Switching to UI thread for getBearing")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    executeGetBearingOperation(promise)
                }
                return@AsyncFunction
            }
            
            executeGetBearingOperation(promise)
        }
        
        // MARK: - Enhanced Imperative API Methods
        
        // Camera and Region Control
        AsyncFunction("animateToRegion") { region: Map<String, Double>, duration: Int?, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                val lat = region["latitude"]
                val lng = region["longitude"]
                val latDelta = region["latitudeDelta"]
                val lngDelta = region["longitudeDelta"]
                
                if (lat == null || lng == null || latDelta == null || lngDelta == null) {
                    promise.reject("INVALID_REGION", "Invalid region data", null)
                    return@post
                }
                
                try {
                    view.animateToRegion(lat, lng, latDelta, lngDelta, duration ?: 1000)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("ANIMATION_FAILED", "Failed to animate to region: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("fitToMarkers") { markerIds: List<String>?, padding: Double?, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.fitToMarkers(markerIds, padding ?: 50.0)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("FIT_FAILED", "Failed to fit to markers: ${e.message}", e)
                }
            }
        }
        
        // Marker Control
        AsyncFunction("addMarker") { marker: Map<String, Any>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.addMarker(marker)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("MARKER_FAILED", "Failed to add marker: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("removeMarker") { markerId: String, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.removeMarker(markerId)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("MARKER_FAILED", "Failed to remove marker: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("updateMarker") { markerId: String, updates: Map<String, Any>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.updateMarker(markerId, updates)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("MARKER_FAILED", "Failed to update marker: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("showInfoWindow") { markerId: String, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.showInfoWindow(markerId)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("INFO_WINDOW_FAILED", "Failed to show info window: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("hideInfoWindow") { markerId: String, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.hideInfoWindow(markerId)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("INFO_WINDOW_FAILED", "Failed to hide info window: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("animateMarker") { markerId: String, animation: Map<String, Any>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.animateMarker(markerId, animation)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("ANIMATION_FAILED", "Failed to animate marker: ${e.message}", e)
                }
            }
        }
        
        // Overlay Control - Polylines
        AsyncFunction("addPolyline") { polyline: Map<String, Any>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.addPolyline(polyline)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("POLYLINE_FAILED", "Failed to add polyline: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("removePolyline") { polylineId: String, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.removePolyline(polylineId)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("POLYLINE_FAILED", "Failed to remove polyline: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("updatePolyline") { polylineId: String, updates: Map<String, Any>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.updatePolyline(polylineId, updates)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("POLYLINE_FAILED", "Failed to update polyline: ${e.message}", e)
                }
            }
        }
        
        // Overlay Control - Polygons
        AsyncFunction("addPolygon") { polygon: Map<String, Any>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.addPolygon(polygon)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("POLYGON_FAILED", "Failed to add polygon: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("removePolygon") { polygonId: String, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.removePolygon(polygonId)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("POLYGON_FAILED", "Failed to remove polygon: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("updatePolygon") { polygonId: String, updates: Map<String, Any>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.updatePolygon(polygonId, updates)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("POLYGON_FAILED", "Failed to update polygon: ${e.message}", e)
                }
            }
        }
        
        // Overlay Control - Circles
        AsyncFunction("addCircle") { circle: Map<String, Any>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.addCircle(circle)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("CIRCLE_FAILED", "Failed to add circle: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("removeCircle") { circleId: String, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.removeCircle(circleId)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("CIRCLE_FAILED", "Failed to remove circle: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("updateCircle") { circleId: String, updates: Map<String, Any>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.updateCircle(circleId, updates)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("CIRCLE_FAILED", "Failed to update circle: ${e.message}", e)
                }
            }
        }
        
        // Overlay Control - Custom Overlays
        AsyncFunction("addOverlay") { overlay: Map<String, Any>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.addOverlay(overlay)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("OVERLAY_FAILED", "Failed to add overlay: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("removeOverlay") { overlayId: String, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.removeOverlay(overlayId)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("OVERLAY_FAILED", "Failed to remove overlay: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("updateOverlay") { overlayId: String, updates: Map<String, Any>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    view.updateOverlay(overlayId, updates)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("OVERLAY_FAILED", "Failed to update overlay: ${e.message}", e)
                }
            }
        }
        
        // Coordinate Conversion
        AsyncFunction("coordinateForPoint") { point: Map<String, Double>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                val x = point["x"]
                val y = point["y"]
                
                if (x == null || y == null) {
                    promise.reject("INVALID_POINT", "Invalid point data", null)
                    return@post
                }
                
                try {
                    val coordinate = view.coordinateForPoint(x, y)
                    promise.resolve(coordinate)
                } catch (e: Exception) {
                    promise.reject("CONVERSION_FAILED", "Failed to convert point to coordinate: ${e.message}", e)
                }
            }
        }
        
        AsyncFunction("pointForCoordinate") { coordinate: Map<String, Double>, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                val lat = coordinate["latitude"]
                val lng = coordinate["longitude"]
                
                if (lat == null || lng == null) {
                    promise.reject("INVALID_COORDINATE", "Invalid coordinate data", null)
                    return@post
                }
                
                try {
                    val point = view.pointForCoordinate(lat, lng)
                    promise.resolve(point)
                } catch (e: Exception) {
                    promise.reject("CONVERSION_FAILED", "Failed to convert coordinate to point: ${e.message}", e)
                }
            }
        }
        
        // Map Utilities
        AsyncFunction("takeSnapshot") { format: String?, quality: Double?, promise: Promise ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                val view = currentOSMView
                if (view == null) {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
                    return@post
                }
                
                try {
                    val snapshot = view.takeSnapshot(format ?: "png", quality ?: 1.0)
                    promise.resolve(snapshot)
                } catch (e: Exception) {
                    promise.reject("SNAPSHOT_FAILED", "Failed to take snapshot: ${e.message}", e)
                }
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
    
    // Helper functions for Pitch & Bearing operations
    private fun executePitchOperation(pitch: Double, promise: Promise, operation: String) {
        android.util.Log.d("OSMSDKModule", "🔍 executePitchOperation called - operation: $operation, pitch: $pitch")
        
        val view = currentOSMView
        if (view == null) {
            android.util.Log.e("OSMSDKModule", "❌ OSM view not available for $operation")
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.setPitch($pitch)")
            view.setPitch(pitch)
            android.util.Log.d("OSMSDKModule", "✅ $operation completed successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ $operation failed: ${e.message}", e)
            promise.reject("PITCH_FAILED", "Failed to set pitch: ${e.message}", e)
        }
    }
    
    private fun executeBearingOperation(bearing: Double, promise: Promise, operation: String) {
        android.util.Log.d("OSMSDKModule", "🔍 executeBearingOperation called - operation: $operation, bearing: $bearing")
        
        val view = currentOSMView
        if (view == null) {
            android.util.Log.e("OSMSDKModule", "❌ OSM view not available for $operation")
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.setBearing($bearing)")
            view.setBearing(bearing)
            android.util.Log.d("OSMSDKModule", "✅ $operation completed successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ $operation failed: ${e.message}", e)
            promise.reject("BEARING_FAILED", "Failed to set bearing: ${e.message}", e)
        }
    }
    
    private fun executeGetPitchOperation(promise: Promise) {
        android.util.Log.d("OSMSDKModule", "🔍 executeGetPitchOperation called")
        
        val view = currentOSMView
        if (view == null) {
            android.util.Log.e("OSMSDKModule", "❌ OSM view not available for getPitch")
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.getPitch()")
            val pitch = view.getPitch()
            android.util.Log.d("OSMSDKModule", "✅ getPitch completed successfully: $pitch")
            promise.resolve(pitch)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ getPitch failed: ${e.message}", e)
            promise.reject("PITCH_FAILED", "Failed to get pitch: ${e.message}", e)
        }
    }
    
    private fun executeGetBearingOperation(promise: Promise) {
        android.util.Log.d("OSMSDKModule", "🔍 executeGetBearingOperation called")
        
        val view = currentOSMView
        if (view == null) {
            android.util.Log.e("OSMSDKModule", "❌ OSM view not available for getBearing")
            promise.reject("VIEW_NOT_FOUND", "OSM view not available", null)
            return
        }
        
        try {
            android.util.Log.d("OSMSDKModule", "📍 Calling view.getBearing()")
            val bearing = view.getBearing()
            android.util.Log.d("OSMSDKModule", "✅ getBearing completed successfully: $bearing")
            promise.resolve(bearing)
        } catch (e: Exception) {
            android.util.Log.e("OSMSDKModule", "❌ getBearing failed: ${e.message}", e)
            promise.reject("BEARING_FAILED", "Failed to get bearing: ${e.message}", e)
        }
    }
} 