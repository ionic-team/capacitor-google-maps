import Foundation
import Capacitor
import GoogleMaps

public struct GoogleMapConfig: Codable {
    let width: Double
    let height: Double
    let x: Double
    let y: Double
    let center: LatLng
    let zoom: Double
    let styles: String?
    var mapId: String?
    let mapTypeId: String?
    let maxZoom: Double?
    let minZoom: Double?
    let restriction: GoogleMapConfigRestriction?
    let heading: Double?

    init(fromJSObject: JSObject) throws {
        guard let width = fromJSObject["width"] as? Double else {
            throw GoogleMapErrors.invalidArguments("GoogleMapConfig object is missing the required 'width' property")
        }

        guard let height = fromJSObject["height"] as? Double else {
            throw GoogleMapErrors.invalidArguments("GoogleMapConfig object is missing the required 'height' property")
        }

        guard let x = fromJSObject["x"] as? Double else {
            throw GoogleMapErrors.invalidArguments("GoogleMapConfig object is missing the required 'x' property")
        }

        guard let y = fromJSObject["y"] as? Double else {
            throw GoogleMapErrors.invalidArguments("GoogleMapConfig object is missing the required 'y' property")
        }

        guard let zoom = fromJSObject["zoom"] as? Double else {
            throw GoogleMapErrors.invalidArguments("GoogleMapConfig object is missing the required 'zoom' property")
        }

        guard let latLngObj = fromJSObject["center"] as? JSObject else {
            throw GoogleMapErrors.invalidArguments("GoogleMapConfig object is missing the required 'center' property")
        }

        guard let lat = latLngObj["lat"] as? Double, let lng = latLngObj["lng"] as? Double else {
            throw GoogleMapErrors.invalidArguments("LatLng object is missing the required 'lat' and/or 'lng' property")
        }

        self.width = round(width)
        self.height = round(height)
        self.x = x
        self.y = y
        self.center = LatLng(lat: lat, lng: lng)
        if let stylesArray = fromJSObject["styles"] as? JSArray, let jsonData = try? JSONSerialization.data(withJSONObject: stylesArray, options: []) {
            self.styles = String(data: jsonData, encoding: .utf8)
        } else {
            self.styles = nil
        }

        self.mapId = fromJSObject["iOSMapId"] as? String

        self.mapTypeId = fromJSObject["mapTypeId"] as? String

        var maxZoom = fromJSObject["maxZoom"] as? Double
        var minZoom = fromJSObject["minZoom"] as? Double
        if let unwrappedMinZoom = minZoom, let unwrappedMaxZoom = maxZoom, unwrappedMinZoom > unwrappedMaxZoom {
            swap(&minZoom, &maxZoom)
        }
        self.minZoom = minZoom
        self.maxZoom = maxZoom

        if let maxZoom, zoom > maxZoom {
            self.zoom = maxZoom
        } else if let minZoom, zoom < minZoom {
            self.zoom = minZoom
        } else {
            self.zoom = zoom
        }

        if let restrictionObj = fromJSObject["restriction"] as? JSObject {
            self.restriction = try GoogleMapConfigRestriction(fromJSObject: restrictionObj)
        } else {
            self.restriction = nil
        }

        self.heading = fromJSObject["heading"] as? Double
    }
}

public struct GoogleMapConfigRestriction: Codable {
    let latLngBounds: GMSCoordinateBounds

    init(fromJSObject: JSObject) throws {
        guard let latLngBoundsObj = fromJSObject["latLngBounds"] as? JSObject else {
            throw GoogleMapErrors.invalidArguments("GoogleMapConfigRestriction object is missing the required 'latLngBounds' property")
        }

        guard let north = latLngBoundsObj["north"] as? Double else {
            throw GoogleMapErrors.invalidArguments("GoogleMapConfigRestriction object is missing the required 'latLngBounds.north' property")
        }

        guard let south = latLngBoundsObj["south"] as? Double else {
            throw GoogleMapErrors.invalidArguments("GoogleMapConfigRestriction object is missing the required 'latLngBounds.south' property")
        }

        guard let east = latLngBoundsObj["east"] as? Double else {
            throw GoogleMapErrors.invalidArguments("GoogleMapConfigRestriction object is missing the required 'latLngBounds.east' property")
        }

        guard let west = latLngBoundsObj["west"] as? Double else {
            throw GoogleMapErrors.invalidArguments("GoogleMapConfigRestriction object is missing the required 'latLngBounds.west' property")
        }

        let southWest = CLLocationCoordinate2D(latitude: south, longitude: west)
        let northEast = CLLocationCoordinate2D(latitude: north, longitude: east)
        self.latLngBounds = GMSCoordinateBounds(coordinate: southWest, coordinate: northEast)
    }

    enum CodingKeys: String, CodingKey {
        case latLngBounds
    }

    struct LatLngBounds: Codable {
        let north: CLLocationDegrees
        let south: CLLocationDegrees
        let east: CLLocationDegrees
        let west: CLLocationDegrees
    }

    public func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        let latLngBounds = LatLngBounds(
            north: self.latLngBounds.northEast.latitude,
            south: self.latLngBounds.southWest.latitude,
            east: self.latLngBounds.northEast.longitude,
            west: self.latLngBounds.southWest.longitude
        )
        try container.encode(latLngBounds, forKey: .latLngBounds)
    }

    public init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        let latLngBounds = try container.decode(LatLngBounds.self, forKey: .latLngBounds)
        let southWest = CLLocationCoordinate2D(latitude: latLngBounds.south, longitude: latLngBounds.west)
        let northEast = CLLocationCoordinate2D(latitude: latLngBounds.north, longitude: latLngBounds.east)
        self.latLngBounds = GMSCoordinateBounds(coordinate: southWest, coordinate: northEast)
    }
}
