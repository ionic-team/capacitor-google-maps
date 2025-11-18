package com.capacitorjs.plugins.googlemaps

import android.graphics.Color
import com.google.maps.android.data.Feature
import com.google.maps.android.data.Layer
import com.google.maps.android.data.Geometry
import com.google.maps.android.data.geojson.GeoJsonFeature
import com.google.maps.android.data.geojson.GeoJsonLayer
import com.google.maps.android.data.geojson.GeoJsonGeometryCollection
import com.google.maps.android.data.geojson.GeoJsonMultiPoint
import com.google.maps.android.data.geojson.GeoJsonMultiLineString
import com.google.maps.android.data.geojson.GeoJsonMultiPolygon
import com.google.maps.android.data.geojson.GeoJsonPolygonStyle
import com.google.maps.android.data.geojson.GeoJsonLineStringStyle
import org.json.JSONObject
import java.lang.Exception
import java.util.UUID

class CapacitorGoogleMapsFeatureLayer(
    layer: Layer,
    feature: Feature,
    idPropertyName: String?,
    styles: JSONObject?
) {
    var id: String = idPropertyName?.let { feature.getProperty(it) } ?: feature.id ?: UUID.randomUUID().toString()
    var layer: Layer? = null
    val renderedFeatures = mutableListOf<GeoJsonFeature>()
    val originalFeature = feature as GeoJsonFeature

    init {
        (feature as? GeoJsonFeature)?.let {
            val properties: HashMap<String, String> = hashMapOf()
            for (propertyKey in feature.propertyKeys) {
                properties[propertyKey] = feature.getProperty(propertyKey)
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
            val polygonStyle = GeoJsonPolygonStyle()
            val lineStyle = GeoJsonLineStringStyle()
            polygonStyle.isClickable = true
            lineStyle.isClickable = true

            if (styles != null) {
                try {
                    val styleId = id ?: feature.id
                    val featureStyle = styleId?.let { styles.optJSONObject(it) }
                    if (featureStyle != null) {
                        polygonStyle.strokeColor =
                            processColor(
                                featureStyle.getString("strokeColor"),
                                featureStyle.getDouble("strokeOpacity")
                            )
                        polygonStyle.strokeWidth =
                            featureStyle.getDouble("strokeWeight").toFloat()
                        polygonStyle.fillColor =
                            processColor(
                                featureStyle.getString("fillColor"),
                                featureStyle.getDouble("fillOpacity")
                            )
                        polygonStyle.isGeodesic =
                            featureStyle.getBoolean("geodesic")
                        lineStyle.color = polygonStyle.strokeColor
                        lineStyle.width = polygonStyle.strokeWidth
                        lineStyle.isGeodesic = polygonStyle.isGeodesic
                    }
                } catch (e: Exception) {
                    throw InvalidArgumentsError("Styles object contains invalid values")
                }
            }

            fun addGeometry(geometry: Geometry<*>?) {
                when (geometry) {
                    is GeoJsonGeometryCollection -> geometry.geometries.forEach { addGeometry(it) }
                    is GeoJsonMultiPoint -> geometry.points.forEach { addGeometry(it) }
                    is GeoJsonMultiLineString -> geometry.lineStrings.forEach { addGeometry(it) }
                    is GeoJsonMultiPolygon -> geometry.polygons.forEach { addGeometry(it) }
                    else -> {
                        val part = GeoJsonFeature(geometry, id, properties, null)
                        part.polygonStyle = polygonStyle
                        part.lineStringStyle = lineStyle
                        renderedFeatures.add(part)
                        featureLayer.addFeature(part)
                    }
                }
            }
            addGeometry(newFeature.geometry)
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
