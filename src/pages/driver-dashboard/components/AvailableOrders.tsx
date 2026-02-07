import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

interface AvailableOrdersProps {
  driver: any;
}

export default function AvailableOrders({ driver }: AvailableOrdersProps) {
  const toast = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAvailableOrders();
    const interval = setInterval(loadAvailableOrders, 10000);
    return () => clearInterval(interval);
  }, [driver]);

  const loadAvailableOrders = async () => {
    try {
      // جلب الطلبات المتاحة من localStorage
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      // تصفية الطلبات التي لم يتم تعيين سائق لها بعد
      const availableOrders = allOrders.filter((order: any) => 
        !order.driverId && 
        order.status === 'confirmed' &&
        order.deliveryCity === driver.city
      );

      setOrders(availableOrders);
      setIsLoading(false);
    } catch (error) {
      console.error('خطأ في تحميل الطلبات:', error);
      setIsLoading(false);
    }
  };

  const acceptOrder = async (order: any) => {
    try {
      // حساب أرباح السائق (20% من رسوم التوصيل)
      const driverEarnings = order.deliveryFee * 0.2;

      // إنشاء سجل توصيل جديد
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert([{
          order_id: order.id,
          driver_id: driver.id,
          restaurant_id: order.restaurantId,
          customer_name: order.customerName,
          customer_phone: order.customerPhone,
          delivery_address: order.deliveryAddress,
          delivery_city: order.deliveryCity,
          pickup_address: order.restaurantAddress || 'عنوان المطعم',
          total_amount: order.total,
          delivery_fee: order.deliveryFee,
          driver_earnings: driverEarnings,
          notes: order.notes,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        }]);

      if (deliveryError) throw deliveryError;

      // تحديث الطلب في localStorage
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const updatedOrders = allOrders.map((o: any) => 
        o.id === order.id 
          ? { ...o, driverId: driver.id, driverName: driver.name, status: 'out_for_delivery' }
          : o
      );
      localStorage.setItem('orders', JSON.stringify(updatedOrders));

      // تحديث إحصائيات السائق
      await supabase
        .from('drivers')
        .update({ 
          total_deliveries: driver.total_deliveries + 1 
        })
        .eq('id', driver.id);

      toast.success('تم قبول الطلب بنجاح! يمكنك الآن البدء في التوصيل');
      loadAvailableOrders();
    } catch (error) {
      console.error('خطأ في قبول الطلب:', error);
      toast.error('حدث خطأ أثناء قبول الطلب');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">الطلبات المتاحة</h2>
        <p className="text-gray-600">اختر الطلبات التي تريد توصيلها</p>
      </div>

      {!driver.is_available && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <i className="ri-information-line text-yellow-600 text-xl"></i>
            <div>
              <p className="text-yellow-800 font-medium mb-1">أنت غير متاح حالياً</p>
              <p className="text-yellow-700 text-sm">قم بتفعيل حالتك من الأعلى لرؤية الطلبات المتاحة</p>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-shopping-bag-line text-4xl text-gray-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد طلبات متاحة حالياً</h3>
          <p className="text-gray-600">سيتم إشعارك عند توفر طلبات جديدة في منطقتك</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">طلب #{order.id.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-600">{order.restaurantName}</p>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-orange-600">{order.total.toFixed(2)} د.م</p>
                  <p className="text-sm text-gray-600">رسوم التوصيل: {order.deliveryFee.toFixed(2)} د.م</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-3">
                  <i className="ri-user-line text-gray-400 mt-1"></i>
                  <div>
                    <p className="text-sm text-gray-600">العميل</p>
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-600">{order.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <i className="ri-map-pin-line text-gray-400 mt-1"></i>
                  <div>
                    <p className="text-sm text-gray-600">عنوان التوصيل</p>
                    <p className="font-medium text-gray-900">{order.deliveryAddress}</p>
                    <p className="text-sm text-gray-600">{order.deliveryCity}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="flex items-start gap-3">
                    <i className="ri-message-3-line text-gray-400 mt-1"></i>
                    <div>
                      <p className="text-sm text-gray-600">ملاحظات</p>
                      <p className="font-medium text-gray-900">{order.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">المنتجات:</p>
                <div className="space-y-2">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-900">{item.name} × {item.quantity}</span>
                      <span className="text-gray-600">{(item.price * item.quantity).toFixed(2)} د.م</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earnings Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">أرباحك من هذا الطلب:</span>
                  <span className="text-lg font-bold text-green-700">{(order.deliveryFee * 0.2).toFixed(2)} د.م</span>
                </div>
              </div>

              {/* Accept Button */}
              <button
                onClick={() => acceptOrder(order)}
                disabled={!driver.is_available}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                {driver.is_available ? 'قبول الطلب' : 'غير متاح'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
