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
import org.maplibre.android.annotations.IconFactory
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.kotlin.AppContext
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.widget.FrameLayout
import kotlinx.coroutines.*
import java.net.URL
import org.maplibre.android.location.LocationComponent
import org.maplibre.android.location.LocationComponentActivationOptions
import org.maplibre.android.location.LocationComponentOptions
import org.maplibre.android.location.modes.CameraMode
import org.maplibre.android.location.modes.RenderMode

// Native Android map view using MapLibre GL Native
class OSMMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext), OnMapReadyCallback, LocationListener {
    
    // Module reference for callbacks
    private var moduleReference: ExpoOsmSdkModule? = null
    
    init {
        android.util.Log.d("OSMMapView", "🏗️ OSMMapView constructor called!")
        android.util.Log.d("OSMMapView", "📍 Context: $context, AppContext: $appContext")
        
        // Initialize the map view immediately
        try {
            setupMapView()
            android.util.Log.d("OSMMapView", "✅ OSMMapView initialized successfully")
        } catch (e: Exception) {
            android.util.Log.e("OSMMapView", "❌ Failed to initialize OSMMapView: ${e.message}", e)
        }
    }
    
    // Set module reference for callbacks
    fun setModuleReference(module: ExpoOsmSdkModule) {
        android.util.Log.d("OSMMapView", "📞 setModuleReference called with: $module")
        this.moduleReference = module
        android.util.Log.d("OSMMapView", "✅ Module reference set successfully")
    }
    
    // MapLibre map view
    private lateinit var mapView: MapView
    private var maplibreMap: MapLibreMap? = null
    
    // Saved instance state for map restoration
    private var savedInstanceState: android.os.Bundle? = null
    
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
    private var circles = mutableListOf<CircleData>()
    private var mapCircles = mutableListOf<org.maplibre.android.annotations.Polygon>()
    private var polylines = mutableListOf<PolylineData>()
    private var mapPolylines = mutableListOf<org.maplibre.android.annotations.Polyline>()
    private var polygons = mutableListOf<PolygonData>()
    private var mapPolygons = mutableListOf<org.maplibre.android.annotations.Polygon>()
    
    // Location configuration
    private var showUserLocation = false
    private var followUserLocation = false
    private var locationComponent: LocationComponent? = null
    private var userLocationTintColor = "#9C1AFF" // expo-osm-sdk signature purple
    private var userLocationAccuracyFillColor = "rgba(156, 26, 255, 0.2)" // Semi-transparent purple
    private var userLocationAccuracyBorderColor = "#9C1AFF" // Solid purple
    
    // Route data storage
    private var currentRoutePolylines = mutableListOf<org.maplibre.android.annotations.Polyline>()
    
    // Icon loading support
    private val iconCache = mutableMapOf<String, Bitmap>()
    private val coroutineScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    
    // Event dispatchers
    private val onMapReady by EventDispatcher()
    private val onRegionChange by EventDispatcher()
    private val onMarkerPress by EventDispatcher()
    private val onPress by EventDispatcher()
    private val onLongPress by EventDispatcher()
    private val onUserLocationChange by EventDispatcher()
    private val onRouteCalculated by EventDispatcher()
    
    // Marker icon data structure
    data class MarkerIconData(
        val uri: String?,
        val name: String?,
        val size: Double,
        val color: String?,
        val anchorX: Double,
        val anchorY: Double
    )
    
    // Marker data structure
    data class MarkerData(
        val id: String,
        val coordinate: LatLng,
        val title: String?,
        val description: String?,
        val icon: MarkerIconData?
    )
    
    // Circle data structure
    data class CircleData(
        val id: String,
        val center: LatLng,
        val radius: Double, // Radius in meters
        val fillColor: String,
        val fillOpacity: Double,
        val strokeColor: String,
        val strokeWidth: Double,
        val strokeOpacity: Double,
        val strokePattern: String,
        val zIndex: Int,
        val visible: Boolean
    )
    
    // Polyline data structure
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
    
    // Polygon data structure
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
    
    // Setup the map view
    fun setupMapView() {
        // Initialize MapLibre - API updated for 11.x
        MapLibre.getInstance(context)
        
        // Create map view
        mapView = MapView(context)
        // Use saved instance state for proper state restoration
        mapView.onCreate(savedInstanceState)
        mapView.getMapAsync(this)
        
        // Add to view hierarchy
        addView(mapView)
        
        // Setup layout params
        val layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
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
            
            // Parse icon data properly
            val iconData: MarkerIconData? = (data["icon"] as? Map<String, Any>)?.let { iconMap ->
                MarkerIconData(
                    uri = iconMap["uri"] as? String,
                    name = iconMap["name"] as? String,
                    size = (iconMap["size"] as? Number)?.toDouble() ?: 30.0,
                    color = iconMap["color"] as? String,
                    anchorX = ((iconMap["anchor"] as? Map<String, Any>)?.get("x") as? Number)?.toDouble() ?: 0.5,
                    anchorY = ((iconMap["anchor"] as? Map<String, Any>)?.get("y") as? Number)?.toDouble() ?: 1.0
                )
            }
            
            MarkerData(
                id = id,
                coordinate = LatLng(lat, lng),
                title = data["title"] as? String,
                description = data["description"] as? String,
                icon = iconData
            )
        }.toMutableList()
        
