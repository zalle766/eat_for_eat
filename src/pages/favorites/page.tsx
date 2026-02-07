import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';

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

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'restaurants' | 'products'>('all');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUser(user);
      loadFavorites();
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error);
      navigate('/auth');
    }
  };

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('favorites');
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavorites(parsedFavorites);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = (id: string) => {
    const updatedFavorites = favorites.filter(item => item.id !== id);
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const filteredFavorites = favorites.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'restaurants') return item.type === 'restaurant';
    if (activeTab === 'products') return item.type === 'product';
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des favoris...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Favoris</h1>
          <p className="text-gray-600">Vos restaurants et produits favoris</p>
        </div>

        {/* التبويبات */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tous ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`px-6 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'restaurants'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Restaurants ({favorites.filter(f => f.type === 'restaurant').length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Produits ({favorites.filter(f => f.type === 'product').length})
          </button>
        </div>

        {/* قائمة المفضلة */}
        {filteredFavorites.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <i className="ri-heart-line text-8xl text-gray-300"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-600 mb-4">Aucun favori</h2>
            <p className="text-gray-500 mb-8">
              {activeTab === 'all' && "Vous n'avez pas encore ajouté d'éléments aux favoris"}
              {activeTab === 'restaurants' && 'Aucun restaurant dans les favoris'}
              {activeTab === 'products' && 'Aucun produit dans les favoris'}
            </p>
            <button
              onClick={() => navigate('/restaurants')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Parcourir les restaurants
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => removeFavorite(item.id)}
                    className="absolute top-3 left-3 w-10 h-10 bg-white hover:bg-red-50 rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                  >
                    <i className="ri-heart-fill text-xl text-red-500"></i>
                  </button>
                  {item.type === 'restaurant' && (
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full shadow-lg">
                      <div className="flex items-center gap-1">
                        <i className="ri-star-fill text-yellow-500 text-sm"></i>
                        <span className="font-medium text-sm">{item.rating}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800 flex-1">{item.name}</h3>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      item.type === 'restaurant' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {item.type === 'restaurant' ? 'Restaurant' : 'Produit'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    {item.type === 'restaurant' ? (
                      <>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <i className="ri-time-line text-orange-500"></i>
                          <span>{item.deliveryTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <i className="ri-e-bike-line text-orange-500"></i>
                          <span>{item.deliveryFee === 0 ? 'Gratuit' : `${item.deliveryFee} DH`}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <i className="ri-star-fill text-yellow-500 text-sm"></i>
                          <span className="font-medium text-sm">{item.rating}</span>
                        </div>
                        <div className="text-lg font-bold text-orange-600">{item.price} DH</div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (item.type === 'restaurant') {
                        navigate('/restaurant');
                      } else {
                        navigate('/restaurant');
                      }
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    <i className={item.type === 'restaurant' ? 'ri-restaurant-line' : 'ri-shopping-cart-line'}></i>
                    <span>{item.type === 'restaurant' ? 'Visiter le restaurant' : 'Ajouter au panier'}</span>
                  </button>
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    <i className="ri-calendar-line ml-1"></i>
                    Ajouté le {new Date(item.addedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
