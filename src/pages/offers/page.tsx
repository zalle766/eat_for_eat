import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import { useToast } from '../../context/ToastContext';
import Footer from '../../components/feature/Footer';
import { formatCurrency } from '../../lib/currency';
import { supabase } from '../../lib/supabase';

interface Offer {
  id: string;
  restaurant_id: string;
  title: string;
  description: string;
  discount: string;
  code: string;
  valid_until: string;
  image_url: string;
  min_order: number;
  is_active: boolean;
  restaurants?: { name: string };
}

export default function OffersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          restaurants(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validOffers = (data || []).filter((o: Offer) => {
        if (!o.valid_until) return true;
        return new Date(o.valid_until) >= new Date();
      });

      setOffers(validOffers);
    } catch (error) {
      console.error('Erreur chargement offres:', error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié !');
  };

  const featuredOffer = offers[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Offres spéciales</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez les meilleures offres et réductions sur votre nourriture préférée
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-coupon-line text-5xl text-orange-400"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucune offre pour le moment</h2>
            <p className="text-gray-600 mb-6">Les restaurants ajoutent leurs offres régulièrement. Revenez bientôt !</p>
            <button
              onClick={() => navigate('/restaurants')}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer"
            >
              Voir les restaurants
            </button>
          </div>
        ) : (
          <>
            {featuredOffer && (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white mb-12">
                <div className="flex flex-col lg:flex-row items-center justify-between">
                  <div className="lg:w-1/2 mb-6 lg:mb-0">
                    <h2 className="text-3xl font-bold mb-4">{featuredOffer.title}</h2>
                    <p className="text-xl mb-6">{featuredOffer.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="bg-white text-orange-500 px-4 py-2 rounded-lg font-bold">
                        {featuredOffer.code}
                      </span>
                      <button 
                        onClick={() => copyCode(featuredOffer.code)}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Copier le code
                      </button>
                    </div>
                  </div>
                  <div className="lg:w-1/2 text-center">
                    <div className="text-6xl font-bold mb-2">{featuredOffer.discount}</div>
                    <div className="text-xl">de réduction</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {offers.map((offer) => (
                <div 
                  key={offer.id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => offer.restaurant_id && navigate(`/restaurant?id=${offer.restaurant_id}`)}
                >
                  <div className="relative">
                    {offer.image_url ? (
                      <img 
                        src={offer.image_url} 
                        alt={offer.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                        <i className="ri-coupon-line text-6xl text-orange-400"></i>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full font-bold">
                      {offer.discount}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{offer.title}</h3>
                    <p className="text-gray-600 mb-4">{offer.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Minimum :</span>
                        <span className="font-medium">
                          {offer.min_order > 0 ? formatCurrency(offer.min_order) : 'Aucun minimum'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Restaurant :</span>
                        <span className="font-medium">{offer.restaurants?.name || '-'}</span>
                      </div>
                      {offer.valid_until && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Valable jusqu'au :</span>
                          <span className="font-medium">
                            {new Date(offer.valid_until).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-lg p-3 text-center">
                        <span className="font-mono font-bold text-gray-800">{offer.code}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCode(offer.code);
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-file-copy-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>

        )}

        <div className="bg-white rounded-xl p-8 mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Comment utiliser les offres</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-file-copy-line text-2xl text-orange-500"></i>
              </div>
              <h3 className="font-semibold mb-2">Copiez le code</h3>
              <p className="text-gray-600 text-sm">Copiez le code de réduction de l'offre souhaitée</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-shopping-cart-line text-2xl text-orange-500"></i>
              </div>
              <h3 className="font-semibold mb-2">Commandez votre repas</h3>
              <p className="text-gray-600 text-sm">Choisissez votre restaurant préféré et ajoutez la nourriture au panier</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-discount-percent-line text-2xl text-orange-500"></i>
              </div>
              <h3 className="font-semibold mb-2">Appliquez le code</h3>
              <p className="text-gray-600 text-sm">Collez le code lors du paiement et profitez de la réduction</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
