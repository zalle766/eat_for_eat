import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRoutePoints, type LatLng } from '../../lib/route';

const createCustomIcon = (
  color: string,
  iconClass: string,
  label: string
) =>
  L.divIcon({
    className: 'track-map-custom-marker',
    html: `
      <div class="track-marker-inner" style="background:${color};box-shadow:0 2px 8px rgba(0,0,0,0.25);">
        <i class="${iconClass}" style="font-size:18px;color:white;"></i>
      </div>
      <span class="track-marker-label">${label}</span>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });

const restaurantIcon = createCustomIcon('#ea580c', 'ri-store-3-line', 'Restaurant');
const driverIcon = createCustomIcon('#16a34a', 'ri-motorcycle-line', 'Livreur');
const createLivraisonIcon = () =>
  L.divIcon({
    className: 'track-map-custom-marker track-marker-livraison',
    html: `
      <div class="track-marker-inner" style="background:#2563eb;box-shadow:0 2px 8px rgba(0,0,0,0.25);">
        <i class="ri-home-4-line" style="font-size:18px;color:white;"></i>
      </div>
      <span class="track-marker-label">Livraison</span>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });
const livraisonIcon = createLivraisonIcon();

function FitBounds({
  deliveryLat,
  deliveryLng,
  driverLat,
  driverLng,
  restaurantLat,
  restaurantLng,
  routePoints,
}: {
  deliveryLat: number;
  deliveryLng: number;
  driverLat?: number | null;
  driverLng?: number | null;
  restaurantLat?: number | null;
  restaurantLng?: number | null;
  routePoints: LatLng[];
}) {
  const map = useMap();
  useEffect(() => {
    // التأكد من تضمين نقطة Livraison (عنوان التوصيل) دائماً في الإطار
    const points: [number, number][] = [[deliveryLat, deliveryLng]];
    if (driverLat != null && driverLng != null) points.push([driverLat, driverLng]);
    if (restaurantLat != null && restaurantLng != null) points.push([restaurantLat, restaurantLng]);
    if (routePoints.length > 0) {
      routePoints.forEach((p) => points.push(p));
    }
    if (points.length === 1) {
      map.setView([deliveryLat, deliveryLng], 15);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 14 });
    }
  }, [map, deliveryLat, deliveryLng, driverLat, driverLng, restaurantLat, restaurantLng, routePoints.length]);
  return null;
}

export interface TrackOrderMapProps {
  deliveryLat: number;
  deliveryLng: number;
  driverLat?: number | null;
  driverLng?: number | null;
  restaurantLat?: number | null;
  restaurantLng?: number | null;
  deliveryAddress?: string;
  driverName?: string;
  restaurantName?: string;
  status: string;
  className?: string;
}

const DRIVER_ANIMATION_DURATION_MS = 25000; // دورة كاملة من السائق على المسار

