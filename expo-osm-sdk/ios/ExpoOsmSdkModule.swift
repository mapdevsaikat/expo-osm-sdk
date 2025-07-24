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
        print("🚀 OSMSDKModule iOS: STARTING MODULE DEFINITION")
        print("📦 OSMSDKModule iOS: Module class: \(type(of: self))")
        
        // Module name
        Name("ExpoOsmSdk")
        print("✅ OSMSDKModule iOS: Module name set: ExpoOsmSdk")
        
        // Enhanced view manager for OSMView
        View(OSMMapView.self) {
            print("🖼️ OSMSDKModule iOS: STARTING VIEW DEFINITION")
            print("📱 OSMSDKModule iOS: View class: \(OSMMapView.self)")
            
            // Enhanced events
            Events(
                "onMapReady", "onRegionChange", "onMarkerPress", "onMarkerDragStart", 
                "onMarkerDrag", "onMarkerDragEnd", "onInfoWindowPress", "onPress", 
                "onLongPress", "onPolylinePress", "onPolygonPress", "onCirclePress",
                "onOverlayPress", "onUserLocationChange"
            )
            print("📡 OSMSDKModule iOS: Events registered")
            
            print("📍 OSMSDKModule iOS: Setting up view props...")
            
            // Basic props
            Prop("initialCenter") { (view: OSMMapView, center: [String: Double]) in
                print("🎯 OSMSDKModule iOS: Setting initialCenter: \(center)")
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
            
            // Enhanced lifecycle management
            OnCreate { view in
                print("🚀 OSMSDKModule iOS: OnCreate FIRED! - storing reference to view: \(view)")
                self.setViewSafely(view)
                print("✅ OSMSDKModule iOS: OSMView created - storing reference")
                // Set the module reference in the view for callbacks
                view.setModuleReference(self)
                print("📞 OSMSDKModule iOS: Module reference set in view")
            }
            
            OnDestroy { view in
                print("🗑️ OSMSDKModule iOS: OnDestroy FIRED! - clearing reference to view: \(view)")
                self.clearViewIfMatches(view)
            }
        }
        
        // Enhanced module functions with proper view checking and thread safety
        AsyncFunction("zoomIn") { (promise: Promise) in
            print("🔍 OSMSDKModule iOS: zoomIn called")
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
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
                guard let view = self.getViewSafely() else {
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
                guard let view = self.getViewSafely() else {
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
                guard let view = self.getViewSafely() else {
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
                guard let view = self.getViewSafely() else {
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
                guard let view = self.getViewSafely() else {
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
                guard let view = self.getViewSafely() else {
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
                guard let view = self.getViewSafely() else {
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
        
        // OSRM Routing Functions
        AsyncFunction("calculateRoute") { (fromLat: Double, fromLng: Double, toLat: Double, toLng: Double, profile: String?, promise: Promise) in
            print("🚗 OSMSDKModule iOS: calculateRoute called")
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    print("❌ OSMSDKModule iOS: OSM view not available for calculateRoute")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.calculateRoute(\(fromLat), \(fromLng), \(toLat), \(toLng), \(profile ?? "driving"))")
                    let result = try view.calculateRoute(
                        fromLatitude: fromLat,
                        fromLongitude: fromLng,
                        toLatitude: toLat,
                        toLongitude: toLng,
                        profile: profile ?? "driving"
                    )
                    print("✅ OSMSDKModule iOS: calculateRoute completed successfully")
                    promise.resolve(result)
                } catch {
                    print("❌ OSMSDKModule iOS: calculateRoute failed with error: \(error.localizedDescription)")
                    promise.reject("ROUTE_CALCULATION_FAILED", "Failed to calculate route: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("displayRoute") { (routeCoordinates: [[String: Double]], routeOptions: [String: Any]?, promise: Promise) in
            print("🛣️ OSMSDKModule iOS: displayRoute called")
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    print("❌ OSMSDKModule iOS: OSM view not available for displayRoute")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.displayRoute with \(routeCoordinates.count) coordinates")
                    try view.displayRoute(routeCoordinates: routeCoordinates, routeOptions: routeOptions ?? [:])
                    print("✅ OSMSDKModule iOS: displayRoute completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: displayRoute failed with error: \(error.localizedDescription)")
                    promise.reject("ROUTE_DISPLAY_FAILED", "Failed to display route: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("clearRoute") { (promise: Promise) in
            print("🗑️ OSMSDKModule iOS: clearRoute called")
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    print("❌ OSMSDKModule iOS: OSM view not available for clearRoute")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.clearRoute()")
                    view.clearRoute()
                    print("✅ OSMSDKModule iOS: clearRoute completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: clearRoute failed with error: \(error.localizedDescription)")
                    promise.reject("ROUTE_CLEAR_FAILED", "Failed to clear route: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("fitRouteInView") { (routeCoordinates: [[String: Double]], padding: Double?, promise: Promise) in
            print("📍 OSMSDKModule iOS: fitRouteInView called")
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    print("❌ OSMSDKModule iOS: OSM view not available for fitRouteInView")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.fitRouteInView with \(routeCoordinates.count) coordinates")
                    try view.fitRouteInView(routeCoordinates: routeCoordinates, padding: padding ?? 50.0)
                    print("✅ OSMSDKModule iOS: fitRouteInView completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: fitRouteInView failed with error: \(error.localizedDescription)")
                    promise.reject("ROUTE_FIT_FAILED", "Failed to fit route in view: \(error.localizedDescription)")
                }
            }
        }
        
        // OSRM Routing Functions
        AsyncFunction("calculateRoute") { (fromLat: Double, fromLng: Double, toLat: Double, toLng: Double, profile: String?, promise: Promise) in
            print("🚗 OSMSDKModule iOS: calculateRoute called")
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    print("❌ OSMSDKModule iOS: OSM view not available for calculateRoute")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.calculateRoute(\(fromLat), \(fromLng), \(toLat), \(toLng), \(profile ?? "driving"))")
                    let result = try view.calculateRoute(
                        fromLatitude: fromLat,
                        fromLongitude: fromLng,
                        toLatitude: toLat,
                        toLongitude: toLng,
                        profile: profile ?? "driving"
                    )
                    print("✅ OSMSDKModule iOS: calculateRoute completed successfully")
                    promise.resolve(result)
                } catch {
                    print("❌ OSMSDKModule iOS: calculateRoute failed with error: \(error.localizedDescription)")
                    promise.reject("ROUTE_CALCULATION_FAILED", "Failed to calculate route: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("displayRoute") { (routeCoordinates: [[String: Double]], routeOptions: [String: Any]?, promise: Promise) in
            print("🛣️ OSMSDKModule iOS: displayRoute called")
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    print("❌ OSMSDKModule iOS: OSM view not available for displayRoute")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.displayRoute with \(routeCoordinates.count) coordinates")
                    try view.displayRoute(routeCoordinates: routeCoordinates, routeOptions: routeOptions ?? [:])
                    print("✅ OSMSDKModule iOS: displayRoute completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: displayRoute failed with error: \(error.localizedDescription)")
                    promise.reject("ROUTE_DISPLAY_FAILED", "Failed to display route: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("clearRoute") { (promise: Promise) in
            print("🗑️ OSMSDKModule iOS: clearRoute called")
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    print("❌ OSMSDKModule iOS: OSM view not available for clearRoute")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.clearRoute()")
                    view.clearRoute()
                    print("✅ OSMSDKModule iOS: clearRoute completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: clearRoute failed with error: \(error.localizedDescription)")
                    promise.reject("ROUTE_CLEAR_FAILED", "Failed to clear route: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("fitRouteInView") { (routeCoordinates: [[String: Double]], padding: Double?, promise: Promise) in
            print("📍 OSMSDKModule iOS: fitRouteInView called")
            DispatchQueue.main.async {
                guard let view = self.getViewSafely() else {
                    print("❌ OSMSDKModule iOS: OSM view not available for fitRouteInView")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.fitRouteInView with \(routeCoordinates.count) coordinates")
                    try view.fitRouteInView(routeCoordinates: routeCoordinates, padding: padding ?? 50.0)
                    print("✅ OSMSDKModule iOS: fitRouteInView completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: fitRouteInView failed with error: \(error.localizedDescription)")
                    promise.reject("ROUTE_FIT_FAILED", "Failed to fit route in view: \(error.localizedDescription)")
                }
            }
        }
        
        print("🎯 OSMSDKModule iOS: MODULE DEFINITION COMPLETED SUCCESSFULLY!")
        print("📋 OSMSDKModule iOS: Summary:")
        print("  ✅ Module name: ExpoOsmSdk")
        print("  ✅ View class: \(OSMMapView.self)")
        print("  ✅ AsyncFunctions: zoomIn, zoomOut, setZoom, animateToLocation, getCurrentLocation, startLocationTracking, stopLocationTracking, waitForLocation, isViewReady, calculateRoute, displayRoute, clearRoute, fitRouteInView")
        print("  ✅ Functions: isAvailable")
    }
    
    // Thread-safe view access methods
    private func getViewSafely() -> OSMMapView? {
        return viewQueue.sync {
            print("🔍 OSMSDKModule iOS: getViewSafely() called")
            print("📊 OSMSDKModule iOS: Current view state: \(String(describing: currentOSMView))")
            print("🧵 OSMSDKModule iOS: Thread: \(Thread.current)")
            
            if let view = currentOSMView {
                print("✅ OSMSDKModule iOS: View is available: \(view)")
                let isReady = view.isMapReady()
                print("📋 OSMSDKModule iOS: View readiness: \(isReady)")
            } else {
                print("❌ OSMSDKModule iOS: View is NULL! Possible causes:")
                print("   1. OnCreate never fired")
                print("   2. View was destroyed")
                print("   3. Module recreated")
            }
            
            return currentOSMView
        }
    }
    
    private func setViewSafely(_ view: OSMMapView) {
        viewQueue.async(flags: .barrier) {
            print("🚀 OSMSDKModule iOS: setViewSafely called with view: \(view)")
            self.currentOSMView = view
            print("✅ OSMSDKModule iOS: View stored successfully")
        }
    }
    
    private func clearViewIfMatches(_ view: OSMMapView) {
        viewQueue.async(flags: .barrier) {
            print("🗑️ OSMSDKModule iOS: clearViewIfMatches called with view: \(view)")
            if self.currentOSMView === view {
                self.currentOSMView = nil
                print("✅ OSMSDKModule iOS: View reference cleared successfully")
            } else {
                print("⚠️ OSMSDKModule iOS: clearViewIfMatches called for different view instance!")
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