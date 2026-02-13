import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [userLocation, setUserLocation] = useState<string>('');
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // جلب موقع المستخدم
  const getUserLocation = () => {
    setIsLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // استخدام Nominatim API للحصول على اسم المدينة
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fr`
            );
            const data = await response.json();
            
            const city = data.address?.city || data.address?.town || data.address?.village || 'Localisation inconnue';
            setUserLocation(city);
            localStorage.setItem('userLocation', city);
            localStorage.setItem('userCoordinates', JSON.stringify({ latitude, longitude }));
          } catch (error) {
            console.error('Erreur lors de la récupération de l\'adresse:', error);
            setUserLocation('Localisation inconnue');
          } finally {
            setIsLocationLoading(false);
          }
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          setUserLocation('Localisation désactivée');
          setIsLocationLoading(false);
        }
      );
    } else {
      setUserLocation('Géolocalisation non supportée');
      setIsLocationLoading(false);
    }
  };

  // تحديث عداد السلة
  const updateCartCount = () => {
    try {
      const cart = localStorage.getItem('cart');
      if (cart) {
        const cartData = JSON.parse(cart);
        if (typeof cartData === 'object' && cartData !== null) {
          // حساب إجمالي الكميات من جميع المنتجات
          const totalCount = Object.values(cartData).reduce((sum: number, quantity: any) => {
            return sum + (typeof quantity === 'number' ? quantity : 0);
          }, 0);
          setCartCount(totalCount);
        } else {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compteur du panier:', error);
      setCartCount(0);
    }
  };

  // التحقق من نوع المستخدم وتوجيهه للصفحة المناسبة
  const handleProfileNavigation = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      // التحقق من كون المستخدم صاحب مطعم مقبول
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'approved')
        .single();

      if (restaurant) {
        // صاحب مطعم مقبول - توجيه للوحة التحكم
        navigate('/restaurant-dashboard');
        setIsProfileMenuOpen(false);
        return;
      }

      // التحقق من كونه مدير
      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single();

      if (admin) {
        // مدير - توجيه للوحة الإدارة
        navigate('/admin');
        setIsProfileMenuOpen(false);
        return;
      }

      // مستخدم عادي - توجيه للملف الشخصي
      navigate('/profile');
      setIsProfileMenuOpen(false);
    } catch (error) {
      console.error('خطأ في التحقق من نوع المستخدم:', error);
      // في حالة الخطأ، توجيه للملف الشخصي العادي
      navigate('/profile');
      setIsProfileMenuOpen(false);
    }
  };

  // إغلاق قائمة الملف الشخصي عند النقر خارجها
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isProfileMenuOpen]);

  useEffect(() => {
    // التحقق من المستخدم المسجل دخوله
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkUser();

    // الاستماع لتغييرات تسجيل الدخول
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    // تحديث عداد السلة عند تحميل الصفحة
    updateCartCount();

    // الاستماع لتحديثات السلة
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    // تحديث العداد كل ثانية للتأكد من التزامن
    const interval = setInterval(updateCartCount, 1000);

    // جلب الموقع المحفوظ
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setUserLocation(savedLocation);
    }

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-w-0">
          {/* Logo */}
          <div className="flex items-center min-w-0 flex-shrink">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center cursor-pointer min-w-0"
            >
              <img 
                src="/logo%20(2).png" 
                alt="Eat for Eat" 
                className="h-[70px] w-auto object-contain"
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => navigate('/')}
              className={`text-gray-700 hover:text-orange-500 font-medium cursor-pointer ${
                isActive('/') ? 'text-orange-500' : ''
              }`}
            >
              Accueil
            </button>
            <button 
              onClick={() => navigate('/restaurants')}
              className={`text-gray-700 hover:text-orange-500 font-medium cursor-pointer ${
                isActive('/restaurants') ? 'text-orange-500' : ''
              }`}
            >
              Restaurants
            </button>
            <button 
              onClick={() => navigate('/offers')}
              className={`text-gray-700 hover:text-orange-500 font-medium cursor-pointer ${
                isActive('/offers') ? 'text-orange-500' : ''
              }`}
            >
              Offres
            </button>
            <button 
              onClick={() => navigate('/track-order')}
              className={`text-gray-700 hover:text-orange-500 font-medium cursor-pointer ${
                isActive('/track-order') ? 'text-orange-500' : ''
              }`}
            >
              Suivre commande karim
            </button>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Location Button */}
            <button 
              onClick={getUserLocation}
              disabled={isLocationLoading}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              title="Obtenir ma localisation"
            >
              <i className={`ri-map-pin-line text-lg ${isLocationLoading ? 'animate-pulse' : ''}`}></i>
              <span className="text-sm font-medium max-w-[120px] truncate">
                {isLocationLoading ? 'Chargement...' : userLocation || 'Ma localisation'}
              </span>
            </button>

            {/* Cart */}
            <button 
              onClick={() => navigate('/cart')}
              className="relative p-2 text-gray-700 hover:text-orange-500 cursor-pointer"
            >
              <i className="ri-shopping-cart-line text-xl"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileMenuOpen(!isProfileMenuOpen);
                  }}
                  className="flex items-center gap-2 p-2 text-gray-700 hover:text-orange-500 cursor-pointer"
                >
                  <i className="ri-user-line text-xl"></i>
                  <span className="hidden md:block font-medium">Mon compte</span>
                  <i className="ri-arrow-down-s-line text-sm"></i>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100]">
                    <button 
                      onClick={handleProfileNavigation}
                      className="w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                    >
                      <i className="ri-user-line text-lg"></i>
                      Profil
                    </button>
                    <button 
                      onClick={() => {
                        navigate('/orders');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                    >
                      <i className="ri-file-list-line text-lg"></i>
                      Mes commandes
                    </button>
                    <button 
                      onClick={() => {
                        navigate('/favorites');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                    >
                      <i className="ri-heart-line text-lg"></i>
                      Favoris
                    </button>
                    <hr className="my-2" />
                    <button 
                      onClick={handleLogout}
                      className="w-full text-right px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-3 cursor-pointer"
                    >
                      <i className="ri-logout-box-line text-lg"></i>
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => navigate('/auth')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Se connecter
              </button>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-orange-500 cursor-pointer"
            >
              <i className={`ri-${isMenuOpen ? 'close' : 'menu'}-line text-xl`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {/* Mobile Location Button */}
              <button 
                onClick={() => {
                  getUserLocation();
                  setIsMenuOpen(false);
                }}
                disabled={isLocationLoading}
                className="flex items-center gap-3 text-gray-700 hover:text-orange-500 font-medium cursor-pointer"
              >
                <i className={`ri-map-pin-line text-lg ${isLocationLoading ? 'animate-pulse' : ''}`}></i>
                <span className="truncate">
                  {isLocationLoading ? 'Chargement...' : userLocation || 'Ma localisation'}
                </span>
              </button>

              <button 
                onClick={() => {
                  navigate('/');
                  setIsMenuOpen(false);
                }}
                className={`text-right text-gray-700 hover:text-orange-500 font-medium cursor-pointer ${
                  isActive('/') ? 'text-orange-500' : ''
                }`}
              >
                Accueil
              </button>
              <button 
                onClick={() => {
                  navigate('/restaurants');
                  setIsMenuOpen(false);
                }}
                className={`text-right text-gray-700 hover:text-orange-500 font-medium cursor-pointer ${
                  isActive('/restaurants') ? 'text-orange-500' : ''
                }`}
              >
                Restaurants
              </button>
              <button 
                onClick={() => {
                  navigate('/offers');
                  setIsMenuOpen(false);
                }}
                className={`text-right text-gray-700 hover:text-orange-500 font-medium cursor-pointer ${
                  isActive('/offers') ? 'text-orange-500' : ''
                }`}
              >
                Offres
              </button>
              <button 
                onClick={() => {
                  navigate('/track-order');
                  setIsMenuOpen(false);
                }}
                className={`text-right text-gray-700 hover:text-orange-500 font-medium cursor-pointer ${
                  isActive('/track-order') ? 'text-orange-500' : ''
                }`}
              >
                Suivre commande
              </button>
              
              {user && (
                <>
                  <hr className="border-gray-200" />
                  <button 
                    onClick={() => {
                      handleProfileNavigation();
                      setIsMenuOpen(false);
                    }}
                    className="text-right text-gray-700 hover:text-orange-500 font-medium cursor-pointer flex items-center gap-3"
                  >
                    <i className="ri-user-line text-lg"></i>
                    Profil
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/orders');
                      setIsMenuOpen(false);
                    }}
                    className="text-right text-gray-700 hover:text-orange-500 font-medium cursor-pointer flex items-center gap-3"
                  >
                    <i className="ri-file-list-line text-lg"></i>
                    Mes commandes
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/favorites');
                      setIsMenuOpen(false);
                    }}
                    className="text-right text-gray-700 hover:text-orange-500 font-medium cursor-pointer flex items-center gap-3"
                  >
                    <i className="ri-heart-line text-lg"></i>
                    Favoris
                  </button>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-right text-red-600 hover:text-red-700 font-medium cursor-pointer flex items-center gap-3"
                  >
                    <i className="ri-logout-box-line text-lg"></i>
                    Déconnexion
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
