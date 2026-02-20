import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { geocodeAddress, reverseGeocode } from '../../lib/geocode';
import { calculateDistanceKm, calculateDeliveryFee, MIN_DELIVERY_FEE } from '../../lib/distance';

interface CartItem {
  id: string;
  name: string;
  restaurant: string;
  restaurant_id: string;
  price: number;
  quantity: number;
  image: string;
}

interface DeliveryInfo {
  name: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    name: '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [restaurantCoords, setRestaurantCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(MIN_DELIVERY_FEE);
  const [deliveryFeeLoading, setDeliveryFeeLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { user } = await checkUser();
      loadCartData();
      if (!user) loadDeliveryInfo();
      loadAppliedPromo();
    };
    init();
  }, []);

  // جلب إحداثيات المطعم عند تغيير السلة
  useEffect(() => {
    const restaurantId = cartItems[0]?.restaurant_id;
    if (!restaurantId) {
      setRestaurantCoords(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('latitude, longitude')
        .eq('id', restaurantId)
        .single();
      if (!cancelled && data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        setRestaurantCoords({ lat: data.latitude, lng: data.longitude });
      } else {
        setRestaurantCoords(null);
      }
    })();
    return () => { cancelled = true; };
  }, [cartItems[0]?.restaurant_id ?? '']);

  // جيو-كود عنوان التوصيل عند تغيير العنوان (مع تأخير بسيط)
  useEffect(() => {
    const address = deliveryInfo.address.trim();
    const city = deliveryInfo.city.trim();
    if (address.length < 10 || !city) {
      setDeliveryCoords(null);
      return;
    }
    const t = setTimeout(async () => {
      setDeliveryFeeLoading(true);
      try {
        const geo = await geocodeAddress(address, city);
        setDeliveryCoords({ lat: geo.lat, lng: geo.lng });
      } catch {
        setDeliveryCoords(null);
      } finally {
        setDeliveryFeeLoading(false);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [deliveryInfo.address, deliveryInfo.city]);

  // حساب رسوم التوصيل حسب المسافة
  useEffect(() => {
    if (restaurantCoords && deliveryCoords) {
      const distanceKm = calculateDistanceKm(
        restaurantCoords.lat,
        restaurantCoords.lng,
        deliveryCoords.lat,
        deliveryCoords.lng
      );
      setDeliveryFee(calculateDeliveryFee(distanceKm));
    } else {
      setDeliveryFee(MIN_DELIVERY_FEE);
    }
  }, [restaurantCoords, deliveryCoords]);

  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  const checkUser = async (): Promise<{ user: any }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const complete = await loadUserProfile(user.id);
        setProfileComplete(complete);
        return { user };
      }
      setProfileComplete(false);
      return { user: null };
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error);
      setProfileComplete(false);
      return { user: null };
    }
  };

  const loadUserProfile = async (authId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, phone, address, city')
        .eq('auth_id', authId)
        .single();

      if (!error && data) {
        setDeliveryInfo(prev => ({
          ...prev,
          name: data.name || prev.name,
          phone: data.phone || prev.phone,
          address: data.address || prev.address,
          city: data.city || prev.city
        }));
        const hasAddress = (data.address || '').trim().length >= 10;
        const hasCity = !!(data.city || '').trim();
        return hasAddress && hasCity;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setDeliveryInfo(prev => ({
            ...prev,
            name: user.user_metadata?.name || user.email?.split('@')[0] || ''
          }));
        }
        return false;
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      return false;
    }
  };

  const loadCartData = async () => {
    try {
      setIsLoading(true);
      
      // قراءة السلة من localStorage
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) {
        setCartItems([]);
        setIsLoading(false);
        return;
      }

      const cart = JSON.parse(savedCart);
      const productIds = Object.keys(cart);

      if (productIds.length === 0) {
        setCartItems([]);
        setIsLoading(false);
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
        setIsLoading(false);
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
      setIsLoading(false);

    } catch (error) {
      console.error('خطأ في تحميل السلة:', error);
      setCartItems([]);
      setIsLoading(false);
    }
  };

  const loadDeliveryInfo = () => {
    try {
      const savedDeliveryInfo = localStorage.getItem('deliveryInfo');
      if (savedDeliveryInfo) {
        const parsedInfo = JSON.parse(savedDeliveryInfo);
        setDeliveryInfo(parsedInfo);
      }
    } catch (error) {
      console.error('خطأ في تحليل معلومات التوصيل:', error);
    }
  };

  const loadAppliedPromo = () => {
    try {
      const savedPromo = localStorage.getItem('appliedPromo');
      if (savedPromo) {
        setAppliedPromo(JSON.parse(savedPromo));
      }
    } catch (error) {
      console.error('خطأ في تحميل الخصم:', error);
    }
  };

  const handleGetLocation = async () => {
    if (!currentUser) return;
    
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        toast.error('La géolocalisation n\'est pas supportée par votre navigateur');
        setIsGettingLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { lat, lng } = position.coords;
            // استخدام reverse geocoding للحصول على العنوان والمدينة
            const { address, city } = await reverseGeocode(lat, lng);
            
            if (!address || !city) {
              toast.error('Impossible de déterminer votre adresse. Veuillez la saisir manuellement.');
              setIsGettingLocation(false);
              return;
            }

            // حفظ العنوان والمدينة في ملف المستخدم الشخصي
            const { error: updateError } = await supabase
              .from('users')
              .update({
                address: address,
                city: city
              })
              .eq('auth_id', currentUser.id);

            if (updateError) {
              console.error('Erreur lors de la mise à jour du profil:', updateError);
              toast.error('Erreur lors de la sauvegarde de votre adresse');
              setIsGettingLocation(false);
              return;
            }

            toast.success('Votre adresse a été enregistrée avec succès !');
            // إعادة تحميل الملف الشخصي والتحقق من اكتماله
            const complete = await loadUserProfile(currentUser.id);
            setProfileComplete(complete);
            setIsGettingLocation(false);
            
            // إذا كان الملف الشخصي مكتملاً الآن، الصفحة ستُعاد تحميلها تلقائياً
          } catch (error) {
            console.error('Erreur lors de la récupération de l\'adresse:', error);
            toast.error('Erreur lors de la récupération de votre adresse');
            setIsGettingLocation(false);
          }
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          let errorMessage = 'Impossible d\'accéder à votre position.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Permission de géolocalisation refusée. Veuillez autoriser l\'accès à votre position.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = 'Position indisponible. Veuillez saisir votre adresse manuellement.';
          }
          toast.error(errorMessage);
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('Erreur lors de la demande de géolocalisation:', error);
      toast.error('Une erreur est survenue lors de la demande de votre position');
      setIsGettingLocation(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!deliveryInfo.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (deliveryInfo.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    const phoneTrim = deliveryInfo.phone.trim();
    const digitCount = (phoneTrim.match(/\d/g) || []).length;
    if (!phoneTrim) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else if (!/^[0-9+\-\s()]+$/.test(phoneTrim) || digitCount < 10) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    if (!deliveryInfo.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    } else if (deliveryInfo.address.trim().length < 10) {
      newErrors.address = 'Veuillez entrer une adresse plus détaillée';
    }

    if (!deliveryInfo.city) {
      newErrors.city = 'La ville est requise';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return false;
    }
    return true;
  };

  const handleInputChange = (field: keyof DeliveryInfo, value: string) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value
    }));

    // إزالة رسالة الخطأ عند التعديل
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // حفظ المعلومات في localStorage
    const updatedInfo = { ...deliveryInfo, [field]: value };
    localStorage.setItem('deliveryInfo', JSON.stringify(updatedInfo));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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

  const handleSubmitOrder = async () => {
    if (!validateForm()) return;

    if (cartItems.length === 0) {
      toast.warning('Le panier est vide. Impossible de passer la commande.');
      return;
    }

    if (!currentUser) {
      toast.error('Veuillez vous connecter pour passer la commande');
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let orderId = crypto.randomUUID?.() || `order-${Date.now()}`;
      const orderTime = new Date().toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // جيو-كود عنوان التوصيل لحفظ الإحداثيات (يعرضها السائق كـ 31.xxx, -8.xxx)
      let deliveryLat: number | null = null;
      let deliveryLng: number | null = null;
      try {
        const geo = await geocodeAddress(deliveryInfo.address, deliveryInfo.city);
        deliveryLat = geo.lat;
        deliveryLng = geo.lng;
      } catch (_) {
        /* استمر بدون إحداثيات */
      }

      // محاولة حفظ الطلب في Supabase أولاً للحصول على id موحد (للتتبع والموقع)
      let createdOrder: { id: string } | null = null;
      try {
        const res = await supabase
          .from('orders')
          .insert({
            customer_id: currentUser.id,
            restaurant_id: cartItems[0]?.restaurant_id || null,
            status: 'pending',
            subtotal,
            delivery_fee: deliveryFee,
            total,
            customer_name: deliveryInfo.name,
            customer_phone: deliveryInfo.phone,
            delivery_address: deliveryInfo.address,
            delivery_city: deliveryInfo.city,
            delivery_latitude: deliveryLat,
            delivery_longitude: deliveryLng,
            notes: deliveryInfo.notes || null,
          })
          .select('id')
          .single();
        if (!res.error && res.data) {
          createdOrder = res.data;
          orderId = res.data.id;
        }
      } catch (_) {
        /* use fallback orderId */
      }

      const orderData = {
        id: orderId,
        user_id: currentUser.id,
        restaurant: cartItems[0]?.restaurant || 'Plusieurs restaurants',
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          restaurant_id: item.restaurant_id
        })),
        total: total,
        status: 'confirmed',
        estimatedTime: '30-45 minutes',
        orderTime: orderTime,
        deliveryInfo,
        paymentMethod,
        subtotal,
        deliveryFee,
        discount,
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString()
      };

      if (createdOrder) {
        try {
          const orderItemsPayload = cartItems.map((item) => ({
            order_id: createdOrder!.id,
            product_id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
          }));
          await supabase.from('order_items').insert(orderItemsPayload);
        } catch (itemsErr) {
          console.warn('Order items insert failed:', itemsErr);
        }
      }

      // حفظ الطلب في localStorage (يعمل دائماً - لوحة المطعم تقرأ منه)
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      existingOrders.push(orderData);
      localStorage.setItem('orders', JSON.stringify(existingOrders));
      localStorage.setItem('currentOrder', JSON.stringify(orderData));
      
      // تفريغ السلة فوراً بعد تأكيد الطلب
      localStorage.removeItem('cart');
      localStorage.removeItem('appliedPromo');
      setCartItems([]);
      
      // إرسال حدث مخصص لتحديث عداد السلة في الهيدر
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      window.dispatchEvent(new CustomEvent('ordersUpdated'));
      
      // محاكاة تحديث حالة الطلب إلى "preparing" بعد 30 ثانية
      setTimeout(() => {
        const updatedOrderData = { ...orderData, status: 'preparing' };
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const orderIndex = orders.findIndex((order: any) => order.id === orderId);
        if (orderIndex !== -1) {
          orders[orderIndex] = updatedOrderData;
          localStorage.setItem('orders', JSON.stringify(orders));
          localStorage.setItem('currentOrder', JSON.stringify(updatedOrderData));
        }
      }, 30000);
      
      // التوجه إلى صفحة تتبع الطلب
      navigate('/track-order', { state: { orderId } });
    } catch (error) {
      console.error('خطأ في إرسال الطلب:', error);
      toast.error('Erreur lors de l\'envoi de la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <div className="text-center py-16">
            <i className="ri-loader-4-line text-6xl text-orange-500 animate-spin mb-4"></i>
            <p className="text-gray-600">Chargement du panier...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // المستخدم غير مسجل - توجيه للتسجيل
  if (!isLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <div className="text-center py-16">
            <i className="ri-user-add-line text-8xl text-orange-500 mb-6"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Connexion requise</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Vous devez créer un compte ou vous connecter pour finaliser votre commande.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/auth', { state: { from: 'checkout' } })}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Créer un compte / Se connecter
              </button>
              <button 
                onClick={() => navigate('/cart')}
                className="text-orange-500 hover:text-orange-600 px-8 py-3 rounded-lg font-medium border-2 border-orange-500 cursor-pointer"
              >
                Retour au panier
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // المستخدم مسجل لكن الملف الشخصي غير مكتمل (العنوان أو المدينة)
  if (!isLoading && currentUser && profileComplete === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <div className="text-center py-16">
            <i className="ri-map-pin-line text-8xl text-orange-500 mb-6"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Profil incomplet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Veuillez compléter votre adresse et votre ville dans votre profil pour continuer la commande.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
              >
                {isGettingLocation ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    <span>Détection en cours...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-map-pin-3-line"></i>
                    <span>Utiliser ma position actuelle</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Compléter mon profil manuellement
              </button>
              <button 
                onClick={() => navigate('/cart')}
                className="text-orange-500 hover:text-orange-600 px-8 py-3 rounded-lg font-medium border-2 border-orange-500 cursor-pointer"
              >
                Retour au panier
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // التحقق من وجود عناصر في السلة بعد التحميل
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <div className="text-center py-16">
            <i className="ri-shopping-cart-line text-8xl text-gray-300 mb-6"></i>
            <h2 className="text-2xl font-bold text-gray-600 mb-4">Panier vide</h2>
            <p className="text-gray-500 mb-8">Impossible de passer la commande sans articles dans le panier</p>
            <div className="space-y-4">
              <button 
                onClick={() => navigate('/restaurants')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Explorer les restaurants
              </button>
              <br />
              <button 
                onClick={() => navigate('/cart')}
                className="text-orange-500 hover:text-orange-600 text-sm cursor-pointer"
              >
                Retour au panier
              </button>
            </div>
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
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/cart')}
            className="text-gray-600 hover:text-orange-500 cursor-pointer"
          >
            <i className="ri-arrow-right-line text-xl"></i>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Finaliser la commande</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* معلومات التوصيل */}
          <div className="lg:col-span-2 space-y-6">
            {/* معلومات العميل - من الملف الشخصي للزبون المسجل */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i className="ri-user-line text-orange-500 w-5 h-5 flex items-center justify-center"></i>
                Informations de livraison
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Nom</p>
                    <p className="font-medium text-gray-800">{deliveryInfo.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="text-orange-500 hover:text-orange-600 text-sm font-medium cursor-pointer flex items-center gap-1"
                  >
                    <i className="ri-pencil-line"></i>
                    Modifier
                  </button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Téléphone</p>
                  <p className="font-medium text-gray-800">{deliveryInfo.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Adresse</p>
                  <p className="font-medium text-gray-800">{deliveryInfo.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Ville</p>
                  <p className="font-medium text-gray-800">{deliveryInfo.city}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes supplémentaires
                </label>
                <textarea
                  value={deliveryInfo.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  rows={3}
                  maxLength={500}
                  placeholder="Notes pour la livraison (optionnel)..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {deliveryInfo.notes.length}/500 caractères
                </p>
              </div>
            </div>

            {/* طريقة الدفع */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i className="ri-bank-card-line text-orange-500 w-5 h-5 flex items-center justify-center"></i>
                Mode de paiement
              </h2>
              
              <div className="space-y-4">
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'cash' ? 'border-orange-500' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'cash' && <div className="w-3 h-3 bg-orange-500 rounded-full"></div>}
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center">
                      <i className="ri-money-dollar-circle-line text-xl text-gray-600"></i>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Paiement à la livraison</h3>
                      <p className="text-sm text-gray-600">Payez au livreur à la réception</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    paymentMethod === 'card' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'card' ? 'border-orange-500' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'card' && <div className="w-3 h-3 bg-orange-500 rounded-full"></div>}
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center">
                      <i className="ri-bank-card-line text-xl text-gray-600"></i>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Paiement par carte bancaire</h3>
                      <p className="text-sm text-gray-600">Paiement sécurisé en ligne</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ملخص الطلب */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i className="ri-file-list-line text-orange-500 w-5 h-5 flex items-center justify-center"></i>
                Récapitulatif de la commande
              </h2>
              
              {/* عناصر السلة */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-12 h-12 object-cover object-top rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-600">{item.restaurant}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">Qté: {item.quantity}</span>
                        <span className="font-medium text-sm text-orange-600">{item.price * item.quantity} DH</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* تفاصيل السعر */}
              <div className="space-y-3 mb-6 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{subtotal.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Frais de livraison
                    <span className="block text-xs text-gray-400 font-normal">(5 DH/km selon la distance)</span>
                  </span>
                  <span className="font-medium">
                    {deliveryFeeLoading ? '...' : `${deliveryFee.toFixed(2)} DH`}
                  </span>
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

              {/* زر إتمام الطلب */}
              <button 
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Envoi de la commande...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line w-5 h-5 flex items-center justify-center"></i>
                    Confirmer la commande ({total.toFixed(2)} DH)
                  </>
                )}
              </button>
              
              <div className="mt-4 text-center">
                <button 
                  onClick={() => navigate('/cart')}
                  className="text-orange-500 hover:text-orange-600 text-sm cursor-pointer"
                >
                  Retour au panier
                </button>
              </div>

              {/* معلومات إضافية */}
              <div className="mt-6 pt-4 border-t">
                <div className="text-xs text-gray-500 space-y-2">
                  <div className="flex items-center gap-2">
                    <i className="ri-time-line text-orange-500 w-4 h-4 flex items-center justify-center"></i>
                    <span>Délai de livraison estimé: 30-45 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-shield-check-line text-green-500 w-4 h-4 flex items-center justify-center"></i>
                    <span>Paiement sécurisé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
