import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import { supabase } from '../../lib/supabase';

interface CartItem {
  id: string;
  name: string;
  restaurant: string;
  restaurant_id: string;
  price: number;
  quantity: number;
  image: string;
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);

  // تحميل عناصر السلة من localStorage وقاعدة البيانات
  useEffect(() => {
    loadCartItems();
    
    // الاستماع لتحديثات السلة
    const handleCartUpdate = () => {
      loadCartItems();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      
      // قراءة السلة من localStorage
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      const cart = JSON.parse(savedCart);
      const productIds = Object.keys(cart);

      if (productIds.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      // جلب بيانات المنتجات من قاعدة البيانات
      const { data: products, error } = await supabase
        .from('products')
        .select('*, restaurants(id, name)')
        .in('id', productIds);

      if (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        setCartItems([]);
        setLoading(false);
        return;
      }

      // تحويل البيانات لصيغة السلة
      const items: CartItem[] = products.map(product => ({
        id: product.id,
        name: product.name,
        restaurant: product.restaurants?.name || 'مطعم غير معروف',
        restaurant_id: product.restaurant_id,
        price: product.price,
        quantity: cart[product.id],
        image: product.image_url || `https://readdy.ai/api/search-image?query=delicious%20$%7Bproduct.name%7D%20food%20dish%20on%20white%20plate%2C%20professional%20food%20photography%2C%20appetizing%20presentation&width=100&height=100&seq=cart-${product.id}&orientation=squarish`
      }));

      setCartItems(items);
      setLoading(false);

    } catch (error) {
      console.error('خطأ في تحميل السلة:', error);
      setCartItems([]);
      setLoading(false);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) return;

      const cart = JSON.parse(savedCart);

      if (newQuantity === 0) {
        delete cart[id];
        setCartItems(cartItems.filter(item => item.id !== id));
      } else {
        cart[id] = newQuantity;
        setCartItems(cartItems.map(item => 
          item.id === id ? { ...item, quantity: newQuantity } : item
        ));
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('خطأ في تحديث الكمية:', error);
    }
  };

  const removeItem = (id: string) => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) return;

      const cart = JSON.parse(savedCart);
      delete cart[id];

      localStorage.setItem('cart', JSON.stringify(cart));
      setCartItems(cartItems.filter(item => item.id !== id));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('خطأ في حذف العنصر:', error);
    }
  };

  const applyPromoCode = () => {
    if (promoCode === 'FIRST50') {
      setAppliedPromo({ code: 'FIRST50', discount: 50, type: 'percentage' });
    } else if (promoCode === 'FREE100') {
      setAppliedPromo({ code: 'FREE100', discount: 40, type: 'fixed' });
    } else if (promoCode.trim()) {
      alert('كود الخصم غير صحيح');
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('السلة فارغة');
      return;
    }

    // حفظ معلومات الخصم
    if (appliedPromo) {
      localStorage.setItem('appliedPromo', JSON.stringify(appliedPromo));
    } else {
      localStorage.removeItem('appliedPromo');
    }
    
    navigate('/checkout');
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 25;
  const discount = appliedPromo ? 
    (appliedPromo.type === 'percentage' ? subtotal * (appliedPromo.discount / 100) : appliedPromo.discount) : 0;
  const total = subtotal + deliveryFee - discount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <i className="ri-loader-4-line text-6xl text-orange-500 animate-spin mb-4"></i>
            <p className="text-gray-600">جاري تحميل السلة...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <i className="ri-shopping-cart-line text-8xl text-gray-300 mb-6"></i>
            <h2 className="text-2xl font-bold text-gray-600 mb-4">سلتك فارغة</h2>
            <p className="text-gray-500 mb-8">ابدأ بإضافة أطباق لذيذة إلى سلتك</p>
            <button 
              onClick={() => navigate('/restaurants')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              تصفح المطاعم
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
      
      <main className="max-w-6xl mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">السلة</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">طلباتك ({cartItems.length})</h2>
              
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-6 border-b border-gray-200 last:border-b-0">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-20 h-20 object-cover object-top rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">{item.name}</h3>
                          <button
                            onClick={() => navigate(`/restaurant?id=${item.restaurant_id}`)}
                            className="text-sm text-orange-500 hover:text-orange-600 cursor-pointer"
                          >
                            {item.restaurant}
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 cursor-pointer"
                        >
                          <i className="ri-close-line text-lg"></i>
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                          >
                            <i className="ri-subtract-line text-sm"></i>
                          </button>
                          <span className="font-medium w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                          >
                            <i className="ri-add-line text-sm"></i>
                          </button>
                        </div>
                        <div className="font-bold text-gray-800">{item.price * item.quantity} DH</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6">ملخص الطلب</h2>
              
              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">كود الخصم</label>
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <i className="ri-check-line text-green-500"></i>
                      <span className="text-sm font-medium text-green-700">{appliedPromo.code}</span>
                    </div>
                    <button 
                      onClick={removePromoCode}
                      className="text-green-500 hover:text-green-600 cursor-pointer"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="أدخل كود الخصم"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && applyPromoCode()}
                    />
                    <button 
                      onClick={applyPromoCode}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      تطبيق
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">جرب: FIRST50 أو FREE100</p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">المجموع الفرعي</span>
                  <span className="font-medium">{subtotal.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">رسوم التوصيل</span>
                  <span className="font-medium">{deliveryFee.toFixed(2)} DH</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span>الخصم ({appliedPromo.code})</span>
                    <span>-{discount.toFixed(2)} DH</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>الإجمالي</span>
                    <span className="text-orange-600">{total.toFixed(2)} DH</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button 
                onClick={handleCheckout}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                إتمام الطلب
              </button>
              
              <div className="mt-4 text-center">
                <button 
                  onClick={() => navigate('/restaurants')}
                  className="text-orange-500 hover:text-orange-600 text-sm cursor-pointer"
                >
                  إضافة المزيد من الأطباق
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
