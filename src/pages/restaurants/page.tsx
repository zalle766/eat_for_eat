import { useState, useEffect, useMemo } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import RatingStars from '../../components/feature/RatingStars';
import RatingModal from '../../components/feature/RatingModal';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { calculateDistanceKm } from '../../lib/distance';

interface FavoriteItem {
  id: string;
  type: 'restaurant' | 'product';
}

export default function RestaurantsPage() {
  const toast = useToast();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{id: string, name: string} | null>(null);
  const [restaurantRatings, setRestaurantRatings] = useState<{[key: string]: {rating: number, count: number}}>({});
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // موقع المستخدم: من localStorage أولاً، ثم من الجيولوكيشن إن وُجد
  useEffect(() => {
    try {
      const saved = localStorage.getItem('userCoordinates');
      if (saved) {
        const coords = JSON.parse(saved);
        if (typeof coords?.latitude === 'number' && typeof coords?.longitude === 'number') {
          setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
          return;
        }
      }
    } catch (_) {}
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ latitude, longitude });
          try {
            localStorage.setItem('userCoordinates', JSON.stringify({ latitude, longitude }));
          } catch (_) {}
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    }
  }, []);

  // تحميل المطاعم من قاعدة البيانات
  const loadRestaurants = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('*');

      if (error) {
        console.error('خطأ في تحميل المطاعم:', error);
      } else {
        setRestaurants(data || []);
      }
    } catch (error) {
      console.error('خطأ في تحميل المطاعم:', error);
    } finally {
      setLoading(false);
    }
  };

  // ترتيب المطاعم: الأقرب أولاً (حسب المسافة من المستخدم)
  const sortedRestaurants = useMemo(() => {
    const list = [...restaurants];
    if (!userLocation) return list;
    const hasCoords = (r: any) =>
      typeof r.latitude === 'number' && typeof r.longitude === 'number' &&
      r.latitude !== 0 && r.longitude !== 0;
    list.sort((a, b) => {
      const distA = hasCoords(a)
        ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude)
        : Infinity;
      const distB = hasCoords(b)
        ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude)
        : Infinity;
      return distA - distB;
    });
    return list;
  }, [restaurants, userLocation]);

  useEffect(() => {
    loadRestaurants();
    loadFavorites();
  }, []);

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

  const loadRestaurantRatings = async () => {
    if (restaurants.length === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const ratingsEntries = await Promise.all(
        restaurants.map(async (restaurant) => {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/ratings?restaurant_id=${restaurant.id}`,
              { headers }
            );

            if (!response.ok) return null;

            const data = await response.json();
            return [
              restaurant.id,
              {
                rating: data.average_rating || 0,
                count: data.total_count || 0,
              },
            ] as const;
          } catch (error) {
            console.error(`خطأ في تحميل تقييمات المطعم ${restaurant.id}:`, error);
            return null;
          }
        })
      );

      const ratings = ratingsEntries.reduce<{ [key: string]: { rating: number; count: number } }>((acc, entry) => {
        if (entry) {
          acc[entry[0]] = entry[1];
        }
        return acc;
      }, {});

      setRestaurantRatings(ratings);
    } catch (error) {
      console.error('خطأ في تحميل التقييمات:', error);
    }
  };

  const handleRateClick = (restaurantId: string, restaurantName: string) => {
    setRatingTarget({ id: restaurantId, name: restaurantName });
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!ratingTarget) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.warning('Veuillez vous connecter pour ajouter un avis');
        setShowRatingModal(false);
        setRatingTarget(null);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurant_id: ratingTarget.id,
          rating,
          comment
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Erreur lors de l\'envoi de l\'avis';
        console.error('خطأ من الخادم:', errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        // إعادة تحميل التقييمات
        await loadRestaurantRatings();
        setShowRatingModal(false);
        setRatingTarget(null);
        toast.success('Avis enregistré avec succès !');
      } else {
        throw new Error(result.error || 'Échec de l\'envoi de l\'avis');
      }
    } catch (error) {
      console.error('خطأ في إرسال التقييم:', error);
      const errorMessage = (error as Error).message || 'Erreur lors de l\'envoi de l\'évaluation';
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (restaurants.length > 0) {
      loadRestaurantRatings();
    }
  }, [restaurants]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <div className="relative h-64 bg-gradient-to-r from-orange-500 to-red-500">
          <img
            src="https://readdy.ai/api/search-image?query=Modern%20restaurant%20interior%20with%20warm%20lighting%2C%20elegant%20dining%20tables%2C%20contemporary%20design%2C%20professional%20food%20service%20atmosphere%2C%20clean%20and%20inviting%20space%20with%20orange%20and%20red%20color%20accents&width=1200&height=400&seq=restaurants-hero&orientation=landscape"
            alt="Restaurants"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-4">Découvrez les meilleurs restaurants</h1>
              <p className="text-xl">Choisissez parmi une large sélection de restaurants</p>
            </div>
          </div>
        </div>

        {/* Restaurants Grid */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-restaurant-line text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600">Aucun restaurant disponible pour le moment</p>
            </div>
          ) : (
            <>
              {userLocation && (
                <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                  <i className="ri-map-pin-line text-orange-500"></i>
                  Classés par distance — les plus proches en premier
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedRestaurants.map((restaurant) => {
                const rating = restaurantRatings[restaurant.id];
                const hasCoords = userLocation && typeof restaurant.latitude === 'number' && typeof restaurant.longitude === 'number' && restaurant.latitude !== 0 && restaurant.longitude !== 0;
                const distanceKm = hasCoords && userLocation
                  ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, restaurant.latitude, restaurant.longitude)
                  : null;
                return (
                  <div key={restaurant.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={restaurant.image || restaurant.image_url || `https://readdy.ai/api/search-image?query=modern%20restaurant%20exterior%20with%20inviting%20entrance%2C%20professional%20photography%2C%20warm%20lighting%20and%20welcoming%20atmosphere%2C%20clean%20and%20elegant%20design&width=400&height=300&seq=restaurant-${restaurant.id}&orientation=landscape`}
                        alt={restaurant.name}
                        className="w-full h-48 object-cover object-top"
                      />
                      <button
                        onClick={() => toggleFavorite(restaurant.id, 'restaurant')}
                        className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                      >
                        <i className={`ri-heart-${isFavorite(restaurant.id, 'restaurant') ? 'fill text-red-500' : 'line text-gray-600'} w-4 h-4`}></i>
                      </button>
                      
                      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          restaurant.status === 'closed' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {restaurant.status === 'closed' ? 'Fermé' : 'Ouvert'}
                        </span>
                        {distanceKm != null && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                            <i className="ri-map-pin-line"></i>
                            {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 flex-1">{restaurant.name}</h3>
                        <button
                          onClick={() => handleRateClick(restaurant.id, restaurant.name)}
                          className="text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
                        >
                          <i className="ri-star-line w-4 h-4"></i>
                        </button>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{restaurant.description || 'Un restaurant qui propose des plats délicieux'}</p>
                      
                      {rating && (
                        <div className="mb-3">
                          <RatingStars 
                            rating={rating.rating} 
                            readonly 
                            size="sm"
                            showCount 
                            count={rating.count}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <i className="ri-time-line w-4 h-4"></i>
                          <span>{restaurant.delivery_time || '30-45 min'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <i className="ri-truck-line w-4 h-4"></i>
                          <span>{restaurant.delivery_fee || 15} DH</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => window.REACT_APP_NAVIGATE(`/restaurant?id=${restaurant.id}`)}
                        className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Voir le restaurant
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </>
          )}
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
        title="Évaluer le restaurant"
        itemName={ratingTarget?.name || ''}
      />
    </div>
  );
}
