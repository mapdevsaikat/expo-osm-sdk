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
import android.location.LocationListener
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import android.os.Bundle

/**
 * Enhanced Android map view for OSM SDK
 * Includes GPS location services and camera controls
 */
class OSMMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext), OnMapReadyCallback, LocationListener {
    
    private var mapView: MapView? = null
    private var mapLibreMap: MapLibreMap? = null
    private var initialCenter: Map<String, Double>? = null
    private var initialZoom: Double = 10.0
    private var tileServerUrl: String = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    private var styleUrl: String? = null
    private var markers: List<Map<String, Any>> = emptyList()
    private var showUserLocation: Boolean = false
    private var mapMarkers: MutableList<Marker> = mutableListOf()
    
    // GPS Location components
    private var locationManager: LocationManager? = null
    private var lastKnownLocation: Location? = null
    private var isLocationTrackingActive: Boolean = false
    
    init {
        setupMapView()
        setupLocationManager()
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
    
    private fun setupLocationManager() {
        try {
            locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            println("🌍 OSM SDK Android: LocationManager initialized")
        } catch (e: Exception) {
            println("❌ OSM SDK Android: Failed to initialize LocationManager: ${e.message}")
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
        if (styleUrl != null && isVectorStyle(styleUrl!!)) {
            // Use vector style from URL
            setupVectorTiles()
        } else {
            // Use raster tiles
            setupRasterTiles()
        }
    }
    
    private fun isVectorStyle(url: String): Boolean {
        return url.contains(".json") || 
               url.contains("style.json") || 
               url.contains("/styles/") ||
               url.contains("maplibre") ||
               url.contains("mapbox")
    }
    
    private fun setupVectorTiles() {
        styleUrl?.let { url ->
            println("🗺️ OSM SDK Android: Loading vector style from: $url")
            mapLibreMap?.setStyle(url) { style ->
                println("✅ OSM SDK Android: Vector style loaded successfully")
            }
        }
    }
    
    private fun setupRasterTiles() {
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
        
        println("🗺️ OSM SDK Android: Loading raster tiles from: $tileServerUrl")
        mapLibreMap?.setStyle(styleJson) { style ->
            println("✅ OSM SDK Android: Raster style loaded successfully")
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
        // Check for location permissions
        if (!hasLocationPermission()) {
            throw Exception("Location permission not granted")
        }
        
        // Try to get last known location first
        lastKnownLocation?.let { location ->
            if (isLocationRecent(location)) {
                return mapOf(
                    "latitude" to location.latitude,
                    "longitude" to location.longitude,
                    "accuracy" to location.accuracy.toDouble(),
                    "altitude" to location.altitude,
                    "timestamp" to location.time,
                    "source" to "gps"
                )
            }
        }
        
        // Try to get fresh location from providers
        locationManager?.let { manager ->
            try {
                val providers = manager.getProviders(true)
                for (provider in listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)) {
                    if (providers.contains(provider)) {
                        val location = manager.getLastKnownLocation(provider)
                        if (location != null && isLocationRecent(location)) {
                            lastKnownLocation = location
                            return mapOf(
                                "latitude" to location.latitude,
                                "longitude" to location.longitude,
                                "accuracy" to location.accuracy.toDouble(),
                                "altitude" to location.altitude,
                                "timestamp" to location.time,
                                "source" to provider
                            )
                        }
                    }
                }
            } catch (e: SecurityException) {
                println("❌ OSM SDK Android: Location permission denied, using map center as fallback")
                // Fallback to map center when permission denied
                val mapCenter = mapView.cameraPosition?.target
                if (mapCenter != null) {
                    return mapOf(
                        "latitude" to mapCenter.latitude,
                        "longitude" to mapCenter.longitude,
                        "accuracy" to 0.0,
                        "altitude" to null,
                        "timestamp" to System.currentTimeMillis(),
                        "source" to "map-center",
                        "error" to "Location permission denied. Please enable location access in device settings."
                    )
                }
                throw Exception("Location permission denied and map center unavailable")
            }
        }
        
        // Fallback to map center if no recent GPS location available
        println("⚠️ OSM SDK Android: No recent GPS location, using map center as fallback")
        val mapCenter = mapView.cameraPosition?.target
        if (mapCenter != null) {
            return mapOf(
                "latitude" to mapCenter.latitude,
                "longitude" to mapCenter.longitude,
                "accuracy" to 0.0,
                "altitude" to null,
                "timestamp" to System.currentTimeMillis(),
                "source" to "map-center",
                "error" to "No recent GPS location available. Location may be disabled or GPS signal weak."
            )
        }
        
        throw Exception("No location available - GPS unavailable and map center unavailable")
    }
    
    fun startLocationTracking() {
        if (!hasLocationPermission()) {
            println("❌ OSM SDK Android: Location permission not granted for tracking")
            // Could emit an error event here for the app to handle
            throw Exception("Location permission denied. Please enable location access in device settings to track user movement.")
        }
        
        locationManager?.let { manager ->
            try {
                isLocationTrackingActive = true
                
                // Request updates from GPS provider
                if (manager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    manager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        2000, // 2 seconds
                        5f,   // 5 meters
                        this
                    )
                    println("🛰️ OSM SDK Android: GPS location tracking started")
                }
                
                // Request updates from Network provider as fallback
                if (manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    manager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        5000, // 5 seconds
                        10f,  // 10 meters
                        this
                    )
                    println("📶 OSM SDK Android: Network location tracking started")
                }
            } catch (e: SecurityException) {
                println("❌ OSM SDK Android: Location permission denied for tracking")
            } catch (e: Exception) {
                println("❌ OSM SDK Android: Failed to start location tracking: ${e.message}")
            }
        }
    }
    
