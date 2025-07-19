package expo.modules.osmsdk

import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.view.MotionEvent
import android.view.GestureDetector
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
import org.maplibre.android.style.sources.GeoJsonSource
import org.maplibre.android.style.layers.RasterLayer
import org.maplibre.android.style.layers.LineLayer
import org.maplibre.android.style.layers.FillLayer
import org.maplibre.android.style.layers.PropertyFactory
import org.maplibre.android.style.layers.Property
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
    
    // Gesture detection
    private lateinit var gestureDetector: GestureDetector
    
    // Event dispatchers
    private val onMapReady by EventDispatcher()
    private val onRegionChange by EventDispatcher()
    private val onMarkerPress by EventDispatcher()
    private val onPress by EventDispatcher()
    private val onLongPress by EventDispatcher()
    private val onUserLocationChange by EventDispatcher()
    
    // Marker data structure
    data class MarkerData(
        val id: String,
        val coordinate: LatLng,
        val title: String?,
        val description: String?,
        val icon: String?
    )
    
    // Enhanced overlay data structures
    data class PolylineData(
        val id: String,
        val coordinates: List<LatLng>,
        val strokeColor: String,
        val strokeWidth: Double,
        val strokeOpacity: Double,
        val strokePattern: String,
        val lineCap: String,
        val lineJoin: String,
        val zIndex: Int,
        val visible: Boolean
    )
    
    data class PolygonData(
        val id: String,
        val coordinates: List<LatLng>,
        val holes: List<List<LatLng>>?,
        val fillColor: String,
        val fillOpacity: Double,
        val strokeColor: String,
        val strokeWidth: Double,
        val strokeOpacity: Double,
        val strokePattern: String,
        val zIndex: Int,
        val visible: Boolean
    )
    
    data class CircleData(
        val id: String,
        val center: LatLng,
        val radius: Double,
        val fillColor: String,
        val fillOpacity: Double,
        val strokeColor: String,
        val strokeWidth: Double,
        val strokeOpacity: Double,
        val strokePattern: String,
        val zIndex: Int,
        val visible: Boolean
    )
    
    // Clustering data structures
    data class MarkerCluster(
        val id: String,
        val center: LatLng,
        val markers: List<MarkerData>,
        val count: Int = markers.size
    )
    
    // Enhanced marker data with clustering support
    data class EnhancedMarkerData(
        val id: String,
        val coordinate: LatLng,
        val title: String?,
        val description: String?,
        val icon: String?,
        val clustered: Boolean = true,
        val visible: Boolean = true
    )
    
    // Clustering configuration
    private var clusteringEnabled = false
    private var clusterRadius = 100.0 // pixels
    private var clusterMaxZoom = 15.0
    private var clusterMinPoints = 2
    
    // Overlay collections
    private var polylines = mutableListOf<PolylineData>()
    private var polygons = mutableListOf<PolygonData>()
    private var circles = mutableListOf<CircleData>()
    
    // Setup the map view
    fun setupMapView() {
        // Initialize MapLibre - API updated for 11.x
        MapLibre.getInstance(context)
        
        // Create map view
        mapView = MapView(context)
        mapView.onCreate(null)
        mapView.getMapAsync(this)
        
        // Setup gesture detection
        setupGestureDetection()
        
        // Add to view hierarchy
        addView(mapView)
        
        // Setup layout params
        val layoutParams = LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.MATCH_PARENT
        )
        mapView.layoutParams = layoutParams
    }
    
    // Setup gesture detection for long press and other gestures
    private fun setupGestureDetection() {
        val gestureListener = object : GestureDetector.SimpleOnGestureListener() {
            override fun onLongPress(e: MotionEvent) {
                maplibreMap?.let { map ->
                    val screenPoint = org.maplibre.android.geometry.PointF(e.x, e.y)
                    val coordinate = map.projection.fromScreenLocation(screenPoint)
                    
                    onLongPress(mapOf(
                        "coordinate" to mapOf(
                            "latitude" to coordinate.latitude,
                            "longitude" to coordinate.longitude
                        )
                    ))
                }
            }
            
            override fun onSingleTapConfirmed(e: MotionEvent): Boolean {
                maplibreMap?.let { map ->
                    val screenPoint = org.maplibre.android.geometry.PointF(e.x, e.y)
                    val coordinate = map.projection.fromScreenLocation(screenPoint)
                    
                    onPress(mapOf(
                        "coordinate" to mapOf(
                            "latitude" to coordinate.latitude,
                            "longitude" to coordinate.longitude
                        )
                    ))
                }
                return true
            }
        }
        
        gestureDetector = GestureDetector(context, gestureListener)
    }
    
    // Handle touch events for gesture detection
    override fun onTouchEvent(event: MotionEvent): Boolean {
        val gestureResult = gestureDetector.onTouchEvent(event)
        return gestureResult || super.onTouchEvent(event)
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
        
        // Add overlays after map is fully ready
        addOverlaysToMap()
        
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
            
            // Map click and long press are handled by gesture detector
            // Keeping this for backwards compatibility with MapLibre events
            map.addOnMapClickListener { point: LatLng ->
                // Let gesture detector handle single taps for consistency
                false
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
        if (clusteringEnabled) {
            performMarkerClustering()
        } else {
            addMarkersToMapDirect()
        }
    }
    
    // MARK: - Overlay Setters
    
    fun setPolylines(polylinesData: List<Map<String, Any>>) {
        // Clear existing polylines
        removeExistingPolylines()
        
        // Parse new polylines
        polylines = polylinesData.mapNotNull { data ->
            val id = data["id"] as? String ?: return@mapNotNull null
            val coordinatesData = data["coordinates"] as? List<Map<String, Double>> ?: return@mapNotNull null
            
            val coordinates = coordinatesData.mapNotNull { coord ->
                val lat = coord["latitude"] ?: return@mapNotNull null
                val lng = coord["longitude"] ?: return@mapNotNull null
                LatLng(lat, lng)
            }
            
            PolylineData(
                id = id,
                coordinates = coordinates,
                strokeColor = data["strokeColor"] as? String ?: "#000000",
                strokeWidth = data["strokeWidth"] as? Double ?: 2.0,
                strokeOpacity = data["strokeOpacity"] as? Double ?: 1.0,
                strokePattern = data["strokePattern"] as? String ?: "solid",
                lineCap = data["lineCap"] as? String ?: "round",
                lineJoin = data["lineJoin"] as? String ?: "round",
                zIndex = data["zIndex"] as? Int ?: 0,
                visible = data["visible"] as? Boolean ?: true
            )
        }.toMutableList()
        
        addPolylinesToMap()
    }
    
    fun setPolygons(polygonsData: List<Map<String, Any>>) {
        // Clear existing polygons
        removeExistingPolygons()
        
        // Parse new polygons
        polygons = polygonsData.mapNotNull { data ->
            val id = data["id"] as? String ?: return@mapNotNull null
            val coordinatesData = data["coordinates"] as? List<Map<String, Double>> ?: return@mapNotNull null
            
            val coordinates = coordinatesData.mapNotNull { coord ->
                val lat = coord["latitude"] ?: return@mapNotNull null
                val lng = coord["longitude"] ?: return@mapNotNull null
                LatLng(lat, lng)
            }
            
            // Parse holes if present
            var holes: List<List<LatLng>>? = null
            if (data["holes"] is List<*>) {
                val holesData = data["holes"] as? List<List<Map<String, Double>>>
                holes = holesData?.map { holeData ->
                    holeData.mapNotNull { coord ->
                        val lat = coord["latitude"] ?: return@mapNotNull null
                        val lng = coord["longitude"] ?: return@mapNotNull null
                        LatLng(lat, lng)
                    }
                }
            }
            
            PolygonData(
                id = id,
                coordinates = coordinates,
                holes = holes,
                fillColor = data["fillColor"] as? String ?: "#000000",
                fillOpacity = data["fillOpacity"] as? Double ?: 0.3,
                strokeColor = data["strokeColor"] as? String ?: "#000000",
                strokeWidth = data["strokeWidth"] as? Double ?: 2.0,
                strokeOpacity = data["strokeOpacity"] as? Double ?: 1.0,
                strokePattern = data["strokePattern"] as? String ?: "solid",
                zIndex = data["zIndex"] as? Int ?: 0,
                visible = data["visible"] as? Boolean ?: true
            )
        }.toMutableList()
        
        addPolygonsToMap()
    }
    
    fun setCircles(circlesData: List<Map<String, Any>>) {
        // Clear existing circles
        removeExistingCircles()
        
        // Parse new circles
        circles = circlesData.mapNotNull { data ->
            val id = data["id"] as? String ?: return@mapNotNull null
            val centerData = data["center"] as? Map<String, Double> ?: return@mapNotNull null
            val lat = centerData["latitude"] ?: return@mapNotNull null
            val lng = centerData["longitude"] ?: return@mapNotNull null
            val radius = data["radius"] as? Double ?: return@mapNotNull null
            
            CircleData(
                id = id,
                center = LatLng(lat, lng),
                radius = radius,
                fillColor = data["fillColor"] as? String ?: "#000000",
                fillOpacity = data["fillOpacity"] as? Double ?: 0.3,
                strokeColor = data["strokeColor"] as? String ?: "#000000",
                strokeWidth = data["strokeWidth"] as? Double ?: 2.0,
                strokeOpacity = data["strokeOpacity"] as? Double ?: 1.0,
                strokePattern = data["strokePattern"] as? String ?: "solid",
                zIndex = data["zIndex"] as? Int ?: 0,
                visible = data["visible"] as? Boolean ?: true
            )
        }.toMutableList()
        
        addCirclesToMap()
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
    
    // Enhanced async location waiting with callback
    fun waitForLocation(timeoutSeconds: Int, callback: (Result<Map<String, Double>>) -> Unit) {
        android.util.Log.d("OSMMapView", "🔍 waitForLocation called with timeout: ${timeoutSeconds}s")
        
        // Check location permissions first
        if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            android.util.Log.e("OSMMapView", "❌ Location permissions not granted")
            val error = Exception("Location permission not granted. Please go to Settings > Apps > [App Name] > Permissions > Location to enable location access.")
            callback(Result.failure(error))
            return
        }
        
        // Check if location services are enabled
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        if (!locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) &&
            !locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
            android.util.Log.e("OSMMapView", "❌ Location services are disabled")
            val error = Exception("Location services are disabled. Please go to Settings > Location to enable GPS or Network location.")
            callback(Result.failure(error))
            return
        }
        
        // Start location tracking if not already active
        if (!isLocationTrackingActive) {
            android.util.Log.d("OSMMapView", "📍 Starting location tracking for waitForLocation")
            startLocationTracking()
        }
        
        // Non-blocking location waiting with handler
        val startTime = System.currentTimeMillis()
        val timeoutMs = timeoutSeconds * 1000L
        val handler = android.os.Handler(android.os.Looper.getMainLooper())
        
        fun checkForLocationAsync() {
            // Check if we've timed out
            if (System.currentTimeMillis() - startTime >= timeoutMs) {
                android.util.Log.e("OSMMapView", "❌ Timeout waiting for location")
                val error = Exception("Timeout waiting for location. Please ensure location services are enabled and GPS has clear sky view.")
                callback(Result.failure(error))
                return
            }
            
            // Check for valid location
            lastKnownLocation?.let { location ->
                val locationAge = System.currentTimeMillis() - location.time
                android.util.Log.d("OSMMapView", "📍 Checking location age: ${locationAge}ms (${locationAge/1000}s), accuracy: ${location.accuracy}m")
                
                // Enhanced validation: check age and accuracy
                if (isLocationRecent(location) && isLocationAccurate(location)) {
                    android.util.Log.d("OSMMapView", "📍 Got acceptable location: ${location.latitude}, ${location.longitude}")
                    val result = mapOf<String, Double>(
                        "latitude" to location.latitude,
                        "longitude" to location.longitude,
                        "accuracy" to location.accuracy.toDouble(),
                        "timestamp" to location.time.toDouble()
                    )
                    callback(Result.success(result))
                    return
                }
            }
            
            // Schedule next check after 500ms (non-blocking)
            handler.postDelayed({ checkForLocationAsync() }, 500)
        }
        
        // Start the async checking
        checkForLocationAsync()
    }
    
    // Synchronous wrapper for compatibility (delegates to async version)
    fun waitForLocation(timeoutSeconds: Int): Map<String, Double> {
        val countDownLatch = java.util.concurrent.CountDownLatch(1)
        var result: Map<String, Double>? = null
        var error: Exception? = null
        
        waitForLocation(timeoutSeconds) { asyncResult ->
            asyncResult.fold(
                onSuccess = { location -> result = location },
                onFailure = { err -> error = err as? Exception ?: Exception(err.message) }
            )
            countDownLatch.countDown()
        }
        
        countDownLatch.await()
        
        error?.let { throw it }
        return result ?: emptyMap()
    }
    
    // Enhanced location accuracy validation
    private fun isLocationAccurate(location: Location): Boolean {
        // Reject invalid accuracy values
        if (location.accuracy <= 0) {
            return false
        }
        
        // Accept locations with accuracy better than 100 meters
        return location.accuracy <= 100.0f
    }
    
    // Enhanced location recency check  
    private fun isLocationRecent(location: Location): Boolean {
        val locationAge = System.currentTimeMillis() - location.time
        // Consider location fresh if it's less than 5 minutes old
        return locationAge < 300000 // 5 minutes in milliseconds
    }
    
    // MARK: - Location Caching & Background Support
    
    // Cache recent locations for improved performance
    private val locationCache = mutableListOf<Location>()
    private val maxCacheSize = 10
    private val cacheExpiryTime = 1800000L // 30 minutes in milliseconds
    
    // Memory optimization - object pool for location reuse
    private val locationObjectPool = mutableListOf<Location>()
    private val maxPoolSize = 5
    
    // Battery optimization settings
    private var updateFrequency = 5000L // 5 seconds default
    private var isUserMoving = false
    private var lastMovementCheck = System.currentTimeMillis()
    private val movementThreshold = 10.0f // 10 meters
    
    private fun addLocationToCache(location: Location) {
        // Remove expired locations and optimize memory
        cleanupExpiredLocations()
        
        // Add new location
        locationCache.add(location)
        
        // Maintain cache size and optimize memory usage
        if (locationCache.size > maxCacheSize) {
            val removedLocation = locationCache.removeAt(0)
            // Add to object pool for reuse if pool not full
            if (locationObjectPool.size < maxPoolSize) {
                locationObjectPool.add(removedLocation)
            }
        }
        
        android.util.Log.d("OSMMapView", "📦 Location cached. Cache size: ${locationCache.size}, Pool size: ${locationObjectPool.size}")
    }
    
    private fun cleanupExpiredLocations() {
        val now = System.currentTimeMillis()
        val expiredLocations = locationCache.filter { cachedLocation ->
            now - cachedLocation.time > cacheExpiryTime
        }
        
        // Move expired locations to pool for potential reuse
        expiredLocations.forEach { expiredLocation ->
            if (locationObjectPool.size < maxPoolSize) {
                locationObjectPool.add(expiredLocation)
            }
        }
        
        // Remove expired locations from cache
        locationCache.removeAll { cachedLocation ->
            now - cachedLocation.time > cacheExpiryTime
        }
    }
    
    private fun optimizeUpdateFrequency(location: Location) {
        val now = System.currentTimeMillis()
        
        // Check if user is moving
        if (locationCache.isNotEmpty()) {
            val lastLocation = locationCache.last()
            val distance = location.distanceTo(lastLocation)
            val timeDiff = now - lastMovementCheck
            
            if (distance > movementThreshold) {
                isUserMoving = true
                updateFrequency = 5000L // 5 seconds when moving
            } else if (timeDiff > 60000L) { // Check every minute when stationary
                isUserMoving = false
                updateFrequency = 30000L // 30 seconds when stationary
                lastMovementCheck = now
            }
        }
        
        android.util.Log.d("OSMMapView", "🔋 Battery optimization: Update frequency: ${updateFrequency}ms, Moving: $isUserMoving")
    }
    
    private fun getBestCachedLocation(): Location? {
        // Filter recent and accurate locations
        val validLocations = locationCache.filter { location ->
            isLocationRecent(location) && isLocationAccurate(location)
        }
        
        // Return the most recent valid location
        return validLocations.maxByOrNull { it.time }
    }
    
    // Enhanced location listener that supports caching and optimization
    private val enhancedLocationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            android.util.Log.d("OSMMapView", "📍 New location received: ${location.latitude}, ${location.longitude}, accuracy: ${location.accuracy}m")
            
            // Update last known location
            lastKnownLocation = location
            
            // Add to cache if it's accurate enough
            if (isLocationAccurate(location)) {
                addLocationToCache(location)
                
                // Optimize update frequency based on movement
                optimizeUpdateFrequency(location)
                
                // Adjust location manager settings for battery optimization
                adjustLocationManagerSettings()
            }
            
            // Notify React Native about the location update
            onLocationChange?.let { callback ->
                callback(mapOf(
                    "latitude" to location.latitude,
                    "longitude" to location.longitude,
                    "accuracy" to location.accuracy.toDouble(),
                    "timestamp" to location.time.toDouble()
                ))
            }
        }
        
        override fun onProviderEnabled(provider: String) {
            android.util.Log.d("OSMMapView", "📡 Location provider enabled: $provider")
        }
        
        override fun onProviderDisabled(provider: String) {
            android.util.Log.w("OSMMapView", "⚠️ Location provider disabled: $provider")
        }
        
        override fun onStatusChanged(provider: String, status: Int, extras: Bundle?) {
            android.util.Log.d("OSMMapView", "📡 Provider $provider status changed: $status")
        }
    }
    
    private fun adjustLocationManagerSettings() {
        try {
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            
            // Remove existing listeners before adjusting settings
            locationManager.removeUpdates(enhancedLocationListener)
            
            // Check permissions
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                
                // Adjust settings based on movement state
                val minTime = if (isUserMoving) 5000L else 30000L // 5s when moving, 30s when stationary
                val minDistance = if (isUserMoving) 5.0f else 20.0f // 5m when moving, 20m when stationary
                
                // Request updates with optimized settings
                if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        minTime,
                        minDistance,
                        enhancedLocationListener
                    )
                }
                
                if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        minTime * 2, // Less frequent for network provider
                        minDistance * 2,
                        enhancedLocationListener
                    )
                }
                
                android.util.Log.d("OSMMapView", "🔧 Location manager settings adjusted - Min time: ${minTime}ms, Min distance: ${minDistance}m")
            }
        } catch (e: Exception) {
            android.util.Log.e("OSMMapView", "❌ Failed to adjust location manager settings: $e")
        }
    }
    
    // Background location support using Service
    private fun requestBackgroundLocationUpdates() {
        try {
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            
            // Check permissions
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                
                // Request updates with background support
                if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        5000L, // 5 seconds
                        10.0f, // 10 meters
                        enhancedLocationListener
                    )
                }
                
                if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        10000L, // 10 seconds
                        50.0f, // 50 meters
                        enhancedLocationListener
                    )
                }
                
                android.util.Log.d("OSMMapView", "✅ Background location updates requested")
            }
        } catch (e: Exception) {
            android.util.Log.e("OSMMapView", "❌ Failed to request background location updates: $e")
        }
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
    
    // MARK: - Camera Controls (Pitch & Bearing)
    
    fun setPitch(pitch: Double) {
        android.util.Log.d("OSMMapView", "🔍 setPitch called with pitch: $pitch")
        
        if (!isMapReady()) {
            android.util.Log.e("OSMMapView", "❌ Cannot set pitch - map not ready. maplibreMap: $maplibreMap, style: ${maplibreMap?.style}, loaded: ${maplibreMap?.style?.isFullyLoaded}")
            throw Exception("Map not ready - style not loaded")
        }
        
        maplibreMap?.let { map ->
            try {
                val clampedPitch = pitch.coerceIn(0.0, 60.0) // MapLibre supports 0-60 degrees
                android.util.Log.d("OSMMapView", "📍 Setting pitch to $clampedPitch degrees (requested: $pitch)")
                
                val currentPosition = map.cameraPosition
                val cameraPosition = CameraPosition.Builder()
                    .target(currentPosition.target)
                    .zoom(currentPosition.zoom)
                    .bearing(currentPosition.bearing)
                    .tilt(clampedPitch)
                    .build()
                
                map.animateCamera(
                    org.maplibre.android.camera.CameraUpdateFactory.newCameraPosition(cameraPosition),
                    500
                )
                android.util.Log.d("OSMMapView", "✅ setPitch completed successfully")
            } catch (e: Exception) {
                android.util.Log.e("OSMMapView", "❌ setPitch failed: ${e.message}", e)
                throw Exception("Set pitch failed: ${e.message}")
            }
        }
    }
    
    fun setBearing(bearing: Double) {
        android.util.Log.d("OSMMapView", "🔍 setBearing called with bearing: $bearing")
        
        if (!isMapReady()) {
            android.util.Log.e("OSMMapView", "❌ Cannot set bearing - map not ready. maplibreMap: $maplibreMap, style: ${maplibreMap?.style}, loaded: ${maplibreMap?.style?.isFullyLoaded}")
            throw Exception("Map not ready - style not loaded")
        }
        
        maplibreMap?.let { map ->
            try {
                val normalizedBearing = bearing % 360.0 // Normalize to 0-360
                val adjustedBearing = if (normalizedBearing < 0) normalizedBearing + 360.0 else normalizedBearing
                android.util.Log.d("OSMMapView", "📍 Setting bearing to $adjustedBearing degrees (requested: $bearing)")
                
                val currentPosition = map.cameraPosition
                val cameraPosition = CameraPosition.Builder()
                    .target(currentPosition.target)
                    .zoom(currentPosition.zoom)
                    .bearing(adjustedBearing)
                    .tilt(currentPosition.tilt)
                    .build()
                
                map.animateCamera(
                    org.maplibre.android.camera.CameraUpdateFactory.newCameraPosition(cameraPosition),
                    500
                )
                android.util.Log.d("OSMMapView", "✅ setBearing completed successfully")
            } catch (e: Exception) {
                android.util.Log.e("OSMMapView", "❌ setBearing failed: ${e.message}", e)
                throw Exception("Set bearing failed: ${e.message}")
            }
        }
    }
    
    fun getPitch(): Double {
        android.util.Log.d("OSMMapView", "🔍 getPitch called")
        
        if (!isMapReady()) {
            android.util.Log.e("OSMMapView", "❌ Cannot get pitch - map not ready. maplibreMap: $maplibreMap, style: ${maplibreMap?.style}, loaded: ${maplibreMap?.style?.isFullyLoaded}")
            throw Exception("Map not ready - style not loaded")
        }
        
        maplibreMap?.let { map ->
            val currentPitch = map.cameraPosition.tilt
            android.util.Log.d("OSMMapView", "📍 Current pitch: $currentPitch degrees")
            return currentPitch
        } ?: run {
            android.util.Log.e("OSMMapView", "❌ Cannot get pitch - maplibreMap is null")
            throw Exception("Map not available")
        }
    }
    
    fun getBearing(): Double {
        android.util.Log.d("OSMMapView", "🔍 getBearing called")
        
        if (!isMapReady()) {
            android.util.Log.e("OSMMapView", "❌ Cannot get bearing - map not ready. maplibreMap: $maplibreMap, style: ${maplibreMap?.style}, loaded: ${maplibreMap?.style?.isFullyLoaded}")
            throw Exception("Map not ready - style not loaded")
        }
        
        maplibreMap?.let { map ->
            val currentBearing = map.cameraPosition.bearing
            android.util.Log.d("OSMMapView", "📍 Current bearing: $currentBearing degrees")
            return currentBearing
        } ?: run {
            android.util.Log.e("OSMMapView", "❌ Cannot get bearing - maplibreMap is null")
            throw Exception("Map not available")
        }
    }
    
    // MARK: - Overlay Implementation Methods
    
    private fun addPolylinesToMap() {
        maplibreMap?.style?.let { style ->
            polylines.forEach { polyline ->
                if (!polyline.visible || polyline.coordinates.size < 2) return@forEach
                
                try {
                    // Create LineString feature
                    val coordinates = polyline.coordinates.map { arrayOf(it.longitude, it.latitude) }.toTypedArray()
                    val lineStringGeometry = org.maplibre.geojson.LineString.fromLngLats(
                        polyline.coordinates.map { org.maplibre.geojson.Point.fromLngLat(it.longitude, it.latitude) }
                    )
                    val feature = org.maplibre.geojson.Feature.fromGeometry(lineStringGeometry)
                    feature.addStringProperty("id", polyline.id)
                    
                    // Create source
                    val sourceId = "polyline-source-${polyline.id}"
                    val source = org.maplibre.android.style.sources.GeoJsonSource(sourceId, feature)
                    style.addSource(source)
                    
                    // Create line layer
                    val layerId = "polyline-layer-${polyline.id}"
                    val lineLayer = org.maplibre.android.style.layers.LineLayer(layerId, sourceId)
                    
                    // Configure line properties
                    lineLayer.setProperties(
                        org.maplibre.android.style.layers.PropertyFactory.lineColor(android.graphics.Color.parseColor(polyline.strokeColor)),
                        org.maplibre.android.style.layers.PropertyFactory.lineWidth(polyline.strokeWidth.toFloat()),
                        org.maplibre.android.style.layers.PropertyFactory.lineOpacity(polyline.strokeOpacity.toFloat())
                    )
                    
                    // Add line cap and join
                    when (polyline.lineCap.lowercase()) {
                        "round" -> lineLayer.setProperties(org.maplibre.android.style.layers.PropertyFactory.lineCap(org.maplibre.android.style.layers.Property.LINE_CAP_ROUND))
                        "square" -> lineLayer.setProperties(org.maplibre.android.style.layers.PropertyFactory.lineCap(org.maplibre.android.style.layers.Property.LINE_CAP_SQUARE))
                        else -> lineLayer.setProperties(org.maplibre.android.style.layers.PropertyFactory.lineCap(org.maplibre.android.style.layers.Property.LINE_CAP_BUTT))
                    }
                    
                    when (polyline.lineJoin.lowercase()) {
                        "round" -> lineLayer.setProperties(org.maplibre.android.style.layers.PropertyFactory.lineJoin(org.maplibre.android.style.layers.Property.LINE_JOIN_ROUND))
                        "bevel" -> lineLayer.setProperties(org.maplibre.android.style.layers.PropertyFactory.lineJoin(org.maplibre.android.style.layers.Property.LINE_JOIN_BEVEL))
                        else -> lineLayer.setProperties(org.maplibre.android.style.layers.PropertyFactory.lineJoin(org.maplibre.android.style.layers.Property.LINE_JOIN_MITER))
                    }
                    
                    style.addLayer(lineLayer)
                    
                } catch (e: Exception) {
                    android.util.Log.e("OSMMapView", "Error adding polyline ${polyline.id}: ${e.message}")
                }
            }
        }
    }
    
    private fun addPolygonsToMap() {
        maplibreMap?.style?.let { style ->
            polygons.forEach { polygon ->
                if (!polygon.visible || polygon.coordinates.size < 3) return@forEach
                
                try {
                    // Create polygon geometry
                    val exteriorCoordinates = polygon.coordinates.map { 
                        org.maplibre.geojson.Point.fromLngLat(it.longitude, it.latitude) 
                    }
                    
                    // Handle holes
                    val holes = polygon.holes?.map { hole ->
                        hole.map { org.maplibre.geojson.Point.fromLngLat(it.longitude, it.latitude) }
                    } ?: emptyList()
                    
                    val polygonGeometry = if (holes.isEmpty()) {
                        org.maplibre.geojson.Polygon.fromLngLats(listOf(exteriorCoordinates))
                    } else {
                        org.maplibre.geojson.Polygon.fromLngLats(listOf(exteriorCoordinates) + holes)
                    }
                    
                    val feature = org.maplibre.geojson.Feature.fromGeometry(polygonGeometry)
                    feature.addStringProperty("id", polygon.id)
                    
                    // Create source
                    val sourceId = "polygon-source-${polygon.id}"
                    val source = org.maplibre.android.style.sources.GeoJsonSource(sourceId, feature)
                    style.addSource(source)
                    
                    // Create fill layer
                    val fillLayerId = "polygon-fill-${polygon.id}"
                    val fillLayer = org.maplibre.android.style.layers.FillLayer(fillLayerId, sourceId)
                    fillLayer.setProperties(
                        org.maplibre.android.style.layers.PropertyFactory.fillColor(android.graphics.Color.parseColor(polygon.fillColor)),
                        org.maplibre.android.style.layers.PropertyFactory.fillOpacity(polygon.fillOpacity.toFloat())
                    )
                    style.addLayer(fillLayer)
                    
                    // Create stroke layer
                    val strokeLayerId = "polygon-stroke-${polygon.id}"
                    val strokeLayer = org.maplibre.android.style.layers.LineLayer(strokeLayerId, sourceId)
                    strokeLayer.setProperties(
                        org.maplibre.android.style.layers.PropertyFactory.lineColor(android.graphics.Color.parseColor(polygon.strokeColor)),
                        org.maplibre.android.style.layers.PropertyFactory.lineWidth(polygon.strokeWidth.toFloat()),
                        org.maplibre.android.style.layers.PropertyFactory.lineOpacity(polygon.strokeOpacity.toFloat())
                    )
                    style.addLayer(strokeLayer)
                    
                } catch (e: Exception) {
                    android.util.Log.e("OSMMapView", "Error adding polygon ${polygon.id}: ${e.message}")
                }
            }
        }
    }
    
    private fun addCirclesToMap() {
        maplibreMap?.style?.let { style ->
            circles.forEach { circle ->
                if (!circle.visible) return@forEach
                
                try {
                    // Create circle as polygon approximation
                    val circlePolygon = createCirclePolygon(circle.center, circle.radius)
                    val feature = org.maplibre.geojson.Feature.fromGeometry(circlePolygon)
                    feature.addStringProperty("id", circle.id)
                    
                    // Create source
                    val sourceId = "circle-source-${circle.id}"
                    val source = org.maplibre.android.style.sources.GeoJsonSource(sourceId, feature)
                    style.addSource(source)
                    
                    // Create fill layer
                    val fillLayerId = "circle-fill-${circle.id}"
                    val fillLayer = org.maplibre.android.style.layers.FillLayer(fillLayerId, sourceId)
                    fillLayer.setProperties(
                        org.maplibre.android.style.layers.PropertyFactory.fillColor(android.graphics.Color.parseColor(circle.fillColor)),
                        org.maplibre.android.style.layers.PropertyFactory.fillOpacity(circle.fillOpacity.toFloat())
                    )
                    style.addLayer(fillLayer)
                    
                    // Create stroke layer
                    val strokeLayerId = "circle-stroke-${circle.id}"
                    val strokeLayer = org.maplibre.android.style.layers.LineLayer(strokeLayerId, sourceId)
                    strokeLayer.setProperties(
                        org.maplibre.android.style.layers.PropertyFactory.lineColor(android.graphics.Color.parseColor(circle.strokeColor)),
                        org.maplibre.android.style.layers.PropertyFactory.lineWidth(circle.strokeWidth.toFloat()),
                        org.maplibre.android.style.layers.PropertyFactory.lineOpacity(circle.strokeOpacity.toFloat())
                    )
                    style.addLayer(strokeLayer)
                    
                } catch (e: Exception) {
                    android.util.Log.e("OSMMapView", "Error adding circle ${circle.id}: ${e.message}")
                }
            }
        }
    }
    
    // Helper method to create circle polygon
    private fun createCirclePolygon(center: LatLng, radiusMeters: Double): org.maplibre.geojson.Polygon {
        val numberOfSides = 64
        val coordinates = mutableListOf<org.maplibre.geojson.Point>()
        
        // Convert radius from meters to degrees (approximate)
        val radiusLat = radiusMeters / 111320.0
        val radiusLng = radiusMeters / (111320.0 * kotlin.math.cos(kotlin.math.PI * center.latitude / 180.0))
        
        for (i in 0..numberOfSides) {
            val angle = 2.0 * kotlin.math.PI * i / numberOfSides
            val lat = center.latitude + radiusLat * kotlin.math.cos(angle)
            val lng = center.longitude + radiusLng * kotlin.math.sin(angle)
            coordinates.add(org.maplibre.geojson.Point.fromLngLat(lng, lat))
        }
        
        return org.maplibre.geojson.Polygon.fromLngLats(listOf(coordinates))
    }
    
    // Removal methods for overlays
    private fun removeExistingPolylines() {
        maplibreMap?.style?.let { style ->
            polylines.forEach { polyline ->
                try {
                    style.removeLayer("polyline-layer-${polyline.id}")
                    style.removeSource("polyline-source-${polyline.id}")
                } catch (e: Exception) {
                    // Layer or source may not exist, ignore
                }
            }
        }
    }
    
    private fun removeExistingPolygons() {
        maplibreMap?.style?.let { style ->
            polygons.forEach { polygon ->
                try {
                    style.removeLayer("polygon-fill-${polygon.id}")
                    style.removeLayer("polygon-stroke-${polygon.id}")
                    style.removeSource("polygon-source-${polygon.id}")
                } catch (e: Exception) {
                    // Layer or source may not exist, ignore
                }
            }
        }
    }
    
    private fun removeExistingCircles() {
        maplibreMap?.style?.let { style ->
            circles.forEach { circle ->
                try {
                    style.removeLayer("circle-fill-${circle.id}")
                    style.removeLayer("circle-stroke-${circle.id}")
                    style.removeSource("circle-source-${circle.id}")
                } catch (e: Exception) {
                    // Layer or source may not exist, ignore
                }
            }
        }
    }
    
    // Helper function to validate coordinates
    private fun isValidCoordinate(latitude: Double, longitude: Double): Boolean {
        return latitude >= -90.0 && latitude <= 90.0 && longitude >= -180.0 && longitude <= 180.0
    }
    
    // Helper function to check if location is recent (within 5 minutes)
    private fun isLocationRecent(location: Location): Boolean {
        val currentTime = System.currentTimeMillis()
        val locationTime = location.time
        val timeDiff = currentTime - locationTime
        return timeDiff < 300000 // 5 minutes
    }
    
    // Calculate animation duration based on distance and zoom change
    private fun calculateAnimationDuration(
        fromLat: Double, fromLng: Double,
        toLat: Double, toLng: Double,
        fromZoom: Double, toZoom: Double
    ): Int {
        // Calculate geographic distance
        val results = FloatArray(1)
        android.location.Location.distanceBetween(fromLat, fromLng, toLat, toLng, results)
        val distance = results[0]
        
        // Calculate zoom change
        val zoomChange = kotlin.math.abs(toZoom - fromZoom)
        
        // Base duration + distance factor + zoom factor
        val baseDuration = 500
        val distanceFactor = (distance / 10000).coerceAtMost(1000.0) // Max 1 second for distance
        val zoomFactor = zoomChange * 100 // 100ms per zoom level
        
        return (baseDuration + distanceFactor + zoomFactor).toInt().coerceIn(300, 3000)
    }
    
    // Add overlays to map when style is loaded
    private fun addOverlaysToMap() {
        addPolylinesToMap()
        addPolygonsToMap() 
        addCirclesToMap()
    }
    
    // MARK: - Enhanced Marker Clustering
    
    fun setClustering(clusteringData: Map<String, Any>) {
        clusteringEnabled = clusteringData["enabled"] as? Boolean ?: false
        clusterRadius = clusteringData["radius"] as? Double ?: 100.0
        clusterMaxZoom = clusteringData["maxZoom"] as? Double ?: 15.0
        clusterMinPoints = clusteringData["minPoints"] as? Int ?: 2
        
        // Re-add markers with new clustering settings
        addMarkersToMap()
    }
    
    private fun performMarkerClustering() {
        if (!clusteringEnabled) {
            addMarkersToMapDirect()
            return
        }
        
        // Clear existing markers
        mapMarkers.forEach { marker ->
            maplibreMap?.removeMarker(marker)
        }
        mapMarkers.clear()
        
        // Get current zoom level
        val currentZoom = maplibreMap?.cameraPosition?.zoom ?: initialZoom
        
        // Don't cluster at high zoom levels
        if (currentZoom > clusterMaxZoom) {
            addMarkersToMapDirect()
            return
        }
        
        // Create enhanced marker data from regular markers
        val enhancedMarkers = markers.map { marker ->
            EnhancedMarkerData(
                id = marker.id,
                coordinate = marker.coordinate,
                title = marker.title,
                description = marker.description,
                icon = marker.icon,
                clustered = true,
                visible = true
            )
        }
        
        // Group markers into clusters
        val clusters = createClusters(enhancedMarkers, clusterRadius, clusterMinPoints)
        
        // Add clusters to map
        maplibreMap?.let { map ->
            clusters.forEach { cluster ->
                if (cluster.count == 1) {
                    // Single marker
                    val marker = cluster.markers[0]
                    val markerOptions = MarkerOptions()
                        .position(marker.coordinate)
                        .title(marker.title)
                        .snippet(marker.description)
                    
                    val mapMarker = map.addMarker(markerOptions)
                    mapMarker?.let { mapMarkers.add(it) }
                } else {
                    // Cluster marker
                    val markerOptions = MarkerOptions()
                        .position(cluster.center)
                        .title("${cluster.count} markers")
                        .snippet("Tap to expand cluster")
                    
                    val mapMarker = map.addMarker(markerOptions)
                    mapMarker?.let { 
                        // Store cluster info in marker somehow (could use a custom marker class)
                        mapMarkers.add(it) 
                    }
                }
            }
        }
    }
    
    private fun addMarkersToMapDirect() {
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
    
    private fun createClusters(markers: List<EnhancedMarkerData>, radiusPixels: Double, minPoints: Int): List<MarkerCluster> {
        val clusters = mutableListOf<MarkerCluster>()
        val processedMarkers = mutableSetOf<String>()
        
        // Convert pixel radius to geographic distance (approximate)
        val projection = maplibreMap?.projection
        val centerPoint = projection?.toScreenLocation(maplibreMap?.cameraPosition?.target ?: LatLng(0.0, 0.0))
        val radiusGeo = if (centerPoint != null && projection != null) {
            val point1 = android.graphics.PointF(centerPoint.x, centerPoint.y)
            val point2 = android.graphics.PointF(centerPoint.x + radiusPixels.toFloat(), centerPoint.y)
            val coord1 = projection.fromScreenLocation(point1)
            val coord2 = projection.fromScreenLocation(point2)
            
            val results = FloatArray(1)
            android.location.Location.distanceBetween(
                coord1.latitude, coord1.longitude,
                coord2.latitude, coord2.longitude,
                results
            )
            results[0].toDouble()
        } else {
            1000.0 // Default 1km radius
        }
        
        for (marker in markers) {
            if (processedMarkers.contains(marker.id) || !marker.clustered) {
                continue
            }
            
            // Find nearby markers within radius
            val clusterMarkers = mutableListOf<MarkerData>()
            clusterMarkers.add(MarkerData(marker.id, marker.coordinate, marker.title, marker.description, marker.icon))
            processedMarkers.add(marker.id)
            
            for (otherMarker in markers) {
                if (processedMarkers.contains(otherMarker.id) || !otherMarker.clustered) {
                    continue
                }
                
                val results = FloatArray(1)
                android.location.Location.distanceBetween(
                    marker.coordinate.latitude, marker.coordinate.longitude,
                    otherMarker.coordinate.latitude, otherMarker.coordinate.longitude,
                    results
                )
                
                if (results[0] <= radiusGeo) {
                    clusterMarkers.add(MarkerData(otherMarker.id, otherMarker.coordinate, otherMarker.title, otherMarker.description, otherMarker.icon))
                    processedMarkers.add(otherMarker.id)
                }
            }
            
            // Create cluster
            val cluster = MarkerCluster(
                id = java.util.UUID.randomUUID().toString(),
                center = calculateClusterCenter(clusterMarkers),
                markers = clusterMarkers
            )
            clusters.add(cluster)
        }
        
        // Add individual unclustered markers
        for (marker in markers) {
            if (!processedMarkers.contains(marker.id)) {
                val cluster = MarkerCluster(
                    id = marker.id,
                    center = marker.coordinate,
                    markers = listOf(MarkerData(marker.id, marker.coordinate, marker.title, marker.description, marker.icon))
                )
                clusters.add(cluster)
            }
        }
        
        return clusters
    }
    
    private fun calculateClusterCenter(markers: List<MarkerData>): LatLng {
        val totalLat = markers.sumOf { it.coordinate.latitude }
        val totalLng = markers.sumOf { it.coordinate.longitude }
        
        return LatLng(
            totalLat / markers.size,
            totalLng / markers.size
        )
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