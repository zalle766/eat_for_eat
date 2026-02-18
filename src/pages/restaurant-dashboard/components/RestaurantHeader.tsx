
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface RestaurantHeaderProps {
  restaurant: any;
  onToggleSidebar?: () => void;
}

export default function RestaurantHeader({ restaurant, onToggleSidebar }: RestaurantHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Menu"
              >
                <i className="ri-menu-line text-xl text-gray-600"></i>
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-bold text-gray-900 truncate">Tableau de bord restaurant</h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Gestion complète de votre restaurant</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* إشعارات — إخفاء على شاشات صغيرة جداً */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex" aria-label="Notifications">
              <i className="ri-notification-3-line text-xl"></i>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* معلومات المطعم */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-[140px] sm:max-w-none">
              <img
                src={restaurant.image || restaurant.image_url || 'https://readdy.ai/api/search-image?query=modern%20restaurant%20interior%20with%20warm%20lighting%20and%20elegant%20dining%20tables%2C%20professional%20food%20photography%20style%2C%20clean%20and%20inviting%20atmosphere&width=40&height=40&seq=restaurant-avatar&orientation=squarish'}
                alt={restaurant.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="text-right min-w-0 hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 truncate">{restaurant.name}</p>
                <p className="text-xs text-gray-500 truncate">{restaurant.cuisine_type}</p>
              </div>
            </div>

            {/* Menu utilisateur */}
            <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-more-2-line text-xl"></i>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100] min-w-[12rem]">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/');
                  }}
                  className="w-full text-right px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-home-line"></i>
                  Retour au site
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    handleLogout();
                  }}
                  className="w-full text-right px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-logout-circle-line"></i>
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
