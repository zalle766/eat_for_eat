
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';
import DashboardOverview from './components/DashboardOverview';
import RestaurantsManagement from './components/RestaurantsManagement';
import ProductsManagement from './components/ProductsManagement';
import OrdersManagement from './components/OrdersManagement';
import UsersManagement from './components/UsersManagement';
import DriversManagement from './components/DriversManagement';
import AnalyticsView from './components/AnalyticsView';

export default function AdminPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = () => {
    try {
      const adminSessionStr = localStorage.getItem('adminSession');
      
      if (!adminSessionStr) {
        navigate('/admin-login', { replace: true });
        return;
      }

      const adminSession = JSON.parse(adminSessionStr);
      
      if (!adminSession.isLoggedIn || !adminSession.email) {
        navigate('/admin-login', { replace: true });
        return;
      }

      setUser(adminSession);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Erreur de vérification:', error);
      navigate('/admin-login', { replace: true });
    }
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'restaurants':
        return <RestaurantsManagement />;
      case 'products':
        return <ProductsManagement />;
      case 'orders':
        return <OrdersManagement />;
      case 'users':
        return <UsersManagement />;
      case 'drivers':
        return <DriversManagement />;
      case 'analytics':
        return <AnalyticsView />;
      default:
        return <DashboardOverview />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        user={user}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex min-h-0 w-full">
        <AdminSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setIsSidebarOpen(false)}
          isOpen={isSidebarOpen}
        />

        <main className="flex-1 min-w-0 ml-0 lg:ml-64 transition-all duration-300">
          <div className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
            {renderActiveComponent()}
          </div>
        </main>
      </div>
    </div>
  );
}
