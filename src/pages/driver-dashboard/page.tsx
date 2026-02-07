
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
      <DriverHeader driver={driver} />
      
      <div className="flex">
        <DriverSidebar currentView={currentView} setCurrentView={setCurrentView} />
        
        <main className="flex-1 mr-64 mt-16 p-8">
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
