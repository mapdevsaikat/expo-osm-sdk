package expo.modules.osmsdk

import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.view.MotionEvent
import androidx.annotation.NonNull
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
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
class OSMMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext), OnMapReadyCallback, LocationListener {
    
    // MapLibre map view
    private lateinit var mapView: MapView
    private var maplibreMap: MapLibreMap? = null
    
    // Location services
    private var locationManager: LocationManager? = null
    private var lastKnownLocation: Location? = null
    private var isLocationTrackingActive = false
    
    // Configuration properties
    private var initialCenter = LatLng(0.0, 0.0)
    var initialZoom = 10.0
        private set
    private var tileServerUrl = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
    private var styleUrl: String? = null
    private var isVectorStyle = true
    private var markers = mutableListOf<MarkerData>()
    private var mapMarkers = mutableListOf<Marker>()
    
    // Location configuration
    private var showUserLocation = false
    private var followUserLocation = false
    
    // Event dispatchers
    private val onMapReady by EventDispatcher()
    private val onRegionChange by EventDispatcher()
    private val onMarkerPress by EventDispatcher()
    private val onPress by EventDispatcher()
    private val onUserLocationChange by EventDispatcher()
    
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
    
    // Setup tile source - improved with vector tile support
    private fun setupTileSource() {
        maplibreMap?.let { map ->
            try {
                if (isVectorStyleUrl(tileServerUrl)) {
                    // Use vector style URL directly
                    setupVectorStyle(map)
                } else {
                    // Use raster tiles with style JSON
                    setupRasterTiles(map)
                }
            } catch (e: Exception) {
                println("OSM SDK: Error setting up map style: ${e.message}")
            }
        }
    }
    
    // Check if URL is a vector style
    private fun isVectorStyleUrl(url: String): Boolean {
        return url.endsWith(".json") || url.contains("style.json") || url.contains("/styles/")
    }
    
    // Setup vector style from URL
    private fun setupVectorStyle(map: MapLibreMap) {
        val vectorStyleUrl = styleUrl ?: tileServerUrl
        println("OSM SDK: Attempting to load vector style from: $vectorStyleUrl")
        
        map.setStyle(Style.Builder().fromUri(vectorStyleUrl)) { style ->
            if (style != null) {
                println("OSM SDK: Vector style loaded successfully from $vectorStyleUrl")
                println("OSM SDK: Style sources: ${style.sources.map { it.id }}")
                println("OSM SDK: Style layers: ${style.layers.map { it.id }}")
            } else {
                println("OSM SDK: ERROR - Vector style failed to load, style is null")
                // Fallback to a basic raster style
                setupRasterTilesFallback(map)
            }
        }
    }
    
    // Fallback raster tiles if vector style fails
    private fun setupRasterTilesFallback(map: MapLibreMap) {
        println("OSM SDK: Falling back to raster tiles")
        val fallbackStyleJson = """
        {
            "version": 8,
            "sources": {
                "osm-fallback": {
                    "type": "raster",
                    "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                    "tileSize": 256,
                    "attribution": "© OpenStreetMap contributors"
                }
            },
            "layers": [
                {
                    "id": "osm-fallback-layer",
                    "type": "raster",
                    "source": "osm-fallback"
                }
            ]
        }
        """.trimIndent()
        
        map.setStyle(Style.Builder().fromJson(fallbackStyleJson)) { style ->
            println("OSM SDK: Fallback raster style loaded successfully")
        }
    }
    
    // Setup raster tiles (fallback for legacy URLs)
    private fun setupRasterTiles(map: MapLibreMap) {
        // Use a proper MapLibre style JSON for raster tiles
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
            println("OSM SDK: Raster style loaded successfully")
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
        isVectorStyle = isVectorStyleUrl(url)
        
        // Recreate tile source with new URL
        if (maplibreMap != null) {
            setupTileSource()
        }
    }
    
