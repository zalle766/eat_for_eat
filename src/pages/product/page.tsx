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

export default function ProductPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [product, setProduct] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

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
  const loadProductData = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // تحميل بيانات المنتج
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*, restaurants(*)')
        .eq('id', id)
        .single();

      if (productError) {
        console.error('خطأ في تحميل بيانات المنتج:', productError);
        setProduct(null);
        return;
      }

      setProduct(productData);
      setRestaurant(productData.restaurants);

    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProductData();
      loadFavorites();
      loadCart();
      // تحميل التقييمات مباشرة
      loadReviews(id);
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
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const isFavorite = (id: string, type: 'restaurant' | 'product') => {
    return favorites.some(fav => fav.id === id && fav.type === type);
  };

  const toggleFavorite = (itemId: string, type: 'restaurant' | 'product' = 'product') => {
    let updatedFavorites: FavoriteItem[];
    
    if (isFavorite(itemId, type)) {
      updatedFavorites = favorites.filter(fav => !(fav.id === itemId && fav.type === type));
    } else {
      updatedFavorites = [...favorites, { id: itemId, type }];
    }

    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const loadReviews = async (productId: string) => {
    setReviewsLoading(true);
    try {
      const { data: ratings, error } = await supabase.rpc('get_ratings_with_names', {
        p_restaurant_id: null,
        p_product_id: productId,
      });

      if (error) throw error;

      const ratingsList = Array.isArray(ratings) ? ratings : [];
      const validRatings = ratingsList.filter((r: any) => r.rating != null && r.rating > 0);
      const average = validRatings.length > 0
        ? validRatings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / validRatings.length
        : 0;

      setReviews(ratingsList);
      setAverageRating(Number(average.toFixed(1)));
      setTotalReviews(ratingsList.length);
    } catch (error) {
      console.error('خطأ في تحميل التقييمات:', error);
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleRateClick = () => {
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!id) return;

    try {
      const { headers } = await getRatingsHeaders(true);

      const response = await fetch(ratingsFunctionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product_id: id,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Erreur lors de l\'ajout de l\'avis';
        console.error('Erreur du serveur:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        // إعادة تحميل التقييمات بعد الحفظ
        await loadReviews(id);
        setShowRatingModal(false);
        toast.success('Avis enregistré avec succès !');
      } else {
        throw new Error(result.error || 'Échec de l\'ajout de l\'avis');
      }
    } catch (error) {
      if ((error as Error).message === 'AUTH_REQUIRED') {
        toast.warning('Veuillez vous connecter pour ajouter un avis');
        setShowRatingModal(false);
      } else {
        const errorMessage = (error as Error).message || 'Erreur lors de l\'ajout de l\'avis';
        console.error('Erreur lors de l\'ajout de l\'avis:', error);
        toast.error(errorMessage);
        // لا نغلق المودال عند حدوث خطأ حتى يتمكن المستخدم من المحاولة مرة أخرى
        throw error;
      }
    }
  };

  const addToCart = () => {
    if (!product) return;
    
    const newCart = {
      ...cart,
      [product.id]: (cart[product.id] || 0) + quantity
    };
    setCart(newCart);
    saveCart(newCart);
    setQuantity(1);
  };

  const updateQuantity = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-orange-500 animate-spin mb-4"></i>
            <p className="text-gray-600">Chargement du produit...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="ri-product-hunt-line text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">Produit introuvable</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-gray-50">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Product Details */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md lg:shadow-xl overflow-hidden border border-orange-50">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 lg:gap-10 items-stretch">
              {/* Product Image */}
              <div className="relative lg:flex lg:items-center lg:justify-center lg:p-4">
                <img
                  src={product.image_url || `https://readdy.ai/api/search-image?query=delicious%20$%7Bproduct.name%7D%20food%20dish%20on%20white%20plate%2C%20professional%20food%20photography%2C%20appetizing%20presentation%20with%20garnish%2C%20restaurant%20quality%20meal&width=600&height=600&seq=product-detail-${product.id}&orientation=squarish`}
                  alt={product.name}
                  className="w-full h-80 sm:h-96 lg:h-auto lg:max-h-[460px] object-cover object-center rounded-b-2xl lg:rounded-2xl"
                />
                <button
                  onClick={() => toggleFavorite(product.id, 'product')}
                  className="absolute top-4 right-4 w-11 h-11 sm:w-12 sm:h-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                >
                  <i className={`ri-heart-${isFavorite(product.id, 'product') ? 'fill text-red-500' : 'line text-gray-600'} w-6 h-6`}></i>
                </button>
              </div>

              {/* Product Info */}
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <button
                      onClick={() => window.REACT_APP_NAVIGATE(`/restaurant?id=${restaurant?.id}`)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs sm:text-sm font-semibold tracking-wide uppercase cursor-pointer"
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                      {restaurant?.name}
                    </button>
                    {product.category && (
                      <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 text-xs font-medium">
                        {product.category}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3 sm:mb-4 leading-tight">
                    {product.name}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <RatingStars 
                        rating={averageRating} 
                        readonly 
                        showCount 
                        count={totalReviews}
                      />
                      <span className="text-xs sm:text-sm text-gray-500">
                        ({totalReviews} avis)
                      </span>
                    </div>
                    <button
                      onClick={handleRateClick}
                      className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      <i className="ri-star-line w-4 h-4 ml-1"></i>
                      Évaluer le produit
                    </button>
                  </div>

                  <p className="text-gray-600 mb-6 leading-relaxed text-sm sm:text-base">
                    {product.description || 'Délicieux produit de notre restaurant, préparé avec des ingrédients frais et une présentation soignée.'}
                  </p>

                  <div className="flex items-baseline gap-3 mb-8">
                    <div className="text-3xl sm:text-4xl font-extrabold text-orange-600">
                      {product.price} DH
                    </div>
                    {product.old_price && product.old_price > product.price && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 line-through">
                          {product.old_price} DH
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs font-semibold">
                          -{Math.round(((product.old_price - product.price) / product.old_price) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quantity + Add to Cart */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4">
                      <span className="text-gray-700 font-medium text-sm sm:text-base">Quantité :</span>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1.5">
                        <button
                          onClick={() => updateQuantity(quantity - 1)}
                          className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
                        >
                          <i className="ri-subtract-line w-4 h-4"></i>
                        </button>
                        <span className="text-lg sm:text-xl font-semibold w-10 text-center">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(quantity + 1)}
                          className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
                        >
                          <i className="ri-add-line w-4 h-4"></i>
                        </button>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={addToCart}
                      className="w-full sm:flex-1 bg-orange-500 text-white py-3.5 sm:py-4 rounded-full text-sm sm:text-lg font-semibold hover:bg-orange-600 shadow-md hover:shadow-lg transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                    >
                      <i className="ri-shopping-cart-line w-5 h-5 ml-1"></i>
                      Ajouter au panier ({quantity} × {product.price} = {quantity * product.price} DH)
                    </button>
                  </div>

                  {/* Current Cart Count */}
                  {cart[product.id] > 0 && (
                    <div className="mt-3 sm:mt-4 p-3.5 bg-green-50 border border-green-100 rounded-xl">
                      <p className="text-green-800 text-xs sm:text-sm">
                        <i className="ri-check-line w-4 h-4 ml-1"></i>
                        {cart[product.id]} article(s) de ce produit dans le panier
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
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
      </main>

      <Footer />

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        title="Évaluer le produit"
        itemName={product?.name || ''}
      />
    </div>
  );
}
