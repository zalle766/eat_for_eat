import { useState, useEffect } from 'react';
import { supabase, type Product, type Restaurant } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface NearbyProductsProps {
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

export default function NearbyProducts({ userLocation }: NearbyProductsProps) {
  const [products, setProducts] = useState<(Product & { restaurant: Restaurant, distance: number })[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<(Product & { restaurant: Restaurant, distance: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    loadFavorites();
  }, [userLocation]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products.slice(0, 8));
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

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
    return favorites.some(fav => fav.id === id && fav.type === 'product');
  };

  const toggleFavorite = (product: Product & { restaurant: Restaurant, distance: number }, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const favoriteItem: FavoriteItem = {
      id: product.id,
      type: 'product',
      name: product.name,
      description: product.description,
      image: product.image_url,
      rating: product.restaurant.rating,
      price: product.price,
      addedAt: new Date().toISOString()
    };

    let updatedFavorites: FavoriteItem[];
    
    if (isFavorite(product.id)) {
      updatedFavorites = favorites.filter(fav => !(fav.id === product.id && fav.type === 'product'));
    } else {
      updatedFavorites = [...favorites, favoriteItem];
    }

    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true);

      if (productsError) throw productsError;

      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*');

      if (restaurantsError) throw restaurantsError;

      const productsWithRestaurants = (productsData || []).map(product => {
        const restaurant = restaurantsData?.find(r => r.id === product.restaurant_id);
        if (!restaurant) return null;

        const distance = userLocation 
          ? calculateDistance(userLocation.lat, userLocation.lng, restaurant.latitude, restaurant.longitude)
          : 0;

        return {
          ...product,
          restaurant,
          distance
        };
      }).filter(Boolean) as (Product & { restaurant: Restaurant, distance: number })[];

      const sortedProducts = productsWithRestaurants.sort((a, b) => {
        if (userLocation) {
          return a.distance - b.distance;
        }
        return b.restaurant.rating - a.restaurant.rating;
      });

      setProducts(sortedProducts);
      setFilteredProducts(sortedProducts.slice(0, 8));
    } catch (error) {
      console.error('Error fetching products:', error);
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

  const handleProductClick = (restaurantId: string) => {
    navigate(`/restaurant?id=${restaurantId}`);
  };

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Produits près de chez vous</h2>
              <p className="text-gray-600">Découvrez les plats les plus délicieux des restaurants proches</p>
            </div>
          </div>
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
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Produits près de chez vous</h2>
            <p className="text-gray-600">Découvrez les plats les plus délicieux des restaurants proches</p>
          </div>
          
          {/* Search Bar */}
          <div className="w-full lg:w-96">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit ou restaurant..."
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
              <i className="ri-search-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"></i>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <i className="ri-search-line text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-medium text-gray-600 mb-2">Aucun résultat</h3>
            <p className="text-gray-500">Nous n'avons trouvé aucun produit correspondant à votre recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.REACT_APP_NAVIGATE(`/product?id=${product.id}`)}
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={product.image_url || `https://readdy.ai/api/search-image?query=delicious%20$%7Bproduct.name%7D%20food%20dish%20on%20white%20plate%2C%20professional%20food%20photography%2C%20appetizing%20presentation%20with%20garnish%2C%20restaurant%20quality%20meal&width=400&height=300&seq=product-${product.id}&orientation=landscape`} 
                    alt={product.name}
                    className="w-full h-48 object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => toggleFavorite(product, e)}
                    className="absolute top-3 left-3 w-10 h-10 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer z-10"
                  >
                    <i className={`${isFavorite(product.id) ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-600'} text-xl`}></i>
                  </button>
                  {userLocation && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
                      <i className="ri-map-pin-line text-teal-600"></i>
                      {product.distance.toFixed(1)} km
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <i className="ri-store-2-line text-gray-400 text-sm"></i>
                    <span className="text-xs text-gray-500">{product.restaurant.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-teal-600">{product.price} DH</span>
                    <div className="flex items-center gap-1">
                      <i className="ri-star-fill text-yellow-400 text-sm"></i>
                      <span className="text-sm font-medium text-gray-700">{product.restaurant.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