    fun setStyleUrl(url: String?) {
        styleUrl = url
        if (maplibreMap != null && url != null) {
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
    
    // MARK: - Helper functions
    
    private fun isMapReady(): Boolean {
        return maplibreMap != null && maplibreMap?.style != null && maplibreMap?.style?.isFullyLoaded == true
    }
    
    fun zoomIn() {
        android.util.Log.d("OSMMapView", "🔍 zoomIn called")
        
        if (!isMapReady()) {
            android.util.Log.e("OSMMapView", "❌ Cannot zoom in - map not ready. maplibreMap: $maplibreMap, style: ${maplibreMap?.style}, loaded: ${maplibreMap?.style?.isFullyLoaded}")
            throw Exception("Map not ready - style not loaded")
        }
        
        maplibreMap?.let { map ->
            try {
                android.util.Log.d("OSMMapView", "📍 Getting current camera position")
                val currentZoom = map.cameraPosition.zoom
                val newZoom = (currentZoom + 1.0).coerceIn(1.0, 20.0)
                android.util.Log.d("OSMMapView", "📍 Zooming in from $currentZoom to $newZoom")
                animateToZoom(newZoom)
                android.util.Log.d("OSMMapView", "✅ zoomIn animation started successfully")
            } catch (e: Exception) {
                android.util.Log.e("OSMMapView", "❌ Error during zoom in: ${e.message}", e)
                throw Exception("Zoom in failed: ${e.message}")
            }
        }
    }
    
    fun zoomOut() {
        android.util.Log.d("OSMMapView", "🔍 zoomOut called")
        
        if (!isMapReady()) {
            android.util.Log.e("OSMMapView", "❌ Cannot zoom out - map not ready. maplibreMap: $maplibreMap, style: ${maplibreMap?.style}, loaded: ${maplibreMap?.style?.isFullyLoaded}")
            throw Exception("Map not ready - style not loaded")
        }
        
        maplibreMap?.let { map ->
            try {
                android.util.Log.d("OSMMapView", "📍 Getting current camera position")
                val currentZoom = map.cameraPosition.zoom
                val newZoom = (currentZoom - 1.0).coerceIn(1.0, 20.0)
                android.util.Log.d("OSMMapView", "📍 Zooming out from $currentZoom to $newZoom")
                animateToZoom(newZoom)
                android.util.Log.d("OSMMapView", "✅ zoomOut animation started successfully")
            } catch (e: Exception) {
                android.util.Log.e("OSMMapView", "❌ Error during zoom out: ${e.message}", e)
                throw Exception("Zoom out failed: ${e.message}")
            }
        }
    }
    
    fun setZoom(zoom: Double) {
        maplibreMap?.let { map ->
            try {
                val clampedZoom = zoom.coerceIn(1.0, 20.0)
                println("OSM SDK Android: Setting zoom to $clampedZoom")
                animateToZoom(clampedZoom)
            } catch (e: Exception) {
                println("OSM SDK Android: Error during set zoom: ${e.message}")
                throw e
            }
        } ?: run {
            println("OSM SDK Android: Cannot set zoom - map not ready")
            throw Exception("Map not ready")
        }
    }
    
    private fun animateToZoom(zoom: Double) {
        android.util.Log.d("OSMMapView", "🔍 animateToZoom called with zoom: $zoom")
        
        if (maplibreMap == null) {
            android.util.Log.e("OSMMapView", "❌ Cannot animate zoom - maplibreMap is null")
            throw Exception("Map not available for zoom animation")
        }
        
        maplibreMap?.let { map ->
            try {
                android.util.Log.d("OSMMapView", "📍 Getting current camera position for animation")
                val currentCenter = map.cameraPosition.target ?: initialCenter
                android.util.Log.d("OSMMapView", "📍 Current center: ${currentCenter.latitude}, ${currentCenter.longitude}")
                
                val cameraPosition = CameraPosition.Builder()
                    .target(currentCenter)
                    .zoom(zoom)
                    .build()
                
                android.util.Log.d("OSMMapView", "📍 Animating camera to zoom $zoom at ${currentCenter.latitude}, ${currentCenter.longitude}")
                map.animateCamera(
                    org.maplibre.android.camera.CameraUpdateFactory.newCameraPosition(cameraPosition), 
                    500
                )
                android.util.Log.d("OSMMapView", "✅ Camera animation started successfully")
            } catch (e: Exception) {
                android.util.Log.e("OSMMapView", "❌ Camera animation failed: ${e.message}", e)
                throw Exception("Camera animation failed: ${e.message}")
            }
        }
    }
    
    // MARK: - Location Controls
    
    fun animateToLocation(latitude: Double, longitude: Double, zoom: Double = initialZoom) {
        android.util.Log.d("OSMMapView", "🔍 animateToLocation called - lat: $latitude, lng: $longitude, zoom: $zoom")
        
        // Validate coordinates
        if (!isValidCoordinate(latitude, longitude)) {
            android.util.Log.e("OSMMapView", "❌ Invalid coordinates: lat=$latitude, lng=$longitude")
            throw Exception("Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180")
        }
        
        // Check map readiness
        if (!isMapReady()) {
            android.util.Log.e("OSMMapView", "❌ Cannot animate - map not ready. maplibreMap: $maplibreMap, style: ${maplibreMap?.style}, loaded: ${maplibreMap?.style?.isFullyLoaded}")
            throw Exception("Map not ready - style not loaded")
        }
        
        maplibreMap?.let { map ->
            try {
                val targetLocation = LatLng(latitude, longitude)
                val clampedZoom = zoom.coerceIn(1.0, 20.0)
                
                android.util.Log.d("OSMMapView", "📍 Getting current camera position")
                val currentPosition = map.cameraPosition
                val currentLocation = currentPosition.target ?: initialCenter
                
                // Calculate animation duration based on distance
                val animationDuration = calculateAnimationDuration(
                    currentLocation.latitude, currentLocation.longitude,
                    latitude, longitude,
                    currentPosition.zoom, clampedZoom
                )
                
                android.util.Log.d("OSMMapView", "📍 Animating from (${currentLocation.latitude}, ${currentLocation.longitude}) to ($latitude, $longitude)")
                android.util.Log.d("OSMMapView", "📍 Zoom: ${currentPosition.zoom} → $clampedZoom, Duration: ${animationDuration}ms")
                
                val cameraPosition = CameraPosition.Builder()
                    .target(targetLocation)
                    .zoom(clampedZoom)
                    .build()
                
                // Create camera update with animation callback
                val cameraUpdate = org.maplibre.android.camera.CameraUpdateFactory.newCameraPosition(cameraPosition)
                
                map.animateCamera(cameraUpdate, animationDuration, object : org.maplibre.android.maps.MapLibreMap.CancelableCallback {
                    override fun onFinish() {
                        android.util.Log.d("OSMMapView", "✅ Location animation completed successfully")
                    }
                    
                    override fun onCancel() {
                        android.util.Log.w("OSMMapView", "⚠️ Location animation was cancelled")
                    }
                })
                
                android.util.Log.d("OSMMapView", "✅ Location animation started successfully")
            } catch (e: Exception) {
                android.util.Log.e("OSMMapView", "❌ Location animation failed: ${e.message}", e)
                throw Exception("Location animation failed: ${e.message}")
            }
        }
    }
    
    // Helper function to validate coordinates
    private fun isValidCoordinate(latitude: Double, longitude: Double): Boolean {
        return latitude >= -90.0 && latitude <= 90.0 && longitude >= -180.0 && longitude <= 180.0
    }
    
    // Calculate dynamic animation duration based on distance and zoom change
    private fun calculateAnimationDuration(
        fromLat: Double, fromLng: Double, 
        toLat: Double, toLng: Double,
        fromZoom: Double, toZoom: Double
    ): Int {
        // Calculate distance in degrees
        val latDiff = Math.abs(toLat - fromLat)
        val lngDiff = Math.abs(toLng - fromLng)
        val distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)
        
        // Calculate zoom difference
        val zoomDiff = Math.abs(toZoom - fromZoom)
        
        // Base duration
        val baseDuration = 800
        
        // Distance factor (longer distances need more time)
        val distanceFactor = Math.min(distance * 100, 500.0).toInt()
        
        // Zoom factor (big zoom changes need more time)
        val zoomFactor = (zoomDiff * 100).toInt()
        
        // Calculate total duration (min 500ms, max 3000ms)
        val totalDuration = baseDuration + distanceFactor + zoomFactor
        return Math.min(Math.max(totalDuration, 500), 3000)
    }
    
    fun getCurrentLocation(): Map<String, Double> {
        android.util.Log.d("OSMMapView", "🔍 getCurrentLocation called")
        
        // Check location permissions first
        if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            android.util.Log.e("OSMMapView", "❌ Location permissions not granted")
            throw Exception("Location permission not granted")
        }
        
        try {
            // First, try to use our tracked location if available and recent
            lastKnownLocation?.let { trackedLocation ->
                if (isLocationRecent(trackedLocation)) {
                    android.util.Log.d("OSMMapView", "📍 Returning tracked location: ${trackedLocation.latitude}, ${trackedLocation.longitude}")
                    return mapOf<String, Double>(
                        "latitude" to trackedLocation.latitude,
                        "longitude" to trackedLocation.longitude,
                        "accuracy" to trackedLocation.accuracy.toDouble(),
                        "timestamp" to trackedLocation.time.toDouble()
                    )
                }
            }
            
            // Fallback to system location manager
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            
            // Try GPS first
            val gpsLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            if (gpsLocation != null && isLocationRecent(gpsLocation)) {
                android.util.Log.d("OSMMapView", "📍 Returning system GPS location: ${gpsLocation.latitude}, ${gpsLocation.longitude}")
                return mapOf<String, Double>(
                    "latitude" to gpsLocation.latitude,
                    "longitude" to gpsLocation.longitude,
                    "accuracy" to gpsLocation.accuracy.toDouble(),
                    "timestamp" to gpsLocation.time.toDouble()
                )
            }
            
            // Try Network location if GPS not available
            val networkLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            if (networkLocation != null && isLocationRecent(networkLocation)) {
                android.util.Log.d("OSMMapView", "📍 Returning system network location: ${networkLocation.latitude}, ${networkLocation.longitude}")
                return mapOf<String, Double>(
                    "latitude" to networkLocation.latitude,
                    "longitude" to networkLocation.longitude,
                    "accuracy" to networkLocation.accuracy.toDouble(),
                    "timestamp" to networkLocation.time.toDouble()
                )
            }
            
            // If no recent location available, request a fresh location
            android.util.Log.w("OSMMapView", "⚠️ No recent location available")
            throw Exception("No recent location available. Please start location tracking first and wait for GPS fix.")
            
        } catch (e: SecurityException) {
            android.util.Log.e("OSMMapView", "❌ Security exception getting location: ${e.message}")
            throw Exception("Location access denied: ${e.message}")
        } catch (e: Exception) {
            android.util.Log.e("OSMMapView", "❌ Error getting current location: ${e.message}")
            throw e
        }
    }
    
