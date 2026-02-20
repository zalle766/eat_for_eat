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
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
      { 
        headers: { 
          Accept: 'application/json',
          'User-Agent': 'EatForEat/1.0'
        } 
      }
    );
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    if (data && data.address) {
      const addr = data.address;
      
      // بناء العنوان من المكونات المتاحة (أفضل طريقة)
      const streetParts = [
        addr.road,
        addr.house_number,
        addr.house
      ].filter(Boolean);
      
      let address = '';
      if (streetParts.length > 0) {
        address = streetParts.join(' ');
      } else {
        // استخدام بدائل إذا لم يكن هناك road
        const alternatives = [
          addr.suburb,
          addr.neighbourhood,
          addr.quarter,
          addr.district,
          addr.village
        ].filter(Boolean);
        address = alternatives[0] || '';
      }
      
      // إذا لم نجد عنواناً بعد، استخدم display_name
      if (!address && data.display_name) {
        // أخذ الجزء الأول من display_name (عادة يكون العنوان)
        const parts = data.display_name.split(',');
        address = parts[0]?.trim() || '';
        // إذا كان العنوان طويلاً جداً، خذ أول جزئين
        if (address.length > 50 && parts.length > 1) {
          address = `${parts[0]?.trim()}, ${parts[1]?.trim()}`;
        }
      }
      
      // المدينة من address object (مع بدائل متعددة)
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || 'Marrakech';
      
      // إذا لم نجد عنواناً نهائياً، استخدم "Position actuelle" مع المدينة
      if (!address || address.length < 3) {
        address = `Position actuelle (${city})`;
      }
      
      return {
        address: address,
        city: city
      };
    } else if (data && data.display_name) {
      // إذا لم يكن هناك address object، استخدم display_name
      const parts = data.display_name.split(',');
      const address = parts[0]?.trim() || 'Position actuelle';
      const city = parts.find(p => 
        p.includes('Marrakech') || 
        p.includes('مراكش') ||
        p.includes('Morocco')
      )?.trim() || 'Marrakech';
      
      return {
        address: address,
        city: city.replace(/Marrakech|مراكش|Morocco/gi, '').trim() || 'Marrakech'
      };
    }
  } catch (e) {
    console.warn('Reverse geocoding failed:', e);
  }
  
  // Fallback: إرجاع عنوان افتراضي مع المدينة
  return { 
    address: 'Position actuelle (Marrakech)', 
    city: 'Marrakech' 
  };
}

/** Offset from delivery point to simulate driver position when no real GPS. */
export function simulateDriverPosition(deliveryLat: number, deliveryLng: number): GeoResult {
  return {
    lat: deliveryLat + (Math.random() * 0.01 - 0.005),
    lng: deliveryLng + (Math.random() * 0.01 - 0.005),
  };
}
