import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function RestaurantsManagement() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // إضافة status افتراضي للمطاعم التي لا تحتوي على هذا الحقل (مع الحفاظ على القيمة الموجودة في القاعدة)
      const restaurantsWithStatus = (data || []).map(restaurant => ({
        ...restaurant,
        status: restaurant.status || 'approved',
        owner_name: restaurant.owner_name || 'غير محدد',
        owner_email: restaurant.owner_email || 'غير محدد',
        owner_phone: restaurant.owner_phone || restaurant.phone || 'غير محدد'
      }));
      
      setRestaurants(restaurantsWithStatus);
    } catch (error) {
      console.error('خطأ في جلب المطاعم:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRestaurantStatus = async (restaurantId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status: newStatus })
        .eq('id', restaurantId);

      if (error) throw error;

      // إعادة جلب البيانات من القاعدة لضمان ثبات الحالة بعد التحديث/تحديث الصفحة
      await fetchRestaurants();

      const statusText = {
        approved: 'تمت الموافقة على المطعم',
        rejected: 'تم رفض المطعم',
        suspended: 'تم تعليق المطعم'
      };

      alert(statusText[newStatus as keyof typeof statusText] || 'تم تحديث حالة المطعم');
    } catch (error) {
      console.error('خطأ في تحديث حالة المطعم:', error);
      alert('حدث خطأ في تحديث حالة المطعم');
    }
  };

  const handleApprove = async (restaurantId: string) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', restaurantId);

      if (error) throw error;

      // إعادة جلب البيانات من القاعدة لضمان ثبات الحالة بعد التحديث/تحديث الصفحة
      await fetchRestaurants();

      // إرسال إشعار للمطعم (يمكن إضافة إشعار بريد إلكتروني هنا)
      alert('تم قبول المطعم بنجاح! سيتمكن المالك الآن من الوصول للوحة التحكم.');

    } catch (error) {
      console.error('خطأ في قبول المطعم:', error);
      alert('حدث خطأ أثناء قبول المطعم');
    }
  };

  const deleteRestaurant = async (restaurantId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المطعم؟ هذا الإجراء لا يمكن التراجع عنه.')) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);

      if (error) throw error;
      
      setRestaurants(prev => prev.filter((restaurant: any) => restaurant.id !== restaurantId));
      alert('تم حذف المطعم بنجاح');
    } catch (error) {
      console.error('خطأ في حذف المطعم:', error);
      alert('حدث خطأ في حذف المطعم');
    }
  };

  const filteredRestaurants = restaurants.filter((restaurant: any) => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (restaurant.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (restaurant.owner_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || restaurant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'في الانتظار', class: 'bg-yellow-100 text-yellow-800', icon: 'ri-time-line' },
      approved: { label: 'مفعل', class: 'bg-green-100 text-green-800', icon: 'ri-check-line' },
      rejected: { label: 'مرفوض', class: 'bg-red-100 text-red-800', icon: 'ri-close-line' },
      suspended: { label: 'معلق', class: 'bg-gray-100 text-gray-800', icon: 'ri-pause-line' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.approved;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.class}`}>
        <i className={config.icon}></i>
        {config.label}
      </span>
    );
  };

  const pendingCount = restaurants.filter((r: any) => r.status === 'pending').length;
  const approvedCount = restaurants.filter((r: any) => r.status === 'approved').length;
  const rejectedCount = restaurants.filter((r: any) => r.status === 'rejected').length;
  const suspendedCount = restaurants.filter((r: any) => r.status === 'suspended').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Restaurants</h1>
          <p className="text-gray-600 mt-1">Gérer et approuver les demandes de nouveaux restaurants</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2 text-yellow-800">
              <i className="ri-notification-2-line"></i>
              <span className="font-medium">{pendingCount} demande en attente</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher un restaurant, propriétaire ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-8"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente ({pendingCount})</option>
              <option value="approved">Approuvé ({approvedCount})</option>
              <option value="rejected">Rejeté ({rejectedCount})</option>
              <option value="suspended">Suspendu ({suspendedCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-restaurant-line text-blue-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Restaurants</p>
              <p className="text-xl font-bold text-gray-900">{restaurants.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-yellow-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">En Attente</p>
              <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-check-line text-green-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Approuvé</p>
              <p className="text-xl font-bold text-gray-900">{approvedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="ri-close-line text-red-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejeté</p>
              <p className="text-xl font-bold text-gray-900">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propriétaire
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type de Cuisine
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'Inscription
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRestaurants.map((restaurant: any) => (
                <tr key={restaurant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <i className="ri-restaurant-line text-orange-600"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{restaurant.name}</p>
                        <p className="text-sm text-gray-500">{restaurant.description || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {restaurant.owner_name || 'Non spécifié'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {restaurant.owner_email || 'Non spécifié'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900">{restaurant.cuisine_type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(restaurant.status)}`}>
                      <i className={getStatusIcon(restaurant.status)}></i>
                      {getStatusText(restaurant.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(restaurant.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRestaurant(restaurant)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Voir les détails"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                      {restaurant.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateRestaurantStatus(restaurant.id, 'approved')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                            title="Approuver"
                          >
                            <i className="ri-check-line"></i>
                          </button>
                          <button
                            onClick={() => updateRestaurantStatus(restaurant.id, 'rejected')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Rejeter"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </>
                      )}
                      {restaurant.status === 'approved' && (
                        <button
                          onClick={() => updateRestaurantStatus(restaurant.id, 'suspended')}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                          title="Suspendre"
                        >
                          <i className="ri-pause-line"></i>
                        </button>
                      )}
                      {restaurant.status === 'suspended' && (
                        <button
                          onClick={() => updateRestaurantStatus(restaurant.id, 'approved')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                          title="Réactiver"
                        >
                          <i className="ri-play-line"></i>
                        </button>
                      )}
                      <button
                        onClick={() => deleteRestaurant(restaurant.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRestaurants.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-restaurant-line text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">Aucun restaurant trouvé</p>
          </div>
        )}
      </div>

      {/* Restaurant Details Modal */}
      {selectedRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Détails du Restaurant</h2>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du Restaurant
                  </label>
                  <p className="text-gray-900">{selectedRestaurant.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de Cuisine
                  </label>
                  <p className="text-gray-900">{selectedRestaurant.cuisine_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du Propriétaire
                  </label>
                  <p className="text-gray-900">{selectedRestaurant.owner_name || 'Non spécifié'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email du Propriétaire
                  </label>
                  <p className="text-gray-900">{selectedRestaurant.owner_email || 'Non spécifié'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <p className="text-gray-900">{selectedRestaurant.phone || 'Non spécifié'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRestaurant.status)}`}>
                    <i className={getStatusIcon(selectedRestaurant.status)}></i>
                    {getStatusText(selectedRestaurant.status)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <p className="text-gray-900">{selectedRestaurant.address || 'Non spécifiée'}</p>
              </div>
              
              {selectedRestaurant.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900">{selectedRestaurant.description}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'Inscription
                </label>
                <p className="text-gray-900">
                  {new Date(selectedRestaurant.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            
            {selectedRestaurant.status === 'pending' && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    updateRestaurantStatus(selectedRestaurant.id, 'approved');
                    setSelectedRestaurant(null);
                  }}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                >
                  <i className="ri-check-line mr-2"></i>
                  Approuver
                </button>
                <button
                  onClick={() => {
                    updateRestaurantStatus(selectedRestaurant.id, 'rejected');
                    setSelectedRestaurant(null);
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  <i className="ri-close-line mr-2"></i>
                  Rejeter
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pending':
        return 'ri-time-line';
      case 'approved':
        return 'ri-check-line';
      case 'rejected':
        return 'ri-close-line';
      case 'suspended':
        return 'ri-pause-line';
      default:
        return 'ri-question-line';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      case 'suspended':
        return 'Suspendu';
      default:
        return 'Inconnu';
    }
  }
}
