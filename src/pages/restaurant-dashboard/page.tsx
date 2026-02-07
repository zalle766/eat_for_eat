
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import RestaurantHeader from './components/RestaurantHeader';
import RestaurantSidebar from './components/RestaurantSidebar';
import DashboardOverview from './components/DashboardOverview';
import MenuManagement from './components/MenuManagement';
import OffersManagement from './components/OffersManagement';
import OrdersManagement from './components/OrdersManagement';
import RestaurantProfile from './components/RestaurantProfile';
import Analytics from './components/Analytics';
import Settings from './components/Settings';

export default function RestaurantDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkRestaurantAuth();
  }, []);

  const checkRestaurantAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // البحث عن المطعم المرتبط بهذا المستخدم باستخدام owner_id
      const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'approved')
        .single();

      if (error || !restaurantData) {
        console.error('خطأ في العثور على المطعم:', error);
        
        // التحقق من وجود مطعم في الانتظار
        const { data: pendingRestaurant } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .eq('status', 'pending')
          .single();

        if (pendingRestaurant) {
          // إذا كان المطعم في الانتظار، توجيه للصفحة الرئيسية مع رسالة
          navigate('/?message=pending');
          return;
        }

        // إذا لم يتم العثور على مطعم، توجيه لصفحة التسجيل
        navigate('/restaurant-signup');
        return;
      }

      setRestaurant(restaurantData);
    } catch (error) {
      console.error('خطأ في التحقق من صاحب المطعم:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview restaurant={restaurant} setActiveTab={setActiveTab} />;
      case 'menu':
        return <MenuManagement restaurant={restaurant} />;
      case 'offers':
        return <OffersManagement restaurant={restaurant} />;
      case 'orders':
        return <OrdersManagement restaurant={restaurant} />;
      case 'profile':
        return <RestaurantProfile restaurant={restaurant} setRestaurant={setRestaurant} />;
      case 'analytics':
        return <Analytics restaurant={restaurant} />;
      case 'settings':
        return <Settings restaurant={restaurant} setRestaurant={setRestaurant} />;
      default:
        return <DashboardOverview restaurant={restaurant} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RestaurantSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-visible">
        <RestaurantHeader restaurant={restaurant} />
        
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
