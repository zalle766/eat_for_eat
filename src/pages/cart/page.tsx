import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { MIN_DELIVERY_FEE } from '../../lib/distance';

interface CartItem {
  id: string;
  name: string;
  restaurant: string;
  restaurant_id: string;
  price: number;
  quantity: number;
  image: string;
}

interface SuggestedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  restaurant_id: string;
  category: string;
  restaurants: { id: string; name: string } | null;
}

export default function CartPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);

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

  // اقتراح المشروبات والحلويات من نفس المطاعم عند وجود عناصر في السلة
  useEffect(() => {
    if (cartItems.length === 0) {
      setSuggestedProducts([]);
      return;
    }
    const restaurantIds = [...new Set(cartItems.map(i => i.restaurant_id).filter(Boolean))];
    const cartProductIds = cartItems.map(i => i.id);
    if (restaurantIds.length === 0) return;

    const fetchSuggestions = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url, restaurant_id, category, restaurants(id, name)')
        .in('restaurant_id', restaurantIds)
        .in('category', ['Boissons', 'Desserts', 'Pâtisseries'])
        .eq('is_available', true);

      if (error) {
        setSuggestedProducts([]);
        return;
      }
      const filtered = (data || []).filter((p: any) => !cartProductIds.includes(p.id));
      setSuggestedProducts(filtered.slice(0, 6));
    };
    fetchSuggestions();
  }, [cartItems]);

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
        restaurant: product.restaurants?.name || 'Restaurant inconnu',
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

  const addSuggestionToCart = (product: SuggestedProduct) => {
    try {
      const savedCart = localStorage.getItem('cart');
      const cart = savedCart ? JSON.parse(savedCart) : {};
      cart[product.id] = (cart[product.id] || 0) + 1;
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      loadCartItems();
      toast.success(`${product.name} ajouté au panier`);
    } catch (error) {
      console.error('خطأ في الإضافة للسلة:', error);
      toast.error('Impossible d\'ajouter au panier');
    }
  };

  const parseDiscount = (discountStr: string): { type: string; discount: number } | null => {
    if (!discountStr || !discountStr.trim()) return null;
    const s = discountStr.trim();
    const percentMatch = s.match(/(\d+)\s*%/);
    if (percentMatch) return { type: 'percentage', discount: parseInt(percentMatch[1], 10) };
    const dhMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(?:DH|dh|د\.م)?/);
    if (dhMatch) return { type: 'fixed', discount: parseFloat(dhMatch[1].replace(',', '.')) };
    if (/livraison\s*gratuite|free\s*delivery/i.test(s)) return { type: 'delivery', discount: 0 };
    return null;
  };

  const applyPromoCode = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setPromoLoading(true);
    const restaurantIds = [...new Set(cartItems.map(i => i.restaurant_id).filter(Boolean))];
    const subtotalForCheck = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
      const { data: offers, error } = await supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .ilike('code', code);

      if (error) throw error;

      const today = new Date().toISOString().slice(0, 10);
      const validOffer = (offers || []).find((o: any) => {
        if (!o.code || o.code.toUpperCase() !== code) return false;
        if (o.valid_until && o.valid_until < today) return false;
        if (restaurantIds.length > 0 && o.restaurant_id && !restaurantIds.includes(o.restaurant_id)) return false;
        if (o.min_order && o.min_order > 0 && subtotalForCheck < o.min_order) return false;
        return true;
      });

      if (validOffer) {
        const parsed = parseDiscount(validOffer.discount);
        if (parsed) {
          setAppliedPromo({
            code: validOffer.code,
            type: parsed.type,
            discount: parsed.discount,
            offer_id: validOffer.id,
          });
          toast.success(`Code ${validOffer.code} appliqué !`);
        } else {
          setAppliedPromo({
            code: validOffer.code,
            type: 'percentage',
            discount: 10,
            offer_id: validOffer.id,
          });
          toast.success(`Code ${validOffer.code} appliqué !`);
        }
      } else {
        toast.error('Code promo invalide ou expiré. Vérifiez le code et le montant minimum.');
      }
    } catch (err) {
      console.error('Erreur vérification code promo:', err);
      toast.error('Code promo invalide');
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.warning('Le panier est vide');
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
  // تقدير في Panier؛ الرسوم الفعلية تُحسب في صفحة الدفع حسب المسافة (5 DH/km)
  const deliveryFee = MIN_DELIVERY_FEE;
  const getDiscount = () => {
    if (!appliedPromo) return 0;
    let d = 0;
    if (appliedPromo.type === 'percentage') d = subtotal * (appliedPromo.discount / 100);
    else if (appliedPromo.type === 'delivery') d = deliveryFee;
    else d = appliedPromo.discount || 0;
    return Math.min(d, subtotal + deliveryFee);
  };
  const discount = getDiscount();
  const total = Math.max(0, subtotal + deliveryFee - discount);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <i className="ri-loader-4-line text-6xl text-orange-500 animate-spin mb-4"></i>
            <p className="text-gray-600">Chargement du panier...</p>
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
            <h2 className="text-2xl font-bold text-gray-600 mb-4">Votre panier est vide</h2>
            <p className="text-gray-500 mb-8">Commencez par ajouter des plats délicieux à votre panier</p>
            <button 
              onClick={() => navigate('/restaurants')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Explorer les restaurants
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
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Panier</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Vos articles ({cartItems.length})</h2>
              
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

            {/* اقتراح المشروبات والحلويات */}
            {suggestedProducts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-cup-line text-2xl text-amber-500"></i>
                  <h2 className="text-xl font-bold text-gray-800">Complétez votre commande</h2>
                </div>
                <p className="text-gray-600 text-sm mb-5">
                  Un dessert ou une boisson accompagne parfaitement votre repas. Profitez de nos suggestions du même restaurant.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {suggestedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:border-orange-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="aspect-square relative bg-gray-100">
                        <img
                          src={product.image_url || `https://readdy.ai/api/search-image?query=delicious%20${encodeURIComponent(product.name)}%20food%20professional%20photography&width=200&height=200&seq=sugg-${product.id}`}
                          alt={product.name}
                          className="w-full h-full object-cover object-center"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium bg-white/90 text-gray-700 shadow-sm">
                          {product.category}
                        </span>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{product.name}</h3>
                        <p className="text-orange-600 font-bold text-sm mb-2">{product.price} DH</p>
                        <button
                          type="button"
                          onClick={() => addSuggestionToCart(product)}
                          className="w-full py-2 px-3 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <i className="ri-add-line text-base"></i>
                          Ajouter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Récapitulatif</h2>
              
              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Code promo</label>
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
                      placeholder="Entrez le code promo"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && applyPromoCode()}
                    />
                    <button 
                      type="button"
                      onClick={() => applyPromoCode()}
                      disabled={promoLoading}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {promoLoading ? '...' : 'Appliquer'}
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">Utilisez un code créé par le restaurant</p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{subtotal.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Frais de livraison
                    <span className="block text-xs text-gray-400 font-normal">(5 DH/km, calculés à l&apos;étape suivante)</span>
                  </span>
                  <span className="font-medium">à partir de 05 DH</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span>Réduction ({appliedPromo.code})</span>
                    <span>-{discount.toFixed(2)} DH</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-orange-600">{total.toFixed(2)} DH</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button 
                onClick={handleCheckout}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Passer la commande
              </button>
              
              <div className="mt-4 text-center">
                <button 
                  onClick={() => navigate('/restaurants')}
                  className="text-orange-500 hover:text-orange-600 text-sm cursor-pointer"
                >
                  Ajouter d'autres plats
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
