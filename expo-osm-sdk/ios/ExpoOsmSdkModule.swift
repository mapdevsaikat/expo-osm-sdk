import ExpoModulesCore
import MapLibre
import UIKit

// Main Expo module for OSM SDK
public class ExpoOsmSdkModule: Module {
    // Shared view instance for module functions
    private weak var currentOSMView: OSMMapView?
    
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
            
            // Basic props
            Prop("initialCenter") { (view: OSMMapView, center: [String: Double]) in
                view.setInitialCenter(center)
            }
            
            Prop("initialZoom") { (view: OSMMapView, zoom: Double) in
                view.setInitialZoom(zoom)
            }
            
            Prop("tileServerUrl") { (view: OSMMapView, url: String) in
                view.setTileServerUrl(url)
            }
            
            Prop("styleUrl") { (view: OSMMapView, url: String?) in
                view.setStyleUrl(url)
            }
            
            // Enhanced marker support
            Prop("markers") { (view: OSMMapView, markers: [[String: Any]]) in
                view.setMarkers(markers)
            }
            
            // Overlay support
            Prop("polylines") { (view: OSMMapView, polylines: [[String: Any]]) in
                view.setPolylines(polylines)
            }
            
            Prop("polygons") { (view: OSMMapView, polygons: [[String: Any]]) in
                view.setPolygons(polygons)
            }
            
            Prop("circles") { (view: OSMMapView, circles: [[String: Any]]) in
                view.setCircles(circles)
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
            Prop("clustering") { (view: OSMMapView, clustering: [String: Any]) in
                view.setClustering(clustering)
            }
            
            // Lifecycle - store reference to current view
            OnCreate { view in
                self.currentOSMView = view
                view.setupMapView()
            }
            
            OnDestroy { view in
                if self.currentOSMView === view {
                    self.currentOSMView = nil
                }
            }
        }
        
        // Enhanced module functions for imperative API
        AsyncFunction("zoomIn") { (promise: Promise) in
            print("🔍 OSMSDKModule iOS: zoomIn called")
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    print("❌ OSMSDKModule iOS: OSM view not available for zoomIn")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.zoomIn()")
                    try view.zoomIn()
                    print("✅ OSMSDKModule iOS: zoomIn completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: zoomIn failed with error: \(error.localizedDescription)")
                    promise.reject("ZOOM_FAILED", "Failed to zoom in: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("zoomOut") { (promise: Promise) in
            print("🔍 OSMSDKModule iOS: zoomOut called")
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    print("❌ OSMSDKModule iOS: OSM view not available for zoomOut")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.zoomOut()")
                    try view.zoomOut()
                    print("✅ OSMSDKModule iOS: zoomOut completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: zoomOut failed with error: \(error.localizedDescription)")
                    promise.reject("ZOOM_FAILED", "Failed to zoom out: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("setZoom") { (zoom: Double, promise: Promise) in
            print("🔍 OSMSDKModule iOS: setZoom called with zoom: \(zoom)")
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    print("❌ OSMSDKModule iOS: OSM view not available for setZoom")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.setZoom(\(zoom))")
                    try view.setZoom(zoom)
                    print("✅ OSMSDKModule iOS: setZoom completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: setZoom failed with error: \(error.localizedDescription)")
                    promise.reject("ZOOM_FAILED", "Failed to set zoom: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("animateToLocation") { (latitude: Double, longitude: Double, zoom: Double?, promise: Promise) in
            print("🔍 OSMSDKModule iOS: animateToLocation called - lat: \(latitude), lng: \(longitude), zoom: \(zoom ?? 0)")
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    print("❌ OSMSDKModule iOS: OSM view not available for animateToLocation")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.animateToLocation(\(latitude), \(longitude), \(zoom ?? 0))")
                    try view.animateToLocation(latitude: latitude, longitude: longitude, zoom: zoom)
                    print("✅ OSMSDKModule iOS: animateToLocation completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: animateToLocation failed with error: \(error.localizedDescription)")
                    promise.reject("ANIMATION_FAILED", "Failed to animate to location: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("getCurrentLocation") { (promise: Promise) in
            print("🔍 OSMSDKModule iOS: getCurrentLocation called")
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    print("❌ OSMSDKModule iOS: OSM view not available for getCurrentLocation")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.getCurrentLocation()")
                    let location = try view.getCurrentLocation()
                    print("✅ OSMSDKModule iOS: getCurrentLocation completed successfully")
                    promise.resolve(location)
                } catch {
                    print("❌ OSMSDKModule iOS: getCurrentLocation failed with error: \(error.localizedDescription)")
                    promise.reject("LOCATION_ERROR", "Failed to get current location: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("startLocationTracking") { (promise: Promise) in
            print("🔍 OSMSDKModule iOS: startLocationTracking called")
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    print("❌ OSMSDKModule iOS: OSM view not available for startLocationTracking")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.startLocationTracking()")
                    try view.startLocationTracking()
                    print("✅ OSMSDKModule iOS: startLocationTracking completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: startLocationTracking failed with error: \(error.localizedDescription)")
                    promise.reject("LOCATION_TRACKING_ERROR", "Failed to start location tracking: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("stopLocationTracking") { (promise: Promise) in
            print("🔍 OSMSDKModule iOS: stopLocationTracking called")
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    print("❌ OSMSDKModule iOS: OSM view not available for stopLocationTracking")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.stopLocationTracking()")
                    try view.stopLocationTracking()
                    print("✅ OSMSDKModule iOS: stopLocationTracking completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: stopLocationTracking failed with error: \(error.localizedDescription)")
                    promise.reject("LOCATION_TRACKING_ERROR", "Failed to stop location tracking: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("waitForLocation") { (timeoutSeconds: Int, promise: Promise) in
            print("🔍 OSMSDKModule iOS: waitForLocation called with timeout: \(timeoutSeconds)s")
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    print("❌ OSMSDKModule iOS: OSM view not available for waitForLocation")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.waitForLocation(\(timeoutSeconds))")
                    let location = try view.waitForLocation(timeoutSeconds: timeoutSeconds)
                    print("✅ OSMSDKModule iOS: waitForLocation completed successfully")
                    promise.resolve(location)
                } catch {
                    print("❌ OSMSDKModule iOS: waitForLocation failed with error: \(error.localizedDescription)")
                    promise.reject("LOCATION_TIMEOUT", "Failed to get location within timeout: \(error.localizedDescription)")
                }
            }
        }
        
        // Utility function for module availability
        Function("isAvailable") {
            return true
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