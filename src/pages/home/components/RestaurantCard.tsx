import { type Restaurant } from '../../../lib/supabase';

interface RestaurantCardProps {
  restaurant: Restaurant & { distance?: number };
  distance?: number;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => window.REACT_APP_NAVIGATE(`/restaurant?id=${restaurant.id}`)}
    >
      <div className="relative">
        <img
          src={restaurant.image_url || restaurant.image}
          alt={restaurant.name}
          className="w-full h-48 object-cover object-top"
        />
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            restaurant.is_open 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {restaurant.is_open ? 'مفتوح' : 'مغلق'}
          </span>
        </div>
        {restaurant.distance && (
          <div className="absolute top-3 left-3">
            <span className="bg-black/70 text-white px-2 py-1 rounded-full text-xs">
              {restaurant.distance.toFixed(1)} كم
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{restaurant.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{restaurant.cuisine_type}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <i className="ri-star-fill text-yellow-400"></i>
            <span className="font-medium">{restaurant.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <i className="ri-time-line"></i>
            <span>{restaurant.delivery_time}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <i className="ri-truck-line"></i>
            <span>{restaurant.delivery_fee} درهم</span>
          </div>
        </div>
        
        <div className="mt-3 flex items-center gap-1 text-gray-500 text-xs">
          <i className="ri-map-pin-line"></i>
          <span className="truncate">{restaurant.city}</span>
        </div>
      </div>
    </div>
  );
}
