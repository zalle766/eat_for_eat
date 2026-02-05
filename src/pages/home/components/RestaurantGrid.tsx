
import { useState, useEffect } from 'react';
import { supabase, type Restaurant } from '../../../lib/supabase';
import RestaurantCard from './RestaurantCard';

interface RestaurantGridProps {
  userLocation: {lat: number, lng: number} | null;
  searchQuery: string;
  selectedCategory: string;
}

export default function RestaurantGrid({ userLocation, searchQuery, selectedCategory }: RestaurantGridProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter and sort restaurants
  const filteredRestaurants = restaurants
    .filter(restaurant => {
      // Filter by search query
      if (searchQuery && !restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !restaurant.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter by category
      if (selectedCategory !== 'all' && restaurant.cuisine_type !== selectedCategory) {
        return false;
      }
      
      return true;
    })
    .map(restaurant => ({
      ...restaurant,
      distance: userLocation 
        ? calculateDistance(userLocation.lat, userLocation.lng, restaurant.latitude, restaurant.longitude)
        : 0
    }))
    .sort((a, b) => {
      if (userLocation) {
        return a.distance - b.distance; // Sort by distance if location available
      }
      return b.rating - a.rating; // Otherwise sort by rating
    });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-gray-200"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
              <div className="flex justify-between items-center">
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredRestaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="ri-restaurant-line text-6xl text-gray-300 mb-4"></i>
        <h3 className="text-xl font-medium text-gray-600 mb-2">لا توجد مطاعم</h3>
        <p className="text-gray-500">
          {searchQuery || selectedCategory !== 'all' 
            ? 'لم نجد مطاعم تطابق البحث الخاص بك'
            : 'لا توجد مطاعم متاحة حالياً'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredRestaurants.map((restaurant) => (
        <RestaurantCard 
          key={restaurant.id} 
          restaurant={restaurant}
          distance={userLocation ? restaurant.distance : undefined}
        />
      ))}
    </div>
  );
}
