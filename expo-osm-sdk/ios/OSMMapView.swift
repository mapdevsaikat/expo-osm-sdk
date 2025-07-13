import ExpoModulesCore
import MapLibre
import UIKit

// Native iOS map view using MapLibre GL Native
class OSMMapView: ExpoView, MLNMapViewDelegate {
    // MapLibre map view
    private var mapView: MLNMapView!
    
    // Configuration properties
    private var initialCenter: CLLocationCoordinate2D = CLLocationCoordinate2D(latitude: 0, longitude: 0)
    private var initialZoom: Double = 10
    private var tileServerUrl: String = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    private var markers: [MarkerData] = []
    
    // Event emitters
    private let onMapReady = EventDispatcher()
    private let onRegionChange = EventDispatcher()
    private let onMarkerPress = EventDispatcher()
    private let onPress = EventDispatcher()
    
    // Marker data structure
    struct MarkerData {
        let id: String
        let coordinate: CLLocationCoordinate2D
        let title: String?
        let description: String?
        let icon: String?
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
        
        // Add tile source
        setupTileSource()
        
        // Add tap gesture recognizer
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(mapTapped(_:)))
        mapView.addGestureRecognizer(tapGesture)
        
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
    
    func setMarkers(_ markersData: [[String: Any]]) {
        // Clear existing markers
        if let annotations = mapView?.annotations {
            mapView?.removeAnnotations(annotations)
        }
        
        // Parse and add new markers
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
                icon: data["icon"] as? String
            )
        }
        
        // Add markers to map
        addMarkersToMap()
    }
    
    // Add markers to map
    private func addMarkersToMap() {
        for marker in markers {
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
    
    // MARK: - MLNMapViewDelegate
    
    func mapView(_ mapView: MLNMapView, didFinishLoading style: MLNStyle) {
        // Map is ready
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
        let selectedCoordinate = annotation.coordinate
        if let marker = markers.first(where: { 
            abs($0.coordinate.latitude - selectedCoordinate.latitude) < 0.0001 &&
            abs($0.coordinate.longitude - selectedCoordinate.longitude) < 0.0001
        }) {
            onMarkerPress([
                "markerId": marker.id
            ])
        }
    }
    
    // MARK: - Layout
    
    override func layoutSubviews() {
        super.layoutSubviews()
        mapView?.frame = bounds
    }
} 