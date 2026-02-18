import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    activeDrivers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentRestaurants, setRecentRestaurants] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // جلب إحصائيات المطاعم
      const { count: restaurantsCount } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true });

      // جلب إحصائيات المستخدمين
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // جلب إحصائيات السائقين
      const { count: driversCount } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true });

      // جلب المطاعم الحديثة
      const { data: recentRestaurantsData } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalRestaurants: restaurantsCount || 0,
        totalUsers: usersCount || 0,
        totalOrders: 156,
        totalRevenue: 45230,
        pendingApprovals: 8,
        activeDrivers: driversCount || 0
      });

      setRecentRestaurants(recentRestaurantsData || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Restaurants',
      value: stats.totalRestaurants,
      icon: 'ri-restaurant-line',
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Total Utilisateurs',
      value: stats.totalUsers,
      icon: 'ri-user-line',
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Commandes du Jour',
      value: stats.totalOrders,
      icon: 'ri-file-list-line',
      color: 'bg-orange-500',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Revenus Mensuels',
      value: `${stats.totalRevenue.toLocaleString()} DH`,
      icon: 'ri-money-dollar-circle-line',
      color: 'bg-purple-500',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'En Attente',
      value: stats.pendingApprovals,
      icon: 'ri-time-line',
      color: 'bg-yellow-500',
      change: '-5%',
      changeType: 'negative'
    },
    {
      title: 'Livreurs Actifs',
      value: stats.activeDrivers,
      icon: 'ri-truck-line',
      color: 'bg-teal-500',
      change: '+3%',
      changeType: 'positive'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Page Header - empilé sur mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Vue d&apos;ensemble des performances de la plateforme</p>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex-shrink-0">
          Actualiser les Données
        </button>
      </div>

      {/* Stats Cards - grille responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-2 truncate">{card.value}</p>
                <div className="flex items-center mt-2 flex-wrap gap-x-2">
                  <span className={`text-sm font-medium ${
                    card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change}
                  </span>
                  <span className="text-sm text-gray-500">du mois dernier</span>
                </div>
              </div>
              <div className={`w-12 h-12 flex-shrink-0 ${card.color} rounded-lg flex items-center justify-center`}>
                <i className={`${card.icon} text-white text-xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Dernières Commandes</h3>
            <button className="text-orange-600 hover:text-orange-700 text-sm font-medium cursor-pointer">
              Voir Tout
            </button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((order) => (
              <div key={order} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <i className="ri-shopping-bag-line text-orange-600"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Commande #{1000 + order}</p>
                    <p className="text-sm text-gray-500">Restaurant La Mer Blanche</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">45.50 DH</p>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Terminé
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Restaurants */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Nouveaux Restaurants</h3>
            <button className="text-orange-600 hover:text-orange-700 text-sm font-medium cursor-pointer">
              Voir Tout
            </button>
          </div>
          <div className="space-y-4">
            {recentRestaurants.slice(0, 4).map((restaurant: any) => (
              <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="ri-restaurant-line text-blue-600"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{restaurant.name}</p>
                    <p className="text-sm text-gray-500">{restaurant.cuisine_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    restaurant.status === 'approved' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {restaurant.status === 'approved' ? 'Actif' : 'En Attente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <i className="ri-add-line text-2xl text-orange-600 mb-2"></i>
            <p className="text-sm font-medium text-gray-900">Ajouter Restaurant</p>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <i className="ri-user-add-line text-2xl text-blue-600 mb-2"></i>
            <p className="text-sm font-medium text-gray-900">Ajouter Utilisateur</p>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <i className="ri-file-download-line text-2xl text-green-600 mb-2"></i>
            <p className="text-sm font-medium text-gray-900">Exporter Rapports</p>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <i className="ri-settings-line text-2xl text-purple-600 mb-2"></i>
            <p className="text-sm font-medium text-gray-900">Paramètres Système</p>
          </button>
        </div>
      </div>
    </div>
  );
}