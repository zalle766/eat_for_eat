import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import RatingStars from '../../components/feature/RatingStars';
import RatingModal from '../../components/feature/RatingModal';
import ReviewsList from '../../components/feature/ReviewsList';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface FavoriteItem {
  id: string;
  type: 'restaurant' | 'product';
}

export default function RestaurantPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [restaurant, setRestaurant] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{type: 'restaurant' | 'product', id: string, name: string} | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [productRatings, setProductRatings] = useState<Record<string, { average: number; count: number }>>({});

  const ratingsFunctionUrl = `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/ratings`;

  const getRatingsHeaders = async (requireAuth = false) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (requireAuth && !session?.access_token) {
      throw new Error('AUTH_REQUIRED');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return { headers, session };
  };

  // تحميل البيانات من قاعدة البيانات
  const loadRestaurantData = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // تحميل بيانات المطعم
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (restaurantError) {
        console.error('خطأ في تحميل بيانات المطعم:', restaurantError);
        setRestaurant(null);
        return;
      }

      setRestaurant(restaurantData);

      // تحميل المنتجات
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', id);

      if (productsError) {
        console.error('خطأ في تحميل المنتجات:', productsError);
      } else {
        setProducts(productsData || []);
      }

    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadRestaurantData();
      loadFavorites();
      loadCart();
    }
  }, [id]);

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = (newCart: {[key: string]: number}) => {
    localStorage.setItem('cart', JSON.stringify(newCart));
    // إرسال حدث لتحديث عداد السلة
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const isFavorite = (id: string, type: 'restaurant' | 'product') => {
    return favorites.some(fav => fav.id === id && fav.type === type);
  };

  const toggleFavorite = (itemId: string, type: 'restaurant' | 'product' = 'restaurant') => {
    let updatedFavorites: FavoriteItem[];
    
    if (isFavorite(itemId, type)) {
      updatedFavorites = favorites.filter(fav => !(fav.id === itemId && fav.type === type));
    } else {
      updatedFavorites = [...favorites, { id: itemId, type }];
    }

    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const loadRestaurantReviews = async () => {
    if (!id) return;

    setReviewsLoading(true);
    try {
      const { headers } = await getRatingsHeaders();
      const params = new URLSearchParams();
      params.append('restaurant_id', id);

      const response = await fetch(`${ratingsFunctionUrl}?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Échec du chargement des avis');
      }

      const data = await response.json();
      setReviews(data.ratings || []);
      setAverageRating(data.average_rating || 0);
      setTotalReviews(data.total_count || 0);
    } catch (error) {
      console.error('خطأ في تحميل التقييمات:', error);
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadProductRating = async (productId: string) => {
    try {
      const { headers } = await getRatingsHeaders();
      const params = new URLSearchParams();
      params.append('product_id', productId);

      const response = await fetch(`${ratingsFunctionUrl}?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setProductRatings((prev) => ({
        ...prev,
        [productId]: {
          average: data.average_rating || 0,
          count: data.total_count || 0,
        },
      }));
    } catch (error) {
      console.error(`خطأ في تحميل تقييمات المنتج ${productId}:`, error);
    }
  };

  useEffect(() => {
    if (id && restaurant) {
      loadRestaurantReviews();
    }
  }, [id, restaurant]);

  useEffect(() => {
    if (products.length === 0) return;
    products.forEach((product) => {
      loadProductRating(product.id);
    });
  }, [products]);

  const handleRateClick = (type: 'restaurant' | 'product', id: string, name: string) => {
    setRatingTarget({ type, id, name });
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!ratingTarget) return;

    try {
      const { headers } = await getRatingsHeaders(true);

      const payload = {
        rating,
        comment,
        ...(ratingTarget.type === 'restaurant' 
          ? { restaurant_id: ratingTarget.id }
          : { product_id: ratingTarget.id }
        )
      };

      const response = await fetch(ratingsFunctionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Erreur lors de l\'envoi de l\'avis';
        console.error('خطأ من الخادم:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        // إعادة تحميل التقييمات بعد الحفظ
        if (ratingTarget.type === 'restaurant') {
          await loadRestaurantReviews();
        } else {
          await loadProductRating(ratingTarget.id);
        }
        // إغلاق المودال فقط عند النجاح
        setShowRatingModal(false);
        setRatingTarget(null);
        // عرض رسالة نجاح
        toast.success('Avis enregistré avec succès !');
      } else {
        throw new Error(result.error || 'Échec de l\'envoi de l\'avis');
      }
    } catch (error) {
      if ((error as Error).message === 'AUTH_REQUIRED') {
        toast.warning('Veuillez vous connecter pour ajouter un avis');
        setShowRatingModal(false);
        setRatingTarget(null);
      } else {
        const errorMessage = (error as Error).message || 'Erreur lors de l\'envoi de l\'avis';
        console.error('خطأ في إرسال التقييم:', error);
        toast.error(errorMessage);
        // لا نغلق المودال عند حدوث خطأ حتى يتمكن المستخدم من المحاولة مرة أخرى
        throw error;
      }
    }
  };

  const addToCart = (product: any) => {
    const newCart = {
      ...cart,
      [product.id]: (cart[product.id] || 0) + 1
    };
    setCart(newCart);
    saveCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const newCart = { ...cart };
    if (newCart[productId] > 1) {
      newCart[productId]--;
    } else {
      delete newCart[productId];
    }
    setCart(newCart);
    saveCart(newCart);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-orange-500 animate-spin mb-4"></i>
            <p className="text-gray-600">Chargement du restaurant...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="ri-restaurant-line text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">Restaurant introuvable</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-20">
        <div>
          {/* Restaurant Header */}
          <div className="relative h-64 bg-gradient-to-r from-orange-500 to-red-500">
            <img
              src={restaurant.image || `https://readdy.ai/api/search-image?query=modern%20restaurant%20interior%20with%20warm%20lighting%20and%20elegant%20dining%20atmosphere%2C%20professional%20food%20photography%20style%2C%20clean%20and%20inviting%20ambiance&width=800&height=400&seq=restaurant-${restaurant.id}&orientation=landscape`}
              alt={restaurant.name}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            
            <div className="absolute top-4 right-4">
              <button
                onClick={() => toggleFavorite(restaurant.id, 'restaurant')}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
              >
                <i className={`ri-heart-${isFavorite(restaurant.id, 'restaurant') ? 'fill text-red-500' : 'line text-gray-600'} w-5 h-5`}></i>
              </button>
            </div>
          </div>

          {/* Restaurant Info */}
          <div className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
                  <p className="text-gray-600 mb-4">{restaurant.description || 'Un restaurant qui propose des plats délicieux'}</p>
                  
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <RatingStars 
                        rating={averageRating} 
                        readonly 
                        showCount 
                        count={totalReviews}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <i className="ri-time-line w-4 h-4"></i>
                      <span>{restaurant.delivery_time || '30-45 min'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <i className="ri-truck-line w-4 h-4"></i>
                      <span>{restaurant.delivery_fee || 15} DH</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      restaurant.status === 'closed' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {restaurant.status === 'closed' ? 'Fermé' : 'Ouvert'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRateClick('restaurant', restaurant.id, restaurant.name)}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-star-line w-4 h-4 ml-2"></i>
                  Évaluer le restaurant
                </button>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Produits</h2>
            
            {products.length === 0 ? (
              <div className="text-center py-12">
                <i className="ri-restaurant-line text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-600">Aucun produit disponible pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={product.image_url || `https://readdy.ai/api/search-image?query=delicious%20$%7Bproduct.name%7D%20food%20dish%20on%20white%20plate%2C%20professional%20food%20photography%2C%20appetizing%20presentation%20with%20garnish%2C%20restaurant%20quality%20meal&width=400&height=300&seq=product-${product.id}&orientation=landscape`}
                        alt={product.name}
                        className="w-full h-48 object-cover object-top"
                      />
                      <button
                        onClick={() => toggleFavorite(product.id, 'product')}
                        className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                      >
                        <i className={`ri-heart-${isFavorite(product.id, 'product') ? 'fill text-red-500' : 'line text-gray-600'} w-4 h-4`}></i>
                      </button>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description || 'Délicieux produit'}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl font-bold text-orange-600">{product.price} DH</span>
                        <div className="flex items-center gap-2">
                          {productRatings[product.id]?.count ? (
                            <RatingStars
                              rating={productRatings[product.id].average}
                              readonly
                              size="sm"
                              showCount
                              count={productRatings[product.id].count}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">Aucun avis</span>
                          )}
                          <button
                            onClick={() => handleRateClick('product', product.id, product.name)}
                            className="text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
                          >
                            <i className="ri-star-line w-4 h-4"></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {cart[product.id] > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer"
                            >
                              <i className="ri-subtract-line w-4 h-4"></i>
                            </button>
                            <span className="font-medium">{cart[product.id]}</span>
                          </div>
                        )}
                        
                        <button
                          onClick={() => addToCart(product)}
                          className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {cart[product.id] > 0 ? 'Ajouter' : 'Ajouter au panier'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Avis et évaluations</h2>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{averageRating.toFixed(1)}</div>
                      <RatingStars rating={averageRating} readonly />
                    </div>
                    <div>
                      <p className="text-gray-600">Note moyenne</p>
                      <p className="text-sm text-gray-500">{totalReviews} avis</p>
                    </div>
                  </div>
                </div>
              </div>

              <ReviewsList reviews={reviews} loading={reviewsLoading} />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setRatingTarget(null);
        }}
        onSubmit={handleSubmitRating}
        title={ratingTarget?.type === 'restaurant' ? 'Évaluer le restaurant' : 'Évaluer le produit'}
        itemName={ratingTarget?.name || ''}
      />
    </div>
  );
}
