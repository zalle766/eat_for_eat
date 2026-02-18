/**
 * حساب المسافة بين نقطتين (صيغة Haversine) بالكيلومتر.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** ثمن التوصيل لكل كيلومتر (درهم) */
export const DELIVERY_RATE_PER_KM = 5;

/** الحد الأدنى لرسوم التوصيل (درهم) */
export const MIN_DELIVERY_FEE = 5;

/**
 * حساب رسوم التوصيل حسب المسافة بالكيلومتر.
 */
export function calculateDeliveryFee(distanceKm: number): number {
  const fee = Math.round(distanceKm * DELIVERY_RATE_PER_KM);
  return Math.max(MIN_DELIVERY_FEE, fee);
}
