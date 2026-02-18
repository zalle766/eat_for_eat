import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <div 
      className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://readdy.ai/api/search-image?query=Modern%20food%20delivery%20service%20with%20fresh%20ingredients%2C%20professional%20kitchen%20background%2C%20warm%20lighting%2C%20appetizing%20dishes%2C%20clean%20and%20inviting%20restaurant%20atmosphere%2C%20high%20quality%20food%20photography&width=1920&height=1080&seq=hero-bg-001&orientation=landscape')`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Livraison rapide et délicieuse
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Découvrez les meilleurs restaurants de votre ville et faites-vous livrer vos plats préférés en quelques minutes
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 flex-wrap">
            <button 
              onClick={() => navigate('/restaurants')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Commander maintenant
            </button>
            <button 
              onClick={() => navigate('/restaurant-signup')}
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-full text-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Rejoindre comme restaurant
            </button>
            <button 
              onClick={() => navigate('/driver-signup')}
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-full text-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Rejoindre comme livreur
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <i className="ri-time-line text-xl text-white"></i>
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg">Livraison rapide</div>
                <div className="text-gray-200">En 30 minutes</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <i className="ri-restaurant-line text-xl text-white"></i>
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg">Restaurants de qualité</div>
                <div className="text-gray-200">Sélectionnés avec soin</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <i className="ri-shield-check-line text-xl text-white"></i>
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg">Paiement sécurisé</div>
                <div className="text-gray-200">100% protégé</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
