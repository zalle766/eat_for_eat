
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Order {
  id: string;
  user_id: string;
  restaurant: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    restaurant_id?: string;
  }>;
  total: number;
  status: string;
  estimatedTime: string;
  orderTime: string;
  deliveryInfo: {
    name: string;
    phone: string;
    address: string;
    city: string;
    notes: string;
  };
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  createdAt: string;
  estimatedDelivery: string;
  driverId?: string;
  driverName?: string;
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentRestaurant, setCurrentRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [isDriversLoading, setIsDriversLoading] = useState(false);
  const [driverModalOrder, setDriverModalOrder] = useState<Order | null>(null);

  useEffect(() => {
    checkRestaurant();
  }, []);

  useEffect(() => {
    if (currentRestaurant) {
      loadOrders();
      
      // تحديث الطلبات كل 10 ثوانٍ
      const interval = setInterval(loadOrders, 10000);
      
      return () => clearInterval(interval);
    }
  }, [currentRestaurant]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const checkRestaurant = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // جلب معلومات المطعم من قاعدة البيانات
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('خطأ في جلب معلومات المطعم:', error);
        setIsLoading(false);
        return;
      }

      setCurrentRestaurant(restaurant);
      setIsLoading(false);
    } catch (error) {
      console.error('خطأ في التحقق من المطعم:', error);
      setIsLoading(false);
    }
  };

  const loadOrders = () => {
    try {
      const savedOrders = localStorage.getItem('orders');
      if (!savedOrders) {
        setOrders([]);
        return;
      }

      const allOrders = JSON.parse(savedOrders);
      
      // تصفية الطلبات لعرض طلبات هذا المطعم فقط
      const restaurantOrders = allOrders.filter((order: Order) => {
        // التحقق من أن الطلب يحتوي على منتجات من هذا المطعم
        return order.items.some(item => 
          item.restaurant_id === currentRestaurant?.id ||
          order.restaurant === currentRestaurant?.name
        );
      });

      // ترتيب الطلبات حسب التاريخ (الأحدث أولاً)
      restaurantOrders.sort((a: Order, b: Order) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // التحقق من وجود طلبات جديدة
      const previousOrdersCount = orders.length;
      const newOrdersCount = restaurantOrders.length;
      
      if (newOrdersCount > previousOrdersCount && previousOrdersCount > 0) {
        // إشعار بطلب جديد
        showNewOrderNotification();
      }

      setOrders(restaurantOrders);
    } catch (error) {
      console.error('خطأ في تحميل الطلبات:', error);
      setOrders([]);
    }
  };

  const showNewOrderNotification = () => {
    // إشعار المتصفح
    if (Notification.permission === 'granted') {
      new Notification('طلب جديد!', {
        body: 'لديك طلب جديد في انتظار الموافقة',
        icon: '/favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('طلب جديد!', {
            body: 'لديك طلب جديد في انتظار الموافقة',
            icon: '/favicon.ico'
          });
        }
      });
    }

    // صوت تنبيه
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.play().catch(() => {});
    } catch (error) {
      console.log('لا يمكن تشغيل صوت التنبيه');
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deliveryInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deliveryInfo.phone.includes(searchTerm)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    try {
      const savedOrders = localStorage.getItem('orders');
      if (!savedOrders) return;

      const allOrders = JSON.parse(savedOrders);
      const orderIndex = allOrders.findIndex((order: Order) => order.id === orderId);
      
      if (orderIndex !== -1) {
        allOrders[orderIndex].status = newStatus;
        localStorage.setItem('orders', JSON.stringify(allOrders));
        
        // تحديث الطلب الحالي إذا كان موجوداً
        const currentOrder = localStorage.getItem('currentOrder');
        if (currentOrder) {
          const parsedCurrentOrder = JSON.parse(currentOrder);
          if (parsedCurrentOrder.id === orderId) {
            parsedCurrentOrder.status = newStatus;
            localStorage.setItem('currentOrder', JSON.stringify(parsedCurrentOrder));
          }
        }
        
        // إعادة تحميل الطلبات
        loadOrders();
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: any = {
      pending: { text: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800', icon: 'ri-time-line' },
      confirmed: { text: 'مؤكد', color: 'bg-blue-100 text-blue-800', icon: 'ri-check-line' },
      preparing: { text: 'قيد التحضير', color: 'bg-orange-100 text-orange-800', icon: 'ri-restaurant-line' },
      ready: { text: 'جاهز للتوصيل', color: 'bg-green-100 text-green-800', icon: 'ri-check-circle-line' },
      on_the_way: { text: 'في الطريق', color: 'bg-purple-100 text-purple-800', icon: 'ri-truck-line' },
      delivered: { text: 'تم التوصيل', color: 'bg-gray-100 text-gray-800', icon: 'ri-check-double-line' },
      cancelled: { text: 'ملغي', color: 'bg-red-100 text-red-800', icon: 'ri-close-line' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const calculateDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const openDriverModal = async (order: Order) => {
    if (!currentRestaurant) return;

    setDriverModalOrder(order);
    setIsDriversLoading(true);
    setAvailableDrivers([]);

    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'approved')
        .eq('is_available', true)
        .eq('city', currentRestaurant.city || order.deliveryInfo.city);

      if (error) throw error;

      const driversWithDistance =
        (data || []).map((driver) => {
          let distance: number | null = null;
          if (
            typeof driver.current_latitude === 'number' &&
            typeof driver.current_longitude === 'number' &&
            typeof currentRestaurant.latitude === 'number' &&
            typeof currentRestaurant.longitude === 'number'
          ) {
            distance = calculateDistanceKm(
              currentRestaurant.latitude,
              currentRestaurant.longitude,
              driver.current_latitude,
              driver.current_longitude
            );
          }
          return { ...driver, distance };
        }) || [];

      driversWithDistance.sort((a: any, b: any) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });

      setAvailableDrivers(driversWithDistance);
    } catch (error) {
      console.error('خطأ في جلب السائقين المتاحين:', error);
      alert('حدث خطأ في تحميل قائمة الموصّلين المتاحين');
    } finally {
      setIsDriversLoading(false);
    }
  };

  const assignDriverToOrder = async (order: Order, driver: any) => {
    try {
      const driverEarnings = order.deliveryFee * 0.2;

      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert([
          {
            order_id: order.id,
            driver_id: driver.id,
            restaurant_id: currentRestaurant.id,
            customer_name: order.deliveryInfo.name,
            customer_phone: order.deliveryInfo.phone,
            delivery_address: order.deliveryInfo.address,
            delivery_city: order.deliveryInfo.city,
            pickup_address:
              currentRestaurant.address || 'عنوان المطعم',
            total_amount: order.total,
            delivery_fee: order.deliveryFee,
            driver_earnings: driverEarnings,
            notes: order.deliveryInfo.notes,
            status: 'assigned', // في انتظار موافقة الموصّل
            assigned_at: new Date().toISOString(),
          },
        ]);

      if (deliveryError) throw deliveryError;

      setDriverModalOrder(null);
      loadOrders();
      alert('تم إسناد الطلب إلى الموصّل بنجاح');
    } catch (error) {
      console.error('خطأ في إسناد الموصّل للطلب:', error);
      alert('حدث خطأ أثناء إسناد الموصّل للطلب');
    }
  };

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      revenue: orders.reduce((sum, order) => sum + order.total, 0)
    };
    return stats;
  };

  const stats = getOrderStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  if (!currentRestaurant) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <i className="ri-restaurant-line text-8xl text-gray-300 mb-6"></i>
          <h2 className="text-2xl font-bold text-gray-600 mb-4">لم يتم العثور على مطعم</h2>
          <p className="text-gray-500">يجب أن تكون مالك مطعم للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h2>
        <p className="text-gray-600">تتبع وإدارة طلبات العملاء لمطعم {currentRestaurant.name}</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الطلبات</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <i className="ri-shopping-bag-3-line text-2xl text-blue-500 w-8 h-8 flex items-center justify-center"></i>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">في الانتظار</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <i className="ri-time-line text-2xl text-yellow-500 w-8 h-8 flex items-center justify-center"></i>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">قيد التحضير</p>
              <p className="text-2xl font-bold text-orange-600">{stats.preparing}</p>
            </div>
            <i className="ri-restaurant-line text-2xl text-orange-500 w-8 h-8 flex items-center justify-center"></i>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">جاهز</p>
              <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
            </div>
            <i className="ri-check-circle-line text-2xl text-green-500 w-8 h-8 flex items-center justify-center"></i>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">تم التوصيل</p>
              <p className="text-2xl font-bold text-gray-600">{stats.delivered}</p>
            </div>
            <i className="ri-truck-line text-2xl text-gray-500 w-8 h-8 flex items-center justify-center"></i>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">الإيرادات</p>
              <p className="text-2xl font-bold text-green-600">{stats.revenue.toFixed(2)} DH</p>
            </div>
            <i className="ri-money-dollar-circle-line text-2xl text-green-500 w-8 h-8 flex items-center justify-center"></i>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث برقم الطلب أو اسم العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة الطلب</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">في الانتظار</option>
              <option value="confirmed">مؤكد</option>
              <option value="preparing">قيد التحضير</option>
              <option value="ready">جاهز للتوصيل</option>
              <option value="delivered">تم التوصيل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            الطلبات ({filteredOrders.length})
          </h3>
        </div>

        <div className="p-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-shopping-bag-line text-8xl text-gray-300 mb-6"></i>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد طلبات</h3>
              <p className="text-gray-500">
                {orders.length === 0 
                  ? 'لم يتم استلام أي طلبات بعد' 
                  : 'لا توجد طلبات تطابق معايير البحث'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            طلب #{order.id.split('-')[1]}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} flex items-center gap-1`}>
                            <i className={statusInfo.icon}></i>
                            {statusInfo.text}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>العميل:</strong> {order.deliveryInfo.name}</p>
                            <p><strong>الهاتف:</strong> {order.deliveryInfo.phone}</p>
                            <p><strong>العنوان:</strong> {order.deliveryInfo.address}, {order.deliveryInfo.city}</p>
                          </div>
                          <div>
                            <p><strong>وقت الطلب:</strong> {new Date(order.createdAt).toLocaleString('ar-SA')}</p>
                            <p><strong>التوصيل المتوقع:</strong> {new Date(order.estimatedDelivery).toLocaleString('ar-SA')}</p>
                            <p><strong>طريقة الدفع:</strong> {order.paymentMethod === 'cash' ? 'نقداً عند التوصيل' : 'بطاقة ائتمان'}</p>
                          </div>
                        </div>

                        {/* Notes */}
                        {order.deliveryInfo.notes && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              <strong>ملاحظات:</strong> {order.deliveryInfo.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Total */}
                      <div className="text-left ml-6">
                        <p className="text-2xl font-bold text-gray-900">{order.total.toFixed(2)} DH</p>
                        <p className="text-sm text-gray-500">المجموع النهائي</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-t border-gray-200 pt-4">
                      <h5 className="font-medium text-gray-900 mb-3">تفاصيل الطلب:</h5>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{item.name} × {item.quantity}</span>
                            <span className="font-medium">{(item.price * item.quantity).toFixed(2)} DH</span>
                          </div>
                        ))}
                        
                        {/* Price Breakdown */}
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>المجموع الفرعي:</span>
                            <span>{order.subtotal.toFixed(2)} DH</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>رسوم التوصيل:</span>
                            <span>{order.deliveryFee.toFixed(2)} DH</span>
                          </div>
                          {order.discount && order.discount > 0 && (
                            <div className="flex items-center justify-between text-sm text-green-600">
                              <span>الخصم:</span>
                              <span>-{order.discount.toFixed(2)} DH</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between font-semibold">
                            <span>المجموع النهائي:</span>
                            <span>{order.total.toFixed(2)} DH</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                            >
                              قبول الطلب
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                            >
                              رفض الطلب
                            </button>
                          </>
                        )}
                        
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                          >
                            بدء التحضير
                          </button>
                        )}
                        
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                          >
                            جاهز للتوصيل
                          </button>
                        )}
                        
                        {order.status === 'ready' && (
                          <>
                            <button
                              onClick={() => openDriverModal(order)}
                              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                            >
                              اختيار الموصّل
                            </button>
                          </>
                        )}
                        
                        {order.status === 'on_the_way' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                          >
                            تم التوصيل
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* نافذة اختيار الموصّل */}
      {driverModalOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                اختيار الموصّل للطلب #{driverModalOrder.id.split('-')[1]}
              </h3>
              <button
                onClick={() => setDriverModalOrder(null)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {isDriversLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : availableDrivers.length === 0 ? (
                <div className="text-center py-8">
                  <i className="ri-roadster-line text-4xl text-gray-300 mb-3" />
                  <p className="text-gray-700 font-medium mb-1">
                    لا يوجد موصّلون متاحون حالياً في منطقتك
                  </p>
                  <p className="text-sm text-gray-500">
                    حاول مرة أخرى بعد قليل أو تواصل مع الدعم.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <i className="ri-user-line text-xl text-gray-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {driver.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {driver.phone}
                          </p>
                          {typeof driver.distance === 'number' && (
                            <p className="text-xs text-gray-500">
                              يبعد تقريباً{' '}
                              {driver.distance.toFixed(1)} كم عن المطعم
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          assignDriverToOrder(driverModalOrder, driver)
                        }
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        إسناد هذا الموصّل
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
