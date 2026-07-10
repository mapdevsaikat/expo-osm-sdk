import ExpoModulesCore
import MapLibre
import UIKit
import CoreLocation

// Enhanced native iOS map view using MapLibre GL Native
class OSMMapView: ExpoView, MLNMapViewDelegate, CLLocationManagerDelegate {
    // MapLibre map view
    var mapView: MLNMapView!
    
    // Location manager for GPS features
    var locationManager: CLLocationManager!
    private var lastKnownLocation: CLLocation?
    // Set while a requestLocationPermission() call is awaiting the user's
    // response to the system dialog; fired (and cleared) from
    // handleAuthorizationChange() once a determined status comes back.
    private var pendingPermissionCompletion: ((Bool) -> Void)?
    
    // Background (screen-off) tracking state. While active, every fix is also
    // buffered natively so points aren't lost while the JS runtime is
    // suspended; JS drains the buffer via getBufferedLocationFixes() when the
    // app returns to the foreground.
    private var isBackgroundTrackingActive = false
    private var bufferedFixes: [[String: Double]] = []
    private let bufferedFixesLock = NSLock()
    private let maxBufferedFixes = 10000
    
    // Configuration properties
    private var initialCenter: CLLocationCoordinate2D = CLLocationCoordinate2D(latitude: 0, longitude: 0)
    private var initialZoom: Double = 10
    private var initialPitch: Double = 0
    private var initialBearing: Double = 0
    private var tileServerUrl: String = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
    private var styleUrl: String? = nil
    private var isVectorStyle: Bool = true
    private var markers: [EnhancedMarkerData] = []
    private var polylines: [PolylineData] = []
    private var polygons: [PolygonData] = []
    private var circles: [CircleData] = []
    private var overlays: [OverlayData] = []
    
    // NotificationCenter observer tokens — stored for cleanup
    private var styleLoadObserver: NSObjectProtocol?
    private var styleFailObserver: NSObjectProtocol?
    
    // Map configuration
    private var showUserLocation: Bool = false
    private var followUserLocation: Bool = false
    private var userLocationTintColor: String = "#9C1AFF" // expo-osm-sdk signature purple
    private var userLocationAccuracyFillColor: String = "rgba(156, 26, 255, 0.2)"
    private var userLocationAccuracyBorderColor: String = "#9C1AFF"
    private var showsCompass: Bool = false
    private var showsScale: Bool = false
    private var rotateEnabled: Bool = true
    private var scrollEnabled: Bool = true
    private var zoomEnabled: Bool = true
    private var pitchEnabled: Bool = true
    
    // Clustering configuration
    private var clusteringEnabled: Bool = false
    private var clusterRadius: Double = 50
    private var clusterMaxZoom: Double = 15
    private var clusterMinPoints: Int = 2
    
    // Event emitters
    private let onMapReady = EventDispatcher()
    private let onRegionChange = EventDispatcher()
    private let onMarkerPress = EventDispatcher()
    private let onMarkerDragStart = EventDispatcher()
    private let onMarkerDrag = EventDispatcher()
    private let onMarkerDragEnd = EventDispatcher()
    private let onInfoWindowPress = EventDispatcher()
    private let onPress = EventDispatcher()
    private let onLongPress = EventDispatcher()
    private let onPolylinePress = EventDispatcher()
    private let onPolygonPress = EventDispatcher()
    private let onCirclePress = EventDispatcher()
    private let onOverlayPress = EventDispatcher()
    private let onUserLocationChange = EventDispatcher()
    
    // Enhanced data structures
    struct EnhancedMarkerData {
        let id: String
        let coordinate: CLLocationCoordinate2D
        let title: String?
        let description: String?
        let icon: MarkerIconData?
        let infoWindow: InfoWindowData?
        let animation: MarkerAnimationData?
        let zIndex: Int
        let draggable: Bool
        let opacity: Double
        let rotation: Double
        let visible: Bool
        let clustered: Bool
    }
    
    struct MarkerIconData {
        let uri: String?
        let name: String?
        let size: Double
        let color: String?
        let anchor: CGPoint
    }
    
    struct InfoWindowData {
        let title: String?
        let description: String?
        let backgroundColor: String?
        let borderColor: String?
        let borderRadius: Double
        let maxWidth: Double
    }
    
    struct MarkerAnimationData {
        let type: String
        let duration: Double
        let delay: Double
        let repeat: Bool
    }
    
    struct PolylineData {
        let id: String
        let coordinates: [CLLocationCoordinate2D]
        let strokeColor: String
        let strokeWidth: Double
        let strokeOpacity: Double
        let strokePattern: String
        let lineCap: String
        let lineJoin: String
        let zIndex: Int
        let visible: Bool
    }
    
    struct PolygonData {
        let id: String
        let coordinates: [CLLocationCoordinate2D]
        let holes: [[CLLocationCoordinate2D]]?
        let fillColor: String
        let fillOpacity: Double
        let strokeColor: String
        let strokeWidth: Double
        let strokeOpacity: Double
        let strokePattern: String
        let zIndex: Int
        let visible: Bool
    }
    
    struct CircleData {
        let id: String
        let center: CLLocationCoordinate2D
        let radius: Double
        let fillColor: String
        let fillOpacity: Double
        let strokeColor: String
        let strokeWidth: Double
        let strokeOpacity: Double
        let strokePattern: String
        let zIndex: Int
        let visible: Bool
    }
    
    struct OverlayData {
        let id: String
        let coordinate: CLLocationCoordinate2D
        let width: Double
        let height: Double
        let anchor: CGPoint
        let zIndex: Int
        let visible: Bool
    }
    
    // Enhanced setup the map view
    func setupMapView() {
        // Initialize MapLibre map view
        mapView = MLNMapView(frame: bounds)
        mapView.delegate = self
        mapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        // Set initial camera position with pitch and bearing
        let camera = MLNMapCamera(
            lookingAtCenter: initialCenter,
            altitude: mapView.altitude(forZoomLevel: initialZoom, atLatitude: initialCenter.latitude),
            pitch: CGFloat(initialPitch),
            heading: initialBearing
        )
        mapView.setCamera(camera, animated: false)
        
        // Configure map capabilities
        mapView.rotateEnabled = rotateEnabled
        mapView.scrollEnabled = scrollEnabled
        mapView.zoomEnabled = zoomEnabled
        mapView.pitchEnabled = pitchEnabled
        mapView.showsUserLocation = showUserLocation
        mapView.userTrackingMode = followUserLocation ? .follow : .none
        
        // Setup location manager
        setupLocationManager()
        
        // Add tile source
        setupTileSource()
        
        // Setup gesture recognizers
        setupGestureRecognizers()
        
        // Setup UI controls
        setupMapControls()
        
        // Add to view hierarchy
        addSubview(mapView)
        
        // Setup constraints
        mapView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            mapView.topAnchor.constraint(equalTo: topAnchor),
            mapView.leftAnchor.constraint(equalTo: leftAnchor),
            mapView.rightAnchor.constraint(equalTo: rightAnchor),
            mapView.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }
    
    // MARK: - iOS Compatibility Helpers
    
