
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface DashboardOverviewProps {
  driver: any;
}

export default function DashboardOverview({ driver }: DashboardOverviewProps) {
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
      console.error('خطأ في تحميل الإحصائيات:', error);
    }
  };

  const toggleAvailability = async () => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_available: true })
        .eq('id', driver.id);

      if (error) {
        console.error('خطأ في تفعيل حالة السائق:', error);
        alert('Erreur lors de l\'activation. Vérifiez la connexion ou les permissions de la base de données.');
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error('خطأ غير متوقع في تفعيل الحالة:', error);
        alert('Une erreur inattendue s\'est produite lors de l\'activation.');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
        <p className="text-gray-600">Aperçu de vos performances du jour</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-truck-line text-2xl text-blue-600"></i>
            </div>
            <span className="text-sm text-gray-500">Aujourd'hui</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.todayDeliveries}</h3>
          <p className="text-sm text-gray-600">Livraisons terminées</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
            </div>
            <span className="text-sm text-gray-500">Aujourd'hui</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.todayEarnings.toFixed(2)} DH</h3>
          <p className="text-sm text-gray-600">Revenus</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-2xl text-orange-600"></i>
            </div>
            <span className="text-sm text-gray-500">En cours</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingDeliveries}</h3>
          <p className="text-sm text-gray-600">Livraisons actives</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-2xl text-purple-600"></i>
            </div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.completedDeliveries}</h3>
          <p className="text-sm text-gray-600">Livraisons terminées</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">
              {driver.is_available ? 'Vous êtes disponible pour livrer' : 'Vous n\'êtes pas disponible'}
            </h3>
            <p className="text-orange-100 mb-4">
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
          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
            <i className={`${driver.is_available ? 'ri-checkbox-circle-line' : 'ri-close-circle-line'} text-6xl`}></i>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
