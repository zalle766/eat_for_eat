
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import DriverHeader from './components/DriverHeader';
import DriverSidebar from './components/DriverSidebar';
import DashboardOverview from './components/DashboardOverview';
import AvailableOrders from './components/AvailableOrders';
import MyDeliveries from './components/MyDeliveries';
import DriverProfile from './components/DriverProfile';
import Earnings from './components/Earnings';

export default function DriverDashboardPage() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('overview');
  const [driver, setDriver] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    checkDriver();
  }, []);

  const checkDriver = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/driver-login', { replace: true });
        return;
      }

      const { data: driverData, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (error || !driverData) {
        navigate('/driver-login', { replace: true });
        return;
      }

      if (driverData.status !== 'approved') {
        navigate('/driver-login', { replace: true });
        return;
      }

      setDriver(driverData);
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors de la vérification du chauffeur:', error);
      navigate('/driver-login', { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverHeader driver={driver} onToggleSidebar={() => setIsSidebarOpen((o) => !o)} />
      
      <div className="flex min-w-0 w-full">
        <DriverSidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <main className="flex-1 min-w-0 mr-0 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          {currentView === 'overview' && <DashboardOverview driver={driver} />}
          {currentView === 'available-orders' && <AvailableOrders driver={driver} />}
          {currentView === 'my-deliveries' && <MyDeliveries driver={driver} />}
          {currentView === 'earnings' && <Earnings driver={driver} />}
          {currentView === 'profile' && <DriverProfile driver={driver} setDriver={setDriver} />}
        </main>
      </div>
    </div>
  );
}