    // Get authorization status in a way compatible with iOS 13 and iOS 14+
    private func getLocationAuthorizationStatus() -> CLAuthorizationStatus {
        if #available(iOS 14.0, *) {
            // iOS 14+: Use instance method
            return locationManager?.authorizationStatus ?? .notDetermined
        } else {
            // iOS 13 and earlier: Use static method
            return CLLocationManager.authorizationStatus()
        }
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        initializeView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        initializeView()
    }
    
    deinit {
        if let obs = styleLoadObserver { NotificationCenter.default.removeObserver(obs) }
        if let obs = styleFailObserver { NotificationCenter.default.removeObserver(obs) }
        locationManager?.delegate = nil
        mapView?.delegate = nil
    }
    
    private func initializeView() {
        do {
            setupMapView()
        } catch {
        }
    }
    
    // Public method to check if map is ready for operations
    func isMapReady() -> Bool {
        let ready = mapView != nil && mapView.style != nil
        return ready
    }
    
    // Setup location manager for GPS features
    private func setupLocationManager() {
        locationManager = CLLocationManager()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 10.0
        
        // Request location permissions
        if CLLocationManager.locationServicesEnabled() {
            switch getLocationAuthorizationStatus() {
            case .notDetermined:
                locationManager.requestWhenInUseAuthorization()
            case .denied, .restricted:
                break
            case .authorizedWhenInUse, .authorizedAlways:
                if showUserLocation {
                    locationManager.startUpdatingLocation()
                }
            @unknown default:
                break
            }
        }
    }
    
    // Setup enhanced gesture recognizers
    private func setupGestureRecognizers() {
        // Tap gesture recognizer
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(mapTapped(_:)))
        tapGesture.numberOfTapsRequired = 1
        mapView.addGestureRecognizer(tapGesture)
        
        // Long press gesture recognizer
        let longPressGesture = UILongPressGestureRecognizer(target: self, action: #selector(mapLongPressed(_:)))
        longPressGesture.minimumPressDuration = 0.5
        mapView.addGestureRecognizer(longPressGesture)
    }
    
    // Setup map controls (compass, scale, etc.)
    private func setupMapControls() {
        // Compass
        if showsCompass {
            mapView.compassView.isHidden = false
            mapView.compassViewPosition = .topLeft
            mapView.compassViewMargins = CGPoint(x: 16, y: 64)
        } else {
            mapView.compassView.isHidden = true
        }
        
        // Scale bar - Note: MapLibre doesn't have built-in scale bar, would need custom implementation
        if showsScale {
            // Custom scale bar implementation would go here
            addCustomScaleBar()
        }
    }
    
    // Add custom scale bar
    private func addCustomScaleBar() {
        // Implementation for custom scale bar
        // This would create a UIView with scale markings
        // For now, we'll skip the detailed implementation
    }
    
    // Setup tile source
    private func setupTileSource() {
        // Check if this is a vector style URL (JSON) or raster tile template
        if isVectorStyleUrl(tileServerUrl) {
            // Use vector style
            setupVectorStyle()
        } else {
            // Use raster tiles (legacy support)
            setupRasterTiles()
        }
    }
    
    // Check if URL is a vector style (ends with .json or contains style.json)
    private func isVectorStyleUrl(_ url: String) -> Bool {
        return url.hasSuffix(".json") || url.contains("style.json") || url.contains("/styles/")
    }
    
    // Setup vector style from URL
    private func setupVectorStyle() {
        let vectorStyleUrl = styleUrl ?? tileServerUrl
        
        guard let url = URL(string: vectorStyleUrl) else {
            setupRasterTilesFallback()
            return
        }
        
        if let obs = styleLoadObserver { NotificationCenter.default.removeObserver(obs) }
        if let obs = styleFailObserver { NotificationCenter.default.removeObserver(obs) }
        
        styleLoadObserver = NotificationCenter.default.addObserver(
            forName: .MLNMapViewDidFinishLoadingStyle,
            object: mapView,
            queue: .main
        ) { [weak self] _ in
            guard let self = self else { return }
            if let style = self.mapView.style {
                let sourceIds = style.sources.map { $0.identifier }
                let layerIds = style.layers.map { $0.identifier }
            }
        }
        
        styleFailObserver = NotificationCenter.default.addObserver(
            forName: .MLNMapViewDidFailLoadingMap,
            object: mapView,
            queue: .main
        ) { [weak self] notification in
            guard let self = self else { return }
            if let error = notification.userInfo?[MLNMapViewDidFailLoadingMapErrorKey] as? NSError {
                self.setupRasterTilesFallback()
            }
        }
        
        mapView.styleURL = url
    }
    
    // Fallback raster tiles if vector style fails
    private func setupRasterTilesFallback() {
        
        // Remove existing sources and layers
        if let style = mapView.style {
            for source in style.sources {
                style.removeSource(source)
            }
        }
        
        // Create fallback raster tile source
        let fallbackTileSource = MLNRasterTileSource(
            identifier: "osm-fallback",
            tileURLTemplates: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            options: [
                .minimumZoomLevel: 0,
                .maximumZoomLevel: 18,
                .tileSize: 256,
                .attributionInfos: [
                    MLNAttributionInfo(title: NSAttributedString(string: "© OpenStreetMap contributors"), url: URL(string: "https://www.openstreetmap.org/copyright"))
                ]
            ]
        )
        
        // Create fallback raster layer
        let fallbackRasterLayer = MLNRasterStyleLayer(identifier: "osm-fallback-layer", source: fallbackTileSource)
        
        // Add source and layer to map
        mapView.style?.addSource(fallbackTileSource)
        mapView.style?.addLayer(fallbackRasterLayer)
        
    }
    
    // Setup raster tiles (fallback for legacy URLs)
    private func setupRasterTiles() {
        // Create tile source with raster tiles (existing implementation)
        let tileSource = MLNRasterTileSource(
            identifier: "osm-tiles",
            tileURLTemplates: [tileServerUrl],
            options: [
                .minimumZoomLevel: 0,
                .maximumZoomLevel: 18,
                .tileSize: 256,
                .attributionInfos: [
                    MLNAttributionInfo(title: NSAttributedString(string: "© OpenStreetMap contributors"), url: URL(string: "https://www.openstreetmap.org/copyright"))
                ]
            ]
        )
        
        // Create raster style layer
        let rasterLayer = MLNRasterStyleLayer(identifier: "osm-layer", source: tileSource)
        
        // Add source and layer to map
        mapView.style?.addSource(tileSource)
        mapView.style?.addLayer(rasterLayer)
    }
    
    // MARK: - Property Setters
    
    func setInitialCenter(_ center: [String: Double]) {
        if let lat = center["latitude"], let lng = center["longitude"] {
            initialCenter = CLLocationCoordinate2D(latitude: lat, longitude: lng)
            mapView?.centerCoordinate = initialCenter
        }
    }
    
    func setInitialZoom(_ zoom: Double) {
        initialZoom = zoom
        mapView?.zoomLevel = zoom
    }
    
    func setInitialPitch(_ pitch: Double) {
        initialPitch = max(0.0, min(pitch, 60.0))
        if let mapView = mapView {
            let camera = mapView.camera
            camera.pitch = CGFloat(initialPitch)
            mapView.setCamera(camera, animated: false)
        }
    }
    
    func setInitialBearing(_ bearing: Double) {
        var normalized = bearing.truncatingRemainder(dividingBy: 360.0)
        if normalized < 0 { normalized += 360.0 }
        initialBearing = normalized
        if let mapView = mapView {
            let camera = mapView.camera
            camera.heading = initialBearing
            mapView.setCamera(camera, animated: false)
        }
    }
    
    func setTileServerUrl(_ url: String) {
        tileServerUrl = url
        isVectorStyle = isVectorStyleUrl(url)
        // Recreate tile source with new URL
        if mapView != nil {
            setupTileSource()
        }
    }
    
    func setStyleUrl(_ url: String?) {
        styleUrl = url
        if mapView != nil && url != nil {
            setupTileSource()
        }
    }
    
    // Enhanced property setters
    func setShowUserLocation(_ show: Bool) {
        showUserLocation = show
        mapView?.showsUserLocation = show
        
        // Apply custom user location color
        if show {
            applyUserLocationTintColor()
        }
        
        if show && getLocationAuthorizationStatus() == .authorizedWhenInUse {
            locationManager?.startUpdatingLocation()
        } else {
            locationManager?.stopUpdatingLocation()
        }
    }
    
    func setUserLocationTintColor(_ color: String) {
        userLocationTintColor = color
        applyUserLocationTintColor()
    }
    
    func setUserLocationAccuracyFillColor(_ color: String) {
        userLocationAccuracyFillColor = color
        applyUserLocationTintColor()
    }
    
    func setUserLocationAccuracyBorderColor(_ color: String) {
        userLocationAccuracyBorderColor = color
        applyUserLocationTintColor()
    }
    
    // Apply user location custom colors
    private func applyUserLocationTintColor() {
        guard let mapView = mapView else { return }
        
        // Set tint color for user location marker
        if let tintColor = parseColor(userLocationTintColor) {
            mapView.tintColor = tintColor
        }
        
        // Note: MapLibre iOS doesn't provide direct API for accuracy circle colors
        // The accuracy circle will use the system default rendering
        // For full customization, we would need to implement a custom annotation view
    }
    
    // Helper to parse color strings
    private func parseColor(_ colorString: String) -> UIColor? {
        if colorString.hasPrefix("#") {
            // Parse hex color
            let hex = String(colorString.dropFirst())
            var rgbValue: UInt64 = 0
            Scanner(string: hex).scanHexInt64(&rgbValue)
            
            let r = CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0
            let g = CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0
            let b = CGFloat(rgbValue & 0x0000FF) / 255.0
            
            return UIColor(red: r, green: g, blue: b, alpha: 1.0)
        } else if colorString.hasPrefix("rgba") {
            // Parse rgba(r, g, b, a)
            let values = colorString
                .replacingOccurrences(of: "rgba(", with: "")
                .replacingOccurrences(of: ")", with: "")
                .split(separator: ",")
                .compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
            
            if values.count == 4 {
                return UIColor(
                    red: CGFloat(values[0]) / 255.0,
                    green: CGFloat(values[1]) / 255.0,
                    blue: CGFloat(values[2]) / 255.0,
                    alpha: CGFloat(values[3])
                )
            }
        } else if colorString.hasPrefix("rgb") {
            // Parse rgb(r, g, b)
            let values = colorString
                .replacingOccurrences(of: "rgb(", with: "")
                .replacingOccurrences(of: ")", with: "")
                .split(separator: ",")
                .compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
            
            if values.count == 3 {
                return UIColor(
                    red: CGFloat(values[0]) / 255.0,
                    green: CGFloat(values[1]) / 255.0,
                    blue: CGFloat(values[2]) / 255.0,
                    alpha: 1.0
                )
            }
        }
        
        // Default to signature purple if parsing fails
        return UIColor(red: 156/255.0, green: 26/255.0, blue: 255/255.0, alpha: 1.0)
    }
    
    func setFollowUserLocation(_ follow: Bool) {
        followUserLocation = follow
        mapView?.userTrackingMode = follow ? .follow : .none
    }
    
    func setShowsCompass(_ show: Bool) {
        showsCompass = show
        mapView?.compassView.isHidden = !show
    }
    
    func setShowsScale(_ show: Bool) {
        showsScale = show
        // Custom scale bar implementation
    }
    
    func setRotateEnabled(_ enabled: Bool) {
        rotateEnabled = enabled
        mapView?.rotateEnabled = enabled
    }
    
    func setScrollEnabled(_ enabled: Bool) {
        scrollEnabled = enabled
        mapView?.scrollEnabled = enabled
    }
    
    func setZoomEnabled(_ enabled: Bool) {
        zoomEnabled = enabled
        mapView?.zoomEnabled = enabled
    }
    
    func setPitchEnabled(_ enabled: Bool) {
        pitchEnabled = enabled
        mapView?.pitchEnabled = enabled
    }
    
    func setClustering(_ clusterData: [String: Any]) {
        clusteringEnabled = clusterData["enabled"] as? Bool ?? false
        clusterRadius = clusterData["radius"] as? Double ?? 50
        clusterMaxZoom = clusterData["maxZoom"] as? Double ?? 15
        clusterMinPoints = clusterData["minPoints"] as? Int ?? 2
        
        // Re-add markers with clustering if enabled
        addMarkersToMap()
    }
    
    func setMarkers(_ markersData: [[String: Any]]) {
        // Clear existing markers
        if let annotations = mapView?.annotations {
            mapView?.removeAnnotations(annotations)
        }
        
        // Parse enhanced markers with error handling
        markers = markersData.compactMap { data in
            guard let id = data["id"] as? String,
                  let coordinate = data["coordinate"] as? [String: Double],
                  let lat = coordinate["latitude"],
                  let lng = coordinate["longitude"] else {
                return nil
            }
            
            // Validate coordinate ranges
            guard lat >= -90.0 && lat <= 90.0 && lng >= -180.0 && lng <= 180.0 else {
                return nil
            }
            
            // Parse icon data
            var iconData: MarkerIconData?
            if let iconDict = data["icon"] as? [String: Any] {
                let anchor = iconDict["anchor"] as? [String: Double]
                iconData = MarkerIconData(
                    uri: iconDict["uri"] as? String,
                    name: iconDict["name"] as? String,
                    size: iconDict["size"] as? Double ?? 30,
                    color: iconDict["color"] as? String,
                    anchor: CGPoint(
                        x: anchor?["x"] ?? 0.5,
                        y: anchor?["y"] ?? 1.0
                    )
                )
            }
            
            // Parse info window data
            var infoWindowData: InfoWindowData?
            if let infoDict = data["infoWindow"] as? [String: Any] {
                infoWindowData = InfoWindowData(
                    title: infoDict["title"] as? String,
                    description: infoDict["description"] as? String,
                    backgroundColor: infoDict["backgroundColor"] as? String,
                    borderColor: infoDict["borderColor"] as? String,
                    borderRadius: infoDict["borderRadius"] as? Double ?? 8,
                    maxWidth: infoDict["maxWidth"] as? Double ?? 250
                )
            }
            
            // Parse animation data
            var animationData: MarkerAnimationData?
            if let animDict = data["animation"] as? [String: Any] {
                animationData = MarkerAnimationData(
                    type: animDict["type"] as? String ?? "bounce",
                    duration: animDict["duration"] as? Double ?? 1000,
                    delay: animDict["delay"] as? Double ?? 0,
                    repeat: animDict["repeat"] as? Bool ?? false
                )
            }
            
            return EnhancedMarkerData(
                id: id,
                coordinate: CLLocationCoordinate2D(latitude: lat, longitude: lng),
                title: data["title"] as? String,
                description: data["description"] as? String,
                icon: iconData,
                infoWindow: infoWindowData,
                animation: animationData,
                zIndex: data["zIndex"] as? Int ?? 0,
                draggable: data["draggable"] as? Bool ?? false,
                opacity: data["opacity"] as? Double ?? 1.0,
                rotation: data["rotation"] as? Double ?? 0.0,
                visible: data["visible"] as? Bool ?? true,
                clustered: data["clustered"] as? Bool ?? true
            )
        }
        
        // Add markers to map
        addMarkersToMap()
    }
    
    func setPolylines(_ polylinesData: [[String: Any]]) {
        // Clear existing polylines
        removeExistingPolylines()
        
        // Parse and add new polylines with validation
        polylines = polylinesData.compactMap { data in
            guard let id = data["id"] as? String,
                  let coordinatesData = data["coordinates"] as? [[String: Double]] else {
                return nil
            }
            
            let coordinates = coordinatesData.compactMap { coord -> CLLocationCoordinate2D? in
                guard let lat = coord["latitude"], let lng = coord["longitude"] else { return nil }
                
                // Validate coordinate ranges
                guard lat >= -90.0 && lat <= 90.0 && lng >= -180.0 && lng <= 180.0 else {
                    return nil
                }
                
                return CLLocationCoordinate2D(latitude: lat, longitude: lng)
            }
            
            // Ensure at least 2 coordinates
            guard coordinates.count >= 2 else {
                return nil
            }
            
            return PolylineData(
                id: id,
                coordinates: coordinates,
                strokeColor: data["strokeColor"] as? String ?? "#000000",
                strokeWidth: data["strokeWidth"] as? Double ?? 2,
                strokeOpacity: data["strokeOpacity"] as? Double ?? 1.0,
                strokePattern: data["strokePattern"] as? String ?? "solid",
                lineCap: data["lineCap"] as? String ?? "round",
                lineJoin: data["lineJoin"] as? String ?? "round",
                zIndex: data["zIndex"] as? Int ?? 0,
                visible: data["visible"] as? Bool ?? true
            )
        }
        
        addPolylinesToMap()
    }
    
    func setPolygons(_ polygonsData: [[String: Any]]) {
        // Clear existing polygons
        removeExistingPolygons()
        
        // Parse and add new polygons with validation
        polygons = polygonsData.compactMap { data in
            guard let id = data["id"] as? String,
                  let coordinatesData = data["coordinates"] as? [[String: Double]] else {
                return nil
            }
            
            let coordinates = coordinatesData.compactMap { coord -> CLLocationCoordinate2D? in
                guard let lat = coord["latitude"], let lng = coord["longitude"] else { return nil }
                
                // Validate coordinate ranges
                guard lat >= -90.0 && lat <= 90.0 && lng >= -180.0 && lng <= 180.0 else {
                    return nil
                }
                
                return CLLocationCoordinate2D(latitude: lat, longitude: lng)
            }
            
            // Ensure at least 3 coordinates for a valid polygon
            guard coordinates.count >= 3 else {
                return nil
            }
            
            // Parse holes if present
            var holes: [[CLLocationCoordinate2D]]?
            if let holesData = data["holes"] as? [[[String: Double]]] {
                holes = holesData.map { holeData in
                    return holeData.compactMap { coord -> CLLocationCoordinate2D? in
                        guard let lat = coord["latitude"], let lng = coord["longitude"] else { return nil }
                        
                        // Validate coordinate ranges for holes
                        guard lat >= -90.0 && lat <= 90.0 && lng >= -180.0 && lng <= 180.0 else {
                            return nil
                        }
                        
                        return CLLocationCoordinate2D(latitude: lat, longitude: lng)
                    }
                }
            }
            
            return PolygonData(
                id: id,
                coordinates: coordinates,
                holes: holes,
                fillColor: data["fillColor"] as? String ?? "#000000",
                fillOpacity: data["fillOpacity"] as? Double ?? 0.3,
                strokeColor: data["strokeColor"] as? String ?? "#000000",
                strokeWidth: data["strokeWidth"] as? Double ?? 2,
                strokeOpacity: data["strokeOpacity"] as? Double ?? 1.0,
                strokePattern: data["strokePattern"] as? String ?? "solid",
                zIndex: data["zIndex"] as? Int ?? 0,
                visible: data["visible"] as? Bool ?? true
            )
        }
        
        addPolygonsToMap()
    }
    
    func setCircles(_ circlesData: [[String: Any]]) {
        // Clear existing circles
        removeExistingCircles()
        
        // Parse and add new circles with validation
        circles = circlesData.compactMap { data in
            guard let id = data["id"] as? String,
                  let centerData = data["center"] as? [String: Double],
                  let lat = centerData["latitude"],
                  let lng = centerData["longitude"],
                  let radius = data["radius"] as? Double else {
                return nil
            }
            
            // Validate coordinate ranges and radius
            guard lat >= -90.0 && lat <= 90.0 && lng >= -180.0 && lng <= 180.0 else {
                return nil
            }
            guard radius > 0 else {
                return nil
            }
            
            return CircleData(
                id: id,
                center: CLLocationCoordinate2D(latitude: lat, longitude: lng),
                radius: radius,
                fillColor: data["fillColor"] as? String ?? "#000000",
                fillOpacity: data["fillOpacity"] as? Double ?? 0.3,
                strokeColor: data["strokeColor"] as? String ?? "#000000",
                strokeWidth: data["strokeWidth"] as? Double ?? 2,
                strokeOpacity: data["strokeOpacity"] as? Double ?? 1.0,
                strokePattern: data["strokePattern"] as? String ?? "solid",
                zIndex: data["zIndex"] as? Int ?? 0,
                visible: data["visible"] as? Bool ?? true
            )
        }
        
        addCirclesToMap()
    }
    
    // Enhanced add markers to map with custom icons and animations
    private func addMarkersToMap() {
        for marker in markers {
            guard marker.visible else { continue }
            
            let annotation = CustomMarkerAnnotation()
            annotation.coordinate = marker.coordinate
            annotation.title = marker.title
            annotation.subtitle = marker.description
            annotation.markerId = marker.id
            annotation.markerData = marker
            
            mapView?.addAnnotation(annotation)
            
            // Apply marker animation if specified
            if let animation = marker.animation {
                DispatchQueue.main.asyncAfter(deadline: .now() + animation.delay / 1000.0) {
                    self.animateMarker(annotation, with: animation)
                }
            }
        }
    }
    
    // Add polylines to map
    private func addPolylinesToMap() {
        for polyline in polylines {
            guard polyline.visible && polyline.coordinates.count >= 2 else { continue }
            
            let coordinates = polyline.coordinates
            let polylineFeature = MLNPolylineFeature(coordinates: coordinates, count: UInt(coordinates.count))
            polylineFeature.identifier = polyline.id
            
            // Create source and layer for polyline
            let source = MLNShapeSource(identifier: "polyline-\(polyline.id)", shape: polylineFeature, options: nil)
            let layer = MLNLineStyleLayer(identifier: "polyline-layer-\(polyline.id)", source: source)
            
            // Configure line style
            layer.lineColor = NSExpression(forConstantValue: UIColor.from(hex: polyline.strokeColor))
            layer.lineWidth = NSExpression(forConstantValue: polyline.strokeWidth)
            layer.lineOpacity = NSExpression(forConstantValue: polyline.strokeOpacity)
            
            // Add to map
            mapView?.style?.addSource(source)
            mapView?.style?.addLayer(layer)
        }
    }
    
    // Add polygons to map
    private func addPolygonsToMap() {
        for polygon in polygons {
            guard polygon.visible && polygon.coordinates.count >= 3 else { continue }
            
            let coordinates = polygon.coordinates
            let polygonFeature = MLNPolygonFeature(coordinates: coordinates, count: UInt(coordinates.count))
            polygonFeature.identifier = polygon.id
            
            // Handle holes if present
            if let holes = polygon.holes, !holes.isEmpty {
                var interiorPolygons: [MLNPolygon] = []
                for hole in holes {
                    if hole.count >= 3 {
                        let holePolygon = MLNPolygon(coordinates: hole, count: UInt(hole.count))
                        interiorPolygons.append(holePolygon)
                    }
                }
                
                if !interiorPolygons.isEmpty {
                    let polygonWithHoles = MLNPolygon(coordinates: coordinates, count: UInt(coordinates.count), interiorPolygons: interiorPolygons)
                    polygonFeature = MLNPolygonFeature(polygon: polygonWithHoles)
                    polygonFeature.identifier = polygon.id
                }
            }
            
            // Create source and layers for polygon
            let source = MLNShapeSource(identifier: "polygon-\(polygon.id)", shape: polygonFeature, options: nil)
            
            // Fill layer
            let fillLayer = MLNFillStyleLayer(identifier: "polygon-fill-\(polygon.id)", source: source)
            fillLayer.fillColor = NSExpression(forConstantValue: UIColor.from(hex: polygon.fillColor))
            fillLayer.fillOpacity = NSExpression(forConstantValue: polygon.fillOpacity)
            
            // Stroke layer
            let strokeLayer = MLNLineStyleLayer(identifier: "polygon-stroke-\(polygon.id)", source: source)
            strokeLayer.lineColor = NSExpression(forConstantValue: UIColor.from(hex: polygon.strokeColor))
            strokeLayer.lineWidth = NSExpression(forConstantValue: polygon.strokeWidth)
            strokeLayer.lineOpacity = NSExpression(forConstantValue: polygon.strokeOpacity)
            
            // Add to map
            mapView?.style?.addSource(source)
            mapView?.style?.addLayer(fillLayer)
            mapView?.style?.addLayer(strokeLayer)
        }
    }
    
    // Add circles to map
    private func addCirclesToMap() {
        for circle in circles {
            guard circle.visible else { continue }
            
            // Create circle polygon approximation
            let circlePolygon = createCirclePolygon(center: circle.center, radius: circle.radius)
            let circleFeature = MLNPolygonFeature(polygon: circlePolygon)
            circleFeature.identifier = circle.id
            
            // Create source and layers
            let source = MLNShapeSource(identifier: "circle-\(circle.id)", shape: circleFeature, options: nil)
            
            // Fill layer
            let fillLayer = MLNFillStyleLayer(identifier: "circle-fill-\(circle.id)", source: source)
            fillLayer.fillColor = NSExpression(forConstantValue: UIColor.from(hex: circle.fillColor))
            fillLayer.fillOpacity = NSExpression(forConstantValue: circle.fillOpacity)
            
            // Stroke layer
            let strokeLayer = MLNLineStyleLayer(identifier: "circle-stroke-\(circle.id)", source: source)
            strokeLayer.lineColor = NSExpression(forConstantValue: UIColor.from(hex: circle.strokeColor))
            strokeLayer.lineWidth = NSExpression(forConstantValue: circle.strokeWidth)
            strokeLayer.lineOpacity = NSExpression(forConstantValue: circle.strokeOpacity)
            
            // Add to map
            mapView?.style?.addSource(source)
            mapView?.style?.addLayer(fillLayer)
            mapView?.style?.addLayer(strokeLayer)
        }
    }
    
    // Helper method to create circle polygon
    private func createCirclePolygon(center: CLLocationCoordinate2D, radius: Double) -> MLNPolygon {
        let numberOfSides = 64
        var coordinates: [CLLocationCoordinate2D] = []
        
        for i in 0..<numberOfSides {
            let angle = Double(i) * 2.0 * .pi / Double(numberOfSides)
            let lat = center.latitude + (radius / 111320.0) * cos(angle)
            let lng = center.longitude + (radius / (111320.0 * cos(center.latitude * .pi / 180.0))) * sin(angle)
            coordinates.append(CLLocationCoordinate2D(latitude: lat, longitude: lng))
        }
        
        return MLNPolygon(coordinates: coordinates, count: UInt(coordinates.count))
    }
    
    // Removal methods for overlays
    private func removeExistingPolylines() {
        guard let style = mapView?.style else { return }
        
        for polyline in polylines {
            style.removeLayer(withIdentifier: "polyline-layer-\(polyline.id)")
            style.removeSource(withIdentifier: "polyline-\(polyline.id)")
        }
    }
    
    private func removeExistingPolygons() {
        guard let style = mapView?.style else { return }
        
        for polygon in polygons {
            style.removeLayer(withIdentifier: "polygon-fill-\(polygon.id)")
            style.removeLayer(withIdentifier: "polygon-stroke-\(polygon.id)")
            style.removeSource(withIdentifier: "polygon-\(polygon.id)")
        }
    }
    
    private func removeExistingCircles() {
        guard let style = mapView?.style else { return }
        
        for circle in circles {
            style.removeLayer(withIdentifier: "circle-fill-\(circle.id)")
            style.removeLayer(withIdentifier: "circle-stroke-\(circle.id)")
            style.removeSource(withIdentifier: "circle-\(circle.id)")
        }
    }
    
    // Marker animation method
    private func animateMarker(_ annotation: MLNAnnotation, with animation: MarkerAnimationData) {
        guard let annotationView = mapView?.view(for: annotation) else { return }
        
        let duration = animation.duration / 1000.0
        
        switch animation.type {
        case "bounce":
            UIView.animate(withDuration: duration, delay: 0, usingSpringWithDamping: 0.3, initialSpringVelocity: 0.8, options: [], animations: {
                annotationView.transform = CGAffineTransform(scaleX: 1.2, y: 1.2)
            }) { _ in
                UIView.animate(withDuration: duration / 2) {
                    annotationView.transform = CGAffineTransform.identity
                }
            }
            
        case "pulse":
            let pulseAnimation = {
                UIView.animate(withDuration: duration / 2, animations: {
                    annotationView.alpha = 0.3
                }) { _ in
                    UIView.animate(withDuration: duration / 2) {
                        annotationView.alpha = 1.0
                    }
                }
            }
            
            pulseAnimation()
            if animation.repeat {
                Timer.scheduledTimer(withTimeInterval: duration, repeats: true) { _ in
                    pulseAnimation()
                }
            }
            
        case "fade":
            annotationView.alpha = 0
            UIView.animate(withDuration: duration) {
                annotationView.alpha = 1.0
            }
            
        case "scale":
            annotationView.transform = CGAffineTransform(scaleX: 0.1, y: 0.1)
            UIView.animate(withDuration: duration, delay: 0, usingSpringWithDamping: 0.7, initialSpringVelocity: 0.5, options: [], animations: {
                annotationView.transform = CGAffineTransform.identity
            })
            
        case "drop":
            let originalCenter = annotationView.center
            annotationView.center = CGPoint(x: originalCenter.x, y: originalCenter.y - 100)
            UIView.animate(withDuration: duration, delay: 0, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.5, options: [], animations: {
                annotationView.center = originalCenter
            })
            
        default:
            break
        }
    }
    
    // MARK: - Enhanced Gesture Handlers
    
    @objc private func mapTapped(_ gesture: UITapGestureRecognizer) {
        let point = gesture.location(in: mapView)
        let coordinate = mapView.convert(point, toCoordinateFrom: mapView)
        
        // Check if tap hit any overlays first
        if checkOverlayTap(at: point, coordinate: coordinate) {
            return
        }
        
        onPress([
            "coordinate": [
                "latitude": coordinate.latitude,
                "longitude": coordinate.longitude
            ]
        ])
    }
    
    @objc private func mapLongPressed(_ gesture: UILongPressGestureRecognizer) {
        guard gesture.state == .began else { return }
        
        let point = gesture.location(in: mapView)
        let coordinate = mapView.convert(point, toCoordinateFrom: mapView)
        
        onLongPress([
            "coordinate": [
                "latitude": coordinate.latitude,
                "longitude": coordinate.longitude
            ]
        ])
    }
    
    // Check if tap hit any overlays
    private func checkOverlayTap(at point: CGPoint, coordinate: CLLocationCoordinate2D) -> Bool {
        // Check polylines
        for polyline in polylines {
            if isPointNearPolyline(point: coordinate, polyline: polyline, tolerance: 20) {
                onPolylinePress([
                    "polylineId": polyline.id,
                    "coordinate": [
                        "latitude": coordinate.latitude,
                        "longitude": coordinate.longitude
                    ]
                ])
                return true
            }
        }
        
        // Check polygons
        for polygon in polygons {
            if isPointInsidePolygon(point: coordinate, polygon: polygon) {
                onPolygonPress([
                    "polygonId": polygon.id,
                    "coordinate": [
                        "latitude": coordinate.latitude,
                        "longitude": coordinate.longitude
                    ]
                ])
                return true
            }
        }
        
        // Check circles
        for circle in circles {
            if isPointInsideCircle(point: coordinate, circle: circle) {
                onCirclePress([
                    "circleId": circle.id,
                    "coordinate": [
                        "latitude": coordinate.latitude,
                        "longitude": coordinate.longitude
                    ]
                ])
                return true
            }
        }
        
        return false
    }
    
    // Geometric helper methods
    private func isPointNearPolyline(point: CLLocationCoordinate2D, polyline: PolylineData, tolerance: Double) -> Bool {
        for i in 0..<(polyline.coordinates.count - 1) {
            let start = polyline.coordinates[i]
            let end = polyline.coordinates[i + 1]
            
            let distance = distanceFromPointToLineSegment(
                point: point,
                lineStart: start,
                lineEnd: end
            )
            
            if distance < tolerance {
                return true
            }
        }
        return false
    }
    
    private func isPointInsidePolygon(point: CLLocationCoordinate2D, polygon: PolygonData) -> Bool {
        // Ray casting algorithm
        let coordinates = polygon.coordinates
        var inside = false
        
        var j = coordinates.count - 1
        for i in 0..<coordinates.count {
            let xi = coordinates[i].longitude
            let yi = coordinates[i].latitude
            let xj = coordinates[j].longitude
            let yj = coordinates[j].latitude
            
            if ((yi > point.latitude) != (yj > point.latitude)) &&
               (point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi) + xi) {
                inside = !inside
            }
            j = i
        }
        
        return inside
    }
    
    private func isPointInsideCircle(point: CLLocationCoordinate2D, circle: CircleData) -> Bool {
        let distance = distanceBetweenCoordinates(point, circle.center)
        return distance <= circle.radius
    }
    
    private func distanceFromPointToLineSegment(point: CLLocationCoordinate2D, lineStart: CLLocationCoordinate2D, lineEnd: CLLocationCoordinate2D) -> Double {
        // Simplified distance calculation for demonstration
        // In a real implementation, you'd use proper geographic distance calculations
        let A = point.latitude - lineStart.latitude
        let B = point.longitude - lineStart.longitude
        let C = lineEnd.latitude - lineStart.latitude
        let D = lineEnd.longitude - lineStart.longitude
        
        let dot = A * C + B * D
        let lenSq = C * C + D * D
        
        if lenSq == 0 {
            return sqrt(A * A + B * B)
        }
        
        let param = dot / lenSq
        
        let xx: Double
        let yy: Double
        
        if param < 0 {
            xx = lineStart.latitude
            yy = lineStart.longitude
        } else if param > 1 {
            xx = lineEnd.latitude
            yy = lineEnd.longitude
        } else {
            xx = lineStart.latitude + param * C
            yy = lineStart.longitude + param * D
        }
        
        let dx = point.latitude - xx
        let dy = point.longitude - yy
        
        return sqrt(dx * dx + dy * dy) * 111320.0 // Convert to meters approximately
    }
    
    private func distanceBetweenCoordinates(_ coord1: CLLocationCoordinate2D, _ coord2: CLLocationCoordinate2D) -> Double {
        let location1 = CLLocation(latitude: coord1.latitude, longitude: coord1.longitude)
        let location2 = CLLocation(latitude: coord2.latitude, longitude: coord2.longitude)
        return location1.distance(from: location2)
    }
    
    // MARK: - Enhanced MLNMapViewDelegate
    
    func mapView(_ mapView: MLNMapView, didFinishLoading style: MLNStyle) {
        // Map is ready - add all overlays
        addPolylinesToMap()
        addPolygonsToMap()
        addCirclesToMap()
        
        onMapReady([:])
    }
    
    private func emitRegionChange() {
        let region = mapView.visibleCoordinateBounds
        let center = mapView.centerCoordinate

        onRegionChange([
            "latitude": center.latitude,
            "longitude": center.longitude,
            "latitudeDelta": region.ne.latitude - region.sw.latitude,
            "longitudeDelta": region.ne.longitude - region.sw.longitude,
            "bearing": mapView.camera.heading,
            "pitch": Double(mapView.camera.pitch)
        ])
    }

    func mapView(_ mapView: MLNMapView, regionIsChangingWith reason: MLNCameraChangeReason) {
        emitRegionChange()
    }

    func mapView(_ mapView: MLNMapView, regionDidChangeAnimated animated: Bool) {
        emitRegionChange()
    }
    
    func mapView(_ mapView: MLNMapView, didSelect annotation: MLNAnnotation) {
        // Enhanced marker selection handling
        if let customAnnotation = annotation as? CustomMarkerAnnotation {
            onMarkerPress([
                "markerId": customAnnotation.markerId,
                "coordinate": [
                    "latitude": annotation.coordinate.latitude,
                    "longitude": annotation.coordinate.longitude
                ]
            ])
            
            // Show custom info window if configured
            if let markerData = customAnnotation.markerData,
               let infoWindow = markerData.infoWindow {
                showCustomInfoWindow(for: customAnnotation, with: infoWindow)
            }
        }
    }
    
    func mapView(_ mapView: MLNMapView, viewFor annotation: MLNAnnotation) -> MLNAnnotationView? {
        guard let customAnnotation = annotation as? CustomMarkerAnnotation,
              let markerData = customAnnotation.markerData else {
            return nil
        }
        
        let identifier = "CustomMarker"
        var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: identifier) as? CustomMarkerAnnotationView
        
        if annotationView == nil {
            annotationView = CustomMarkerAnnotationView(annotation: annotation, reuseIdentifier: identifier)
        }
        
        annotationView?.annotation = annotation
        annotationView?.configureWith(markerData: markerData)
        
        return annotationView
    }
    
    // Custom info window display
    private func showCustomInfoWindow(for annotation: CustomMarkerAnnotation, with infoWindow: InfoWindowData) {
        // Create and display custom info window
        let infoWindowView = CustomInfoWindowView()
        infoWindowView.configureWith(infoWindow: infoWindow, markerId: annotation.markerId)
        infoWindowView.onPress = { [weak self] markerId in
            self?.onInfoWindowPress(["markerId": markerId])
        }
        
        // Position info window above marker
        if let annotationView = mapView.view(for: annotation),
           let parentView = annotationView.superview {
            parentView.addSubview(infoWindowView)
            infoWindowView.showAbove(view: annotationView)
        }
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        // Ignore stale cached fixes delivered on first startUpdatingLocation callback
        guard isLocationFresh(location) else { return }

        // Store the fresh location data
        lastKnownLocation = location
        
        // While background tracking is active, buffer natively too — the JS
        // runtime is suspended in the background, so the event below would be
        // lost. JS drains the buffer when the app becomes active again.
        if isBackgroundTrackingActive {
            bufferLocationFix(location)
        }
        
        let coordinate = location.coordinate
        onUserLocationChange([
            "latitude": coordinate.latitude,
            "longitude": coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "altitude": location.altitude,
            "heading": location.course,
            "speed": location.speed,
            "timestamp": location.timestamp.timeIntervalSince1970 * 1000
        ])
        
        // Update map location if following user
        if followUserLocation {
            mapView?.setCenter(coordinate, animated: true)
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    }
    
    // iOS 14+ delegate method for authorization changes
    @available(iOS 14.0, *)
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        handleAuthorizationChange(status: manager.authorizationStatus)
    }
    
    // iOS 13 and earlier delegate method (deprecated in iOS 14)
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        if #available(iOS 14.0, *) {
            // On iOS 14+, this won't be called, use locationManagerDidChangeAuthorization instead
        } else {
            // iOS 13 and earlier: Handle authorization change
            handleAuthorizationChange(status: status)
        }
    }
    
    // Common handler for authorization changes (works on all iOS versions)
    private func handleAuthorizationChange(status: CLAuthorizationStatus) {
        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
            if showUserLocation {
                locationManager.startUpdatingLocation()
            }
        case .denied, .restricted:
            locationManager.stopUpdatingLocation()
        default:
            break
        }

        // Resolve any in-flight requestLocationPermission() call once the
        // user has actually made a choice (never on .notDetermined).
        if status != .notDetermined, let completion = pendingPermissionCompletion {
            pendingPermissionCompletion = nil
            completion(status == .authorizedWhenInUse || status == .authorizedAlways)
        }
    }

    // MARK: - Location Permission (explicit, JS-triggerable)

    /// Requests the "when in use" location permission, mirroring the
    /// Android `requestLocationPermission()` module function so JS callers
    /// don't need platform branches. Resolves immediately if the user has
    /// already made a choice; otherwise triggers the system dialog and
    /// resolves once `handleAuthorizationChange` observes the result.
    func requestLocationPermission(completion: @escaping (Bool) -> Void) {
        let status = getLocationAuthorizationStatus()
        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
            completion(true)
        case .denied, .restricted:
            completion(false)
        case .notDetermined:
            pendingPermissionCompletion = completion
            locationManager.requestWhenInUseAuthorization()
        @unknown default:
            completion(false)
        }
    }
    
    // MARK: - Layout
    
    override func layoutSubviews() {
        super.layoutSubviews()
        mapView?.frame = bounds
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        if traitCollection.verticalSizeClass != previousTraitCollection?.verticalSizeClass ||
            traitCollection.horizontalSizeClass != previousTraitCollection?.horizontalSizeClass {
            setNeedsLayout()
            layoutIfNeeded()
        }
    }
    
    // MARK: - Zoom Controls (Native Functions)
    
    func zoomIn() {
        
        guard let mapView = mapView else {
            throw NSError(domain: "OSMMapView", code: 1, userInfo: [NSLocalizedDescriptionKey: "Map view not initialized"])
        }
        
        do {
            let currentZoom = mapView.zoomLevel
            let newZoom = min(currentZoom + 1.0, 20.0)
            mapView.setZoomLevel(newZoom, animated: true)
        } catch {
            throw error
        }
    }
    
    func zoomOut() {
        
        guard let mapView = mapView else {
            throw NSError(domain: "OSMMapView", code: 1, userInfo: [NSLocalizedDescriptionKey: "Map view not initialized"])
        }
        
        do {
            let currentZoom = mapView.zoomLevel
            let newZoom = max(currentZoom - 1.0, 1.0)
            mapView.setZoomLevel(newZoom, animated: true)
        } catch {
            throw error
        }
    }
    
    func setZoom(_ zoom: Double) {
        
        guard let mapView = mapView else {
            throw NSError(domain: "OSMMapView", code: 1, userInfo: [NSLocalizedDescriptionKey: "Map view not initialized"])
        }
        
        do {
            let clampedZoom = max(1.0, min(zoom, 20.0))
            mapView.setZoomLevel(clampedZoom, animated: true)
        } catch {
            throw error
        }
    }
    
    // MARK: - Camera Orientation Controls
    
    func setPitch(_ pitch: Double) {
        
        guard let mapView = mapView else {
            throw NSError(domain: "OSMMapView", code: 1, userInfo: [NSLocalizedDescriptionKey: "Map view not initialized"])
        }
        
        do {
            // Clamp pitch between 0 and 60 degrees (MapLibre standard)
            let clampedPitch = max(0.0, min(pitch, 60.0))
            
            let camera = mapView.camera
            camera.pitch = CGFloat(clampedPitch)
            mapView.setCamera(camera, animated: true)
            
        } catch {
            throw error
        }
    }
    
    func setBearing(_ bearing: Double) {
        
        guard let mapView = mapView else {
            throw NSError(domain: "OSMMapView", code: 1, userInfo: [NSLocalizedDescriptionKey: "Map view not initialized"])
        }
        
        do {
            // Normalize bearing to 0-360 degrees
            var normalizedBearing = bearing.truncatingRemainder(dividingBy: 360.0)
            if normalizedBearing < 0 {
                normalizedBearing += 360.0
            }
            
            let camera = mapView.camera
            camera.heading = normalizedBearing
            mapView.setCamera(camera, animated: true)
            
        } catch {
            throw error
        }
    }
    
    func getPitch() -> Double {
        
        guard let mapView = mapView else {
            return 0.0
        }
        
        let pitch = Double(mapView.camera.pitch)
        return pitch
    }
    
    func getBearing() -> Double {
        
        guard let mapView = mapView else {
            return 0.0
        }
        
        let bearing = mapView.camera.heading
        return bearing
    }

    func takeSnapshot(format: String, quality: Double, completion: @escaping (Result<String, Error>) -> Void) {
        guard isMapReady(), let mapView = mapView else {
            completion(.failure(NSError(
                domain: "OSMMapView",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Map not ready - style not loaded"]
            )))
            return
        }

        mapView.snapshot { image in
            guard let image = image else {
                completion(.failure(NSError(
                    domain: "OSMMapView",
                    code: 2,
                    userInfo: [NSLocalizedDescriptionKey: "Snapshot returned nil"]
                )))
                return
            }

            let normalizedFormat = format.lowercased()
            let useJpeg = normalizedFormat == "jpg" || normalizedFormat == "jpeg"
            let mimeType = useJpeg ? "image/jpeg" : "image/png"
            let clampedQuality = CGFloat(max(0.0, min(1.0, quality)))

            let imageData: Data?
            if useJpeg {
                imageData = image.jpegData(compressionQuality: clampedQuality)
            } else {
                imageData = image.pngData()
            }

            guard let data = imageData else {
                completion(.failure(NSError(
                    domain: "OSMMapView",
                    code: 3,
                    userInfo: [NSLocalizedDescriptionKey: "Failed to encode snapshot"]
                )))
                return
            }

            let base64 = data.base64EncodedString()
            completion(.success("data:\(mimeType);base64,\(base64)"))
        }
    }
    
    func animateCamera(
        latitude: Double?,
        longitude: Double?,
        zoom: Double?,
        pitch: Double?,
        bearing: Double?,
        duration: Double?
    ) {
        
        guard let mapView = mapView else {
            throw NSError(domain: "OSMMapView", code: 1, userInfo: [NSLocalizedDescriptionKey: "Map view not initialized"])
        }
        
        do {
            let currentCamera = mapView.camera
            
            // Use provided values or keep current
            let targetCenter: CLLocationCoordinate2D
            if let lat = latitude, let lng = longitude {
                // Validate coordinates if provided
                guard isValidCoordinate(latitude: lat, longitude: lng) else {
                    throw NSError(domain: "OSMMapView", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid coordinates"])
                }
                targetCenter = CLLocationCoordinate2D(latitude: lat, longitude: lng)
            } else {
                targetCenter = currentCamera.centerCoordinate
            }
            
            let targetZoom = zoom.map { max(1.0, min($0, 20.0)) } ?? mapView.zoomLevel
            let targetPitch = pitch.map { CGFloat(max(0.0, min($0, 60.0))) } ?? currentCamera.pitch
            let targetBearing: Double
            if let bear = bearing {
                var normalized = bear.truncatingRemainder(dividingBy: 360.0)
                if normalized < 0 { normalized += 360.0 }
                targetBearing = normalized
            } else {
                targetBearing = currentCamera.heading
            }
            
            let animDuration = duration ?? 1.0
            
            
            // Create new camera with all parameters
            let newCamera = MLNMapCamera(
                lookingAtCenter: targetCenter,
                altitude: currentCamera.altitude,
                pitch: targetPitch,
                heading: targetBearing
            )
            
            UIView.animate(withDuration: animDuration, delay: 0, options: [.curveEaseInOut], animations: {
                mapView.setCenter(targetCenter, zoomLevel: targetZoom, animated: false)
                mapView.setCamera(newCamera, animated: false)
            }) { completed in
                if completed {
                } else {
                }
            }
            
        } catch {
            throw error
        }
    }
    
    // MARK: - Location Controls (Native Functions)
    
    func animateToLocation(latitude: Double, longitude: Double, zoom: Double? = nil) {
        
        // Validate coordinates
        guard isValidCoordinate(latitude: latitude, longitude: longitude) else {
            throw NSError(domain: "OSMMapView", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180"])
        }
        
        guard let mapView = mapView else {
            throw NSError(domain: "OSMMapView", code: 1, userInfo: [NSLocalizedDescriptionKey: "Map view not initialized"])
        }
        
        do {
            let targetCoordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            let currentCoordinate = mapView.centerCoordinate
            let currentZoom = mapView.zoomLevel
            let targetZoom = zoom ?? currentZoom
            let clampedZoom = max(1.0, min(targetZoom, 20.0))
            
            // Calculate animation duration based on distance
            let animationDuration = calculateAnimationDuration(
                from: currentCoordinate, to: targetCoordinate,
                fromZoom: currentZoom, toZoom: clampedZoom
            )
            
            
            // Perform the animation with calculated duration
            UIView.animate(withDuration: animationDuration, delay: 0, options: [.curveEaseInOut], animations: {
                mapView.setCenter(targetCoordinate, zoomLevel: clampedZoom, animated: false)
            }) { completed in
                if completed {
                } else {
                }
            }
            
        } catch {
            throw error
        }
    }
    
    func getCurrentLocation() throws -> [String: Double] {
        
        // Bulletproof error handling - NEVER crash the app
        do {
            guard let locationManager = locationManager else {
                throw NSError(domain: "OSMMapView", code: 3, userInfo: [NSLocalizedDescriptionKey: "Location manager not initialized"])
            }
            
            let authStatus = getLocationAuthorizationStatus()
            
            switch authStatus {
            case .authorizedWhenInUse, .authorizedAlways:
                // First, try to use our tracked location if available and recent
                if let trackedLocation = lastKnownLocation,
                   isLocationFresh(trackedLocation) {
                    let coordinate = trackedLocation.coordinate
                    return [
                        "latitude": coordinate.latitude,
                        "longitude": coordinate.longitude,
                        "accuracy": trackedLocation.horizontalAccuracy,
                        "timestamp": trackedLocation.timestamp.timeIntervalSince1970
                    ]
                }
                
                // Fallback to system location manager
                if let lastLocation = locationManager.location,
                   isLocationFresh(lastLocation) {
                    let coordinate = lastLocation.coordinate
                    return [
                        "latitude": coordinate.latitude,
                        "longitude": coordinate.longitude,
                        "accuracy": lastLocation.horizontalAccuracy,
                        "timestamp": lastLocation.timestamp.timeIntervalSince1970
                    ]
                } else {
                    throw NSError(domain: "OSMMapView", code: 4, userInfo: [NSLocalizedDescriptionKey: "No recent location available. Please start location tracking first and wait for GPS fix."])
                }
            case .notDetermined:
                throw NSError(domain: "OSMMapView", code: 5, userInfo: [NSLocalizedDescriptionKey: "Location permission not determined. Call requestLocationPermission() first, then retry."])
            case .denied:
                throw NSError(domain: "OSMMapView", code: 6, userInfo: [NSLocalizedDescriptionKey: "Location permission denied by user. Call requestLocationPermission() to prompt again, or ask the user to enable it in Settings."])
            case .restricted:
                throw NSError(domain: "OSMMapView", code: 7, userInfo: [NSLocalizedDescriptionKey: "Location access restricted by system"])
            @unknown default:
                throw NSError(domain: "OSMMapView", code: 8, userInfo: [NSLocalizedDescriptionKey: "Unknown location permission status"])
            }
        } catch {
            // Never let exceptions escape to JavaScript - always return an error through the Promise
            throw error
        }
    }
    
    // Starts GPS tracking with optional background (screen-off) support and
    // accuracy presets. Called by the module when JS passes tracking options;
    // the zero-arg overload below keeps the exact pre-2.4 behavior.
    // Recognized keys: background (Bool), accuracy ("high"|"balanced"|"low"),
    // distanceFilterMeters (Double). Notification keys are Android-only.
    func startLocationTracking(options: [String: Any]?) throws {
        guard let locationManager = locationManager else {
            throw NSError(domain: "OSMMapView", code: 3, userInfo: [NSLocalizedDescriptionKey: "Location manager not initialized"])
        }
        
        // Apply the requested accuracy/power preset
        switch options?["accuracy"] as? String ?? "high" {
        case "low":
            locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
            locationManager.distanceFilter = 50.0
        case "balanced":
            locationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
            locationManager.distanceFilter = 10.0
        default:
            locationManager.desiredAccuracy = kCLLocationAccuracyBest
            locationManager.distanceFilter = kCLDistanceFilterNone
        }
        if let distanceFilter = options?["distanceFilterMeters"] as? Double {
            locationManager.distanceFilter = distanceFilter > 0 ? distanceFilter : kCLDistanceFilterNone
        }
        
        if options?["background"] as? Bool == true {
            // Setting allowsBackgroundLocationUpdates without the "location"
            // UIBackgroundMode crashes the app — verify at runtime and fail
            // with an actionable message instead.
            let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String] ?? []
            guard backgroundModes.contains("location") else {
                throw NSError(domain: "OSMMapView", code: 10, userInfo: [NSLocalizedDescriptionKey: "The app is missing the 'location' UIBackgroundMode. Set enableBackgroundLocation: true in the expo-osm-sdk config plugin (app.json) and rebuild to use background tracking."])
            }
            
            locationManager.allowsBackgroundLocationUpdates = true
            locationManager.pausesLocationUpdatesAutomatically = false
            locationManager.activityType = .fitness
            locationManager.showsBackgroundLocationIndicator = true
            
            // Upgrade to Always authorization when possible. Background
            // delivery still works under When-In-Use (with the system's blue
            // indicator), so a denial degrades gracefully instead of failing.
            let authStatus = getLocationAuthorizationStatus()
            if authStatus == .authorizedWhenInUse || authStatus == .notDetermined {
                locationManager.requestAlwaysAuthorization()
            }
            
            isBackgroundTrackingActive = true
        }
        
        try startLocationTracking()
    }
    
    func startLocationTracking() throws {
        
        // Bulletproof error handling - comprehensive protection
        do {
            guard let locationManager = locationManager else {
                throw NSError(domain: "OSMMapView", code: 3, userInfo: [NSLocalizedDescriptionKey: "Location manager not initialized"])
            }
            
            let authStatus = getLocationAuthorizationStatus()
            
            switch authStatus {
            case .authorizedWhenInUse, .authorizedAlways:
                // Check if location services are enabled system-wide
                guard CLLocationManager.locationServicesEnabled() else {
                    throw NSError(domain: "OSMMapView", code: 9, userInfo: [NSLocalizedDescriptionKey: "Location services are disabled system-wide. Please enable in Settings."])
                }

                // Drop stale cached fixes so tracking never reports an old city as "live"
                if let cached = lastKnownLocation, !isLocationFresh(cached) {
                    lastKnownLocation = nil
                }

                locationManager.startUpdatingLocation()
            case .notDetermined:
                locationManager.requestWhenInUseAuthorization()
            case .denied:
                throw NSError(domain: "OSMMapView", code: 6, userInfo: [NSLocalizedDescriptionKey: "Location permission denied by user. Call requestLocationPermission() to prompt again, or ask the user to enable it in Settings."])
            case .restricted:
                throw NSError(domain: "OSMMapView", code: 7, userInfo: [NSLocalizedDescriptionKey: "Location access restricted by system"])
            @unknown default:
                throw NSError(domain: "OSMMapView", code: 8, userInfo: [NSLocalizedDescriptionKey: "Unknown location permission status"])
            }
        } catch {
            throw error
        }
    }
    
    func stopLocationTracking() {
        
        // Bulletproof cleanup - never fail
        do {
            guard let locationManager = locationManager else {
                return
            }
            
            locationManager.stopUpdatingLocation()
            
            // Undo the background configuration so a later foreground-only
            // session doesn't keep the system location indicator alive.
            if isBackgroundTrackingActive {
                isBackgroundTrackingActive = false
                locationManager.allowsBackgroundLocationUpdates = false
                locationManager.showsBackgroundLocationIndicator = false
                locationManager.pausesLocationUpdatesAutomatically = true
            }
        } catch {
            // Log but don't throw - cleanup should never fail
        }
    }
    
    // MARK: - Background Fix Buffering
    
    // Buffers a fix while background tracking is active so it survives JS
    // suspension. Bounded: the oldest fixes are dropped past maxBufferedFixes.
    private func bufferLocationFix(_ location: CLLocation) {
        let fix: [String: Double] = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "altitude": location.altitude,
            "heading": location.course,
            "speed": location.speed,
            "timestamp": location.timestamp.timeIntervalSince1970 * 1000
        ]
        bufferedFixesLock.lock()
        bufferedFixes.append(fix)
        if bufferedFixes.count > maxBufferedFixes {
            bufferedFixes.removeFirst(bufferedFixes.count - maxBufferedFixes)
        }
        bufferedFixesLock.unlock()
    }
    
    /// Returns and clears every fix buffered while the JS runtime was asleep
    /// (oldest first). Called by the module's getBufferedLocationFixes().
    func drainBufferedLocationFixes() -> [[String: Double]] {
        bufferedFixesLock.lock()
        let drained = bufferedFixes
        bufferedFixes = []
        bufferedFixesLock.unlock()
        return drained
    }
    
    // Waits for fresh location data without ever blocking the main thread.
    // Polls via asyncAfter and reports the outcome through the completion handler,
    // so a 30s GPS wait can no longer freeze the UI.
    func waitForLocation(timeoutSeconds: Int, completion: @escaping (Result<[String: Double], Error>) -> Void) {
        guard let locationManager = locationManager else {
            completion(.failure(NSError(domain: "OSMMapView", code: 3, userInfo: [NSLocalizedDescriptionKey: "Location manager not initialized"])))
            return
        }
        
        let authStatus = getLocationAuthorizationStatus()
        guard authStatus == .authorizedWhenInUse || authStatus == .authorizedAlways else {
            completion(.failure(NSError(domain: "OSMMapView", code: 6, userInfo: [NSLocalizedDescriptionKey: "Location permission not granted. Call requestLocationPermission() first, then retry."])))
            return
        }
        
        guard CLLocationManager.locationServicesEnabled() else {
            completion(.failure(NSError(domain: "OSMMapView", code: 9, userInfo: [NSLocalizedDescriptionKey: "Location services are disabled. Please enable in Settings."])))
            return
        }
        
        // Start location tracking if not already active
        let shouldStartTracking: Bool
        if let location = locationManager.location {
            shouldStartTracking = !isLocationFresh(location)
        } else {
            shouldStartTracking = true
        }
        
        if shouldStartTracking {
            do {
                try startLocationTracking()
            } catch {
            }
        }
        
        let deadline = Date().addingTimeInterval(TimeInterval(timeoutSeconds))
        pollForFreshLocation(deadline: deadline, completion: completion)
    }
    
    // Returns a location fix that is less than 30 seconds old, or nil
    private func freshLocationFix() -> [String: Double]? {
        if let location = lastKnownLocation,
           isLocationFresh(location) {
            return [
                "latitude": location.coordinate.latitude,
                "longitude": location.coordinate.longitude,
                "accuracy": location.horizontalAccuracy,
                "timestamp": location.timestamp.timeIntervalSince1970
            ]
        }
        if let systemLocation = locationManager?.location,
           isLocationFresh(systemLocation) {
            return [
                "latitude": systemLocation.coordinate.latitude,
                "longitude": systemLocation.coordinate.longitude,
                "accuracy": systemLocation.horizontalAccuracy,
                "timestamp": systemLocation.timestamp.timeIntervalSince1970
            ]
        }
        return nil
    }
    
    private func pollForFreshLocation(deadline: Date, completion: @escaping (Result<[String: Double], Error>) -> Void) {
        if let fix = freshLocationFix() {
            completion(.success(fix))
            return
        }
        
        if Date() >= deadline {
            completion(.failure(NSError(domain: "OSMMapView", code: 8, userInfo: [NSLocalizedDescriptionKey: "Timeout waiting for location. Please ensure location services are enabled and GPS has clear sky view."])))
            return
        }
        
        // Weak self: if the view is deallocated mid-wait, fail the request
        // instead of leaking it or keeping the view alive.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            guard let self = self else {
                completion(.failure(NSError(domain: "OSMMapView", code: 10, userInfo: [NSLocalizedDescriptionKey: "Location request cancelled: map view was destroyed"])))
                return
            }
            self.pollForFreshLocation(deadline: deadline, completion: completion)
        }
    }
    
    // MARK: - Helper Functions
    
    private func isValidCoordinate(latitude: Double, longitude: Double) -> Bool {
        return latitude >= -90.0 && latitude <= 90.0 && longitude >= -180.0 && longitude <= 180.0
    }
    
    private func calculateAnimationDuration(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D, fromZoom: Double, toZoom: Double) -> TimeInterval {
        let distance = from.distance(to: to)
        let zoomDiff = abs(fromZoom - toZoom)
        
        // Simple heuristic: distance and zoom difference affect duration
        // More distance or more zoom change means longer animation
        let baseDuration: TimeInterval = 0.5 // Default base duration
        let distanceFactor: TimeInterval = min(distance / 10000, 1.0) // Max 1 second for 10km
        let zoomFactor: TimeInterval = min(zoomDiff / 5, 1.0) // Max 1 second for 5 zoom levels
        
        return baseDuration + distanceFactor + zoomFactor
    }
    
    private static let freshLocationMaxAge: TimeInterval = 30

    private func isLocationFresh(_ location: CLLocation) -> Bool {
        Date().timeIntervalSince(location.timestamp) < Self.freshLocationMaxAge
    }

    private func isLocationRecent(_ location: CLLocation) -> Bool {
        isLocationFresh(location)
    }
}