    // Helper function to check if location is recent (within 5 minutes)
    private fun isLocationRecent(location: Location): Boolean {
        val maxAge = 5 * 60 * 1000 // 5 minutes in milliseconds
        val locationAge = System.currentTimeMillis() - location.time
        return locationAge < maxAge
    }
    
    // Function that waits for fresh location data
    fun waitForLocation(timeoutSeconds: Int): Map<String, Double> {
        android.util.Log.d("OSMMapView", "🔍 waitForLocation called with timeout: ${timeoutSeconds}s")
        
        // Check location permissions first
        if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            android.util.Log.e("OSMMapView", "❌ Location permissions not granted")
            throw Exception("Location permission not granted")
        }
        
        // Start location tracking if not already active
        if (!isLocationTrackingActive) {
            android.util.Log.d("OSMMapView", "📍 Starting location tracking for waitForLocation")
            startLocationTracking()
        }
        
        // Wait for location with timeout
        val startTime = System.currentTimeMillis()
        val timeoutMs = timeoutSeconds * 1000L
        
        while (System.currentTimeMillis() - startTime < timeoutMs) {
            lastKnownLocation?.let { location ->
                val locationAge = System.currentTimeMillis() - location.time
                android.util.Log.d("OSMMapView", "📍 Checking location age: ${locationAge}ms (${locationAge/1000}s)")
                // Consider location fresh if it's less than 5 minutes old (more lenient for emulators)
                if (locationAge < 300000) {
                    android.util.Log.d("OSMMapView", "📍 Got acceptable location: ${location.latitude}, ${location.longitude}")
                    return mapOf<String, Double>(
                        "latitude" to location.latitude,
                        "longitude" to location.longitude,
                        "accuracy" to location.accuracy.toDouble(),
                        "timestamp" to location.time.toDouble()
                    )
                } else {
                    android.util.Log.d("OSMMapView", "📍 Location too old (${locationAge/1000}s), waiting for fresh location...")
                }
            } ?: run {
                android.util.Log.d("OSMMapView", "📍 No location available yet, waiting...")
            }
            
            // Wait 500ms before checking again
            try {
                Thread.sleep(500)
            } catch (e: InterruptedException) {
                android.util.Log.w("OSMMapView", "⚠️ waitForLocation interrupted")
                break
            }
        }
        
