import { useState } from 'react';
import { useToast } from '../../../context/ToastContext';

interface LocationInputProps {
  userLocation: {lat: number, lng: number} | null;
  isLoading: boolean;
  onLocationChange: (location: {lat: number, lng: number}) => void;
}

export default function LocationInput({ userLocation, isLoading, onLocationChange }: LocationInputProps) {
  const toast = useToast();
  const [manualLocation, setManualLocation] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true, // Précision maximale possible
        timeout: 30000, // Augmenter le temps pour une meilleure précision
        maximumAge: 0 // Ne pas utiliser les données mises en cache pour obtenir une localisation récente
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`Localisation déterminée: ${latitude}, ${longitude} - précision: ${accuracy} mètres`);
          
          onLocationChange({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Impossible d\'obtenir votre localisation actuelle';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission d\'accès à la localisation refusée. Veuillez autoriser l\'accès à la localisation dans les paramètres du navigateur';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Localisation actuellement indisponible. Assurez-vous que le GPS est activé';
              break;
            case error.TIMEOUT:
              errorMessage = 'Délai de localisation expiré. Veuillez réessayer';
              break;
          }
          
          toast.error(errorMessage);
        },
        options
      );
    } else {
      toast.error('Votre navigateur ne prend pas en charge la géolocalisation');
    }
  };

  const geocodeAddress = async (address: string) => {
    try {
      setIsGeocoding(true);
      
      // Recherche d'adresse en France avec Nominatim avec haute précision
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=fr&limit=5&addressdetails=1&accept-language=fr,en&extratags=1&namedetails=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Choisir le résultat le plus précis
        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
      }
      
      // Si cela ne fonctionne pas, essayer une recherche plus large en ajoutant "France"
      const fallbackResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', France')}&limit=3&addressdetails=1`
      );
      
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData && fallbackData.length > 0) {
        const result = fallbackData[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
      }
      
      // Dernière tentative avec un service différent
      const geocodeResponse = await fetch(
        `https://api.bigdatacloud.net/data/forward-geocode-client?query=${encodeURIComponent(address + ', France')}&localityLanguage=fr`
      );
      
      const geocodeData = await geocodeResponse.json();
      
      if (geocodeData && geocodeData.results && geocodeData.results.length > 0) {
        const result = geocodeData.results[0];
        return {
          lat: result.latitude,
          lng: result.longitude
        };
      }
      
      throw new Error('Localisation non trouvée');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleManualLocationSubmit = async () => {
    if (manualLocation.trim()) {
      try {
        const coordinates = await geocodeAddress(manualLocation.trim());
        onLocationChange(coordinates);
        setShowManualInput(false);
        setManualLocation('');
      } catch (error) {
        toast.error('Localisation saisie non trouvée. Veuillez vérifier l\'exactitude de l\'adresse ou essayer une adresse plus détaillée.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualLocationSubmit();
    }
  };

  return (
    <div className="flex-1 max-w-md">
      <div className="relative">
        <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-white">
          <i className="ri-map-pin-line text-orange-500 text-xl"></i>
          <div className="flex-1">
            {isLoading ? (
              <span className="text-gray-500">Localisation en cours avec haute précision...</span>
            ) : userLocation ? (
              <span className="text-gray-700">Votre localisation actuelle déterminée avec précision</span>
            ) : (
              <span className="text-gray-500">Localisation non déterminée</span>
            )}
          </div>
          <button
            onClick={handleGetCurrentLocation}
            className="text-orange-500 hover:text-orange-600 cursor-pointer"
            disabled={isLoading}
            title="Localiser avec haute précision"
          >
            <i className={`ri-crosshair-line text-xl ${isLoading ? 'animate-pulse' : ''}`}></i>
          </button>
        </div>
        
        {!showManualInput ? (
          <button
            onClick={() => setShowManualInput(true)}
            className="mt-2 text-sm text-orange-500 hover:text-orange-600 cursor-pointer"
          >
            Ou saisir votre localisation manuellement
          </button>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: Paris, Lyon, Marseille, Toulouse, Nice..."
              className="flex-1 p-2 border border-gray-300 rounded text-sm"
              disabled={isGeocoding}
            />
            <button
              onClick={handleManualLocationSubmit}
              disabled={isGeocoding || !manualLocation.trim()}
              className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeocoding ? (
                <i className="ri-loader-4-line animate-spin"></i>
              ) : (
                'Confirmer'
              )}
            </button>
            <button
              onClick={() => {
                setShowManualInput(false);
                setManualLocation('');
              }}
              className="text-gray-500 hover:text-gray-700 px-2 cursor-pointer"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
