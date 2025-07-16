import ExpoModulesCore
import MapLibre
import UIKit

// Main Expo module for OSM SDK
public class ExpoOsmSdkModule: Module {
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
            
            // Lifecycle
            OnCreate { view in
                view.setupMapView()
            }
        }
        
        // Enhanced module functions for imperative API
        AsyncFunction("zoomIn") { (viewTag: Int, promise: Promise) in
            DispatchQueue.main.async {
                if let view = self.findOSMView(withTag: viewTag) {
                    view.mapView?.zoomLevel += 1
                    promise.resolve(nil)
                } else {
                    promise.reject("VIEW_NOT_FOUND", "Could not find OSM view with tag \(viewTag)")
                }
            }
        }
        
        AsyncFunction("zoomOut") { (viewTag: Int, promise: Promise) in
            DispatchQueue.main.async {
                if let view = self.findOSMView(withTag: viewTag) {
                    view.mapView?.zoomLevel -= 1
                    promise.resolve(nil)
                } else {
                    promise.reject("VIEW_NOT_FOUND", "Could not find OSM view with tag \(viewTag)")
                }
            }
        }
        
        AsyncFunction("setZoom") { (viewTag: Int, zoom: Double, promise: Promise) in
            DispatchQueue.main.async {
                if let view = self.findOSMView(withTag: viewTag) {
                    view.mapView?.zoomLevel = zoom
                    promise.resolve(nil)
                } else {
                    promise.reject("VIEW_NOT_FOUND", "Could not find OSM view with tag \(viewTag)")
                }
            }
        }
        
        AsyncFunction("animateToLocation") { (viewTag: Int, latitude: Double, longitude: Double, zoom: Double?, promise: Promise) in
            DispatchQueue.main.async {
                if let view = self.findOSMView(withTag: viewTag) {
                    let coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
                    view.mapView?.setCenter(coordinate, zoomLevel: zoom ?? view.mapView?.zoomLevel ?? 10, animated: true)
                    promise.resolve(nil)
                } else {
                    promise.reject("VIEW_NOT_FOUND", "Could not find OSM view with tag \(viewTag)")
                }
            }
        }
        
        AsyncFunction("getCurrentLocation") { (viewTag: Int, promise: Promise) in
            DispatchQueue.main.async {
                if let view = self.findOSMView(withTag: viewTag) {
                    let center = view.mapView?.centerCoordinate ?? CLLocationCoordinate2D(latitude: 0, longitude: 0)
                    promise.resolve([
                        "latitude": center.latitude,
                        "longitude": center.longitude
                    ])
                } else {
                    promise.reject("VIEW_NOT_FOUND", "Could not find OSM view with tag \(viewTag)")
                }
            }
        }
        
        AsyncFunction("takeSnapshot") { (viewTag: Int, format: String?, quality: Double?, promise: Promise) in
            DispatchQueue.main.async {
                if let view = self.findOSMView(withTag: viewTag),
                   let mapView = view.mapView {
                    
                    UIGraphicsBeginImageContextWithOptions(mapView.bounds.size, false, UIScreen.main.scale)
                    mapView.drawHierarchy(in: mapView.bounds, afterScreenUpdates: true)
                    let image = UIGraphicsGetImageFromCurrentImageContext()
                    UIGraphicsEndImageContext()
                    
                    if let image = image {
                        let imageData: Data?
                        if format?.lowercased() == "jpg" || format?.lowercased() == "jpeg" {
                            imageData = image.jpegData(compressionQuality: quality ?? 0.8)
                        } else {
                            imageData = image.pngData()
                        }
                        
                        if let data = imageData {
                            let base64String = data.base64EncodedString()
                            promise.resolve("data:image/\(format ?? "png");base64,\(base64String)")
                        } else {
                            promise.reject("SNAPSHOT_FAILED", "Failed to convert image to data")
                        }
                    } else {
                        promise.reject("SNAPSHOT_FAILED", "Failed to create snapshot")
                    }
                } else {
                    promise.reject("VIEW_NOT_FOUND", "Could not find OSM view with tag \(viewTag)")
                }
            }
        }
        
        // Location services
        AsyncFunction("startLocationTracking") { (viewTag: Int, promise: Promise) in
            DispatchQueue.main.async {
                if let view = self.findOSMView(withTag: viewTag) {
                    view.locationManager?.startUpdatingLocation()
                    promise.resolve(nil)
                } else {
                    promise.reject("VIEW_NOT_FOUND", "Could not find OSM view with tag \(viewTag)")
                }
            }
        }
        
        AsyncFunction("stopLocationTracking") { (viewTag: Int, promise: Promise) in
            DispatchQueue.main.async {
                if let view = self.findOSMView(withTag: viewTag) {
                    view.locationManager?.stopUpdatingLocation()
                    promise.resolve(nil)
                } else {
                    promise.reject("VIEW_NOT_FOUND", "Could not find OSM view with tag \(viewTag)")
                }
            }
        }
        
        // Utility function for module availability
        Function("isAvailable") {
            return true
        }
    }
    
    // Helper function to find OSM view by tag
    private func findOSMView(withTag tag: Int) -> OSMMapView? {
        // This would need to be implemented to find the view by its React tag
        // For now, return nil - this would require access to the view registry
        return nil
    }
} 