import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import PhoneInput from '../../../components/ui/PhoneInput';

interface DriverProfileProps {
  driver: any;
  setDriver: (driver: any) => void;
}

export default function DriverProfile({ driver, setDriver }: DriverProfileProps) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: driver.name,
    phone: driver.phone,
    city: driver.city,
    vehicle_type: driver.vehicle_type,
    license_plate: driver.license_plate
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('drivers')
        .update(formData)
        .eq('id', driver.id);

      if (error) throw error;

      setDriver({ ...driver, ...formData });
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error('Une erreur s\'est produite lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-w-0 w-full">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Mon profil</h2>
        <p className="text-sm sm:text-base text-gray-600">Gérez vos informations personnelles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 min-w-0">
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">
                  {driver.name.charAt(0)}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{driver.name}</h3>
              <p className="text-gray-600 mb-4">{driver.phone}</p>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <i className="ri-star-fill text-yellow-500"></i>
                <span className="text-2xl font-bold text-gray-900">{driver.rating.toFixed(1)}</span>
              </div>

              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                driver.status === 'approved' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  driver.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {driver.status === 'approved' ? 'Compte actif' : 'En cours de vérification'}
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total des livraisons</span>
                <span className="font-semibold text-gray-900">{driver.total_deliveries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Livraisons terminées</span>
                <span className="font-semibold text-gray-900">{driver.completed_deliveries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Revenus totaux</span>
                <span className="font-semibold text-green-600">{driver.total_earnings.toFixed(2)} DH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-edit-line"></i>
                  Modifier
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <PhoneInput
                    label="Numéro de téléphone"
                    name="phone"
                    value={formData.phone}
                    onChange={(v) => setFormData(prev => ({ ...prev, phone: v }))}
                    disabled={!isEditing}
                    inputClassName="py-3 disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de véhicule
                  </label>
                  <select
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-600"
                  >
                    <option value="motorcycle">Moto</option>
                    <option value="car">Voiture</option>
                    <option value="bicycle">Vélo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° de plaque
                  </label>
                  <input
                    type="text"
                    name="license_plate"
                    value={formData.license_plate}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° carte d'identité
                  </label>
                  <input
                    type="text"
                    value={driver.national_id}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° permis de conduire
                  </label>
                  <input
                    type="text"
                    value={driver.driving_license}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                  >
                    {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: driver.name,
                        phone: driver.phone,
                        city: driver.city,
                        vehicle_type: driver.vehicle_type,
                        license_plate: driver.license_plate
                      });
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