// MARK: - Helper Classes and Extensions

// Custom marker annotation class
class CustomMarkerAnnotation: MLNPointAnnotation {
    var markerId: String = ""
    var markerData: OSMMapView.EnhancedMarkerData?
}

// Custom marker annotation view
//
// MarkerIcon contract (parity with Android / GitHub #3):
// - `name` (preset) takes precedence over `uri` when both are set.
// - Presets: park, building, beach, star, pin → SF Symbols here; Android uses tinted pin bitmaps.
// - `uri`: remote https or local file:// PNG/JPEG.
class CustomMarkerAnnotationView: MLNAnnotationView {
    private var iconImageView: UIImageView!
    private var markerData: OSMMapView.EnhancedMarkerData?
    private var iconWidthConstraint: NSLayoutConstraint!
    private var iconHeightConstraint: NSLayoutConstraint!
    
    override init(annotation: MLNAnnotation?, reuseIdentifier: String?) {
        super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)
        setupView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }
    
    private func setupView() {
        iconImageView = UIImageView()
        iconImageView.contentMode = .scaleAspectFit
        addSubview(iconImageView)
        
        iconImageView.translatesAutoresizingMaskIntoConstraints = false
        let w = iconImageView.widthAnchor.constraint(equalToConstant: 30)
        let h = iconImageView.heightAnchor.constraint(equalToConstant: 30)
        iconWidthConstraint = w
        iconHeightConstraint = h
        NSLayoutConstraint.activate([
            iconImageView.centerXAnchor.constraint(equalTo: centerXAnchor),
            iconImageView.centerYAnchor.constraint(equalTo: centerYAnchor),
            w,
            h
        ])
    }
    
    func configureWith(markerData: OSMMapView.EnhancedMarkerData) {
        self.markerData = markerData
        
        let fallbackSize: CGFloat = 30
        
        // Configure icon
        if let icon = markerData.icon {
            let side = CGFloat(icon.size)
            iconWidthConstraint.constant = side
            iconHeightConstraint.constant = side
            
            // Name before URI (same rule as Android)
            if let iconName = icon.name {
                let base = iconForName(iconName)
                if let colorString = icon.color, let img = base {
                    iconImageView.tintColor = UIColor.from(hex: colorString)
                    iconImageView.image = img.withRenderingMode(.alwaysTemplate)
                } else {
                    iconImageView.tintColor = nil
                    iconImageView.image = base?.withRenderingMode(.alwaysOriginal)
                }
            } else if let iconUri = icon.uri {
                iconImageView.tintColor = nil
                loadIconFromURI(iconUri)
            } else {
                iconImageView.tintColor = nil
                iconImageView.image = defaultMarkerIcon()?.withRenderingMode(.alwaysOriginal)
            }
        } else {
            iconWidthConstraint.constant = fallbackSize
            iconHeightConstraint.constant = fallbackSize
            iconImageView.tintColor = nil
            iconImageView.image = defaultMarkerIcon()?.withRenderingMode(.alwaysOriginal)
        }
        
        // Configure opacity
        alpha = markerData.opacity
        
        // Configure rotation
        if markerData.rotation != 0 {
            transform = CGAffineTransform(rotationAngle: markerData.rotation * .pi / 180)
        }
        
        // Configure visibility
        isHidden = !markerData.visible
        
        // Configure z-index (layer level)
        layer.zPosition = CGFloat(markerData.zIndex)
    }
    
    private func iconForName(_ name: String) -> UIImage? {
        // Map icon names to system images or custom icons
        switch name.lowercased() {
        case "park":
            return UIImage(systemName: "tree.fill")
        case "building":
            return UIImage(systemName: "building.fill")
        case "beach":
            return UIImage(systemName: "water.waves")
        case "star":
            return UIImage(systemName: "star.fill")
        case "pin":
            return UIImage(systemName: "mappin.circle.fill")
        default:
            return UIImage(systemName: "mappin.circle.fill")
        }
    }
    
    private func loadIconFromURI(_ uri: String) {
        guard let url = URL(string: uri) else {
            DispatchQueue.main.async { [weak self] in
                self?.applyFallbackMarkerIcon()
            }
            return
        }
        
        if url.isFileURL {
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                let image = UIImage(contentsOfFile: url.path)
                DispatchQueue.main.async { [weak self] in
                    guard let self else { return }
                    if let image {
                        self.iconImageView.image = image.withRenderingMode(.alwaysOriginal)
                    } else {
                        self.applyFallbackMarkerIcon()
                    }
                }
            }
            return
        }
        
        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            let fail = {
                DispatchQueue.main.async { [weak self] in
                    self?.applyFallbackMarkerIcon()
                }
            }
            if error != nil {
                fail()
                return
            }
            if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                fail()
                return
            }
            guard let data, let image = UIImage(data: data) else {
                fail()
                return
            }
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.iconImageView.image = image.withRenderingMode(.alwaysOriginal)
            }
        }.resume()
    }
    
    /// Called on the main thread only.
    private func applyFallbackMarkerIcon() {
        iconImageView.tintColor = nil
        iconImageView.image = defaultMarkerIcon()?.withRenderingMode(.alwaysOriginal)
    }
    
    private func defaultMarkerIcon() -> UIImage? {
        return UIImage(systemName: "mappin.circle.fill")
    }
}

