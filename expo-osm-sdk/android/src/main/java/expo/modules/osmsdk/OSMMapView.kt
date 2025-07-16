package expo.modules.osmsdk

import android.content.Context
import android.view.MotionEvent
import androidx.annotation.NonNull
import org.maplibre.android.MapLibre
import org.maplibre.android.maps.MapView
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.OnMapReadyCallback
import org.maplibre.android.maps.Style
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.style.sources.RasterSource
import org.maplibre.android.style.layers.RasterLayer
import org.maplibre.android.annotations.MarkerOptions
import org.maplibre.android.annotations.Marker
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.kotlin.AppContext

// Native Android map view using MapLibre GL Native
class OSMMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext), OnMapReadyCallback {
    
    // MapLibre map view
    private lateinit var mapView: MapView
    private var maplibreMap: MapLibreMap? = null
    
    // Configuration properties
    private var initialCenter = LatLng(0.0, 0.0)
    private var initialZoom = 10.0
    private var tileServerUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    private var markers = mutableListOf<MarkerData>()
    private var mapMarkers = mutableListOf<Marker>()
    
    // Event dispatchers
    private val onMapReady by EventDispatcher()
    private val onRegionChange by EventDispatcher()
    private val onMarkerPress by EventDispatcher()
    private val onPress by EventDispatcher()
    
    // Marker data structure
    data class MarkerData(
        val id: String,
        val coordinate: LatLng,
        val title: String?,
        val description: String?,
        val icon: String?
    )
    
