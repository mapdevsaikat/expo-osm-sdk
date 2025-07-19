package expo.modules.osmsdk

import android.content.Context
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import org.maplibre.android.maps.MapView
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.OnMapReadyCallback
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng

import org.maplibre.android.annotations.MarkerOptions
import org.maplibre.android.annotations.Marker
import android.location.LocationManager
import android.location.Location

/**
 * Simple Android map view for OSM SDK
 * Basic functionality without complex features
 */
class OSMMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext), OnMapReadyCallback {
    
    private var mapView: MapView? = null
    private var mapLibreMap: MapLibreMap? = null
    private var initialCenter: Map<String, Double>? = null
    private var initialZoom: Double = 10.0
    private var tileServerUrl: String = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    private var styleUrl: String? = null
    private var markers: List<Map<String, Any>> = emptyList()
    private var showUserLocation: Boolean = false
    private var mapMarkers: MutableList<Marker> = mutableListOf()
    
    init {
        setupMapView()
    }
    
    private fun setupMapView() {
        try {
        mapView = MapView(context)
            mapView?.onCreate(null)
            mapView?.getMapAsync(this)
        addView(mapView)
        } catch (e: Exception) {
            println("OSM SDK: Error creating map view: ${e.message}")
        }
    }
    
    override fun onMapReady(mapLibreMap: MapLibreMap) {
        this.mapLibreMap = mapLibreMap
        
        try {
            setupInitialPosition()
            setupTileLayer()
            setupEventListeners()
            
            // Send map ready event
            sendEvent("onMapReady", null)
        } catch (e: Exception) {
            println("OSM SDK: Error in onMapReady: ${e.message}")
        }
    }
    
    private fun setupInitialPosition() {
        initialCenter?.let { center ->
            val lat = center["latitude"] ?: 0.0
            val lng = center["longitude"] ?: 0.0
            
            val position = CameraPosition.Builder()
                .target(LatLng(lat, lng))
            .zoom(initialZoom)
            .build()
                
            mapLibreMap?.cameraPosition = position
        }
    }
    
    private fun setupTileLayer() {
        val styleJson = """
        {
            "version": 8,
            "sources": {
                "osm-raster": {
                    "type": "raster",
                    "tiles": ["$tileServerUrl"],
                    "tileSize": 256,
                    "attribution": "© OpenStreetMap contributors"
                }
            },
            "layers": [
                {
                    "id": "osm-raster-layer",
                    "type": "raster",
                    "source": "osm-raster"
                }
            ]
        }
        """.trimIndent()
        
        mapLibreMap?.setStyle(styleJson) { style ->
            println("OSM SDK: Map style loaded successfully")
        }
    }
    
    private fun setupEventListeners() {
        mapLibreMap?.setOnMapClickListener { point ->
            sendEvent("onPress", mapOf(
                "latitude" to point.latitude,
                "longitude" to point.longitude
            ))
                true
            }
            
        mapLibreMap?.setOnCameraIdleListener {
            val center = mapLibreMap?.cameraPosition?.target
            center?.let {
                sendEvent("onRegionChange", mapOf(
                    "latitude" to it.latitude,
                    "longitude" to it.longitude,
                    "latitudeDelta" to 0.1,
                    "longitudeDelta" to 0.1
                ))
            }
        }
    }
    
    // Basic map control methods
    fun zoomIn() {
        mapLibreMap?.let { map ->
            val currentZoom = map.cameraPosition.zoom
            val newPosition = CameraPosition.Builder()
                .target(map.cameraPosition.target)
                .zoom(currentZoom + 1)
                .build()
            map.animateCamera(CameraUpdateFactory.newCameraPosition(newPosition))
        }
    }
    
    fun zoomOut() {
        mapLibreMap?.let { map ->
                val currentZoom = map.cameraPosition.zoom
            val newPosition = CameraPosition.Builder()
                .target(map.cameraPosition.target)
                .zoom(currentZoom - 1)
                .build()
            map.animateCamera(CameraUpdateFactory.newCameraPosition(newPosition))
        }
    }
    
    fun setZoom(zoom: Double) {
        mapLibreMap?.let { map ->
            val newPosition = CameraPosition.Builder()
                .target(map.cameraPosition.target)
                    .zoom(zoom)
                    .build()
            map.animateCamera(CameraUpdateFactory.newCameraPosition(newPosition))
        }
    }
    
    fun animateToLocation(latitude: Double, longitude: Double, zoom: Double?) {
        mapLibreMap?.let { map ->
            val newPosition = CameraPosition.Builder()
                .target(LatLng(latitude, longitude))
                .zoom(zoom ?: map.cameraPosition.zoom)
                    .build()
            map.animateCamera(CameraUpdateFactory.newCameraPosition(newPosition))
        }
    }
    
    fun getCurrentLocation(): Map<String, Any> {
        val center = mapLibreMap?.cameraPosition?.target
        return if (center != null) {
            mapOf(
                "latitude" to center.latitude,
                "longitude" to center.longitude,
                "accuracy" to 0.0,
                "timestamp" to System.currentTimeMillis(),
                "source" to "map-center"
            )
        } else {
            throw Exception("Map not available")
        }
    }
    
    fun startLocationTracking() {
        // Basic location tracking placeholder
        println("OSM SDK: Location tracking started")
    }
    
    fun stopLocationTracking() {
        // Basic location tracking placeholder
        println("OSM SDK: Location tracking stopped")
    }
    
    // Props setters
    fun setInitialCenter(center: Map<String, Double>) {
        this.initialCenter = center
        if (mapLibreMap != null) {
            setupInitialPosition()
        }
    }
    
    fun setInitialZoom(zoom: Double) {
        this.initialZoom = zoom
    }
    
    fun setTileServerUrl(url: String) {
        this.tileServerUrl = url
        if (mapLibreMap != null) {
            setupTileLayer()
        }
    }
    
    fun setStyleUrl(url: String?) {
        this.styleUrl = url
        // Vector styles can be implemented later
    }
    
    fun setMarkers(markers: List<Map<String, Any>>) {
        this.markers = markers
        updateMarkers()
    }
    
    fun setShowUserLocation(show: Boolean) {
        this.showUserLocation = show
        // User location display can be implemented later
    }
    
    private fun updateMarkers() {
        mapLibreMap?.let { map ->
            // Clear existing markers
            mapMarkers.forEach { map.removeMarker(it) }
            mapMarkers.clear()
            
            // Add new markers
            markers.forEach { markerData ->
                try {
                    val coordinate = markerData["coordinate"] as? Map<String, Double>
                    coordinate?.let { coord ->
                        val lat = coord["latitude"] ?: return@let
                        val lng = coord["longitude"] ?: return@let
                        val title = markerData["title"] as? String
                        
                        val markerOptions = MarkerOptions()
                            .position(LatLng(lat, lng))
                            .title(title ?: "")
                            
                        val marker = map.addMarker(markerOptions)
                        marker?.let { mapMarkers.add(it) }
                    }
                } catch (e: Exception) {
                    println("OSM SDK: Error adding marker: ${e.message}")
                }
            }
        }
    }
    
    private fun sendEvent(eventName: String, data: Any?) {
        try {
            this.sendEvent(eventName, data)
                } catch (e: Exception) {
            println("OSM SDK: Error sending event $eventName: ${e.message}")
        }
    }
    
    // Lifecycle methods
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        mapView?.onStart()
        mapView?.onResume()
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        mapView?.onPause()
        mapView?.onStop()
        mapView?.onDestroy()
    }
} 