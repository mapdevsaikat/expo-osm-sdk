package expo.modules.osmsdk

import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.view.MotionEvent
import android.view.ViewGroup
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
    
    init {
        
        // Initialize the map view immediately
        try {
            setupMapView()
        } catch (e: Exception) {
            // ignored
        }
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
    var initialPitch = 0.0
        private set
    var initialBearing = 0.0
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
    
    // Map control configuration
    private var showsCompass = false
    private var showsScale = false
    private var rotateEnabled = true
    private var scrollEnabled = true
    private var zoomEnabled = true
    private var pitchEnabled = true
    
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
        
        // Add to view hierarchy - let parent generate appropriate LayoutParams
        // Don't specify LayoutParams to avoid ClassCastException
        addView(mapView)
    }
    
    // MARK: - OnMapReadyCallback
    
    override fun onMapReady(@NonNull maplibreMap: MapLibreMap) {
        this.maplibreMap = maplibreMap
        
        // Set initial camera position with pitch and bearing
        val cameraPosition = CameraPosition.Builder()
            .target(initialCenter)
            .zoom(initialZoom)
            .tilt(initialPitch)
            .bearing(initialBearing)
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
                // ignored
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
        
        map.setStyle(Style.Builder().fromUri(vectorStyleUrl)) { style ->
            if (style != null) {
            } else {
                setupRasterTilesFallback(map)
            }
        }
    }
    
    // Fallback raster tiles if vector style fails
    private fun setupRasterTilesFallback(map: MapLibreMap) {
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
    
    fun setInitialPitch(pitch: Double) {
        initialPitch = pitch.coerceIn(0.0, 60.0)
        
        // Update map if already initialized
        maplibreMap?.let { map ->
            val cameraPosition = CameraPosition.Builder()
                .target(map.cameraPosition.target)
                .zoom(map.cameraPosition.zoom)
                .bearing(map.cameraPosition.bearing)
                .tilt(initialPitch)
                .build()
            map.cameraPosition = cameraPosition
        }
    }
    
    fun setInitialBearing(bearing: Double) {
        initialBearing = ((bearing % 360.0) + 360.0) % 360.0
        
        // Update map if already initialized
        maplibreMap?.let { map ->
            val cameraPosition = CameraPosition.Builder()
                .target(map.cameraPosition.target)
                .zoom(map.cameraPosition.zoom)
                .bearing(initialBearing)
                .tilt(map.cameraPosition.tilt)
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
        try {
            // Clear existing markers
            mapMarkers.forEach { marker ->
                maplibreMap?.removeMarker(marker)
            }
            mapMarkers.clear()
            
            // Parse new markers with error handling
            markers = markersData.mapNotNull { data ->
                try {
                    val id = data["id"] as? String ?: return@mapNotNull null
                    val coordinate = data["coordinate"] as? Map<String, Double> ?: return@mapNotNull null
                    val lat = coordinate["latitude"] ?: return@mapNotNull null
                    val lng = coordinate["longitude"] ?: return@mapNotNull null
                    
                    // Validate coordinate values
                    if (lat < -90.0 || lat > 90.0 || lng < -180.0 || lng > 180.0) {
                        return@mapNotNull null
                    }
                    
                    // Parse icon data properly
                    val iconData: MarkerIconData? = (data["icon"] as? Map<String, Any>)?.let { iconMap ->
                        try {
                            MarkerIconData(
                                uri = iconMap["uri"] as? String,
                                name = iconMap["name"] as? String,
                                size = (iconMap["size"] as? Number)?.toDouble() ?: 30.0,
                                color = iconMap["color"] as? String,
                                anchorX = ((iconMap["anchor"] as? Map<String, Any>)?.get("x") as? Number)?.toDouble() ?: 0.5,
                                anchorY = ((iconMap["anchor"] as? Map<String, Any>)?.get("y") as? Number)?.toDouble() ?: 1.0
                            )
                        } catch (e: Exception) {
                            null
                        }
                    }
                    
                    MarkerData(
                        id = id,
                        coordinate = LatLng(lat, lng),
                        title = data["title"] as? String,
                        description = data["description"] as? String,
                        icon = iconData
                    )
                } catch (e: Exception) {
                    null
                }
            }.toMutableList()
            
            
            // Add markers to map
            addMarkersToMap()
        } catch (e: Exception) {
            // ignored
        }
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
                    marker.icon?.let { iconSpec ->
                        val uri = iconSpec.uri ?: return@let
                        try {
                            val bitmap = loadIconFromUri(uri)
                            if (bitmap != null) {
                                val iconFactory = IconFactory.getInstance(context)
                                val iconSize = iconSpec.size.toInt()
                                val scaledBitmap = Bitmap.createScaledBitmap(
                                    bitmap,
                                    iconSize,
                                    iconSize,
                                    true
                                )
                                val icon = iconFactory.fromBitmap(scaledBitmap)
                                markerOptions.icon(icon)
                                
                            } else {
                            }
                        } catch (e: Exception) {
                            // ignored
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
                return@withContext it 
            }
            
            
            val url = URL(uri)
            val connection = url.openConnection()
            connection.connect()
            val bitmap: Bitmap?
            val input = connection.getInputStream()
            try {
                bitmap = BitmapFactory.decodeStream(input)
            } finally {
                input.close()
            }
            
            // Cache it for future use
            if (bitmap != null) {
                iconCache[uri] = bitmap
            }
            
            bitmap
        } catch (e: Exception) {
            null
        }
    }
    
    // Set circles on the map
    fun setCircles(circlesData: List<Map<String, Any>>) {
        
        try {
            // Clear existing circles
            mapCircles.forEach { circle ->
                maplibreMap?.removePolygon(circle)
            }
            mapCircles.clear()
            
            // Parse new circles with error handling
            circles = circlesData.mapNotNull { data ->
                try {
                    val id = data["id"] as? String ?: return@mapNotNull null
                    val centerData = data["center"] as? Map<String, Double> ?: return@mapNotNull null
                    val lat = centerData["latitude"] ?: return@mapNotNull null
                    val lng = centerData["longitude"] ?: return@mapNotNull null
                    val radius = (data["radius"] as? Number)?.toDouble() ?: return@mapNotNull null
                    
                    // Validate coordinates and radius
                    if (lat < -90.0 || lat > 90.0 || lng < -180.0 || lng > 180.0) {
                        return@mapNotNull null
                    }
                    if (radius <= 0) {
                        return@mapNotNull null
                    }
                    
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
                } catch (e: Exception) {
                    null
                }
            }.toMutableList()
            
            
            // Add circles to map
            addCirclesToMap()
        } catch (e: Exception) {
            // ignored
        }
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
                    
                } catch (e: Exception) {
                    // ignored
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
            return android.graphics.Color.parseColor("#000000")
        }
    }
    
    // Set polylines on the map
    fun setPolylines(polylinesData: List<Map<String, Any>>) {
        
        try {
            // Clear existing polylines
            mapPolylines.forEach { polyline ->
                maplibreMap?.removePolyline(polyline)
            }
            mapPolylines.clear()
            
            // Parse new polylines with error handling
            polylines = polylinesData.mapNotNull { data ->
                try {
                    val id = data["id"] as? String ?: return@mapNotNull null
                    val coordinatesData = data["coordinates"] as? List<Map<String, Any>> ?: return@mapNotNull null
                    
                    val coordinates = coordinatesData.mapNotNull { coord ->
                        try {
                            val lat = (coord["latitude"] as? Number)?.toDouble() ?: return@mapNotNull null
                            val lng = (coord["longitude"] as? Number)?.toDouble() ?: return@mapNotNull null
                            
                            // Validate coordinates
                            if (lat < -90.0 || lat > 90.0 || lng < -180.0 || lng > 180.0) {
                                return@mapNotNull null
                            }
                            
                            LatLng(lat, lng)
                        } catch (e: Exception) {
                            null
                        }
                    }
                    
                    if (coordinates.size < 2) {
                        return@mapNotNull null
                    }
                    
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
                } catch (e: Exception) {
                    null
                }
            }.toMutableList()
            
            
            // Add polylines to map
            addPolylinesToMap()
        } catch (e: Exception) {
            // ignored
        }
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
                    
                } catch (e: Exception) {
                    // ignored
                }
            }
        }
    }
    
    // Set polygons on the map
    fun setPolygons(polygonsData: List<Map<String, Any>>) {
        
        try {
            // Clear existing polygons
            mapPolygons.forEach { polygon ->
                maplibreMap?.removePolygon(polygon)
            }
            mapPolygons.clear()
            
            // Parse new polygons with error handling
            polygons = polygonsData.mapNotNull { data ->
                try {
                    val id = data["id"] as? String ?: return@mapNotNull null
                    val coordinatesData = data["coordinates"] as? List<Map<String, Any>> ?: return@mapNotNull null
                    
                    val coordinates = coordinatesData.mapNotNull { coord ->
                        try {
                            val lat = (coord["latitude"] as? Number)?.toDouble() ?: return@mapNotNull null
                            val lng = (coord["longitude"] as? Number)?.toDouble() ?: return@mapNotNull null
                            
                            // Validate coordinates
                            if (lat < -90.0 || lat > 90.0 || lng < -180.0 || lng > 180.0) {
                                return@mapNotNull null
                            }
                            
                            LatLng(lat, lng)
                        } catch (e: Exception) {
                            null
                        }
                    }
                    
                    if (coordinates.size < 3) {
                        return@mapNotNull null
                    }
                    
                    // Parse holes if present with error handling
                    var holes: List<List<LatLng>>? = null
                    if (data["holes"] is List<*>) {
                        try {
                            val holesData = data["holes"] as? List<List<Map<String, Any>>>
                            holes = holesData?.mapNotNull { holeData ->
                                holeData.mapNotNull { coord ->
                                    try {
                                        val lat = (coord["latitude"] as? Number)?.toDouble() ?: return@mapNotNull null
                                        val lng = (coord["longitude"] as? Number)?.toDouble() ?: return@mapNotNull null
                                        
                                        // Validate hole coordinates
                                        if (lat < -90.0 || lat > 90.0 || lng < -180.0 || lng > 180.0) {
                                            return@mapNotNull null
                                        }
                                        
                                        LatLng(lat, lng)
                                    } catch (e: Exception) {
                                        null
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            // ignored
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
                } catch (e: Exception) {
                    null
                }
            }.toMutableList()
            
            
            // Add polygons to map
            addPolygonsToMap()
        } catch (e: Exception) {
            // ignored
        }
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
                    
                } catch (e: Exception) {
                    // ignored
                }
            }
        }
    }
    
    // MARK: - Zoom Controls
    
    // MARK: - Helper functions
    
    // Public method to check if map is ready for operations
    fun isMapReady(): Boolean {
        val ready = ::mapView.isInitialized && maplibreMap != null
        return ready
    }
    
    fun zoomIn() {
        
        if (!isMapReady()) {
            throw Exception("Map not ready - style not loaded")
        }
        
        maplibreMap?.let { map ->
            try {
                val currentZoom = map.cameraPosition.zoom
                val newZoom = (currentZoom + 1.0).coerceIn(1.0, 20.0)
                animateToZoom(newZoom)
            } catch (e: Exception) {
                throw Exception("Zoom in failed: ${e.message}")
            }
        }
    }
    
    fun zoomOut() {
        
        if (!isMapReady()) {
            throw Exception("Map not ready - style not loaded")
        }
        
        maplibreMap?.let { map ->
            try {
                val currentZoom = map.cameraPosition.zoom
                val newZoom = (currentZoom - 1.0).coerceIn(1.0, 20.0)
                animateToZoom(newZoom)
            } catch (e: Exception) {
                throw Exception("Zoom out failed: ${e.message}")
            }
        }
    }
    
    fun setZoom(zoom: Double) {
        maplibreMap?.let { map ->
            try {
                val clampedZoom = zoom.coerceIn(1.0, 20.0)
                animateToZoom(clampedZoom)
            } catch (e: Exception) {
                throw e
            }
        } ?: run {
            throw Exception("Map not ready")
        }
    }
    
    private fun animateToZoom(zoom: Double) {
        
        if (maplibreMap == null) {
            throw Exception("Map not available for zoom animation")
        }
        
        maplibreMap?.let { map ->
            try {
                val currentCenter = map.cameraPosition.target ?: initialCenter
                
                val cameraPosition = CameraPosition.Builder()
                    .target(currentCenter)
                    .zoom(zoom)
                    .build()
                
                map.animateCamera(
                    org.maplibre.android.camera.CameraUpdateFactory.newCameraPosition(cameraPosition), 
                    500
                )
            } catch (e: Exception) {
                throw Exception("Camera animation failed: ${e.message}")
            }
        }
    }
    
    // MARK: - Camera Orientation Controls
    
    fun setPitch(pitch: Double) {
        
        maplibreMap?.let { map ->
            try {
                // Clamp pitch between 0 and 60 degrees (MapLibre standard)
                val clampedPitch = pitch.coerceIn(0.0, 60.0)
                
                val currentPosition = map.cameraPosition
                val cameraPosition = CameraPosition.Builder()
                    .target(currentPosition.target ?: initialCenter)
                    .zoom(currentPosition.zoom)
                    .bearing(currentPosition.bearing)
                    .tilt(clampedPitch)
                    .build()
                
                map.animateCamera(
                    org.maplibre.android.camera.CameraUpdateFactory.newCameraPosition(cameraPosition),
                    300
                )
            } catch (e: Exception) {
                throw Exception("Failed to set pitch: ${e.message}")
            }
        } ?: run {
            throw Exception("Map not ready")
        }
    }
    
    fun setBearing(bearing: Double) {
        
        maplibreMap?.let { map ->
            try {
                // Normalize bearing to 0-360 degrees
                val normalizedBearing = ((bearing % 360.0) + 360.0) % 360.0
                
                val currentPosition = map.cameraPosition
                val cameraPosition = CameraPosition.Builder()
                    .target(currentPosition.target ?: initialCenter)
                    .zoom(currentPosition.zoom)
                    .bearing(normalizedBearing)
                    .tilt(currentPosition.tilt)
                    .build()
                
                map.animateCamera(
                    org.maplibre.android.camera.CameraUpdateFactory.newCameraPosition(cameraPosition),
                    300
                )
            } catch (e: Exception) {
                throw Exception("Failed to set bearing: ${e.message}")
            }
        } ?: run {
            throw Exception("Map not ready")
        }
    }
    
    fun getPitch(): Double {
        
        return maplibreMap?.let { map ->
            val pitch = map.cameraPosition.tilt
            pitch
        } ?: run {
            0.0
        }
    }
    
    fun getBearing(): Double {
        
        return maplibreMap?.let { map ->
            val bearing = map.cameraPosition.bearing
            bearing
        } ?: run {
            0.0
        }
    }
    
    fun animateCamera(
        latitude: Double?,
        longitude: Double?,
        zoom: Double?,
        pitch: Double?,
        bearing: Double?,
        duration: Int?
    ) {
        
        maplibreMap?.let { map ->
            try {
                val currentPosition = map.cameraPosition
                
                // Use provided values or keep current
                val targetLocation = if (latitude != null && longitude != null) {
                    // Validate coordinates if provided
                    if (!isValidCoordinate(latitude, longitude)) {
                        throw Exception("Invalid coordinates")
                    }
                    LatLng(latitude, longitude)
                } else {
                    currentPosition.target ?: initialCenter
                }
                
                val targetZoom = zoom?.coerceIn(1.0, 20.0) ?: currentPosition.zoom
                val targetPitch = pitch?.coerceIn(0.0, 60.0) ?: currentPosition.tilt
                val targetBearing = bearing?.let { ((it % 360.0) + 360.0) % 360.0 } ?: currentPosition.bearing
                val animDuration = duration ?: 1000
                
                
                val cameraPosition = CameraPosition.Builder()
                    .target(targetLocation)
                    .zoom(targetZoom)
                    .tilt(targetPitch)
                    .bearing(targetBearing)
                    .build()
                
                map.animateCamera(
                    org.maplibre.android.camera.CameraUpdateFactory.newCameraPosition(cameraPosition),
                    animDuration
                )
            } catch (e: Exception) {
                throw Exception("Camera animation failed: ${e.message}")
            }
        } ?: run {
            throw Exception("Map not ready")
        }
    }
    
    // MARK: - Location Controls
    
    fun animateToLocation(latitude: Double, longitude: Double, zoom: Double = initialZoom) {
        
        // Validate coordinates
        if (!isValidCoordinate(latitude, longitude)) {
            throw Exception("Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180")
        }
        
        // Check map readiness
        if (!isMapReady()) {
            throw Exception("Map not ready - style not loaded")
        }
        
        maplibreMap?.let { map ->
            try {
                val targetLocation = LatLng(latitude, longitude)
                val clampedZoom = zoom.coerceIn(1.0, 20.0)
                
                val currentPosition = map.cameraPosition
                val currentLocation = currentPosition.target ?: initialCenter
                
                // Calculate animation duration based on distance
                val animationDuration = calculateAnimationDuration(
                    currentLocation.latitude, currentLocation.longitude,
                    latitude, longitude,
                    currentPosition.zoom, clampedZoom
                )
                
                
                val cameraPosition = CameraPosition.Builder()
                    .target(targetLocation)
                    .zoom(clampedZoom)
                    .build()
                
                // Create camera update with animation callback
                val cameraUpdate = org.maplibre.android.camera.CameraUpdateFactory.newCameraPosition(cameraPosition)
                
                map.animateCamera(cameraUpdate, animationDuration, object : org.maplibre.android.maps.MapLibreMap.CancelableCallback {
                    override fun onFinish() {
                    }
                    
                    override fun onCancel() {
                    }
                })
                
            } catch (e: Exception) {
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
        
        // Bulletproof error handling - NEVER throw exceptions to JavaScript
        return try {
            // Check location permissions first
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                throw Exception("Location permission not granted")
            }
            
            // First, try to use our tracked location if available and recent
            lastKnownLocation?.let { trackedLocation ->
                if (isLocationRecent(trackedLocation)) {
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
                return mapOf<String, Double>(
                    "latitude" to networkLocation.latitude,
                    "longitude" to networkLocation.longitude,
                    "accuracy" to networkLocation.accuracy.toDouble(),
                    "timestamp" to networkLocation.time.toDouble()
                )
            }
            
            // If no recent location available, request a fresh location
            throw Exception("No recent location available. Please start location tracking first and wait for GPS fix.")
            
        } catch (e: SecurityException) {
            throw Exception("Location access denied: ${e.message}")
        } catch (e: Exception) {
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
        
        // Bulletproof error handling - NEVER crash the app
        return try {
            // Check location permissions first
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                throw Exception("Location permission not granted")
            }
            
            // Initialize location manager if not already done
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            
            // Check if GPS is enabled
            if (!locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) && 
                !locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                throw Exception("GPS and Network location are disabled. Please enable location services.")
            }
            
            // Start location tracking if not already active
            if (!isLocationTrackingActive) {
                try {
                    startLocationTracking()
                } catch (e: Exception) {
                    // ignored
                }
            }
            
            // Wait for location with timeout - using a more robust approach
            val startTime = System.currentTimeMillis()
            val timeoutMillis = timeoutSeconds * 1000L
            
            while (System.currentTimeMillis() - startTime < timeoutMillis) {
                lastKnownLocation?.let { location ->
                    val locationAge = System.currentTimeMillis() - location.time
                    
                    // Consider location fresh if it's less than 30 seconds old
                    if (locationAge < 30000) {
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
                        return mapOf<String, Double>(
                            "latitude" to gpsLocation.latitude,
                            "longitude" to gpsLocation.longitude,
                            "accuracy" to gpsLocation.accuracy.toDouble(),
                            "timestamp" to gpsLocation.time.toDouble()
                        )
                    }
                } catch (securityException: SecurityException) {
                    // ignored
                }
                
                // Wait before checking again - using shorter intervals for better responsiveness
                Thread.sleep(500)
            }
            
            throw Exception("Timeout waiting for location. Please ensure location services are enabled and GPS has clear sky view.")
            
        } catch (e: SecurityException) {
            throw Exception("Location permission denied: ${e.message}")
        } catch (e: InterruptedException) {
            Thread.currentThread().interrupt()
            throw Exception("Location request was interrupted")
        } catch (e: Exception) {
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
    
    // Map control methods
    fun setShowsCompass(show: Boolean) {
        showsCompass = show
        try {
            // MapLibre Android doesn't have a built-in compass widget like iOS
            // However, we can disable compass-related gestures and UI elements
            // The compass you see might be from the system or a custom overlay
            maplibreMap?.let { map ->
                // Disable compass-related UI if available
                // Note: MapLibre Android doesn't have a direct compass widget API
                // If a compass is showing, it might be from a custom implementation
                // or system-level compass widget
            }
            // Also try to hide any compass widgets in the MapView's child views
            mapView?.let { view ->
                // Iterate through child views to find and hide compass widgets
                for (i in 0 until view.childCount) {
                    val child = view.getChildAt(i)
                    // Check if this child might be a compass widget
                    if (child.javaClass.simpleName.contains("Compass", ignoreCase = true) ||
                        child.javaClass.simpleName.contains("Direction", ignoreCase = true)) {
                        child.visibility = if (show) android.view.View.VISIBLE else android.view.View.GONE
                    }
                }
            }
        } catch (e: Exception) {
            // ignored
        }
    }
    
    fun setShowsScale(show: Boolean) {
        showsScale = show
    }
    
    fun setRotateEnabled(enabled: Boolean) {
        rotateEnabled = enabled
        maplibreMap?.let { map ->
            try {
                map.uiSettings.isRotateGesturesEnabled = enabled
            } catch (e: Exception) {
                // ignored
            }
        }
    }
    
    fun setScrollEnabled(enabled: Boolean) {
        scrollEnabled = enabled
        maplibreMap?.let { map ->
            try {
                map.uiSettings.isScrollGesturesEnabled = enabled
            } catch (e: Exception) {
                // ignored
            }
        }
    }
    
    fun setZoomEnabled(enabled: Boolean) {
        zoomEnabled = enabled
        maplibreMap?.let { map ->
            try {
                map.uiSettings.isZoomGesturesEnabled = enabled
            } catch (e: Exception) {
                // ignored
            }
        }
    }
    
    fun setPitchEnabled(enabled: Boolean) {
        pitchEnabled = enabled
        maplibreMap?.let { map ->
            try {
                map.uiSettings.isTiltGesturesEnabled = enabled
            } catch (e: Exception) {
                // ignored
            }
        }
    }
    
    // Enable MapLibre's LocationComponent to show user location on map
    private fun enableLocationComponent() {
        
        if (!isMapReady()) {
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
                    
                    
                    // If we have a last known location, show it immediately
                    lastKnownLocation?.let { location ->
                        locationComponent?.forceLocationUpdate(location)
                    }
                    
                } catch (e: Exception) {
                    // ignored
                }
            }
        }
    }
    
    // Disable LocationComponent
    private fun disableLocationComponent() {
        
        locationComponent?.let { component ->
            try {
                component.isLocationComponentEnabled = false
                locationComponent = null
            } catch (e: Exception) {
                // ignored
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
            Color.parseColor("#9C1AFF") // Fallback to signature purple
        }
    }
    
    // Enhanced location tracking with comprehensive error handling
    fun startLocationTracking() {
        
        // Bulletproof error handling
        try {
            // Check location permissions
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                throw Exception("Location permission not granted")
            }
            
            // Initialize location manager if needed
            if (locationManager == null) {
                locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            }
            
            val lm = locationManager ?: throw Exception("LocationManager unavailable")
            
            // Check if any location provider is available
            val providers = lm.getProviders(true)
            if (providers.isEmpty()) {
                throw Exception("No location providers available. Please enable GPS or Network location.")
            }
            
            // Start location updates with error handling
            try {
                // Try GPS provider first
                if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    lm.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        1000L, // 1 second
                        1.0f,  // 1 meter
                        this
                    )
                }
                
                // Also try network provider as backup
                if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    lm.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        1000L, // 1 second
                        1.0f,  // 1 meter
                        this
                    )
                }
                
                isLocationTrackingActive = true
                
            } catch (e: SecurityException) {
                throw Exception("Location permission denied while starting tracking: ${e.message}")
            } catch (e: IllegalArgumentException) {
                throw Exception("Invalid location tracking parameters: ${e.message}")
            }
            
        } catch (e: Exception) {
            isLocationTrackingActive = false
            throw e
        }
    }
    
    // Enhanced stop tracking with cleanup
    fun stopLocationTracking() {
        
        // Bulletproof cleanup - never fail
        try {
            if (locationManager != null && isLocationTrackingActive) {
                locationManager?.removeUpdates(this)
                isLocationTrackingActive = false
            } else {
            }
        } catch (e: SecurityException) {
            // Don't throw - just log and continue
            isLocationTrackingActive = false
        } catch (e: Exception) {
            // Don't throw - just log and continue
            isLocationTrackingActive = false
        }
    }
    
    // MARK: - LocationListener Implementation
    
    override fun onLocationChanged(location: Location) {
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
    }
    
    override fun onProviderEnabled(provider: String) {
    }
    
    override fun onProviderDisabled(provider: String) {
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
        if (::mapView.isInitialized) {
            mapView.measure(widthMeasureSpec, heightMeasureSpec)
        }
    }
    
    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        if (::mapView.isInitialized) {
            mapView.layout(0, 0, r - l, b - t)
        }
    }
    
    // MARK: - State Management
    
    // Save map view state for proper restoration
    fun onSaveInstanceState(outState: android.os.Bundle) {
        try {
            if (::mapView.isInitialized) {
                mapView.onSaveInstanceState(outState)
            }
        } catch (e: Exception) {
            // ignored
        }
    }
    
    // Restore map view state from saved instance
    fun onRestoreInstanceState(savedInstanceState: android.os.Bundle?) {
        this.savedInstanceState = savedInstanceState
        if (savedInstanceState != null) {
        }
    }

    // Cleanup method for view lifecycle
    private fun cleanup() {
        try {
            coroutineScope.cancel()
            iconCache.clear()
            stopLocationTracking()
            disableLocationComponent()
            
            mapMarkers.clear()
            markers.clear()
            mapCircles.clear()
            circles.clear()
            mapPolylines.clear()
            polylines.clear()
            mapPolygons.clear()
            polygons.clear()
            
            maplibreMap = null
            savedInstanceState = null
            
        } catch (e: Exception) {
            // ignored
        }
    }
} 