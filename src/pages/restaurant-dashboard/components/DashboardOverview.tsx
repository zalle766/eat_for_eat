
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface DashboardOverviewProps {
  restaurant: any;
}

export default function DashboardOverview({ restaurant }: DashboardOverviewProps) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalProducts: 0,
    averageRating: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [restaurant.id]);

  const loadDashboardData = async () => {
    try {
      // إحصائيات وهمية للعرض (يمكن ربطها بقاعدة البيانات لاحقاً)
      setStats({
        totalOrders: 156,
        todayOrders: 12,
        totalRevenue: 45600,
        monthlyRevenue: 12800,
        totalProducts: 24,
        averageRating: 4.5
      });

      // طلبات حديثة وهمية
      setRecentOrders([
        {
          id: '1',
          customer_name: 'أحمد محمد',
          items: 'برجر كلاسيك × 2، بطاطس مقلية',
          total: 85,
          status: 'جديد',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          customer_name: 'فاطمة علي',
          items: 'بيتزا مارجريتا، كوكا كولا',
          total: 65,
          status: 'قيد التحضير',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          customer_name: 'محمد سالم',
          items: 'سلطة قيصر، عصير برتقال',
          total: 45,
          status: 'جاهز للتوصيل',
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        }
      ]);

    } catch (error) {
      console.error('خطأ في تحميل بيانات لوحة المعلومات:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'جديد':
        return 'bg-blue-100 text-blue-800';
      case 'قيد التحضير':
        return 'bg-yellow-100 text-yellow-800';
      case 'جاهز للتوصيل':
        return 'bg-green-100 text-green-800';
      case 'تم التوصيل':
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
      {/* ترحيب */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">مرحباً بك في لوحة تحكم {restaurant.name}</h2>
        <p className="text-orange-100">إليك نظرة سريعة على أداء مطعمك اليوم</p>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
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
              <p className="text-sm font-medium text-gray-600">طلبات اليوم</p>
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
              <p className="text-sm font-medium text-gray-600">الإيرادات الشهرية</p>
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
              <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
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
              <p className="text-sm font-medium text-gray-600">عدد المنتجات</p>
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
              <p className="text-sm font-medium text-gray-600">متوسط التقييم</p>
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

      {/* الطلبات الحديثة */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">الطلبات الحديثة</h3>
            <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">
              عرض الكل
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {recentOrders.map((order: any) => (
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
                  <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* إجراءات سريعة */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors text-center">
            <i className="ri-add-circle-line text-2xl text-orange-600 mb-2"></i>
            <p className="text-sm font-medium text-orange-800">إضافة منتج جديد</p>
          </button>
          
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-center">
            <i className="ri-eye-line text-2xl text-blue-600 mb-2"></i>
            <p className="text-sm font-medium text-blue-800">عرض الطلبات</p>
          </button>
          
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors text-center">
            <i className="ri-settings-3-line text-2xl text-green-600 mb-2"></i>
            <p className="text-sm font-medium text-green-800">إعدادات المطعم</p>
          </button>
          
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors text-center">
            <i className="ri-bar-chart-line text-2xl text-purple-600 mb-2"></i>
            <p className="text-sm font-medium text-purple-800">عرض التحليلات</p>
          </button>
        </div>
      </div>
    </div>
  );
}
