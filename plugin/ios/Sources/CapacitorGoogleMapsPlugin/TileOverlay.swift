import Capacitor

public struct TileOverlay: Codable {
    let url: String
    let opacity: Float?
    let visible: Bool?
    let zIndex: Int32

    init(fromJSObject: JSObject) throws {
        guard let url = fromJSObject["url"] as? String else {
            throw GoogleMapErrors.invalidArguments("TileOverlay object is missing the required 'url' property")
        }
        self.url = url
        self.opacity = fromJSObject["opacity"] as? Float
        self.visible = fromJSObject["isFlat"] as? Bool
        self.zIndex = Int32((fromJSObject["zIndex"] as? Int) ?? 0)
    }
}
