package com.capacitorjs.plugins.googlemaps

import com.google.android.gms.maps.GoogleMapOptions
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import org.json.JSONObject

class GoogleMapConfig(fromJSONObject: JSONObject) {
    var width: Int = 0
    var height: Int = 0
    var x: Int = 0
    var y: Int = 0
    var center: LatLng = LatLng(0.0, 0.0)
    var googleMapOptions: GoogleMapOptions? = null
    var zoom: Int = 0
    var liteMode: Boolean = false
    var devicePixelRatio: Float = 1.00f
    var styles: String? = null
    var mapId: String? = null
    var minZoom: Int? = null
    var maxZoom: Int? = null
    var mapTypeId: String? = null
    var restriction: GoogleMapConfigRestriction? = null
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

        liteMode =
                fromJSONObject.has("androidLiteMode") &&
                        fromJSONObject.getBoolean("androidLiteMode")

        width = fromJSONObject.getInt("width")
        height = fromJSONObject.getInt("height")
        x = fromJSONObject.getInt("x")
        y = fromJSONObject.getInt("y")

        val _zoom = fromJSONObject.getInt("zoom")
        var _minZoom = fromJSONObject.getInt("minZoom")
        var _maxZoom = fromJSONObject.getInt("maxZoom")
        if (_minZoom != null && maxZoom != null && _minZoom > _maxZoom) {
            _minZoom = _maxZoom.also { _maxZoom = _minZoom }
        }
        minZoom = _minZoom
        maxZoom = _maxZoom
        if (_maxZoom != null && _zoom > _maxZoom) {
            zoom = _maxZoom
        } else if (_minZoom != null && _zoom < _minZoom) {
            zoom = _minZoom
        } else {
            zoom = _zoom
        }

        mapTypeId = fromJSONObject.getString("mapTypeId")

        val lat = centerJSONObject.getDouble("lat")
        val lng = centerJSONObject.getDouble("lng")
        center = LatLng(lat, lng)

        val cameraPosition = CameraPosition(center, zoom.toFloat(), 0.0F, 0.0F)

        styles = fromJSONObject.getString("styles")

        mapId = fromJSONObject.getString("androidMapId")

        if (fromJSONObject.has("restriction")) {
            restriction = GoogleMapConfigRestriction(fromJSONObject.getJSONObject("restriction"))
        }

        heading = fromJSONObject.getDouble("heading")

        googleMapOptions = GoogleMapOptions().camera(cameraPosition).liteMode(liteMode)
        if (mapId != null) {
            googleMapOptions?.mapId(mapId!!)
        }
    }
}

class GoogleMapConfigRestriction(fromJSONObject: JSONObject) {
    var latLngBounds: LatLngBounds

    init {
        if (!fromJSONObject.has("latLngBounds")) {
            throw InvalidArgumentsError(
                "GoogleMapConfigRestriction object is missing the required 'latLngBounds' property"
            )
        }
        val latLngBoundsObj = fromJSONObject.getJSONObject("latLngBounds")

        if (!latLngBoundsObj.has("north")) {
            throw InvalidArgumentsError(
                "GoogleMapConfigRestriction object is missing the required 'latLngBounds.north' property"
            )
        }
        if (!latLngBoundsObj.has("south")) {
            throw InvalidArgumentsError(
                "GoogleMapConfigRestriction object is missing the required 'latLngBounds.south' property"
            )
        }
        if (!latLngBoundsObj.has("east")) {
            throw InvalidArgumentsError(
                "GoogleMapConfigRestriction object is missing the required 'latLngBounds.east' property"
            )
        }
        if (!latLngBoundsObj.has("west")) {
            throw InvalidArgumentsError(
                "GoogleMapConfigRestriction object is missing the required 'latLngBounds.west' property"
            )
        }
        val north = latLngBoundsObj.getDouble("north")
        val south = latLngBoundsObj.getDouble("south")
        val east = latLngBoundsObj.getDouble("east")
        val west = latLngBoundsObj.getDouble("west")

        latLngBounds = LatLngBounds(
            LatLng(south, west),
            LatLng(north, east)
        )
    }
}
