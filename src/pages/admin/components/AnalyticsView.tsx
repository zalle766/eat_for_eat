
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalRestaurants: number;
  monthlyRevenue: number[];
  ordersByStatus: { [key: string]: number };
  topRestaurants: { name: string; orders: number; revenue: number }[];
  userGrowth: number[];
}

export default function AnalyticsView() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRestaurants: 0,
    monthlyRevenue: [],
    ordersByStatus: {},
    topRestaurants: [],
    userGrowth: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Simuler des données d'analyse car nous n'avons pas encore de vraies données de commandes
      const mockAnalytics: AnalyticsData = {
        totalRevenue: 45678.90,
        totalOrders: 1234,
        totalUsers: 567,
        totalRestaurants: 89,
        monthlyRevenue: [12000, 15000, 18000, 22000, 25000, 28000, 32000, 35000, 38000, 42000, 45000, 48000],
        ordersByStatus: {
          'livree': 856,
          'en_preparation': 123,
          'en_livraison': 89,
          'annulee': 166
        },
        topRestaurants: [
          { name: 'Pizzeria Roma', orders: 234, revenue: 12450.00 },
          { name: 'Burger House', orders: 189, revenue: 9876.50 },
          { name: 'Sushi Tokyo', orders: 156, revenue: 8765.25 },
          { name: 'Café de Paris', orders: 134, revenue: 6543.75 },
          { name: 'Taco Loco', orders: 98, revenue: 4321.00 }
        ],
        userGrowth: [45, 52, 48, 61, 55, 67, 73, 69, 76, 82, 89, 95]
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Erreur lors du chargement des analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analyses et Rapports</h1>
          <p className="text-gray-600">Aperçu des performances de la plateforme</p>
        </div>
        <div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="week">Cette Semaine</option>
            <option value="month">Ce Mois</option>
            <option value="quarter">Ce Trimestre</option>
            <option value="year">Cette Année</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="ri-money-dollar-circle-line text-xl text-green-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenus Total</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalRevenue.toFixed(2)} dh</p>
              <p className="text-sm text-green-600">+12.5% vs mois dernier</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="ri-shopping-bag-line text-xl text-blue-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders}</p>
              <p className="text-sm text-blue-600">+8.3% vs mois dernier</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="ri-user-line text-xl text-purple-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
              <p className="text-sm text-purple-600">+15.7% vs mois dernier</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <i className="ri-restaurant-line text-xl text-orange-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Restaurants Partenaires</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalRestaurants}</p>
              <p className="text-sm text-orange-600">+5.2% vs mois dernier</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenus Mensuels</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analytics.monthlyRevenue.map((revenue, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className="bg-orange-500 rounded-t w-8"
                  style={{ height: `${(revenue / Math.max(...analytics.monthlyRevenue)) * 200}px` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {new Date(2024, index).toLocaleDateString('fr-FR', { month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Commandes par Statut</h3>
          <div className="space-y-4">
            {Object.entries(analytics.ordersByStatus).map(([status, count]) => {
              const total = Object.values(analytics.ordersByStatus).reduce((a, b) => a + b, 0);
              const percentage = (count / total) * 100;
              
              const statusColors: { [key: string]: string } = {
                'livree': 'bg-green-500',
                'en_preparation': 'bg-orange-500',
                'en_livraison': 'bg-blue-500',
                'annulee': 'bg-red-500'
              };

              const statusLabels: { [key: string]: string } = {
                'livree': 'Livrées',
                'en_preparation': 'En Préparation',
                'en_livraison': 'En Livraison',
                'annulee': 'Annulées'
              };

              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${statusColors[status]} mr-3`}></div>
                    <span className="text-sm text-gray-700">{statusLabels[status]}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className={`h-2 rounded-full ${statusColors[status]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Restaurants */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Restaurants</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Restaurant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Commandes</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Revenus</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Performance</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topRestaurants.map((restaurant, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-orange-600">#{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-900">{restaurant.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{restaurant.orders}</td>
                  <td className="py-3 px-4 text-gray-700">{restaurant.revenue.toFixed(2)} dh</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="h-2 bg-orange-500 rounded-full"
                          style={{ width: `${(restaurant.orders / analytics.topRestaurants[0].orders) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {((restaurant.orders / analytics.topRestaurants[0].orders) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Growth */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Croissance des Utilisateurs</h3>
        <div className="h-32 flex items-end justify-between space-x-1">
          {analytics.userGrowth.map((growth, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className="bg-blue-500 rounded-t w-6"
                style={{ height: `${(growth / Math.max(...analytics.userGrowth)) * 100}px` }}
              ></div>
              <span className="text-xs text-gray-500 mt-1">{index + 1}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4">Nouveaux utilisateurs par semaine (12 dernières semaines)</p>
      </div>
    </div>
  );
}
