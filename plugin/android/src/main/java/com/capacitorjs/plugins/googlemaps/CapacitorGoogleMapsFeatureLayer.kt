package com.capacitorjs.plugins.googlemaps

import android.graphics.Color
import com.google.maps.android.data.Feature
import com.google.maps.android.data.Layer
import com.google.maps.android.data.geojson.GeoJsonFeature
import com.google.maps.android.data.geojson.GeoJsonLayer
import org.json.JSONObject
import java.lang.Exception

class CapacitorGoogleMapsFeatureLayer(
    layer: Layer,
    feature: Feature,
    idPropertyName: String?,
    styles: JSONObject?
) {
    var id: String? = null
    var layer: Layer? = null

    init {
        (feature as? GeoJsonFeature)?.let {
            val properties: HashMap<String, String> = hashMapOf()
            for (propertyKey in feature.propertyKeys) {
                properties[propertyKey] = feature.getProperty(propertyKey)
            }
            if (idPropertyName != null) {
                id = feature.getProperty(idPropertyName)
            }
            val newFeature =
                GeoJsonFeature(
                    feature.geometry,
                    id,
                    properties,
                    null
                )
            this.layer = layer

            val featureLayer = (layer as GeoJsonLayer)

            if (styles != null) {
                try {
                    val styleId = id ?: feature.id
                    val featureStyle = styleId?.let { styles.optJSONObject(it) }
                    if (featureStyle != null) {
                        featureLayer.defaultPolygonStyle.strokeColor =
                            processColor(
                                featureStyle.getString("strokeColor"),
                                featureStyle.getDouble("strokeOpacity")
                            )
                        featureLayer.defaultPolygonStyle.strokeWidth =
                            featureStyle.getDouble("strokeWeight").toFloat()
                        featureLayer.defaultPolygonStyle.fillColor =
                            processColor(
                                featureStyle.getString("fillColor"),
                                featureStyle.getDouble("fillOpacity")
                            )
                        featureLayer.defaultPolygonStyle.isGeodesic =
                            featureStyle.getBoolean("geodesic")
                        featureLayer.defaultLineStringStyle.color =
                            featureLayer.defaultPolygonStyle.strokeColor
                        featureLayer.defaultLineStringStyle.isGeodesic =
                            featureLayer.defaultPolygonStyle.isGeodesic
                    }
                } catch (e: Exception) {
                    throw InvalidArgumentsError("Styles object contains invalid values")
                }
            }

            featureLayer.addFeature(newFeature)
        }
    }

    private fun processColor(hex: String, opacity: Double): Int {
        val colorInt = Color.parseColor(hex)

        val alpha = (opacity * 255.0).toInt()
        val red = Color.red(colorInt)
        val green = Color.green(colorInt)
        val blue = Color.blue(colorInt)

        return Color.argb(alpha, red, green, blue)
    }

    private fun <T> JSONObject.getStyle(key: String) = this.getJSONObject(id).get(key) as T
}
