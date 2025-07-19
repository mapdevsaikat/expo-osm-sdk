import ExpoModulesCore
import MapLibre
import UIKit
import CoreLocation

/**
 * Simple iOS map view using MapLibre GL Native
 * Focused on basic functionality without complex features
 */
class OSMMapView: ExpoView, MLNMapViewDelegate, CLLocationManagerDelegate {
    // MapLibre map view
    var mapView: MLNMapView!
    
    // Location manager for GPS features
    var locationManager: CLLocationManager!
    private var lastKnownLocation: CLLocation?
    
    // Configuration properties
    private var initialCenter: CLLocationCoordinate2D = CLLocationCoordinate2D(latitude: 0, longitude: 0)
    private var initialZoom: Double = 10
    private var tileServerUrl: String = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    private var styleUrl: String? = nil
    private var markers: [MarkerData] = []
    
    // Map configuration
    private var showUserLocation: Bool = false
    private var followUserLocation: Bool = false
    private var rotateEnabled: Bool = true
    private var scrollEnabled: Bool = true
    private var zoomEnabled: Bool = true
    private var pitchEnabled: Bool = false
    
    // Event emitters
    private let onMapReady = EventDispatcher()
    private let onRegionChange = EventDispatcher()
    private let onMarkerPress = EventDispatcher()
    private let onPress = EventDispatcher()
    private let onLongPress = EventDispatcher()
    private let onUserLocationChange = EventDispatcher()
    
    // Simple data structures
    struct MarkerData {
        let id: String
        let coordinate: CLLocationCoordinate2D
        let title: String?
        let description: String?
        let visible: Bool
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupMapView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupMapView()
    }
    
