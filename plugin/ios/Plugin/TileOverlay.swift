import Capacitor

public struct TileOverlay {
    let getTileCallbackId: String
    let opacity: Float?
    let visible: Bool?
    let zIndex: Int32

    init(fromJSObject: JSObject) throws {
        guard let getTileCallbackId = fromJSObject["getTileCallbackId"] as? String else {
            throw GoogleMapErrors.invalidArguments("TileOverlay object is missing the required 'getTileCallbackId' property")
        }
        self.getTileCallbackId = getTileCallbackId
        self.opacity = fromJSObject["opacity"] as? Float
        self.visible = fromJSObject["isFlat"] as? Bool
        self.zIndex = Int32((fromJSObject["zIndex"] as? Int) ?? 0)
    }
}