    fun stopLocationTracking() {
        locationManager?.let { manager ->
            try {
                manager.removeUpdates(this)
                isLocationTrackingActive = false
                println("🛑 OSM SDK Android: Location tracking stopped")
            } catch (e: Exception) {
                println("❌ OSM SDK Android: Failed to stop location tracking: ${e.message}")
            }
        }
    }
    
    // LocationListener interface methods
    override fun onLocationChanged(location: Location) {
        lastKnownLocation = location
        println("📍 OSM SDK Android: Location updated - ${location.latitude}, ${location.longitude}")
        
        // Send location update event
        sendEvent("onUserLocationChange", mapOf(
            "latitude" to location.latitude,
            "longitude" to location.longitude,
            "accuracy" to location.accuracy.toDouble(),
            "altitude" to location.altitude,
            "speed" to location.speed.toDouble(),
            "bearing" to location.bearing.toDouble(),
            "timestamp" to location.time
        ))
    }
    
    override fun onProviderEnabled(provider: String) {
        println("✅ OSM SDK Android: Location provider enabled: $provider")
    }
    
    override fun onProviderDisabled(provider: String) {
        println("❌ OSM SDK Android: Location provider disabled: $provider")
    }
    
    @Deprecated("Deprecated in API level 29")
    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {
        println("📡 OSM SDK Android: Provider status changed: $provider, status: $status")
    }
    
    // Helper functions
    private fun hasLocationPermission(): Boolean {
        return ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED || 
        ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    private fun isLocationRecent(location: Location): Boolean {
        val maxAge = 5 * 60 * 1000 // 5 minutes
        return (System.currentTimeMillis() - location.time) < maxAge
    }
    
    // Camera Controls (Pitch & Bearing)
    fun setPitch(pitch: Double) {
        mapLibreMap?.let { map ->
            val clampedPitch = Math.max(0.0, Math.min(pitch, 60.0))
            val currentPosition = map.cameraPosition
            val newPosition = CameraPosition.Builder()
                .target(currentPosition.target)
                .zoom(currentPosition.zoom)
                .tilt(clampedPitch)
                .bearing(currentPosition.bearing)
                .build()
            map.animateCamera(CameraUpdateFactory.newCameraPosition(newPosition))
            println("📐 OSM SDK Android: Pitch set to $clampedPitch degrees")
        }
    }
    
    fun setBearing(bearing: Double) {
        mapLibreMap?.let { map ->
            val normalizedBearing = bearing % 360.0
            val adjustedBearing = if (normalizedBearing < 0) normalizedBearing + 360.0 else normalizedBearing
            val currentPosition = map.cameraPosition
            val newPosition = CameraPosition.Builder()
                .target(currentPosition.target)
                .zoom(currentPosition.zoom)
                .tilt(currentPosition.tilt)
                .bearing(adjustedBearing)
                .build()
            map.animateCamera(CameraUpdateFactory.newCameraPosition(newPosition))
            println("🧭 OSM SDK Android: Bearing set to $adjustedBearing degrees")
        }
    }
    
    fun getPitch(): Double {
        return mapLibreMap?.cameraPosition?.tilt ?: 0.0
    }
    
    fun getBearing(): Double {
        return mapLibreMap?.cameraPosition?.bearing ?: 0.0
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
        if (mapLibreMap != null) {
            setupTileLayer()
        }
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