    // Setup the map view
    fun setupMapView() {
        // Initialize MapLibre - API updated for 11.x
        MapLibre.getInstance(context)
        
        // Create map view
        mapView = MapView(context)
        mapView.onCreate(null)
        mapView.getMapAsync(this)
        
        // Add to view hierarchy
        addView(mapView)
        
        // Setup layout params
        val layoutParams = LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.MATCH_PARENT
        )
        mapView.layoutParams = layoutParams
    }
    
    // MARK: - OnMapReadyCallback
    
    override fun onMapReady(@NonNull maplibreMap: MapLibreMap) {
        this.maplibreMap = maplibreMap
        
        // Set initial camera position
        val cameraPosition = CameraPosition.Builder()
            .target(initialCenter)
            .zoom(initialZoom)
            .build()
        maplibreMap.cameraPosition = cameraPosition
        
        // Setup tile source and style - improved initialization
        setupTileSource()
        
        // Setup event listeners
        setupEventListeners()
        
        // Add markers after map is fully ready
        addMarkersToMap()
        
        // Emit map ready event
        onMapReady(mapOf<String, Any>())
    }
    
    // Setup tile source - improved with proper MapLibre style
    private fun setupTileSource() {
        maplibreMap?.let { map ->
            try {
                // Use a proper MapLibre style JSON for better compatibility
                val styleJson = """
                {
                    "version": 8,
                    "sources": {
                        "osm-tiles": {
                            "type": "raster",
                            "tiles": ["$tileServerUrl"],
                            "tileSize": 256,
                            "attribution": "© OpenStreetMap contributors"
                        }
                    },
                    "layers": [
                        {
                            "id": "osm-layer",
                            "type": "raster",
                            "source": "osm-tiles"
                        }
                    ]
                }
                """.trimIndent()
                
                map.setStyle(Style.Builder().fromJson(styleJson)) { style ->
                    try {
                        println("OSM SDK: Map style loaded successfully")
                        
                    } catch (e: Exception) {
                        // Log tile setup error but don't crash
                        println("OSM SDK: Error after style load: ${e.message}")
                    }
                }
            } catch (e: Exception) {
                println("OSM SDK: Error setting up map style: ${e.message}")
            }
        }
    }
    
    // Setup event listeners
    private fun setupEventListeners() {
        maplibreMap?.let { map ->
            // Region change listener
            map.addOnCameraIdleListener {
                val target = map.cameraPosition.target ?: return@addOnCameraIdleListener
                val bounds = map.projection.visibleRegion.latLngBounds
                
                onRegionChange(mapOf(
                    "latitude" to target.latitude,
                    "longitude" to target.longitude,
                    "latitudeDelta" to (bounds.northEast.latitude - bounds.southWest.latitude),
                    "longitudeDelta" to (bounds.northEast.longitude - bounds.southWest.longitude)
                ))
            }
            
            // Marker click listener
            map.setOnMarkerClickListener { marker: Marker ->
                val markerData = markers.find { markerItem: MarkerData -> 
                    markerItem.coordinate.latitude == marker.position.latitude && 
                    markerItem.coordinate.longitude == marker.position.longitude 
                }
                
                markerData?.let { data: MarkerData ->
                    onMarkerPress(mapOf("markerId" to data.id))
                }
                
                true
            }
            
            // Map click listener - Updated for MapLibre 11.x
            map.addOnMapClickListener { point: LatLng ->
                onPress(mapOf(
                    "coordinate" to mapOf(
                        "latitude" to point.latitude,
                        "longitude" to point.longitude
                    )
                ))
                true
            }
        }
    }
    
    // MARK: - Property Setters
    
    fun setInitialCenter(center: Map<String, Double>) {
        val lat = center["latitude"] ?: 0.0
        val lng = center["longitude"] ?: 0.0
        initialCenter = LatLng(lat, lng)
        
        // Update map if already initialized
        maplibreMap?.let { map ->
            val cameraPosition = CameraPosition.Builder()
                .target(initialCenter)
                .zoom(map.cameraPosition.zoom)
                .build()
            map.cameraPosition = cameraPosition
        }
    }
    
    fun setInitialZoom(zoom: Double) {
        initialZoom = zoom
        
        // Update map if already initialized
        maplibreMap?.let { map ->
            val cameraPosition = CameraPosition.Builder()
                .target(map.cameraPosition.target)
                .zoom(zoom)
                .build()
            map.cameraPosition = cameraPosition
        }
    }
    
    fun setTileServerUrl(url: String) {
        tileServerUrl = url
        
        // Recreate tile source with new URL
        if (maplibreMap != null) {
            setupTileSource()
        }
    }
    
    fun setMarkers(markersData: List<Map<String, Any>>) {
        // Clear existing markers
        mapMarkers.forEach { marker ->
            maplibreMap?.removeMarker(marker)
        }
        mapMarkers.clear()
        
        // Parse new markers
        markers = markersData.mapNotNull { data ->
            val id = data["id"] as? String ?: return@mapNotNull null
            val coordinate = data["coordinate"] as? Map<String, Double> ?: return@mapNotNull null
            val lat = coordinate["latitude"] ?: return@mapNotNull null
            val lng = coordinate["longitude"] ?: return@mapNotNull null
            
            MarkerData(
                id = id,
                coordinate = LatLng(lat, lng),
                title = data["title"] as? String,
                description = data["description"] as? String,
                icon = data["icon"] as? String
            )
        }.toMutableList()
        
        // Add markers to map
        addMarkersToMap()
    }
    
    // Add markers to map
    private fun addMarkersToMap() {
        maplibreMap?.let { map ->
            markers.forEach { marker ->
                val markerOptions = MarkerOptions()
                    .position(marker.coordinate)
                    .title(marker.title)
                    .snippet(marker.description)
                
                val mapMarker = map.addMarker(markerOptions)
                mapMarker?.let { mapMarkers.add(it) }
            }
        }
    }
    
    // MARK: - Zoom Controls
    
    fun zoomIn() {
        maplibreMap?.let { map ->
            val currentZoom = map.cameraPosition.zoom
            animateToZoom(currentZoom + 1.0)
        }
    }
    
    fun zoomOut() {
        maplibreMap?.let { map ->
            val currentZoom = map.cameraPosition.zoom
            animateToZoom(currentZoom - 1.0)
        }
    }
    
    fun setZoom(zoom: Double) {
        maplibreMap?.let { map ->
            animateToZoom(zoom)
        }
    }
    
    private fun animateToZoom(zoom: Double) {
        maplibreMap?.let { map ->
            val currentCenter = map.cameraPosition.target ?: initialCenter
            val cameraPosition = CameraPosition.Builder()
                .target(currentCenter)
                .zoom(zoom.coerceIn(1.0, 20.0)) // Limit zoom level
                .build()
            map.animateCamera(org.maplibre.android.camera.CameraUpdateFactory.newCameraPosition(cameraPosition), 500)
        }
    }
    
    // MARK: - Location Controls
    
    fun animateToLocation(latitude: Double, longitude: Double, zoom: Double = initialZoom) {
        maplibreMap?.let { map ->
            val location = LatLng(latitude, longitude)
            val cameraPosition = CameraPosition.Builder()
                .target(location)
                .zoom(zoom.coerceIn(1.0, 20.0))
                .build()
            map.animateCamera(org.maplibre.android.camera.CameraUpdateFactory.newCameraPosition(cameraPosition), 1000)
        }
    }
    
    fun getCurrentLocation() {
        // For now, return current map center
        // In a full implementation, you'd use LocationManager or FusedLocationProviderClient
        maplibreMap?.let { map ->
            val center = map.cameraPosition.target ?: initialCenter
            onPress(mapOf(
                "latitude" to center.latitude,
                "longitude" to center.longitude
            ))
        }
    }

    // MARK: - Lifecycle
    
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        // Initialize the map view when attached to window
        if (!::mapView.isInitialized) {
            setupMapView()
        }
        if (::mapView.isInitialized) {
            mapView.onResume()
        }
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        if (::mapView.isInitialized) {
            mapView.onPause()
        }
        // Clean up when view is detached
        cleanup()
    }
    
    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        mapView.measure(widthMeasureSpec, heightMeasureSpec)
    }
    
    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        mapView.layout(0, 0, r - l, b - t)
    }
    
    // Cleanup method for view lifecycle
    fun cleanup() {
        try {
            if (::mapView.isInitialized) {
                mapView.onDestroy()
            }
            mapMarkers.clear()
            markers.clear()
        } catch (e: Exception) {
            // Handle cleanup gracefully
        }
    }
} 