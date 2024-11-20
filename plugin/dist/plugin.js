var capacitorCapacitorGoogleMaps = (function (exports, core, markerclusterer) {
    'use strict';

    const CapacitorGoogleMaps = core.registerPlugin('CapacitorGoogleMaps', {
        web: () => Promise.resolve().then(function () { return web; }).then((m) => new m.CapacitorGoogleMapsWeb()),
    });
    CapacitorGoogleMaps.addListener('isMapInFocus', (data) => {
        var _a;
        const x = data.x;
        const y = data.y;
        const elem = document.elementFromPoint(x, y);
        const internalId = (_a = elem === null || elem === void 0 ? void 0 : elem.dataset) === null || _a === void 0 ? void 0 : _a.internalId;
        const mapInFocus = internalId === data.mapId;
        CapacitorGoogleMaps.dispatchMapEvent({ id: data.mapId, focus: mapInFocus });
    });

    class LatLngBounds {
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
    exports.MapType = void 0;
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
    })(exports.MapType || (exports.MapType = {}));

    class MapCustomElement extends HTMLElement {
        constructor() {
            super();
        }
        connectedCallback() {
            this.innerHTML = '';
            if (core.Capacitor.getPlatform() == 'ios') {
                this.style.overflow = 'scroll';
                this.style['-webkit-overflow-scrolling'] = 'touch';
                const overflowDiv = document.createElement('div');
                overflowDiv.style.height = '200%';
                this.appendChild(overflowDiv);
            }
        }
    }
    customElements.define('capacitor-google-map', MapCustomElement);
    class GoogleMap {
        constructor(id) {
            this.element = null;
            this.resizeObserver = null;
            this.handleScrollEvent = () => this.updateMapBounds();
            this.id = id;
        }
        /**
         * Creates a new instance of a Google Map
         * @param options
         * @param callback
         * @returns GoogleMap
         */
        static async create(options, callback) {
            const newMap = new GoogleMap(options.id);
            if (!options.element) {
                throw new Error('container element is required');
            }
            if (options.config.androidLiteMode === undefined) {
                options.config.androidLiteMode = false;
            }
            newMap.element = options.element;
            newMap.element.dataset.internalId = options.id;
            const elementBounds = await GoogleMap.getElementBounds(options.element);
            options.config.width = elementBounds.width;
            options.config.height = elementBounds.height;
            options.config.x = elementBounds.x;
            options.config.y = elementBounds.y;
            options.config.devicePixelRatio = window.devicePixelRatio;
            if (core.Capacitor.getPlatform() == 'android') {
                newMap.initScrolling();
            }
            if (core.Capacitor.isNativePlatform()) {
                options.element = {};
                const getMapBounds = () => {
                    var _a, _b;
                    const mapRect = (_b = (_a = newMap.element) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect()) !== null && _b !== void 0 ? _b : {};
                    return {
                        x: mapRect.x,
                        y: mapRect.y,
                        width: mapRect.width,
                        height: mapRect.height,
                    };
                };
                const onDisplay = () => {
                    CapacitorGoogleMaps.onDisplay({
                        id: newMap.id,
                        mapBounds: getMapBounds(),
                    });
                };
                const onResize = () => {
                    CapacitorGoogleMaps.onResize({
                        id: newMap.id,
                        mapBounds: getMapBounds(),
                    });
                };
                const ionicPage = newMap.element.closest('.ion-page');
                if (core.Capacitor.getPlatform() === 'ios' && ionicPage) {
                    ionicPage.addEventListener('ionViewWillEnter', () => {
                        setTimeout(() => {
                            onDisplay();
                        }, 100);
                    });
                    ionicPage.addEventListener('ionViewDidEnter', () => {
                        setTimeout(() => {
                            onDisplay();
                        }, 100);
                    });
                }
                const lastState = {
                    width: elementBounds.width,
                    height: elementBounds.height,
                    isHidden: false,
                };
                newMap.resizeObserver = new ResizeObserver(() => {
                    if (newMap.element != null) {
                        const mapRect = newMap.element.getBoundingClientRect();
                        const isHidden = mapRect.width === 0 && mapRect.height === 0;
                        if (!isHidden) {
                            if (lastState.isHidden) {
                                if (core.Capacitor.getPlatform() === 'ios' && !ionicPage) {
                                    onDisplay();
                                }
                            }
                            else if (lastState.width !== mapRect.width || lastState.height !== mapRect.height) {
                                onResize();
                            }
                        }
                        lastState.width = mapRect.width;
                        lastState.height = mapRect.height;
                        lastState.isHidden = isHidden;
                    }
                });
                newMap.resizeObserver.observe(newMap.element);
            }
            // small delay to allow for iOS WKWebView to setup corresponding element sub-scroll views ???
            await new Promise((resolve, reject) => {
                setTimeout(async () => {
                    try {
                        await CapacitorGoogleMaps.create(options);
                        resolve(undefined);
                    }
                    catch (err) {
                        reject(err);
                    }
                }, 200);
            });
            if (callback) {
                const onMapReadyListener = await CapacitorGoogleMaps.addListener('onMapReady', (data) => {
                    if (data.mapId == newMap.id) {
                        callback(data);
                        onMapReadyListener.remove();
                    }
                });
            }
            return newMap;
        }
        static async getElementBounds(element) {
            return new Promise((resolve) => {
                let elementBounds = element.getBoundingClientRect();
                if (elementBounds.width == 0) {
                    let retries = 0;
                    const boundsInterval = setInterval(function () {
                        if (elementBounds.width == 0 && retries < 30) {
                            elementBounds = element.getBoundingClientRect();
                            retries++;
                        }
                        else {
                            if (retries == 30) {
                                console.warn('Map size could not be determined');
                            }
                            clearInterval(boundsInterval);
                            resolve(elementBounds);
                        }
                    }, 100);
                }
                else {
                    resolve(elementBounds);
                }
            });
        }
        /**
         * Enable touch events on native map
         *
         * @returns void
         */
        async enableTouch() {
            return CapacitorGoogleMaps.enableTouch({
                id: this.id,
            });
        }
        /**
         * Disable touch events on native map
         *
         * @returns void
         */
        async disableTouch() {
            return CapacitorGoogleMaps.disableTouch({
                id: this.id,
            });
        }
        /**
         * Enable marker clustering
         *
         * @param minClusterSize - The minimum number of markers that can be clustered together.
         * @defaultValue 4
         *
         * @returns void
         */
        async enableClustering(minClusterSize) {
            return CapacitorGoogleMaps.enableClustering({
                id: this.id,
                minClusterSize,
            });
        }
        /**
         * Disable marker clustering
         *
         * @returns void
         */
        async disableClustering() {
            return CapacitorGoogleMaps.disableClustering({
                id: this.id,
            });
        }
        /**
         * Adds a TileOverlay to the map
         */
        async addTileOverlay(tiles) {
            return await CapacitorGoogleMaps.addTileOverlay(Object.assign({ id: this.id }, tiles));
        }
        /**
         * Adds a marker to the map
         *
         * @param marker
         * @returns created marker id
         */
        async addMarker(marker) {
            const res = await CapacitorGoogleMaps.addMarker({
                id: this.id,
                marker,
            });
            return res.id;
        }
        /**
         * Adds multiple markers to the map
         *
         * @param markers
         * @returns array of created marker IDs
         */
        async addMarkers(markers) {
            const res = await CapacitorGoogleMaps.addMarkers({
                id: this.id,
                markers,
            });
            return res.ids;
        }
        /**
         * Remove marker from the map
         *
         * @param id id of the marker to remove from the map
         * @returns
         */
        async removeMarker(id) {
            return CapacitorGoogleMaps.removeMarker({
                id: this.id,
                markerId: id,
            });
        }
        /**
         * Remove markers from the map
         *
         * @param ids array of ids to remove from the map
         * @returns
         */
        async removeMarkers(ids) {
            return CapacitorGoogleMaps.removeMarkers({
                id: this.id,
                markerIds: ids,
            });
        }
        async addPolygons(polygons) {
            const res = await CapacitorGoogleMaps.addPolygons({
                id: this.id,
                polygons,
            });
            return res.ids;
        }
        async addPolylines(polylines) {
            const res = await CapacitorGoogleMaps.addPolylines({
                id: this.id,
                polylines,
            });
            return res.ids;
        }
        async removePolygons(ids) {
            return CapacitorGoogleMaps.removePolygons({
                id: this.id,
                polygonIds: ids,
            });
        }
        async addCircles(circles) {
            const res = await CapacitorGoogleMaps.addCircles({
                id: this.id,
                circles,
            });
            return res.ids;
        }
        async removeCircles(ids) {
            return CapacitorGoogleMaps.removeCircles({
                id: this.id,
                circleIds: ids,
            });
        }
        async removePolylines(ids) {
            return CapacitorGoogleMaps.removePolylines({
                id: this.id,
                polylineIds: ids,
            });
        }
        /**
         * Destroy the current instance of the map
         */
        async destroy() {
            var _a;
            if (core.Capacitor.getPlatform() == 'android') {
                this.disableScrolling();
            }
            if (core.Capacitor.isNativePlatform()) {
                (_a = this.resizeObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
            }
            this.removeAllMapListeners();
            return CapacitorGoogleMaps.destroy({
                id: this.id,
            });
        }
        /**
         * Update the map camera configuration
         *
         * @param config
         * @returns
         */
        async setCamera(config) {
            return CapacitorGoogleMaps.setCamera({
                id: this.id,
                config,
            });
        }
        async getMapType() {
            const { type } = await CapacitorGoogleMaps.getMapType({ id: this.id });
            return exports.MapType[type];
        }
        /**
         * Sets the type of map tiles that should be displayed.
         *
         * @param mapType
         * @returns
         */
        async setMapType(mapType) {
            return CapacitorGoogleMaps.setMapType({
                id: this.id,
                mapType,
            });
        }
        /**
         * Sets whether indoor maps are shown, where available.
         *
         * @param enabled
         * @returns
         */
        async enableIndoorMaps(enabled) {
            return CapacitorGoogleMaps.enableIndoorMaps({
                id: this.id,
                enabled,
            });
        }
        /**
         * Controls whether the map is drawing traffic data, if available.
         *
         * @param enabled
         * @returns
         */
        async enableTrafficLayer(enabled) {
            return CapacitorGoogleMaps.enableTrafficLayer({
                id: this.id,
                enabled,
            });
        }
        /**
         * Show accessibility elements for overlay objects, such as Marker and Polyline.
         *
         * Only available on iOS.
         *
         * @param enabled
         * @returns
         */
        async enableAccessibilityElements(enabled) {
            return CapacitorGoogleMaps.enableAccessibilityElements({
                id: this.id,
                enabled,
            });
        }
        /**
         * Set whether the My Location dot and accuracy circle is enabled.
         *
         * @param enabled
         * @returns
         */
        async enableCurrentLocation(enabled) {
            return CapacitorGoogleMaps.enableCurrentLocation({
                id: this.id,
                enabled,
            });
        }
        /**
         * Set padding on the 'visible' region of the view.
         *
         * @param padding
         * @returns
         */
        async setPadding(padding) {
            return CapacitorGoogleMaps.setPadding({
                id: this.id,
                padding,
            });
        }
        /**
         * Get the map's current viewport latitude and longitude bounds.
         *
         * @returns {LatLngBounds}
         */
        async getMapBounds() {
            return new LatLngBounds(await CapacitorGoogleMaps.getMapBounds({
                id: this.id,
            }));
        }
        async fitBounds(bounds, padding) {
            return CapacitorGoogleMaps.fitBounds({
                id: this.id,
                bounds,
                padding,
            });
        }
        initScrolling() {
            const ionContents = document.getElementsByTagName('ion-content');
            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (let i = 0; i < ionContents.length; i++) {
                ionContents[i].scrollEvents = true;
            }
            window.addEventListener('ionScroll', this.handleScrollEvent);
            window.addEventListener('scroll', this.handleScrollEvent);
            window.addEventListener('resize', this.handleScrollEvent);
            if (screen.orientation) {
                screen.orientation.addEventListener('change', () => {
                    setTimeout(this.updateMapBounds, 500);
                });
            }
            else {
                window.addEventListener('orientationchange', () => {
                    setTimeout(this.updateMapBounds, 500);
                });
            }
        }
        disableScrolling() {
            window.removeEventListener('ionScroll', this.handleScrollEvent);
            window.removeEventListener('scroll', this.handleScrollEvent);
            window.removeEventListener('resize', this.handleScrollEvent);
            if (screen.orientation) {
                screen.orientation.removeEventListener('change', () => {
                    setTimeout(this.updateMapBounds, 1000);
                });
            }
            else {
                window.removeEventListener('orientationchange', () => {
                    setTimeout(this.updateMapBounds, 1000);
                });
            }
        }
        updateMapBounds() {
            if (this.element) {
                const mapRect = this.element.getBoundingClientRect();
                CapacitorGoogleMaps.onScroll({
                    id: this.id,
                    mapBounds: {
                        x: mapRect.x,
                        y: mapRect.y,
                        width: mapRect.width,
                        height: mapRect.height,
                    },
                });
            }
        }
        /*
        private findContainerElement(): HTMLElement | null {
          if (!this.element) {
            return null;
          }
      
          let parentElement = this.element.parentElement;
          while (parentElement !== null) {
            if (window.getComputedStyle(parentElement).overflowY !== 'hidden') {
              return parentElement;
            }
      
            parentElement = parentElement.parentElement;
          }
      
          return null;
        }
        */
        /**
         * Set the event listener on the map for 'onCameraIdle' events.
         *
         * @param callback
         * @returns
         */
        async setOnCameraIdleListener(callback) {
            if (this.onCameraIdleListener) {
                this.onCameraIdleListener.remove();
            }
            if (callback) {
                this.onCameraIdleListener = await CapacitorGoogleMaps.addListener('onCameraIdle', this.generateCallback(callback));
            }
            else {
                this.onCameraIdleListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onBoundsChanged' events.
         *
         * @param callback
         * @returns
         */
        async setOnBoundsChangedListener(callback) {
            if (this.onBoundsChangedListener) {
                this.onBoundsChangedListener.remove();
            }
            if (callback) {
                this.onBoundsChangedListener = await CapacitorGoogleMaps.addListener('onBoundsChanged', this.generateCallback(callback));
            }
            else {
                this.onBoundsChangedListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onCameraMoveStarted' events.
         *
         * @param callback
         * @returns
         */
        async setOnCameraMoveStartedListener(callback) {
            if (this.onCameraMoveStartedListener) {
                this.onCameraMoveStartedListener.remove();
            }
            if (callback) {
                this.onCameraMoveStartedListener = await CapacitorGoogleMaps.addListener('onCameraMoveStarted', this.generateCallback(callback));
            }
            else {
                this.onCameraMoveStartedListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onClusterClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnClusterClickListener(callback) {
            if (this.onClusterClickListener) {
                this.onClusterClickListener.remove();
            }
            if (callback) {
                this.onClusterClickListener = await CapacitorGoogleMaps.addListener('onClusterClick', this.generateCallback(callback));
            }
            else {
                this.onClusterClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onClusterInfoWindowClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnClusterInfoWindowClickListener(callback) {
            if (this.onClusterInfoWindowClickListener) {
                this.onClusterInfoWindowClickListener.remove();
            }
            if (callback) {
                this.onClusterInfoWindowClickListener = await CapacitorGoogleMaps.addListener('onClusterInfoWindowClick', this.generateCallback(callback));
            }
            else {
                this.onClusterInfoWindowClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onInfoWindowClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnInfoWindowClickListener(callback) {
            if (this.onInfoWindowClickListener) {
                this.onInfoWindowClickListener.remove();
            }
            if (callback) {
                this.onInfoWindowClickListener = await CapacitorGoogleMaps.addListener('onInfoWindowClick', this.generateCallback(callback));
            }
            else {
                this.onInfoWindowClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMapClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnMapClickListener(callback) {
            if (this.onMapClickListener) {
                this.onMapClickListener.remove();
            }
            if (callback) {
                this.onMapClickListener = await CapacitorGoogleMaps.addListener('onMapClick', this.generateCallback(callback));
            }
            else {
                this.onMapClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onPolygonClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnPolygonClickListener(callback) {
            if (this.onPolygonClickListener) {
                this.onPolygonClickListener.remove();
            }
            if (callback) {
                this.onPolygonClickListener = await CapacitorGoogleMaps.addListener('onPolygonClick', this.generateCallback(callback));
            }
            else {
                this.onPolygonClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onCircleClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnCircleClickListener(callback) {
            if (this.onCircleClickListener)
                [this.onCircleClickListener.remove()];
            if (callback) {
                this.onCircleClickListener = await CapacitorGoogleMaps.addListener('onCircleClick', this.generateCallback(callback));
            }
            else {
                this.onCircleClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMarkerClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnMarkerClickListener(callback) {
            if (this.onMarkerClickListener) {
                this.onMarkerClickListener.remove();
            }
            if (callback) {
                this.onMarkerClickListener = await CapacitorGoogleMaps.addListener('onMarkerClick', this.generateCallback(callback));
            }
            else {
                this.onMarkerClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onPolylineClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnPolylineClickListener(callback) {
            if (this.onPolylineClickListener) {
                this.onPolylineClickListener.remove();
            }
            if (callback) {
                this.onPolylineClickListener = await CapacitorGoogleMaps.addListener('onPolylineClick', this.generateCallback(callback));
            }
            else {
                this.onPolylineClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMarkerDragStart' events.
         *
         * @param callback
         * @returns
         */
        async setOnMarkerDragStartListener(callback) {
            if (this.onMarkerDragStartListener) {
                this.onMarkerDragStartListener.remove();
            }
            if (callback) {
                this.onMarkerDragStartListener = await CapacitorGoogleMaps.addListener('onMarkerDragStart', this.generateCallback(callback));
            }
            else {
                this.onMarkerDragStartListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMarkerDrag' events.
         *
         * @param callback
         * @returns
         */
        async setOnMarkerDragListener(callback) {
            if (this.onMarkerDragListener) {
                this.onMarkerDragListener.remove();
            }
            if (callback) {
                this.onMarkerDragListener = await CapacitorGoogleMaps.addListener('onMarkerDrag', this.generateCallback(callback));
            }
            else {
                this.onMarkerDragListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMarkerDragEnd' events.
         *
         * @param callback
         * @returns
         */
        async setOnMarkerDragEndListener(callback) {
            if (this.onMarkerDragEndListener) {
                this.onMarkerDragEndListener.remove();
            }
            if (callback) {
                this.onMarkerDragEndListener = await CapacitorGoogleMaps.addListener('onMarkerDragEnd', this.generateCallback(callback));
            }
            else {
                this.onMarkerDragEndListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMyLocationButtonClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnMyLocationButtonClickListener(callback) {
            if (this.onMyLocationButtonClickListener) {
                this.onMyLocationButtonClickListener.remove();
            }
            if (callback) {
                this.onMyLocationButtonClickListener = await CapacitorGoogleMaps.addListener('onMyLocationButtonClick', this.generateCallback(callback));
            }
            else {
                this.onMyLocationButtonClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMyLocationClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnMyLocationClickListener(callback) {
            if (this.onMyLocationClickListener) {
                this.onMyLocationClickListener.remove();
            }
            if (callback) {
                this.onMyLocationClickListener = await CapacitorGoogleMaps.addListener('onMyLocationClick', this.generateCallback(callback));
            }
            else {
                this.onMyLocationClickListener = undefined;
            }
        }
        /**
         * Remove all event listeners on the map.
         *
         * @param callback
         * @returns
         */
        async removeAllMapListeners() {
            if (this.onBoundsChangedListener) {
                this.onBoundsChangedListener.remove();
                this.onBoundsChangedListener = undefined;
            }
            if (this.onCameraIdleListener) {
                this.onCameraIdleListener.remove();
                this.onCameraIdleListener = undefined;
            }
            if (this.onCameraMoveStartedListener) {
                this.onCameraMoveStartedListener.remove();
                this.onCameraMoveStartedListener = undefined;
            }
            if (this.onClusterClickListener) {
                this.onClusterClickListener.remove();
                this.onClusterClickListener = undefined;
            }
            if (this.onClusterInfoWindowClickListener) {
                this.onClusterInfoWindowClickListener.remove();
                this.onClusterInfoWindowClickListener = undefined;
            }
            if (this.onInfoWindowClickListener) {
                this.onInfoWindowClickListener.remove();
                this.onInfoWindowClickListener = undefined;
            }
            if (this.onMapClickListener) {
                this.onMapClickListener.remove();
                this.onMapClickListener = undefined;
            }
            if (this.onPolylineClickListener) {
                this.onPolylineClickListener.remove();
                this.onPolylineClickListener = undefined;
            }
            if (this.onMarkerClickListener) {
                this.onMarkerClickListener.remove();
                this.onMarkerClickListener = undefined;
            }
            if (this.onPolygonClickListener) {
                this.onPolygonClickListener.remove();
                this.onPolygonClickListener = undefined;
            }
            if (this.onCircleClickListener) {
                this.onCircleClickListener.remove();
                this.onCircleClickListener = undefined;
            }
            if (this.onMarkerDragStartListener) {
                this.onMarkerDragStartListener.remove();
                this.onMarkerDragStartListener = undefined;
            }
            if (this.onMarkerDragListener) {
                this.onMarkerDragListener.remove();
                this.onMarkerDragListener = undefined;
            }
            if (this.onMarkerDragEndListener) {
                this.onMarkerDragEndListener.remove();
                this.onMarkerDragEndListener = undefined;
            }
            if (this.onMyLocationButtonClickListener) {
                this.onMyLocationButtonClickListener.remove();
                this.onMyLocationButtonClickListener = undefined;
            }
            if (this.onMyLocationClickListener) {
                this.onMyLocationClickListener.remove();
                this.onMyLocationClickListener = undefined;
            }
        }
        generateCallback(callback) {
            const mapId = this.id;
            return (data) => {
                if (data.mapId == mapId) {
                    callback(data);
                }
            };
        }
    }

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
    class CapacitorGoogleMapsWeb extends core.WebPlugin {
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
                    type = exports.MapType.Normal;
                }
                return { type: `${type.charAt(0).toUpperCase()}${type.slice(1)}` };
            }
            throw new Error('Map type is undefined');
        }
        async setMapType(_args) {
            let mapType = _args.mapType.toLowerCase();
            if (_args.mapType === exports.MapType.Normal) {
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
            this.maps[_args.id].markerClusterer = new markerclusterer.MarkerClusterer({
                map: this.maps[_args.id].map,
                markers: markers,
                algorithm: new markerclusterer.SuperClusterAlgorithm({
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

    var web = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CapacitorGoogleMapsWeb: CapacitorGoogleMapsWeb
    });

    exports.GoogleMap = GoogleMap;
    exports.LatLngBounds = LatLngBounds;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, capacitorExports, markerclusterer);
//# sourceMappingURL=plugin.js.map
