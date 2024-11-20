import { Capacitor } from '@capacitor/core';
import { LatLngBounds, MapType } from './definitions';
import { CapacitorGoogleMaps } from './implementation';
class MapCustomElement extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '';
        if (Capacitor.getPlatform() == 'ios') {
            this.style.overflow = 'scroll';
            this.style['-webkit-overflow-scrolling'] = 'touch';
            const overflowDiv = document.createElement('div');
            overflowDiv.style.height = '200%';
            this.appendChild(overflowDiv);
        }
    }
}
customElements.define('capacitor-google-map', MapCustomElement);
export class GoogleMap {
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
        if (Capacitor.getPlatform() == 'android') {
            newMap.initScrolling();
        }
        if (Capacitor.isNativePlatform()) {
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
            if (Capacitor.getPlatform() === 'ios' && ionicPage) {
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
                            if (Capacitor.getPlatform() === 'ios' && !ionicPage) {
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
        if (Capacitor.getPlatform() == 'android') {
            this.disableScrolling();
        }
        if (Capacitor.isNativePlatform()) {
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
        return MapType[type];
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
//# sourceMappingURL=map.js.map