        android.util.Log.e("OSMMapView", "❌ Timeout waiting for location")
        throw Exception("Timeout waiting for location. Please ensure location services are enabled and GPS has clear sky view.")
    }
    
    // MARK: - Location Services
    
    fun setShowUserLocation(show: Boolean) {
        showUserLocation = show
        if (show) {
            startLocationTracking()
        } else {
            stopLocationTracking()
        }
    }
    
    fun setFollowUserLocation(follow: Boolean) {
        followUserLocation = follow
        if (follow && !isLocationTrackingActive) {
            startLocationTracking()
        }
    }
    
    fun startLocationTracking() {
        println("OSM SDK Android: Starting location tracking")
        
        // Check location permissions
        if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            println("OSM SDK Android: Location permission not granted")
            return
        }
        
        try {
            if (locationManager == null) {
                locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            }
            
            locationManager?.let { manager ->
                if (manager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    manager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        1000, // 1 second
                        10f,  // 10 meters
                        this
                    )
                    isLocationTrackingActive = true
                    println("OSM SDK Android: GPS location tracking started")
                } else if (manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    manager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        1000, // 1 second
                        10f,  // 10 meters
                        this
                    )
                    isLocationTrackingActive = true
                    println("OSM SDK Android: Network location tracking started")
                } else {
                    println("OSM SDK Android: No location providers enabled")
                }
            }
        } catch (e: SecurityException) {
            println("OSM SDK Android: Security exception when starting location tracking: ${e.message}")
        } catch (e: Exception) {
            println("OSM SDK Android: Exception when starting location tracking: ${e.message}")
        }
    }
    
    fun stopLocationTracking() {
        println("OSM SDK Android: Stopping location tracking")
        try {
            locationManager?.removeUpdates(this)
            isLocationTrackingActive = false
            println("OSM SDK Android: Location tracking stopped")
        } catch (e: Exception) {
            println("OSM SDK Android: Exception when stopping location tracking: ${e.message}")
        }
    }
    
    // MARK: - LocationListener Implementation
    
    override fun onLocationChanged(location: Location) {
        println("OSM SDK Android: Location changed - ${location.latitude}, ${location.longitude}")
        lastKnownLocation = location
        
        // Emit location change event
        onUserLocationChange(mapOf<String, Double>(
            "latitude" to location.latitude,
            "longitude" to location.longitude,
            "accuracy" to location.accuracy.toDouble(),
            "altitude" to location.altitude,
            "speed" to location.speed.toDouble()
        ))
        
        // Follow user location if enabled
        if (followUserLocation) {
            maplibreMap?.let { map ->
                val latLng = LatLng(location.latitude, location.longitude)
                val cameraPosition = CameraPosition.Builder()
                    .target(latLng)
                    .zoom(map.cameraPosition.zoom)
                    .build()
                map.animateCamera(org.maplibre.android.camera.CameraUpdateFactory.newCameraPosition(cameraPosition), 1000)
            }
        }
    }
    
    override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) {
        println("OSM SDK Android: Location provider status changed - Provider: $provider, Status: $status")
    }
    
    override fun onProviderEnabled(provider: String) {
        println("OSM SDK Android: Location provider enabled - $provider")
    }
    
    override fun onProviderDisabled(provider: String) {
        println("OSM SDK Android: Location provider disabled - $provider")
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
    private fun cleanup() {
        println("OSM SDK Android: Cleaning up OSMMapView")
        try {
            // Stop location tracking
            stopLocationTracking()
            
            // Clear markers
            mapMarkers.clear()
            markers.clear()
            
            // Clean up map
            maplibreMap = null
            
            println("OSM SDK Android: Cleanup completed")
        } catch (e: Exception) {
            println("OSM SDK Android: Error during cleanup: ${e.message}")
        }
    }
} 