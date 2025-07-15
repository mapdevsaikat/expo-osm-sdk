package expo.modules.osmsdk

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

// Main Expo module for OSM SDK on Android
class ExpoOsmSdkModule : Module() {
    override fun definition() = ModuleDefinition {
        // Module name
        Name("ExpoOsmSdk")
        
        // View manager for OSMView  
        View(OSMMapView::class) {
            // Events
            Events("onMapReady", "onRegionChange", "onMarkerPress", "onPress")
            
            // Props
            Prop("initialCenter") { view: OSMMapView, center: Map<String, Double> ->
                view.setInitialCenter(center)
            }
            
            Prop("initialZoom") { view: OSMMapView, zoom: Double ->
                view.setInitialZoom(zoom)
            }
            
            Prop("tileServerUrl") { view: OSMMapView, url: String ->
                view.setTileServerUrl(url)
            }
            
            Prop("markers") { view: OSMMapView, markers: List<Map<String, Any>> ->
                view.setMarkers(markers)
            }
            
            // Lifecycle
            OnViewDidLoad { view: OSMMapView ->
                view.setupMapView()
            }
            
            OnViewWillUnmount { view: OSMMapView ->
                view.cleanup()
            }
        }
        
        // Module functions
        Function("getMapSnapshot") { viewId: String, promise: Promise ->
            // Implementation for getting map snapshot
            promise.resolve(null)
        }
        
        Function("animateToRegion") { viewId: String, region: Map<String, Double>, duration: Double ->
            // Implementation for animating to region
        }
    }
} 