import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';

interface Order {
  id: string;
  items: any[];
  deliveryInfo: any;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  createdAt: string;
  estimatedDelivery: string;
  user_id?: string;
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUser(user);
      loadOrders(user.id);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error);
      navigate('/auth');
    }
  };

  const loadOrders = (userId: string) => {
    try {
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        // تصفية الطلبات لعرض طلبات المستخدم الحالي فقط
        const userOrders = parsedOrders.filter((order: Order) => order.user_id === userId);
        setOrders(userOrders.reverse());
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: any = {
      pending: { text: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: 'ri-time-line' },
      confirmed: { text: 'Confirmé', color: 'bg-blue-100 text-blue-700', icon: 'ri-check-line' },
      preparing: { text: 'En préparation', color: 'bg-purple-100 text-purple-700', icon: 'ri-restaurant-line' },
      on_the_way: { text: 'En route', color: 'bg-orange-100 text-orange-700', icon: 'ri-truck-line' },
      delivered: { text: 'Livré', color: 'bg-green-100 text-green-700', icon: 'ri-check-double-line' },
      cancelled: { text: 'Annulé', color: 'bg-red-100 text-red-700', icon: 'ri-close-line' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return !['delivered', 'cancelled'].includes(order.status);
    if (activeTab === 'completed') return ['delivered', 'cancelled'].includes(order.status);
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des commandes...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mes commandes</h1>
          <p className="text-gray-600">Suivez et gérez vos commandes</p>
        </div>

        {/* التبويبات */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Toutes ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Actives ({orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'completed'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Terminées ({orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length})
          </button>
        </div>

        {/* قائمة الطلبات */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <i className="ri-shopping-bag-line text-8xl text-gray-300"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-600 mb-4">Aucune commande</h2>
            <p className="text-gray-500 mb-8">
              {activeTab === 'all' && "Vous n'avez pas encore passé de commande"}
              {activeTab === 'active' && 'Aucune commande active pour le moment'}
              {activeTab === 'completed' && 'Aucune commande terminée'}
            </p>
            <button
              onClick={() => navigate('/restaurants')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Parcourir les restaurants
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* رأس الطلب */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">Commande #{order.id.split('-')[1]}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex items-center gap-1`}>
                            <i className={`${statusInfo.icon}`}></i>
                            {statusInfo.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <i className="ri-calendar-line ml-1"></i>
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-left">
                        <div className="text-2xl font-bold text-orange-600">{order.total} DH</div>
                        <p className="text-xs text-gray-500">{order.items.length} produit{order.items.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* المنتجات */}
                    <div className="border-t border-gray-100 pt-4 mb-4">
                      <div className="space-y-3">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover object-top rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{item.name}</h4>
                              <p className="text-sm text-gray-600">{item.restaurant}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-sm text-gray-500">Qté : {item.quantity}</span>
                                <span className="font-medium text-orange-600">{item.price * item.quantity} DH</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-sm text-gray-500 text-center">
                            + {order.items.length - 2} autre(s) produit(s)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* معلومات التوصيل */}
                    <div className="border-t border-gray-100 pt-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 mb-1">
                            <i className="ri-map-pin-line ml-1 text-orange-500"></i>
                            <strong>Adresse :</strong>
                          </p>
                          <p className="text-gray-700 mr-6">{order.deliveryInfo.address}, {order.deliveryInfo.city}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">
                            <i className="ri-phone-line ml-1 text-orange-500"></i>
                            <strong>Téléphone :</strong>
                          </p>
                          <p className="text-gray-700 mr-6">{order.deliveryInfo.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* الأزرار */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => navigate('/track-order', { state: { orderId: order.id } })}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                      >
                        <i className="ri-map-pin-line"></i>
                        Suivre la commande
                      </button>
                      <button
                        className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                      >
                        <i className="ri-file-list-line"></i>
                        Détails
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