// Custom info window view
class CustomInfoWindowView: UIView {
    private var titleLabel: UILabel!
    private var descriptionLabel: UILabel!
    private var markerId: String = ""
    var onPress: ((String) -> Void)?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }
    
    private func setupView() {
        backgroundColor = UIColor.white
        layer.cornerRadius = 8
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOffset = CGSize(width: 0, height: 2)
        layer.shadowOpacity = 0.2
        layer.shadowRadius = 4
        
        titleLabel = UILabel()
        titleLabel.font = UIFont.boldSystemFont(ofSize: 16)
        titleLabel.numberOfLines = 0
        
        descriptionLabel = UILabel()
        descriptionLabel.font = UIFont.systemFont(ofSize: 14)
        descriptionLabel.numberOfLines = 0
        descriptionLabel.textColor = UIColor.darkGray
        
        let stackView = UIStackView(arrangedSubviews: [titleLabel, descriptionLabel])
        stackView.axis = .vertical
        stackView.spacing = 4
        stackView.alignment = .leading
        
        addSubview(stackView)
        stackView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            stackView.topAnchor.constraint(equalTo: topAnchor, constant: 12),
            stackView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 12),
            stackView.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -12),
            stackView.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -12)
        ])
        
        // Add tap gesture
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(infoWindowTapped))
        addGestureRecognizer(tapGesture)
    }
    
    func configureWith(infoWindow: OSMMapView.InfoWindowData, markerId: String) {
        self.markerId = markerId
        
        titleLabel.text = infoWindow.title
        descriptionLabel.text = infoWindow.description
        
        if let bgColor = infoWindow.backgroundColor {
            backgroundColor = UIColor.from(hex: bgColor)
        }
        
        if let borderColor = infoWindow.borderColor {
            layer.borderColor = UIColor.from(hex: borderColor).cgColor
            layer.borderWidth = 1
        }
        
        layer.cornerRadius = infoWindow.borderRadius
        
        // Set max width constraint
        widthAnchor.constraint(lessThanOrEqualToConstant: infoWindow.maxWidth).isActive = true
    }
    
    func showAbove(view: UIView) {
        guard let superview = view.superview else { return }
        
        translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            centerXAnchor.constraint(equalTo: view.centerXAnchor),
            bottomAnchor.constraint(equalTo: view.topAnchor, constant: -8)
        ])
        
        // Animate appearance
        alpha = 0
        transform = CGAffineTransform(scaleX: 0.8, y: 0.8)
        UIView.animate(withDuration: 0.3, delay: 0, usingSpringWithDamping: 0.7, initialSpringVelocity: 0.5, options: [], animations: {
            self.alpha = 1
            self.transform = CGAffineTransform.identity
        })
    }
    
    @objc private func infoWindowTapped() {
        onPress?(markerId)
    }
}

// UIColor extension for hex color parsing
extension UIColor {
    static func from(hex: String) -> UIColor {
        var hexString = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexString = hexString.replacingOccurrences(of: "#", with: "")
        
        var rgb: UInt64 = 0
        Scanner(string: hexString).scanHexInt64(&rgb)
        
        let red = CGFloat((rgb & 0xFF0000) >> 16) / 255.0
        let green = CGFloat((rgb & 0x00FF00) >> 8) / 255.0
        let blue = CGFloat(rgb & 0x0000FF) / 255.0
        
        return UIColor(red: red, green: green, blue: blue, alpha: 1.0)
    }
} 