
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import { formatCurrency } from '../../lib/currency';

const offers = [
  {
    id: 1,
    title: '50% de réduction sur la première commande',
    description: 'Obtenez 50% de réduction sur votre première commande de n\'importe quel restaurant',
    discount: '50%',
    code: 'FIRST50',
    validUntil: '2024-12-31',
    image: 'https://readdy.ai/api/search-image?query=Food%20delivery%20discount%20offer%20banner%20with%2050%25%20off%20text%2C%20colorful%20design%2C%20appetizing%20food%20items%2C%20promotional%20style%2C%20modern%20graphics&width=400&height=200&seq=offer-1&orientation=landscape',
    minOrder: 50,
    restaurants: 'Tous les restaurants'
  },
  {
    id: 2,
    title: `Livraison gratuite pour les commandes de plus de ${formatCurrency(100)}`,
    description: `Profitez de la livraison gratuite pour une commande de ${formatCurrency(100)} ou plus`,
    discount: 'Livraison gratuite',
    code: 'FREE100',
    validUntil: '2024-12-25',
    image: 'https://readdy.ai/api/search-image?query=Free%20delivery%20promotion%20banner%20with%20delivery%20truck%20icon%2C%20green%20colors%2C%20food%20packages%2C%20promotional%20design%2C%20modern%20style&width=400&height=200&seq=offer-2&orientation=landscape',
    minOrder: 100,
    restaurants: 'Restaurants sélectionnés'
  },
  {
    id: 3,
    title: 'Offre spéciale pizza',
    description: 'Commandez une pizza et obtenez la deuxième gratuitement',
    discount: '1+1',
    code: 'PIZZA2',
    validUntil: '2024-12-20',
    image: 'https://readdy.ai/api/search-image?query=Pizza%20special%20offer%20banner%20with%20two%20pizzas%2C%20Italian%20style%2C%20cheese%20melting%2C%20promotional%20design%2C%20appetizing%20presentation&width=400&height=200&seq=offer-3&orientation=landscape',
    minOrder: 0,
    restaurants: 'Pizzerias'
  },
  {
    id: 4,
    title: '30% de réduction sur les repas sains',
    description: 'Réduction spéciale sur tous les repas sains et salades',
    discount: '30%',
    code: 'HEALTHY30',
    validUntil: '2024-12-28',
    image: 'https://readdy.ai/api/search-image?query=Healthy%20food%20discount%20banner%20with%20fresh%20salads%2C%20vegetables%2C%20clean%20eating%20concept%2C%20green%20colors%2C%20promotional%20style&width=400&height=200&seq=offer-4&orientation=landscape',
    minOrder: 40,
    restaurants: 'Restaurants sains'
  },
  {
    id: 5,
    title: 'Offre week-end',
    description: '25% de réduction sur toutes les commandes le week-end',
    discount: '25%',
    code: 'WEEKEND25',
    validUntil: '2024-12-22',
    image: 'https://readdy.ai/api/search-image?query=Weekend%20special%20offer%20banner%20with%20family%20dining%2C%20various%20cuisines%2C%20festive%20colors%2C%20promotional%20design%2C%20appetizing%20food%20spread&width=400&height=200&seq=offer-5&orientation=landscape',
    minOrder: 60,
    restaurants: 'Tous les restaurants'
  },
  {
    id: 6,
    title: 'Offre spéciale desserts',
    description: '40% de réduction sur tous les types de desserts et gâteaux',
    discount: '40%',
    code: 'SWEET40',
    validUntil: '2024-12-30',
    image: 'https://readdy.ai/api/search-image?query=Desserts%20special%20offer%20banner%20with%20cakes%2C%20sweets%2C%20colorful%20pastries%2C%20promotional%20design%2C%20appetizing%20dessert%20display&width=400&height=200&seq=offer-6&orientation=landscape',
    minOrder: 30,
    restaurants: 'Pâtisseries'
  }
];

export default function OffersPage() {
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // Peut ajouter une notification ici
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Offres spéciales</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez les meilleures offres et réductions sur votre nourriture préférée
          </p>
        </div>

        {/* Featured Offer */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white mb-12">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-6 lg:mb-0">
              <h2 className="text-3xl font-bold mb-4">Offre limitée !</h2>
              <p className="text-xl mb-6">50% de réduction sur votre première commande + livraison gratuite</p>
              <div className="flex items-center gap-4">
                <span className="bg-white text-orange-500 px-4 py-2 rounded-lg font-bold">
                  FIRST50
                </span>
                <button 
                  onClick={() => copyCode('FIRST50')}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Copier le code
                </button>
              </div>
            </div>
            <div className="lg:w-1/2 text-center">
              <div className="text-6xl font-bold mb-2">50%</div>
              <div className="text-xl">de réduction</div>
            </div>
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img 
                  src={offer.image} 
                  alt={offer.title}
                  className="w-full h-48 object-cover"
                />
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
                    <span className="font-medium">{offer.minOrder > 0 ? formatCurrency(offer.minOrder) : 'Aucun minimum'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Restaurants :</span>
                    <span className="font-medium">{offer.restaurants}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Valable jusqu\'au :</span>
                    <span className="font-medium">{offer.validUntil}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-lg p-3 text-center">
                    <span className="font-mono font-bold text-gray-800">{offer.code}</span>
                  </div>
                  <button 
                    onClick={() => copyCode(offer.code)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-file-copy-line"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How to Use */}
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
