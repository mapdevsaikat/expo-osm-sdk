package expo.modules.osmsdk

import android.content.Context
import android.view.MotionEvent
import androidx.annotation.NonNull
import com.mapbox.mapboxsdk.Mapbox
import com.mapbox.mapboxsdk.maps.MapView
import com.mapbox.mapboxsdk.maps.MapboxMap
import com.mapbox.mapboxsdk.maps.OnMapReadyCallback
import com.mapbox.mapboxsdk.maps.Style
import com.mapbox.mapboxsdk.camera.CameraPosition
import com.mapbox.mapboxsdk.geometry.LatLng
import com.mapbox.mapboxsdk.style.sources.RasterSource
import com.mapbox.mapboxsdk.style.sources.TileSet
import com.mapbox.mapboxsdk.style.layers.RasterLayer
import com.mapbox.mapboxsdk.annotations.MarkerOptions
import com.mapbox.mapboxsdk.annotations.Marker
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

// Native Android map view using MapLibre GL Native
class OSMMapView(context: Context) : ExpoView(context), OnMapReadyCallback {
    
    // MapLibre map view
    private lateinit var mapView: MapView
    private var mapboxMap: MapboxMap? = null
    
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
        // Initialize MapLibre
        Mapbox.getInstance(context, null)
        
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
    
    override fun onMapReady(@NonNull mapboxMap: MapboxMap) {
        this.mapboxMap = mapboxMap
        
        // Set initial camera position
        val cameraPosition = CameraPosition.Builder()
            .target(initialCenter)
            .zoom(initialZoom)
            .build()
        mapboxMap.cameraPosition = cameraPosition
        
        // Setup tile source and style
        setupTileSource()
        
        // Setup event listeners
        setupEventListeners()
        
        // Add markers
        addMarkersToMap()
        
        // Emit map ready event
        onMapReady(mapOf<String, Any>())
    }
    
    // Setup tile source
    private fun setupTileSource() {
        val style = Style.Builder()
            .fromUri("asset://empty-style.json") // Empty base style
        
        mapboxMap?.setStyle(style) { style ->
            // Add OSM raster source
            val rasterSource = RasterSource(
                "osm-tiles",
                TileSet.Builder("osm-tiles", tileServerUrl)
                    .tileSize(256)
                    .minZoom(0)
                    .maxZoom(18)
                    .build()
            )
            
            // Add raster layer
            val rasterLayer = RasterLayer("osm-layer", "osm-tiles")
            
            // Add to style
            style.addSource(rasterSource)
            style.addLayer(rasterLayer)
        }
    }
    
    // Setup event listeners
    private fun setupEventListeners() {
        mapboxMap?.let { map ->
            // Region change listener
            map.addOnCameraIdleListener {
                val target = map.cameraPosition.target
                val bounds = map.projection.visibleRegion.latLngBounds
                
                onRegionChange(mapOf(
                    "latitude" to target.latitude,
                    "longitude" to target.longitude,
                    "latitudeDelta" to (bounds.northEast.latitude - bounds.southWest.latitude),
                    "longitudeDelta" to (bounds.northEast.longitude - bounds.southWest.longitude)
                ))
            }
            
            // Marker click listener
            map.setOnMarkerClickListener { marker ->
                val markerData = markers.find { 
                    it.coordinate.latitude == marker.position.latitude && 
                    it.coordinate.longitude == marker.position.longitude 
                }
                
                markerData?.let {
                    onMarkerPress(mapOf("markerId" to it.id))
                }
                
                true
            }
            
            // Map click listener
            map.setOnMapClickListener { point ->
                onPress(mapOf(
                    "coordinate" to mapOf(
                        "latitude" to point.latitude,
                        "longitude" to point.longitude
                    )
                ))
            }
        }
    }
    
    // MARK: - Property Setters
    
    fun setInitialCenter(center: Map<String, Double>) {
        val lat = center["latitude"] ?: 0.0
        val lng = center["longitude"] ?: 0.0
        initialCenter = LatLng(lat, lng)
        
        // Update map if already initialized
        mapboxMap?.let { map ->
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
        mapboxMap?.let { map ->
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
        if (mapboxMap != null) {
            setupTileSource()
        }
    }
    
    fun setMarkers(markersData: List<Map<String, Any>>) {
        // Clear existing markers
        mapMarkers.forEach { marker ->
            mapboxMap?.removeMarker(marker)
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
        mapboxMap?.let { map ->
            markers.forEach { marker ->
                val markerOptions = MarkerOptions()
                    .position(marker.coordinate)
                    .title(marker.title)
                    .snippet(marker.description)
                
                val mapMarker = map.addMarker(markerOptions)
                mapMarkers.add(mapMarker)
            }
        }
    }
    
    // MARK: - Lifecycle
    
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        mapView.onResume()
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        mapView.onPause()
    }
    
    fun cleanup() {
        mapView.onDestroy()
    }
    
    // MARK: - Layout
    
    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        mapView.measure(widthMeasureSpec, heightMeasureSpec)
    }
    
    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        mapView.layout(0, 0, r - l, b - t)
    }
} 