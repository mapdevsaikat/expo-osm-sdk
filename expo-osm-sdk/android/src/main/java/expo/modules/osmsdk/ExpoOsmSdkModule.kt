package expo.modules.osmsdk

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

/**
 * Simple Android module for OSM SDK
 * Focused on basic functionality without complex features
 */
class ExpoOsmSdkModule : Module() {
    private var currentOSMView: OSMMapView? = null
    
    override fun definition() = ModuleDefinition {
        Name("ExpoOsmSdk")
        
        View(OSMMapView::class) {
            Events("onMapReady", "onRegionChange", "onMarkerPress", "onPress", "onUserLocationChange")
            
            Prop("initialCenter") { view: OSMMapView, center: Map<String, Double> ->
                currentOSMView = view
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
        }
        
        // Basic async functions
        AsyncFunction("zoomIn") { promise: Promise ->
            try {
                currentOSMView?.let { view ->
                    view.post {
                        view.zoomIn()
                    }
                }
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("ZOOM_FAILED", "Failed to zoom in: ${e.message}", e)
            }
        }
        
        AsyncFunction("zoomOut") { promise: Promise ->
            try {
                currentOSMView?.let { view ->
                    view.post {
                        view.zoomOut()
                    }
                }
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("ZOOM_FAILED", "Failed to zoom out: ${e.message}", e)
            }
        }
        
        AsyncFunction("setZoom") { zoom: Double, promise: Promise ->
            try {
                currentOSMView?.let { view ->
                    view.post {
                view.setZoom(zoom)
                    }
                }
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("ZOOM_FAILED", "Failed to set zoom: ${e.message}", e)
            }
        }
        
        AsyncFunction("animateToLocation") { latitude: Double, longitude: Double, zoom: Double?, promise: Promise ->
            try {
                currentOSMView?.let { view ->
                    view.post {
                        view.animateToLocation(latitude, longitude, zoom)
                    }
                }
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("ANIMATION_FAILED", "Failed to animate: ${e.message}", e)
            }
        }
        
        AsyncFunction("getCurrentLocation") { promise: Promise ->
            try {
                currentOSMView?.let { view ->
                val location = view.getCurrentLocation()
                promise.resolve(location)
                } ?: run {
                    promise.reject("NO_VIEW", "Map view not available", null)
                }
            } catch (e: Exception) {
                promise.reject("LOCATION_FAILED", "Failed to get location: ${e.message}", e)
            }
        }
        
        AsyncFunction("startLocationTracking") { promise: Promise ->
            try {
                currentOSMView?.startLocationTracking()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("TRACKING_FAILED", "Failed to start tracking: ${e.message}", e)
            }
        }
        
        AsyncFunction("stopLocationTracking") { promise: Promise ->
            try {
                currentOSMView?.stopLocationTracking()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("TRACKING_FAILED", "Failed to stop tracking: ${e.message}", e)
            }
        }
    }
} 