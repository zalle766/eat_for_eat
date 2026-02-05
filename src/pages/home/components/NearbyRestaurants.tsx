
import { useState, useEffect } from 'react';
import { supabase, type Restaurant } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../lib/currency';

interface NearbyRestaurantsProps {
  userLocation: {lat: number, lng: number} | null;
}

interface FavoriteItem {
  id: string;
  type: 'restaurant' | 'product';
  name: string;
  description: string;
  image: string;
  rating: number;
  price?: number;
  deliveryTime?: string;
  deliveryFee?: number;
  addedAt: string;
}

export default function NearbyRestaurants({ userLocation }: NearbyRestaurantsProps) {
  const [restaurants, setRestaurants] = useState<(Restaurant & { distance: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
    loadFavorites();
  }, [userLocation]);

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

  const isFavorite = (id: string) => {
    return favorites.some(fav => fav.id === id && fav.type === 'restaurant');
  };

  const toggleFavorite = (restaurant: Restaurant & { distance: number }, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const favoriteItem: FavoriteItem = {
      id: restaurant.id,
      type: 'restaurant',
      name: restaurant.name,
      description: restaurant.cuisine_type,
      image: restaurant.image_url,
      rating: restaurant.rating,
      deliveryTime: restaurant.delivery_time,
      deliveryFee: restaurant.delivery_fee,
      addedAt: new Date().toISOString()
    };

    let updatedFavorites: FavoriteItem[];
    
    if (isFavorite(restaurant.id)) {
      updatedFavorites = favorites.filter(fav => !(fav.id === restaurant.id && fav.type === 'restaurant'));
    } else {
      updatedFavorites = [...favorites, favoriteItem];
    }

    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_open', true);

      if (error) throw error;

      const restaurantsWithDistance = (data || []).map(restaurant => {
        const distance = userLocation 
          ? calculateDistance(userLocation.lat, userLocation.lng, restaurant.latitude, restaurant.longitude)
          : 0;
        return { ...restaurant, distance };
      });

      const sortedRestaurants = restaurantsWithDistance.sort((a, b) => {
        if (userLocation) {
          return a.distance - b.distance;
        }
        return b.rating - a.rating;
      });

      setRestaurants(sortedRestaurants.slice(0, 8));
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleRestaurantClick = (restaurantId: string) => {
    navigate(`/restaurant?id=${restaurantId}`);
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Restaurants près de chez vous</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Restaurants près de chez vous</h2>
            <p className="text-gray-600">Découvrez les meilleurs restaurants de votre région</p>
          </div>
          <button
            onClick={() => navigate('/restaurants')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            Voir tout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {restaurants.map((restaurant) => (
            <div 
              key={restaurant.id} 
              onClick={() => handleRestaurantClick(restaurant.id)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer group"
            >
              <div className="relative overflow-hidden">
                <img 
                  src={restaurant.image_url} 
                  alt={restaurant.name}
                  className="w-full h-48 object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={(e) => toggleFavorite(restaurant, e)}
                  className="absolute top-3 left-3 w-10 h-10 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer z-10"
                >
                  <i className={`${isFavorite(restaurant.id) ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-600'} text-xl`}></i>
                </button>
                {userLocation && (
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
                    <i className="ri-map-pin-line text-orange-500"></i>
                    {restaurant.distance.toFixed(1)} km
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
                  <i className="ri-star-fill text-yellow-400"></i>
                  {restaurant.rating}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-orange-500 transition-colors">{restaurant.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{restaurant.cuisine_type}</p>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <i className="ri-time-line text-orange-500"></i>
                    <span>{restaurant.delivery_time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <i className="ri-e-bike-line text-orange-500"></i>
                    <span>{restaurant.delivery_fee === 0 ? 'Gratuit' : formatCurrency(restaurant.delivery_fee)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
