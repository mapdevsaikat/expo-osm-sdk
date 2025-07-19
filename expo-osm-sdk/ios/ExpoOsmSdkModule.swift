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
        
        // MARK: - Camera Controls (Pitch & Bearing)
        
        AsyncFunction("setPitch") { (pitch: Double, promise: Promise) in
            print("🔍 OSMSDKModule iOS: setPitch called with pitch: \(pitch)")
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    print("❌ OSMSDKModule iOS: OSM view not available for setPitch")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.setPitch(\(pitch))")
                    try view.setPitch(pitch)
                    print("✅ OSMSDKModule iOS: setPitch completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: setPitch failed with error: \(error.localizedDescription)")
                    promise.reject("PITCH_FAILED", "Failed to set pitch: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("setBearing") { (bearing: Double, promise: Promise) in
            print("🔍 OSMSDKModule iOS: setBearing called with bearing: \(bearing)")
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    print("❌ OSMSDKModule iOS: OSM view not available for setBearing")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.setBearing(\(bearing))")
                    try view.setBearing(bearing)
                    print("✅ OSMSDKModule iOS: setBearing completed successfully")
                    promise.resolve(nil)
                } catch {
                    print("❌ OSMSDKModule iOS: setBearing failed with error: \(error.localizedDescription)")
                    promise.reject("BEARING_FAILED", "Failed to set bearing: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("getPitch") { (promise: Promise) in
            print("🔍 OSMSDKModule iOS: getPitch called")
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    print("❌ OSMSDKModule iOS: OSM view not available for getPitch")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.getPitch()")
                    let pitch = try view.getPitch()
                    print("✅ OSMSDKModule iOS: getPitch completed successfully: \(pitch)")
                    promise.resolve(pitch)
                } catch {
                    print("❌ OSMSDKModule iOS: getPitch failed with error: \(error.localizedDescription)")
                    promise.reject("PITCH_FAILED", "Failed to get pitch: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("getBearing") { (promise: Promise) in
            print("🔍 OSMSDKModule iOS: getBearing called")
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    print("❌ OSMSDKModule iOS: OSM view not available for getBearing")
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    print("📍 OSMSDKModule iOS: Calling view.getBearing()")
                    let bearing = try view.getBearing()
                    print("✅ OSMSDKModule iOS: getBearing completed successfully: \(bearing)")
                    promise.resolve(bearing)
                } catch {
                    print("❌ OSMSDKModule iOS: getBearing failed with error: \(error.localizedDescription)")
                    promise.reject("BEARING_FAILED", "Failed to get bearing: \(error.localizedDescription)")
                }
            }
        }
        
        // MARK: - Enhanced Imperative API Methods
        
        // Camera and Region Control
        AsyncFunction("animateToRegion") { (region: [String: Double], duration: Int?, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                guard let lat = region["latitude"], let lng = region["longitude"],
                      let latDelta = region["latitudeDelta"], let lngDelta = region["longitudeDelta"] else {
                    promise.reject("INVALID_REGION", "Invalid region data")
                    return
                }
                
                do {
                    try view.animateToRegion(latitude: lat, longitude: lng, latitudeDelta: latDelta, longitudeDelta: lngDelta, duration: duration ?? 1000)
                    promise.resolve(nil)
                } catch {
                    promise.reject("ANIMATION_FAILED", "Failed to animate to region: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("fitToMarkers") { (markerIds: [String]?, padding: Double?, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.fitToMarkers(markerIds: markerIds, padding: padding ?? 50)
                    promise.resolve(nil)
                } catch {
                    promise.reject("FIT_FAILED", "Failed to fit to markers: \(error.localizedDescription)")
                }
            }
        }
        
        // Marker Control
        AsyncFunction("addMarker") { (marker: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.addMarker(markerData: marker)
                    promise.resolve(nil)
                } catch {
                    promise.reject("MARKER_FAILED", "Failed to add marker: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("removeMarker") { (markerId: String, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.removeMarker(markerId: markerId)
                    promise.resolve(nil)
                } catch {
                    promise.reject("MARKER_FAILED", "Failed to remove marker: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("updateMarker") { (markerId: String, updates: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.updateMarker(markerId: markerId, updates: updates)
                    promise.resolve(nil)
                } catch {
                    promise.reject("MARKER_FAILED", "Failed to update marker: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("showInfoWindow") { (markerId: String, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.showInfoWindow(markerId: markerId)
                    promise.resolve(nil)
                } catch {
                    promise.reject("INFO_WINDOW_FAILED", "Failed to show info window: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("hideInfoWindow") { (markerId: String, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.hideInfoWindow(markerId: markerId)
                    promise.resolve(nil)
                } catch {
                    promise.reject("INFO_WINDOW_FAILED", "Failed to hide info window: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("animateMarker") { (markerId: String, animation: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.animateMarker(markerId: markerId, animation: animation)
                    promise.resolve(nil)
                } catch {
                    promise.reject("ANIMATION_FAILED", "Failed to animate marker: \(error.localizedDescription)")
                }
            }
        }
        
        // Overlay Control - Polylines
        AsyncFunction("addPolyline") { (polyline: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.addPolyline(polylineData: polyline)
                    promise.resolve(nil)
                } catch {
                    promise.reject("POLYLINE_FAILED", "Failed to add polyline: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("removePolyline") { (polylineId: String, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.removePolyline(polylineId: polylineId)
                    promise.resolve(nil)
                } catch {
                    promise.reject("POLYLINE_FAILED", "Failed to remove polyline: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("updatePolyline") { (polylineId: String, updates: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.updatePolyline(polylineId: polylineId, updates: updates)
                    promise.resolve(nil)
                } catch {
                    promise.reject("POLYLINE_FAILED", "Failed to update polyline: \(error.localizedDescription)")
                }
            }
        }
        
        // Overlay Control - Polygons
        AsyncFunction("addPolygon") { (polygon: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.addPolygon(polygonData: polygon)
                    promise.resolve(nil)
                } catch {
                    promise.reject("POLYGON_FAILED", "Failed to add polygon: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("removePolygon") { (polygonId: String, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.removePolygon(polygonId: polygonId)
                    promise.resolve(nil)
                } catch {
                    promise.reject("POLYGON_FAILED", "Failed to remove polygon: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("updatePolygon") { (polygonId: String, updates: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.updatePolygon(polygonId: polygonId, updates: updates)
                    promise.resolve(nil)
                } catch {
                    promise.reject("POLYGON_FAILED", "Failed to update polygon: \(error.localizedDescription)")
                }
            }
        }
        
        // Overlay Control - Circles
        AsyncFunction("addCircle") { (circle: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.addCircle(circleData: circle)
                    promise.resolve(nil)
                } catch {
                    promise.reject("CIRCLE_FAILED", "Failed to add circle: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("removeCircle") { (circleId: String, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.removeCircle(circleId: circleId)
                    promise.resolve(nil)
                } catch {
                    promise.reject("CIRCLE_FAILED", "Failed to remove circle: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("updateCircle") { (circleId: String, updates: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.updateCircle(circleId: circleId, updates: updates)
                    promise.resolve(nil)
                } catch {
                    promise.reject("CIRCLE_FAILED", "Failed to update circle: \(error.localizedDescription)")
                }
            }
        }
        
        // Overlay Control - Custom Overlays
        AsyncFunction("addOverlay") { (overlay: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.addOverlay(overlayData: overlay)
                    promise.resolve(nil)
                } catch {
                    promise.reject("OVERLAY_FAILED", "Failed to add overlay: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("removeOverlay") { (overlayId: String, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.removeOverlay(overlayId: overlayId)
                    promise.resolve(nil)
                } catch {
                    promise.reject("OVERLAY_FAILED", "Failed to remove overlay: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("updateOverlay") { (overlayId: String, updates: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    try view.updateOverlay(overlayId: overlayId, updates: updates)
                    promise.resolve(nil)
                } catch {
                    promise.reject("OVERLAY_FAILED", "Failed to update overlay: \(error.localizedDescription)")
                }
            }
        }
        
        // Coordinate Conversion
        AsyncFunction("coordinateForPoint") { (point: [String: Double], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                guard let x = point["x"], let y = point["y"] else {
                    promise.reject("INVALID_POINT", "Invalid point data")
                    return
                }
                
                do {
                    let coordinate = try view.coordinateForPoint(x: x, y: y)
                    promise.resolve(coordinate)
                } catch {
                    promise.reject("CONVERSION_FAILED", "Failed to convert point to coordinate: \(error.localizedDescription)")
                }
            }
        }
        
        AsyncFunction("pointForCoordinate") { (coordinate: [String: Double], promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                guard let lat = coordinate["latitude"], let lng = coordinate["longitude"] else {
                    promise.reject("INVALID_COORDINATE", "Invalid coordinate data")
                    return
                }
                
                do {
                    let point = try view.pointForCoordinate(latitude: lat, longitude: lng)
                    promise.resolve(point)
                } catch {
                    promise.reject("CONVERSION_FAILED", "Failed to convert coordinate to point: \(error.localizedDescription)")
                }
            }
        }
        
        // Map Utilities
        AsyncFunction("takeSnapshot") { (format: String?, quality: Double?, promise: Promise) in
            DispatchQueue.main.async {
                guard let view = self.currentOSMView else {
                    promise.reject("VIEW_NOT_FOUND", "OSM view not available")
                    return
                }
                
                do {
                    let snapshot = try view.takeSnapshot(format: format ?? "png", quality: quality ?? 1.0)
                    promise.resolve(snapshot)
                } catch {
                    promise.reject("SNAPSHOT_FAILED", "Failed to take snapshot: \(error.localizedDescription)")
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