/**
 * Geocoding via Nominatim (OpenStreetMap) - free, no API key.
 * Use sparingly (max 1 request/second) per Nominatim usage policy.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const MARRAKECH_FALLBACK = { lat: 31.6295, lng: -7.9811 };

export interface GeoResult {
  lat: number;
  lng: number;
  displayName?: string;
}

export async function geocodeAddress(address: string, city: string): Promise<GeoResult> {
  const query = [address, city, 'Marrakech', 'Morocco'].filter(Boolean).join(', ');
  try {
    const res = await fetch(
      `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { Accept: 'application/json' } }
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
  } catch (e) {
    console.warn('Geocoding failed, using Marrakech center:', e);
  }
  return MARRAKECH_FALLBACK;
}

/** Offset from delivery point to simulate driver position when no real GPS. */
export function simulateDriverPosition(deliveryLat: number, deliveryLng: number): GeoResult {
  return {
    lat: deliveryLat + (Math.random() * 0.01 - 0.005),
    lng: deliveryLng + (Math.random() * 0.01 - 0.005),
  };
}
