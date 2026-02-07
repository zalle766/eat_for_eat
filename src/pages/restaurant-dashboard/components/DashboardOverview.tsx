import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import ReviewsList from '../../../components/feature/ReviewsList';

interface DashboardOverviewProps {
  restaurant: any;
  setActiveTab?: (tab: string) => void;
}

interface Order {
  id: string;
  items: Array<{ name: string; quantity: number }>;
  total: number;
  status: string;
  deliveryInfo: { name: string };
  createdAt: string;
  restaurant?: string;
}

const translateStatus = (status: string): string => {
  const map: Record<string, string> = {
    confirmed: 'Nouveau',
    pending: 'En attente',
    preparing: 'En préparation',
    ready: 'Prêt pour livraison',
    delivered: 'Livré'
  };
  return map[status] || status;
};

export default function DashboardOverview({ restaurant, setActiveTab }: DashboardOverviewProps) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalProducts: 0,
    averageRating: 0
  });
  const [recentOrders, setRecentOrders] = useState<Array<{
    id: string;
    customer_name: string;
    items: string;
    total: number;
    status: string;
    created_at: string;
  }>>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [restaurant.id]);

  useEffect(() => {
    const handleOrdersUpdate = () => loadDashboardData();
    window.addEventListener('storage', handleOrdersUpdate);
    window.addEventListener('ordersUpdated', handleOrdersUpdate);
    return () => {
      window.removeEventListener('storage', handleOrdersUpdate);
      window.removeEventListener('ordersUpdated', handleOrdersUpdate);
    };
  }, [restaurant.id]);

  const loadDashboardData = async () => {
    if (!restaurant?.id) return;
    try {
      // Charger les commandes depuis localStorage
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const restaurantOrders = savedOrders.filter((order: Order) =>
        order.items?.some((item: any) =>
          item.restaurant_id === restaurant.id
        ) || order.restaurant === restaurant.name
      );

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayOrders = restaurantOrders.filter((o: Order) =>
        new Date(o.createdAt) >= todayStart
      );
      const monthOrders = restaurantOrders.filter((o: Order) =>
        new Date(o.createdAt) >= monthStart
      );

      // Nombre de produits depuis Supabase
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('restaurant_id', restaurant.id);

      // التقييمات من قاعدة البيانات (المطعم + المنتجات، مع أسماء العملاء)
      let ratingsList: any[] = [];
      const { data: ratingsForRestaurant, error: ratingsError } = await supabase.rpc('get_ratings_for_restaurant', {
        p_restaurant_id: restaurant.id,
      });
      if (!ratingsError && Array.isArray(ratingsForRestaurant)) {
        ratingsList = ratingsForRestaurant;
      } else {
        const { data: ratingsFallback, error: fallbackError } = await supabase.rpc('get_ratings_with_names', {
          p_restaurant_id: restaurant.id,
          p_product_id: null,
        });
        if (!fallbackError && Array.isArray(ratingsFallback)) {
          ratingsList = ratingsFallback;
        } else {
          // Fallback: جلب مباشر من جدول ratings
          const { data: restaurantRatings } = await supabase
            .from('ratings')
            .select('id, user_id, restaurant_id, product_id, rating, comment, created_at')
            .eq('restaurant_id', restaurant.id);
          const { data: productIds } = await supabase
            .from('products')
            .select('id')
            .eq('restaurant_id', restaurant.id);
          const ids = (productIds || []).map((p: any) => p.id).filter(Boolean);
          let productRatings: any[] = [];
          if (ids.length > 0) {
            const { data: pr } = await supabase
              .from('ratings')
              .select('id, user_id, restaurant_id, product_id, rating, comment, created_at')
              .in('product_id', ids);
            productRatings = pr || [];
          }
          const combined = [...(restaurantRatings || []), ...productRatings];
          const unique = combined.filter((r: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === r.id) === i);
          ratingsList = unique
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((r: any) => ({ ...r, user_name: 'Client' }));
        }
      }
      const validRatings = ratingsList.filter((r: any) => r.rating != null && r.rating > 0);
      const avgRating = validRatings.length > 0
        ? validRatings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / validRatings.length
        : restaurant.rating || 0;

      setReviews(ratingsList);
      setReviewsLoading(false);
      setStats({
        totalOrders: restaurantOrders.length,
        todayOrders: todayOrders.length,
        totalRevenue: restaurantOrders.reduce((sum: number, o: Order) => sum + (o.total || 0), 0),
        monthlyRevenue: monthOrders.reduce((sum: number, o: Order) => sum + (o.total || 0), 0),
        totalProducts: products?.length || 0,
        averageRating: Math.round(avgRating * 10) / 10
      });

      // Commandes récentes (5 dernières)
      const sorted = [...restaurantOrders].sort((a: Order, b: Order) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const recent = sorted.slice(0, 5).map((order: Order) => ({
        id: order.id,
        customer_name: order.deliveryInfo?.name || 'Client',
        items: order.items?.map((i: any) => `${i.name} × ${i.quantity}`).join(', ') || '',
        total: order.total || 0,
        status: translateStatus(order.status),
        created_at: order.createdAt
      }));
      setRecentOrders(recent);

    } catch (error) {
      console.error('Erreur lors du chargement des données du tableau de bord:', error);
    } finally {
      setLoading(false);
      setReviewsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nouveau':
      case 'En attente':
        return 'bg-blue-100 text-blue-800';
      case 'En préparation':
        return 'bg-yellow-100 text-yellow-800';
      case 'Prêt pour livraison':
        return 'bg-green-100 text-green-800';
      case 'Livré':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message de bienvenue */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Bienvenue sur le tableau de bord {restaurant.name}</h2>
        <p className="text-orange-100">Voici un aperçu des performances de votre restaurant aujourd'hui</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total des commandes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-shopping-bag-3-line text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Commandes du jour</p>
              <p className="text-3xl font-bold text-gray-900">{stats.todayOrders}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-todo-line text-2xl text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus mensuels</p>
              <p className="text-3xl font-bold text-gray-900">{stats.monthlyRevenue.toLocaleString()} dh</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-2xl text-orange-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} dh</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-line-chart-line text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nombre de produits</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <i className="ri-restaurant-line text-2xl text-indigo-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Note moyenne</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-gray-900">{stats.averageRating}</p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className={`ri-star-${i < Math.floor(stats.averageRating) ? 'fill' : 'line'} text-sm`}></i>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="ri-star-line text-2xl text-yellow-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Avis et évaluations - في الأعلى لرؤية صاحب المطعم */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Avis et évaluations</h3>
              <p className="text-sm text-gray-500 mt-1">
                {reviews.length} avis • Note moyenne: {stats.averageRating.toFixed(1)}/5
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400 text-xl">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`ri-star-${i < Math.floor(stats.averageRating) ? 'fill' : 'line'}`}></i>
                ))}
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <ReviewsList reviews={reviews} loading={reviewsLoading} />
        </div>
      </div>

      {/* Commandes récentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Commandes récentes</h3>
            <button
              onClick={() => setActiveTab?.('orders')}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm cursor-pointer"
            >
              Voir tout
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <i className="ri-shopping-bag-3-line text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">Aucune commande récente</p>
                <p className="text-sm text-gray-400 mt-1">Les nouvelles commandes apparaîtront ici</p>
              </div>
            ) : (
            recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{order.customer_name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{order.items}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-gray-900">{order.total} dh</p>
                  <button
                    onClick={() => setActiveTab?.('orders')}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium cursor-pointer"
                  >
                    Voir les détails
                  </button>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => setActiveTab?.('menu')} className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors text-center cursor-pointer">
            <i className="ri-add-circle-line text-2xl text-orange-600 mb-2"></i>
            <p className="text-sm font-medium text-orange-800">Ajouter un produit</p>
          </button>
          
          <button onClick={() => setActiveTab?.('orders')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-center cursor-pointer">
            <i className="ri-eye-line text-2xl text-blue-600 mb-2"></i>
            <p className="text-sm font-medium text-blue-800">Voir les commandes</p>
          </button>
          
          <button onClick={() => setActiveTab?.('settings')} className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors text-center cursor-pointer">
            <i className="ri-settings-3-line text-2xl text-green-600 mb-2"></i>
            <p className="text-sm font-medium text-green-800">Paramètres du restaurant</p>
          </button>
          
          <button onClick={() => setActiveTab?.('analytics')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors text-center cursor-pointer">
            <i className="ri-bar-chart-line text-2xl text-purple-600 mb-2"></i>
            <p className="text-sm font-medium text-purple-800">Voir les analyses</p>
          </button>
        </div>
      </div>
    </div>
  );
}
