import { WebPlugin } from '@capacitor/core';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { MapType, LatLngBounds } from './definitions';
class CoordMapType {
    constructor(tileSize) {
        this.alt = null;
        this.maxZoom = 17;
        this.minZoom = 0;
        this.name = null;
        this.projection = null;
        this.radius = 6378137;
        this.tileSize = tileSize;
    }
    getTile(coord, zoom, ownerDocument) {
        const div = ownerDocument.createElement('div');
        const pElement = ownerDocument.createElement('p');
        pElement.innerHTML = `x = ${coord.x}, y = ${coord.y}, zoom = ${zoom}`;
        pElement.style.color = 'rgba(0, 0, 0, 0.5)';
        pElement.style.padding = '0 20px';
        div.appendChild(pElement);
        div.style.width = this.tileSize.width + 'px';
        div.style.height = this.tileSize.height + 'px';
        div.style.fontSize = '10';
        div.style.borderStyle = 'solid';
        div.style.borderWidth = '1px';
        div.style.borderColor = 'rgba(0, 0, 0, 0.5)';
        return div;
    }
    releaseTile() {
        // placeholder or not implemented?
    }
}
export class CapacitorGoogleMapsWeb extends WebPlugin {
    constructor() {
        super(...arguments);
        this.gMapsRef = undefined;
        this.maps = {};
        this.currMarkerId = 0;
        this.currPolygonId = 0;
        this.currCircleId = 0;
        this.currPolylineId = 0;
        this.onClusterClickHandler = (_, cluster, map) => {
            var _a, _b;
            const mapId = this.getIdFromMap(map);
            const items = [];
            if (cluster.markers != undefined) {
                for (const marker of cluster.markers) {
                    const markerId = this.getIdFromMarker(mapId, marker);
                    items.push({
                        markerId: markerId,
                        latitude: (_a = marker.getPosition()) === null || _a === void 0 ? void 0 : _a.lat(),
                        longitude: (_b = marker.getPosition()) === null || _b === void 0 ? void 0 : _b.lng(),
                        title: marker.getTitle(),
                        snippet: '',
                    });
                }
            }
            this.notifyListeners('onClusterClick', {
                mapId: mapId,
                latitude: cluster.position.lat(),
                longitude: cluster.position.lng(),
                size: cluster.count,
                items: items,
            });
        };
    }
    getIdFromMap(map) {
        for (const id in this.maps) {
            if (this.maps[id].map == map) {
                return id;
            }
        }
        return '';
    }
    getIdFromMarker(mapId, marker) {
        for (const id in this.maps[mapId].markers) {
            if (this.maps[mapId].markers[id] == marker) {
                return id;
            }
        }
        return '';
    }
    async importGoogleLib(apiKey, region, language) {
        if (this.gMapsRef === undefined) {
            const lib = await import('@googlemaps/js-api-loader');
            const loader = new lib.Loader({
                apiKey: apiKey !== null && apiKey !== void 0 ? apiKey : '',
                version: 'weekly',
                libraries: ['places'],
                language,
                region,
            });
            const google = await loader.load();
            this.gMapsRef = google.maps;
            console.log('Loaded google maps API');
        }
    }
    async enableTouch(_args) {
        this.maps[_args.id].map.setOptions({ gestureHandling: 'auto' });
    }
    async disableTouch(_args) {
        this.maps[_args.id].map.setOptions({ gestureHandling: 'none' });
    }
    async setCamera(_args) {
        // Animation not supported yet...
        this.maps[_args.id].map.moveCamera({
            center: _args.config.coordinate,
            heading: _args.config.bearing,
            tilt: _args.config.angle,
            zoom: _args.config.zoom,
        });
    }
    async getMapType(_args) {
        let type = this.maps[_args.id].map.getMapTypeId();
        if (type !== undefined) {
            if (type === 'roadmap') {
                type = MapType.Normal;
            }
            return { type: `${type.charAt(0).toUpperCase()}${type.slice(1)}` };
        }
        throw new Error('Map type is undefined');
    }
    async setMapType(_args) {
        let mapType = _args.mapType.toLowerCase();
        if (_args.mapType === MapType.Normal) {
            mapType = 'roadmap';
        }
        this.maps[_args.id].map.setMapTypeId(mapType);
    }
    async enableIndoorMaps() {
        throw new Error('Method not supported on web.');
    }
    async enableTrafficLayer(_args) {
        var _a;
        const trafficLayer = (_a = this.maps[_args.id].trafficLayer) !== null && _a !== void 0 ? _a : new google.maps.TrafficLayer();
        if (_args.enabled) {
            trafficLayer.setMap(this.maps[_args.id].map);
            this.maps[_args.id].trafficLayer = trafficLayer;
        }
        else if (this.maps[_args.id].trafficLayer) {
            trafficLayer.setMap(null);
            this.maps[_args.id].trafficLayer = undefined;
        }
    }
    async enableAccessibilityElements() {
        throw new Error('Method not supported on web.');
    }
    dispatchMapEvent() {
        throw new Error('Method not supported on web.');
    }
    async enableCurrentLocation(_args) {
        if (_args.enabled) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    this.maps[_args.id].map.setCenter(pos);
                    this.notifyListeners('onMyLocationButtonClick', {});
                    this.notifyListeners('onMyLocationClick', {});
                }, () => {
                    throw new Error('Geolocation not supported on web browser.');
                });
            }
            else {
                throw new Error('Geolocation not supported on web browser.');
            }
        }
    }
    async setPadding(_args) {
        const bounds = this.maps[_args.id].map.getBounds();
        if (bounds !== undefined) {
            this.maps[_args.id].map.fitBounds(bounds, _args.padding);
        }
    }
    async getMapBounds(_args) {
        const bounds = this.maps[_args.id].map.getBounds();
        if (!bounds) {
            throw new Error('Google Map Bounds could not be found.');
        }
        return new LatLngBounds({
            southwest: {
                lat: bounds.getSouthWest().lat(),
                lng: bounds.getSouthWest().lng(),
            },
            center: {
                lat: bounds.getCenter().lat(),
                lng: bounds.getCenter().lng(),
            },
            northeast: {
                lat: bounds.getNorthEast().lat(),
                lng: bounds.getNorthEast().lng(),
            },
        });
    }
    async fitBounds(_args) {
        const map = this.maps[_args.id].map;
        const bounds = this.getLatLngBounds(_args.bounds);
        map.fitBounds(bounds, _args.padding);
    }
    async addTileOverlay(_args) {
        const map = this.maps[_args.id].map;
        const tileSize = new google.maps.Size(256, 256); // Create a google.maps.Size instance
        const coordMapType = new CoordMapType(tileSize);
        // Create a TileOverlay object
        const customMapOverlay = new google.maps.ImageMapType({
            getTileUrl: function (coord, zoom) {
                return _args.getTile(coord.x, coord.y, zoom);
            },
            tileSize: new google.maps.Size(256, 256),
            opacity: _args === null || _args === void 0 ? void 0 : _args.opacity,
            name: 'tileoverlay',
        });
        // Draw Tiles
        map.overlayMapTypes.insertAt(0, coordMapType); // insert coordMapType at the first position
        // Add the TileOverlay to the map
        map.overlayMapTypes.push(customMapOverlay);
        // Optionally, you can set debug mode if needed
        if (_args === null || _args === void 0 ? void 0 : _args.debug) {
            map.addListener('mousemove', function (event) {
                console.log('Mouse Coordinates: ', event.latLng.toString());
            });
        }
        // Set visibility based on the 'visible' property
        if (!(_args === null || _args === void 0 ? void 0 : _args.visible)) {
            map.overlayMapTypes.pop(); // Remove the last overlay (customMapOverlay) from the stack
        }
        // Set zIndex based on the 'zIndex' property
        if ((_args === null || _args === void 0 ? void 0 : _args.zIndex) !== undefined) {
            // Move the customMapOverlay to the specified index in the overlay stack
            map.overlayMapTypes.setAt(map.overlayMapTypes.getLength() - 1, customMapOverlay);
        }
    }
    async addMarkers(_args) {
        const markerIds = [];
        const map = this.maps[_args.id];
        for (const markerArgs of _args.markers) {
            const markerOpts = this.buildMarkerOpts(markerArgs, map.map);
            const marker = new google.maps.Marker(markerOpts);
            const id = '' + this.currMarkerId;
            map.markers[id] = marker;
            this.setMarkerListeners(_args.id, id, marker);
            markerIds.push(id);
            this.currMarkerId++;
        }
        return { ids: markerIds };
    }
    async addMarker(_args) {
        const markerOpts = this.buildMarkerOpts(_args.marker, this.maps[_args.id].map);
        const marker = new google.maps.Marker(markerOpts);
        const id = '' + this.currMarkerId;
        this.maps[_args.id].markers[id] = marker;
        this.setMarkerListeners(_args.id, id, marker);
        this.currMarkerId++;
        return { id: id };
    }
    async removeMarkers(_args) {
        const map = this.maps[_args.id];
        for (const id of _args.markerIds) {
            map.markers[id].setMap(null);
            delete map.markers[id];
        }
    }
    async removeMarker(_args) {
        this.maps[_args.id].markers[_args.markerId].setMap(null);
        delete this.maps[_args.id].markers[_args.markerId];
    }
    async addPolygons(args) {
        const polygonIds = [];
        const map = this.maps[args.id];
        for (const polygonArgs of args.polygons) {
            const polygon = new google.maps.Polygon(polygonArgs);
            polygon.setMap(map.map);
            const id = '' + this.currPolygonId;
            this.maps[args.id].polygons[id] = polygon;
            this.setPolygonListeners(args.id, id, polygon);
            polygonIds.push(id);
            this.currPolygonId++;
        }
        return { ids: polygonIds };
    }
    async removePolygons(args) {
        const map = this.maps[args.id];
        for (const id of args.polygonIds) {
            map.polygons[id].setMap(null);
            delete map.polygons[id];
        }
    }
    async addCircles(args) {
        const circleIds = [];
        const map = this.maps[args.id];
        for (const circleArgs of args.circles) {
            const circle = new google.maps.Circle(circleArgs);
            circle.setMap(map.map);
            const id = '' + this.currCircleId;
            this.maps[args.id].circles[id] = circle;
            this.setCircleListeners(args.id, id, circle);
            circleIds.push(id);
            this.currCircleId++;
        }
        return { ids: circleIds };
    }
    async removeCircles(args) {
        const map = this.maps[args.id];
        for (const id of args.circleIds) {
            map.circles[id].setMap(null);
            delete map.circles[id];
        }
    }
    async addPolylines(args) {
        const lineIds = [];
        const map = this.maps[args.id];
        for (const polylineArgs of args.polylines) {
            const polyline = new google.maps.Polyline(polylineArgs);
            polyline.set('tag', polylineArgs.tag);
            polyline.setMap(map.map);
            const id = '' + this.currPolylineId;
            this.maps[args.id].polylines[id] = polyline;
            this.setPolylineListeners(args.id, id, polyline);
            lineIds.push(id);
            this.currPolylineId++;
        }
        return {
            ids: lineIds,
        };
    }
    async removePolylines(args) {
        const map = this.maps[args.id];
        for (const id of args.polylineIds) {
            map.polylines[id].setMap(null);
            delete map.polylines[id];
        }
    }
    async enableClustering(_args) {
        var _a;
        const markers = [];
        for (const id in this.maps[_args.id].markers) {
            markers.push(this.maps[_args.id].markers[id]);
        }
        this.maps[_args.id].markerClusterer = new MarkerClusterer({
            map: this.maps[_args.id].map,
            markers: markers,
            algorithm: new SuperClusterAlgorithm({
                minPoints: (_a = _args.minClusterSize) !== null && _a !== void 0 ? _a : 4,
            }),
            onClusterClick: this.onClusterClickHandler,
        });
    }
    async disableClustering(_args) {
        var _a;
        (_a = this.maps[_args.id].markerClusterer) === null || _a === void 0 ? void 0 : _a.setMap(null);
        this.maps[_args.id].markerClusterer = undefined;
    }
    async onScroll() {
        throw new Error('Method not supported on web.');
    }
    async onResize() {
        throw new Error('Method not supported on web.');
    }
    async onDisplay() {
        throw new Error('Method not supported on web.');
    }
    async create(_args) {
        console.log(`Create map: ${_args.id}`);
        await this.importGoogleLib(_args.apiKey, _args.region, _args.language);
        this.maps[_args.id] = {
            map: new window.google.maps.Map(_args.element, Object.assign({}, _args.config)),
            element: _args.element,
            markers: {},
            polygons: {},
            circles: {},
            polylines: {},
        };
        this.setMapListeners(_args.id);
    }
    async destroy(_args) {
        console.log(`Destroy map: ${_args.id}`);
        const mapItem = this.maps[_args.id];
        mapItem.element.innerHTML = '';
        mapItem.map.unbindAll();
        delete this.maps[_args.id];
    }
    async mapBoundsContains(_args) {
        const bounds = this.getLatLngBounds(_args.bounds);
        const point = new google.maps.LatLng(_args.point.lat, _args.point.lng);
        return { contains: bounds.contains(point) };
    }
    async mapBoundsExtend(_args) {
        const bounds = this.getLatLngBounds(_args.bounds);
        const point = new google.maps.LatLng(_args.point.lat, _args.point.lng);
        bounds.extend(point);
        const result = new LatLngBounds({
            southwest: {
                lat: bounds.getSouthWest().lat(),
                lng: bounds.getSouthWest().lng(),
            },
            center: {
                lat: bounds.getCenter().lat(),
                lng: bounds.getCenter().lng(),
            },
            northeast: {
                lat: bounds.getNorthEast().lat(),
                lng: bounds.getNorthEast().lng(),
            },
        });
        return { bounds: result };
    }
    getLatLngBounds(_args) {
        return new google.maps.LatLngBounds(new google.maps.LatLng(_args.southwest.lat, _args.southwest.lng), new google.maps.LatLng(_args.northeast.lat, _args.northeast.lng));
    }
    async setCircleListeners(mapId, circleId, circle) {
        circle.addListener('click', () => {
            this.notifyListeners('onCircleClick', {
                mapId: mapId,
                circleId: circleId,
                tag: circle.get('tag'),
            });
        });
    }
    async setPolygonListeners(mapId, polygonId, polygon) {
        polygon.addListener('click', () => {
            this.notifyListeners('onPolygonClick', {
                mapId: mapId,
                polygonId: polygonId,
                tag: polygon.get('tag'),
            });
        });
    }
    async setPolylineListeners(mapId, polylineId, polyline) {
        polyline.addListener('click', () => {
            this.notifyListeners('onPolylineClick', {
                mapId: mapId,
                polylineId: polylineId,
                tag: polyline.get('tag'),
            });
        });
    }
    async setMarkerListeners(mapId, markerId, marker) {
        marker.addListener('click', () => {
            var _a, _b;
            this.notifyListeners('onMarkerClick', {
                mapId: mapId,
                markerId: markerId,
                latitude: (_a = marker.getPosition()) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = marker.getPosition()) === null || _b === void 0 ? void 0 : _b.lng(),
                title: marker.getTitle(),
                snippet: '',
            });
        });
        marker.addListener('dragstart', () => {
            var _a, _b;
            this.notifyListeners('onMarkerDragStart', {
                mapId: mapId,
                markerId: markerId,
                latitude: (_a = marker.getPosition()) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = marker.getPosition()) === null || _b === void 0 ? void 0 : _b.lng(),
                title: marker.getTitle(),
                snippet: '',
            });
        });
        marker.addListener('drag', () => {
            var _a, _b;
            this.notifyListeners('onMarkerDrag', {
                mapId: mapId,
                markerId: markerId,
                latitude: (_a = marker.getPosition()) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = marker.getPosition()) === null || _b === void 0 ? void 0 : _b.lng(),
                title: marker.getTitle(),
                snippet: '',
            });
        });
        marker.addListener('dragend', () => {
            var _a, _b;
            this.notifyListeners('onMarkerDragEnd', {
                mapId: mapId,
                markerId: markerId,
                latitude: (_a = marker.getPosition()) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = marker.getPosition()) === null || _b === void 0 ? void 0 : _b.lng(),
                title: marker.getTitle(),
                snippet: '',
            });
        });
    }
    async setMapListeners(mapId) {
        const map = this.maps[mapId].map;
        map.addListener('idle', async () => {
            var _a, _b;
            const bounds = await this.getMapBounds({ id: mapId });
            this.notifyListeners('onCameraIdle', {
                mapId: mapId,
                bearing: map.getHeading(),
                bounds: bounds,
                latitude: (_a = map.getCenter()) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = map.getCenter()) === null || _b === void 0 ? void 0 : _b.lng(),
                tilt: map.getTilt(),
                zoom: map.getZoom(),
            });
        });
        map.addListener('center_changed', () => {
            this.notifyListeners('onCameraMoveStarted', {
                mapId: mapId,
                isGesture: true,
            });
        });
        map.addListener('bounds_changed', async () => {
            var _a, _b;
            const bounds = await this.getMapBounds({ id: mapId });
            this.notifyListeners('onBoundsChanged', {
                mapId: mapId,
                bearing: map.getHeading(),
                bounds: bounds,
                latitude: (_a = map.getCenter()) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = map.getCenter()) === null || _b === void 0 ? void 0 : _b.lng(),
                tilt: map.getTilt(),
                zoom: map.getZoom(),
            });
        });
        map.addListener('click', (e) => {
            var _a, _b;
            this.notifyListeners('onMapClick', {
                mapId: mapId,
                latitude: (_a = e.latLng) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = e.latLng) === null || _b === void 0 ? void 0 : _b.lng(),
            });
        });
        this.notifyListeners('onMapReady', {
            mapId: mapId,
        });
    }
    buildMarkerOpts(marker, map) {
        var _a;
        let iconImage = undefined;
        if (marker.iconUrl) {
            iconImage = {
                url: marker.iconUrl,
                scaledSize: marker.iconSize ? new google.maps.Size(marker.iconSize.width, marker.iconSize.height) : null,
                anchor: marker.iconAnchor
                    ? new google.maps.Point(marker.iconAnchor.x, marker.iconAnchor.y)
                    : new google.maps.Point(0, 0),
                origin: marker.iconOrigin
                    ? new google.maps.Point(marker.iconOrigin.x, marker.iconOrigin.y)
                    : new google.maps.Point(0, 0),
            };
        }
        const opts = {
            position: marker.coordinate,
            map: map,
            opacity: marker.opacity,
            title: marker.title,
            icon: iconImage,
            draggable: marker.draggable,
            zIndex: (_a = marker.zIndex) !== null && _a !== void 0 ? _a : 0,
        };
        return opts;
    }
}
//# sourceMappingURL=web.js.map