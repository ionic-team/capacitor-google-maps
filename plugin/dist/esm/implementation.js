import { registerPlugin } from '@capacitor/core';
const CapacitorGoogleMaps = registerPlugin('CapacitorGoogleMaps', {
    web: () => import('./web').then((m) => new m.CapacitorGoogleMapsWeb()),
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
export { CapacitorGoogleMaps };
//# sourceMappingURL=implementation.js.map