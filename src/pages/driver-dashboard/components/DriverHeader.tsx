import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

interface DriverHeaderProps {
  driver: any;
  onToggleSidebar?: () => void;
}

export default function DriverHeader({ driver, onToggleSidebar }: DriverHeaderProps) {
  const toast = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.REACT_APP_NAVIGATE('/driver-login');
  };

  const toggleAvailability = async () => {
    try {
      const newStatus = !driver.is_available;
      const { error } = await supabase
        .from('drivers')
        .update({ is_available: newStatus })
        .eq('id', driver.id);

      if (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        toast.error('Erreur lors de la mise à jour. Vérifiez la connexion ou les permissions de la base de données.');
        return;
      }

      // تحديث الحالة محلياً بدون إعادة تحميل كاملة
      driver.is_available = newStatus;
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
        toast.error('Une erreur inattendue s\'est produite lors de la mise à jour.');
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 bg-white border-b border-gray-200 z-50">
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-truck-line text-lg sm:text-xl text-white"></i>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">Tableau de bord livreur</h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Bonjour, {driver.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
            {/* Menu mobile — ouvrir la sidebar */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Menu"
              >
                <i className="ri-menu-line text-xl text-gray-600"></i>
              </button>
            )}

            {/* Availability Toggle */}
            <button
              onClick={toggleAvailability}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                driver.is_available
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${driver.is_available ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="hidden sm:inline">{driver.is_available ? 'Disponible' : 'Indisponible'}</span>
            </button>

            {/* Rating — masquer sur très petit écran */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
              <i className="ri-star-fill text-yellow-500"></i>
              <span className="font-semibold text-gray-900 text-sm">{driver.rating?.toFixed?.(1) ?? '0'}</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
              title="Déconnexion"
            >
              <i className="ri-logout-box-line text-lg"></i>
              <span className="hidden sm:inline whitespace-nowrap">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