    // Setup the map view
    func setupMapView() {
        // Initialize MapLibre map view
        mapView = MLNMapView(frame: bounds)
        mapView.delegate = self
        mapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        // Set initial properties
        mapView.centerCoordinate = initialCenter
        mapView.zoomLevel = initialZoom
        
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
    
    // Setup location manager for GPS features
    private func setupLocationManager() {
        locationManager = CLLocationManager()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 10.0
        
        // Request location permissions
        if CLLocationManager.locationServicesEnabled() {
            switch CLLocationManager.authorizationStatus() {
            case .notDetermined:
                locationManager.requestWhenInUseAuthorization()
            case .denied, .restricted:
                print("Location access denied")
            case .authorizedWhenInUse, .authorizedAlways:
                if showUserLocation {
                    locationManager.startUpdatingLocation()
                }
            @unknown default:
                break
            }
        }
    }
    
    // Setup gesture recognizers
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
    
    // Setup tile source
    private func setupTileSource() {
        // Create simple raster tile source
        let styleJson = """
        {
            "version": 8,
            "sources": {
                "osm-raster": {
                    "type": "raster",
                    "tiles": ["\(tileServerUrl)"],
                    "tileSize": 256
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
        """
        
        print("OSM SDK iOS: Setting up tiles with style JSON")
        
        // Convert JSON string to Data and then to URL
        if let jsonData = styleJson.data(using: .utf8) {
            let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("osm-style.json")
            do {
                try jsonData.write(to: tempURL)
                mapView.styleURL = tempURL
                print("OSM SDK iOS: Tile source setup complete")
            } catch {
                print("OSM SDK iOS: Error writing style JSON: \(error)")
                setupFallbackTiles()
            }
        } else {
            setupFallbackTiles()
        }
    }
    
    // Fallback to basic raster tiles
    private func setupFallbackTiles() {
        print("OSM SDK iOS: Using fallback raster tiles")
        
        let tileSource = MLNRasterTileSource(
            identifier: "osm-tiles",
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
        
        let rasterLayer = MLNRasterStyleLayer(identifier: "osm-layer", source: tileSource)
        
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
    
    func setTileServerUrl(_ url: String) {
        tileServerUrl = url
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
    
    func setShowUserLocation(_ show: Bool) {
        showUserLocation = show
        mapView?.showsUserLocation = show
        if show && CLLocationManager.authorizationStatus() == .authorizedWhenInUse {
            locationManager?.startUpdatingLocation()
        } else {
            locationManager?.stopUpdatingLocation()
        }
    }
    
    func setFollowUserLocation(_ follow: Bool) {
        followUserLocation = follow
        mapView?.userTrackingMode = follow ? .follow : .none
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
    
    func setMarkers(_ markersData: [[String: Any]]) {
        // Clear existing markers
        if let annotations = mapView?.annotations {
            mapView?.removeAnnotations(annotations)
        }
        
        // Parse simple markers
        markers = markersData.compactMap { data in
            guard let id = data["id"] as? String,
                  let coordinate = data["coordinate"] as? [String: Double],
                  let lat = coordinate["latitude"],
                  let lng = coordinate["longitude"] else {
                return nil
            }
            
            return MarkerData(
                id: id,
                coordinate: CLLocationCoordinate2D(latitude: lat, longitude: lng),
                title: data["title"] as? String,
                description: data["description"] as? String,
                visible: data["visible"] as? Bool ?? true
            )
        }
        
        // Add markers to map
        addMarkersToMap()
    }
    
    // Add markers to map
    private func addMarkersToMap() {
            for marker in markers {
                guard marker.visible else { continue }
                
            let annotation = MLNPointAnnotation()
                annotation.coordinate = marker.coordinate
                annotation.title = marker.title
                annotation.subtitle = marker.description
                
                mapView?.addAnnotation(annotation)
        }
    }
    
    // MARK: - Gesture Handlers
    
    @objc private func mapTapped(_ gesture: UITapGestureRecognizer) {
        let point = gesture.location(in: mapView)
        let coordinate = mapView.convert(point, toCoordinateFrom: mapView)
        
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
    
    // MARK: - MLNMapViewDelegate
    
    func mapView(_ mapView: MLNMapView, didFinishLoading style: MLNStyle) {
        onMapReady([:])
    }
    
    func mapView(_ mapView: MLNMapView, regionDidChangeAnimated animated: Bool) {
        let region = mapView.visibleCoordinateBounds
        let center = mapView.centerCoordinate
        
        onRegionChange([
            "latitude": center.latitude,
            "longitude": center.longitude,
            "latitudeDelta": region.ne.latitude - region.sw.latitude,
            "longitudeDelta": region.ne.longitude - region.sw.longitude
        ])
    }
    
    func mapView(_ mapView: MLNMapView, didSelect annotation: MLNAnnotation) {
        // Find marker by coordinate
        let selectedMarker = markers.first { marker in
            abs(marker.coordinate.latitude - annotation.coordinate.latitude) < 0.0001 &&
            abs(marker.coordinate.longitude - annotation.coordinate.longitude) < 0.0001
        }
        
            onMarkerPress([
            "markerId": selectedMarker?.id ?? "",
                "coordinate": [
                    "latitude": annotation.coordinate.latitude,
                    "longitude": annotation.coordinate.longitude
                ]
            ])
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        lastKnownLocation = location
        
        let coordinate = location.coordinate
        onUserLocationChange([
            "latitude": coordinate.latitude,
            "longitude": coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "altitude": location.altitude,
            "heading": location.course,
            "speed": location.speed
        ])
        
        if followUserLocation {
            mapView?.setCenter(coordinate, animated: true)
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location manager failed with error: \(error.localizedDescription)")
    }
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
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
    }
    
    // MARK: - Layout
    
    override func layoutSubviews() {
        super.layoutSubviews()
        mapView?.frame = bounds
    }
    
    // MARK: - Native API Methods
    
    func zoomIn() {
        guard let mapView = mapView else { return }
            let currentZoom = mapView.zoomLevel
            let newZoom = min(currentZoom + 1.0, 20.0)
            mapView.setZoomLevel(newZoom, animated: true)
    }
    
    func zoomOut() {
        guard let mapView = mapView else { return }
            let currentZoom = mapView.zoomLevel
            let newZoom = max(currentZoom - 1.0, 1.0)
            mapView.setZoomLevel(newZoom, animated: true)
    }
    
    func setZoom(_ zoom: Double) {
        guard let mapView = mapView else { return }
            let clampedZoom = max(1.0, min(zoom, 20.0))
            mapView.setZoomLevel(clampedZoom, animated: true)
    }
    
    func animateToLocation(latitude: Double, longitude: Double, zoom: Double? = nil) {
        guard let mapView = mapView else { return }
        guard isValidCoordinate(latitude: latitude, longitude: longitude) else { return }
        
            let targetCoordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        let targetZoom = zoom ?? mapView.zoomLevel
            let clampedZoom = max(1.0, min(targetZoom, 20.0))
            
        mapView.setCenter(targetCoordinate, zoomLevel: clampedZoom, animated: true)
    }
    
    func getCurrentLocation() -> [String: Double] {
        guard let locationManager = locationManager else {
            throw NSError(domain: "OSMMapView", code: 3, userInfo: [NSLocalizedDescriptionKey: "Location manager not initialized"])
        }
        
        let authStatus = CLLocationManager.authorizationStatus()
        
        switch authStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            if let location = lastKnownLocation ?? locationManager.location {
                let coordinate = location.coordinate
                return [
                    "latitude": coordinate.latitude,
                    "longitude": coordinate.longitude,
                    "accuracy": location.horizontalAccuracy,
                    "timestamp": location.timestamp.timeIntervalSince1970
                ]
            } else {
                print("⚠️ OSM SDK iOS: No GPS location available, using map center as fallback")
                // Fallback to map center when no GPS location available
                if let mapCenter = mapView.centerCoordinate {
                    return [
                        "latitude": mapCenter.latitude,
                        "longitude": mapCenter.longitude,
                        "accuracy": 0,
                        "timestamp": Date().timeIntervalSince1970,
                        "source": "map-center",
                        "error": "No GPS location available. Location services may be disabled or GPS signal weak."
                    ]
                } else {
                    throw NSError(domain: "OSMMapView", code: 4, userInfo: [NSLocalizedDescriptionKey: "No location available and map center unavailable"])
                }
            }
        case .denied:
            print("❌ OSM SDK iOS: Location permission denied, using map center as fallback")
            // Fallback to map center when permission denied
            if let mapCenter = mapView.centerCoordinate {
                return [
                    "latitude": mapCenter.latitude,
                    "longitude": mapCenter.longitude,
                    "accuracy": 0,
                    "timestamp": Date().timeIntervalSince1970,
                    "source": "map-center",
                    "error": "Location permission denied. Please enable location access in device settings."
                ]
            } else {
                throw NSError(domain: "OSMMapView", code: 6, userInfo: [NSLocalizedDescriptionKey: "Location permission denied and map center unavailable"])
            }
        case .restricted:
            print("❌ OSM SDK iOS: Location access restricted, using map center as fallback")
            // Fallback to map center when access restricted
            if let mapCenter = mapView.centerCoordinate {
                return [
                    "latitude": mapCenter.latitude,
                    "longitude": mapCenter.longitude,
                    "accuracy": 0,
                    "timestamp": Date().timeIntervalSince1970,
                    "source": "map-center",
                    "error": "Location access restricted by device settings."
                ]
            } else {
                throw NSError(domain: "OSMMapView", code: 7, userInfo: [NSLocalizedDescriptionKey: "Location access restricted and map center unavailable"])
            }
        default:
            throw NSError(domain: "OSMMapView", code: 5, userInfo: [NSLocalizedDescriptionKey: "Location permission not determined"])
        }
    }
    
    func startLocationTracking() {
        guard let locationManager = locationManager else { return }
        
        let authStatus = CLLocationManager.authorizationStatus()
        
        switch authStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            locationManager.startUpdatingLocation()
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        default:
            break
        }
    }
    
    func stopLocationTracking() {
        locationManager?.stopUpdatingLocation()
    }
    
    func setPitch(_ pitch: Double) {
        guard let mapView = mapView else { return }
        let clampedPitch = max(0.0, min(pitch, 60.0))
            let camera = mapView.camera
            camera.pitch = CGFloat(clampedPitch)
            mapView.setCamera(camera, animated: true)
    }
    
    func setBearing(_ bearing: Double) {
        guard let mapView = mapView else { return }
        let normalizedBearing = bearing.truncatingRemainder(dividingBy: 360.0)
            let adjustedBearing = normalizedBearing < 0 ? normalizedBearing + 360.0 : normalizedBearing
            let camera = mapView.camera
            camera.heading = adjustedBearing
            mapView.setCamera(camera, animated: true)
    }
    
    func getPitch() -> Double {
        guard let mapView = mapView else { return 0.0 }
        return Double(mapView.camera.pitch)
    }
    
    func getBearing() -> Double {
        guard let mapView = mapView else { return 0.0 }
        return mapView.camera.heading
    }
    
    // MARK: - Helper Functions
    
    private func isValidCoordinate(latitude: Double, longitude: Double) -> Bool {
        return latitude >= -90.0 && latitude <= 90.0 && longitude >= -180.0 && longitude <= 180.0
    }
}

// MARK: - Helper Extensions

extension CLLocationCoordinate2D {
    func distance(to: CLLocationCoordinate2D) -> Double {
        let location1 = CLLocation(latitude: self.latitude, longitude: self.longitude)
        let location2 = CLLocation(latitude: to.latitude, longitude: to.longitude)
        return location1.distance(from: location2)
    }
} 