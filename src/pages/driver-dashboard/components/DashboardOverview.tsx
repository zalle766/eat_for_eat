import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

interface DashboardOverviewProps {
  driver: any;
}

export default function DashboardOverview({ driver }: DashboardOverviewProps) {
  const toast = useToast();
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0
  });

  useEffect(() => {
    loadStats();
  }, [driver]);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // جلب التوصيلات
      const { data: deliveries } = await supabase
        .from('deliveries')
        .select('*')
        .eq('driver_id', driver.id);

      if (deliveries) {
        const todayDeliveries = deliveries.filter(d => 
          new Date(d.created_at) >= today && d.status === 'delivered'
        );
        
        const todayEarnings = todayDeliveries.reduce((sum, d) => sum + (d.driver_earnings || 0), 0);
        const pending = deliveries.filter(d => d.status === 'assigned' || d.status === 'picked_up').length;
        const completed = deliveries.filter(d => d.status === 'delivered').length;

        setStats({
          todayDeliveries: todayDeliveries.length,
          todayEarnings,
          pendingDeliveries: pending,
          completedDeliveries: completed
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const toggleAvailability = async () => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_available: true })
        .eq('id', driver.id);

      if (error) {
        console.error('Erreur lors de l\'activation du statut:', error);
        toast.error('Erreur lors de l\'activation. Vérifiez la connexion ou les permissions de la base de données.');
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error('Erreur inattendue lors de l\'activation:', error);
        toast.error('Une erreur inattendue s\'est produite lors de l\'activation.');
    }
  };

  return (
    <div className="min-w-0 w-full">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
        <p className="text-sm sm:text-base text-gray-600">Aperçu de vos performances du jour</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-truck-line text-2xl text-blue-600"></i>
            </div>
            <span className="text-sm text-gray-500">Aujourd&apos;hui</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.todayDeliveries}</h3>
          <p className="text-sm text-gray-600">Livraisons terminées</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
            </div>
            <span className="text-sm text-gray-500">Aujourd&apos;hui</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 truncate">{stats.todayEarnings.toFixed(2)} DH</h3>
          <p className="text-sm text-gray-600">Revenus</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-time-line text-2xl text-orange-600"></i>
            </div>
            <span className="text-sm text-gray-500">En cours</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.pendingDeliveries}</h3>
          <p className="text-sm text-gray-600">Livraisons actives</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-checkbox-circle-line text-2xl text-purple-600"></i>
            </div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.completedDeliveries}</h3>
          <p className="text-sm text-gray-600">Livraisons terminées</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 sm:p-8 text-white mb-6 sm:mb-8 min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-2xl font-bold mb-2">
              {driver.is_available ? 'Vous êtes disponible pour livrer' : 'Vous n\'êtes pas disponible'}
            </h3>
            <p className="text-orange-100 mb-4 text-sm sm:text-base">
              {driver.is_available 
                ? 'Vous pouvez recevoir de nouvelles commandes'
                : 'Activez votre statut pour recevoir des commandes'
              }
            </p>
            {!driver.is_available && (
              <button
                onClick={toggleAvailability}
                className="bg-white text-orange-600 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Activer le statut
              </button>
            )}
          </div>
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <i className={`${driver.is_available ? 'ri-checkbox-circle-line' : 'ri-close-circle-line'} text-4xl sm:text-6xl`}></i>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 min-w-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '#available-orders'}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-shopping-bag-line text-orange-600"></i>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">Commandes disponibles</p>
              <p className="text-sm text-gray-600">Accepter une nouvelle commande</p>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '#my-deliveries'}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-truck-line text-blue-600"></i>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">Mes livraisons</p>
              <p className="text-sm text-gray-600">Voir les livraisons actives</p>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '#earnings'}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-green-600"></i>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">Revenus</p>
              <p className="text-sm text-gray-600">Voir le détail des revenus</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
