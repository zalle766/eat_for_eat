
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  created_at: string;
  items: OrderItem[];
  users?: {
    full_name: string;
    email: string;
  };
  restaurants?: {
    name: string;
  };
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export default function OrdersManagement() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      // Simuler des données de commandes car nous n'avons pas encore de table orders
      const mockOrders: Order[] = [
        {
          id: '1',
          user_id: 'user1',
          restaurant_id: 'rest1',
          total_amount: 125.50,
          status: 'en_preparation',
          delivery_address: '123 Rue de la Paix, Paris',
          created_at: new Date().toISOString(),
          items: [
            { id: '1', product_name: 'Pizza Margherita', quantity: 2, price: 45.00 },
            { id: '2', product_name: 'Salade César', quantity: 1, price: 35.50 }
          ],
          users: { full_name: 'Jean Dupont', email: 'jean@email.com' },
          restaurants: { name: 'Pizzeria Roma' }
        },
        {
          id: '2',
          user_id: 'user2',
          restaurant_id: 'rest2',
          total_amount: 89.00,
          status: 'livree',
          delivery_address: '456 Avenue des Champs, Lyon',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          items: [
            { id: '3', product_name: 'Burger Deluxe', quantity: 1, price: 65.00 },
            { id: '4', product_name: 'Frites', quantity: 1, price: 24.00 }
          ],
          users: { full_name: 'Marie Martin', email: 'marie@email.com' },
          restaurants: { name: 'Burger House' }
        },
        {
          id: '3',
          user_id: 'user3',
          restaurant_id: 'rest3',
          total_amount: 156.75,
          status: 'en_livraison',
          delivery_address: '789 Boulevard Saint-Germain, Marseille',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          items: [
            { id: '5', product_name: 'Sushi Mix', quantity: 1, price: 95.00 },
            { id: '6', product_name: 'Soupe Miso', quantity: 2, price: 30.75 }
          ],
          users: { full_name: 'Pierre Dubois', email: 'pierre@email.com' },
          restaurants: { name: 'Sushi Tokyo' }
        }
      ];

      setOrders(mockOrders);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Simuler la mise à jour du statut
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmee':
        return 'bg-blue-100 text-blue-800';
      case 'en_preparation':
        return 'bg-orange-100 text-orange-800';
      case 'en_livraison':
        return 'bg-purple-100 text-purple-800';
      case 'livree':
        return 'bg-green-100 text-green-800';
      case 'annulee':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'En Attente';
      case 'confirmee':
        return 'Confirmée';
      case 'en_preparation':
        return 'En Préparation';
      case 'en_livraison':
        return 'En Livraison';
      case 'livree':
        return 'Livrée';
      case 'annulee':
        return 'Annulée';
      default:
        return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.users?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.restaurants?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const todayOrders = orders.filter(order => 
    new Date(order.created_at).toDateString() === new Date().toDateString()
  ).length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
        <p className="text-sm sm:text-base text-gray-600">Gérer et suivre toutes les commandes</p>
      </div>

      {/* Stats Cards - grille responsive, pas de débordement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <i className="ri-shopping-bag-line text-xl text-blue-600"></i>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600">Total Commandes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <i className="ri-calendar-line text-xl text-green-600"></i>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600">Commandes Aujourd&apos;hui</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{todayOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-0 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
              <i className="ri-money-dollar-circle-line text-xl text-yellow-600"></i>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600">Revenus Total</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{totalRevenue.toFixed(2)} dh</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher par client, restaurant ou ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En Attente</option>
              <option value="confirmee">Confirmée</option>
              <option value="en_preparation">En Préparation</option>
              <option value="en_livraison">En Livraison</option>
              <option value="livree">Livrée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table - défilement horizontal sur mobile */}
      <div className="bg-white rounded-lg shadow overflow-hidden min-w-0 w-full">
        <div className="overflow-x-auto">
          <table className="min-w-[640px] sm:min-w-full divide-y divide-gray-200 w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.users?.full_name || 'Non spécifié'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.users?.email || 'Non spécifié'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.restaurants?.name || 'Non spécifié'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.total_amount.toFixed(2)} dh
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Voir détails
                    </button>
                    {order.status !== 'livree' && order.status !== 'annulee' && (
                      <select
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      >
                        <option value="en_attente">En Attente</option>
                        <option value="confirmee">Confirmée</option>
                        <option value="en_preparation">En Préparation</option>
                        <option value="en_livraison">En Livraison</option>
                        <option value="livree">Livrée</option>
                        <option value="annulee">Annulée</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-shopping-bag-line text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande trouvée</h3>
            <p className="text-gray-500">Aucune commande ne correspond à vos critères de recherche.</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails de la Commande #{selectedOrder.id}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations Client</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><strong>Nom:</strong> {selectedOrder.users?.full_name}</p>
                    <p><strong>Email:</strong> {selectedOrder.users?.email}</p>
                    <p><strong>Adresse de livraison:</strong> {selectedOrder.delivery_address}</p>
                  </div>
                </div>

                {/* Restaurant Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Restaurant</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><strong>Nom:</strong> {selectedOrder.restaurants?.name}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Articles Commandés</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{(item.price * item.quantity).toFixed(2)} dh</p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-300">
                      <p className="text-lg font-bold">Total:</p>
                      <p className="text-lg font-bold text-orange-600">{selectedOrder.total_amount.toFixed(2)} dh</p>
                    </div>
                  </div>
                </div>

                {/* Order Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Statut de la Commande</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                    <p className="text-sm text-gray-600 mt-2">
                      Commandé le: {new Date(selectedOrder.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
