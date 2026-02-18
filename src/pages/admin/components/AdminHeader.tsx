import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface AdminHeaderProps {
  user: any;
  onToggleSidebar: () => void;
}

export default function AdminHeader({ user, onToggleSidebar }: AdminHeaderProps) {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 min-w-0">
          {/* Left Side */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Menu"
            >
              <i className="ri-menu-line text-xl text-gray-600"></i>
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 flex-shrink-0 bg-orange-500 rounded-lg flex items-center justify-center">
                <i className="ri-admin-line text-white text-lg"></i>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">Panneau d&apos;Administration</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Gestion complète du site</p>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
            {/* Notifications - masquer sur très petit écran */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer hidden sm:flex" aria-label="Notifications">
              <i className="ri-notification-line text-xl text-gray-600"></i>
              <span className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings - masquer sur petit écran */}
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer hidden sm:block" aria-label="Paramètres">
              <i className="ri-settings-line text-xl text-gray-600"></i>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="ri-user-line text-orange-600"></i>
                </div>
                <div className="text-left hidden md:block min-w-0 max-w-[140px] sm:max-w-[200px]">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                  <p className="text-xs text-gray-500">Administrateur</p>
                </div>
                <i className="ri-arrow-down-s-line text-gray-400 flex-shrink-0"></i>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      navigate('/');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                  >
                    <i className="ri-home-line text-lg"></i>
                    Retour au Site
                  </button>
                  <button
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                  >
                    <i className="ri-user-settings-line text-lg"></i>
                    Paramètres du Compte
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-3 cursor-pointer"
                  >
                    <i className="ri-logout-box-line text-lg"></i>
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}