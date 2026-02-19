import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import OrderChat from '../../../components/feature/OrderChat';

const DRIVER_LOCATION_INTERVAL_MS = 15000; // 15 secondes

interface MyDeliveriesProps {
  driver: any;
}

interface IncomingCall {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
}

export default function MyDeliveries({ driver }: MyDeliveriesProps) {
  const toast = useToast();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [chatDelivery, setChatDelivery] = useState<{ order_id: string; customer_name: string } | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [unreadByOrder, setUnreadByOrder] = useState<Record<string, number>>({});

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 10000);
    return () => clearInterval(interval);
  }, [driver, filter]);

  // Realtime: عند تعيين توصيلة جديدة من المطعم، تظهر فوراً في « Mes livraisons »
  useEffect(() => {
    if (!driver?.id) return;
    const channel = supabase
      .channel(`deliveries_driver_${driver.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deliveries', filter: `driver_id=eq.${driver.id}` },
        () => {
          loadDeliveries();
          toast.info('Nouvelle livraison assignée ! Consultez « Mes livraisons ».');
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [driver?.id]);

  // إشعار المكالمة الواردة عندما يكون الموصّل متصلًا
  useEffect(() => {
    if (!driver?.id) return;
    const channel = supabase
      .channel(`call_requests:${driver.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_requests', filter: `driver_id=eq.${driver.id}` },
        (payload) => {
          const n = payload.new as IncomingCall;
          setIncomingCall({
            id: n.id,
            order_id: n.order_id,
            customer_name: n.customer_name || 'Client',
            customer_phone: n.customer_phone || '',
            created_at: n.created_at,
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [driver?.id]);

  // إشعار بالرسائل الجديدة من الزبون (للموصّل)
  useEffect(() => {
    if (!driver?.id || deliveries.length === 0) return;
    const orderIds = deliveries.map((d) => d.order_id).filter(Boolean);
    if (orderIds.length === 0) return;
    const channel = supabase
      .channel('driver_new_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_messages' },
        (payload) => {
          const msg = payload.new as { order_id: string; sender_type: string };
          if (msg.sender_type !== 'customer') return;
          if (!orderIds.includes(msg.order_id)) return;
          const delivery = deliveries.find((d) => d.order_id === msg.order_id);
          const name = delivery?.customer_name || 'Client';
          toast.info(`Nouveau message de ${name}`);
          setUnreadByOrder((prev) => ({ ...prev, [msg.order_id]: (prev[msg.order_id] || 0) + 1 }));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [driver?.id, deliveries]);

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
      // جلب التوصيلات من جدول deliveries فقط (بدون join على orders لتجنب مشاكل RLS)
      let query = supabase
        .from('deliveries')
        .select('*')
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.in('status', ['assigned', 'picked_up']);
      } else if (filter === 'completed') {
        query = query.eq('status', 'delivered');
      }

      const { data, error } = await query;

      if (error) throw error;

      const list = data || [];
      const orderIds = list.map((d: any) => d.order_id).filter(Boolean);
      let ordersById: Record<string, { delivery_latitude?: number; delivery_longitude?: number }> = {};
      if (orderIds.length > 0) {
        const { data: orderRows } = await supabase
          .from('orders')
          .select('id, delivery_latitude, delivery_longitude')
          .in('id', orderIds);
        (orderRows || []).forEach((o: any) => { ordersById[o.id] = o; });
      }
      const withCoords = list.map((d: any) => ({
        ...d,
        order: ordersById[d.order_id] || null,
        orders: ordersById[d.order_id] ? [ordersById[d.order_id]] : null,
      }));
      setDeliveries(withCoords);
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
        if (newStatus === 'delivered') {
          const orderUpdate = { status: 'delivered' as const, driver_lat: null as number | null, driver_lng: null as number | null };
          await supabase.from('orders').update(orderUpdate).eq('id', delivery.order_id);
        } else if (newStatus === 'picked_up') {
          // تحديث حالة الطلب فوراً + إرسال موقع الموصّل ليظهر التتبع للزبون على الخريطة
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                supabase
                  .from('orders')
                  .update({
                    status: 'on_way',
                    driver_lat: pos.coords.latitude,
                    driver_lng: pos.coords.longitude,
                  })
                  .eq('id', delivery.order_id)
                  .then(() => {});
              },
              () => {
                supabase.from('orders').update({ status: 'on_way' }).eq('id', delivery.order_id).then(() => {});
              },
              { enableHighAccuracy: true, maximumAge: 5000 }
            );
          } else {
            await supabase.from('orders').update({ status: 'on_way' }).eq('id', delivery.order_id);
          }
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
    <div className="min-w-0 w-full">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Mes livraisons</h2>
        <p className="text-sm sm:text-base text-gray-600">Gérez et suivez vos livraisons</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
            filter === 'active'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Livraisons actives
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
            filter === 'completed'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Livraisons terminées
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
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
            <div key={delivery.id} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 min-w-0">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 pb-4 border-b border-gray-200">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
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
                <div className="text-left flex-shrink-0">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{delivery.total_amount.toFixed(2)} DH</p>
                  <p className="text-sm text-green-600 font-medium">Vos revenus : {delivery.driver_earnings.toFixed(2)} DH</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4">
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
              {(delivery.status === 'assigned' || delivery.status === 'picked_up') && (
                <div className="flex flex-wrap items-center gap-2 mb-3 text-sm sm:text-base">
                  {delivery.customer_phone && (
                    <a
                      href={`tel:${delivery.customer_phone}`}
                      className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <i className="ri-phone-line"></i>
                      Appel direct client
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setChatDelivery({ order_id: delivery.order_id, customer_name: delivery.customer_name || 'Client' });
                      setUnreadByOrder((prev) => ({ ...prev, [delivery.order_id]: 0 }));
                    }}
                    className="relative inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <i className="ri-chat-3-line"></i>
                    Messages directs
                    {unreadByOrder[delivery.order_id] > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                        {unreadByOrder[delivery.order_id]}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {delivery.status === 'assigned' && (
                <div className="flex flex-col sm:flex-row gap-3">
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
                <div className="flex flex-col sm:flex-row gap-3">
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

      {/* نافذة الدردشة المباشرة مع الزبون */}
      {chatDelivery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Messages avec le client</h3>
              <button
                type="button"
                onClick={() => setChatDelivery(null)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="flex-1 min-h-0 p-3">
              <OrderChat
                orderId={chatDelivery.order_id}
                senderType="driver"
                senderId={driver.id}
                senderName={driver.name || driver.full_name || 'Livreur'}
                otherPartyName={chatDelivery.customer_name}
              />
            </div>
          </div>
        </div>
      )}

      {/* إشعار مكالمة واردة - يظهر للموصّل عندما يطلب الزبون الاتصال وهو متصل */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <i className="ri-phone-line text-3xl text-green-600"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Appel entrant</h3>
            <p className="text-gray-600 mb-4">{incomingCall.customer_name} souhaite vous appeler</p>
            <div className="flex flex-col gap-2">
              <a
                href={`tel:${incomingCall.customer_phone}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
              >
                <i className="ri-phone-line text-xl"></i>
                Rappeler le client
              </a>
              <button
                type="button"
                onClick={() => setIncomingCall(null)}
                className="w-full py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
