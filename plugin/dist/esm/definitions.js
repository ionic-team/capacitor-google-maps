import { CapacitorGoogleMaps } from './implementation';
export class LatLngBounds {
    constructor(bounds) {
        this.southwest = bounds.southwest;
        this.center = bounds.center;
        this.northeast = bounds.northeast;
    }
    async contains(point) {
        const result = await CapacitorGoogleMaps.mapBoundsContains({
            bounds: this,
            point,
        });
        return result['contains'];
    }
    async extend(point) {
        const result = await CapacitorGoogleMaps.mapBoundsExtend({
            bounds: this,
            point,
        });
        this.southwest = result['bounds']['southwest'];
        this.center = result['bounds']['center'];
        this.northeast = result['bounds']['northeast'];
        return this;
    }
}
export var MapType;
(function (MapType) {
    /**
     * Basic map.
     */
    MapType["Normal"] = "Normal";
    /**
     * Satellite imagery with roads and labels.
     */
    MapType["Hybrid"] = "Hybrid";
    /**
     * Satellite imagery with no labels.
     */
    MapType["Satellite"] = "Satellite";
    /**
     * Topographic data.
     */
    MapType["Terrain"] = "Terrain";
    /**
     * No base map tiles.
     */
    MapType["None"] = "None";
})(MapType || (MapType = {}));
//# sourceMappingURL=definitions.js.map