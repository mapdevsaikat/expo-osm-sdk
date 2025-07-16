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
            
            // View lifecycle is handled within OSMMapView class itself
            // No explicit lifecycle methods needed here
        }
        
        // Module functions for zoom and location control  
        AsyncFunction("zoomInOnView") { reactTag: Int ->
            // Find the view by react tag and call zoomIn
            // This is a simplified approach - would need proper view lookup
        }
        
        // Simple module function that returns a constant value
        Function("isAvailable") {
            return@Function true
        }
    }
} 