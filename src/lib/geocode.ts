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

/** Reverse geocoding: convert coordinates to address */
export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { Accept: 'application/json' } }
    );
    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      // بناء العنوان من المكونات المتاحة
      const streetParts = [
        addr.road,
        addr.house_number,
        addr.house
      ].filter(Boolean);
      const address = streetParts.length > 0 
        ? streetParts.join(' ') 
        : addr.suburb || addr.neighbourhood || addr.quarter || '';
      
      // المدينة من address object
      const city = addr.city || addr.town || addr.village || addr.municipality || 'Marrakech';
      
      return {
        address: address || data.display_name?.split(',')[0] || '',
        city: city
      };
    }
  } catch (e) {
    console.warn('Reverse geocoding failed:', e);
  }
  return { address: '', city: 'Marrakech' };
}

/** Offset from delivery point to simulate driver position when no real GPS. */
export function simulateDriverPosition(deliveryLat: number, deliveryLng: number): GeoResult {
  return {
    lat: deliveryLat + (Math.random() * 0.01 - 0.005),
    lng: deliveryLng + (Math.random() * 0.01 - 0.005),
  };
}
