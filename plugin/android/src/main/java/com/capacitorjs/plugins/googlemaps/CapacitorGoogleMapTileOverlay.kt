package com.capacitorjs.plugins.googlemaps

import com.google.android.gms.maps.model.TileOverlay
import org.json.JSONObject

class CapacitorGoogleMapTileOverlay(fromJSONObject: JSONObject) {
    var getTileCallbackId: String
    var opacity: Float? = null
    var zIndex: Float? = null
    var visible: Boolean? = null
    var googleMapTileOverlay: TileOverlay? = null

    init {
        if (!fromJSONObject.has("getTileCallbackId")) {
            throw InvalidArgumentsError("TileOverlay object is missing the required 'getTileCallbackId' property")
        }
        getTileCallbackId = fromJSONObject.getString("getTileCallbackId")
        if (fromJSONObject.has("opacity")) {
            opacity = fromJSONObject.optDouble("opacity").toFloat()
        }
        if (fromJSONObject.has("visible")) {
            visible = fromJSONObject.optBoolean("visible")
        }
        if (fromJSONObject.has("zIndex")) {
            zIndex = fromJSONObject.optLong("zIndex").toFloat()
        }
    }
}