        // Add markers to map
        addMarkersToMap()
    }
    
    // Add markers to map with custom icon support
    private fun addMarkersToMap() {
        maplibreMap?.let { map ->
            markers.forEach { marker ->
                coroutineScope.launch {
                    val markerOptions = MarkerOptions()
                        .position(marker.coordinate)
                        .title(marker.title)
                        .snippet(marker.description)
                    
                    // Load and apply custom icon if provided
                    marker.icon?.uri?.let { uri ->
                        try {
                            val bitmap = loadIconFromUri(uri)
                            if (bitmap != null) {
                                val iconFactory = IconFactory.getInstance(context)
                                val scaledBitmap = Bitmap.createScaledBitmap(
                                    bitmap,
                                    marker.icon!!.size.toInt(),
                                    marker.icon!!.size.toInt(),
                                    true
                                )
                                val icon = iconFactory.fromBitmap(scaledBitmap)
                                markerOptions.icon(icon)
                                
                                android.util.Log.d("OSMMapView", "✅ Custom icon applied for marker ${marker.id} from $uri")
                            } else {
                                android.util.Log.w("OSMMapView", "⚠️ Failed to load icon from $uri, using default")
                            }
                        } catch (e: Exception) {
                            android.util.Log.e("OSMMapView", "❌ Error loading icon: ${e.message}")
                        }
                    }
                    
                    // Add marker to map on main thread
                    withContext(Dispatchers.Main) {
                        val mapMarker = map.addMarker(markerOptions)
                        mapMarker?.let { mapMarkers.add(it) }
                    }
                }
            }
        }
    }
    
    // Load icon from URI with caching
    private suspend fun loadIconFromUri(uri: String): Bitmap? = withContext(Dispatchers.IO) {
        try {
            // Check cache first
            iconCache[uri]?.let { 
                android.util.Log.d("OSMMapView", "📦 Using cached icon for $uri")
                return@withContext it 
            }
            
            android.util.Log.d("OSMMapView", "⬇️ Downloading icon from $uri")
            
            // Download image
            val url = URL(uri)
            val connection = url.openConnection()
            connection.connect()
            val input = connection.getInputStream()
            val bitmap = BitmapFactory.decodeStream(input)
            input.close()
            
            // Cache it for future use
            if (bitmap != null) {
                iconCache[uri] = bitmap
                android.util.Log.d("OSMMapView", "✅ Icon downloaded and cached: ${bitmap.width}x${bitmap.height}")
            }
            
            bitmap
        } catch (e: Exception) {
            android.util.Log.e("OSMMapView", "❌ Failed to load icon from $uri: ${e.message}")
            null
        }
    }
    
    // Set circles on the map
    fun setCircles(circlesData: List<Map<String, Any>>) {
        android.util.Log.d("OSMMapView", "🔵 setCircles called with ${circlesData.size} circles")
        
        // Clear existing circles
        mapCircles.forEach { circle ->
            maplibreMap?.removePolygon(circle)
        }
        mapCircles.clear()
        
        // Parse new circles
        circles = circlesData.mapNotNull { data ->
            val id = data["id"] as? String ?: return@mapNotNull null
            val centerData = data["center"] as? Map<String, Double> ?: return@mapNotNull null
            val lat = centerData["latitude"] ?: return@mapNotNull null
            val lng = centerData["longitude"] ?: return@mapNotNull null
            val radius = (data["radius"] as? Number)?.toDouble() ?: return@mapNotNull null
            
            CircleData(
                id = id,
                center = LatLng(lat, lng),
                radius = radius,
                fillColor = data["fillColor"] as? String ?: "#000000",
                fillOpacity = (data["fillOpacity"] as? Number)?.toDouble() ?: 0.3,
                strokeColor = data["strokeColor"] as? String ?: "#000000",
                strokeWidth = (data["strokeWidth"] as? Number)?.toDouble() ?: 2.0,
                strokeOpacity = (data["strokeOpacity"] as? Number)?.toDouble() ?: 1.0,
                strokePattern = data["strokePattern"] as? String ?: "solid",
                zIndex = (data["zIndex"] as? Number)?.toInt() ?: 0,
                visible = data["visible"] as? Boolean ?: true
            )
        }.toMutableList()
        
        android.util.Log.d("OSMMapView", "✅ Parsed ${circles.size} circles")
        
        // Add circles to map
        addCirclesToMap()
    }
    
    // Add circles to map
    private fun addCirclesToMap() {
        maplibreMap?.let { map ->
            circles.forEach { circle ->
                if (!circle.visible) return@forEach
                
                try {
                    // Create circle as a polygon
                    val circlePoints = createCirclePolygon(circle.center, circle.radius)
                    
                    val polygonOptions = org.maplibre.android.annotations.PolygonOptions()
                        .addAll(circlePoints)
                        .fillColor(parseColorWithOpacity(circle.fillColor, circle.fillOpacity))
                        .strokeColor(parseColorWithOpacity(circle.strokeColor, circle.strokeOpacity))
                    
                    val polygon = map.addPolygon(polygonOptions)
                    mapCircles.add(polygon)
                    
                    android.util.Log.d("OSMMapView", "✅ Circle ${circle.id} added to map at ${circle.center.latitude}, ${circle.center.longitude}")
                } catch (e: Exception) {
                    android.util.Log.e("OSMMapView", "❌ Failed to add circle ${circle.id}: ${e.message}")
                }
            }
        }
    }
    
    // Create circle polygon approximation
    private fun createCirclePolygon(center: LatLng, radiusInMeters: Double): List<LatLng> {
        val numberOfSides = 64
        val coordinates = mutableListOf<LatLng>()
        
        // Convert meters to degrees (approximate)
        val radiusInDegrees = radiusInMeters / 111320.0 // 1 degree latitude = ~111,320 meters
        
        for (i in 0 until numberOfSides) {
            val angle = Math.toRadians((i * 360.0 / numberOfSides))
            val lat = center.latitude + radiusInDegrees * Math.cos(angle)
            val lng = center.longitude + radiusInDegrees * Math.sin(angle) / Math.cos(Math.toRadians(center.latitude))
            coordinates.add(LatLng(lat, lng))
        }
        
        // Close the polygon
        if (coordinates.isNotEmpty()) {
            coordinates.add(coordinates[0])
        }
        
        return coordinates
    }
    
    // Parse color with opacity
    private fun parseColorWithOpacity(hexColor: String, opacity: Double): Int {
        try {
            val color = android.graphics.Color.parseColor(hexColor)
            val alpha = (opacity * 255).toInt().coerceIn(0, 255)
            return android.graphics.Color.argb(
                alpha,
                android.graphics.Color.red(color),
                android.graphics.Color.green(color),
                android.graphics.Color.blue(color)
            )
        } catch (e: Exception) {
            android.util.Log.e("OSMMapView", "Failed to parse color $hexColor: ${e.message}")
            return android.graphics.Color.parseColor("#000000")
        }
    }
    
    // Set polylines on the map
    fun setPolylines(polylinesData: List<Map<String, Any>>) {
        android.util.Log.d("OSMMapView", "📏 setPolylines called with ${polylinesData.size} polylines")
        
        // Clear existing polylines
        mapPolylines.forEach { polyline ->
            maplibreMap?.removePolyline(polyline)
        }
        mapPolylines.clear()
        
        // Parse new polylines
        polylines = polylinesData.mapNotNull { data ->
            val id = data["id"] as? String ?: return@mapNotNull null
            val coordinatesData = data["coordinates"] as? List<Map<String, Any>> ?: return@mapNotNull null
            
            val coordinates = coordinatesData.mapNotNull { coord ->
                val lat = (coord["latitude"] as? Number)?.toDouble() ?: return@mapNotNull null
                val lng = (coord["longitude"] as? Number)?.toDouble() ?: return@mapNotNull null
                LatLng(lat, lng)
            }
            
            if (coordinates.size < 2) return@mapNotNull null
            
            PolylineData(
                id = id,
                coordinates = coordinates,
                strokeColor = data["strokeColor"] as? String ?: "#000000",
                strokeWidth = (data["strokeWidth"] as? Number)?.toDouble() ?: 2.0,
                strokeOpacity = (data["strokeOpacity"] as? Number)?.toDouble() ?: 1.0,
                strokePattern = data["strokePattern"] as? String ?: "solid",
                lineCap = data["lineCap"] as? String ?: "round",
                lineJoin = data["lineJoin"] as? String ?: "round",
                zIndex = (data["zIndex"] as? Number)?.toInt() ?: 0,
                visible = data["visible"] as? Boolean ?: true
            )
        }.toMutableList()
        
        android.util.Log.d("OSMMapView", "✅ Parsed ${polylines.size} polylines")
        
        // Add polylines to map
        addPolylinesToMap()
    }
    
    // Add polylines to map
    private fun addPolylinesToMap() {
        maplibreMap?.let { map ->
            polylines.forEach { polyline ->
                if (!polyline.visible) return@forEach
                
                try {
                    val polylineOptions = org.maplibre.android.annotations.PolylineOptions()
                        .addAll(polyline.coordinates)
                        .color(parseColorWithOpacity(polyline.strokeColor, polyline.strokeOpacity))
                        .width(polyline.strokeWidth.toFloat())
                    
                    val mapPolyline = map.addPolyline(polylineOptions)
                    mapPolylines.add(mapPolyline)
                    
                    android.util.Log.d("OSMMapView", "✅ Polyline ${polyline.id} added with ${polyline.coordinates.size} points")
                } catch (e: Exception) {
                    android.util.Log.e("OSMMapView", "❌ Failed to add polyline ${polyline.id}: ${e.message}")
                }
            }
        }
    }
    
    // Set polygons on the map
    fun setPolygons(polygonsData: List<Map<String, Any>>) {
        android.util.Log.d("OSMMapView", "🔷 setPolygons called with ${polygonsData.size} polygons")
        
        // Clear existing polygons
        mapPolygons.forEach { polygon ->
            maplibreMap?.removePolygon(polygon)
        }
        mapPolygons.clear()
        
        // Parse new polygons
        polygons = polygonsData.mapNotNull { data ->
            val id = data["id"] as? String ?: return@mapNotNull null
            val coordinatesData = data["coordinates"] as? List<Map<String, Any>> ?: return@mapNotNull null
            
            val coordinates = coordinatesData.mapNotNull { coord ->
                val lat = (coord["latitude"] as? Number)?.toDouble() ?: return@mapNotNull null
                val lng = (coord["longitude"] as? Number)?.toDouble() ?: return@mapNotNull null
                LatLng(lat, lng)
            }
            
            if (coordinates.size < 3) return@mapNotNull null
            
            // Parse holes if present (simplified for now)
            var holes: List<List<LatLng>>? = null
            if (data["holes"] is List<*>) {
                val holesData = data["holes"] as? List<List<Map<String, Any>>>
                holes = holesData?.mapNotNull { holeData ->
                    holeData.mapNotNull { coord ->
                        val lat = (coord["latitude"] as? Number)?.toDouble() ?: return@mapNotNull null
                        val lng = (coord["longitude"] as? Number)?.toDouble() ?: return@mapNotNull null
                        LatLng(lat, lng)
                    }
                }
            }
            
            PolygonData(
                id = id,
                coordinates = coordinates,
                holes = holes,
                fillColor = data["fillColor"] as? String ?: "#000000",
                fillOpacity = (data["fillOpacity"] as? Number)?.toDouble() ?: 0.3,
                strokeColor = data["strokeColor"] as? String ?: "#000000",
                strokeWidth = (data["strokeWidth"] as? Number)?.toDouble() ?: 2.0,
                strokeOpacity = (data["strokeOpacity"] as? Number)?.toDouble() ?: 1.0,
                strokePattern = data["strokePattern"] as? String ?: "solid",
                zIndex = (data["zIndex"] as? Number)?.toInt() ?: 0,
                visible = data["visible"] as? Boolean ?: true
            )
        }.toMutableList()
        
        android.util.Log.d("OSMMapView", "✅ Parsed ${polygons.size} polygons")
        
        // Add polygons to map
        addPolygonsToMap()
    }
    
    // Add polygons to map
    private fun addPolygonsToMap() {
        maplibreMap?.let { map ->
            polygons.forEach { polygon ->
                if (!polygon.visible) return@forEach
                
                try {
                    val polygonOptions = org.maplibre.android.annotations.PolygonOptions()
                        .addAll(polygon.coordinates)
                        .fillColor(parseColorWithOpacity(polygon.fillColor, polygon.fillOpacity))
                        .strokeColor(parseColorWithOpacity(polygon.strokeColor, polygon.strokeOpacity))
                    
                    // Note: MapLibre Android doesn't support holes natively via PolygonOptions
                    // Holes would need to be implemented using Style layers if required in the future
                    
                    val mapPolygon = map.addPolygon(polygonOptions)
                    mapPolygons.add(mapPolygon)
                    
                    android.util.Log.d("OSMMapView", "✅ Polygon ${polygon.id} added with ${polygon.coordinates.size} points")
                } catch (e: Exception) {
                    android.util.Log.e("OSMMapView", "❌ Failed to add polygon ${polygon.id}: ${e.message}")
                }
            }
        }
    }
    
    // MARK: - Zoom Controls
    
    // MARK: - Helper functions
    
    // Public method to check if map is ready for operations
    fun isMapReady(): Boolean {
        val ready = ::mapView.isInitialized && maplibreMap != null
        android.util.Log.d("OSMMapView", "🔍 isMapReady() called - result: $ready")
        android.util.Log.d("OSMMapView", "📊 MapView initialized: ${::mapView.isInitialized}, MapLibreMap: $maplibreMap")
        return ready
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
        
        // Bulletproof error handling - NEVER throw exceptions to JavaScript
        return try {
            // Check location permissions first
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                android.util.Log.e("OSMMapView", "❌ Location permissions not granted")
                throw Exception("Location permission not granted")
            }
            
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
    
    // Function that waits for fresh location data with enhanced error handling
    fun waitForLocation(timeoutSeconds: Int): Map<String, Double> {
        android.util.Log.d("OSMMapView", "🔍 waitForLocation called with timeout: ${timeoutSeconds}s")
        
        // Bulletproof error handling - NEVER crash the app
        return try {
            // Check location permissions first
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                android.util.Log.e("OSMMapView", "❌ Location permissions not granted")
                throw Exception("Location permission not granted")
            }
            
            // Initialize location manager if not already done
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            
            // Check if GPS is enabled
            if (!locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) && 
                !locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                android.util.Log.e("OSMMapView", "❌ No location providers enabled")
                throw Exception("GPS and Network location are disabled. Please enable location services.")
            }
            
            // Start location tracking if not already active
            if (!isLocationTrackingActive) {
                android.util.Log.d("OSMMapView", "📍 Starting location tracking for waitForLocation")
                try {
                    startLocationTracking()
                } catch (e: Exception) {
                    android.util.Log.w("OSMMapView", "⚠️ Could not start location tracking: ${e.message}")
                }
            }
            
            // Wait for location with timeout - using a more robust approach
            val startTime = System.currentTimeMillis()
            val timeoutMillis = timeoutSeconds * 1000L
            
            while (System.currentTimeMillis() - startTime < timeoutMillis) {
                lastKnownLocation?.let { location ->
                    val locationAge = System.currentTimeMillis() - location.time
                    android.util.Log.d("OSMMapView", "📍 Checking location age: ${locationAge}ms")
                    
                    // Consider location fresh if it's less than 30 seconds old
                    if (locationAge < 30000) {
                        android.util.Log.d("OSMMapView", "📍 Got acceptable location: ${location.latitude}, ${location.longitude}")
                        return mapOf<String, Double>(
                            "latitude" to location.latitude,
                            "longitude" to location.longitude,
                            "accuracy" to location.accuracy.toDouble(),
                            "timestamp" to location.time.toDouble()
                        )
                    }
                }
                
                // Also check system locations for faster response
                try {
                    val gpsLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                    if (gpsLocation != null && (System.currentTimeMillis() - gpsLocation.time) < 30000) {
                        android.util.Log.d("OSMMapView", "📍 Got fresh system GPS location")
                        return mapOf<String, Double>(
                            "latitude" to gpsLocation.latitude,
                            "longitude" to gpsLocation.longitude,
                            "accuracy" to gpsLocation.accuracy.toDouble(),
                            "timestamp" to gpsLocation.time.toDouble()
                        )
                    }
                } catch (securityException: SecurityException) {
                    android.util.Log.w("OSMMapView", "⚠️ Security exception checking system location")
                }
                
                // Wait before checking again - using shorter intervals for better responsiveness
                Thread.sleep(500)
            }
            
            android.util.Log.e("OSMMapView", "❌ Timeout waiting for location")
            throw Exception("Timeout waiting for location. Please ensure location services are enabled and GPS has clear sky view.")
            
        } catch (e: SecurityException) {
            android.util.Log.e("OSMMapView", "❌ Security exception in waitForLocation: ${e.message}")
            throw Exception("Location permission denied: ${e.message}")
        } catch (e: InterruptedException) {
            android.util.Log.e("OSMMapView", "❌ Interrupted while waiting for location: ${e.message}")
            Thread.currentThread().interrupt()
            throw Exception("Location request was interrupted")
        } catch (e: Exception) {
            android.util.Log.e("OSMMapView", "❌ Error in waitForLocation: ${e.message}")
            throw e
        }
    }
    
    // MARK: - Location Services
    
    fun setShowUserLocation(show: Boolean) {
        showUserLocation = show
        if (show) {
            enableLocationComponent()
            startLocationTracking()
        } else {
            disableLocationComponent()
            stopLocationTracking()
        }
    }
    
    fun setFollowUserLocation(follow: Boolean) {
        followUserLocation = follow
        if (follow && !isLocationTrackingActive) {
            startLocationTracking()
        }
        // Update camera mode if location component is active
        locationComponent?.let {
            it.cameraMode = if (follow) CameraMode.TRACKING else CameraMode.NONE
        }
    }
    
    // Set user location marker color
    fun setUserLocationTintColor(color: String) {
        userLocationTintColor = color
        // Re-enable location component to apply new color
        if (showUserLocation && locationComponent != null) {
            disableLocationComponent()
            enableLocationComponent()
        }
    }
    
    fun setUserLocationAccuracyFillColor(color: String) {
        userLocationAccuracyFillColor = color
        if (showUserLocation && locationComponent != null) {
            disableLocationComponent()
            enableLocationComponent()
        }
    }
    
    fun setUserLocationAccuracyBorderColor(color: String) {
        userLocationAccuracyBorderColor = color
        if (showUserLocation && locationComponent != null) {
            disableLocationComponent()
            enableLocationComponent()
        }
    }
    
    // Enable MapLibre's LocationComponent to show user location on map
    private fun enableLocationComponent() {
        android.util.Log.d("OSMMapView", "🎯 Enabling LocationComponent")
        
        if (!isMapReady()) {
            android.util.Log.w("OSMMapView", "⚠️ Cannot enable LocationComponent - map not ready")
            return
        }
        
        maplibreMap?.let { map ->
            map.style?.let { style ->
                try {
                    // Parse colors
                    val tintColor = parseColor(userLocationTintColor)
                    val fillColor = parseColor(userLocationAccuracyFillColor)
                    val strokeColor = parseColor(userLocationAccuracyBorderColor)
                    
                    // Create LocationComponent options with custom colors
                    val locationComponentOptions = LocationComponentOptions.builder(context)
                        .foregroundTintColor(tintColor) // Main puck color
                        .backgroundTintColor(tintColor) // Background puck color
                        .accuracyColor(fillColor) // Accuracy circle fill
                        .accuracyAlpha(0.2f) // Semi-transparent accuracy circle
                        .bearingTintColor(tintColor) // Bearing indicator color
                        .pulseEnabled(true) // Animated pulse effect
                        .pulseFadeEnabled(true)
                        .pulseColor(tintColor)
                        .pulseAlpha(0.4f)
                        .build()
                    
                    // Build activation options
                    val activationOptions = LocationComponentActivationOptions
                        .builder(context, style)
                        .locationComponentOptions(locationComponentOptions)
                        .useDefaultLocationEngine(false) // We use our own LocationManager
                        .build()
                    
                    // Get location component and activate it
                    locationComponent = map.locationComponent.apply {
                        activateLocationComponent(activationOptions)
                        isLocationComponentEnabled = true
                        cameraMode = if (followUserLocation) CameraMode.TRACKING else CameraMode.NONE
                        renderMode = RenderMode.COMPASS // Show direction indicator
                    }
                    
                    android.util.Log.d("OSMMapView", "✅ LocationComponent enabled with signature purple (#9C1AFF)")
                    
                    // If we have a last known location, show it immediately
                    lastKnownLocation?.let { location ->
                        locationComponent?.forceLocationUpdate(location)
                        android.util.Log.d("OSMMapView", "📍 Set initial location on LocationComponent")
                    }
                    
                } catch (e: Exception) {
                    android.util.Log.e("OSMMapView", "❌ Failed to enable LocationComponent: ${e.message}", e)
                }
            } ?: android.util.Log.w("OSMMapView", "⚠️ Cannot enable LocationComponent - style not loaded")
        } ?: android.util.Log.w("OSMMapView", "⚠️ Cannot enable LocationComponent - map is null")
    }
    
    // Disable LocationComponent
    private fun disableLocationComponent() {
        android.util.Log.d("OSMMapView", "🎯 Disabling LocationComponent")
        
        locationComponent?.let { component ->
            try {
                component.isLocationComponentEnabled = false
                locationComponent = null
                android.util.Log.d("OSMMapView", "✅ LocationComponent disabled")
            } catch (e: Exception) {
                android.util.Log.e("OSMMapView", "❌ Error disabling LocationComponent: ${e.message}", e)
            }
        }
    }
    
    // Helper to parse color strings (hex or rgba)
    private fun parseColor(colorString: String): Int {
        return try {
            when {
                colorString.startsWith("#") -> {
                    // Hex color
                    Color.parseColor(colorString)
                }
                colorString.startsWith("rgba") -> {
                    // Parse rgba(r, g, b, a)
                    val values = colorString.substring(5, colorString.length - 1)
                        .split(",")
                        .map { it.trim() }
                    val r = values[0].toInt()
                    val g = values[1].toInt()
                    val b = values[2].toInt()
                    val a = (values[3].toFloat() * 255).toInt()
                    Color.argb(a, r, g, b)
                }
                colorString.startsWith("rgb") -> {
                    // Parse rgb(r, g, b)
                    val values = colorString.substring(4, colorString.length - 1)
                        .split(",")
                        .map { it.trim().toInt() }
                    Color.rgb(values[0], values[1], values[2])
                }
                else -> {
                    // Default to signature purple if parsing fails
                    Color.parseColor("#9C1AFF")
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("OSMMapView", "❌ Failed to parse color '$colorString': ${e.message}")
            Color.parseColor("#9C1AFF") // Fallback to signature purple
        }
    }
    
    // Enhanced location tracking with comprehensive error handling
    fun startLocationTracking() {
        android.util.Log.d("OSMMapView", "🔍 startLocationTracking called")
        
        // Bulletproof error handling
        try {
            // Check location permissions
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                android.util.Log.e("OSMMapView", "❌ Location permissions not granted")
                throw Exception("Location permission not granted")
            }
            
            // Initialize location manager if needed
            if (locationManager == null) {
                locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            }
            
            // Check if any location provider is available
            val providers = locationManager!!.getProviders(true)
            if (providers.isEmpty()) {
                android.util.Log.e("OSMMapView", "❌ No location providers available")
                throw Exception("No location providers available. Please enable GPS or Network location.")
            }
            
            // Start location updates with error handling
            try {
                // Try GPS provider first
                if (locationManager!!.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    android.util.Log.d("OSMMapView", "📍 Starting GPS location updates")
                    locationManager!!.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        1000L, // 1 second
                        1.0f,  // 1 meter
                        this
                    )
                }
                
                // Also try network provider as backup
                if (locationManager!!.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    android.util.Log.d("OSMMapView", "📍 Starting Network location updates")
                    locationManager!!.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        1000L, // 1 second
                        1.0f,  // 1 meter
                        this
                    )
                }
                
                isLocationTrackingActive = true
                android.util.Log.d("OSMMapView", "✅ Location tracking started successfully")
                
            } catch (e: SecurityException) {
                android.util.Log.e("OSMMapView", "❌ Security exception starting location updates: ${e.message}")
                throw Exception("Location permission denied while starting tracking: ${e.message}")
            } catch (e: IllegalArgumentException) {
                android.util.Log.e("OSMMapView", "❌ Invalid argument for location updates: ${e.message}")
                throw Exception("Invalid location tracking parameters: ${e.message}")
            }
            
        } catch (e: Exception) {
            android.util.Log.e("OSMMapView", "❌ Error starting location tracking: ${e.message}")
            isLocationTrackingActive = false
            throw e
        }
    }
    
    // Enhanced stop tracking with cleanup
    fun stopLocationTracking() {
        android.util.Log.d("OSMMapView", "🔍 stopLocationTracking called")
        
        // Bulletproof cleanup - never fail
        try {
            if (locationManager != null && isLocationTrackingActive) {
                android.util.Log.d("OSMMapView", "📍 Stopping location updates")
                locationManager!!.removeUpdates(this)
                isLocationTrackingActive = false
                android.util.Log.d("OSMMapView", "✅ Location tracking stopped successfully")
            } else {
                android.util.Log.d("OSMMapView", "ℹ️ Location tracking was not active")
            }
        } catch (e: SecurityException) {
            android.util.Log.w("OSMMapView", "⚠️ Security exception stopping location tracking: ${e.message}")
            // Don't throw - just log and continue
            isLocationTrackingActive = false
        } catch (e: Exception) {
            android.util.Log.w("OSMMapView", "⚠️ Error stopping location tracking: ${e.message}")
            // Don't throw - just log and continue
            isLocationTrackingActive = false
        }
    }
    
    // MARK: - LocationListener Implementation
    
    override fun onLocationChanged(location: Location) {
        println("OSM SDK Android: Location changed - ${location.latitude}, ${location.longitude}")
        lastKnownLocation = location
        
        // Update LocationComponent visual indicator
        locationComponent?.forceLocationUpdate(location)
        
        // Emit location change event
        onUserLocationChange(mapOf<String, Double>(
            "latitude" to location.latitude,
            "longitude" to location.longitude,
            "accuracy" to location.accuracy.toDouble(),
            "altitude" to location.altitude,
            "speed" to location.speed.toDouble()
        ))
        
        // Follow user location if enabled (only if not using LocationComponent tracking)
        if (followUserLocation && locationComponent?.cameraMode != CameraMode.TRACKING) {
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
    
    @Deprecated("Deprecated in API 29", ReplaceWith(""))
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
    
    // MARK: - OSRM Routing Functions
    
    fun calculateRoute(
        fromLatitude: Double,
        fromLongitude: Double,
        toLatitude: Double,
        toLongitude: Double,
        profile: String = "driving"
    ): Map<String, Any> {
        android.util.Log.d("OSMMapView", "🚗 calculateRoute called - from: ($fromLatitude, $fromLongitude) to: ($toLatitude, $toLongitude), profile: $profile")
        
        // Validate coordinates
        if (!isValidCoordinate(fromLatitude, fromLongitude) || !isValidCoordinate(toLatitude, toLongitude)) {
            android.util.Log.e("OSMMapView", "❌ Invalid coordinates for routing")
            throw Exception("Invalid coordinates for routing")
        }
        
        // This will be called from JavaScript layer via HTTP requests to OSRM
        // Return placeholder data - actual calculation happens in JS layer
        return mapOf<String, Any>(
            "success" to true,
            "from" to mapOf(
                "latitude" to fromLatitude,
                "longitude" to fromLongitude
            ),
            "to" to mapOf(
                "latitude" to toLatitude,
                "longitude" to toLongitude
            ),
            "profile" to profile
        )
    }
    
    fun displayRoute(routeCoordinates: List<Map<String, Double>>, routeOptions: Map<String, Any> = mapOf()) {
        android.util.Log.d("OSMMapView", "🛣️ displayRoute called with ${routeCoordinates.size} coordinates")
        
        if (!isMapReady()) {
            android.util.Log.e("OSMMapView", "❌ Cannot display route - map not ready")
            throw Exception("Map not ready for route display")
        }
        
        maplibreMap?.let { map ->
            try {
                // Clear existing route polylines
                clearRoute()
                
                // Convert coordinates to LatLng list
                val latLngList = routeCoordinates.mapNotNull { coord ->
                    val lat = coord["latitude"] ?: return@mapNotNull null
                    val lng = coord["longitude"] ?: return@mapNotNull null
                    LatLng(lat, lng)
                }
                
                if (latLngList.size < 2) {
                    android.util.Log.e("OSMMapView", "❌ Need at least 2 coordinates for route display")
                    throw Exception("Need at least 2 coordinates for route display")
                }
                
                // Create polyline options
                val polylineOptions = org.maplibre.android.annotations.PolylineOptions()
                    .addAll(latLngList)
                    .color(android.graphics.Color.parseColor(routeOptions["color"] as? String ?: "#007AFF"))
                    .width((routeOptions["width"] as? Number)?.toFloat() ?: 5.0f)
                    .alpha((routeOptions["opacity"] as? Number)?.toFloat() ?: 0.8f)
                
                // Add polyline to map
                val polyline = map.addPolyline(polylineOptions)
                currentRoutePolylines.add(polyline)
                
                android.util.Log.d("OSMMapView", "✅ Route displayed successfully with ${latLngList.size} points")
                
                // Emit route calculated event
                onRouteCalculated(mapOf(
                    "coordinateCount" to latLngList.size,
                    "routeId" to polyline.id.toString()
                ))
                
            } catch (e: Exception) {
                android.util.Log.e("OSMMapView", "❌ Failed to display route: ${e.message}")
                throw Exception("Failed to display route: ${e.message}")
            }
        }
    }
    
    fun clearRoute() {
        android.util.Log.d("OSMMapView", "🗑️ clearRoute called")
        
        maplibreMap?.let { map ->
            try {
                // Remove all current route polylines
                currentRoutePolylines.forEach { polyline ->
                    map.removePolyline(polyline)
                }
                currentRoutePolylines.clear()
                
                android.util.Log.d("OSMMapView", "✅ Route cleared successfully")
            } catch (e: Exception) {
                android.util.Log.e("OSMMapView", "❌ Error clearing route: ${e.message}")
            }
        }
    }
    
    fun fitRouteInView(routeCoordinates: List<Map<String, Double>>, padding: Double = 50.0) {
        android.util.Log.d("OSMMapView", "📍 fitRouteInView called with ${routeCoordinates.size} coordinates")
        
        if (!isMapReady()) {
            android.util.Log.e("OSMMapView", "❌ Cannot fit route - map not ready")
            throw Exception("Map not ready for route fitting")
        }
        
        if (routeCoordinates.isEmpty()) {
            android.util.Log.w("OSMMapView", "⚠️ No coordinates provided for route fitting")
            return
        }
        
        maplibreMap?.let { map ->
            try {
                // Calculate bounding box
                var minLat = Double.MAX_VALUE
                var maxLat = Double.MIN_VALUE
                var minLng = Double.MAX_VALUE
                var maxLng = Double.MIN_VALUE
                
                routeCoordinates.forEach { coord ->
                    val lat = coord["latitude"] ?: return@forEach
                    val lng = coord["longitude"] ?: return@forEach
                    
                    minLat = minOf(minLat, lat)
                    maxLat = maxOf(maxLat, lat)
                    minLng = minOf(minLng, lng)
                    maxLng = maxOf(maxLng, lng)
                }
                
                // Create bounds
                val bounds = org.maplibre.android.geometry.LatLngBounds.Builder()
                    .include(LatLng(minLat, minLng))
                    .include(LatLng(maxLat, maxLng))
                    .build()
                
                // Animate camera to bounds with padding
                val paddingPixels = (padding * resources.displayMetrics.density).toInt()
                val cameraUpdate = org.maplibre.android.camera.CameraUpdateFactory
                    .newLatLngBounds(bounds, paddingPixels)
                
                map.animateCamera(cameraUpdate, 1000)
                
                android.util.Log.d("OSMMapView", "✅ Route fitted in view successfully")
                
            } catch (e: Exception) {
                android.util.Log.e("OSMMapView", "❌ Error fitting route in view: ${e.message}")
                throw Exception("Failed to fit route in view: ${e.message}")
            }
        }
    }

    // MARK: - State Management
    
    // Save map view state for proper restoration
    fun onSaveInstanceState(outState: android.os.Bundle) {
        android.util.Log.d("OSMMapView", "💾 Saving map instance state")
        try {
            if (::mapView.isInitialized) {
                mapView.onSaveInstanceState(outState)
                android.util.Log.d("OSMMapView", "✅ Map state saved successfully")
            }
        } catch (e: Exception) {
            android.util.Log.e("OSMMapView", "❌ Error saving map state: ${e.message}")
        }
    }
    
    // Restore map view state from saved instance
    fun onRestoreInstanceState(savedInstanceState: android.os.Bundle?) {
        android.util.Log.d("OSMMapView", "🔄 Restoring map instance state")
        this.savedInstanceState = savedInstanceState
        if (savedInstanceState != null) {
            android.util.Log.d("OSMMapView", "✅ Map state will be restored on next initialization")
        }
    }
    
    // Cleanup method for view lifecycle
    private fun cleanup() {
        println("OSM SDK Android: Cleaning up OSMMapView")
        try {
            // Cancel all coroutines
            coroutineScope.cancel()
            
            // Clear icon cache
            iconCache.clear()
            
            // Stop location tracking
            stopLocationTracking()
            
            // Disable and cleanup LocationComponent
            disableLocationComponent()
            
            // Clear markers
            mapMarkers.clear()
            markers.clear()
            
            // Clear circles
            mapCircles.clear()
            circles.clear()
            
            // Clear polylines
            mapPolylines.clear()
            polylines.clear()
            
            // Clear polygons
            mapPolygons.clear()
            polygons.clear()
            
            // Clear routes
            clearRoute()
            
            // Clean up map
            maplibreMap = null
            
            // Clear saved instance state
            savedInstanceState = null
            
            println("OSM SDK Android: Cleanup completed")
        } catch (e: Exception) {
            println("OSM SDK Android: Error during cleanup: ${e.message}")
        }
    }
} 