export default function TrackOrderMap({
  deliveryLat,
  deliveryLng,
  driverLat,
  driverLng,
  restaurantLat,
  restaurantLng,
  deliveryAddress,
  driverName,
  restaurantName,
  status,
  className = '',
}: TrackOrderMapProps) {
  const [mounted, setMounted] = useState(false);
  const [routePoints, setRoutePoints] = useState<LatLng[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [driverAnimatedPos, setDriverAnimatedPos] = useState<[number, number] | null>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const delivery: [number, number] = [deliveryLat, deliveryLng];
  const hasDriver = driverLat != null && driverLng != null;
  const driverPos: [number, number] | undefined = hasDriver ? [driverLat, driverLng] : undefined;
  const hasRestaurant = restaurantLat != null && restaurantLng != null;
  const restaurantPos: [number, number] | undefined = hasRestaurant ? [restaurantLat, restaurantLng] : undefined;

  // جلب مسار الطريق (يتبع الشوارع)
  useEffect(() => {
    if (!driverPos || !delivery) return;
    setRouteLoading(true);
    getRoutePoints(
      { lat: driverPos[0], lng: driverPos[1] },
      { lat: delivery[0], lng: delivery[1] }
    )
      .then((points) => {
        if (points.length > 0) {
          setRoutePoints(points);
          setDriverAnimatedPos(points[0]);
        } else {
          setRoutePoints([driverPos, delivery]);
          setDriverAnimatedPos(driverPos);
        }
      })
      .catch(() => {
        setRoutePoints([driverPos, delivery]);
        setDriverAnimatedPos(driverPos);
      })
      .finally(() => setRouteLoading(false));
  }, [driverPos?.[0], driverPos?.[1], deliveryLat, deliveryLng]);

  // تحريك السائق على المسار
  useEffect(() => {
    if (routePoints.length < 2 || !driverAnimatedPos) return;
    startTimeRef.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = (elapsed % DRIVER_ANIMATION_DURATION_MS) / DRIVER_ANIMATION_DURATION_MS;
      const index = progress * (routePoints.length - 1);
      const i0 = Math.floor(index) % routePoints.length;
      const i1 = Math.min(i0 + 1, routePoints.length - 1);
      const t = index - i0;
      const p0 = routePoints[i0];
      const p1 = routePoints[i1];
      const lat = p0[0] + t * (p1[0] - p0[0]);
      const lng = p0[1] + t * (p1[1] - p0[1]);
      setDriverAnimatedPos([lat, lng]);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [routePoints]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const linePositions = routePoints.length > 0 ? routePoints : (driverPos ? [driverPos, delivery] : []);
  const showDriverMarker = driverAnimatedPos ?? driverPos;

  if (!mounted) {
    return (
      <div
        className={`rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}
        style={{ minHeight: 320 }}
      >
        <span className="text-gray-500 flex items-center gap-2">
          <i className="ri-map-pin-line animate-pulse text-xl"></i>
          Chargement de la carte...
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white relative ${className}`}>
      <MapContainer
        center={delivery}
        zoom={14}
        className="h-[320px] w-full track-order-map-container"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <FitBounds
          deliveryLat={deliveryLat}
          deliveryLng={deliveryLng}
          driverLat={driverLat ?? undefined}
          driverLng={driverLng ?? undefined}
          restaurantLat={restaurantLat ?? undefined}
          restaurantLng={restaurantLng ?? undefined}
          routePoints={routePoints}
        />

        {/* مسار الطريق (يتبع الشوارع) مع حركة الخط */}
        {linePositions.length >= 2 && (
          <Polyline
            positions={linePositions}
            pathOptions={{
              color: '#16a34a',
              weight: 5,
              opacity: 0.9,
              className: 'track-route-line-animated',
            }}
          />
        )}

        {/* المطعم أولاً (في الخلفية) */}
        {restaurantPos && (
          <Marker position={restaurantPos} icon={restaurantIcon} zIndexOffset={100}>
            <Popup className="track-map-popup">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-200 mb-2">
                <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                  <i className="ri-store-3-line text-white text-sm"></i>
                </span>
                <strong className="text-gray-800">Restaurant</strong>
              </div>
              {restaurantName && <p className="text-gray-600 text-sm m-0">{restaurantName}</p>}
            </Popup>
          </Marker>
        )}

        {/* السائق (يتحرك على المسار) */}
        {showDriverMarker && (
          <Marker position={showDriverMarker} icon={driverIcon} zIndexOffset={200}>
            <Popup className="track-map-popup">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-200 mb-2">
                <span className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <i className="ri-motorcycle-line text-white text-sm"></i>
                </span>
                <strong className="text-gray-800">Livreur</strong>
              </div>
              {driverName && <p className="text-gray-600 text-sm m-0">{driverName}</p>}
            </Popup>
          </Marker>
        )}

        {/* Livraison (عنوان التوصيل) آخراً وأعلى أولوية ليكون دائماً ظاهراً */}
        <Marker position={delivery} icon={livraisonIcon} zIndexOffset={500}>
          <Popup className="track-map-popup">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-200 mb-2">
              <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <i className="ri-home-4-line text-white text-sm"></i>
              </span>
              <strong className="text-gray-800">Adresse de livraison</strong>
            </div>
            {deliveryAddress && <p className="text-gray-600 text-sm m-0">{deliveryAddress}</p>}
          </Popup>
        </Marker>
      </MapContainer>

      {routeLoading && (
        <div className="absolute top-2 left-2 right-2 flex justify-center">
          <span className="bg-white/95 text-gray-700 text-xs px-3 py-1.5 rounded-full shadow flex items-center gap-2">
            <i className="ri-loader-4-line animate-spin"></i>
            Calcul du trajet...
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4 px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm">
        <span className="flex items-center gap-2 text-gray-700">
          <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <i className="ri-store-3-line text-white text-xs"></i>
          </span>
          Restaurant
        </span>
        <span className="flex items-center gap-2 text-gray-700">
          <span className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
            <i className="ri-motorcycle-line text-white text-xs"></i>
          </span>
          Livreur
        </span>
        <span className="flex items-center gap-2 text-gray-700">
          <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <i className="ri-home-4-line text-white text-xs"></i>
          </span>
          Livraison
        </span>
      </div>
    </div>
  );
}
