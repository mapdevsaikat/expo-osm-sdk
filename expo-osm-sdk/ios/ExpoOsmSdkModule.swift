import ExpoModulesCore
import MapLibre
import UIKit

// Main Expo module for OSM SDK
public class ExpoOsmSdkModule: Module {
    // Module definition
    public func definition() -> ModuleDefinition {
        // Module name
        Name("ExpoOsmSdk")
        
        // View manager for OSMView
        View(OSMMapView.self) {
            // Events
            Events("onMapReady", "onRegionChange", "onMarkerPress", "onPress")
            
            // Props
            Prop("initialCenter") { (view: OSMMapView, center: [String: Double]) in
                view.setInitialCenter(center)
            }
            
            Prop("initialZoom") { (view: OSMMapView, zoom: Double) in
                view.setInitialZoom(zoom)
            }
            
            Prop("tileServerUrl") { (view: OSMMapView, url: String) in
                view.setTileServerUrl(url)
            }
            
            Prop("markers") { (view: OSMMapView, markers: [[String: Any]]) in
                view.setMarkers(markers)
            }
            
            // Lifecycle
            OnCreate { view in
                view.setupMapView()
            }
        }
        
        // Module functions
        Function("getMapSnapshot") { (viewId: String, promise: Promise) in
            // Implementation for getting map snapshot
            promise.resolve(nil)
        }
        
        Function("animateToRegion") { (viewId: String, region: [String: Double], duration: Double) in
            // Implementation for animating to region
        }
    }
} 