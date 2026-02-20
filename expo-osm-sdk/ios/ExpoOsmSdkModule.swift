import ExpoModulesCore
import MapLibre
import UIKit

// Main Expo module for OSM SDK
public class ExpoOsmSdkModule: Module {
    // Shared view instance for module functions - use thread-safe access
    private weak var currentOSMView: OSMMapView?
    private let viewQueue = DispatchQueue(label: "com.expo.osmsdk.viewqueue", attributes: .concurrent)
    
    // Enhanced module definition with all features
    public func definition() -> ModuleDefinition {
        
        // Module name
        Name("ExpoOsmSdk")
        
        // Enhanced view manager for OSMView
        View(OSMMapView.self) {
            
            // Enhanced events
            Events(
                "onMapReady", "onRegionChange", "onMarkerPress", "onMarkerDragStart", 
                "onMarkerDrag", "onMarkerDragEnd", "onInfoWindowPress", "onPress", 
                "onLongPress", "onPolylinePress", "onPolygonPress", "onCirclePress",
                "onOverlayPress", "onUserLocationChange"
            )
            
            // NOTE: OnCreate/OnDestroy removed for Expo SDK 53 compatibility
            // View reference is managed through Props (via initialCenter and others)
            // This approach works with both Expo SDK < 53 and SDK 53+
            
            
            // Basic props
            Prop("initialCenter") { (view: OSMMapView, center: [String: Double]?) in
                self.setViewSafely(view)
                if let center = center {
                    view.setInitialCenter(center)
                }
            }
            
            Prop("initialZoom") { (view: OSMMapView, zoom: Double?) in
                if let zoom = zoom {
                    view.setInitialZoom(zoom)
                }
            }
            
            Prop("initialPitch") { (view: OSMMapView, pitch: Double?) in
                if let pitch = pitch {
                    view.setInitialPitch(pitch)
                }
            }
            
            Prop("initialBearing") { (view: OSMMapView, bearing: Double?) in
                if let bearing = bearing {
                    view.setInitialBearing(bearing)
                }
            }
            
            Prop("tileServerUrl") { (view: OSMMapView, url: String?) in
                if let url = url {
                    view.setTileServerUrl(url)
                }
            }
            
            Prop("styleUrl") { (view: OSMMapView, url: String?) in
                view.setStyleUrl(url)
            }
            
            // Enhanced marker support
            Prop("markers") { (view: OSMMapView, markers: [[String: Any]]?) in
                view.setMarkers(markers ?? [])
            }
            
            // Overlay support
            Prop("polylines") { (view: OSMMapView, polylines: [[String: Any]]?) in
                view.setPolylines(polylines ?? [])
            }
            
            Prop("polygons") { (view: OSMMapView, polygons: [[String: Any]]?) in
                view.setPolygons(polygons ?? [])
            }
            
            Prop("circles") { (view: OSMMapView, circles: [[String: Any]]?) in
                view.setCircles(circles ?? [])
            }
            
            // Map configuration props
            Prop("showUserLocation") { (view: OSMMapView, show: Bool) in
                view.setShowUserLocation(show)
            }
            
            Prop("followUserLocation") { (view: OSMMapView, follow: Bool) in
                view.setFollowUserLocation(follow)
            }
            
            Prop("showsCompass") { (view: OSMMapView, show: Bool) in
                view.setShowsCompass(show)
            }
            
            Prop("showsScale") { (view: OSMMapView, show: Bool) in
                view.setShowsScale(show)
            }
            
            Prop("rotateEnabled") { (view: OSMMapView, enabled: Bool) in
                view.setRotateEnabled(enabled)
            }
            
            Prop("scrollEnabled") { (view: OSMMapView, enabled: Bool) in
                view.setScrollEnabled(enabled)
            }
            
            Prop("zoomEnabled") { (view: OSMMapView, enabled: Bool) in
                view.setZoomEnabled(enabled)
            }
            
            Prop("pitchEnabled") { (view: OSMMapView, enabled: Bool) in
                view.setPitchEnabled(enabled)
            }
            
            // Clustering configuration
            Prop("clustering") { (view: OSMMapView, clustering: [String: Any]?) in
                if let clustering = clustering {
                    view.setClustering(clustering)
                }
            }
        }
        
        // Enhanced module functions with proper view checking and thread safety
        AsyncFunction("zoomIn") { (promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.zoomIn()
                    promise.resolve(nil)
                } catch {
                    promise.reject("ZOOM_FAILED", "Failed to zoom in: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("zoomOut") { (promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.zoomOut()
                    promise.resolve(nil)
                } catch {
                    promise.reject("ZOOM_FAILED", "Failed to zoom out: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("setZoom") { (zoom: Double, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.setZoom(zoom)
                    promise.resolve(nil)
                } catch {
                    promise.reject("ZOOM_FAILED", "Failed to set zoom: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("animateToLocation") { (latitude: Double, longitude: Double, zoom: Double?, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.animateToLocation(latitude: latitude, longitude: longitude, zoom: zoom)
                    promise.resolve(nil)
                } catch {
                    promise.reject("ANIMATION_FAILED", "Failed to animate to location: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("getCurrentLocation") { (promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    let location = try view.getCurrentLocation()
                    promise.resolve(location)
                } catch {
                    promise.reject("LOCATION_ERROR", "Failed to get current location: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("startLocationTracking") { (promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.startLocationTracking()
                    promise.resolve(nil)
                } catch {
                    promise.reject("LOCATION_TRACKING_ERROR", "Failed to start location tracking: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("stopLocationTracking") { (promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.stopLocationTracking()
                    promise.resolve(nil)
                } catch {
                    promise.reject("LOCATION_TRACKING_ERROR", "Failed to stop location tracking: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("waitForLocation") { (timeoutSeconds: Int, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    let location = try view.waitForLocation(timeoutSeconds: timeoutSeconds)
                    promise.resolve(location)
                } catch {
                    promise.reject("LOCATION_TIMEOUT", "Failed to get location within timeout: \(error.localizedDescription)")
                }
            }
        }
        
        // Enhanced availability check
        Function("isAvailable") {
            let view = self.getViewSafely()
            return view != nil
        }
        
        // Add view readiness check
        AsyncFunction("isViewReady") { (promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.resolve(false)
                    return
                }
                
                // Check if view is properly initialized
                promise.resolve(view.isMapReady())
            }
        }
        
        // Camera orientation controls
        AsyncFunction("setPitch") { (pitch: Double, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.setPitch(pitch)
                    promise.resolve(nil)
                } catch {
                    promise.reject("SET_PITCH_FAILED", "Failed to set pitch: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("setBearing") { (bearing: Double, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.setBearing(bearing)
                    promise.resolve(nil)
                } catch {
                    promise.reject("SET_BEARING_FAILED", "Failed to set bearing: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("getPitch") { (promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                let pitch = view.getPitch()
                promise.resolve(pitch)
            }
        }
        
        AsyncFunction("getBearing") { (promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                let bearing = view.getBearing()
                promise.resolve(bearing)
            }
        }
        
        AsyncFunction("animateCamera") { (options: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    let latitude = options["latitude"] as? Double
                    let longitude = options["longitude"] as? Double
                    let zoom = options["zoom"] as? Double
                    let pitch = options["pitch"] as? Double
                    let bearing = options["bearing"] as? Double
                    let duration = options["duration"] as? Double
                    
                    try view.animateCamera(
                        latitude: latitude,
                        longitude: longitude,
                        zoom: zoom,
                        pitch: pitch,
                        bearing: bearing,
                        duration: duration
                    )
                    promise.resolve(nil)
                } catch {
                    promise.reject("ANIMATE_CAMERA_FAILED", "Failed to animate camera: \(error.localizedDescription)")
                }
            }
        }
        
    }
    
    // Thread-safe view access methods
    private func getViewSafely() -> OSMMapView? {
        return viewQueue.sync {
            
            if let view = currentOSMView {
                let isReady = view.isMapReady()
            } else {
            }
            
            return currentOSMView
        }
    }
    
    private func setViewSafely(_ view: OSMMapView) {
        viewQueue.async(flags: .barrier) {
            self.currentOSMView = view
        }
    }
    
    private func clearViewIfMatches(_ view: OSMMapView) {
        viewQueue.async(flags: .barrier) {
            if self.currentOSMView === view {
                self.currentOSMView = nil
            } else {
            }
        }
    }
}

// Extension to calculate distance between coordinates
extension CLLocationCoordinate2D {
    func distance(to coordinate: CLLocationCoordinate2D) -> Double {
        let location1 = CLLocation(latitude: self.latitude, longitude: self.longitude)
        let location2 = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
        return location1.distance(from: location2)
    }
}