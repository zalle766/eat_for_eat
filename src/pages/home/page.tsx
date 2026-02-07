
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import Hero from './components/Hero';
import LocationInput from './components/LocationInput';
import NearbyProducts from './components/NearbyProducts';
import NearbyRestaurants from './components/NearbyRestaurants';

export default function Home() {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const showRegisteredMessage = searchParams.get('registered') === '1';

  // إزالة معلمة registered من URL بعد عرض الرسالة
  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      const timer = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('registered');
        setSearchParams(params, { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    // Demander la géolocalisation de l'utilisateur avec haute précision
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true, // Précision maximale possible
        timeout: 30000, // Augmenter le temps pour une meilleure précision
        maximumAge: 0 // Ne pas utiliser les données mises en cache pour obtenir une localisation récente
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`Localisation déterminée sur la page d'accueil: ${latitude}, ${longitude} - précision: ${accuracy} mètres`);
          
          setUserLocation({
            lat: latitude,
            lng: longitude
          });
          setIsLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocationLoading(false);
          
          // Afficher un message d'erreur approprié à l'utilisateur
          let errorMessage = 'Échec de la localisation';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission d\'accès à la localisation refusée. Veuillez autoriser l\'accès à la localisation pour afficher les restaurants près de chez vous.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Localisation actuellement indisponible. Assurez-vous que le GPS est activé.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Délai de localisation expiré. Vous pouvez saisir votre localisation manuellement.';
              break;
          }
          
          // Peut afficher un message à l'utilisateur ici si nécessaire
          console.warn(errorMessage);
        },
        options
      );
    } else {
      console.warn('Votre navigateur ne prend pas en charge la géolocalisation');
      setIsLocationLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      {/* رسالة نجاح التسجيل */}
      {showRegisteredMessage && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-green-700">
            <i className="ri-check-circle-line text-xl"></i>
            <span className="font-medium">Compte créé avec succès ! Veuillez confirmer votre email via le lien envoyé.</span>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <Hero />
      
      {/* Location Input Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <LocationInput 
            userLocation={userLocation}
            isLoading={isLocationLoading}
            onLocationChange={setUserLocation}
          />
        </div>
      </div>

      {/* Nearby Products Section - في الأعلى */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Produits près de chez vous</h2>
          <i className="ri-restaurant-2-line text-3xl text-teal-600"></i>
        </div>
        <NearbyProducts userLocation={userLocation} />
      </div>

      {/* Nearby Restaurants Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Restaurants près de chez vous</h2>
          <i className="ri-store-2-line text-3xl text-teal-600"></i>
        </div>
        <NearbyRestaurants userLocation={userLocation} />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
