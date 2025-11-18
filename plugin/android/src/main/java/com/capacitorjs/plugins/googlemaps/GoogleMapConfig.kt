package com.capacitorjs.plugins.googlemaps

import com.google.android.gms.maps.GoogleMapOptions
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import org.json.JSONObject

class GoogleMapConfig(fromJSONObject: JSONObject) {
    var width: Int = 0
    var height: Int = 0
    var x: Int = 0
    var y: Int = 0
    var googleMapOptions: GoogleMapOptions? = null
    var devicePixelRatio: Float = 1.00f
    var mapTypeId: String? = null
    var heading: Double? = null

    init {
        if (!fromJSONObject.has("width")) {
            throw InvalidArgumentsError(
                    "GoogleMapConfig object is missing the required 'width' property"
            )
        }

        if (!fromJSONObject.has("height")) {
            throw InvalidArgumentsError(
                    "GoogleMapConfig object is missing the required 'height' property"
            )
        }

        if (!fromJSONObject.has("x")) {
            throw InvalidArgumentsError(
                    "GoogleMapConfig object is missing the required 'x' property"
            )
        }

        if (!fromJSONObject.has("y")) {
            throw InvalidArgumentsError(
                    "GoogleMapConfig object is missing the required 'y' property"
            )
        }

        if (!fromJSONObject.has("zoom")) {
            throw InvalidArgumentsError(
                    "GoogleMapConfig object is missing the required 'zoom' property"
            )
        }

        if (fromJSONObject.has("devicePixelRatio")) {
            devicePixelRatio = fromJSONObject.getDouble("devicePixelRatio").toFloat()
        }

        if (!fromJSONObject.has("center")) {
            throw InvalidArgumentsError(
                    "GoogleMapConfig object is missing the required 'center' property"
            )
        }

        val centerJSONObject = fromJSONObject.getJSONObject("center")

        if (!centerJSONObject.has("lat") || !centerJSONObject.has("lng")) {
            throw InvalidArgumentsError(
                    "LatLng object is missing the required 'lat' and/or 'lng' property"
            )
        }

        width = fromJSONObject.getInt("width")
        height = fromJSONObject.getInt("height")
        x = fromJSONObject.getInt("x")
        y = fromJSONObject.getInt("y")

        val tempZoom = fromJSONObject.getInt("zoom")
        var tempMinZoom = fromJSONObject.optInt("minZoom").takeIf { fromJSONObject.has("minZoom") }
        var tempMaxZoom = fromJSONObject.optInt("maxZoom").takeIf { fromJSONObject.has("maxZoom") }

        if (tempMinZoom != null && tempMaxZoom != null && tempMinZoom > tempMaxZoom) {
            tempMinZoom = tempMaxZoom.also { tempMaxZoom = tempMinZoom }
        }

        mapTypeId = fromJSONObject.optString("mapTypeId").takeIf { fromJSONObject.has("mapTypeId") }

        val lat = centerJSONObject.getDouble("lat")
        val lng = centerJSONObject.getDouble("lng")
        val center = LatLng(lat, lng)
        val zoom = tempZoom.coerceIn(
            tempMinZoom ?: Int.MIN_VALUE,
            tempMaxZoom ?: Int.MAX_VALUE
        )
        val mapId = fromJSONObject.getString("androidMapId")
        val liteMode =
            fromJSONObject.has("androidLiteMode") &&
                    fromJSONObject.getBoolean("androidLiteMode")
        val cameraPosition = CameraPosition(center, zoom.toFloat(), 0.0F, 0.0F)

        heading = fromJSONObject.optDouble("heading").takeIf { fromJSONObject.has("heading") }

        googleMapOptions = GoogleMapOptions().camera(cameraPosition).liteMode(liteMode)
        if (mapId != null) {
            googleMapOptions?.mapId(mapId!!)
        }
    }
}
