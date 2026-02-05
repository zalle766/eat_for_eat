import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import RatingStars from '../../components/feature/RatingStars';
import RatingModal from '../../components/feature/RatingModal';
import ReviewsList from '../../components/feature/ReviewsList';
import { supabase } from '../../lib/supabase';

interface FavoriteItem {
  id: string;
  type: 'restaurant' | 'product';
}

export default function ProductPage() {
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
      const { headers } = await getRatingsHeaders();
      const params = new URLSearchParams();
      params.append('product_id', productId);

      const response = await fetch(`${ratingsFunctionUrl}?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('فشل تحميل التقييمات');
      }

      const data = await response.json();
      const average = typeof data.average_rating === 'number' ? data.average_rating : 0;
      setReviews(data.ratings || []);
      setAverageRating(Number(average.toFixed(1)));
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
        const errorMessage = errorData.error || 'حدث خطأ في إضافة التقييم';
        console.error('خطأ من الخادم:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        // إعادة تحميل التقييمات بعد الحفظ
        await loadReviews(id);
        setShowRatingModal(false);
        alert('تم حفظ التقييم بنجاح!');
      } else {
        throw new Error(result.error || 'فشل إضافة التقييم');
      }
    } catch (error) {
      if ((error as Error).message === 'AUTH_REQUIRED') {
        alert('يجب تسجيل الدخول لإضافة تقييم');
        setShowRatingModal(false);
      } else {
        const errorMessage = (error as Error).message || 'حدث خطأ في إضافة التقييم';
        console.error('خطأ في إضافة التقييم:', error);
        alert(errorMessage);
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
            <p className="text-gray-600">جاري تحميل بيانات المنتج...</p>
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
            <p className="text-gray-600">المنتج غير موجود</p>
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Product Details */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Product Image */}
              <div className="relative">
                <img
                  src={product.image_url || `https://readdy.ai/api/search-image?query=delicious%20$%7Bproduct.name%7D%20food%20dish%20on%20white%20plate%2C%20professional%20food%20photography%2C%20appetizing%20presentation%20with%20garnish%2C%20restaurant%20quality%20meal&width=600&height=600&seq=product-detail-${product.id}&orientation=squarish`}
                  alt={product.name}
                  className="w-full h-96 lg:h-full object-cover object-top"
                />
                <button
                  onClick={() => toggleFavorite(product.id, 'product')}
                  className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                >
                  <i className={`ri-heart-${isFavorite(product.id, 'product') ? 'fill text-red-500' : 'line text-gray-600'} w-6 h-6`}></i>
                </button>
              </div>

              {/* Product Info */}
              <div className="p-6 lg:p-8">
                <div className="mb-4">
                  <button
                    onClick={() => window.REACT_APP_NAVIGATE(`/restaurant?id=${restaurant?.id}`)}
                    className="text-orange-500 hover:text-orange-600 text-sm font-medium cursor-pointer"
                  >
                    {restaurant?.name}
                  </button>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                
                <div className="flex items-center gap-4 mb-6">
                  <RatingStars 
                    rating={averageRating} 
                    readonly 
                    showCount 
                    count={totalReviews}
                  />
                  <button
                    onClick={handleRateClick}
                    className="text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
                  >
                    <i className="ri-star-line w-4 h-4 ml-1"></i>
                    قيم المنتج
                  </button>
                </div>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {product.description || 'منتج لذيذ ومميز من مطعمنا الرائع'}
                </p>

                <div className="text-3xl font-bold text-orange-600 mb-8">
                  {product.price} DH
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-gray-700 font-medium">الكمية:</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(quantity - 1)}
                      className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer"
                    >
                      <i className="ri-subtract-line w-4 h-4"></i>
                    </button>
                    <span className="text-xl font-medium w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(quantity + 1)}
                      className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer"
                    >
                      <i className="ri-add-line w-4 h-4"></i>
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={addToCart}
                  className="w-full bg-orange-500 text-white py-4 rounded-lg text-lg font-semibold hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-shopping-cart-line w-5 h-5 ml-2"></i>
                  إضافة للسلة ({quantity} × {product.price} = {quantity * product.price} DH)
                </button>

                {/* Current Cart Count */}
                {cart[product.id] > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-green-800 text-sm">
                      <i className="ri-check-line w-4 h-4 ml-1"></i>
                      يوجد {cart[product.id]} من هذا المنتج في السلة
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">التقييمات والمراجعات</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{averageRating.toFixed(1)}</div>
                    <RatingStars rating={averageRating} readonly />
                  </div>
                  <div>
                    <p className="text-gray-600">متوسط التقييم</p>
                    <p className="text-sm text-gray-500">{totalReviews} تقييم</p>
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
        title="تقييم المنتج"
        itemName={product?.name || ''}
      />
    </div>
  );
}
