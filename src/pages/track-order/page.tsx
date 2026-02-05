
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/currency';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  restaurant: string;
  items: OrderItem[];
  total: number;
  status: string;
  estimatedTime: string;
  orderTime: string;
  deliveryInfo?: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  driver?: {
    name: string;
    phone: string;
    rating: number;
  };
  user_id?: string;
}

const statusInfo = {
  confirmed: {
    title: 'تم تأكيد الطلب',
    description: 'تم استلام طلبك وجاري المراجعة',
    icon: 'ri-check-line',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  preparing: {
    title: 'جاري التحضير',
    description: 'المطعم يحضر طلبك الآن',
    icon: 'ri-restaurant-line',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100'
  },
  ready: {
    title: 'جاهز للاستلام',
    description: 'طلبك جاهز وينتظر السائق',
    icon: 'ri-time-line',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100'
  },
  on_way: {
    title: 'في الطريق إليك',
    description: 'السائق في طريقه لتوصيل طلبك',
    icon: 'ri-truck-line',
    color: 'text-green-500',
    bgColor: 'bg-green-100'
  },
  delivered: {
    title: 'تم التوصيل',
    description: 'تم توصيل طلبك بنجاح',
    icon: 'ri-check-double-line',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  }
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [cartCleared, setCartCleared] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const navigate = useNavigate();

  // التحقق من المستخدم المسجل
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setIsCheckingUser(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user) {
        loadUserOrders(user.id);
      }
    } catch (error) {
      console.error('خطأ في التحقق من المستخدم:', error);
    } finally {
      setIsCheckingUser(false);
    }
  };

  // تحميل طلبات المستخدم فقط
  const loadUserOrders = (userId: string) => {
    try {
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        const allOrders = JSON.parse(savedOrders);
        // تصفية الطلبات لعرض طلبات المستخدم الحالي فقط
        const userOrders = allOrders.filter((order: Order) => order.user_id === userId);
        // ترتيب الطلبات حسب التاريخ (الأحدث أولاً)
        userOrders.sort((a: Order, b: Order) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime());
        setRecentOrders(userOrders);
      } else {
        setRecentOrders([]);
      }
    } catch (error) {
      console.error('خطأ في تحميل الطلبات:', error);
      setRecentOrders([]);
    }
  };

  // تحميل الطلبات المحفوظة
  useEffect(() => {
    if (currentUser) {
      loadUserOrders(currentUser.id);
      checkAndClearCart();
      
      // فحص دوري كل 30 ثانية
      const interval = setInterval(() => {
        checkAndClearCart();
        loadUserOrders(currentUser.id);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const checkAndClearCart = () => {
    if (!currentUser) return;

    try {
      const savedOrders = localStorage.getItem('orders');
      const clearedOrders = JSON.parse(localStorage.getItem('clearedCartOrders') || '[]');
      
      if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        
        // البحث عن طلبات المستخدم الحالي في حالة التحضير
        const preparingOrders = orders.filter((order: Order) => 
          order.user_id === currentUser.id &&
          order.status === 'preparing' && 
          !clearedOrders.includes(order.id)
        );

        if (preparingOrders.length > 0) {
          // تفريغ السلة - استخدام مفتاح 'cart' الموحد
          const cartItems = localStorage.getItem('cart');
          if (cartItems) {
            try {
              const cart = JSON.parse(cartItems);
              if (Array.isArray(cart) && cart.length > 0) {
                localStorage.removeItem('cart');
                
                // إرسال إشارة تحديث السلة
                window.dispatchEvent(new CustomEvent('cartUpdated'));
                
                // حفظ معرفات الطلبات التي تم تفريغ السلة لها
                const newClearedOrders = [...clearedOrders, ...preparingOrders.map((o: Order) => o.id)];
                localStorage.setItem('clearedCartOrders', JSON.stringify(newClearedOrders));
                
                setCartCleared(true);
                setTimeout(() => setCartCleared(false), 5000);
              }
            } catch (error) {
              console.error('خطأ في تفريغ السلة:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('خطأ في فحص الطلبات:', error);
    }
  };

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      alert('يرجى إدخال رقم الطلب');
      return;
    }

    if (!currentUser) {
      alert('يجب تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    
    try {
      // محاكاة تأخير البحث
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // البحث في الطلبات المحفوظة للمستخدم الحالي فقط
      let order = null;
      
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        order = orders.find((o: Order) => 
          o.id === orderNumber.trim() && o.user_id === currentUser.id
        );
      }

      setSearchedOrder(order || null);
      
      if (!order) {
        alert('لم يتم العثور على الطلب. تأكد من رقم الطلب وأنه يخصك.');
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
      alert('حدث خطأ أثناء البحث. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = (status: string) => {
    const statusOrder = ['confirmed', 'preparing', 'ready', 'on_way', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  const handleOrderClick = (order: Order) => {
    setOrderNumber(order.id);
    setSearchedOrder(order);
    
    // التمرير لأعلى لعرض تفاصيل الطلب
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // عرض شاشة التحميل أثناء التحقق من المستخدم
  if (isCheckingUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <i className="ri-loader-4-line text-6xl text-orange-500 mb-4 animate-spin"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">جاري التحميل...</h2>
            <p className="text-gray-600">يتم التحقق من بياناتك</p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // إذا لم يكن المستخدم مسجل دخول
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <i className="ri-lock-line text-6xl text-orange-500 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">يجب تسجيل الدخول</h2>
            <p className="text-gray-600 mb-6">يجب تسجيل الدخول لعرض طلباتك وتتبعها</p>
            <button 
              onClick={() => navigate('/auth')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              تسجيل الدخول
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* إشعار تفريغ السلة */}
        {cartCleared && (
          <div className="bg-orange-100 border border-orange-300 text-orange-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
            <i className="ri-information-line text-xl"></i>
            <div>
              <p className="font-medium">تم تفريغ السلة تلقائياً</p>
              <p className="text-sm">تم تفريغ السلة لأن طلبك بدأ في التحضير</p>
            </div>
          </div>
        )}

        {/* عنوان الصفحة */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">تتبع طلبك</h1>
          <p className="text-gray-600">أدخل رقم الطلب لتتبع حالة التوصيل</p>
        </div>

        {/* قسم البحث */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="أدخل رقم الطلب (مثال: ORD-2024-001)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  جاري البحث...
                </>
              ) : (
                <>
                  <i className="ri-search-line"></i>
                  تتبع الطلب
                </>
              )}
            </button>
          </div>
        </div>

        {/* نتائج البحث */}
        {searchedOrder && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">الطلب رقم: {searchedOrder.id}</h2>
                <p className="text-gray-600">{searchedOrder.restaurant}</p>
                <p className="text-sm text-gray-500 mt-1">تاريخ الطلب: {searchedOrder.orderTime}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">{formatCurrency(searchedOrder.total)}</div>
                <div className={`text-xs px-3 py-1 rounded-full mt-2 ${statusInfo[searchedOrder.status as keyof typeof statusInfo]?.bgColor} ${statusInfo[searchedOrder.status as keyof typeof statusInfo]?.color}`}>
                  {statusInfo[searchedOrder.status as keyof typeof statusInfo]?.title || 'غير محدد'}
                </div>
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">حالة الطلب</span>
                <span className="text-sm text-gray-500">الوقت المتوقع: {searchedOrder.estimatedTime}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage(searchedOrder.status)}%` }}
                ></div>
              </div>
            </div>

            {/* الحالة الحالية */}
            {statusInfo[searchedOrder.status as keyof typeof statusInfo] && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusInfo[searchedOrder.status as keyof typeof statusInfo].bgColor}`}>
                  <i className={`${statusInfo[searchedOrder.status as keyof typeof statusInfo].icon} text-xl ${statusInfo[searchedOrder.status as keyof typeof statusInfo].color}`}></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{statusInfo[searchedOrder.status as keyof typeof statusInfo].title}</h3>
                  <p className="text-gray-600 text-sm">{statusInfo[searchedOrder.status as keyof typeof statusInfo].description}</p>
                </div>
              </div>
            )}

            {/* معلومات السائق */}
            {(searchedOrder.status === 'on_way' || searchedOrder.status === 'ready') && searchedOrder.driver && (
              <div className="border-t pt-6 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">معلومات السائق</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <i className="ri-user-line text-xl text-gray-600"></i>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{searchedOrder.driver.name}</div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <i className="ri-star-fill text-yellow-400"></i>
                        <span>{searchedOrder.driver.rating}</span>
                      </div>
                    </div>
                  </div>
                  <a 
                    href={`tel:${searchedOrder.driver.phone}`}
                    className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-colors cursor-pointer"
                  >
                    <i className="ri-phone-line text-lg"></i>
                  </a>
                </div>
              </div>
            )}

            {/* تفاصيل الطلب */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-800 mb-4">تفاصيل الطلب</h3>
              <div className="space-y-3">
                {searchedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <span className="text-gray-800 font-medium">{item.name}</span>
                      {item.price && (
                        <span className="text-gray-500 text-sm ml-2">({formatCurrency(item.price)})</span>
                      )}
                    </div>
                    <span className="text-gray-600 font-medium">
                      {item.quantity ? `${item.quantity}x` : '1x'}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-800">المجموع:</span>
                  <span className="font-bold text-gray-800 text-lg">{formatCurrency(searchedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* معلومات التوصيل */}
            {searchedOrder.deliveryInfo && (
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-gray-800 mb-4">معلومات التوصيل</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600 text-sm">الاسم:</span>
                      <p className="font-medium text-gray-800">{searchedOrder.deliveryInfo.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">الهاتف:</span>
                      <p className="font-medium text-gray-800">{searchedOrder.deliveryInfo.phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-600 text-sm">العنوان:</span>
                      <p className="font-medium text-gray-800">{searchedOrder.deliveryInfo.address}, {searchedOrder.deliveryInfo.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* رسالة عدم العثور على الطلب */}
        {searchedOrder === null && orderNumber && !isLoading && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center mb-8">
            <i className="ri-search-line text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">لم يتم العثور على الطلب</h3>
            <p className="text-gray-500 mb-4">تحقق من رقم الطلب وتأكد أنه يخصك</p>
            <button 
              onClick={() => navigate('/restaurants')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              تصفح المطاعم
            </button>
          </div>
        )}

        {/* الطلبات الأخيرة */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">طلباتي الأخيرة</h2>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{order.id}</h3>
                      <p className="text-gray-600 text-sm">{order.restaurant}</p>
                      <p className="text-gray-500 text-xs mt-1">{order.orderTime}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800">{formatCurrency(order.total)}</div>
                      <div className={`text-xs px-2 py-1 rounded-full mt-1 ${statusInfo[order.status as keyof typeof statusInfo]?.bgColor} ${statusInfo[order.status as keyof typeof statusInfo]?.color}`}>
                        {statusInfo[order.status as keyof typeof statusInfo]?.title || 'غير محدد'}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {order.items.length} منتج - {order.estimatedTime}
                    </div>
                    <button 
                      onClick={() => handleOrderClick(order)}
                      className="text-orange-500 hover:text-orange-600 text-sm font-medium cursor-pointer flex items-center gap-1"
                    >
                      <i className="ri-eye-line"></i>
                      تتبع الطلب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="ri-file-list-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد طلبات</h3>
              <p className="text-gray-500 mb-4">لم تقم بأي طلبات بعد</p>
              <button 
                onClick={() => navigate('/restaurants')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                ابدأ الطلب الآن
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
