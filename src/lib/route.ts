/**
 * جلب مسار الطريق بين نقطتين عبر OSRM (مجاني، يعتمد على OpenStreetMap).
 * المسار يتبع الشوارع وليس خطاً مستقيماً.
 */

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export type LatLng = [number, number];

export async function getRoutePoints(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<LatLng[]> {
  try {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const res = await fetch(
      `${OSRM_URL}/${coords}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) {
      return [];
    }
    const coordsGeo = data.routes[0].geometry.coordinates as [number, number][];
    return coordsGeo.map(([lng, lat]) => [lat, lng] as LatLng);
  } catch (e) {
    console.warn('OSRM route failed:', e);
    return [];
  }
}
