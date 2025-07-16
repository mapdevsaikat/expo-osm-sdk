import ExpoModulesCore
import MapLibre
import UIKit
import CoreLocation

// Enhanced native iOS map view using MapLibre GL Native
class OSMMapView: ExpoView, MLNMapViewDelegate, CLLocationManagerDelegate {
    // MapLibre map view
    private var mapView: MLNMapView!
    
    // Location manager for GPS features
    private var locationManager: CLLocationManager!
    
    // Configuration properties
    private var initialCenter: CLLocationCoordinate2D = CLLocationCoordinate2D(latitude: 0, longitude: 0)
    private var initialZoom: Double = 10
    private var tileServerUrl: String = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    private var markers: [EnhancedMarkerData] = []
    private var polylines: [PolylineData] = []
    private var polygons: [PolygonData] = []
    private var circles: [CircleData] = []
    private var overlays: [OverlayData] = []
    
    // Map configuration
    private var showUserLocation: Bool = false
    private var followUserLocation: Bool = false
    private var showsCompass: Bool = false
    private var showsScale: Bool = false
    private var rotateEnabled: Bool = true
    private var scrollEnabled: Bool = true
    private var zoomEnabled: Bool = true
    private var pitchEnabled: Bool = false
    
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
        // Create tile source with OpenStreetMap tiles
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
    
    func setTileServerUrl(_ url: String) {
        tileServerUrl = url
        // Recreate tile source with new URL
        if mapView != nil {
            setupTileSource()
        }
    }
    
    // Enhanced property setters
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
        
        // Parse enhanced markers
        markers = markersData.compactMap { data in
            guard let id = data["id"] as? String,
                  let coordinate = data["coordinate"] as? [String: Double],
                  let lat = coordinate["latitude"],
                  let lng = coordinate["longitude"] else {
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
        
        // Parse and add new polylines
        polylines = polylinesData.compactMap { data in
            guard let id = data["id"] as? String,
                  let coordinatesData = data["coordinates"] as? [[String: Double]] else {
                return nil
            }
            
            let coordinates = coordinatesData.compactMap { coord -> CLLocationCoordinate2D? in
                guard let lat = coord["latitude"], let lng = coord["longitude"] else { return nil }
                return CLLocationCoordinate2D(latitude: lat, longitude: lng)
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
        
        // Parse and add new polygons
        polygons = polygonsData.compactMap { data in
            guard let id = data["id"] as? String,
                  let coordinatesData = data["coordinates"] as? [[String: Double]] else {
                return nil
            }
            
            let coordinates = coordinatesData.compactMap { coord -> CLLocationCoordinate2D? in
                guard let lat = coord["latitude"], let lng = coord["longitude"] else { return nil }
                return CLLocationCoordinate2D(latitude: lat, longitude: lng)
            }
            
            // Parse holes if present
            var holes: [[CLLocationCoordinate2D]]?
            if let holesData = data["holes"] as? [[[String: Double]]] {
                holes = holesData.map { holeData in
                    return holeData.compactMap { coord -> CLLocationCoordinate2D? in
                        guard let lat = coord["latitude"], let lng = coord["longitude"] else { return nil }
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
        
        // Parse and add new circles
        circles = circlesData.compactMap { data in
            guard let id = data["id"] as? String,
                  let centerData = data["center"] as? [String: Double],
                  let lat = centerData["latitude"],
                  let lng = centerData["longitude"],
                  let radius = data["radius"] as? Double else {
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
        let annotationView = mapView.view(for: annotation)
        if let parentView = annotationView?.superview {
            parentView.addSubview(infoWindowView)
            infoWindowView.showAbove(view: annotationView!)
        }
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        let coordinate = location.coordinate
        onUserLocationChange([
            "latitude": coordinate.latitude,
            "longitude": coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "altitude": location.altitude,
            "heading": location.course,
            "speed": location.speed
        ])
        
        // Update map location if following user
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
}

// MARK: - Helper Classes and Extensions

// Custom marker annotation class
class CustomMarkerAnnotation: MLNPointAnnotation {
    var markerId: String = ""
    var markerData: OSMMapView.EnhancedMarkerData?
}

// Custom marker annotation view
class CustomMarkerAnnotationView: MLNAnnotationView {
    private var iconImageView: UIImageView!
    private var markerData: OSMMapView.EnhancedMarkerData?
    
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
        NSLayoutConstraint.activate([
            iconImageView.centerXAnchor.constraint(equalTo: centerXAnchor),
            iconImageView.centerYAnchor.constraint(equalTo: centerYAnchor),
            iconImageView.widthAnchor.constraint(equalToConstant: 30),
            iconImageView.heightAnchor.constraint(equalToConstant: 30)
        ])
    }
    
    func configureWith(markerData: OSMMapView.EnhancedMarkerData) {
        self.markerData = markerData
        
        // Configure icon
        if let icon = markerData.icon {
            iconImageView.widthAnchor.constraint(equalToConstant: icon.size).isActive = true
            iconImageView.heightAnchor.constraint(equalToConstant: icon.size).isActive = true
            
            if let colorString = icon.color {
                iconImageView.tintColor = UIColor.from(hex: colorString)
            }
            
            // Set icon image based on name or URI
            if let iconName = icon.name {
                iconImageView.image = iconForName(iconName)
            } else if let iconUri = icon.uri {
                loadIconFromURI(iconUri)
            } else {
                iconImageView.image = defaultMarkerIcon()
            }
        } else {
            iconImageView.image = defaultMarkerIcon()
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
        // Load icon from URI (URL or local file)
        if let url = URL(string: uri) {
            URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
                if let data = data, let image = UIImage(data: data) {
                    DispatchQueue.main.async {
                        self?.iconImageView.image = image
                    }
                }
            }.resume()
        }
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