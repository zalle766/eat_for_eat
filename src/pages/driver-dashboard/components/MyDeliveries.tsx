import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

const DRIVER_LOCATION_INTERVAL_MS = 15000; // 15 secondes

interface MyDeliveriesProps {
  driver: any;
}

export default function MyDeliveries({ driver }: MyDeliveriesProps) {
  const toast = useToast();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 10000);
    return () => clearInterval(interval);
  }, [driver, filter]);

  // إرسال موقع السائق كل 15 ثانية للطلبات ذات الحالة "في الطريق" (picked_up)
  useEffect(() => {
    const activeDeliveries = deliveries.filter((d) => d.status === 'picked_up');
    if (activeDeliveries.length === 0) return;

    const sendLocation = (lat: number, lng: number) => {
      activeDeliveries.forEach(async (delivery) => {
        const { error } = await supabase
          .from('orders')
          .update({ driver_lat: lat, driver_lng: lng })
          .eq('id', delivery.order_id);
        if (error) console.warn('Update driver location failed:', error);
      });
    };

    const scheduleNext = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    };

    scheduleNext();
    const intervalId = setInterval(scheduleNext, DRIVER_LOCATION_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [deliveries]);

  const loadDeliveries = async () => {
    try {
      let query = supabase
        .from('deliveries')
        .select('*, orders(delivery_latitude, delivery_longitude)')
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.in('status', ['assigned', 'picked_up']);
      } else if (filter === 'completed') {
        query = query.eq('status', 'delivered');
      }

      const { data, error } = await query;

      if (error) throw error;
      setDeliveries(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des livraisons:', error);
      setIsLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'picked_up') {
        updateData.picked_up_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
        
        // تحديث إحصائيات السائق
        const delivery = deliveries.find(d => d.id === deliveryId);
        if (delivery) {
          await supabase
            .from('drivers')
            .update({ 
              completed_deliveries: driver.completed_deliveries + 1,
              total_earnings: driver.total_earnings + delivery.driver_earnings
            })
            .eq('id', driver.id);
        }
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId);

      if (error) throw error;

      const delivery = deliveries.find(d => d.id === deliveryId);
      if (delivery) {
        // تحديث حالة الطلب في Supabase (للتتبع على الخريطة)
        const orderStatus = newStatus === 'picked_up' ? 'on_way' : newStatus === 'delivered' ? 'delivered' : null;
        if (orderStatus) {
          const orderUpdate: { status: string; driver_lat?: null; driver_lng?: null } = { status: orderStatus };
          if (newStatus === 'delivered') {
            orderUpdate.driver_lat = null;
            orderUpdate.driver_lng = null;
          }
          await supabase.from('orders').update(orderUpdate).eq('id', delivery.order_id);
        }

        // تحديث حالة الطلب في localStorage
        const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const updatedOrders = allOrders.map((o: any) => {
          if (o.id === delivery.order_id) {
            let status = o.status;
            if (newStatus === 'picked_up') status = 'on_way';
            if (newStatus === 'delivered') status = 'delivered';
            return { ...o, status };
          }
          return o;
        });
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
      }

      loadDeliveries();
      toast.success('État de livraison mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour de l\'état');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      assigned: { label: 'En attente de votre acceptation', color: 'bg-blue-100 text-blue-700' },
      picked_up: { label: 'Récupéré', color: 'bg-orange-100 text-orange-700' },
      delivered: { label: 'Livré', color: 'bg-green-100 text-green-700' }
    };
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des livraisons...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mes livraisons</h2>
        <p className="text-gray-600">Gérez et suivez vos livraisons</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('active')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
            filter === 'active'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Livraisons actives
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
            filter === 'completed'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Livraisons terminées
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
            filter === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Toutes les livraisons
        </button>
      </div>

      {deliveries.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-truck-line text-4xl text-gray-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune livraison</h3>
          <p className="text-gray-600">
            {filter === 'active' ? 'Aucune livraison active pour le moment' : "Vous n'avez pas encore effectué de livraison"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="bg-white rounded-xl p-6 border border-gray-200">
              {/* Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">Commande #{delivery.order_id.slice(0, 8)}</h3>
                    {getStatusBadge(delivery.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(delivery.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-gray-900">{delivery.total_amount.toFixed(2)} DH</p>
                  <p className="text-sm text-green-600 font-medium">Vos revenus : {delivery.driver_earnings.toFixed(2)} DH</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Pickup Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <i className="ri-store-line text-orange-500"></i>
                    Récupération à
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-1">{delivery.pickup_address}</p>
                    <p className="text-sm text-gray-600">{delivery.delivery_city}</p>
                  </div>
                </div>

                {/* Delivery Info - إحداثيات الموقع لتسهيل الوصول */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <i className="ri-map-pin-line text-orange-500"></i>
                    Livraison à
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-1">{delivery.customer_name}</p>
                    <p className="text-sm text-gray-600 mb-1">{delivery.customer_phone}</p>
                    {(() => {
                      const order = delivery.orders ?? delivery.order;
                      const lat = order?.delivery_latitude ?? (Array.isArray(order) ? order?.[0]?.delivery_latitude : null);
                      const lng = order?.delivery_longitude ?? (Array.isArray(order) ? order?.[0]?.delivery_longitude : null);
                      const coords = lat != null && lng != null ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : null;
                      return coords ? (
                        <p className="text-sm font-mono font-semibold text-green-700 bg-green-50 px-2 py-1.5 rounded border border-green-200">
                          {coords}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600">{delivery.delivery_address}</p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {delivery.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <i className="ri-information-line ml-2"></i>
                    <strong>Notes :</strong> {delivery.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {delivery.status === 'assigned' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-checkbox-circle-line ml-2"></i>
                    Accepter cette commande
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('deliveries')
                          .update({ status: 'rejected' })
                          .eq('id', delivery.id);

                        if (error) throw error;

                        loadDeliveries();
                        toast.info('Commande refusée. Le restaurant sera notifié.');
                      } catch (error) {
                        console.error('Erreur lors du refus de la commande:', error);
                        toast.error('Erreur lors du refus de la commande');
                      }
                    }}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Refuser
                  </button>
                </div>
              )}

              {delivery.status === 'picked_up' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-checkbox-circle-line ml-2"></i>
                    Marquer comme livré
                  </button>
                  <a
                    href={(() => {
                      const order = delivery.orders ?? delivery.order;
                      const lat = order?.delivery_latitude ?? (Array.isArray(order) ? order?.[0]?.delivery_latitude : null);
                      const lng = order?.delivery_longitude ?? (Array.isArray(order) ? order?.[0]?.delivery_longitude : null);
                      if (lat != null && lng != null) {
                        return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                      }
                      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.delivery_address || '')}`;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-navigation-line"></i>
                  </a>
                </div>
              )}

              {delivery.status === 'delivered' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <i className="ri-checkbox-circle-fill text-3xl text-green-600 mb-2"></i>
                  <p className="text-green-700 font-medium">Livré avec succès</p>
                  <p className="text-sm text-green-600">
                    {new Date(delivery.delivered_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
