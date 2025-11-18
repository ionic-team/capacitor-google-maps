import { CapacitorGoogleMaps } from './implementation';

/**
 * An interface representing the viewports latitude and longitude bounds.
 */
export interface LatLngBoundsInterface {
  southwest: LatLng;
  center: LatLng;
  northeast: LatLng;
}

export class LatLngBounds {
  southwest: LatLng;
  center: LatLng;
  northeast: LatLng;

  constructor(bounds: LatLngBoundsInterface) {
    this.southwest = bounds.southwest;
    this.center = bounds.center;
    this.northeast = bounds.northeast;
  }

  async contains(point: LatLng): Promise<boolean> {
    const result = await CapacitorGoogleMaps.mapBoundsContains({
      bounds: this,
      point,
    });
    return result['contains'];
  }

  async extend(point: LatLng): Promise<LatLngBounds> {
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

/**
 * An interface representing a pair of latitude and longitude coordinates.
 */
export interface LatLng {
  /**
   * Coordinate latitude, in degrees. This value is in the range [-90, 90].
   */
  lat: number;

  /**
   * Coordinate longitude, in degrees. This value is in the range [-180, 180].
   */
  lng: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * For web, all the javascript Polygon options are available as
 * Polygon extends google.maps.PolygonOptions.
 * For iOS and Android only the config options declared on Polygon are available.
 */
export interface Polygon extends google.maps.PolygonOptions {
  paths?: google.maps.MVCArray<any> | any[];
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  fillColor?: string;
  fillOpacity?: number;
  geodesic?: boolean;
  clickable?: boolean;
  /**
   * Title, a short description of the overlay. Some overlays, such as markers, will display the title on the map. The title is also the default accessibility text.
   *
   * Only available on iOS.
   */
  title?: string;
  tag?: string;
}

/**
 * For web, all the javascript Circle options are available as
 * Circle extends google.maps.CircleOptions.
 * For iOS and Android only the config options declared on Circle are available.
 */
export interface Circle extends google.maps.CircleOptions {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWeight?: number;
  geodesic?: boolean;
  clickable?: boolean;
  /**
   * Title, a short description of the overlay. Some overlays, such as markers, will display the title on the map. The title is also the default accessibility text.
   *
   * Only available on iOS.
   */
  title?: string;
  tag?: string;
}

/**
 * For web, all the javascript Polyline options are available as
 * Polyline extends google.maps.PolylineOptions.
 * For iOS and Android only the config options declared on Polyline are available.
 */
export interface Polyline extends google.maps.PolylineOptions {
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  geodesic?: boolean;
  clickable?: boolean;
  tag?: string;
  /**
   * Used to specify the color of one or more segments of a polyline. The styleSpans property is an array of StyleSpan objects.
   * Setting the spans property is the preferred way to change the color of a polyline.
   *
   * Only on iOS and Android.
   */
  styleSpans?: StyleSpan[];
}

/**
 * Feature types
 */
export enum FeatureType {
  /**
   * Default
   */
  Default = 'Default',
  /**
   * GeoJSON
   */
  GeoJSON = 'GeoJSON',
}

/**
 * Feature styles, identified by the feature id
 */
export interface FeatureStyles {
  [key: string]: {
    strokeColor: string;
    strokeOpacity: number;
    strokeWeight: number;
    fillColor: string;
    fillOpacity: number;
    geodesic: boolean;
  };
}

/**
 * Describes the style for some region of a polyline.
 */
export interface StyleSpan {
  /**
   * The stroke color. All CSS3 colors are supported except for extended named colors.
   */
  color: string;
  /**
   * The length of this span in number of segments.
   */
  segments?: number;
}

/**
 * For web, all the javascript Google Maps options are available as
 * GoogleMapConfig extends google.maps.MapOptions.
 * For iOS and Android only the config options declared on GoogleMapConfig are available.
 */
export interface GoogleMapConfig extends google.maps.MapOptions {
  /**
   * Override width for native map.
   */
  width?: number;
  /**
   * Override height for native map.
   */
  height?: number;
  /**
   * Override absolute x coordinate position for native map.
   */
  x?: number;
  /**
   * Override absolute y coordinate position for native map.
   */
  y?: number;
  /**
   * Default location on the Earth towards which the camera points.
   */
  center: LatLng;
  /**
   * Sets the zoom of the map.
   */
  zoom: number;
  /**
   * Enables image-based lite mode on Android.
   *
   * @default false
   */
  androidLiteMode?: boolean;
  /**
   * Override pixel ratio for native map.
   */
  devicePixelRatio?: number;
  /**
   * Styles to apply to each of the default map types. Note that for
   * satellite, hybrid and terrain modes,
   * these styles will only apply to labels and geometry.
   *
   * @since 4.3.0
   */
  styles?: google.maps.MapTypeStyle[] | null;
  /**
   * A map id associated with a specific map style or feature.
   *
   * [Use Map IDs](https://developers.google.com/maps/documentation/get-map-id)
   *
   * Only for Web.
   *
   * @since 5.4.0
   */
  mapId?: string;
  /**
   * A map id associated with a specific map style or feature.
   *
   * [Use Map IDs](https://developers.google.com/maps/documentation/get-map-id)
   *
   * Only for Android.
   *
   * @since 5.4.0
   */
  androidMapId?: string;
  /**
   * A map id associated with a specific map style or feature.
   *
   * [Use Map IDs](https://developers.google.com/maps/documentation/get-map-id)
   *
   * Only for iOS.
   *
   * @since 5.4.0
   */
  iOSMapId?: string;
  /**
   * The maximum zoom level which will be displayed on the map. If omitted, or
   * set to <code>null</code>, the maximum zoom from the current map type is
   * used instead. Valid zoom values are numbers from zero up to the supported
   * <a
   * href="https://developers.google.com/maps/documentation/javascript/maxzoom">maximum
   * zoom level</a>.
   */
  maxZoom?: number | null;
  /**
   * The minimum zoom level which will be displayed on the map. If omitted, or
   * set to <code>null</code>, the minimum zoom from the current map type is
   * used instead. Valid zoom values are numbers from zero up to the supported
   * <a
   * href="https://developers.google.com/maps/documentation/javascript/maxzoom">maximum
   * zoom level</a>.
   */
  minZoom?: number | null;
  /**
   * The initial Map mapTypeId. Defaults to <code>ROADMAP</code>.
   */
  mapTypeId?: string | null;
  /**
   * The heading for aerial imagery in degrees measured clockwise from
   * cardinal direction North. Headings are snapped to the nearest available
   * angle for which imagery is available.
   */
  heading?: number | null;
  /**
   * Defines a boundary that restricts the area of the map accessible to
   * users. When set, a user can only pan and zoom while the camera view stays
   * inside the limits of the boundary.
   */
  restriction?: google.maps.MapRestriction | null;
}

/**
 * Configuration properties for a Google Map Camera
 */
export interface CameraConfig {
  /**
   * Location on the Earth towards which the camera points.
   */
  coordinate?: LatLng;
  /**
   * Sets the zoom of the map.
   */
  zoom?: number;
  /**
   * Bearing of the camera, in degrees clockwise from true north.
   *
   * @default 0
   */
  bearing?: number;
  /**
   * The angle, in degrees, of the camera from the nadir (directly facing the Earth).
   *
   * The only allowed values are 0 and 45.
   *
   * @default 0
   */
  angle?: number;
  /**
   * Animate the transition to the new Camera properties.
   *
   * @default false
   */
  animate?: boolean;

  /**
   * This configuration option is not being used.
   */
  animationDuration?: number;
}

export enum MapType {
  /**
   * Basic map.
   */
  Normal = 'Normal',
  /**
   * Satellite imagery with roads and labels.
   */
  Hybrid = 'Hybrid',
  /**
   * Satellite imagery with no labels.
   */
  Satellite = 'Satellite',
  /**
   * Topographic data.
   */
  Terrain = 'Terrain',
  /**
   * No base map tiles.
   */
  None = 'None',
}

/**
 * Controls for setting padding on the 'visible' region of the view.
 */
export interface MapPadding {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/**
 * A tile overlay is an image placed on top of your map at a specific zoom level. Available on iOS, Android and Web
 */
export interface TileOverlay {
  /**
   * A string representing the tile url. Should contain `{x}`, `{y}` and `{z}` so they can be replaced with actual values for x, y and zoom. Available on iOS, Android and Web
   *
   * @type {string}
   */
  url: string;

  /**
   * The opacity of the tile overlay, between 0 (completely transparent) and 1 inclusive. Available on iOS, Android and Web
   *
   * @type {number | undefined}
   * @default undefined
   */
  opacity?: number;

  /**
   * Controls whether this tile overlay should be visible. Available only on Android
   *
   * @type {boolean | undefined}
   * @default undefined
   */
  visible?: boolean;

  /**
   * The zIndex of the tile overlay. Available on iOS and Android
   *
   * @type {number | undefined}
   * @default undefined
   */
  zIndex?: number;
}

/**
 * A marker is an icon placed at a particular point on the map's surface.
 */
export interface Marker {
  /**
   * Marker position
   */
  coordinate: LatLng;
  /**
   * Sets the opacity of the marker, between 0 (completely transparent) and 1 inclusive.
   *
   * @default 1
   */
  opacity?: number;
  /**
   * Title, a short description of the overlay.
   */
  title?: string;
  /**
   * Snippet text, shown beneath the title in the info window when selected.
   */
  snippet?: string;
  /**
   * Controls whether this marker should be flat against the Earth's surface or a billboard facing the camera.
   *
   * @default false
   */
  isFlat?: boolean;
  /**
   * Path to a marker icon to render. It can be relative to the web app public directory,
   * or a https url of a remote marker icon.
   *
   * **SVGs are not supported on native platforms.**
   *
   * @usage
   * ```typescript
   * {
   * ...
   *  iconUrl: 'assets/icon/pin.png',
   *  ...
   * }
   * ```
   *
   * @since 4.2.0
   */
  iconUrl?: string;
  /**
   * Controls the scaled size of the marker image set in `iconUrl`.
   *
   * @since 4.2.0
   */
  iconSize?: Size;

  /**
   * The position of the image within a sprite, if any. By default, the origin is located at the top left corner of the image .
   *
   * @since 4.2.0
   */
  iconOrigin?: Point;

  /**
   * The position at which to anchor an image in correspondence to the location of the marker on the map. By default, the anchor is located along the center point of the bottom of the image.
   *
   * @since 4.2.0
   */
  iconAnchor?: Point;
  /**
   * Customizes the color of the default marker image.  Each value must be between 0 and 255.
   *
   * Only for iOS and Android.
   *
   * @since 4.2.0
   */
  tintColor?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };

  /**
   * Controls whether this marker can be dragged interactively
   *
   * @default false
   */
  draggable?: boolean;

  /**
   * Specifies the stack order of this marker, relative to other markers on the map.
   * A marker with a high z-index is drawn on top of markers with lower z-indexes
   *
   * @default 0
   */
  zIndex?: number;
}

/**
 * The callback function to be called when map events are emitted.
 */
export type MapListenerCallback<T> = (data: T) => void;

export interface MapReadyCallbackData {
  mapId: string;
}

export interface MarkerCallbackData {
  markerId: string;
  latitude: number;
  longitude: number;
  title: string;
  snippet: string;
}

export interface PolylineCallbackData {
  polylineId: string;
  tag?: string;
}

export interface CameraIdleCallbackData {
  mapId: string;
  bounds: LatLngBounds;
  bearing: number;
  latitude: number;
  longitude: number;
  tilt: number;
  zoom: number;
}

export interface CameraMoveStartedCallbackData {
  mapId: string;
  isGesture: boolean;
}

export interface ClusterClickCallbackData {
  mapId: string;
  latitude: number;
  longitude: number;
  size: number;
  items: MarkerCallbackData[];
}

export interface MapClickCallbackData {
  mapId: string;
  latitude: number;
  longitude: number;
}

export interface MarkerClickCallbackData extends MarkerCallbackData {
  mapId: string;
}

export interface PolygonClickCallbackData {
  mapId: string;
  polygonId: string;
  tag?: string;
}

export interface CircleClickCallbackData {
  mapId: string;
  circleId: string;
  tag?: string;
}

export interface MyLocationButtonClickCallbackData {
  mapId: string;
}
